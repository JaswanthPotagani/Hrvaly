import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_quiz_pool_ai(industry: str, skills: list, interview_type: str ="Technical"):
    prompt = f"""
    Generate 5 {interview_type} interview questions for a candidate in the {industry} industry.
    Focus on these skills: {',' .join(skills)}.
    For each question, provide 4 multiple-choice options and the correct answer index.
    Return ONLY a JSON array:
    [{"questions" : "string","options" : ["a","b","c","d"], "answer":0, "explanation" : "string"}]
    """

    model_names = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest']
    
    for model_name in model_names:
        try:
            print(f"[DEBUG] Attempting quiz generation with model: {model_name}")
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

    raise Exception("All Gemini models failed to generate quiz pool or rate limit reached.")