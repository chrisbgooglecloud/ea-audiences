# Electronic Arts (EA) — UI & Visual Design Guidelines

## 1. Visual Aesthetic & Design Pillars

When building software for EA teams, the interface should reflect the following visual principles from the brand book:

*   **Electric Cobalt Precision:** Data points, active states, key metrics, and primary CTAs should utilize sharp, vibrant cobalt accents against dark, high-contrast surfaces.
*   **Geometric Futurism:** Clean, structured geometric layouts, crisp grid systems, subtle angular elements, and precise component alignments.
*   **High-Tech Polish:** Dark-themed elevation layers, refined 1px borders, subtle surface gradients, and sleek data visualizations.
*   **Structured Global Authority:** Professional data density, clear hierarchy, high readability, and clean tabular formatting.

---

## 2. Color Palette & Token System

### Core Brand Colors

| Color Name | Hex | RGB | HSL | UI Role |
| :--- | :--- | :--- | :--- | :--- |
| **Navy Ink** | `#16263A` | `22, 38, 58` | `213°, 45%, 16%` | Primary background, navigation bars, elevated containers/cards |
| **Ocean Blue** | `#0072BC` | `0, 114, 188` | `204°, 100%, 37%` | Primary accent, active tabs, buttons, links, chart highlights |
| **Jet Black** | `#000000` | `0, 0, 0` | `0°, 0%, 0%` | Deep background, contrast surfaces, dark badges |
| **Pure White** | `#FFFFFF` | `255, 255, 255` | `0°, 0%, 100%` | Primary text on dark UI, card surface on light UI, icon highlights |

---

### Extended UI & Data Reporting Palette (Recommended)

To support dashboards, charts, status tags, and metrics while staying within EA's dark/cobalt theme:

*   **Surface Elevation (Dark Navy Base):** `#0E1A29` (Canvas) $\rightarrow$ `#16263A` (Cards/Panels) $\rightarrow$ `#1E334D` (Hover/Active)
*   **Borders / Dividers:** `rgba(255, 255, 255, 0.08)` or `#253D5B`
*   **Secondary / Muted Text:** `#8FA3BC` or `#A0B2C6`
*   **Data Status Colors:**
    *   **Success / Positive:** `#00C48C` (Electric Mint)
    *   **Warning / Attention:** `#FFB800` (Amber)
    *   **Critical / Negative:** `#FF4560` (Electric Red)
    *   **Info / Neutral Accent:** `#0072BC` (EA Ocean Blue)

---

## 3. Typography & Hierarchy

### Typeface Roles

*   **Primary Display / Headers:** `bfheading` (EA custom heading font)
    *   *Web Fallbacks / Substitutes:* **DIN Next LT Pro**, **Rajdhani**, **Barlow Semi Condensed**, or **Montserrat (Bold/SemiBold)**.
    *   *Usage:* Page titles, metric values, KPI totals, dashboard headers, section banners.
*   **Secondary / UI Body & Data:** `bfutility` (EA custom utility font)
    *   *Web Fallbacks / Substitutes:* **Inter**, **Roboto**, or **system-ui / -apple-system**.
    *   *Usage:* Table cells, chart labels, filters, navigation links, metadata, body text.

### Type Scale & Hierarchy

| Element | Font Weight | Size | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard Title / KPI Hero** | Bold / 700 | `28px – 32px` | `1.2` | `-0.02em` |
| **Section Header (H2)** | Bold / 600 | `20px – 24px` | `1.3` | `-0.01em` |
| **Card / Widget Title (H3)** | SemiBold / 600 | `14px – 16px` | `1.4` | `0.02em` (UPPERCASE optional) |
| **Data Metric / Value** | Bold / 700 | `24px – 28px` | `1.1` | `normal` (Tabular numbers) |
| **Body / Table Content** | Regular / 400 | `13px – 14px` | `1.5` | `normal` |
| **Captions / Meta / Labels** | Medium / 500 | `11px – 12px` | `1.4` | `0.04em` |

