# 🛠️ Chrome Extension Development Guide (Hinglish)

Yeh guide apko step-by-step samjhayegi ki humne **FakeReview-AI Chrome Extension** kaise banaya. Hum beginner level se start karenge taaki aapko pura process samajh aa jaye.

---

## 1. 🤔 Basic Concept: Chrome Extension Kya Hai?

Socho aap Amazon chala rahe ho. Amazon ka page Amazon ke server se aata hai. Aap usme apna code nahi daal sakte.
Lekin **Chrome Extension** ek aisa power hai jo aapko kisi bhi website (Amazon, Flipkart) ke upar apna code (HTML/CSS/JS) chalane ki permission deta hai.

**Humara Goal:**
User review padh raha hai -> Text select kare -> Button dabaye -> Humara AI bataye ki Fake hai ya Genuine.

---

## 2. 📂 Project Structure (Folder Me Kya Hai?)

Extension banane ke liye humne `chrome_extension` naam ka folder banaya. Isme ye 4 main files hain:

1.  **`manifest.json`** 📜 (Identity Card) - Extension ki settings.
2.  **`content.js`** 🕵️ (Field Agent) - Jo website ke page par kaam karta hai.
3.  **`background.js`** 🧠 (Manager) - Jo browser ke background me chalta hai aur API se baat karta hai.
4.  **`content.css`** 🎨 (Makeup) - Popup aur Button ka design.

---

## 3. 🚀 Step-by-Step Creation Process

### **Step 1: Manifest File (`manifest.json`)**
Sabse pehle browser ko batana padta hai ki ye extension karega kya. Ye file `project config` hoti hai.

**Code Logic:**
```json
{
  "manifest_version": 3,      // Latest version
  "name": "FakeReview-AI",
  "permissions": ["activeTab", "scripting"], // Hume tab aur script chalane ki power chahiye
  "host_permissions": ["*://*/*"],           // Hum kisi bhi website (Amazon/Flipkart) par chalenge
  "content_scripts": [        // Page load hote hi ye scripts inject kardo
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ]
}
```

### **Step 2: Content Script (`content.js`) - The Real Brain**
Ye script Amazon/Flipkart ke page ke *andar* ghus kar chalta hai. Iska kaam hai user ka action dekhna.

**Kaam 1: Text Selection Pakadna**
Jab user mouse se text select karta hai, hume pata chalna chahiye.
```javascript
document.addEventListener("selectionchange", () => {
    // User ne text select kiya?
    let text = window.getSelection().toString();
    if (text.length > 5) {
        showFloatingButton(); // Ek chota button dikhao 🔍
    }
});
```

**Kaam 2: Floating Button Dikhana (Myntra Fix)**
Myntra right-click disable rakhta hai, isliye humne wo "Magnifying Glass 🔍" wala button banaya jo selection ke paas hawa me tairta hai.
```javascript
function showFloatingButton() {
    // Button create karo (HTML)
    let btn = document.createElement("div");
    btn.innerHTML = "🔍"; 
    // Usko mouse ke paas position karo
    btn.style.top = mousePosition.y + "px";
    btn.style.left = mousePosition.x + "px";
    document.body.appendChild(btn); // Page me jod do
}
```

**Kaam 3: API Ko Call Karna**
Jab user button dabata hai, hum request bhejte hain.
*Purana Tarika (Fail hua tha):* Direct `fetch('http://localhost:8000')`.
*Problem:* HTTPS (Amazon) se HTTP (Localhost) call karna mana hai (Mixed Content Error).
*Naya Tarika (Success):* Hum request `background.js` ko bhejte hain.

```javascript
chrome.runtime.sendMessage({ action: "analyzeText", text: text });
```

### **Step 3: Background Script (`background.js`) - The Middleman**
Ye script website ka hissa nahi hai, ye Chrome Browser ka hissa hai. Ispe "Mixed Content" ki rook-tok nahi hoti.

**Code Logic:**
```javascript
// Content Script se message suno
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeText") {
        
        // Asli API call yaha se hoti hai
        fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: JSON.stringify({ text: request.text })
        })
        .then(response => response.json())
        .then(data => {
            // Jawab wapas Content Script ko bhejo
            sendResponse({ success: true, data: data });
        });
        
        return true; // Wait karne ke liye
    }
});
```

### **Step 4: Styling (`content.css`) - Sundar Dikhna**
Jab result aata hai, wo ek sundar box me dikhna chahiye.

**Problem:** Flipkart text select nahi karne deta.
**Fix:** Humne CSS me zabardasti selection on kiya.
```css
/* Flipkart Force Fix */
* {
    user-select: text !important; /* Koi rok nahi sakta ab */
}

/* Result Box Design */
#fake-review-overlay {
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); /* Thoda 3D look */
    animation: slideIn 0.3s; /* Smooth entry */
}
```

---

## 4. 🛠️ Challenges & Solutions (Jo Problems Aayi Thi)

Hume banate waqt 3 badi problems aayi thi, unka solution ye tha:

1.  **CORS Error / Failed to Fetch**:
    *   *Problem:* Amazon (Secure HTTPS) se hum Localhost (Insecure HTTP) par data nahi bhej pa rahe the.
    *   *Solution:* Humne `background.js` ko beech me laya. Amazon -> Background JS -> Localhost API.

2.  **Flipkart Selection Block**:
    *   *Problem:* Flipkart pe text select hi nahi ho raha tha.
    *   *Solution:* Global CSS Rule `user-select: text !important` lagaya jo site ke rule ko tod deta hai.

3.  **Myntra Right Click Block**:
    *   *Problem:* Myntra pe right-click nahi chalta.
    *   *Solution:* Floating Action Button (FAB) banaya. Text select karte hi button khud aa jata hai, right click ki zarurat hi nahi.

---

## 5. 🎯 Final Summary

Humne ek **Content Script** banaya jo page pe changes karta hai (Button, Popup), aur ek **Background Script** banaya jo chupke se **Server (AI)** se baat karta hai. User ko bas text select karna hai, baaki technical kaam humara code sambhal leta hai.

Yahi hai pura extension development process! 🚀
