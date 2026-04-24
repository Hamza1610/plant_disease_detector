from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Optional, List
from app.core.settings import settings

router = APIRouter(prefix="/chat", tags=["chat"])

client = genai.Client(api_key=settings.GEMINI_API_KEY)

class ChatMessage(BaseModel):
    role: str
    content: str # Updated from parts to match modern SDK style

class ChatRequest(BaseModel):
    message: str
    prediction_context: Optional[str] = None
    history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    try:
        system_instruction = (
            "You are an expert agronomist AI assistant for 'Plant Disease Omnivax'. "
            "A farmer or user is asking for your help. Provide clear, actionable recommendations. "
            "If the user has a specific prediction context, use it to give localized advice."
        )
        
        if request.prediction_context:
            system_instruction += f"\nCurrent prediction context: {request.prediction_context}"

        # Prepare history for the new SDK
        chat_history = []
        if request.history:
            for h in request.history:
                chat_history.append(types.Content(role=h.role, parts=[types.Part(text=h.content)]))

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=chat_history + [types.Content(role='user', parts=[types.Part(text=request.message)])],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        
        return ChatResponse(reply=response.text)
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
