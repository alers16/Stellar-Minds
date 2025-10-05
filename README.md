# Stellar-Minds 🚀🧠

> A NASA Space Apps ecosystem that combines an intelligent backend based on GraphRAG with an immersive frontend (nasa-space-biology) to discover, converse with, and act on knowledge in space biology.

## 📡 What is Stellar-Minds
Stellar-Minds was born as a response to a recurring challenge in the scientific community: extracting meaning from decades of dispersed space biology experiments in NASA’s Open Science Data Repository (OSDR). Our project creates a cognitive platform that acts as a scientific copilot — it understands natural language questions, identifies research gaps, generates graph-backed responses, and provides a visual interface showing how findings interconnect.

The technical core lies in api/, a FastAPI backend that orchestrates AI providers, NASA connectors, and a GraphRAG chatbot. The user experience lives in nasa-space-biology/, a Next.js 15 frontend animated with interactive graphics and Radix/Tailwind components that allow navigation through results, chat initiation, and visualization of the knowledge graph.

## 🧭 End-to-End Experience
1. **Visual Exploration**. The nasa-space-biology site displays an animated hero with particles and a graph canvas introducing the universe of concepts (microgravity, radiation, tissues, flight phases).
2. **Guided Discovery**. The “Advanced Research Capabilities” module summarizes what the engine offers: LLM-driven insights, graph-based navigation, an integrated database, and real-time analysis.
3. **Conversational Interaction**. The visitor enters /chat, where the ChatInterface component opens a session with the backend, maintains in-memory history, suggests questions, and reflects live latency.
4. **Specialized Search**. Through /assay-finder and future panels, the frontend calls GET /api/v1/assays/search to translate questions like “microgravity experiments on mice” into valid OSDR filters.
5. **Gap detection**. The gap finder module exposes missing organism/tissue/condition combinations, helping plan new scientific missions.

Each interaction is backed by consistent JSON responses that serve the frontend, scientific notebooks, or third-party integrations alike.

## 🖥️ nasa-space-biology: Immersive Frontend
- **Main framework**: Next.js 15 with React 19 and TypeScript (nasa-space-biology/app).
- **Style and UI:**: Tailwind CSS v4, Shadcn UI variations (Radix + tailwind-merge + class-variance-authority), and custom animations (animate-pulse-glow).
- **Key components**:
  - `Hero: generative`: particle canvas scene, corpus statistics, and CTAs to chat and graph.
  - `KnowledgeGraph`: canvas simulation showing dynamic nodes (microgravity, radiation, plant growth) orbiting around “Space Biology.”
  - `ChatInterface`: copilot-style chat experience (Dora AI-like) that creates chats on demand, manages errors, and maintains conversations with intelligent scrolling.
  - `SpaceBackground`: animated nebula layer for the chat area (components/space-background.tsx).
- **Data context**: APIContext.tsx centralizes HTTP calls with Axios, supports multiple endpoints (chat, assays, wikis, etc.), and allows backend configuration via NEXT_PUBLIC_BACKEND_URL.
- **Graph Explorer**: /graph route prepared for integration with react-force-graph, three.js, and 3D GraphRAG community renders.
- **Controlled access**: CTA section highlights access for authorized personnel with buttons to request credentials or contact the team.

> ✨ Result: a portal that not only informs but inspires exploration — bridging scientists, investors, and mission architects.

## ⚙️ Backend API (FastAPI + GraphRAG)
- **`api/app.py`**: launches the app, configures CORS with the Vercel domain (vercel-app-frontend-tawny.vercel.app), and injects ChatService and OpenAIProvider in the lifespan.
- **Conversational Chat** (`api/graphbot/`):
  - `GraphRAGBot sends queries to run_local_search, run_global_search, or run_drift_search (GraphRAG CLI) and operates in threads (asyncio.to_thread) to avoid blocking the async loop.
  - `ChatService` creates and manages chat histories in MemoryStore (concurrency protected by threading.RLock).
  - Exceptions like ChatBusyError return 409 Conflict, ensuring consistent frontend UX.
- **Assay Finder** (`api/assay_finder/router.py`):
  - `GetFilterPrompt` converts free text into JSON filters (organism, condition, assay/technology regex, dataset).
  - Uses `httpx.AsyncClient` to query OSDR (`visualization.osdr.nasa.gov`).
  - Deduplicates results, calculates `has_flight`/`has_ground flags, and generates HTML dataset links.
- **Gap Finder** (`api/gap_finder/router.py`):
  - Normalizes tissues, conditions, and data presence to identify untested experimental areas.
  - Returns unique lists to populate UI components (selectors and advanced filters).
- **AI Provider** (`api/ai/providers/openai_provider.py`):
  - Wraps calls to `gpt-3.5-turbo`, `gpt-4`, and `gpt-4o` with custom formatters (`OpenAIFormatter`).
  - Exposes `get_active_models` for dynamic UI rendering in the frontend.

