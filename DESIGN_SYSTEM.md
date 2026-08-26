# 🎨 EA Design System & Theme Spec

**Aesthetic**: Apple Dark Glassmorphism + Gaming HUD (Clean, high-contrast, dark-mode first).

---

## 1. 🌑 Base & Surface Colors

| Token | Hex / Value | Description |
| :--- | :--- | :--- |
| **Canvas Background** | `#080A0E` | Global deep dark background |
| **Glass Panel** | `rgba(18, 22, 30, 0.65)` | Translucent card with `backdrop-blur: 24px` |
| **Modal / Drawer** | `rgba(14, 17, 24, 0.92)` | Heavy overlay surface |
| **Border Stroke** | `rgba(255, 255, 255, 0.08)` | Standard 1px container border |
| **Specular Top Border** | `rgba(255, 255, 255, 0.20)` | 1px top highlight for glass sheen |

---

## 2. 🎮 Franchise Neon Accents

| Franchise | Hex | Color Name | Key Usage |
| :--- | :--- | :--- | :--- |
| **EA SPORTS FC 25** | `#E6FF00` | **Electric Volt** | FC 25 nodes, pack highlights |
| **Apex Legends** | `#00F0FF` | **Cyber Cyan** | Predator badges, legend nodes |
| **Madden NFL 25** | `#00FF88` | **Neon Field Green** | MUT cards, superstar abilities |
| **Battlefield 2042** | `#FF7A00` | **Warfare Orange** | SPM badges, Conquest nodes |
| **The Sims 4** | `#A855F7` | **Plumbob Purple** | Expansion DLC, build catalog |

---

## 3. 🚦 Status & Metric Signals

| Signal | Hex | Purpose |
| :--- | :--- | :--- |
| **HUD Gold** | `#FFB800` | Whales ($1k+ LTV), Return on spend (`2.45x`), Currency Vaults |
| **Emerald Green** | `#10B981` | Sales Lift (`+28.5%`), positive sentiment |
| **Bright Cyan** | `#06B6D4` | Player Retention (`+34.2%`), loss shields |
| **Tilt Pink/Red** | `#FF4757` | Loss streaks (3+), tilt sensitivity > 70%, churn risk |

---

## 4. 🔤 Typography & Micro-Interactions

* **Primary Font**: `"SF Pro Display", "Inter", sans-serif`
* **Telemetry & Numeric Font**: `"Geist Mono", "JetBrains Mono", monospace` (Used for `$4.99`, `+28.5%`, `94 OVR`)
* **Button Active Press**: `transform: scale(0.97)` with `100ms` transition.
* **Card Hover Lift**: `transform: translateY(-1px)` with border brighten to `rgba(255, 255, 255, 0.18)`.

---

## 📋 Tailwind Config Snippet

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "#080A0E",
        surface: "#0D131D",
        "fc-volt": "#E6FF00",
        "apex-cyan": "#00F0FF",
        "madden-green": "#00FF88",
        "bf-orange": "#FF7A00",
        "sims-purple": "#A855F7",
        "hud-gold": "#FFB800",
        "tilt-red": "#FF4757",
      }
    }
  }
}
```
