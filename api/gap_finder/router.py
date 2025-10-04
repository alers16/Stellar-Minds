import httpx
from typing import Optional, List, Tuple, Any, Dict, Set
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query
from collections import defaultdict
import itertools

router = APIRouter()

ASSAYS_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/assays/"
META_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/"
DATASET_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset"
DEFAULT_FORMAT = "json.records"

# ----------------- helpers comunes (mismo estilo) -----------------

def _add(params: List[Tuple[str, str]], key: str, value: str = ""):
    params.append((key, value))

def _add_presence(params: List[Tuple[str, str]], field: str):
    # En OSDR la “presencia” se expresa como &=field (campo anotado y no nulo)
    params.append((f"={field}", ""))

async def _fetch_json_records(base: str, params: List[Tuple[str, str]]) -> List[Dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.get(base, params=params)
            if r.status_code >= 400:
                raise HTTPException(status_code=r.status_code, detail=f"OSDR error: {r.text}")
            data = r.json()
            if not isinstance(data, list):
                raise HTTPException(status_code=502, detail="Respuesta OSDR no es json.records (lista).")
            return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error consultando OSDR: {e}")

def _norm_str(x: Optional[str]) -> Optional[str]:
    if x is None:
        return None
    s = str(x).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    return s

def _norm_condition(v: Optional[str]) -> Optional[str]:
    v = _norm_str(v)
    if not v:
        return None
    low = v.lower()
    if "space" in low and "flight" in low:
        return "Spaceflight"
    if "ground" in low or "analog" in low:
        return "Ground/Analog"
    return v

TISSUE_KEYS = [
    "study.characteristics.organism part",
    "study.characteristics.tissue",
    "study.characteristics.organ",
    "study.characteristics.cell type",
    "study.characteristics.material type",
]

def _pick_tissue(row: Dict[str, Any]) -> Optional[str]:
    for k in TISSUE_KEYS:
        if k in row:
            v = _norm_str(row.get(k))
            if v:
                return v
    # Por si el API devuelve claves con %20 en vez de espacio
    for k in [kk.replace(" ", "%20") for kk in TISSUE_KEYS]:
        if k in row:
            v = _norm_str(row.get(k))
            if v:
                return v
    return None

def _build_assay_html_link(dataset: Optional[str], assay_name: Optional[str]) -> Optional[str]:
    if not dataset or not assay_name:
        return None
    an = quote(assay_name, safe="")
    return (
        f"{META_BASE}?id.accession={dataset}"
        f"&id.assay%20name={an}"
        "&study.characteristics"
        "&study.factor%20value"
        "&assay.parameter%20value"
        "&file.data%20type"
        "&format=html"
    )

def _build_dataset_html_link(dataset: Optional[str]) -> Optional[str]:
    if not dataset:
        return None
    return f"{DATASET_BASE}/{dataset}/?format=html"

# ----------------- /gaps/options -----------------

@router.get("/gaps/options")
async def gaps_options():
    """
    Devuelve listas únicas observadas para poblar la UI (organisms, assays, conditions, tissues).
    """
    params: List[Tuple[str, str]] = []
    _add(params, "format", DEFAULT_FORMAT)
    # Selectores (inclusiones en salida)
    _add(params, "investigation.study assays.study assay technology type")
    _add_presence(params, "study.characteristics.organism")
    _add_presence(params, "study.factor value.spaceflight")
    # Traemos todo el branch de characteristics para rascar tejido
    _add(params, "study.characteristics")

    rows = await _fetch_json_records(ASSAYS_BASE, params)

    organisms: Set[str] = set()
    conds: Set[str] = set()
    assays: Set[str] = set()
    tissues: Set[str] = set()

    for row in rows:
        org = _norm_str(row.get("study.characteristics.organism"))
        if org:
            organisms.add(org)

        cond = _norm_condition(row.get("study.factor value.spaceflight"))
        if cond:
            conds.add(cond)

        tech = _norm_str(row.get("investigation.study assays.study assay technology type"))
        if tech:
            assays.add(tech)

        tis = _pick_tissue(row)
        if tis:
            tissues.add(tis)

    # Orden amable para condiciones
    conds_sorted = [c for c in ["Spaceflight", "Ground/Analog"] if c in conds] + sorted(
        [c for c in conds if c not in {"Spaceflight", "Ground/Analog"}]
    )

    return {
        "organisms": sorted(organisms),
        "assays": sorted(assays),
        "conditions": conds_sorted or ["Spaceflight", "Ground/Analog"],
        "tissues": sorted(tissues),
    }

# ----------------- /gaps/search (GET) -----------------

@router.get("/gaps/search")
async def gaps_search(
    organisms: Optional[List[str]] = Query(None, description="Filtro multi-select de organismo"),
    assays: Optional[List[str]] = Query(None, description="Filtro multi-select de assay/omics (technology type)"),
    condition: str = Query("Ambas", description="Spaceflight | Ground/Analog | Ambas"),
    tissues: Optional[List[str]] = Query(None, description="Filtro multi-select de tejido (opcional)"),
    min_datasets_for_covered: int = Query(1, ge=1, description="Umbral datasets para covered"),
):
    """
    Devuelve coverage + gaps para el scope dado por los filtros.
    """
    # 1) Construir params para /v2/query/assays/ (assay-grouped)
    params: List[Tuple[str, str]] = []
    _add(params, "format", DEFAULT_FORMAT)

    # Filtros
    if organisms:
        # OR con '|'
        _add(params, "study.characteristics.organism", "|".join(organisms))
    if assays:
        _add(params, "investigation.study assays.study assay technology type", "|".join(assays))
    if condition in {"Spaceflight", "Ground/Analog"}:
        # Mejor acotar vía regex para robustez contra valores variantes
        if condition == "Spaceflight":
            _add(params, "study.factor value.spaceflight", "/space.*flight/i")
        else:
            _add(params, "study.factor value.spaceflight", "/ground|analog/i")
    else:
        # “Ambas”: sólo exigimos que esté anotado (no null) si queremos asegurar comparabilidad
        _add_presence(params, "study.factor value.spaceflight")

    # Selectores de salida
    _add(params, "id.accession")
    _add(params, "id.assay name")
    _add(params, "investigation.study assays.study assay technology type")
    _add(params, "study.characteristics.organism")
    _add(params, "study.factor value.spaceflight")
    _add(params, "study.characteristics")  # para intentar capturar tissue

    # Ejecutar
    rows = await _fetch_json_records(ASSAYS_BASE, params)

    # Para devolver la URL aplicada (debug/visibilidad)
    async with httpx.AsyncClient() as c:
        applied_url = str(c.build_request("GET", ASSAYS_BASE, params=params).url)

    if not rows:
        return {"applied_url": applied_url, "coverage": [], "gaps": []}

    # 2) Normalizar y construir observados
    observed = []  # (organism, tissue, condition, assay_type, accession, assay_name)
    tissues_observed: Set[Optional[str]] = set()
    for row in rows:
        organism = _norm_str(row.get("study.characteristics.organism"))
        assay_type = _norm_str(row.get("investigation.study assays.study assay technology type"))
        cond = _norm_condition(row.get("study.factor value.spaceflight")) or "Desconocido"
        tissue = _pick_tissue(row)
        if tissue:
            tissues_observed.add(tissue)
        accession = _norm_str(row.get("id.accession"))
        assay_name = _norm_str(row.get("id.assay name"))

        if organism and assay_type and accession:
            observed.append((organism, tissue, cond, assay_type, accession, assay_name))

    # Filtrar por condición si procede (ya filtramos arriba, pero por si entran variantes)
    if condition in {"Spaceflight", "Ground/Analog"}:
        observed = [t for t in observed if t[2] == condition]

    # 3) Alcance (universo) basado en selección y observados
    organisms_scope = set(organisms) if organisms else {t[0] for t in observed}
    assays_scope = set(assays) if assays else {t[3] for t in observed}
    if tissues is not None:
        tissues_scope: Set[Optional[str]] = set(tissues)
    else:
        tissues_scope = tissues_observed or {None}
    conditions_scope = (
        {condition} if condition in {"Spaceflight", "Ground/Analog"} else {t[2] for t in observed}
    )

    # 4) Coverage: nº de datasets por combinación
    coverage_counter: Dict[Tuple[str, Optional[str], str, str], Set[str]] = defaultdict(set)
    for org, tis, cond, assay_type, acc, _an in observed:
        coverage_counter[(org, tis, cond, assay_type)].add(acc)

    coverage_rows = []
    for (org, tis, cond, assay_type), accs in coverage_counter.items():
        if (
            org in organisms_scope
            and assay_type in assays_scope
            and cond in conditions_scope
            and (tis in tissues_scope or (tis is None and None in tissues_scope))
        ):
            n_ds = len(accs)
            status = "covered" if n_ds >= min_datasets_for_covered else "weak"
            coverage_rows.append({
                "organism": org,
                "tissue": tis,
                "condition": cond,
                "assay_type": assay_type,
                "datasets": n_ds,
                "status": status,
                # enlaces útiles (primero que encontremos)
                "example_dataset_link": _build_dataset_html_link(next(iter(accs)) if accs else None),
            })

    # 5) Gaps = producto cartesiano del scope – coverage observada
    universe = list(itertools.product(
        sorted(organisms_scope),
        sorted(tissues_scope, key=lambda x: "" if x is None else x),
        sorted(conditions_scope),
        sorted(assays_scope),
    ))
    covered_keys = {(c["organism"], c["tissue"], c["condition"], c["assay_type"]) for c in coverage_rows}

    gaps = []
    for org, tis, cond, assay in universe:
        if (org, tis, cond, assay) not in covered_keys:
            gaps.append({
                "organism": org,
                "tissue": tis,
                "condition": cond,
                "assay_type": assay,
            })

    # Orden estable para UI
    coverage_rows.sort(key=lambda r: (r["organism"] or "", r["tissue"] or "", r["condition"] or "", r["assay_type"] or ""))
    gaps.sort(key=lambda r: (r["organism"] or "", r["tissue"] or "", r["condition"] or "", r["assay_type"] or ""))

    return {

        "gaps": gaps,
    }