## 🔄 Intelligence Flow
1. User launches a query from the web or REST API.
2. FastAPI creates context with OpenAI keys (OPENAI_API_KEY) and GraphRAG path (APP_BACK_GRAPHRAG_ROOT).
3. Specialized prompts (`GetFilterPrompt`, `GetGapFilterPrompt`) produce reproducible filters.
4. GraphRAG or NASA APIs provide raw content.
5. Data is enriched (conditions, links, flight flags) and returned to the frontend.
6. The frontend renders chat, cards, charts, or 3D visualizations as needed.

## 💡 Innovation that Adds Value
- **Semantic→Structured translation** 🧬: researchers write as they speak; the system responds with precise filters ready for scientific pipelines.
- **Graph + narrative** 🌐: GraphRAG builds narratives supported by knowledge graphs, enabling citation of contexts and relationships.
- **Visual-first** 🎨: nasa-space-biology uses animated canvases, live data, and interactive graphs to keep the audience immersed.
- **Hybrid orchestration** 🤝: combines NASA public APIs, proprietary infrastructure, and external AI services with an extensible design (future open-source LLMs, persistent databases, additional dashboards).
- **Gap discovery** 🕳️: the gap finder prioritizes missions by showing which (organism, tissue, condition) combinations remain unexplored.

## 🧪  Detailed Use Cases
- **Experiment planning**: select sequencing technologies with flight history and comparable conditions for new ISS missions.
- **Rapid literature review**: GraphRAG chat summarizes findings and links to related datasets without leaving the browser.
- **Coverage auditing**: gap finder reflects missing ground-control data, guiding agencies and universities.
- **Scientific onboarding**: new researchers explore the graph, read cards, and receive conversational guides in English or Spanish.
- **Executive presentations**: stylized UI communicates value to non-technical stakeholders with clear metrics and visuals.

## 6. System Features
The Stellar Mind AI project is designed to deliver an accessible, visual, and intelligent scientific exploration experience. Its modular architecture allows different user profiles — from researchers to mission architects — to interact with the same knowledge base from different perspectives, adapting functionalities to their specific needs.

### General Features
These tools form the common core of the application and are shared by all users.
- **Natural language chatbot**: a virtual assistant powered by LLMs that answers questions, summarizes studies, identifies research links, and suggests relevant sources. Through graph integration, responses reflect conceptual and contextual relations, offering deeper scientific understanding than standard text search.
- **Interactive knowledge graph visualization**: web module representing concepts, entities, and relationships extracted from NASA’s 608 biological documents. The React-based interface allows navigation, filtering, and discovery of emerging connections among experiments, results, and organisms.

### Role-specific Features
To maximize impact and usability, Stellar Mind AI provides three sets of tools tailored to key profiles in the scientific and technological ecosystem of space exploration.

#### Researcher – “Assay Finder”
The Assay Finder module provides easy and quick access to experimental data. It allows users to search experiments, methodologies, results, or mission conditions without knowing NASA API structures. The system interprets complex queries, locates relevant experiments, and provides structured summaries with assay types, key findings, microgravity conditions, studied organisms, and main conclusions — accelerating literature review and hypothesis generation.

#### Investor – “Investment Radar” and “Gap Finder”
A set designed for users focused on strategic research and innovation management.
- **Investment Radar** identifies emerging areas and research trends in space bioscience through analysis of co-occurrences, temporal evolution of concepts, and publication density. It helps detect high-potential scientific or technological fields, supporting investment and resource allocation decisions.
- **Gap Finder** analyzes graph relations to detect knowledge gaps, unstudied variable combinations, or missing experimental results. It offers proactive recommendations for future research lines, promoting innovation and interdisciplinary collaboration.
  
#### Mission Architect – “Risk Lens”
Module designed to support safe and efficient mission planning. From natural language queries, it identifies biological or experimental risks related to radiation, microgravity, isolation, or environmental stress. Using graph-based inferences, Stellar Mind AI links previous studies with relevant risk factors, helping anticipate problems and design informed countermeasures — directly contributing to the safety and sustainability of future lunar and Martian missions.

Together, these functionalities make Stellar Mind AI a versatile, interactive, and scientifically robust platform that integrates the power of artificial intelligence with the exploration of space biological knowledge — aligning with NASA’s vision of open, collaborative, and future-oriented science.

## 7. Results and Demonstration
The Stellar Mind AI project, developed by the Stellar Minds team, culminates in a functional web application combining a GraphRAG-processed knowledge base, an intelligent chatbot, and an interactive knowledge graph visualization. The results demonstrate the system’s ability to integrate complex information, generate useful answers, and offer an intuitive visual exploration of space biology data.

