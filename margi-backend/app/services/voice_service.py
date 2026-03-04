import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def evaluate_voice_response(responses: list, industry:str):
    """
    Evaluates voice transcripts for technical accuracy, clarity and confidence.
    """
    prompt =f"""
    Evaluate the following interview responses for a {industry} role.
    Analyse for technical correctness and communication clarity.

    responses: {json.dumps(responses)}

    Return ONLY a JSON object:
    {{"score": number, "feedback":"string", "tips": "string"}}
    """

    model_names = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest']
    
    for model_name in model_names:
        try:
            print(f"[DEBUG] Attempting voice evaluation with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async(prompt)
            
            text = response.text
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
                
            return json.loads(text)
        except Exception as e:
            print(f"[DEBUG] Model {model_name} failed: {str(e)}")
            if "429" in str(e):
                print("[DEBUG] Rate limit (429) hit. Waiting 2 seconds...")
                await asyncio.sleep(2)
            continue

    return {"score":50, "feedback": "Evaluation error or quota reached" , "tips" : "try speaking more clearly or wait a moment."}
