import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException
from transformers import DistilBertTokenizerFast
from huggingface_hub import hf_hub_download

from api.schema import ReviewInput, PredictionOutput
from behavior.behavior_engine import calculate_behavior_score

# -----------------------
# App
# -----------------------
app = FastAPI(
    description="Hybrid AI (Text + Behavior) Fraud Detection [ONNX Optimized]",
    version="1.1"
)

# -----------------------
# CORS Middleware
# -----------------------
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# -----------------------
# Load Model (ONNX)
# -----------------------
# -----------------------
# Load Model (ONNX)
# -----------------------
# -----------------------
# Load Model (ONNX)
# -----------------------
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Correct path relative to api/main.py -> ../backend/models/distilbert_fake_review
MODEL_DIR = os.path.join(BASE_DIR, "..", "backend", "models", "distilbert_fake_review")

MODEL_PATH = os.path.join(MODEL_DIR, "model.onnx")

print(f"Loading model from: {MODEL_DIR} ...")

if os.path.exists(MODEL_PATH):
    # Load Local
    try:
        tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
        ort_session = ort.InferenceSession(MODEL_PATH)
        print("✅ Local ONNX Model Loaded Successfully!")
    except Exception as e:
        print(f"❌ Failed to load local model: {e}")
        raise e
else:
    # Fallback to Download (only if local missing)
    print("⚠️ Local model not found. Attempting download from HuggingFace...")
    REPO_ID = "Anshikaaaaaaaa/distilbert_fake_review"
    FILENAME = "model.onnx"
    TOKEN = os.getenv("HF_TOKEN")
    
    try:
        model_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME, token=TOKEN)
        tokenizer = DistilBertTokenizerFast.from_pretrained(REPO_ID, token=TOKEN)
        ort_session = ort.InferenceSession(model_path)
        print("✅ Downloaded & Loaded Model Successfully!")
    except Exception as e:
        print(f"❌ Critical Error: Could not load model locally or from Hub. {e}")
        raise e

# -----------------------
# Health Check
# -----------------------
@app.get("/")
def health():
    return {"status": "API running (ONNX Optimized) 🚀"}

# -----------------------
# Prediction Endpoint
# -----------------------
def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum(axis=0)



@app.post("/predict", response_model=PredictionOutput)
def predict(review: ReviewInput):
    try:
        # SAFE DEFAULTS & LOGGING (Prevent crash on None types)
        text_content = review.text or ""
        
        # -------- TEXT SCORE (Softmax ONNX) --------
        # Handle empty text to avoid model crash
        if not text_content.strip():
            text_risk = 0.0
        else:
            inputs = tokenizer(
                text_content,
                truncation=True,
                padding="max_length",
                max_length=256,
                return_tensors="np"
            )

            # Prepare inputs for ONNX
            ort_inputs = {
                "input_ids": inputs["input_ids"].astype(np.int64),
                "attention_mask": inputs["attention_mask"].astype(np.int64)
            }

            # Run Inference
            logits = ort_session.run(None, ort_inputs)[0]
            
            # Softmax
            probs = softmax(logits[0])
            
            # ❗ CRITICAL FIX: Training logic was:
            # Class 0: 'CG' (Computer Generated / Fake)
            # Class 1: 'OR' (Original / Genuine)
            #
            # Previously we used probs[1] which meant "Probability of being GENUINE".
            # So a 99% Genuine review was showing as 99% Text Risk (Fake).
            #
            # Correct Logic: Use probs[0] which is the probability of being FAKE.
            text_risk = float(probs[0] * 100)

        # -------- BEHAVIOR SCORE --------
        review_dict = review.dict()
        behavior_score, reasons = calculate_behavior_score(review_dict)

        # DEBUG LOGGING
        print(f"🔍 Analysis: Text Risk (Fake Prob)={text_risk:.2f}, Behavior Score={behavior_score}")

        # -------- FINAL DECISION --------
        
        prediction = "Genuine"
        confidence = 0.0

        if text_risk > 60:
            # Case 1: High Text Risk (Model says Fake)
            prediction = "Fake"
            confidence = text_risk
        elif text_risk >= 40 and behavior_score >= 25:
            # Case 2: Hybrid
            prediction = "Fake"
            confidence = max(text_risk, behavior_score)
        else:
            # Case 3: Genuine
            prediction = "Genuine"
            confidence = 100 - text_risk

        return {
            "prediction": prediction,
            "confidence": round(confidence, 2),
            "text_risk": round(text_risk, 2),
            "behavior_score": behavior_score
        }

    except Exception as e:
        print(f"🔥 PREDICTION ERROR: {str(e)}")
        # Return a 500 with clear message instead of crashing
        raise HTTPException(
            status_code=500,
            detail=f"Internal Processing Error: {str(e)}"
        )
