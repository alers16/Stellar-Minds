import httpx
from typing import Optional, List, Tuple, Any, Dict
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query, Request
import logging
from ..ai import GetFilterPrompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

ASSAYS_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/assays/"
META_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/"
DATASET_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset"
DEFAULT_FORMAT = "json.records"




@router.get("/assays/search")
async def search_assays(
    request: Request,
    q: Optional[str] = Query(None, description="User input in natural language"),
    group_by_technology: bool = Query(True, description="Group results by technology"),
    limit_per_tech: int = Query(3, ge=1, le=50, description="Max assays per technology group"),
    exclude_na: bool = Query(True, description="Hide 'Not Applicable' conditions in groups")
):
    logger.info("Searching assays with parameters: %s", locals())
    logger.info(f"OpenAI API Key: {os.getenv('OPENAI_API_KEY')} router")
    # 1) NL -> filtros
    params = _get_filter_from_natural_language(request, q)

    # 2) Fetch OSDR
    osdr_query_params = _build_params(**params)
    data = await _fetch_assays(osdr_query_params)

    logger.info("Fetched OSDR data: %s", data)

    async with httpx.AsyncClient() as c:
        applied_url = str(c.build_request("GET", ASSAYS_BASE, params=osdr_query_params).url)

    # 3) Simplifica filas crudas
    simplified: List[Dict[str, Any]] = []
    for row in data:
        ds = row.get("id.accession")
        an = row.get("id.assay name")
        simplified.append({
            "dataset": ds,
            "assay_name": an,
            "organism": row.get("study.characteristics.organism"),
            "spaceflight_condition": row.get("study.factor value.spaceflight"),
            "assay_technology": _normalize_tech_label(row.get("investigation.study assays.study assay technology type")),
            "link": _build_assay_html_link(ds, an),
            "dataset_link": _build_dataset_html_link(ds),
        })

    # 4) Dedup por (dataset, assay)
    cards = _dedup_cards(simplified)

    if not group_by_technology:
        return {"applied_url": applied_url, "count": len(cards), "cards": cards}

    # 5) Agrupa por tecnología y recorta a top-K por grupo
    groups = _group_by_technology(cards, limit_per_tech=limit_per_tech, exclude_na=exclude_na)

    return groups

# ----------------- AI -----------------

def _get_filter_from_natural_language(request: Request, user_input) -> Dict[str, Optional[str]]:
    logger.info("estoy aqui 1")
    prompt = GetFilterPrompt(user_input)
    logger.info("estoy aqui 2")
    response_text, _ = request.app.state.provider.prompt(
        model="gpt-3.5-turbo",
        prompt_system=prompt.get_prompt_system(),
        messages_json="",
        user_input=prompt.get_user_prompt(),
        parameters_json=prompt.get_parameters()
    )
    logger.info("estoy aqui 3")
    if not response_text:
        raise HTTPException(status_code=500, detail="No se obtuvo respuesta de la IA.")

    import json
    logger.info("estoy aqui 4")
    try:
        response = json.loads(response_text)
        logger.info("estoy aqui 5")
    except Exception:
        logger.info("estoy aqui 6")
        start = response_text.find("{"); end = response_text.rfind("}")
        if start == -1 or end == -1:
            raise HTTPException(status_code=500, detail="No se pudo parsear JSON de la respuesta.")
        response = json.loads(response_text[start:end+1])

    return {
        "organism": response.get("organism") or "",
        "condition": response.get("condition") or "",
        "assay_regex": response.get("assay") or "",
        "technology_regex": response.get("technology") or "",
        "dataset": response.get("dataset") or "",
    }

# ----------------- Group helpers (simple) -----------------

def _normalize_tech_label(t: Optional[str]) -> str:
    if not t:
        return "Other / Unspecified"
    t = t.strip()
    # normalizaciones típicas
    aliases = {
        "RNA Sequencing (RNA-Seq)": "RNA Sequencing",
        "DNA microarray": "DNA microarray",
        "Nanopore long read DNA Sequencing": "Nanopore long read DNA Sequencing",
        "Atomic Force Microscopy": "Atomic Force Microscopy",
        "Proteomics": "Proteomics",
        "Imaging": "Imaging",
    }
    # Si está exactamente, devuelve el canon; si no, deja el string original.
    return aliases.get(t, t)

