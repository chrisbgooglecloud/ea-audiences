# `04-commerce-media`: Commerce Media Network & 3D Frostbite Ads

**Lead Presenter**: Surya Kunju (`suryakunju@google.com`)  
**EBC Session**: Act 4 — RMN: Identity & Data Partnerships Breakout (3:30 PM - 4:15 PM)  
**Target EA Stakeholders**: Andrea Hopelain (SVP EA SPORTS), Evan Dexter (VP Franchise Strategy), Mark Cole (Sr. Director Asia Insights)  
**Strategic Theme**: Transforming in-game gameplay surfaces into a programmatic, brand-safe **Commerce Media Network** integrated directly into the Frostbite middleware.  

---

## 1. Executive Narrative & Demo Run-of-Show

### Act 4 Storyline (In-Game Dynamic Monetization)
1. **The Challenge**: In-game advertising historically meant static, hard-coded placements (e.g. unchangeable player boots or billboards). It was unmeasured, non-programmatic, and brand advertisers feared unscripted gameplay context (brand safety).
2. **The Solution**:
   - **Frostbite Middleware Programmatic Ad Server**: Real-time 3D ad insertion onto dynamic field-side hoardings, stadium jumbotrons, and roadside billboards.
   - **Self-Serve Advertiser Portal**: Allows enterprise brands (Nike, PlayStation, Mountain Dew) to book inventory targeted by regional DMAs (from Pat's Geo-Spine in `03-measurement`) and player state (from Jamie's Graph in `01-audiences`).
   - **Integral Ad Science (IAS) Multimodal Brand Safety**: Vision AI calculates exact **Camera Dwell Time** (seconds centered on screen) and context suitability, automatically adjusting attribution if unscripted gameplay (e.g. player collision) obstructs visibility.
3. **The Hand-Off**: Receives optimized budget allocations from Pat (`03-measurement` - Act 3) and emits verified impression telemetry back into BigQuery for closed-loop Meridian MMM modeling.

---

## 2. Dual-Interface Architecture

- **Specialized LOB Workspace**:
  - 3D Frostbite Stadium Simulation Canvas (Live ad switching from Nike $\rightarrow$ Mountain Dew).
  - Self-Serve Advertiser Campaign Builder & Audience DMA Selector.
  - IAS Camera Dwell Heatmap & Brand Suitability Inspector.
- **Single-Pane Feeder**: Streams ad network gross revenue, fill rates, and IAS verification scores to the Executive Command Center (`01-audiences`).

---

## 3. Two-Way Interface Contracts

- See [CONTRACT.md](CONTRACT.md) for inbound/outbound payload specifications with `03-measurement`, `01-audiences`, and `02-creative-insights`.
- See [DEPENDENCIES.md](DEPENDENCIES.md) for infrastructure and package requirements.
