import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def analyse_resume_with_ai(content: str, industry:str):
    """
    Uses Gemini to analyse resume content and return an ATS score and feedback.
    """
    prompt= f"""
    Analyse the following resume for a position in the {industry} industry.
    Provide an ATS score (0-100) and specific feedback.
    Return ONLY a JSON object : {{"ats_score": number, "feedback": string}}

    Resume Content: {content}
    """

    model_names = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest']
    
    for model_name in model_names:
        try:
            print(f"[DEBUG] Attempting resume analysis with model: {model_name}")
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

    return {"ats_score": 0, "feedback": "Unable to analyse resume due to AI service error or quota limit"}