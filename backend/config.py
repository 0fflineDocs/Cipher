"""Configuration for Cipher."""

import os
from dotenv import load_dotenv
from .personas import DEFAULT_COUNCIL, DEFAULT_CHAIRMAN

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Default council and chairman (for backward compatibility)
COUNCIL_MODELS = DEFAULT_COUNCIL
CHAIRMAN = DEFAULT_CHAIRMAN

DATA_DIR = "data/conversations"