# Prism

![Prism Header](header.png)

## Overview

Prism transforms how you interact with AI by harnessing the collective intelligence of multiple Large Language Models. Rather than querying a single LLM provider (OpenAI GPT, Google Gemini, Anthropic Claude, xAI Grok, etc.), Prism lets you assemble your own "Pantheon" of AI models to collaborate on answering your questions.

This local web application provides a ChatGPT-like interface that uses OpenRouter to distribute your query across multiple LLMs. The models then engage in a peer review process, critically evaluating each other's responses before a designated Chairman LLM synthesizes their insights into a comprehensive final answer.

## How It Works

### Stage 1: First Opinions
Your query is sent to all selected LLMs simultaneously. Each model generates its own independent response, which you can explore through an intuitive tab view interface. This allows you to compare the unique perspectives and approaches of different AI models side-by-side.

### Stage 2: Peer Review
Each LLM receives the responses from all other models in the Pantheon. To ensure impartiality, model identities are anonymized during this phase—preventing any potential bias. Each LLM then ranks the responses based on accuracy and insight, creating a democratic evaluation process.

### Stage 3: Final Synthesis
The designated Chairman model reviews all original responses along with the peer evaluations. Drawing from this collective intelligence, the Chairman compiles a refined, comprehensive answer that represents the best insights from your entire Pantheon of AI models.

## Why Prism?

- **Diverse Perspectives**: Leverage the unique strengths of multiple AI models
- **Quality Control**: Peer review process helps identify the most accurate and insightful responses
- **Transparency**: See individual model responses and how they evaluate each other
- **Local Control**: Run everything locally with full control over your data and model selection

---

*This is a custom fork of Council-LLM: https://github.com/karpathy/llm-council*