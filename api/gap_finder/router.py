import httpx
from typing import Optional, List, Tuple, Any, Dict, Set
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query, Request
from collections import defaultdict, Counter
import itertools

# ⬇️ Asegúrate de tener este prompt en tu proyecto (como ya lo tienes)
from ai import GetGapFilterPrompt

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
    # fases finas (las dejamos pasar y luego las usamos para PhaseCritical)
    if "pre" in low and "flight" in low: return "Pre-flight"
    if "post" in low and "flight" in low: return "Post-flight"
    if ("in" in low and "flight" in low) or ("in-flight" in low): return "In-flight"
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

def _parent_tissue_name(t: Optional[str]) -> Optional[str]:
    """Normaliza tejido a una forma 'parent' para reducir redundancia (singular/plural, guiones, lower)."""
    if not t:
        return None
    s = t.strip().lower()
    s = s.replace("glands- both sides", "gland")
    s = s.replace("both sides", "")
    s = s.replace("-", " ").replace("_", " ").replace("  ", " ")
    # quitar plural simple (heurístico)
    if s.endswith("s") and not s.endswith("ss"):
        s = s[:-1]
    s = s.strip()
    # capitalización sencilla tipo título
    return " ".join(w.capitalize() for w in s.split())

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

def _coarse_condition(c: Optional[str]) -> Optional[str]:
    """Colapsa a Spaceflight vs Ground/Analog (usada para scope y señales generales)."""
    if not c:
        return None
    lc = c.lower()
    if ("space" in lc and "flight" in lc) or ("pre-flight" in lc) or ("post-flight" in lc) or ("in-flight" in lc):
        return "Spaceflight"
    if ("ground" in lc) or ("analog" in lc) or ("vivarium" in lc) or ("control" in lc):
        return "Ground/Analog"
    return None

# ----------------- capa NL → filtros (IA) -----------------

def _nl_to_filters(request: Request, user_input: Optional[str]):
    """
    Usa GetGapFilterPrompt para transformar q (texto libre) en:
    organisms: List[str] | None
    assays: List[str] | None
    condition: str | None   ("Spaceflight" | "Ground/Analog" | "Ambas" | None)
    tissues: List[str] | None
    """
    prompt = GetGapFilterPrompt(user_input or "")
    # IMPORTANTE: asumo que tienes el provider cargado en app.state.provider (igual que en tu assay finder).
    response_text, _ = request.app.state.provider.prompt(
        model="gpt-3.5-turbo",
        prompt_system=prompt.get_prompt_system(),
        messages_json=[],
        user_input=prompt.get_user_prompt(),
        parameters_json=prompt.get_parameters(),
    )
    if not response_text:
        raise HTTPException(status_code=500, detail="No se obtuvo respuesta de la IA.")

    import json
    try:
        r = json.loads(response_text)
    except Exception:
        start = response_text.find("{"); end = response_text.rfind("}")
        if start == -1 or end == -1:
            raise HTTPException(status_code=500, detail="No se pudo parsear JSON de la IA.")
        r = json.loads(response_text[start:end+1])

    def as_list(x):
        if not x: return None
        return x if isinstance(x, list) else [str(x)]

    organisms = as_list(r.get("organisms"))
    assays     = as_list(r.get("assays"))
    tissues    = as_list(r.get("tissues"))
    condition  = r.get("condition") or "Ambas"  # default amigable

    return organisms, assays, condition, tissues

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

# ----------------- /gaps/search (GET: ahora SOLO q) -----------------

