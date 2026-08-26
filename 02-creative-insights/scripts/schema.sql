CREATE TABLE Customers (
    customer_id STRING(MAX) NOT NULL,
    first_name STRING(MAX),
    last_name STRING(MAX),
    email STRING(MAX),
    phone STRING(MAX),
    address STRING(MAX),
    loyalty_tier STRING(MAX),
    lifetime_value_score FLOAT64,
    churn_risk_score FLOAT64,
    household_id STRING(MAX),
    preferred_channel STRING(MAX),
    content_preference_embedding ARRAY<FLOAT64>,
    purchase_propensity_embedding ARRAY<FLOAT64>,
    price_sensitivity_embedding ARRAY<FLOAT64>
) PRIMARY KEY (customer_id);

CREATE TABLE AnonymousProfiles (
    anonymous_id STRING(MAX) NOT NULL,
    device_id STRING(MAX),
    cookie_id STRING(MAX),
    ip_address STRING(MAX),
    inferred_segment STRING(MAX),
    content_preference_embedding ARRAY<FLOAT64>,
    purchase_propensity_embedding ARRAY<FLOAT64>,
    price_sensitivity_embedding ARRAY<FLOAT64>
) PRIMARY KEY (anonymous_id);

CREATE TABLE Products (
    product_id STRING(MAX) NOT NULL,
    name STRING(MAX),
    category STRING(MAX),
    sub_category STRING(MAX),
    price FLOAT64,
    margin FLOAT64,
    product_embedding ARRAY<FLOAT64>
) PRIMARY KEY (product_id);

CREATE TABLE ContentAssets (
    asset_id STRING(MAX) NOT NULL,
    type STRING(MAX),
    title STRING(MAX),
    topic_category STRING(MAX),
    duration_mins FLOAT64,
    content_embedding ARRAY<FLOAT64>
) PRIMARY KEY (asset_id);

CREATE TABLE Campaigns (
    campaign_id STRING(MAX) NOT NULL,
    name STRING(MAX),
    channel STRING(MAX),
    objective STRING(MAX),
    target_segment STRING(MAX)
) PRIMARY KEY (campaign_id);

CREATE TABLE SupportTickets (
    ticket_id STRING(MAX) NOT NULL,
    topic STRING(MAX),
    resolution_status STRING(MAX),
    sentiment_score FLOAT64
) PRIMARY KEY (ticket_id);

-- Edge Tables
CREATE TABLE Purchases (
    purchase_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX),
    anonymous_id STRING(MAX),
    product_id STRING(MAX) NOT NULL,
    purchase_timestamp TIMESTAMP,
    discount_applied FLOAT64,
    quantity INT64
) PRIMARY KEY (purchase_id);

CREATE TABLE ViewedProducts (
    view_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX),
    anonymous_id STRING(MAX),
    product_id STRING(MAX) NOT NULL,
    view_timestamp TIMESTAMP,
    duration_seconds INT64
) PRIMARY KEY (view_id);

CREATE TABLE AbandonedCarts (
    cart_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX),
    anonymous_id STRING(MAX),
    product_id STRING(MAX) NOT NULL,
    abandon_timestamp TIMESTAMP,
    cart_value FLOAT64
) PRIMARY KEY (cart_id);

CREATE TABLE ConsumedContents (
    consumption_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX),
    anonymous_id STRING(MAX),
    asset_id STRING(MAX) NOT NULL,
    consume_timestamp TIMESTAMP,
    completion_percentage FLOAT64
) PRIMARY KEY (consumption_id);

CREATE TABLE InteractedWithCampaigns (
    interaction_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX) NOT NULL,
    campaign_id STRING(MAX) NOT NULL,
    interact_timestamp TIMESTAMP,
    action STRING(MAX)
) PRIMARY KEY (interaction_id);

CREATE TABLE ReviewedProducts (
    review_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX) NOT NULL,
    product_id STRING(MAX) NOT NULL,
    review_timestamp TIMESTAMP,
    rating INT64,
    review_text STRING(MAX),
    sentiment FLOAT64
) PRIMARY KEY (review_id);

CREATE TABLE FiledTickets (
    file_ticket_id STRING(MAX) NOT NULL,
    customer_id STRING(MAX) NOT NULL,
    ticket_id STRING(MAX) NOT NULL,
    file_timestamp TIMESTAMP
) PRIMARY KEY (file_ticket_id);

CREATE PROPERTY GRAPH MarketingGraph
  NODE TABLES (
    Customers,
    AnonymousProfiles,
    Products,
    ContentAssets,
    Campaigns,
    SupportTickets
  )
  EDGE TABLES (
    Purchases
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL purchased_by_customer,
    Purchases
      SOURCE KEY (anonymous_id) REFERENCES AnonymousProfiles (anonymous_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL purchased_by_anon,
    ViewedProducts
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL viewed_by_customer,
    ViewedProducts
      SOURCE KEY (anonymous_id) REFERENCES AnonymousProfiles (anonymous_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL viewed_by_anon,
    AbandonedCarts
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL abandoned_by_customer,
    AbandonedCarts
      SOURCE KEY (anonymous_id) REFERENCES AnonymousProfiles (anonymous_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL abandoned_by_anon,
    ConsumedContents
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (asset_id) REFERENCES ContentAssets (asset_id)
      LABEL consumed_by_customer,
    ConsumedContents
      SOURCE KEY (anonymous_id) REFERENCES AnonymousProfiles (anonymous_id)
      DESTINATION KEY (asset_id) REFERENCES ContentAssets (asset_id)
      LABEL consumed_by_anon,
    InteractedWithCampaigns
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (campaign_id) REFERENCES Campaigns (campaign_id)
      LABEL interacted,
    ReviewedProducts
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (product_id) REFERENCES Products (product_id)
      LABEL reviewed,
    FiledTickets
      SOURCE KEY (customer_id) REFERENCES Customers (customer_id)
      DESTINATION KEY (ticket_id) REFERENCES SupportTickets (ticket_id)
      LABEL filed
  );
