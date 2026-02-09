# ⚡ FactFlow AI – PRD to Publishable Blog

> **CrewAI + Multi-LLM (Groq/Gemini) content pipeline**  
> Transform Product Requirements Documents into source-grounded, fact-checked, polished blog posts in minutes.

[![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20Next.js%2014%20%7C%20CrewAI%20%7C%20Groq%20%7C%20Gemini-blue)](#stack)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Problem Statement

Businesses need to publish accurate product content quickly (launch blogs, feature updates, thought leadership), but today's process is **slow and error-prone**:

- Product marketers draft content
- Writers refine tone and structure
- Engineers/PMs verify factual accuracy
- Multiple revision cycles create bottlenecks
- Mistakes slip through, damaging trust and increasing support load

**FactFlow AI solves this** by automating research → drafting → fact-checking → polishing while maintaining a clear audit trail of sources and revisions.

---

## ✨ Key Features

### 📝 Inputs
- **PRD text** (paste directly into UI)
- **File upload** (PDF, TXT, MD, or images with OCR support)
- **Template library** (5 pre-built PRD examples: 100-1000 words)
- **Model selection** (Groq vs Gemini - choose per run in frontend)
- **Tone selection** (professional, friendly, playful, academic, casual)
- **Target audience** (engineers, students, business leaders, etc.)
- **Word count control** (200-3000 words via slider)
- **Web search toggle** (Gemini only - uses SerperDevTool for external research)

### 📤 Outputs
- **Final polished blog post** (Markdown with preserved citations)
- **PDF export** (Professionally styled PDF with citations section)
- **Research pack** (structured JSON: sources S0, S1, S2... + key facts)
- **Fact-check report** (pass/fail + flagged claims + suggested fixes)
- **Draft versions** (all iterations v1, v2, v3 tracked)
- **Downloadable files** (`blog-post.pdf`, `blog-post.md`, `state.json`)

### 🔧 Advanced Features
- **Pipeline stage editing** (provide feedback at any stage and re-run from that point)
- **Multi-provider LLM support** (Groq for speed, Gemini for web search)
- **Free tier optimizations** (8B/Flash models recommended for token efficiency)
- **OCR for images** (extract text from screenshots/diagrams with EasyOCR)

### 🤖 Multi-Agent Pipeline

```mermaid
graph LR
    A[PRD Input] --> B[Researcher]
    B --> C[Writer]
    C --> D[Fact-Checker]
    D -->|Failed| C
    D -->|Passed| E[Style Editor]
    E --> F[Final Blog]
    
    style B fill:#4CAF50
    style C fill:#2196F3
    style D fill:#FF9800
    style E fill:#9C27B0
```

| Agent | Role | Temperature | Purpose |
|-------|------|-------------|---------|
| **Researcher** | Product Researcher | 0.5 | Extracts facts & sources from PRD (+ optional web search) |
| **Writer** | Content Writer | 0.5 | Drafts blog with inline `[S#]` citations |
| **Fact-Checker** | Fact Verifier | 0.2 | Validates every claim; triggers rewrites if needed |
| **Style Editor** | Polish Agent | 0.5 | Improves clarity/tone without adding new facts |

**Fact-Check Loop:** If validation fails, the Writer receives detailed rewrite instructions and retries (max 2 attempts).

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your API keys:
# - GROQ_API_KEY (for Groq models - fast, no web search)
# - GEMINI_API_KEY (for Gemini models - supports web search)
# - SERPER_API_KEY (optional, for web search with Gemini)

# Run
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

npm install
npm run dev -- --port 3000
```

Open **http://localhost:3000**

---

## Demo Walkthrough

1. **Choose a template, upload a file, or paste your own PRD** 
   - Browse 5 pre-built templates (Task Management, AI Writing Assistant, Analytics Dashboard, etc.)
   - Upload PDF, text files, or images (with OCR) to extract PRD content
   - Or paste your own PRD directly
2. **Select AI Model Provider**
   - **Groq** (fast, free tier friendly, no web search): llama-3.1-8b-instant (⭐ recommended), llama-3.3-70b
   - **Gemini** (supports web search, function calling): gemini-2.5-flash (⭐ recommended), gemini-1.5-flash, gemini-1.5-pro
3. Choose tone, audience, and word count
4. (Optional) Enable web search if using Gemini + have a `SERPER_API_KEY`
5. Click **"⚡ Run Agents"**
6. Watch the 4-step timeline update in real time:
   - Researcher finds sources and key facts
   - Writer produces a draft with `[S1]`, `[S2]` citations
   - Fact-Checker validates claims (may trigger rewrites)
   - Style Editor polishes the final output
7. (Optional) Click **"✏️ Edit"** on any stage to provide feedback and re-run from that point
8. **Download** the final blog as `.pdf`, `.md`, or the full `state.json`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Recommended | Your Groq API key (for fast Groq models) |
| `GEMINI_API_KEY` | Recommended | Your Google Gemini API key (for web search support) |
| `MODEL` | No | Default model if not selected in frontend (e.g., `gemini/gemini-2.5-flash`) |
| `SERPER_API_KEY` | No | Enables web search (only works with Gemini models) |
| `BACKEND_URL` | No | Frontend→Backend URL (default `http://localhost:8000`) |

**Note:** Provide at least one of `GROQ_API_KEY` or `GEMINI_API_KEY`. Frontend allows per-run model selection.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/runs` | Create a new run (returns `run_id`) |
| `POST` | `/runs/{run_id}/execute` | Execute the agent pipeline |
| `GET` | `/runs/{run_id}` | Get run state (for polling) |
| `POST` | `/runs/{run_id}/feedback` | Submit feedback and re-run from a specific stage |
| `POST` | `/upload` | Upload PDF/TXT/MD/Image files and extract text |
| `GET` | `/download/{run_id}/pdf` | Download blog post as styled PDF |

## Troubleshooting

### API Key Issues
Make sure you've set at least one of the API keys in `backend/.env`:
- `GROQ_API_KEY` for Groq models (fast, no web search)
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` for Gemini models (supports web search)

### Web search not working
- Web search requires `SERPER_API_KEY` AND a Gemini model selected
- Groq models don't support function calling, so web search is unavailable
- The checkbox will be disabled when Groq is selected

### Model Selection
- Frontend provides per-run model selection
- **Groq models:** Fast but cannot use web search tools
- **Gemini models:** Support SerperDevTool for web research via function calling
- Free tier recommendation: `llama-3.1-8b-instant` (Groq) or `gemini-2.5-flash` (Gemini)

### PDF Export Not Working (Windows)
WeasyPrint requires GTK+ runtime on Windows:
1. Download from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer
2. Install and add to PATH
3. Restart terminal/IDE

### Fact-check loop exceeds retries
After 2 failed retries, the pipeline continues with `DONE_WITH_WARNINGS` status. The final blog will still be generated, but some claims may be unverified. Check the fact-check issues in the timeline.

### Gemini Authentication Error
If you see "Authentication required" for Gemini:
- Set `GEMINI_API_KEY` or `GOOGLE_API_KEY` in `.env`
- Get your API key from: https://aistudio.google.com/apikey
- Model must be selected in frontend (e.g., `gemini/gemini-2.5-flash`)

### CrewAI / LLM errors
- Ensure `crewai>=0.80.0` is installed
- Model names must be prefixed: `groq/llama-3.1-8b-instant` or `gemini/gemini-2.5-flash`
- Check API quotas: Groq (https://console.groq.com), Gemini (https://console.cloud.google.com)

---

## Project Structure

```
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx          # PRD input form
│   │   └── runs/[runId]/     # Timeline view
│   ├── components/           # Timeline, StepCard, MarkdownViewer, etc.
│   └── lib/                  # API client, TypeScript types
├── backend/                  # FastAPI + CrewAI
│   ├── app/
│   │   ├── main.py           # FastAPI routes
│   │   ├── crew/
│   │   │   ├── crew.py       # Agent & task builders
│   │   │   ├── schemas.py    # Pydantic models
│   │   │   └── config/       # agents.yaml, tasks.yaml
│   │   ├── services/
│   │   │   ├── orchestrator.py  # Pipeline + fact-check loop
│   │   │   └── run_store.py     # JSON persistence
│   │   ├── tools/            # SerperDevTool wrapper
│   │   └── utils/            # JSON guardrails
│   └── requirements.txt
└── README.md
```

---

*Built with CrewAI + Groq for fast multi-agent orchestration.*
