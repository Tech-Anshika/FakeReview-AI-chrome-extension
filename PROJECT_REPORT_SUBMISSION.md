# FakeReview-AI Project Submission

## 1. Project Overview
**FakeReview-AI** is a cutting-edge Chrome Extension designed to detect and flag fraudulent product reviews on e-commerce platforms like Amazon, Flipkart, Myntra, and direct-to-consumer brand sites. It leverages a Hybrid ML model (Deep Learning + Behavioral Analysis) to separate genuine user feedback from deceptive content.

![Popup Interface](docs/assets/extension%20chatbot.jpeg)

## 2. Key Features

### 🚀 Real-Time Analysis
- **One-Click Scan:** Analyze all reviews on a product page instantly.
- **Visual Feedback:** Badges (Green/Red) appear directly next to each review.

**Amazon Integration:**  
![Amazon Reviews](docs/assets/amazon.jpeg)

**Flipkart Integration:**  
![Flipkart Reviews](docs/assets/flipkart.png)

**Myntra Integration:**  
![Myntra Reviews](docs/assets/myntra.png)

### 🔍 Manual Inspection Tool (Universal Parser)
- **Select & Check:** Highlight *any* text on *any* website (e.g., Noise Audio).
- **Instant Result:** Click the 🔎 magnifier to see the verdict in a sleek popup card without leaving the page.

**Universal Parser Action:**  
![Universal Parser](docs/assets/noise(univercel%20webs).jpeg)

**Result Card:**  
![Manual Result](docs/assets/manualselector-result.jpeg)

## 3. How It Works (Simplified Workflow)
The system follows a logical path to ensure reliable results across different platforms:

![Logic Flowchart](docs/assets/FakeReview-AI-Flowchart.png)

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