> **Dashboard Tip:** Always apply `font-variant-numeric: tabular-nums;` on table numbers and KPI counters to prevent layout shifting during real-time data refreshes.

---

## 4. Logo & Brand Asset Rules

*   **EA Badge Variants:**
    *   *Dark UI:* White EA monogram inside a Jet Black or Navy Ink circle with a subtle 1px border.
    *   *Light UI:* Black EA monogram inside a Pure White circle.
*   **Minimum Size:** Never render the logo smaller than **`80px` (or `0.83 in`) wide** on screen.
*   **Clear Space:** Maintain at least **`10px` of padding/clear space** on all sides free of text, borders, or other UI components.

---

## 5. UI Component Styling Guidelines

### 1. Dashboard Layout & Containers
*   **Theme Foundation:** Dark theme (`#0E1A29` canvas with `#16263A` cards) delivers the authentic EA game-tech feel.
*   **Card Styling:**
    *   Background: `#16263A`
    *   Border: `1px solid rgba(255, 255, 255, 0.08)` or `#223851`
    *   Border Radius: `6px` to `8px` (keep corners slightly crisp, avoid hyper-rounded pills).
    *   Shadow: Subtle drop shadows `0 4px 20px rgba(0, 0, 0, 0.35)`.

### 2. Buttons & Interactive Controls
*   **Primary Action (Export, Run Report, Apply Filter):**
    *   Background: `#0072BC` (Ocean Blue)
    *   Text: `#FFFFFF`
    *   Hover: `#008BE6` with subtle electric blue glow (`box-shadow: 0 0 12px rgba(0, 114, 188, 0.4)`).
*   **Secondary / Outlined:**
    *   Background: `transparent`
    *   Border: `1px solid #1E334D`
    *   Text: `#FFFFFF`
    *   Hover: Background `rgba(255, 255, 255, 0.05)`, Border `#0072BC`.

### 3. Data Tables & Grids
*   **Header Row:** Darker backdrop (`#0E1A29`), text in `#8FA3BC`, uppercase `11px`, letter spacing `0.05em`.
*   **Row Dividers:** `1px solid rgba(255, 255, 255, 0.05)`.
*   **Hover State:** Background `rgba(0, 114, 188, 0.08)` with a left border highlight (`2px solid #0072BC`).

### 4. Charts & Data Visualizations
*   **Primary Series:** `#0072BC` (Ocean Blue)
*   **Secondary Series:** `#00C48C` (Teal/Mint), `#8A2BE2` (Electric Violet), `#FFB800` (Gold)
*   **Grid Lines:** `rgba(255, 255, 255, 0.06)`
*   **Tooltips:** Jet Black background (`#000000`), white text, 1px Ocean Blue border.

---

## 6. Ready-to-Use CSS Variables

```css
:root {
  /* EA Brand Core */
  --ea-navy-ink: #16263A;
  --ea-ocean-blue: #0072BC;
  --ea-ocean-blue-hover: #008BE6;
  --ea-jet-black: #000000;
  --ea-pure-white: #FFFFFF;

  /* UI Canvas & Surfaces */
  --ea-bg-canvas: #0E1A29;
  --ea-bg-surface: #16263A;
  --ea-bg-surface-elevated: #1E334D;
  --ea-border-subtle: rgba(255, 255, 255, 0.08);
  --ea-border-active: #0072BC;

  /* Typography */
  --ea-font-heading: "bfheading", "DIN Next", "Rajdhani", "Barlow Semi Condensed", sans-serif;
  --ea-font-body: "bfutility", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  --ea-text-primary: #FFFFFF;
  --ea-text-secondary: #8FA3BC;
  --ea-text-muted: #5C728C;

  /* Status Colors */
  --ea-status-success: #00C48C;
  --ea-status-warning: #FFB800;
  --ea-status-danger: #FF4560;

  /* Layout Constants */
  --ea-radius-sm: 4px;
  --ea-radius-md: 8px;
  --ea-shadow-card: 0 4px 20px rgba(0, 0, 0, 0.35);
  --ea-glow-accent: 0 0 14px rgba(0, 114, 188, 0.35);
}
```