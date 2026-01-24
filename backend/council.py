"""3-stage Prism orchestration."""

from typing import List, Dict, Any, Tuple
from .openrouter import query_models_parallel, query_model
from .config import COUNCIL_MODELS, CHAIRMAN


async def stage1_collect_responses(
    user_query: str,
    council_models: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Stage 1: Collect individual responses from all council models.

    Args:
        user_query: The user's question
        council_models: Optional list of council model configs. If None, uses default from config.

    Returns:
        List of dicts with 'model', 'name', 'personality' and 'response' keys
    """
    import asyncio
    
    if council_models is None:
        council_models = COUNCIL_MODELS
    
    # Query each model with its system message
    tasks = []
    for model_config in council_models:
        messages = [
            {"role": "system", "content": model_config["system_message"]},
            {"role": "user", "content": user_query}
        ]
        tasks.append(query_model(model_config["model"], messages))
    
    # Wait for all responses
    responses = await asyncio.gather(*tasks)

    # Format results
    stage1_results = []
    for model_config, response in zip(council_models, responses):
        if response is not None:  # Only include successful responses
            stage1_results.append({
                "model": model_config["model"],
                "name": model_config["name"],
                "personality": model_config["personality"],
                "response": response.get('content', '')
            })

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_models: List[Dict[str, Any]] = None
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """
    Stage 2: Each model ranks the anonymized responses.

    Args:
        user_query: The original user query
        stage1_results: Results from Stage 1
        council_models: Optional list of council model configs. If None, uses default from config.

    Returns:
        Tuple of (rankings list, label_to_model mapping)
    """
    if council_models is None:
        council_models = COUNCIL_MODELS
    # Create descriptive labels using personality names
    labels = [result['personality'].split('(')[1].rstrip(')') for result in stage1_results]

    # Create mapping from label to model name and personality
    label_to_model = {
        f"Response from {label.lower()}": {
            'model': result['model'],
            'name': result['name'],
            'personality': result['personality']
        }
        for label, result in zip(labels, stage1_results)
    }

    # Build the ranking prompt
    responses_text = "\n\n".join([
        f"Response from {label.lower()}:\n{result['response']}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different perspectives:

{responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response from the realist")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response from the realist provides good detail on X but misses Y...
Response from the contrarian is accurate but lacks depth on Z...
Response from the philosopher offers the most comprehensive answer...

FINAL RANKING:
1. Response from the philosopher
2. Response from the realist
3. Response from the contrarian

Now provide your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]

    # Get rankings from all council models in parallel
    import asyncio
    tasks = []
    for model_config in council_models:
        messages_with_system = [
            {"role": "system", "content": model_config["system_message"]},
            {"role": "user", "content": ranking_prompt}
        ]
        tasks.append(query_model(model_config["model"], messages_with_system))
    
    responses = await asyncio.gather(*tasks)

    # Format results
    stage2_results = []
    for model_config, response in zip(council_models, responses):
        if response is not None:
            full_text = response.get('content', '')
            parsed = parse_ranking_from_text(full_text)
            stage2_results.append({
                "model": model_config["model"],
                "name": model_config["name"],
                "personality": model_config["personality"],
                "ranking": full_text,
                "parsed_ranking": parsed
            })

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
    chairman: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Stage 3: Chairman synthesizes final response.

    Args:
        user_query: The original user query
        stage1_results: Individual model responses from Stage 1
        stage2_results: Rankings from Stage 2
        chairman: Optional chairman config. If None, uses default from config.

    Returns:
        Dict with 'model' and 'response' keys
    """
    if chairman is None:
        chairman = CHAIRMAN
    # Build comprehensive context for chairman
    stage1_text = "\n\n".join([
        f"Model: {result['model']}\nResponse: {result['response']}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result['model']}\nRanking: {result['ranking']}"
        for result in stage2_results
    ])

    chairman_prompt = f"""You are the Chairman of Prism. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: {user_query}

STAGE 1 - Individual Responses:
{stage1_text}

STAGE 2 - Peer Rankings:
{stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:"""

    messages = [
        {"role": "system", "content": chairman["system_message"]},
        {"role": "user", "content": chairman_prompt}
    ]

    # Query the chairman model
    response = await query_model(chairman["model"], messages)

    if response is None:
        # Fallback if chairman fails
        return {
            "model": chairman["model"],
            "name": chairman["name"],
            "personality": chairman["personality"],
            "response": "Error: Unable to generate final synthesis."
        }

    return {
        "model": chairman["model"],
        "name": chairman["name"],
        "personality": chairman["personality"],
        "response": response.get('content', '')
    }


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """
    Parse the FINAL RANKING section from the model's response.

    Args:
        ranking_text: The full text response from the model

    Returns:
        List of response labels in ranked order
    """
    import re

    # Look for "FINAL RANKING:" section
    if "FINAL RANKING:" in ranking_text:
        # Extract everything after "FINAL RANKING:"
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            # Try to extract numbered list format (e.g., "1. Response from the realist")
            # This pattern looks for: number, period, optional space, "Response from..."
            numbered_matches = re.findall(r'\d+\.\s*Response from (?:the )?[a-z]+', ranking_section, re.IGNORECASE)
            if numbered_matches:
                # Extract just the "Response from..." part
                return [re.search(r'Response from (?:the )?[a-z]+', m, re.IGNORECASE).group() for m in numbered_matches]

            # Fallback: Extract all "Response from..." patterns in order
            matches = re.findall(r'Response from (?:the )?[a-z]+', ranking_section, re.IGNORECASE)
            return matches

    # Fallback: try to find any "Response from..." patterns in order
    matches = re.findall(r'Response from (?:the )?[a-z]+', ranking_text, re.IGNORECASE)
    return matches


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    label_to_model: Dict[str, dict]
) -> List[Dict[str, Any]]:
    """
    Calculate aggregate rankings across all models.

    Args:
        stage2_results: Rankings from each model
        label_to_model: Mapping from anonymous labels to model info (dict with model, name, personality)

    Returns:
        List of dicts with model name, personality, and average rank, sorted best to worst
    """
    from collections import defaultdict

    # Track positions for each model
    model_positions = defaultdict(list)

    for ranking in stage2_results:
        ranking_text = ranking['ranking']

        # Parse the ranking from the structured format
        parsed_ranking = parse_ranking_from_text(ranking_text)

        for position, label in enumerate(parsed_ranking, start=1):
            # Normalize the label to match the keys in label_to_model
            normalized_label = label.lower()
            if normalized_label in label_to_model:
                model_info = label_to_model[normalized_label]
                model_name = model_info['model']
                model_positions[model_name].append({
                    'position': position,
                    'personality': model_info['personality'],
                    'name': model_info['name']
                })

    # Calculate average position for each model
    aggregate = []
    for model, position_data in model_positions.items():
        if position_data:
            positions = [p['position'] for p in position_data]
            avg_rank = sum(positions) / len(positions)
            aggregate.append({
                "model": model,
                "personality": position_data[0]['personality'],  # Get personality from first entry
                "name": position_data[0]['name'],
                "average_rank": round(avg_rank, 2),
                "rankings_count": len(positions)
            })

    # Sort by average rank (lower is better)
    aggregate.sort(key=lambda x: x['average_rank'])

    return aggregate


