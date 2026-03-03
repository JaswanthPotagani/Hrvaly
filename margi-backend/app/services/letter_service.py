import google.generativeai as genai
import os

async def generate_cover_letter(resume_content: str, job_title: str,company:str,job_desc: str=None):

    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = f"""
    Write a professional cover letter for a {job_title} position at {company}.
    Use the following resume content as the basis for skills and experience:
    {resume_content}

    Job Description (if provided):{job_desc}

    Return the letter in clean text format.
    """
    response = await model.generate_content_async(prompt)
    return response.text