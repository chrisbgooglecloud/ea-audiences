-- =====================================================================================
-- Spanner Marketing Data Demo Queries
-- =====================================================================================
-- These queries demonstrate advanced Google Cloud Spanner capabilities including 
-- Vector Search (K-Nearest Neighbors) and Property Graph traversal, using the 
-- synthetic C360 and M360 marketing dataset.

-- -------------------------------------------------------------------------------------
-- 1. VECTOR SEARCH: Product Recommendations (Propensity Modeling)
-- -------------------------------------------------------------------------------------
-- Goal: Find the top 5 product recommendations for a specific customer based 
-- on their `purchase_propensity_embedding` using Cosine Distance.

SELECT 
    p.name AS Recommended_Product,
    p.category,
    p.price,
    COSINE_DISTANCE(c.purchase_propensity_embedding, p.product_embedding) AS propensity_distance_score
FROM 
    Customers c, 
    Products p
WHERE 
    -- Replace with a real customer_id from Customers.csv
    c.customer_id = (SELECT customer_id FROM Customers LIMIT 1) 
ORDER BY 
    propensity_distance_score ASC
LIMIT 5;

-- -------------------------------------------------------------------------------------
-- 2. IDENTITY RESOLUTION: Matching Anonymous Visitors to Known Customers
-- -------------------------------------------------------------------------------------
-- Goal: An anonymous visitor (cookie/device) has been consuming content. 
-- Find the top 3 known customers whose content preferences most closely match 
-- this anonymous profile.

SELECT 
    c.first_name, 
    c.last_name,
    c.email,
    COSINE_DISTANCE(a.content_preference_embedding, c.content_preference_embedding) AS similarity_score
FROM 
    AnonymousProfiles a, 
    Customers c
WHERE 
    -- Replace with a real anonymous_id from AnonymousProfiles.csv
    a.anonymous_id = (SELECT anonymous_id FROM AnonymousProfiles LIMIT 1)
ORDER BY 
    similarity_score ASC
LIMIT 3;

-- -------------------------------------------------------------------------------------
-- 3. SPANNER GRAPH: Collaborative Filtering / Cart Analysis
-- -------------------------------------------------------------------------------------
-- Goal: "People who bought X also bought Y". 
-- Find what other products were purchased by customers who bought a specific item.
-- Utilizes the `MarketingGraph` property graph defined in the schema.

GRAPH MarketingGraph
MATCH 
    (p1:Products) <-[:purchased_by_customer]- (c:Customers) -[:purchased_by_customer]-> (p2:Products)
WHERE 
    p1.name = 'Premium Whole Milk' -- Example starting product
    AND p1.product_id != p2.product_id
RETURN 
    p2.name AS Also_Bought_Product,
    COUNT(c.customer_id) AS Times_Bought_Together
ORDER BY 
    Times_Bought_Together DESC
LIMIT 10;

-- -------------------------------------------------------------------------------------
-- 4. SPANNER GRAPH: Content to Purchase Attribution
-- -------------------------------------------------------------------------------------
-- Goal: Find customers who consumed a specific piece of content (e.g., a recipe) 
-- and subsequently purchased products.

GRAPH MarketingGraph
MATCH 
    (a:ContentAssets) <-[:consumed_by_customer]- (c:Customers) -[:purchased_by_customer]-> (p:Products)
WHERE 
    a.topic_category = 'Recipe'
RETURN 
    a.title AS Content_Consumed,
    c.first_name,
    p.name AS Product_Purchased
LIMIT 15;

-- -------------------------------------------------------------------------------------
-- 5. TRADITIONAL SQL: At-Risk High-Value Customers
-- -------------------------------------------------------------------------------------
-- Goal: Identify "Platinum" loyalty members with a high churn risk so we can 
-- target them with a Winback campaign.

SELECT 
    first_name,
    last_name,
    email,
    lifetime_value_score,
    churn_risk_score
FROM 
    Customers
WHERE 
    loyalty_tier = 'Platinum' 
    AND churn_risk_score > 0.80
ORDER BY 
    lifetime_value_score DESC
LIMIT 10;
