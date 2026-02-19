import os
import sys
from huggingface_hub import HfApi, login

print("--------------------------------------------------")
print("🔥 FAKEREVIEW-AI MODEL RESTORE TOOL 🔥")
print("--------------------------------------------------")

# 1. Get Token
token = os.getenv("HF_TOKEN")
if not token:
    print("\n⚠️  HF_TOKEN not found in environment variables.")
    token = input("👉 Please paste your Hugging Face Write Token here: ").strip()

if not token:
    print("❌ Error: Token is required to upload model.")
    sys.exit(1)

try:
    login(token=token)
    api = HfApi()
    user = api.whoami()['name']
    print(f"\n✅ Logged in as: {user}")
except Exception as e:
    print(f"\n❌ Login Failed: {e}")
    sys.exit(1)

# 2. Check Local Model
local_model_path = os.path.join(os.path.dirname(__file__), "models", "distilbert_fake_review") 
if not os.path.exists(local_model_path):
    print(f"\n❌ Error: Local model folder not found at: {local_model_path}")
    print("Please ensure your model files are in 'backend/models/distilbert_fake_review'")
    sys.exit(1)

file_count = len(os.listdir(local_model_path))
print(f"✅ Found local model folder with {file_count} files.")

# 3. Define Repo ID
repo_id = f"{user}/distilbert_fake_review"
print(f"🎯 Target Repository: {repo_id}")

# 4. Create Repo (if missing)
try:
    print("   Creating/Verifying repository...")
    api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True)
except Exception as e:
    print(f"⚠️  Repo creation warning (might exist): {e}")

# 5. Upload
print(f"\n🚀 Starting Upload to {repo_id}...")
print("   This might take a few minutes depending on your internet speed.")

try:
    api.upload_folder(
        folder_path=local_model_path,
        repo_id=repo_id,
        repo_type="model",
        commit_message="Restoring corrupted/deleted model files (Auto-Restore)"
    )
    print("\n✅ UPLOAD COMPLETE! 🎉")
    print(f"   Model URL: https://huggingface.co/{repo_id}")
    print("\n👉 Now tell the AI Assistant: 'Model upload ho gaya, main.py update karo.'")
    
except Exception as e:
    print(f"\n❌ Upload Failed: {e}")
    sys.exit(1)
