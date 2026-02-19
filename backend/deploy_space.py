from huggingface_hub import HfApi
import os

# Configuration
REPO_ID = "Anshikaaaaaaaa/fake-review-inference"
TOKEN = os.getenv("HF_TOKEN") # Use environment variable for security

# App Code
app_code = """import gradio as gr
from transformers import pipeline

# Load Model
classifier = pipeline(
    "text-classification",
    model="Anshikaaaaaaaa/distilbert_fake_review",
    tokenizer="Anshikaaaaaaaa/distilbert_fake_review"
)

def predict_review(text):
    try:
        # Get result
        result = classifier(text)[0]
        # Return structured JSON
        return {
            "prediction": result["label"],
            "confidence": round(result["score"] * 100, 2)
        }
    except Exception as e:
        return {"error": str(e)}

# Define Interface with explicit api_name
app = gr.Interface(
    fn=predict_review,
    inputs=gr.Textbox(lines=4, label="Review Text"),
    outputs="json",
    title="Fake Review Detection API",
    api_name="predict"  # KEY CHANGE: Exposes /run/predict or /call/predict
)

if __name__ == "__main__":
    app.launch()
"""

# Requirements
requirements = """transformers
torch
gradio>=4.0.0
"""

# Function to deploy
def deploy():
    api = HfApi(token=TOKEN)
    
    print(f"Deploying to Space: {REPO_ID}...")
    
    # Upload app.py
    api.upload_file(
        path_or_fileobj=app_code.encode("utf-8"),
        path_in_repo="app.py",
        repo_id=REPO_ID,
        repo_type="space"
    )
    print("Uploaded app.py ✅")

    # Upload requirements.txt
    api.upload_file(
        path_or_fileobj=requirements.encode("utf-8"),
        path_in_repo="requirements.txt",
        repo_id=REPO_ID,
        repo_type="space"
    )
    print("Uploaded requirements.txt ✅")
    print("Deployment triggered! Space will restart automatically.")

if __name__ == "__main__":
    deploy()
