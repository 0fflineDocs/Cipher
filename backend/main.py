"""FastAPI backend for Cipher."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import uuid
import json
import asyncio

from . import storage
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
from .debate import collect_opening_statements, collect_round_responses, generate_verdict
from .personas import get_personas_by_category, get_all_chairmen, get_persona_by_name, get_chairman_by_name, get_all_debate_personas, get_debate_persona_by_id

app = FastAPI(title="Cipher API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    pass


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    council_members: List[str] = None  # List of persona names
    chairman: str = None  # Chairman name
    # Debate mode fields
    debater_for: str = None  # Debate persona ID for FOR side
    debater_against: str = None  # Debate persona ID for AGAINST side
    num_rounds: int = None  # Number of debate rounds
    moderator: str = None  # Moderator/chairman name


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Cipher API"}


@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations():
    """List all conversations (metadata only)."""
    return storage.list_conversations()


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(request: CreateConversationRequest):
    """Create a new conversation."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/api/personas")
async def get_personas():
    """Get all available personas organized by category."""
    personas_by_category = get_personas_by_category()
    return {
        "personas": personas_by_category,
        "chairmen": get_all_chairmen()
    }


@app.get("/api/debate-personas")
async def get_debate_personas():
    """Get all available debate personas."""
    return {
        "debaters": get_all_debate_personas(),
        "moderators": get_all_chairmen()
    }


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # If this is the first message, generate a title
    if is_first_message:
        title = await generate_conversation_title(request.content)
        storage.update_conversation_title(conversation_id, title)

    # Build council and chairman from request or use defaults
    council_models = None
    chairman_config = None
    
    if request.council_members:
        council_models = []
        for name in request.council_members:
            persona = get_persona_by_name(name)
            if persona:
                council_models.append(persona)
    
    if request.chairman:
        chairman_config = get_chairman_by_name(request.chairman)

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content,
        council_models,
        chairman_config
    )

    # Add assistant message with all stages
    storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(conversation_id: str, request: SendMessageRequest):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    is_debate = request.debater_for is not None and request.debater_against is not None

    async def council_event_generator():
        """Handle council mode - 3-stage deliberation process."""
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content))

            # Build council and chairman from request or use defaults
            council_models = None
            chairman_config = None
            
            if request.council_members:
                council_models = []
                for name in request.council_members:
                    persona = get_persona_by_name(name)
                    if persona:
                        council_models.append(persona)
            
            if request.chairman:
                chairman_config = get_chairman_by_name(request.chairman)

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content, council_models)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(
                request.content, stage1_results, council_models
            )
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(
                request.content, stage1_results, stage2_results, chairman_config
            )
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save complete assistant message
            storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    async def debate_event_generator():
        """Handle debate mode - two personas debate FOR vs AGAINST."""
        try:
            # Add user message (the debate topic)
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content))

            num_rounds = request.num_rounds or 3
            moderator_name = request.moderator

            # Resolve debate personas by ID
            for_persona = get_debate_persona_by_id(request.debater_for)
            against_persona = get_debate_persona_by_id(request.debater_against)

            if not for_persona or not against_persona:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid debate persona ID(s)'})}\n\n"
                return

            # Assign sides
            debaters = [
                {**for_persona, "side": "for"},
                {**against_persona, "side": "against"},
            ]

            # Opening statements
            yield f"data: {json.dumps({'type': 'openings_start'})}\n\n"
            openings = await collect_opening_statements(request.content, debaters)
            yield f"data: {json.dumps({'type': 'openings_complete', 'data': openings})}\n\n"

            # Debate rounds
            rounds = []
            previous = openings
            for round_num in range(1, num_rounds + 1):
                yield f"data: {json.dumps({'type': 'round_start', 'round': round_num})}\n\n"
                round_responses = await collect_round_responses(request.content, debaters, previous, round_num)
                rounds.append(round_responses)
                yield f"data: {json.dumps({'type': 'round_complete', 'round': round_num, 'data': round_responses})}\n\n"
                previous = round_responses

            # Optional moderator verdict
            verdict = None
            if moderator_name:
                yield f"data: {json.dumps({'type': 'verdict_start'})}\n\n"
                moderator = get_chairman_by_name(moderator_name)
                if moderator:
                    verdict = await generate_verdict(request.content, openings, rounds, moderator)
                    yield f"data: {json.dumps({'type': 'verdict_complete', 'data': verdict})}\n\n"

            # Wait for title
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save debate message
            storage.add_debate_message(conversation_id, openings, rounds, verdict)

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    event_generator = debate_event_generator if is_debate else council_event_generator

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
