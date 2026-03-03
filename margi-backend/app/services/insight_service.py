import google.generativeai as genai
import os
import json

async def generativeai_industry_trends(industry:str,location:str):
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt =f"""
    Provide a market pulse report for the {industry} industry in {location}.
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
    Important: Include at least 3-5 keyTrends and 5-10 recommendedSkills. For growthRate, use a percentage number.
    """

    print(f"[DEBUG] Prompt sent to AI for {industry}")
    response = await model.generate_content_async(prompt)
    text = response.text
    print(f"[DEBUG] Raw AI response text length: {len(text)}")
    
    # Clean markdown if present
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
    
    print(f"[DEBUG] Cleaned text: {text[:200]}...")
    return json.loads(text)