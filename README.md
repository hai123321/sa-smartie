# SA Smartie — Solution Architect AI Assistant

AI-powered assistant for Solution Architects. Analyzes BRDs, facilitates PO clarification sessions, generates architecture documents, and cascades updates across all docs when requirements change.

## Features

### 1. BRD Analyzer
Upload or paste a Business Requirements Document → AI generates targeted stakeholder questions categorized by priority (Critical / Important / Nice-to-have) and type (Business Logic, NFR, Integrations, Technical Constraints).

### 2. PO Clarification Session
Start an interactive Q&A session where the Product Owner answers each question. AI follows up if an answer is ambiguous. When all critical questions are answered, finalize to produce an **Enriched BRD** that integrates all clarifications.

### 3. Architecture Document Generation
From the enriched BRD, AI generates 5 documents in parallel (streamed live):
- **Architecture Design** — C4 model, system topology, tech stack, deployment
- **Product Requirements (PRD)** — User stories, acceptance criteria, personas
- **Data Model** — Entities, relationships, schema design
- **API Design** — Endpoints, contracts, authentication, error formats
- **Architecture Decision Records (ADR)** — Key design decisions with rationale

### 4. Cascade Update
Edit the enriched BRD → click **Run Cascade** → AI performs impact analysis and updates only the affected documents. Shows before/after diff for each changed document.

### 5. Architecture Q&A Chat
Chat with AI about your architecture with full context from System Inventory and BRD analysis.

### 6. System Inventory
Manage your system landscape with relationship mapping and tech stack visualization.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Either an Anthropic API key **or** the `claude` CLI installed and authenticated

### Install

```bash
npm install
```

### Configure

Copy `.env.local` and set your auth mode:

```bash
# Option A: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...

# Option B: Claude CLI (no API key needed)
# Make sure `claude` is installed: https://claude.ai/code
CLAUDE_BIN=/path/to/claude   # default: claude (must be in PATH)
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Use (Full Flow)

```
1. BRD Analyzer     → paste BRD → analyze
2. Start PO Session → answer questions → finalize
3. Docs page        → auto-generated (or click Generate)
4. Cascade Update   → edit BRD → run cascade → see diffs
```

### Step-by-step

**Step 1 — Analyze a BRD**
- Go to **BRD Analyzer** (`/analyze`)
- Paste your BRD content and click Analyze
- Review the generated questions and ambiguities

**Step 2 — PO Clarification Session**
- Click **Start PO Session** (blue button in the results header)
- Answer each question — AI may ask a follow-up for critical questions
- Use the left sidebar to track progress and jump between questions
- When all critical questions are answered, click **Finalize & Generate Docs**

**Step 3 — Review Architecture Documents**
- You are redirected to `/docs/[id]` automatically
- Watch each document generate live (Architecture → PRD → Data Model → API → ADR)
- Switch between document tabs to review
- Export any document as Markdown

**Step 4 — Cascade Update**
- Click the **Cascade Update** tab (⚡ icon)
- Edit the BRD textarea (add a requirement, change a constraint, etc.)
- Click **Run Cascade**
- AI identifies which documents are impacted and updates only those
- Expand each updated document to see the before/after diff

---

## Architecture

```
app/
├── analyze/          # BRD upload & question generation
├── session/[id]/     # PO clarification session
├── docs/             # Document index
├── docs/[id]/        # Generated docs + cascade update
├── chat/             # Architecture Q&A
├── inventory/        # System inventory
└── api/
    ├── analyze/      # POST: analyze BRD
    ├── session/[id]/ # GET/POST: session management
    │   ├── answer/   # POST: submit answer (with AI follow-up check)
    │   └── finalize/ # POST: enrich BRD
    ├── docs/
    │   ├── generate/ # POST: stream doc generation (SSE)
    │   └── [id]/
    │       └── cascade/ # POST: impact analysis + cascade update

data/
├── analyses/         # BRD analyses (JSON)
├── sessions/         # PO sessions (JSON)
└── docs/             # Generated doc sets (JSON)
```

### AI Prompts
- `lib/ai/prompts/brd-analysis.ts` — BRD ambiguity detection
- `lib/ai/prompts/session-qa.ts` — Answer sufficiency check + BRD enrichment
- `lib/ai/prompts/doc-generation.ts` — Per-document generation prompts
- `lib/ai/prompts/cascade-update.ts` — Impact analysis + selective doc update

### Auth Modes
The app auto-detects:
- `ANTHROPIC_API_KEY` set → uses Anthropic API directly
- No key → spawns `claude --print` subprocess (uses your Claude Code OAuth session)
