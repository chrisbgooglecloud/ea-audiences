import os
import csv
import json
import random
import uuid
from datetime import datetime, timedelta

# Configuration
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'spanner_marketing')
os.makedirs(OUTPUT_DIR, exist_ok=True)

NUM_CUSTOMERS = 500
NUM_ANONYMOUS = 1000
NUM_PRODUCTS = 100
NUM_ASSETS = 50
NUM_CAMPAIGNS = 10
NUM_TICKETS = 80
EMBEDDING_DIM = 128

# Mock Data Lists for Realism
FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]
LOCATIONS = [
    ("New York", "NY"), ("Los Angeles", "CA"), ("Chicago", "IL"), ("Houston", "TX"), ("Phoenix", "AZ"), 
    ("Philadelphia", "PA"), ("San Antonio", "TX"), ("San Diego", "CA"), ("Dallas", "TX"), ("San Jose", "CA"), 
    ("Austin", "TX"), ("Jacksonville", "FL"), ("Fort Worth", "TX"), ("Columbus", "OH"), ("San Francisco", "CA"), 
    ("Charlotte", "NC"), ("Indianapolis", "IN"), ("Seattle", "WA"), ("Denver", "CO"), ("Washington", "DC"),
    ("Boston", "MA"), ("Nashville", "TN"), ("Detroit", "MI"), ("Las Vegas", "NV"), ("Portland", "OR"),
    ("Atlanta", "GA"), ("Miami", "FL"), ("Orlando", "FL"), ("Raleigh", "NC"), ("Minneapolis", "MN")
]
STREETS = ["Main St", "Oak St", "Pine St", "Maple Ave", "Cedar Ln", "Elm St", "Washington St", "Lake St", "Hill St", "Park Ave", "Walnut St", "Spring St", "North Ave", "Highland Ave", "Sunset Blvd"]

CPG_CATEGORIES = {
    "Dairy & Eggs": ["Whole Milk", "2% Milk", "Almond Milk", "Oat Milk", "Cheddar Cheese", "Mozzarella Cheese", "Butter", "Greek Yogurt", "Free-Range Eggs", "Large Brown Eggs", "Sour Cream", "Cream Cheese"],
    "Meat & Seafood": ["Chicken Breast", "Ground Beef", "Bacon", "Pork Chops", "Turkey Breast", "Sausage", "Hot Dogs", "Salmon Fillet", "Shrimp", "Canned Tuna"],
    "Pantry": ["Cereal", "Oatmeal", "Spaghetti", "Penne Pasta", "Jasmine Rice", "Canned Black Beans", "Peanut Butter", "Strawberry Jelly", "Whole Wheat Bread", "All-Purpose Flour", "Granulated Sugar", "Extra Virgin Olive Oil", "Tomato Sauce"],
    "Snacks": ["Potato Chips", "Pretzels", "Microwave Popcorn", "Cheese Crackers", "Chocolate Chip Cookies", "Milk Chocolate Bar", "Mixed Nuts", "Fruit Snacks", "Granola Bars"],
    "Beverages": ["Orange Juice", "Apple Juice", "Cola Soda", "Sparkling Water", "Whole Bean Coffee", "Ground Coffee", "Green Tea Bags", "Black Tea Bags", "Sports Drink"],
    "Personal Care": ["Shampoo", "Conditioner", "Toothpaste", "Body Wash", "Deodorant", "Hand Lotion", "Shaving Cream", "Disposable Razors"],
    "Home Care": ["Laundry Detergent", "Dish Soap", "Paper Towels", "Toilet Paper", "Trash Bags", "All-Purpose Cleaner", "Glass Cleaner", "Sponges"]
}

CONTENT_TOPICS = ["Recipe", "Nutrition Tips", "Home Organization", "Product Comparison", "Sustainability", "Wellness", "Family Life"]
CONTENT_TITLES = [
    "10 Best Chicken Breast Recipes", "How to Organize Your Pantry", "Whole Milk vs Almond Milk: Which is Better?", 
    "5 Quick Breakfast Ideas for Busy Mornings", "The Ultimate Grilling Guide", "Unexpected Health Benefits of Olive Oil", 
    "DIY Cleaning Hacks Using Household Items", "How to Pick the Freshest Seafood", "A Guide to Decoding Nutrition Labels", 
    "Top 5 Snacks for Kids' Lunchboxes", "How to Store Fresh Produce", "Coffee Brewing 101", 
    "Eco-Friendly Home Care Tips", "Baking Basics: Flour and Sugar", "Healthy Alternatives to Soda",
    "Creative Uses for Greek Yogurt", "Mastering the Perfect Steak", "Building a Better Sandwich"
]

# Helper Functions
def generate_embedding(centroid=None, noise_level=0.1):
    if centroid is None:
        return [random.random() for _ in range(EMBEDDING_DIM)]
    else:
        # Add some random noise to centroid
        return [c + random.gauss(0, noise_level) for c in centroid]