### General Interface and Knowledge Visualization
Public access URL: https://vercel-app-frontend-tawny.vercel.app
The main interface presents a dynamic dashboard where the user can switch between conversational chat and graph visualization modes.
- Conversational chat: natural language interaction with the knowledge base.
- Graph visualization: exploration of nodes, relationships, and information clusters.
  
![Landing page of Stellar Mind AI](images/landing_page.png)

![NASA's Graph Visualization](images/graph.png)

### Example Chat Queries and Responses
Public access: https://vercel-app-frontend-tawny.vercel.app/chat
The chatbot demonstrates its inference capability using the graph, offering grounded responses and references to original studies.
![Stellar Mind AI Chatbot Answer](images/chatbot.png)
These responses go beyond literal extraction — they combine information from multiple documents and reason about scientific relationships in the graph.

###Use Cases by User Profile

Investigador – Assay Finder
Link: https://vercel-app-frontend-tawny.vercel.app/assay-finder
![Assay Finder Module Working](images/assay_finder.png)

Inverstor – Gap Finder
Link: https://vercel-app-frontend-tawny.vercel.app/gap-finder
![Invertor Gap Finder Working](images/gap_finder.png)

Mission Architect – Mission Planner
Link: https://vercel-app-frontend-tawny.vercel.app/mission-planner
![Mission Planner Working](images/mission%20planner.png)

### Qualitative Evaluation of Performance and Utility
During internal testing, Stellar Mind AI showed high semantic coherence and contextual relevance in its generated responses. The system fluently handled complex queries and integrated results from multiple documents, demonstrating the effectiveness of the GraphRAG approach for representing scientific knowledge. The graph visualization identifies dense research areas and knowledge gaps, adding value for scientists and innovation managers.

From the user’s perspective, key strengths include:
- Ease of use: natural interaction with no technical expertise required.
- Interpretability: relationships and sources are transparently visualized.
- Versatility: the tool adapts to various roles and use cases.

The results confirm that Stellar Mind AI is an innovative, practical, and scalable solution for transforming space biology knowledge into an accessible, comprehensible, and useful information network for the scientific and technological community.

## 🛠️ Technical Setup
### 1. Prerequisites
- Python 3.10+
- Node.js 20+ y npm/pnpm
- OpenAI key (`OPENAI_API_KEY`)
- Prepared GraphRAG data (APP_BACK_GRAPHRAG_ROOT pointing to the knowledge repository)

### 2. Backend (`api/`)
```bash
cd api
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Suggested variables (api/.env):
```env
OPENAI_API_KEY="sk-..."
APP_BACK_STORE=memory
APP_BACK_CHATBOT=graphrag
APP_BACK_GRAPHRAG_ROOT=/ruta/a/graphrag
```

### 3. Frontend (`nasa-space-biology/`)
```bash
cd nasa-space-biology
npm install   # o pnpm install
npm run dev   # Levanta en http://localhost:3000
```
.env.local variables:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_GRAPH_BASE=http://localhost:8000/api/v1
```
> Tip: APIContext supports external domains, so just change the variables to point to staging or production environments.

### 4. Recommended Manual Tests
- Visit `http://localhost:3000 and explore the animated landing page.
- Open `/chat`, send questions, and observe response streaming (default method `local`).
- Access `GET /api/v1/assays/search?q=spaceflight+mouse` via browser or Postman.
- Check the graph at `/graph` and future gap analysis panels.

## 📂 Repository Structure
- `api/`: FastAPI backend with `graphbot`, `assay_finder`, `gap_finder, and ai modules.
- `nasa-space-biology/`:  Next.js frontend with `app/ routes, UI components, and interactive graphics.
- `AzuriteConfig/`, `api/.env`, `resources/`: additional configurations and supporting datasets.

## 🔒 Configuration and Security
- API keys managed via dotenv; never exposed to the frontend.
- `withCredentials` enabled in Axios to support authenticated flows.
- CORS restricted to the production Vercel domain, mitigating unauthorized origins.
- Prepared to include OAuth/cookies in `APIContext` using `Authorization: Bearer`.

## 🛤️ Roadmap
- Persistence (PostgreSQL or vector store) for histories and metric tracking.
- Integration of open-source LLMs for sovereign and offline deployments.
- Visual gap panels with bar charts/heatmaps in React (`recharts`).
- Incorporation of citations and confidence scores linking to specific papers (GraphRAG context data).
- Automated ETL pipelines to keep the NASA graph up to date.

## 🤝 How to Contribute
- Create a descriptive branch (`feature/frontend-graph-3d`).
- Follow existing static typing and concise commenting practices.
- Validate endpoints manually or via scripts before opening a PR.
- Document new prompts, endpoints, or UI components in this README.

## 📄 License and Credits
- Project developed for NASA Space Apps; review official conditions before redistribution.
- Data sourced from NASA OSDR; infrastructure based on FastAPI, GraphRAG, Next.js, and open-source libraries.

Stellar-Minds is ready to power the next wave of discoveries in space biology! 🌠
