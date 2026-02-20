# FakeReview-AI Project Submission

## 1. Project Overview
**FakeReview-AI** is a cutting-edge Chrome Extension designed to detect and flag fraudulent product reviews on e-commerce platforms like Amazon, Flipkart, and Myntra. It leverages a Hybrid ML model (Deep Learning + Behavioral Analysis) to separate genuine user feedback from deceptive, AI-generated, or incentivized content.

![Popup Dashboard](docs/assets/dashboard_myntra.png)

## 2. Key Features

### 🚀 Real-Time Analysis
- **One-Click Scan:** Analyze all reviews on a product page instantly.
- **Visual Feedback:** Badges (Green/Red) appear directly next to each review.
- **Detailed Insights:** Simply hover or click for a confidence score.

![Amazon Badges](docs/assets/badges_amazon.png)

### 🔍 Manual Inspection Tool
- **Select & Check:** Highlight *any* text on *any* website.
- **Universal Compatibility:** Works beyond e-commerce sites (blogs, forums).
- **Instant Result:** A sleek popup card displays the verdict.

![Manual Mode Result](docs/assets/manual_mode_popup.png)

## 3. How It Works (Simplified Workflow)
The system follows a logical path to ensure reliable results:

![Logic Flowchart](docs/assets/flowchart.png)

1.  **Site Detection:** Automatically identifies if you are on a supported platform.
2.  **Intelligent Selection:** Attempts to use pre-configured selectors.
3.  **Automatic Fallback:** Switches to a **Universal Parser** if site structure changes.
4.  **Manual Override:** Always available as a powerful backup tool.

This robust workflow ensures users can always verify content, regardless of the website's layout.

## 4. Technology Stack
- **Frontend:** Chrome Extension (Manifest V3), HTML/CSS/JS
- **Backend:** Python FastAPI
- **Model:** DistilBERT (Transformers/Hugging Face)
- **Deployment:** Render (Cloud Hosting) & Localhost Optimized
