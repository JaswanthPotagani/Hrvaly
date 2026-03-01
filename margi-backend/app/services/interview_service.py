import google.generativeai as genai
import os
import json

async def generate_quiz_pool_ai(industry: str,skills:list, interview_type: str ="Techinical"):
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Generate 5 {interview_type} interview questions for a canditate in the {industry} industry.
    Focus on these skills: {',' .join(skills)}.
    For each questions, provide 4 multiple-choice options and the correct answer index.
    Return ONLY a JSON array:
    [{"questions" : "string","options" : ["a","b","c","d"], "answer":0, "explanation" : "string"}]
    """

    response = await model.generate_content_async(prompt)
    return json.loads(response.text)