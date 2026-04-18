from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai
from pydantic import BaseModel
import os
from typing import Optional
from app.core.settings import settings

router = APIRouter(prefix="/chat", tags=["chat"])

genai.configure(api_key=settings.GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str
    prediction_context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        system_prompt = (
            "You are an expert agronomist AI assistant for 'Plant Disease Omnivax'. "
            "A farmer or user is asking for your help regarding a plant disease prediction. "
        )
        
        if request.prediction_context:
            system_prompt += f"\nHere is the prediction context: {request.prediction_context}\n"
        
        full_prompt = f"{system_prompt}\nUser Question: {request.message}\nProvide a clear and actionable recommendation."
        
        response = model.generate_content(full_prompt)
        
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
