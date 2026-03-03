import google.generativeai as genai
import os
import json

async def generativeai_industry_trends(industry:str,location:str):
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt =f"""
    Provide a market pulse report for the {industry} industry in {location}.
    Include salary ranges (in lakhs), growth rate, demand level, and top skills.
    Return ONLY a JSON object matching the IndustryInsight schema.
    """

    response = await model.generate_content_async(prompt)
    return json.loads(response.text)