import google.generativeai as genai
import os
import json
import asyncio
import re
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def build_user_context(user_profile: dict) -> str:
    """Build a descriptive user context string for the prompt."""
    parts = []
    
    industry = user_profile.get("industry", "Technology")
    specialization = user_profile.get("specialization") or user_profile.get("branch")
    user_type = user_profile.get("userType", "student")
    experience = user_profile.get("experience")
    current_year = user_profile.get("currentYear")
    degree = user_profile.get("degree")
    is_graduated = user_profile.get("isGraduated")
    skills = user_profile.get("skills", [])
    
    # Build professional context
    if user_type == "professional" or (experience and experience > 0):
        parts.append(f"a professional in the {industry} industry")
        if specialization:
            parts.append(f"specializing in {specialization}")
        if experience:
            parts.append(f"with {experience} years of experience")
    else:
        # Student context
        level = "student"
        if is_graduated:
            level = "recent graduate"
        elif current_year:
            year_map = {1: "1st year", 2: "2nd year", 3: "3rd year", 4: "4th year"}
            level = f"{year_map.get(current_year, f'year {current_year}')} student"
        
        parts.append(f"a {level}")
        if degree:
            parts.append(f"pursuing {degree}")
        if specialization:
            parts.append(f"in {specialization}")
        parts.append(f"aiming for a role in the {industry} industry")
    
    skill_str = ""
    if skills:
        skill_str = f"\nKey skills: {', '.join(skills[:10])}."
    
    return "Candidate profile: " + " ".join(parts) + "." + skill_str


async def generate_all_quiz_pools(user_profile: dict):
    """
    Generate all 30 questions (10 Technical + 10 Aptitude + 10 HR) in ONE API call.
    Returns a dict: {"Technical": [...], "Aptitude": [...], "HR": [...]}
    """
    user_context = build_user_context(user_profile)
    industry = user_profile.get("industry", "Technology")
    specialization = user_profile.get("specialization") or user_profile.get("branch") or industry

    prompt = f"""You are an expert interview question designer. Generate 30 multiple-choice interview questions for the following candidate.

{user_context}

Generate exactly:
- 10 TECHNICAL questions: focused on {specialization} technical skills, tools, concepts, and {industry}-specific knowledge. Difficulty should match the candidate level.
- 10 APTITUDE questions: logical reasoning, quantitative analysis, data interpretation, pattern recognition, and problem-solving. These should be general aptitude questions appropriate for the candidate's level.
- 10 HR questions: behavioral questions (STAR format scenarios), situational judgment, culture fit, professional values, teamwork, and communication skills relevant to the {industry} industry.

Return ONLY a valid JSON object in this exact format:
{{
  "Technical": [
    {{"question": "string", "options": ["string", "string", "string", "string"], "correctAnswer": "string", "explanation": "string"}}
  ],
  "Aptitude": [
    {{"question": "string", "options": ["string", "string", "string", "string"], "correctAnswer": "string", "explanation": "string"}}
  ],
  "HR": [
    {{"question": "string", "options": ["string", "string", "string", "string"], "correctAnswer": "string", "explanation": "string"}}
  ]
}}

Rules:
- Each array MUST contain exactly 10 questions
- correctAnswer MUST be one of the 4 options (exact string match)
- All questions must be unique, non-trivial, and appropriate for the candidate level
- For HR questions, options should be realistic behavioral choices"""

    model_names = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
    ]
    
    generation_config = genai.types.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.8,
        max_output_tokens=8192,
    )
    
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        for model_name in model_names:
            try:
                print(f"[DEBUG] Generating all 30 questions with model: {model_name} (Attempt {attempt + 1}/{max_retries})")
                model = genai.GenerativeModel(model_name, generation_config=generation_config)
                response = await model.generate_content_async(prompt)
                
                text = response.text
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                else:
                    text = text.strip()
                
                # Sanitize: strip invalid control characters that break JSON parsing
                text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
                
                result = json.loads(text)
                
                # Validate structure
                if not all(k in result for k in ["Technical", "Aptitude", "HR"]):
                    raise ValueError(f"Missing quiz types in response. Got keys: {list(result.keys())}")
                
                for quiz_type in ["Technical", "Aptitude", "HR"]:
                    if not isinstance(result[quiz_type], list) or len(result[quiz_type]) == 0:
                        raise ValueError(f"{quiz_type} questions missing or empty")
                    # Pad or trim to 10 if needed
                    while len(result[quiz_type]) < 10:
                        result[quiz_type].append(result[quiz_type][-1])  # duplicate last if short
                    result[quiz_type] = result[quiz_type][:10]
                
                print(f"[DEBUG] Successfully generated all 30 questions with {model_name}")
                return result
                    
            except Exception as e:
                last_error = str(e)
                print(f"[DEBUG] Model {model_name} failed: {last_error[:200]}")
                if "429" in last_error:
                    print(f"[DEBUG] Rate limited on {model_name}. Sleeping 2 seconds...")
                    await asyncio.sleep(2)
                continue
        
        if attempt < max_retries - 1:
            print(f"[DEBUG] All models failed attempt {attempt + 1}. Sleeping 20 seconds...")
            await asyncio.sleep(20)
    
    raise Exception(f"AI generation failed after {max_retries} attempts. Last error: {last_error}")