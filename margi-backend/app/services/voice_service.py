import google.generativeai as genai
import os
import json
import asyncio
import re
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def _try_models_sync(prompt: str, model_names: list) -> str:
    """Synchronous fallback using asyncio."""
    import asyncio
    return asyncio.get_event_loop().run_until_complete(_call_model(prompt, model_names))


async def _call_model(prompt: str, model_names: list) -> str:
    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.7,
    )
    last_error = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name, generation_config=generation_config)
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            # Strip code fences if any
            text = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
            # Strip invalid control characters
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
            return text
        except Exception as e:
            last_error = str(e)
            print(f"[DEBUG] Voice model {model_name} failed: {last_error[:100]}")
            if "429" in last_error:
                await asyncio.sleep(2)
            continue
    raise Exception(f"All models failed. Last error: {last_error}")


VOICE_SYSTEM_PROMPT = """You are an expert, friendly AI interviewer. 
Your job is to conduct a realistic 5-question mock interview. 
Ask one question at a time. After the candidate responds, give VERY BRIEF encouraging feedback (1 sentence), 
then ask the next question. After the 5th answer has been given, output ONLY the JSON result object.

Result JSON format (output this ONLY after all 5 answers have been received):
{{"type":"RESULT","score":<0-100>,"learnabilityScore":<0-100>,"grammar":"<1-sentence grammar feedback>","confidence":"<1-sentence confidence feedback>","tips":["tip1","tip2","tip3"],"questions":[{{"q":"question text","ideal":"ideal answer"}}]}}

Be conversational. Keep questions focused and professional. 
Don't output the JSON until all 5 responses are collected."""


async def start_voice_interview(industry: str, skills: list, user_context: str) -> dict:
    """Starts a new voice interview session and returns the first question."""
    model_names = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']
    
    skills_str = ', '.join(skills[:5]) if skills else industry
    
    system_message = {
        "role": "user",
        "parts": [f"""{VOICE_SYSTEM_PROMPT}

Candidate profile: {user_context}
Industry: {industry}
Key skills: {skills_str}

Begin the interview now. Greet the candidate warmly and ask your first question.
Return ONLY a JSON: {{"text": "your greeting + first question", "history": [{{"role":"model","parts":["your message"]}}]}}"""]
    }
    
    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.8,
    )
    
    last_error = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name, generation_config=generation_config)
            response = await model.generate_content_async(system_message["parts"][0])
            text = response.text.strip()
            text = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
            result = json.loads(text)
            return result
        except Exception as e:
            last_error = str(e)
            print(f"[DEBUG] Voice start model {model_name} failed: {last_error[:100]}")
            if "429" in last_error:
                await asyncio.sleep(2)
            continue
    
    raise Exception(f"Failed to start voice interview: {last_error}")


async def generate_voice_turn(history: list, user_response: str, industry: str) -> dict:
    """
    Processes one conversation turn. Returns next AI message + updated history.
    When all 5 questions done, returns the RESULT JSON in the text field.
    """
    model_names = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']
    
    # Reconstruct conversation for the model
    conversation_text = ""
    for msg in history:
        role = "Interviewer" if msg.get("role") == "model" else "Candidate"
        parts = msg.get("parts", [])
        content = parts[0] if parts else ""
        conversation_text += f"\n{role}: {content}"
    
    prompt = f"""{VOICE_SYSTEM_PROMPT}

Industry: {industry}

Conversation so far:
{conversation_text}

Candidate: {user_response}

Now respond as the interviewer. If all 5 questions have been answered, output the RESULT JSON embedded in your response text.
Return ONLY a JSON: {{"text": "your response", "history": <updated_history_array>}}
Updated history must include all previous turns plus this new exchange."""

    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.8,
        max_output_tokens=4096,
    )
    
    last_error = None
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name, generation_config=generation_config)
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            text = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
            text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
            result = json.loads(text)
            return result
        except Exception as e:
            last_error = str(e)
            print(f"[DEBUG] Voice turn model {model_name} failed: {last_error[:100]}")
            if "429" in last_error:
                await asyncio.sleep(2)
            continue
    
    raise Exception(f"Failed to generate voice response: {last_error}")


async def evaluate_voice_response(responses: list, industry: str):
    """Legacy: evaluates voice transcripts for technical accuracy and clarity."""
    prompt = f"""
    Evaluate the following interview responses for a {industry} role.
    Analyse for technical correctness and communication clarity.

    responses: {json.dumps(responses)}

    Return ONLY a JSON object:
    {{"score": number, "feedback":"string", "tips": "string"}}
    """
    model_names = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']
    
    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.7,
    )
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name, generation_config=generation_config)
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            text = re.sub(r'^```json\s*|\s*```$', '', text, flags=re.MULTILINE).strip()
            return json.loads(text)
        except Exception as e:
            print(f"[DEBUG] Eval model {model_name} failed: {str(e)[:100]}")
            if "429" in str(e):
                await asyncio.sleep(2)
            continue
    
    return {"score": 50, "feedback": "Evaluation error or quota reached", "tips": "Try speaking more clearly or wait a moment."}
