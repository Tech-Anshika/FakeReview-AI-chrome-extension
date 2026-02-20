# FakeReview-AI Project Submission

## 1. Project Overview
**FakeReview-AI** is a cutting-edge Chrome Extension designed to detect and flag fraudulent product reviews on e-commerce platforms like Amazon, Flipkart, and Myntra. It leverages a Hybrid ML model (Deep Learning + Behavioral Analysis) to separate genuine user feedback from deceptive, AI-generated, or incentivized content.

## 2. Key Features

### 🚀 Real-Time Analysis
- **One-Click Scan:** Analyze all reviews on a product page instantly.
- **Visual Feedback:** Badges (Green/Red) appear directly next to each review, indicating its authenticity.
- **Detailed Insights:** Simply hover or click for a confidence score and risk probability percentage.

### 🔍 Manual Inspection Tool
- **Select & Check:** Highlight *any* text on *any* website.
- **Universal Compatibility:** Works beyond e-commerce sites (blogs, forums, etc.).
- **Instant Result:** A sleek popup card displays the verdict.

### 🧠 Dual-Layer Technology
- **Text Analysis:** Uses a fine-tuned DistilBERT model to understand language nuance.
- **Smart Heuristics:** Evaluates review patterns (e.g., rating deviation, verified purchase status) for higher accuracy.

## 3. How It Works (Simplified Workflow)
The system follows a logical path to ensure reliable results:

1.  **Site Detection:** Automatically identifies if you are on a supported platform (Amazon/Flipkart).
2.  **Intelligent Selection:** Attempts to use pre-configured selectors for maximum accuracy.
3.  **Automatic Fallback:**
    *   If the site structure has changed or is unknown, the system seamlessly switches to a **Universal Parser**.
    *   This parser intelligently scans for review-like text blocks.
4.  **Manual Override:** If automatic detection fails completely, manual text selection is always available as a powerful backup.

This robust workflow ensures that users can always verify content, regardless of the website's layout.

## 4. Technology Stack
- **Frontend:** Chrome Extension (Manifest V3), HTML/CSS/JS
- **Backend:** Python FastAPI
- **Model:** DistilBERT (Transformers/Hugging Face)
- **Deployment:** Render (Cloud Hosting) & Localhost Optimized