async def generate_conversation_title(user_query: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use gemini-2.5-flash for title generation (fast and cheap)
    response = await query_model("google/gemini-2.5-flash", messages, timeout=30.0)

    if response is None:
        # Fallback to a generic title
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()

    # Clean up the title - remove quotes, limit length
    title = title.strip('"\'')

    # Truncate if too long
    if len(title) > 50:
        title = title[:47] + "..."

    return title


async def run_full_council(
    user_query: str,
    council_models: List[Dict[str, Any]] = None,
    chairman: Dict[str, Any] = None
) -> Tuple[List, List, Dict, Dict]:
    """
    Run the complete 3-stage council process.

    Args:
        user_query: The user's question
        council_models: Optional list of council model configs. If None, uses default from config.
        chairman: Optional chairman config. If None, uses default from config.

    Returns:
        Tuple of (stage1_results, stage2_results, stage3_result, metadata)
    """
    # Stage 1: Collect individual responses
    stage1_results = await stage1_collect_responses(user_query, council_models)

    # If no models responded successfully, return error
    if not stage1_results:
        return [], [], {
            "model": "error",
            "response": "All models failed to respond. Please try again."
        }, {}

    # Stage 2: Collect rankings
    stage2_results, label_to_model = await stage2_collect_rankings(
        user_query, stage1_results, council_models
    )

    # Calculate aggregate rankings
    aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)

    # Stage 3: Synthesize final answer
    stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
        chairman
    )

    # Prepare metadata
    metadata = {
        "label_to_model": label_to_model,
        "aggregate_rankings": aggregate_rankings
    }

    return stage1_results, stage2_results, stage3_result, metadata
