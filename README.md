# Cipher - Multi-LLM Council & Debate Arena

<img width="728" height="527" alt="image" src="https://github.com/user-attachments/assets/747988d1-d2c9-4cf9-acbc-f0de44c44406" />

## Overview

Cipher transforms how you interact with AI by harnessing the collective intelligence of multiple Large Language Models. Rather than querying a single LLM, Cipher offers two distinct modes:

- **Council Mode** — Assemble a council of AI personas with unique personalities and specializations. They independently respond to your query, anonymously peer-review each other's answers, and a Chairman synthesizes the best insights into a final response.
- **Debate Mode** — Pit two mythological AI personas against each other in a structured FOR vs AGAINST debate, judged by an impartial moderator.

Built as a local web application using OpenRouter for multi-model access.

---

## Council Mode

### How It Works

1. **Stage 1 — Individual Responses**: Your query is sent to all selected council members simultaneously. Each persona generates its own response from their unique perspective, viewable in a tab interface.
2. **Stage 2 — Anonymized Peer Review**: All responses are redistributed with identities hidden (Response A, B, C...). Each member ranks and evaluates the others, ensuring unbiased assessment. View raw evaluations and aggregate rankings.
3. **Stage 3 — Chairman Synthesis**: The Chairman reviews all responses and peer evaluations, then crafts a refined final answer representing the council's best insights.

### Council Personas

Organized into two categories:

**Cybersecurity** — Strategic security expertise, risk assessment, and compliance:

| Persona | Role | Model |
|---|---|---|
| Security Architect | Zero Trust & defense expert | x-ai/grok-3 |
| Strategic Advisory | Roadmaps & SWOT analysis | anthropic/claude-sonnet-4 |
| Cybersecurity Research | Threat intel & frameworks | openai/gpt-4.1 |
| Business Risk & Compliance | GDPR, NIS2, DORA, ISO expert | google/gemini-2.5-pro |
| Strategic Principal (Chairman) | Executive strategist | google/gemini-2.5-pro |

**Tech** — Technical implementation, architecture, and operational support:

| Persona | Role | Model |
|---|---|---|
| Solutions Architecture Specialist | Cross-service architectural analysis | openai/gpt-4.1 |
| Tech Support Specialist | Step-by-step diagnostic troubleshooter | google/gemini-2.5-pro |
| Implementation Specialist | Operational feasibility & deployment | anthropic/claude-sonnet-4 |
| Threat & Detection Specialist | MITRE ATT&CK detection engineer | x-ai/grok-3 |
| Technical Director (Chairman) | Operational synthesizer | google/gemini-2.5-pro |

---

## Debate Mode

### How It Works

1. **Pick Sides** — Choose one debater for the **FOR** position (left, blue) and one for **AGAINST** (right, red)
2. **Set Rounds** — Configure 1–5 rounds of back-and-forth argumentation
3. **Select Moderator** — Optionally select Themis to deliver a structured verdict
4. **Enter a Topic** — Pose any debatable question or statement
5. **Watch the Debate** — Opening statements stream in side-by-side, followed by rounds where each debater rebuts their opponent, ending with the moderator's verdict

### Debate Personas

Four mythological debaters, each with a distinct rhetorical style:

| Persona | Title | Style | Model |
|---|---|---|---|
| Apollo | God of Reason | Logical — evidence, data, formal reasoning | openai/gpt-4.1 |
| Prometheus | Titan of Conviction | Passionate — emotional appeals, moral framing, urgency | google/gemini-2.5-pro |
| Athena | Goddess of Strategy | Pragmatist — feasibility, cost-benefit, implementation | anthropic/claude-sonnet-4 |
| Loki | The Trickster | Devil's Advocate — contrarian, Socratic questioning, paradoxes | x-ai/grok-3 |

### Moderator

| Persona | Title | Role | Model |
|---|---|---|---|
| Themis | Titan of Justice | Impartial judge — structured verdicts, evidence-based rulings | google/gemini-2.5-pro |

---

## Setup

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for Python project management.

**Backend:**
```bash
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Get your API key at [openrouter.ai](https://openrouter.ai/).

### 3. Run

**Start both backend and frontend:**
```bash
./start.sh
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001

**Or run separately:**

```bash
# Backend
uv run python -m backend.main

# Frontend
cd frontend && npm run dev
```

---

## Usage

1. **Council Mode**: Open the app, optionally configure your council via the settings panel, type a question, and explore the three-stage deliberation
2. **Council Members**: Click "Council Members" in the sidebar to browse personas, their roles, and full system prompts
3. **Debate Mode**: Click "Debate Mode" in the sidebar, pick a FOR and AGAINST debater, set rounds and moderator, enter a topic
4. **Debate Members**: Click "Debate Members" to browse the mythological debaters and moderator, including their system prompts
5. **Conversations**: All sessions are saved and accessible from the sidebar

## Customization

All personas are defined in `backend/personas.py`:

- **`CYBERSECURITY_PERSONAS`** / **`TECH_PERSONAS`** — Council members
- **`CHAIRMAN_OPTIONS`** — Council chairmen (Strategic Principal, Technical Director)
- **`DEBATE_PERSONAS`** — Debate debaters (Apollo, Prometheus, Athena, Loki)
- **`DEBATE_MODERATORS`** — Debate moderators (Themis)

Each persona has a `name`, `model` (OpenRouter model ID), and `system_message` defining their behavior. Council members also have `personality` and `category` fields. Debate personas have `title` and `style` fields.

You can also configure your council from the web interface using the persona selector.

---

## Technical Details

| Component | Technology |
|---|---|
| Backend | Python, FastAPI, async/parallel queries |
| Frontend | React, Vite, ReactMarkdown |
| LLM API | OpenRouter (multi-model) |
| Storage | JSON files in `data/conversations/` |
| Ports | Backend 8001, Frontend 5173 |

For detailed technical documentation, see [CLAUDE.md](CLAUDE.md).

## Troubleshooting

- **Port in use**: Stop the conflicting process, or change ports in `backend/main.py` and `frontend/vite.config.js`
- **API key issues**: Ensure `.env` is in the project root with a key starting `sk-or-v1-`, and check your OpenRouter credit balance
- **Import errors**: Always run the backend from the project root: `uv run python -m backend.main`
- **CORS errors**: Verify the frontend URL in `backend/main.py` matches your actual frontend address (default: http://localhost:5173)

---

*Cipher is a custom fork of Council-LLM: https://github.com/karpathy/llm-council*