def _dedup_cards(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Dedup por (dataset, assay_name) y calcula flags Flight/Ground.
    """
    seen = {}
    for r in rows:
        key = (r["dataset"], r["assay_name"])
        if key not in seen:
            seen[key] = {
                "dataset": r["dataset"],
                "assay_name": r["assay_name"],
                "organism": r.get("organism"),
                "assay_technology": r.get("assay_technology"),
                "conditions": set(),
                "link": r.get("link"),
                "dataset_link": r.get("dataset_link"),
            }
        cond = r.get("spaceflight_condition")
        if cond:
            seen[key]["conditions"].add(cond)

        # Completar primeros no-nulos
        if not seen[key]["organism"] and r.get("organism"):
            seen[key]["organism"] = r["organism"]
        if not seen[key]["assay_technology"] and r.get("assay_technology"):
            seen[key]["assay_technology"] = r["assay_technology"]
        if not seen[key]["link"] and r.get("link"):
            seen[key]["link"] = r["link"]
        if not seen[key]["dataset_link"] and r.get("dataset_link"):
            seen[key]["dataset_link"] = r["dataset_link"]

    cards = []
    for v in seen.values():
        conds = sorted(v["conditions"]) if v["conditions"] else []
        v["conditions"] = conds
        v["has_flight"] = any(("flight" in c.lower() and "space" in c.lower()) or c.lower().startswith("space") for c in conds)
        v["has_ground"] = any("ground" in c.lower() for c in conds)
        v["has_both_flight_ground"] = v["has_flight"] and v["has_ground"]
        cards.append(v)

    # Orden estable
    cards.sort(key=lambda x: (x.get("assay_technology") or "", x.get("dataset") or "", x.get("assay_name") or ""))
    return cards

def _group_by_technology(cards: List[Dict[str, Any]], limit_per_tech: int = 3, exclude_na: bool = True) -> List[Dict[str, Any]]:
    """
    Agrupa por tecnología y recorta a top-K por grupo.
    El orden dentro de cada grupo prioriza comparabilidad (Flight & Ground > Flight > Ground > resto).
    """
    # bucket por tecnología
    buckets: Dict[str, List[Dict[str, Any]]] = {}
    for c in cards:
        tech = c.get("assay_technology") or "Other / Unspecified"
        buckets.setdefault(tech, []).append(c)

    # score de utilidad
    def score(c):
        if c.get("has_both_flight_ground"): return (0, c.get("dataset") or "", c.get("assay_name") or "")
        if c.get("has_flight"): return (1, c.get("dataset") or "", c.get("assay_name") or "")
        if c.get("has_ground"): return (2, c.get("dataset") or "", c.get("assay_name") or "")
        return (3, c.get("dataset") or "", c.get("assay_name") or "")

    groups = []
    for tech, items in buckets.items():
        items_sorted = sorted(items, key=score)

        # (opcional) oculta N/A en condiciones mostradas (no afecta flags)
        if exclude_na:
            for it in items_sorted:
                it["conditions"] = [x for x in it["conditions"] if "not applicable" not in x.lower()]

        # recorte a top-K
        items_view = items_sorted[:limit_per_tech] if limit_per_tech else items_sorted

        groups.append({
            "technology": tech,
            "count": len(items_sorted),      # total en ese grupo (sin recorte)
            "assays": items_view             # lista recortada para UI
        })

    # orden de grupos: por “interés” + nombre
    tech_priority = {
        "RNA Sequencing": 0,
        "DNA microarray": 1,
        "Proteomics": 2,
        "Imaging": 3,
        "Nanopore long read DNA Sequencing": 4,
        "Atomic Force Microscopy": 5,
        "Other / Unspecified": 9
    }
    def tech_order(g):
        return (tech_priority.get(g["technology"], 6), g["technology"])

    groups.sort(key=tech_order)
    return groups

# ----------------- helpers -----------------

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

def _add(params: List[Tuple[str, str]], key: str, value: str = ""):
    params.append((key, value))

def _add_presence(params: List[Tuple[str, str]], field: str):
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

    # Campos de salida útiles
    _add(params, "study.characteristics.organism")
    _add(params, "study.factor value.spaceflight")
    _add(params, "investigation.study assays.study assay technology type")

    return params

async def _fetch_assays(params: List[Tuple[str, str]]) -> Any:
    try:
        logger.info("Fetching assays with params: %s", params)
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            logger.info("Requesting OSDR: %s", ASSAYS_BASE)
            r = await client.get(ASSAYS_BASE, params=params)
            logger.info("OSDR response status: %s", r.status_code)
            if r.status_code >= 400:
                raise HTTPException(status_code=r.status_code, detail=f"OSDR error: {r.text}")
            return r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching assays: %s", e)
        raise HTTPException(status_code=502, detail=f"Error consultando OSDR: {e}")
