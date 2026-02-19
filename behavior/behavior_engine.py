# behavior/behavior_engine.py

def calculate_behavior_score(row):
    """
    Calculate behavior-based risk score for a single review
    Returns: score (0–100) and reasons (list)
    """
    
    # Initialize Factors
    rating_deviation_score = 0
    verified_purchase_score = 0
    review_time_score = 0
    user_pattern_score = 0
    
    reasons = []

    # 1️⃣ Verified purchase
    # If explicitly False (unverified), add risk.
    if "verified_purchase" in row and row["verified_purchase"] is False:
        # Platform Adaptive Weighting
        vp_weight = 25
        if "domain" in row and row["domain"] and "myntra" in row["domain"].lower():
             vp_weight = 5
             
        verified_purchase_score += vp_weight
        reasons.append(f"Unverified purchase (+{vp_weight})")

    # 2️⃣ User Pattern: Helpful votes (10 pts)
    # If 0 helpful votes, slight risk.
    if "helpful_vote" in row and row["helpful_vote"] == 0:
        user_pattern_score += 10
        reasons.append("No helpful votes")

    # 3️⃣ Rating Deviation: Rating vs Text Length (15 pts)
    # 5-star rating with very short text (< 30 chars).
    if "rating" in row and "text" in row:
        rating_val = row["rating"]
        text_val = str(row["text"])
        if rating_val == 5 and len(text_val) < 30:
            rating_deviation_score += 15
            reasons.append("Very short 5-star review")

    # 4️⃣ User Pattern: Review Burst (30 pts)
    if "user_review_burst" in row and row["user_review_burst"] is True:
        user_pattern_score += 30
        reasons.append("Suspicious review burst behavior")

    # Review Time (Placeholder for future logic)
    # Currently 0 as per existing model logic.
    if "review_time" in row and row["review_time"]:
        pass # Logic can be added here

    # Calculate Total
    total_score = rating_deviation_score + verified_purchase_score + review_time_score + user_pattern_score
    total_score = min(total_score, 100)

    # Detailed Logging
    print("\n[Behavior Analysis]")
    print(f"rating_deviation={rating_deviation_score}")
    print(f"verified_purchase={verified_purchase_score}")
    print(f"review_time={review_time_score}")
    print(f"user_pattern={user_pattern_score}")
    print(f"TOTAL_BEHAVIOR={total_score}\n")

    return total_score, reasons
