import google.generativeai as genai
import os
import json

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def analyse_resume_with_ai(content: str, industry:str):
    """
    Uses Gemini to analyse resuem content and return an ATS score and feedback.
    """

    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    prompt= f"""
    Analyse the following resume for a position in the {industry} industry.
    Provide an ATS score (0-100) and specific feedback.
    Return ONLY a JSON object : {{"ats_score": number, "feedback": string}}

    Resume Content: {content}
    """

    response = await model.generate_content_async(prompt)

    try:
        return json.loads(response.text)
    except:
        return {"ats_score": 0, "feedback": "Unable to analyse resume"}
    
    
    