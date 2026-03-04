import google.generativeai as genai
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def generate_cover_letter(resume_content: str, job_title: str, company: str, job_desc: str=None):
    prompt = f"""
    Write a professional cover letter for a {job_title} position at {company}.
    Use the following resume content as the basis for skills and experience:
    {resume_content}

    Job Description (if provided): {job_desc}

    Return the letter in clean text format.
    """

    model_names = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest']
    
    for model_name in model_names:
        try:
            print(f"[DEBUG] Attempting cover letter generation with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            print(f"[DEBUG] Model {model_name} failed: {str(e)}")
            if "429" in str(e):
                print("[DEBUG] Rate limit (429) hit. Waiting 2 seconds...")
                await asyncio.sleep(2)
            continue

    return "Unable to generate cover letter due to AI service error or quota reached."