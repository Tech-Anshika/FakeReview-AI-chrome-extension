# 🚀 FakeReview-AI: Complete Project Breakdown (Hinglish)

Yeh file poore project ka **Start-to-End Explanation** hai—ki yeh kaise kaam karta hai, kyu banaya gaya, aur iske piche ka logic kya hai.

---

## 1. 🏗️ Project Overview (Yeh Kya Hai?)

**FakeReview-AI** ek aisa tool hai jo **E-Commerce websites** (jaise *Amazon, Flipkart, Myntra*) par fake reviews ko pakadta hai.  
Iska main maqsad hai user ko batana ki jo review wo padh raha hai, kya wo **Genuine** hai ya **Fake/Bot-generated**.

### **🔥 Kaise Kaam Karta Hai? (Workflow)**

Pure project ka flow **4 simple steps** me kaam karta hai (Frontend se le kar AI Backend tak):

1.  **Frontend (Chrome Extension):**
    *   Jab aap kisi product page par text select karte hain, toh ek **Floating Button (🔍)** aata hai.
    *   Jaise hi aap button dabate hain, extension wo text **copy** karke turant humare **Backend Server** ko bhej deta hai.

2.  **Backend (FastAPI Server):**
    *   Humara server (`api/main.py`) us review text ko receive karta hai.
    *   Yeh server ek **"Bridge"** ka kaam karta hai jo Chrome Extension ko AI Model se jodta hai.

3.  **Intelligence Layer (Hybrid Analysis):**
    *   Yaha sabse important kaam hota hai. Humara system **do tarike (Hybrid)** se review check karta hai:
        *   **A. Text Analysis (DistilBERT AI Model):** Yeh check karta hai ki *likhne ka tarika* kaisa hai? Kya yeh insaan ne likha hai ya kisi bot ne? (e.g., generic lines like *"Good product buy it"*).
        *   **B. Behavior Analysis (Rules):** Yeh metadata check karta hai (agar available ho). Jaise:
            *   *Verified Purchase?* (Agar nahi, toh fake hone ke chance zyada hain).
            *   *Review Length vs Rating?* (Agar 5-star rating hai par text sirf "Nice" hai, toh suspicious hai).

4.  **Final Verdict (Result):**
    *   Dono scores (AI Score + Behavior Score) combine karke final result banta hai: **"Fake"** ya **"Genuine"**.
    *   Yeh result wapas Chrome Extension ko bheja jata hai jo user ko screen par dikhata hai.

---

## 2. 📊 Dataset Selection

Humne is project ke liye **Amazon Fake Review Dataset** (ya similar large-scale e-commerce dataset) use kiya hai.

### **🤔 Why this dataset? (Yehi kyu choose kiya?)**
1.  **Real World Data:** Isme real customers ke reviews hain, lab-generated text nahi.
2.  **Labeled Data:** Isme pehle se labels hain (`OR` = Original, `CG` = Computer Generated), jo Model Training (Supervised Learning) ke liye zaroori hai.
3.  **Verified Purchase Metadata:** Is dataset me yeh information hoti hai ki review likhne wale ne product kharida hai ya nahi. Yeh humare **Behavior Engine** ke liye bohot critical hai.

---

## 3. 🧠 Model Selection: DistilBERT

Humne is project me **DistilBERT (Distilled BERT)** model use kiya hai.

### **🤔 Why DistilBERT? (Market me toh aur bhi models hain like LSTM, BERT, RoBERTa?)**

| Model Feature | LSTM (Purana/Basic) | BERT (Bohot Bhaari) | **DistilBERT (Humara Choice)** |
| :--- | :--- | :--- | :--- |
| **Samajhne ki Shakti** | Kam (Word by Word padhta hai) | Sabse Zyada (Contextual) | **High (BERT jaisa hi smart)** |
| **Speed** | Fast | Slow (Heavy computation) | **60% Faster than BERT** |
| **Size** | Small | Huge (~440MB) | **40% Smaller (~260MB)** |
| **Performance** | Basic | Best | **Retains 97% accuracy of BERT** |

