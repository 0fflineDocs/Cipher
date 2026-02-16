"""Debate mode logic for Cipher.

Each debate has two sides: FOR and AGAINST.
Debaters are professional cybersecurity personas with distinct rhetorical styles.
"""

import asyncio
from typing import List, Dict, Any, Optional
from .openrouter import query_model


def build_side_system_message(persona: Dict[str, Any], side: str, topic: str) -> str:
    """Build the full system prompt incorporating side assignment."""
    base = persona.get("system_message", "")
    if side == "for":
        side_instruction = (
            f"\n\nYou are arguing FOR the following topic. "
            f"You must defend and support this position:\n\"{topic}\""
        )
    else:
        side_instruction = (
            f"\n\nYou are arguing AGAINST the following topic. "
            f"You must oppose and challenge this position:\n\"{topic}\""
        )
    return base + side_instruction + "\n\nKeep your responses concise but impactful — aim for 2-4 paragraphs per response."


async def collect_opening_statements(
    topic: str,
    debaters: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Collect opening statements from all debaters in parallel.

    Args:
        topic: The debate topic/question
        debaters: List of debater configs with name, model, system_message, side

    Returns:
        List of opening statements: [{persona, model, side, content}, ...]
    """
    async def get_opening(debater: Dict[str, Any]) -> Dict[str, Any]:
        system_message = build_side_system_message(debater, debater["side"], topic)
        prompt = (
            f"You are participating in a debate on the following topic:\n\n"
            f"\"{topic}\"\n\n"
            f"Present your opening statement. Be clear, persuasive, and establish your position."
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]

        result = await query_model(debater["model"], messages)

        return {
            "persona": debater["name"],
            "persona_id": debater.get("id", ""),
            "model": debater["model"],
            "side": debater["side"],
            "title": debater.get("title", ""),
            "content": result["content"] if result else "Failed to generate opening statement."
        }

    tasks = [get_opening(debater) for debater in debaters]
    return list(await asyncio.gather(*tasks))


async def collect_round_responses(
    topic: str,
    debaters: List[Dict[str, Any]],
    previous_statements: List[Dict[str, Any]],
    round_number: int
) -> List[Dict[str, Any]]:
    """
    Collect responses for a debate round where each debater responds to opponents.

    Args:
        topic: The debate topic
        debaters: List of debater configs (with side)
        previous_statements: Statements from the previous round
        round_number: Current round (1-indexed)

    Returns:
        List of round responses: [{persona, model, side, content}, ...]
    """
    async def get_response(debater: Dict[str, Any], opponent_statements: List[Dict[str, Any]]) -> Dict[str, Any]:
        system_message = build_side_system_message(debater, debater["side"], topic)

        # Build opponent context
        opponent_context = "\n\n".join([
            f"**{stmt['persona']}** ({stmt['side'].upper()}) said:\n{stmt['content']}"
            for stmt in opponent_statements
            if stmt["persona"] != debater["name"]
        ])

        prompt = (
            f"The debate topic is: \"{topic}\"\n\n"
            f"This is Round {round_number}. Your opponent argued:\n\n"
            f"{opponent_context}\n\n"
            f"Respond to their arguments. Challenge their points and strengthen your case."
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]

        result = await query_model(debater["model"], messages)

        return {
            "persona": debater["name"],
            "persona_id": debater.get("id", ""),
            "model": debater["model"],
            "side": debater["side"],
            "title": debater.get("title", ""),
            "content": result["content"] if result else "Failed to generate response."
        }

    tasks = [get_response(debater, previous_statements) for debater in debaters]
    return list(await asyncio.gather(*tasks))


async def generate_verdict(
    topic: str,
    openings: List[Dict[str, Any]],
    rounds: List[List[Dict[str, Any]]],
    moderator: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate a moderator verdict summarizing the debate.

    Args:
        topic: The debate topic
        openings: Opening statements
        rounds: All debate rounds
        moderator: Moderator config with name, model, system_message

    Returns:
        Verdict: {moderator, model, content}
    """
    # Build full transcript
    transcript = "## Opening Statements\n\n"
    for opening in openings:
        side_label = opening.get("side", "").upper()
        transcript += f"**{opening['persona']} ({side_label}):**\n{opening['content']}\n\n"

    for i, round_responses in enumerate(rounds, 1):
        transcript += f"## Round {i}\n\n"
        for response in round_responses:
            side_label = response.get("side", "").upper()
            transcript += f"**{response['persona']} ({side_label}):**\n{response['content']}\n\n"

    system_message = moderator.get("system_message", (
        "You are an impartial debate moderator. Evaluate based on: strength of arguments and evidence, "
        "effectiveness of rebuttals, logical consistency, persuasiveness, and how well each side addressed "
        "the opponent's points. Be fair, specific, and reference actual arguments made during the debate."
    ))

    prompt = (
        f"You are moderating a debate on: \"{topic}\"\n\n"
        f"Transcript:\n\n{transcript}\n\n"
        f"Provide your verdict: summarize key arguments from each side, evaluate reasoning quality, "
        f"assess rebuttal effectiveness, and declare a winner (or draw) with clear justification."
    )

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]

    result = await query_model(moderator["model"], messages)

    return {
        "moderator": moderator["name"],
        "model": moderator["model"],
        "content": result["content"] if result else "Failed to generate verdict."
    }
