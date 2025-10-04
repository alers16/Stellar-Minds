import os
import httpx

from typing import Optional, List, Tuple, Any, Dict
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

from .providers import OpenAIProvider
from .prompts import GetFilterPrompt

load_dotenv()

router = APIRouter()
provider = OpenAIProvider(api_key=os.getenv("OPENAI_API_KEY"))

ASSAYS_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/assays/"
META_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/"
DATASET_BASE = "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset"
DEFAULT_FORMAT = "json.records"

@router.get("/assays/search")
async def search_assays(
    q: Optional[str] = Query(None, description="User input in natural language")
):
    print("Query:", q)
    params = _get_filter_from_natural_language(q)
    print("Derived params:", params)

    osdr_query_params = _build_params(**params)
    data = await _fetch_assays(osdr_query_params)

    async with httpx.AsyncClient() as c:
        applied_url = str(c.build_request("GET", ASSAYS_BASE, params=osdr_query_params).url)

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
            
            "link": _build_assay_html_link(ds, an), # enlace directo a la tabla HTML del assay (muestras de ese assay)
            "dataset_link": _build_dataset_html_link(ds), # si quieres, puedes añadir también la ficha del dataset:
        })

    return {"applied_url": applied_url, "simplified": simplified}

# ----------------- AI -----------------

def _get_filter_from_natural_language(user_input) -> Dict[str, Optional[str]]:
    prompt = GetFilterPrompt(user_input)

    response_text, _ = provider.prompt(
        model="gpt-3.5-turbo",
        prompt_system=prompt.get_prompt_system(),
        messages_json=[],
        user_input=prompt.get_user_prompt(),
        parameters_json=prompt.get_parameters(),
    )

    if not response_text:
        raise HTTPException(status_code=500, detail="No se obtuvo respuesta de la IA.")

    try:
        response_json = GetFilterPrompt.extract_json_from_code_block(response_text)
        if not response_json:
            raise HTTPException(status_code=500, detail="No se pudo extraer JSON de la respuesta.")

        response = GetFilterPrompt.try_json_loads(response_text)
        if not response:
            raise HTTPException(status_code=500, detail="No se pudo parsear JSON de la respuesta.")

        return {
            "organism": response.get("organism", ""),
            "condition": response.get("condition", ""),
            "assay_regex": response.get("assay", ""),
            "technology_regex": response.get("technology", ""),
            "dataset": response.get("dataset", ""),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando respuesta AI: {e}")

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
