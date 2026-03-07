import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

try:
    print("Listing available models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"ID: {m.name}, DisplayName: {m.display_name}")
except Exception as e:
    print(f"FAILED: {e}")