# Persona Centroids (for clustered embeddings)
PERSONA_CENTROIDS = {
    "Bargain Hunter": {
        "content": [random.random() for _ in range(EMBEDDING_DIM)],
        "purchase": [random.random() for _ in range(EMBEDDING_DIM)],
        "price": [random.random() * 0.5 for _ in range(EMBEDDING_DIM)]
    },
    "Premium/Organic Shopper": {
        "content": [random.random() for _ in range(EMBEDDING_DIM)],
        "purchase": [random.random() for _ in range(EMBEDDING_DIM)],
        "price": [random.random() * 1.5 for _ in range(EMBEDDING_DIM)]
    },
    "Loyal Family Shopper": {
        "content": [random.random() for _ in range(EMBEDDING_DIM)],
        "purchase": [random.random() for _ in range(EMBEDDING_DIM)],
        "price": [random.random() for _ in range(EMBEDDING_DIM)]
    }
}

def to_spanner_array(arr):
    # Format array for CSV import to Spanner
    return json.dumps(arr)

def random_date(start_days_ago=365):
    end = datetime.now()
    start = end - timedelta(days=start_days_ago)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def write_csv(filename, fieldnames, data):
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"Generated {filepath} ({len(data)} records)")

def main():
    print("Generating Synthetic CPG Marketing Data...")

    # --- Nodes ---
    
    # 1. Customers
    customers = []
    households = [str(uuid.uuid4()) for _ in range(NUM_CUSTOMERS // 2)]
    
    for i in range(NUM_CUSTOMERS):
        persona_name = random.choice(list(PERSONA_CENTROIDS.keys()))
        centroid = PERSONA_CENTROIDS[persona_name]
        cid = str(uuid.uuid4())
        
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        email = f"{first.lower()}.{last.lower()}{random.randint(1,999)}@demofake.com"
        
        city, state = random.choice(LOCATIONS)
        street = f"{random.randint(100, 9999)} {random.choice(STREETS)}"
        address = f"{street}, {city}, {state} {random.randint(10000, 99999)}"
        
        customers.append({
            "customer_id": cid,
            "first_name": first,
            "last_name": last,
            "email": email,
            "phone": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
            "address": address,
            "loyalty_tier": random.choice(["None", "Silver", "Gold", "Platinum"]),
            "lifetime_value_score": round(random.uniform(50, 5000), 2),
            "churn_risk_score": round(random.uniform(0, 1), 2),
            "household_id": random.choice(households),
            "preferred_channel": random.choice(["Email", "SMS", "Push"]),
            "content_preference_embedding": to_spanner_array(generate_embedding(centroid["content"])),
            "purchase_propensity_embedding": to_spanner_array(generate_embedding(centroid["purchase"])),
            "price_sensitivity_embedding": to_spanner_array(generate_embedding(centroid["price"]))
        })

    # 2. Anonymous Profiles
    anonymous_profiles = []
    for _ in range(NUM_ANONYMOUS):
        persona_name = random.choice(list(PERSONA_CENTROIDS.keys()))
        centroid = PERSONA_CENTROIDS[persona_name]
        
        anonymous_profiles.append({
            "anonymous_id": str(uuid.uuid4()),
            "device_id": str(uuid.uuid4())[:16],
            "cookie_id": str(uuid.uuid4()),
            "ip_address": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
            "inferred_segment": persona_name,
            "content_preference_embedding": to_spanner_array(generate_embedding(centroid["content"])),
            "purchase_propensity_embedding": to_spanner_array(generate_embedding(centroid["purchase"])),
            "price_sensitivity_embedding": to_spanner_array(generate_embedding(centroid["price"]))
        })

    # 3. Products
    products = []
    all_cpg_items = [(cat, item) for cat, items in CPG_CATEGORIES.items() for item in items]
    
    for i in range(NUM_PRODUCTS):
        cat, sub_cat = random.choice(all_cpg_items)
        brand_prefix = random.choice(["Fresh", "Nature's", "Essential", "Premium", "Everyday", "Organic"])
        
        products.append({
            "product_id": str(uuid.uuid4()),
            "name": f"{brand_prefix} {sub_cat}",
            "category": cat,
            "sub_category": sub_cat,
            "price": round(random.uniform(1.50, 25.00), 2),
            "margin": round(random.uniform(0.05, 0.40), 2),
            "product_embedding": to_spanner_array(generate_embedding())
        })

    # 4. Content Assets
    assets = []
    for i in range(NUM_ASSETS):
        assets.append({
            "asset_id": str(uuid.uuid4()),
            "type": random.choice(["Blog", "Video", "Article"]),
            "title": random.choice(CONTENT_TITLES) + f" (Vol {random.randint(1, 10)})",
            "topic_category": random.choice(CONTENT_TOPICS),
            "duration_mins": round(random.uniform(2, 15), 1),
            "content_embedding": to_spanner_array(generate_embedding())
        })

    # 5. Campaigns
    campaigns = []
    for i in range(NUM_CAMPAIGNS):
        campaigns.append({
            "campaign_id": str(uuid.uuid4()),
            "name": f"{random.choice(['Summer', 'Winter', 'Back to School', 'Holiday', 'Spring'])} CPG Promo {i}",
            "channel": random.choice(["Email", "Social", "Display"]),
            "objective": random.choice(["Acquisition", "Retention", "Winback"]),
            "target_segment": random.choice(list(PERSONA_CENTROIDS.keys()))
        })

    # 6. Support Tickets
    tickets = []
    for i in range(NUM_TICKETS):
        tickets.append({
            "ticket_id": str(uuid.uuid4()),
            "topic": random.choice(["Expired Product", "Missing Item in Delivery", "Damaged Packaging", "Question about Ingredients", "Billing Error"]),
            "resolution_status": random.choice(["Open", "Resolved", "Closed"]),
            "sentiment_score": round(random.uniform(-1, 0.5), 2)
        })

    # --- Edges (Interactions) ---
    purchases = []
    viewed_products = []
    abandoned_carts = []
    consumed_contents = []
    interacted_campaigns = []
    reviewed_products = []
    filed_tickets = []

    def get_random_user():
        is_known = random.random() > 0.4
        return (random.choice(customers)["customer_id"], "") if is_known else ("", random.choice(anonymous_profiles)["anonymous_id"])

    for _ in range(NUM_CUSTOMERS * 15): # slightly more events
        c_id, a_id = get_random_user()
        p_id = random.choice(products)["product_id"]
        
        if random.random() > 0.7:
            purchases.append({
                "purchase_id": str(uuid.uuid4()),
                "customer_id": c_id,
                "anonymous_id": a_id,
                "product_id": p_id,
                "purchase_timestamp": random_date().isoformat() + "Z",
                "discount_applied": round(random.uniform(0, 0.3), 2),
                "quantity": random.randint(1, 5)
            })
            
            if c_id and random.random() > 0.8:
                reviewed_products.append({
                    "review_id": str(uuid.uuid4()),
                    "customer_id": c_id,
                    "product_id": p_id,
                    "review_timestamp": random_date(start_days_ago=30).isoformat() + "Z",
                    "rating": random.randint(3, 5), # CPGs usually higher ratings
                    "review_text": random.choice(["Tastes great!", "Will buy again.", "Good quality.", "My family loves this.", "A bit pricey, but good.", "Staple in our house."]),
                    "sentiment": round(random.uniform(0, 1), 2)
                })

        viewed_products.append({
            "view_id": str(uuid.uuid4()),
            "customer_id": c_id,
            "anonymous_id": a_id,
            "product_id": p_id,
            "view_timestamp": random_date().isoformat() + "Z",
            "duration_seconds": random.randint(5, 120)
        })

        if random.random() > 0.85:
            abandoned_carts.append({
                "cart_id": str(uuid.uuid4()),
                "customer_id": c_id,
                "anonymous_id": a_id,
                "product_id": p_id,
                "abandon_timestamp": random_date().isoformat() + "Z",
                "cart_value": round(random.uniform(5, 150), 2)
            })
            
        consumed_contents.append({
            "consumption_id": str(uuid.uuid4()),
            "customer_id": c_id,
            "anonymous_id": a_id,
            "asset_id": random.choice(assets)["asset_id"],
            "consume_timestamp": random_date().isoformat() + "Z",
            "completion_percentage": round(random.uniform(0.1, 1.0), 2)
        })

    for _ in range(NUM_CUSTOMERS * 3):
        c_id = random.choice(customers)["customer_id"]
        interacted_campaigns.append({
            "interaction_id": str(uuid.uuid4()),
            "customer_id": c_id,
            "campaign_id": random.choice(campaigns)["campaign_id"],
            "interact_timestamp": random_date().isoformat() + "Z",
            "action": random.choice(["Opened", "Clicked", "Ignored"])
        })

    for t in tickets:
        c_id = random.choice(customers)["customer_id"]
        filed_tickets.append({
            "file_ticket_id": str(uuid.uuid4()),
            "customer_id": c_id,
            "ticket_id": t["ticket_id"],
            "file_timestamp": random_date().isoformat() + "Z"
        })

    # --- Writing Files ---
    write_csv("Customers.csv", customers[0].keys(), customers)
    write_csv("AnonymousProfiles.csv", anonymous_profiles[0].keys(), anonymous_profiles)
    write_csv("Products.csv", products[0].keys(), products)
    write_csv("ContentAssets.csv", assets[0].keys(), assets)
    write_csv("Campaigns.csv", campaigns[0].keys(), campaigns)
    write_csv("SupportTickets.csv", tickets[0].keys(), tickets)
    
    write_csv("Purchases.csv", purchases[0].keys(), purchases)
    write_csv("ViewedProducts.csv", viewed_products[0].keys(), viewed_products)
    if abandoned_carts: write_csv("AbandonedCarts.csv", abandoned_carts[0].keys(), abandoned_carts)
    write_csv("ConsumedContents.csv", consumed_contents[0].keys(), consumed_contents)
    write_csv("InteractedWithCampaigns.csv", interacted_campaigns[0].keys(), interacted_campaigns)
    if reviewed_products: write_csv("ReviewedProducts.csv", reviewed_products[0].keys(), reviewed_products)
    write_csv("FiledTickets.csv", filed_tickets[0].keys(), filed_tickets)

    print("Done! All CPG files written to data/spanner_marketing/")

if __name__ == "__main__":
    main()
