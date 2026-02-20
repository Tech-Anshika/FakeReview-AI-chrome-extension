# FakeReview-AI Chrome Extension - Detailed Technical Report

## 1. Executive Summary
**FakeReview-AI** is a browser-based tool designed to combat the proliferation of fraudulent product reviews on e-commerce platforms. By leveraging a **Hybrid Machine Learning Engine** (Deep Learning + Behavioral Analysis), the system analyzes text patterns and user metadata to accurately flag suspicious reviews in real-time. This report outlines the technical architecture, feature set, and operational workflow of the system.

## 2. System Architecture
The project follows a **Microservices Architecture**:
- **Frontend (Client):** Chrome Extension (Manifest V3) responsible for DOM manipulation, data extraction, and user interaction.
- **Backend (Server):** Python FastAPI application hosting the ML models.
- **ML Engine:** DistilBERT (Transformer model) optimized with ONNX Runtime for sub-millisecond inference, combined with heuristic algorithms for metadata scoring.

## 3. Core Features

### A. Batch Analysis (Automated Page Scan)
- **Function:** Scans the entire visible product page.
- **Capability:** Identifies review containers automatically on supported sites (Amazon, Flipkart, Myntra) using specific DOM selectors.
- **Universal Fallback:** If a site is not explicitly supported, a "Universal Parser" attempts to intelligently locate review text blocks using heuristic density analysis.
- **Visual Output:** Injects color-coded badges (`✅ Genuine` or `⚠️ Fake Review`) directly into the web page next to each review.

### B. Manual Analysis Mode (Text Selection)
- **Function:** Allows users to check specific text segments on *any* website.
- **Interaction:**
    1. User highlights text on a webpage.
    2. A floating "Magnifier Button" (🔎) appears.
    3. Clicking the button triggers an immediate API analysis.
- **Output:** A professional popup card appears in the top-right corner displaying:
    - Verdict (Fake/Genuine)
    - Confidence Score (%)
    - Risk Probability

### C. Backend Intelligence
- **Deep Learning:** Uses `Anshikaaaaaaaa/distilbert_fake_review` (Fine-tuned DistilBERT) to understand semantic context and sentiment anomalies.
- **Behavioral Scoring:** Analyzes metadata fields (if available) such as:
    - Verified Purchase Status
    - Review Timestamp/Burst Patterns
    - Rating Deviation
    - Helpful Votes vs. Review Length ratio

## 4. Operational Workflow (Logic Flow)
The extension follows a robust fallback strategy to ensure maximum compatibility, as modeled in our system flowchart:

1.  **Initiation:** User clicks "Analyze All Reviews" in the popup.
2.  **Site Detection:** The system checks `window.location.hostname`.
    *   **Known Site (e.g., Amazon):** It loads a precise "Site Config" with specific CSS selectors for title, body, rating, and author.
    *   **Unknown Site:** It skips directly to the **Universal Parser**.
3.  **Extraction & Validation:**
    *   The system attempts to extract reviews using the chosen method.
    *   **Decision Node:** If the Site Config fails (zero reviews found), the system **automatically falls back** to the Universal Parser.
4.  **Universal Fallback:**
    *   The Universal Parser scans the DOM for repeating text structures common in review sections.
5.  **Final State:**
    *   **Success:** Reviews are found -> Sent to Backend API -> Results displayed via Badges.
    *   **Failure:** No reviews found -> System prompts the user to use **Manual Mode**.

## 5. Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chrome Extension API (Manifest V3)
- **Backend:** Python 3.9, FastAPI, Uvicorn
- **AI/ML:** PyTorch, Transformers (Hugging Face), ONNX Runtime, Scikit-learn
- **Data Handling:** Pandas, NumPy
