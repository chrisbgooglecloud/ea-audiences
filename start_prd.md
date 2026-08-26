# **Product Requirements Document (PRD)**

**Product Name:** Engagement Intelligence Engine (EA Marketing EBC Demo)  
**Target Audience:** EA Marketing Executives (Google Cloud Executive Briefing Center)  
**Objective:** Deliver a highly interactive, visually striking "command center" demo that showcases how Google Cloud (Spanner Graph, BigQuery, Gemini 3.6 Flash, and Vertex AI Agent Builder) can unify fragmented player identities, trigger real-time contextual marketing, and simulate campaign performance using multi-agent synthetic testing.

## **1\. Executive Summary**

The Engagement Intelligence Engine is a proof-of-concept web application designed to demonstrate the future of gaming marketing. It moves away from static dashboards into an interactive, physics-based graph UI. The platform will ingest pre-generated player telemetry and identity data to simulate real-time situational triggers, utilize natural language for audience creation, and deploy "DeepSona" synthetic AI agents to score and debate campaign effectiveness before launch.

## **2\. User Interface & Experience** 

The visual layer is the core of the EBC "wow" factor. It must utilize a WebGL/Canvas-based force-directed graph (e.g., react-force-graph) to ensure smooth rendering of thousands of nodes without browser lag.

### **2.1 Visual Aesthetic**

* **Theme:** Dark mode, cyberpunk/sci-fi aesthetic with glowing nodes and contrasting edge colors.  
* **Nodes:** Represent Player Identities (EA ID, XUID, PSN ID), Game Titles, Clans/Guilds, and Marketing Offers.  
* **Edges:** Represent relationships (e.g., "Played", "Part of Clan", "Purchased").  
* **Animations:** Use animated particle paths ("Energy Streams") along edges to visualize dynamic situational triggers (e.g., a path lighting up between a frustrated player and a specific microtransaction).

### **2.2 Core UI Components**

* **Top Navigation / Filter Bar:** Dropdowns to filter the graph by *Player Cohorts* (e.g., Whales, Churn-Risk), *Game Titles* (Apex Legends, FC 25), and *Playstyles*.  
* **Main Stage:** The interactive 2D/3D force-directed graph visualization.  
* **Selected Entity Panel (Right Sidebar):** Clicking a node reveals its properties. For player nodes, this displays their resolved identity graph, playstyle heatmap, and the DeepSona Synthetic Persona summary.  
* **NL Search Bar (Bottom/Top overlay):** A natural language input field driven by Gemini 3.6 Flash to build audiences via conversational prompts.  
* **Simulation Clock (Global Control):** A "Play/Pause" widget that steps through pre-generated data timestamps, simulating real-time event ingestion for the audience.

## **3\. Core Functional Requirements**

### **3.1 GraphDB Identity & Segmentation Views**

The UI must support switching between four distinct contextual graph views:

* **Single Player:** Resolving one user's fragmented identities (XUID, PSN, EA ID) into a core node.  
* **Single Player \- Multiple Titles:** Showing the above identity spanning across multiple EA games (cross-franchise migration).  
* **Multiplayer Cohorts \- Multiple Titles:** Grouping players by social connections (clans/guilds) across different games.  
* **Building Audience Segments:** The macro view showing clusters of players based on shared attributes and playstyles.

### **3.2 Natural Language Audience Builder**

* **Input:** User types a query (e.g., "Find me players who play aggressively on weekends and complain about matchmaking").  
* **Processing:** Gemini 3.6 Flash translates the prompt into a semantic Vector Search combined with a Spanner GQL (Graph Query Language) query.  
* **Output:** The graph dynamically re-clusters to highlight the matching audience, and the UI displays an estimated audience size.

### **3.3 Dynamic Situational Triggers**

* **Functionality:** Simulates AMEX-style real-time contextual marketing.  
* **Triggers:**  
  * *High Frustration:* Detects 3 consecutive match losses within a short time window.  
  * *Occasion-Based:* Detects weekend evening play windows.  
* **Visual Output:** When a trigger condition is met via the Simulation Clock, the graph isolates the affected players and fires "Energy Streams" (animated edges) pointing toward a recommended action/offer node.

### **3.4 Synthetic Testing (DeepSona Framework)**

Powered by Vertex AI Agent Builder, simulating player reactions before campaign launch.

* **Debate Agents:** Multi-agent simulation initialized with Reddit/Discord community personas. They debate pricing or cosmetic offers to surface potential "sentiment decay" prior to launch.  
* **Scoring Agents:** Agents grounded in historical Spanner Graph data that evaluate conversion lift (e.g., analyzing the success probability of offering a $20 Legendary Skin to a casual vs. hardcore segment).

### **3.5 Brief Creation**

* **Functionality:** Upon concluding the synthetic tests and audience building, a Gemini-powered agent generates a structured, downloadable Marketing Campaign Brief summarizing the target audience, expected sentiment, predicted conversion lift, and recommended triggers.

## **4\. Technical Architecture (Google Cloud Stack)**

### **4.1 Data & Database Layer**

* **Primary Database:** **Spanner Graph** for serving the operational backend, node relationships, and executing fast GQL queries for the UI.  
* **Analytics Integration:** **BigQuery** connected via Data Boost for massive audience sizing without impacting the operational graph's performance.  
* **Search:** Vector Embeddings stored natively as Spanner Graph node properties to facilitate the natural language audience builder.

### **4.2 AI & Logic Layer**

* **Core LLM:** **Gemini 3.6 Flash** for fast natural language-to-GQL translation and brief generation.  
* **Multi-Agent System:** **Gemini Enterprise Agent Platform (Agent Development Kit)** to orchestrate the Debate and Scoring agents, enforcing rules, persona grounding, and inter-agent communication.

### **4.3 App & API Layer**

* **Frontend:** React / Next.js utilizing react-force-graph for the visual engine.  
* **Backend API:** Node.js/Python hosted on **Cloud Run** to act as the middleware between the frontend UI, Spanner, and Vertex AI.

## **5\. Data Strategy (Pre-Generated vs. Streaming)**

To maximize reliability and velocity for the EBC demo, live event streaming (Pub/Sub \+ Dataflow) is explicitly **out of scope**.

* **Offline Generation:** A massive, realistic dataset of players, clans, match histories, and synthetic chat logs will be generated offline (using Python libraries like Faker and NetworkX) and pre-loaded into Spanner Graph and BigQuery.  
* **Time-Series Playback:** The "Real-Time" illusion for the Dynamic Triggers is achieved via a frontend "Simulation Clock" that polls the database using an incrementing timestamp, triggering UI animations when conditions in the static data are sequentially met.