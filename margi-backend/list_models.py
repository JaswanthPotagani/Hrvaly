import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Library Version: {genai.__version__}")
print(f"API Key Start: {api_key[:10] if api_key else 'None'}")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    print("Listing all models...")
    try:
        models = list(genai.list_models())
        if not models:
            print("No models found!")
        for m in models:
            print(f"- {m.name} (Methods: {m.supported_generation_methods})")
    except Exception as e:
        print(f"CRITICAL ERROR during list_models: {e}")
