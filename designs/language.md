# Alabaster Pulse: Design Handover & Technical Specification

## 1. Creative North Star: "The Curated Vitality"
Alabaster Pulse is designed to feel like a high-end editorial piece combined with clinical biometric precision. It moves away from the "guilt-driven" UI of traditional fitness apps, favoring a calm, Apple-inspired aesthetic that treats health tracking as a premium, effortless ritual.

### Design Principles:
- **Continuous Curves:** Every card and button uses "squircle" rounding (24px to 32px) for a soft, native-iOS feel.
- **Intentional Breathing Room:** Generous white space (24-32px gutters) to reduce cognitive load.
- **Functional Glassmorphism:** Use of `backdrop-blur-md` and semi-transparent surfaces to create depth and hierarchy.
- **Vibrant Precision:** Color is used sparingly but impactfully to denote progress and goals.

---

## 2. Visual Language & Tokens

### Color Palette (The "Pulse" Palette)
- **Primary (Protein):** `#ec1329` (Vibrant Red) - Used for primary actions, protein rings, and critical progress indicators.
- **Secondary (Calories/General):** `#f4f0f1` (Soft Alabaster) - Used for background surfaces and secondary elements.
- **Background:** `#ffffff` (Pure White) - Main app background for maximum clarity.
- **Surface:** `rgba(255, 255, 255, 0.8)` with `blur(20px)` - For sticky headers and bottom navigation.
- **Text (Primary):** `#18181b` (Zinc 900) - For headings and high-emphasis body text.
- **Text (Muted):** `#71717a` (Zinc 500) - For labels, secondary info, and placeholders.

### Typography
- **Primary Font:** `Plus Jakarta Sans`
- **Headings:** Bold/ExtraBold, -0.02em tracking.
- **Numbers/Metrics:** `Space Grotesk` (optional for a more technical feel) or `Plus Jakarta Sans` Medium for a softer look.
- **Scale:**
  - Display: 32px / 40px (Hero stats)
  - Title: 20px / 28px (Page headers)
  - Body: 16px / 24px (General text)
  - Label: 12px / 16px (Uppercase, 0.05em tracking for metadata)

---

## 3. Core Components & Behaviors

### The Progress Rings
- **Implementation:** SVG-based concentric circles.
- **Behavior:** On dashboard load, rings should animate from 0% to the current value with a cubic-bezier ease-out.
- **Colors:** Red for Protein (Outer), Muted Gray for Background Track.

### Bento-Style Insights
- **Layout:** A grid-based layout where widgets vary in size (50% or 100% width).
- **Charts:** Mixed chart type. Bar chart for Kcal (Y-axis 1), Smooth Spline Line chart for Protein (Y-axis 2). Use soft gradients under the line chart.

### Global Navigation
- **Top Bar:** Center-aligned title, `backdrop-blur-md` on scroll.
- **Bottom Nav:** Floating or docked with a 32px top-corner radius. High contrast for the active state using the primary red.

---

## 4. Developer Implementation Notes

- **Framework Recommendation:** React Native or Flutter (for that single-repo cross-platform goal).
- **Shadows:** Avoid harsh black shadows. Use diffuse, low-opacity shadows: `box-shadow: 0 20px 40px rgba(0,0,0,0.04)`.
- **Interactions:** Every primary button tap should trigger a light haptic feedback (Impact Light).
- **Local Data:** Since this is a "dumb" local-first app, use SQLite or local JSON storage. The "Backup" feature simply zips the local database file for easy porting.

---

## 5. AI Team Considerations (Data Context)
- **Inventory Mapping:** The AI should prioritize matching user input against the 'Local Inventory' first before suggesting generic database items.
- **Trend Analysis:** Focus on rolling averages (Avg/Day) rather than totals to provide more actionable insights for the user's daily habits.