**Conclusion:**
Humne DistilBERT isliye choose kiya kyunki hume **Real-time Result** chahiye tha.
-   Agar hum **BERT** use karte, toh extension result dikhane me 2-3 second leta (Too slow for user experience).
-   **DistilBERT** wahi accuracy deta hai par millisecond me result deta hai, jo ek Chrome Extension ke liye perfect hai.

---

## 4. 🏆 Market Comparison (Hum Dusro Se Better Kaise Hain?)

Market me **Fakespot** aur **ReviewMeta** jaise bade tools pehle se hain.

**🔴 Unki Kami (Limitations):**
-   Woh zyadatar **Metadata/History** par depend karte hain (e.g., Is user ne pehle kitne review kiye? Kya uska account naya hai?).
-   Agar ek naya fake account banakar koi smart review likhe (jo human jaisa lage), toh wo pakad nahi paate kyunki purani history nahi hai.

**🟢 Humara Advantage (Hybrid Approach):**
Humara system **Hybrid** hai. Hum sirf history nahi dekhte, hum **Text ke pattern (Language)** ko bhi padhte hain.
-   Agar kisi ne "Verified Purchase" tag ke saath bhi fake review likha (jaise ChatGPT se likhwaya), toh humara **DistilBERT** model uske writing style ("Generic tone") ko pakad lega.
-   **Summary:**
    -   *Competitors:* Rely mostly on Stats.
    -   *Us:* Rely on **Stats + AI Content Analysis**.

---

## 5. 💻 Code Walkthrough (Technical Details)

Main files jo is project ko chalati hain aur unka kaam:

### **A. Training The AI (`training/train_bert.py`)**
Yaha humne model ko sikhaya (Train kiya):
```python
# Humne 'DistilBERT' model load kiya jo pehle se English janta hai
model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased")

# Isko apne data par train kiya taaki wo 'Fake' aur 'Original' me farak samjhe
trainer.train() 
```
*Concept:* **Transfer Learning**. Humne ek smart model (DistilBERT) liya aur usko "Review pehchanna" sikhaya, zero se start nahi kiya.

### **B. The Backend API (`api/main.py`)**
Yeh server hai jo request sunta hai aur jawab deta hai:
```python
# Model load karte hain (Local files se taaki offline bhi chale)
ort_session = ort.InferenceSession("models/distilbert_fake_review/model.onnx")

@app.post("/predict")
def predict(review):
    # Text ko numbers me convert (Tokenization)
    inputs = tokenizer(review.text)
    # Model se puchte hain "Fake hai ya Genuine?"
    prediction = ort_session.run(None, inputs)
    return prediction
```

### **C. Behavior Engine (`behavior/behavior_engine.py`)**
Yeh simple **Rules** check karta hai (Logic based):
```python
def calculate_behavior_score(row):
    score = 0
    # Rule 1: Agar kharida nahi hai, toh +25% Risk
    if not row["verified_purchase"]: 
        score += 25
    # Rule 2: 5-star rating hai par text bohot chota hai?
    if row["rating"] == 5 and len(row["text"]) < 30:
        score += 15
    return score
```

### **D. Chrome Extension (`content.js`)**
Yeh magic karta hai browser par (User Interface):
```javascript
// Jab user text select karta hai
document.addEventListener("selectionchange", () => {
    // Ek "Magnifying Glass 🔍" button banao
    showFab(); 
});

// Jab button dabe, toh backend ko call karo
function runCheck(text) {
    chrome.runtime.sendMessage({ action: "analyzeText", text: text });
}
```

---

### 🔥 Final Summary (Recap)
Humne industry-standard **Amazon Dataset** use karke ek fast aur accurate **DistilBERT** model train kiya. Isko humne ek **FastAPI Backend** se connect kiya aur **Chrome Extension** bana kar user tak pahunchaya. Humara **Hybrid Logic (AI + Behavior)** hume market competitors se behtar aur advanced banata hai.
