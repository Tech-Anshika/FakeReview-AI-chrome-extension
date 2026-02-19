# FakeReview-AI Chrome Extension

This extension allows you to check for fake reviews on any e-commerce website using your trained AI model.

## Features
1. **Context Menu Check**: Highlight any review text on any website, right-click, and select "Check Fake Review".
2. **Popup Check**: Click the extension icon to paste and check text manually.
3. **Real-time Analysis**: Uses your local backend to predict if a review is Fake or Genuine.

## Installation

1. **Start the Backend Server**:
   Open a terminal in the `FakeReview-AI` directory and run:
   ```bash
   uvicorn api.main:app --reload
   ```
   *Ensure the server is running on `http://127.0.0.1:8000`.*

2. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions`.
   - Enable **Developer mode** (top right toggle).
   - Click **Load unpacked**.
   - Select the `chrome_extension` folder inside `FakeReview-AI`.

## Usage

- **On any website**:
  1. Select the review text you want to check.
  2. Right-click and choose **"Check Fake Review"**.
  3. A popup will appear on the page with the result.

- **Using the Popup**:
  1. Click the extension icon in the toolbar.
  2. Paste the review text.
  3. Click **Check Generic Text**.
