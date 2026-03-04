import google.generativeai as genai
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Configure GenAI globally
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generativeai_industry_trends(industry: str, location: str, specialization: str = None):
    spec_context = f" focusing on the {specialization} specialization" if specialization else ""
    prompt = f"""
    Provide a market pulse report for the {industry} industry in {location}{spec_context}.
    Return ONLY a JSON object matching this structure:
    {{
      "salaryRanges": [
        {{ "role": "string", "min": number, "max": number, "median": number }}
      ],
      "growthRate": number,
      "demandLevel": "HIGH", "MEDIUM", or "LOW",
      "topSkills": ["string"],
      "marketOutlook": "POSITIVE", "NEGATIVE", or "NEUTRAL",
      "keyTrends": ["string"],
      "recommendedSkills": ["string"],
      "salaryCurrency": "INR",
      "salaryFrequency": "Lakhs"
    }}
    Important: 
    - In "salaryRanges", provide 5-7 specific Job Titles (e.g., "Software Engineer", "Senior DevOps") that are currently trending in this niche.
    - For growthRate, use a percentage number.
    - Include at least 3-5 keyTrends and 5-10 recommendedSkills.
    """

    print(f"[DEBUG] Prompt sent to AI for {industry}")
    
    # FALLBACK LOGIC FOR MODELS (Confirmed via /list-models)
    # The aliases 'gemini-flash-latest' and 'gemini-pro-latest' were confirmed working/present.
    model_names = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest']
    last_error = None
    
    for model_name in model_names:
        try:
            print(f"[DEBUG] Attempting model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async(prompt)
            
            if not response or not response.text:
                print(f"[DEBUG] Empty response from {model_name}")
                continue
                
            text = response.text
            print(f"[DEBUG] Success with model {model_name}. Response length: {len(text)}")
            
            # Clean markdown if present
            if text.startswith("```json"):
                text = text[7:-3].strip()
            elif text.startswith("```"):
                text = text[3:-3].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"[DEBUG] Model {model_name} failed: {str(e)}")
            last_error = e
            # If it's a rate limit (429), waiting a bit might help the next model or try again
            if "429" in str(e):
                print("[DEBUG] Rate limit (429) hit. Waiting 2 seconds...")
                await asyncio.sleep(2)
            continue
            
    print(f"[ERROR] All models failed in generativeai_industry_trends. Last error: {str(last_error)}")
    raise last_error