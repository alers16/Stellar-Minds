from typing import Optional, List, Tuple, Any, Dict
from urllib.parse import quote
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

ASSAYS_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/assays/"
META_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/"
DATASET_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset"
DEFAULT_FORMAT = "json.records"

@router.get("/assays/search")
async def search_assays(
    organism: Optional[str] = Query(None, description="Regex p.ej. 'Mus musculus'"),
    condition: Optional[str] = Query(None, description="'spaceflight' | 'ground' | 'any'"),
    assay: Optional[str] = Query(None, description="Regex p.ej. 'rna-sequencing|dna-microarray'"),
    technology: Optional[str] = Query(None, description="Regex tecnología p.ej. 'RNA Sequencing'"),
    dataset: Optional[str] = Query(None, description="Accession exacto p.ej. 'OSD-47'"),
):
    params = _build_params(organism, condition, assay, technology, dataset)
    data = await _fetch_assays(params)

    async with httpx.AsyncClient() as c:
        applied_url = str(c.build_request("GET", ASSAYS_BASE, params=params).url)

    simplified: List[Dict[str, Any]] = []
    for row in data:
        ds = row.get("id.accession")
        an = row.get("id.assay name")
        simplified.append({
            "dataset": ds,
            "assay_name": an,
            "organism": row.get("study.characteristics.organism"),
            "spaceflight_condition": row.get("study.factor value.spaceflight"),
            "assay_technology": row.get("investigation.study assays.study assay technology type"),
            # enlace directo a la tabla HTML del assay (muestras de ese assay)
            "link": _build_assay_html_link(ds, an),
            # si quieres, puedes añadir también la ficha del dataset:
            "dataset_link": _build_dataset_html_link(ds),
        })

    return {"applied_url": applied_url, "simplified": simplified}

# ----------------- helpers -----------------

def _build_assay_html_link(dataset: Optional[str], assay_name: Optional[str]) -> Optional[str]:
    """
    Devuelve el enlace HTML a la tabla de muestras del assay (NASA OSDR),
    filtrado por dataset + assay_name. Listo para abrir en el navegador.
    """
    if not dataset or not assay_name:
        return None
    an = quote(assay_name, safe="")  # urlencode completo del assay name
    # Incluimos secciones útiles para que la tabla sea informativa.
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
    """Enlace a la ficha HTML del dataset (opcional)."""
    if not dataset:
        return None
    return f"{DATASET_BASE}/{dataset}/?format=html"

def _add(params: List[Tuple[str, str]], key: str, value: str = ""):
    """Si value == '', el campo se incluye en salida (no filtra)."""
    params.append((key, value))

def _add_presence(params: List[Tuple[str, str]], field: str):
    """Campo presente (no NaN): clave vacía con valor = nombre del campo."""
    params.append(("", field))

def _build_params(
    organism: Optional[str],
    condition: Optional[str],
    assay_regex: Optional[str],
    technology_regex: Optional[str],
    dataset: Optional[str],
) -> List[Tuple[str, str]]:

    params: List[Tuple[str, str]] = []
    _add(params, "format", DEFAULT_FORMAT)

    # --- Filtros robustos ---
    if dataset:
        _add(params, "id.accession", dataset)
    if organism:
        _add(params, "study.characteristics.organism", f"/{organism}/i")
    if assay_regex:
        _add(params, "id.assay name", f"/{assay_regex}/i")
    if technology_regex:
        _add(params, "investigation.study assays.study assay technology type", f"/{technology_regex}/i")
    if condition:
        c = condition.strip().lower()
        if c in {"spaceflight", "flight"}:
            _add(params, "study.factor value.spaceflight", "/flight/i")
        elif c in {"ground", "ground control", "control"}:
            _add(params, "study.factor value.spaceflight", "/ground/i")
        elif c in {"any", "present"}:
            _add_presence(params, "study.factor value.spaceflight")

    # --- Campos útiles en la salida (sin filtrar) ---
    _add(params, "study.characteristics.organism")
    _add(params, "study.factor value.spaceflight")
    _add(params, "investigation.study assays.study assay technology type")

    return params

async def _fetch_assays(params: List[Tuple[str, str]]) -> Any:
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            r = await client.get(ASSAYS_BASE, params=params)
            if r.status_code >= 400:
                raise HTTPException(status_code=r.status_code, detail=f"OSDR error: {r.text}")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error consultando OSDR: {e}")
