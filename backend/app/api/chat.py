from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai
from pydantic import BaseModel
import os
from typing import Optional, List
from app.core.settings import settings

router = APIRouter(prefix="/chat", tags=["chat"])

genai.configure(api_key=settings.GEMINI_API_KEY)

class ChatMessage(BaseModel):
    role: str
    parts: List[str]

class ChatRequest(BaseModel):
    message: str
    prediction_context: Optional[str] = None
    history: Optional[List[ChatMessage]] = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        gemini_history = []
        if request.history:
            for h in request.history:
                gemini_history.append({"role": h.role, "parts": h.parts})
                
        chat = model.start_chat(history=gemini_history)
        
        if not gemini_history:
            system_prompt = (
                "You are an expert agronomist AI assistant for 'Plant Disease Omnivax'. "
                "A farmer or user is asking for your help. "
            )
            if request.prediction_context:
                system_prompt += f"\nCurrent prediction context: {request.prediction_context}\n"
                
            full_prompt = f"{system_prompt}\nUser Question: {request.message}\nProvide a clear, actionable recommendation."
            response = chat.send_message(full_prompt)
        else:
            response = chat.send_message(request.message)
            
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
