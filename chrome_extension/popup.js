
// chrome_extension/popup.js

// 1. Existing Logic for Generic Text
document.getElementById("checkBtn").addEventListener("click", () => {
    const text = document.getElementById("reviewText").value;
    if (!text) {
        alert("Please enter review text.");
        return;
    }

    fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
    })
        .then(res => {
            if (!res.ok) throw new Error("API Error: " + res.statusText);
            return res.json();
        })
        .then(data => {
            const resultDiv = document.getElementById("result");
            resultDiv.style.display = "block";
            resultDiv.textContent = `Prediction: ${data.prediction} (Confidence: ${data.confidence}%)`;
            resultDiv.className = data.prediction === "Fake" ? "fake" : "genuine";
        })
        .catch(err => {
            console.error(err);
            alert("Could not connect to backend (http://127.0.0.1:8000). Ensure it's running.");
        });
});

// 2. New Logic for Batch Analysis (Analyze All)
const analyzeAllBtn = document.getElementById("analyzeAllBtn");

if (analyzeAllBtn) {
    analyzeAllBtn.addEventListener("click", () => {
        // Query Active Tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) return;

            // Send Message to content.js
            chrome.tabs.sendMessage(tabs[0].id, { action: "analyzeAll" }, (response) => {
                // If content script is missing or error
                if (chrome.runtime.lastError) {
                    console.warn(chrome.runtime.lastError);
                    alert("Analysis Failed. Please reload the page and try again.");
                    return;
                }

                if (response && response.status === "started") {
                    // Success! Close popup so user can see page action
                    window.close();
                } else if (response && response.status === "unsupported") {
                    alert("This website is not supported for Batch Analysis.\nPlease use Manual Selection Mode.");
                } else if (response && response.status === "no_reviews_found") {
                    alert("No reviews found on this page. Try opening a product review section.");
                }
            });
        });
    });
}