@router.get("/gaps/search")
async def gaps_search(
    request: Request,
    q: Optional[str] = Query(None, description="Consulta libre; la IA la convierte a organisms/assays/condition/tissues"),
    min_datasets_for_covered: int = Query(1, ge=1, description="Umbral datasets para covered"),
    top_n: int = Query(20, ge=1, le=100, description="Número de gaps destacados (rankeados) a devolver"),
):
    """
    Igual que tu endpoint actual, pero la UI solo manda `q`.
    Por dentro, se mapea con IA a organisms/assays/condition/tissues y se reusa tu lógica tal cual.
    """
    # ⬇️ 1) IA → filtros
    organisms, assays, condition, tissues = _nl_to_filters(request, q)

    # 2) Construir params para /v2/query/assays/ (igual que tu flujo)
    params: List[Tuple[str, str]] = []
    _add(params, "format", DEFAULT_FORMAT)

    # Filtros
    if organisms:
        # OR con '|'
        _add(params, "study.characteristics.organism", "|".join(organisms))
    if assays:
        _add(params, "investigation.study assays.study assay technology type", "|".join(assays))
    if condition in {"Spaceflight", "Ground/Analog"}:
        # regex robusta
        if condition == "Spaceflight":
            _add(params, "study.factor value.spaceflight", "/space.*flight|pre.*flight|post.*flight|in[- ]?flight/i")
        else:
            _add(params, "study.factor value.spaceflight", "/ground|analog|vivarium|control/i")
    else:
        # “Ambas”: exigimos que esté anotado
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
        return {"applied_url": applied_url, "highlights": [], "gaps_total": 0, "gaps": []}

    # 3) Normalizar y construir observados (sin tocar tu lógica)
    observed = []
    tissues_observed: Set[Optional[str]] = set()
    assay_freq_global = Counter()

    for row in rows:
        organism = _norm_str(row.get("study.characteristics.organism"))
        assay_type = _norm_str(row.get("investigation.study assays.study assay technology type"))
        cond_norm = _norm_condition(row.get("study.factor value.spaceflight")) or "Unknown"
        cond_coarse = _coarse_condition(cond_norm) or ("Spaceflight" if "flight" in cond_norm.lower() else "Ground/Analog")
        tissue_raw = _pick_tissue(row)
        tissue = tissue_raw
        if tissue:
            tissues_observed.add(tissue)
        accession = _norm_str(row.get("id.accession"))
        assay_name = _norm_str(row.get("id.assay name"))

        if organism and assay_type and accession:
            observed.append((organism, tissue, cond_norm, assay_type, accession, assay_name, cond_coarse))
            assay_freq_global[assay_type] += 1

    # Filtrar por condición si procede (ya filtramos arriba, pero por si entran variantes)
    if condition in {"Spaceflight", "Ground/Analog"}:
        observed = [t for t in observed if t[6] == condition]

    # 4) Alcance (universo) basado en selección y observados (igual que tenías)
    organisms_scope = set(organisms) if organisms else {t[0] for t in observed}
    assays_scope = set(assays) if assays else {t[3] for t in observed}
    if tissues is not None:
        tissues_scope: Set[Optional[str]] = set(tissues)
    else:
        tissues_scope = tissues_observed or {None}
    conditions_scope = (
        {condition} if condition in {"Spaceflight", "Ground/Analog"} else {t[6] for t in observed}
    )

    # 5) Coverage: nº de datasets por combinación fina y coarse
    coverage_counter: Dict[Tuple[str, Optional[str], str, str], Set[str]] = defaultdict(set)
    coverage_counter_coarse: Dict[Tuple[str, Optional[str], str, str], Set[str]] = defaultdict(set)

    # índices para señales
    ds_any_by_combo_coarse: Dict[Tuple[str, Optional[str], str], Set[str]] = defaultdict(set)
    assays_present_by_combo_coarse: Dict[Tuple[str, Optional[str], str], Set[str]] = defaultdict(set)
    phases_by_org_tissue: Dict[Tuple[str, Optional[str]], Set[str]] = defaultdict(set)
    species_assay_presence: Dict[Tuple[str, Optional[str], str, str], Set[str]] = defaultdict(set)  # (tissue_parent,cond,assay)->species

    for org, tis, cond_norm, assay_type, acc, _an, cond_coarse in observed:
        tissue_parent = _parent_tissue_name(tis)
        coverage_counter[(org, tis, cond_norm, assay_type)].add(acc)
        coverage_counter_coarse[(org, tissue_parent, cond_coarse, assay_type)].add(acc)
        ds_any_by_combo_coarse[(org, tissue_parent, cond_coarse)].add(acc)
        assays_present_by_combo_coarse[(org, tissue_parent, cond_coarse)].add(assay_type)
        phases_by_org_tissue[(org, tissue_parent)].add(cond_norm)
        species_assay_presence[(tissue_parent, cond_coarse, assay_type)].add(org)

    # 6) Construir coverage_rows y covered_keys
    coverage_rows = []
    covered_keys_coarse: Set[Tuple[str, Optional[str], str, str]] = set()
    for (org, tissue_parent, cond_coarse, assay_type), accs in coverage_counter_coarse.items():
        if (
            org in organisms_scope
            and assay_type in assays_scope
            and cond_coarse in conditions_scope
            and (tissue_parent in {_parent_tissue_name(t) for t in tissues_scope} or (tissue_parent is None and None in tissues_scope))
        ):
            n_ds = len(accs)
            status = "covered" if n_ds >= min_datasets_for_covered else "weak"
            coverage_rows.append({
                "organism": org,
                "tissue": tissue_parent,
                "condition": cond_coarse,
                "assay_type": assay_type,
                "datasets": n_ds,
                "status": status,
                "example_dataset_link": _build_dataset_html_link(next(iter(accs)) if accs else None),
            })
            if n_ds >= 1:
                covered_keys_coarse.add((org, tissue_parent, cond_coarse, assay_type))

    # 7) Gaps (cartesiano) — EXACTO como lo llevabas
    tissues_scope_parent = {_parent_tissue_name(t) for t in tissues_scope}
    universe = list(itertools.product(
        sorted(organisms_scope),
        sorted(tissues_scope_parent, key=lambda x: "" if x is None else x),
        sorted(conditions_scope),
        sorted(assays_scope),
    ))
    gaps = []
    for org, tis_parent, cond, assay in universe:
        if (org, tis_parent, cond, assay) not in covered_keys_coarse:
            gaps.append({
                "organism": org,
                "tissue": tis_parent,
                "condition": cond,
                "assay_type": assay,
            })

    # 8) Scoring + reasons (sin tocarlo)
    def _ground_base_signal(org: str, tis_parent: Optional[str], assay_type: str, cond: str) -> float:
        if cond != "Spaceflight":
            return 0.0
        ds_g = len(ds_any_by_combo_coarse.get((org, tis_parent, "Ground/Analog"), set()))
        cap = 3
        return min(ds_g, cap) / cap if ds_g > 0 else 0.0

    def _multiomics_signal(org: str, tis_parent: Optional[str], assay_type: str, cond: str) -> float:
        present = assays_present_by_combo_coarse.get((org, tis_parent, cond), set())
        if not present:
            return 0.0
        if assay_type.lower().startswith("proteom") and any("rna" in a.lower() for a in present):
            return 1.0
        if "rna" in assay_type.lower() and any("proteom" in a.lower() for a in present):
            return 1.0
        if len(present) >= 1:
            return 0.5
        return 0.0

    def _phase_signal(org: str, tis_parent: Optional[str], cond: str) -> float:
        phases = { (p or "").lower() for p in phases_by_org_tissue.get((org, tis_parent), set()) }
        has_pre  = any("pre"  in p and "flight" in p for p in phases)
        has_in   = any(("in-flight" in p) or ("in" in p and "flight" in p) for p in phases)
        has_post = any("post" in p and "flight" in p for p in phases)
        if cond != "Spaceflight":
            return 0.0
        if not has_in and (has_pre or has_post):
            return 1.0
        if has_in and (not has_pre or not has_post):
            return 0.5
        return 0.0

    def _xspecies_signal(org: str, tis_parent: Optional[str], assay_type: str, cond: str) -> float:
        species_set = species_assay_presence.get((tis_parent, cond, assay_type), set())
        if not species_set:
            return 0.0
        others = {s for s in species_set if s != org}
        if not others:
            return 0.0
        lower_others = {o.lower() for o in others}
        if ("mus musculus" in lower_others and org.lower() == "homo sapiens") or \
           ("homo sapiens" in lower_others and org.lower() == "mus musculus"):
            return 1.0
        return 0.5

    def _neighbor_density_signal(tis_parent: Optional[str], cond: str) -> float:
        seen: Set[str] = set()
        for (org_k, tis_k, cond_k), accs in ds_any_by_combo_coarse.items():
            if tis_k == tis_parent and cond_k == cond:
                seen |= accs
        total = len(seen)
        cap = 5
        return min(total, cap) / cap

    def _feasibility_signal(assay_type: str) -> float:
        if not assay_freq_global:
            return 0.0
        mx = max(assay_freq_global.values())
        if mx == 0:
            return 0.0
        return assay_freq_global[assay_type] / mx

    similar_group_counts = Counter((g["tissue"], g["condition"], g["assay_type"]) for g in gaps)
    def _redundancy_penalty(tis_parent: Optional[str], cond: str, assay_type: str) -> float:
        cnt = similar_group_counts[(tis_parent, cond, assay_type)]
        if cnt <= 1:
            return 0.0
        cap = 4
        return min(cnt-1, cap) / cap

    W_GROUND   = 1.8
    W_MULTI    = 1.5
    W_PHASE    = 1.2
    W_XSPECIES = 1.0
    W_NEIGHBOR = 0.8
    W_FEAS     = 0.6
    W_REDUND   = 0.7  # se resta

    highlights = []
    for g in gaps:
        org  = g["organism"]
        tis  = g["tissue"]
        cond = g["condition"]
        assay_type = g["assay_type"]

        s_ground   = _ground_base_signal(org, tis, assay_type, cond)
        s_multi    = _multiomics_signal(org, tis, assay_type, cond)
        s_phase    = _phase_signal(org, tis, cond)
        s_xspecies = _xspecies_signal(org, tis, assay_type, cond)
        s_neighbor = _neighbor_density_signal(tis, cond)
        s_feas     = _feasibility_signal(assay_type)
        s_redund   = _redundancy_penalty(tis, cond, assay_type)

        score = (W_GROUND*s_ground +
                 W_MULTI*s_multi +
                 W_PHASE*s_phase +
                 W_XSPECIES*s_xspecies +
                 W_NEIGHBOR*s_neighbor +
                 W_FEAS*s_feas -
                 W_REDUND*s_redund)

        reasons_detail = []
        if s_ground >= 0.6:
            ds_g = len(ds_any_by_combo_coarse.get((org, tis, "Ground/Analog"), set()))
            examples = list(ds_any_by_combo_coarse.get((org, tis, "Ground/Analog"), set()))[:3]
            reasons_detail.append({
                "type": "GroundBase",
                "value": round(s_ground, 2),
                "evidence": {
                    "ds_ground": ds_g,
                    "ground_examples": [ _build_dataset_html_link(e) for e in examples ]
                },
                "text": f"Fuerte base en tierra: {ds_g} dataset(s) Ground/Analog ya existen en {org}/{tis}."
            })
        if s_multi >= 0.6:
            present = list(assays_present_by_combo_coarse.get((org, tis, cond), set()))
            reasons_detail.append({
                "type": "MultiOmics",
                "value": round(s_multi, 2),
                "evidence": {
                    "present_layers": present,
                    "missing_layer": assay_type
                },
                "text": f"Completa multi-ómics: hay {', '.join(present) or 'otras capas'}; falta {assay_type}."
            })
        if s_phase >= 0.6:
            phases = list(phases_by_org_tissue.get((org, tis), set()))
            reasons_detail.append({
                "type": "PhaseCritical",
                "value": round(s_phase, 2),
                "evidence": {
                    "present_phases": phases
                },
                "text": "Fase crítica sin datos: falta 'In-flight' o está incompleta respecto a Pre/Post."
            })
        if s_xspecies >= 0.6:
            others = list(species_assay_presence.get((tis, cond, assay_type), set()))
            reasons_detail.append({
                "type": "SpeciesTranslation",
                "value": round(s_xspecies, 2),
                "evidence": {
                    "covered_species": others
                },
                "text": f"Translación: cubierta en {', '.join(others)}; falta en {org}."
            })
        if s_neighbor >= 0.6:
            reasons_detail.append({
                "type": "NeighborDensity",
                "value": round(s_neighbor, 2),
                "text": f"Alta actividad cercana en {tis}/{cond}."
            })
        if s_feas >= 0.7:
            reasons_detail.append({
                "type": "Feasibility",
                "value": round(s_feas, 2),
                "text": f"Alta factibilidad: {assay_type} es frecuente en el scope."
            })

        contributions = [
            ("GroundBase", W_GROUND*s_ground),
            ("MultiOmics", W_MULTI*s_multi),
            ("PhaseCritical", W_PHASE*s_phase),
            ("SpeciesTranslation", W_XSPECIES*s_xspecies),
            ("NeighborDensity", W_NEIGHBOR*s_neighbor),
            ("Feasibility", W_FEAS*s_feas),
        ]
        main_reason_type, _ = max(contributions, key=lambda kv: kv[1])
        MAIN_TEXT = {
            "GroundBase": "Fuerte base en tierra y falta en vuelo.",
            "MultiOmics": "Completar paquete multi-ómics.",
            "PhaseCritical": "Falta fase crítica de vuelo.",
            "SpeciesTranslation": "Oportunidad de translación entre especies.",
            "NeighborDensity": "Alta actividad alrededor; buena base logística.",
            "Feasibility": "Assay estándar y factible.",
        }
        reason = MAIN_TEXT.get(main_reason_type, "Oportunidad prioritaria.")

        highlights.append({
            "organism": org,
            "tissue": tis,
            "condition": cond,
            "assay_type": assay_type,
            "score": round(score, 2),
            "reason": reason,
            "reasons_detail": reasons_detail,
        })

    # 9) Ordenar y devolver
    highlights.sort(key=lambda h: h["score"], reverse=True)
    highlights_top = highlights[:top_n] if top_n else highlights

    coverage_rows.sort(key=lambda r: (r["organism"] or "", r["tissue"] or "", r["condition"] or "", r["assay_type"] or ""))
    gaps.sort(key=lambda r: (r["organism"] or "", r["tissue"] or "", r["condition"] or "", r["assay_type"] or ""))

    return {
        "applied_url": applied_url,
        "highlights": highlights_top,
        "gaps_total": len(gaps),
        "gaps": gaps,
    }
