![Prism Header](header.png)

# Prism - Multi-LLM Council with Personas

## Overview

Prism transforms how you interact with AI by harnessing the collective intelligence of multiple Large Language Models, each embodying a unique persona. Rather than querying a single LLM provider (OpenAI GPT, Google Gemini, Anthropic Claude, xAI Grok, etc.), Prism lets you assemble your own council of AI personas—each with distinct personalities, perspectives, and roles—to collaboratively answer your questions.

This local web application provides a ChatGPT-like interface that uses OpenRouter to distribute your query across multiple LLMs with custom personas. The personas then engage in an anonymized peer review process, critically evaluating each other's responses before a designated Chairman persona synthesizes their insights into a comprehensive final answer.

## Persona System

Prism features a rich persona system where each AI council member has a distinct personality and role:

### Tech Category Personas
- **Atlas** (The Realist) - Grounded in reality, focused on practical constraints and feasibility
- **Cipher** (The Contrarian) - Challenges assumptions, finds loopholes, breaks conventional thinking
- **Eliza** (The Scientist) - Data-driven, evidence-based, grounded in research and statistics
- **Nexus** (The Visionary) - Future-focused, explores cutting-edge possibilities and paradigm shifts

### Culture Category Personas
- **The Seer** (The Philosopher) - Historical wisdom, philosophical frameworks, human condition
- **Muse** (The Creative) - Artistic expression, metaphorical thinking, emotional intelligence
- **Themis** (The Ethicist) - Justice, ethics, moral reasoning across multiple frameworks
- **Voice** (The Activist) - Advocates for the marginalized, challenges power structures

### Chairman Options
- **Ozymandias** (The Arbiter) - Imperial authority, legacy-focused, commanding synthesis
- **Sage** (The Synthesizer) - Wise balance, harmony-seeking, integrative wisdom
- **Oracle** (The Analyzer) - Truth-seeking, rigorous analysis, fact-focused conclusions

## How It Works

### Stage 1: Individual Responses
Your query is sent to all selected council members simultaneously. Each persona generates its own response following their unique perspective and protocol, which you can explore through an intuitive tab view interface.

### Stage 2: Anonymized Peer Review
Each persona receives all responses with identities anonymized (as "Response A", "Response B", etc.). This prevents bias and ensures fair evaluation. Each member ranks the responses based on quality, accuracy, and insight. You can view both the raw evaluations and the extracted rankings.

### Stage 3: Chairman Synthesis
The designated Chairman persona reviews all original responses and peer evaluations. Drawing from this collective intelligence and their unique perspective, the Chairman crafts a refined, comprehensive answer that represents the best insights from your council.

## Why Prism?

- **Diverse Perspectives**: Leverage personas with unique personalities and specialized viewpoints
- **Quality Control**: Anonymized peer review ensures unbiased evaluation of responses
- **Transparency**: View individual responses, peer evaluations, and aggregate rankings
- **Customizable Council**: Select up to 6 council members from Tech and Culture categories
- **Persona Details**: Explore each persona's personality, role, and system prompt
- **Local Control**: Run everything locally with full control over your data and persona selection

---

## Setup

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for project management.

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

Get your API key at [openrouter.ai](https://openrouter.ai/). Make sure to purchase the credits you need, or sign up for automatic top up.

### 3. Configure Council (Optional)

Prism comes with default personas pre-configured, but you can customize the council by editing `backend/personas.py`. The file contains the following list variables:

- **`TECH_PERSONAS`**: Technology-focused personas (Atlas, Cipher, Eliza, Nexus)
- **`CULTURE_PERSONAS`**: Culture-focused personas (The Seer, Muse, Themis, Voice)
- **`CHAIRMAN_OPTIONS`**: Available chairman personas (Ozymandias, Sage, Oracle)

Each persona has:
- `name`: The persona's identifier
- `model`: OpenRouter model identifier (e.g., "openai/gpt-4o")
- `personality`: Brief description of their role
- `category`: "tech" or "culture"
- `system_message`: The prompt defining their behavior and response protocol

**Default Configuration:**
- Council: Atlas, Cipher, The Seer, Eliza
- Chairman: Ozymandias

You can also configure your council from the web interface using the persona selector.

## Running the Application

**Start both backend and frontend:**
```bash
./start.sh
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001

**Or run them separately:**

Backend:
```bash
uv run python -m backend.main
```

Frontend:
```bash
cd frontend
npm run dev
```

## Using Prism

1. **Open the application** at http://localhost:5173
2. **Configure your council** (optional):
   - Click the settings icon to open the persona selector
   - Choose up to 6 council members from Tech and Culture categories
   - Select your preferred Chairman
   - Click "Reset to Default" to restore default configuration
3. **View persona details** (optional):
   - Click the "Members" tab to explore all available personas
   - View their personalities, roles, and system prompts
   - Switch between Tech, Culture, and Chairman categories
4. **Ask a question**: Type your query in the chat interface
5. **Explore responses**:
   - **Stage 1**: View individual responses from each council member
   - **Stage 2**: See peer evaluations and aggregate rankings
   - **Stage 3**: Read the Chairman's synthesized final answer

## Features

- **Interactive Chat Interface**: Clean, modern UI similar to ChatGPT
- **Three-Stage Deliberation**: Individual responses → Peer review → Final synthesis
- **Persona System**: Rich personalities with unique perspectives and response protocols
- **Council Customization**: Select and configure council members via UI
- **Members Explorer**: Browse all personas, view their prompts and personalities
- **Conversation History**: Navigate through previous conversations in the sidebar
- **Markdown Rendering**: Formatted responses with proper syntax highlighting
- **Anonymized Peer Review**: Unbiased evaluation process
- **Aggregate Rankings**: See how all council members ranked each response
- **Transparency**: View raw evaluations and extracted rankings

## Troubleshooting

### Port Already in Use
If you get an error about port 8001 or 5173 being in use, you can either:
- Stop the other application using that port
- Modify the ports in `backend/main.py` (for backend) and `frontend/vite.config.js` (for frontend)

### OpenRouter API Key Issues
- Ensure your `.env` file is in the project root
- Verify your API key starts with `sk-or-v1-`
- Check your OpenRouter account has sufficient credits at [openrouter.ai](https://openrouter.ai/)

### Module Import Errors
- Always run the backend from the project root: `uv run python -m backend.main`
- Never run it from within the backend directory

### CORS Errors
If you see CORS errors in the browser console, verify the frontend URL in `backend/main.py` matches your actual frontend URL (default: http://localhost:5173)

## Technical Details

- **Backend**: Python with FastAPI, async/parallel model queries
- **Frontend**: React with Vite, ReactMarkdown for rendering
- **API**: OpenRouter for multi-model access
- **Storage**: JSON-based conversation storage in `data/conversations/`
- **Port Configuration**: Backend on 8001, Frontend on 5173

For detailed technical documentation, see [CLAUDE.md](CLAUDE.md).

---

*Prism is a custom fork of Council-LLM: https://github.com/karpathy/llm-council*
