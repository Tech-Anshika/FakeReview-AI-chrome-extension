chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "checkFakeReview",
        title: "Check Fake Review",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkFakeReview") {
        // Send the selected text to the content script
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                action: "checkReview",
                text: info.selectionText
            });
        }
    }
});

// Use background script to facilitate fetch requests
// This bypasses mixed content restrictions on HTTPS pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        // Perform the API call here in the background context
        fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: request.text,
                rating: request.rating,
                verified_purchase: request.verified_purchase,
                review_time: request.review_time,
                helpful_vote: request.helpful_vote,
                user_review_burst: request.user_review_burst,
                domain: request.domain
            })
        })
            .then(response => {
                if (!response.ok) throw new Error("API responded with " + response.status);
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                console.error("Fetch Error: ", error);
                sendResponse({ success: false, error: error.message });
            });

        // Return true to indicate we will send a response asynchronously
        return true;
    }
});
