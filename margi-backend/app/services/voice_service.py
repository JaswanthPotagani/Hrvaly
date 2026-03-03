import google.generativeai as genai
import os
import json

async def evaluate_voice_response(responses: list, industry:str):
    """
    Evaluates voice transcripts for technical accuracy, clarity and confidence.
    """
    model =genai.GenerativeModel('gemini-1.5-flash')

    prompt =f"""

    Evaluate the following interview respinses for a {industry} role.
    Analyse for technical correctness and communication clarity.

    responses: {json.dumps(responses)}

    Return ONLY a JSON object:

    {{"score": number, "feedback":"string", "tips": "string"}}
    """

    response = await model.generate_content_async(prompt)

    try:
        return json.loads(response.text)
    except:
        return {"score":50, "feedback": "Evaluation error" , "tips" : " try speaking more clearly."}
        
