# Design System Strategy: The Sentinel Framework

## 1. Overview & Creative North Star
**Creative North Star: "The Vigilant Monolith"**

To transcend the typical "government dashboard" aesthetic, this design system adopts a philosophy of **High-Definition Precision**. While the utility is rooted in security and transportation, the visual execution is inspired by editorial prestige. We are moving away from the "boxy" nature of standard admin panels toward a **fluid, layered architecture**.

The interface should feel like a high-end command center—authoritative yet effortless. We achieve this by breaking the rigid grid with **intentional whitespace**, **asymmetrical information density**, and a **layered depth model** that replaces outdated 1px borders with tonal transitions.

---

## 2. Color Theory & Tonal Depth

The palette is anchored in a deep, authoritative navy and a high-performance primary blue. However, the sophistication lies in the *space between* these colors.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning. 
Structure must be defined through **Background Shifts**. To separate the sidebar from the main content, or a data table from a filter bar, use a shift from `surface` to `surface-container-low`. Boundaries are felt, not seen.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of precision-cut glass. 
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Sections:** `surface-container-low` (#f2f4f6)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)
- **Overlays/Modals:** `surface-bright` (#f7f9fb) with high elevation.

### Signature Textures & Glass
- **The Command Gradient:** For primary CTAs and critical security alerts, use a subtle linear gradient: `primary` (#004ac6) to `primary_container` (#2563eb). This provides a "lathe-turned" professional finish.
- **Micro-Glassmorphism:** Use semi-transparent `surface_container_lowest` with a `20px` backdrop blur for floating navigation or hovering tooltips to maintain a sense of environmental awareness.

---

## 3. Typography: Editorial Authority

We use a dual-font strategy to balance technical precision with human readability.

*   **Display & Headlines (Manrope):** Chosen for its geometric stability. Use `display-md` for high-level security metrics and `headline-sm` for section headers. The wider tracking in Manrope conveys a sense of calm under pressure.
*   **Body & UI (Inter):** The industry standard for legibility. Use `body-md` for all data entry and `label-sm` (Uppercase, +0.05em tracking) for category headers to provide an "editorial" feel.

**Hierarchy Note:** Always prioritize a significant scale jump between `title-lg` and `body-md`. This high contrast ensures the "Vigilant" nature of the system—the most important security data is impossible to miss.

---

## 4. Elevation & Depth: Tonal Layering

Shadows and lines are relics of legacy systems. This design system uses **Atmospheric Perspective**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card inside a `surface-container-low` wrapper. This creates a natural "lift" through color value alone.
*   **Ambient Shadows:** For floating elements (Modals, Popovers), use a "Sentinel Shadow": `0px 12px 32px -4px rgba(25, 28, 30, 0.06)`. The shadow color is a tinted version of `on-surface`, making it feel like part of the environment rather than a grey smudge.
*   **The Ghost Border:** If a divider is mandatory for accessibility, use `outline-variant` at **15% opacity**. It should be a suggestion of a line, not a hard stop.

---

## 5. Components: The Sentinel Kit

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `md` (0.75rem) corner radius. Use `on-primary` text.
- **Tertiary:** No fill, no border. Use `primary` text weight 600. On hover, apply a `surface-container-high` background tint.

### Pill-Shaped Badges (Status Indicators)
- Use the `full` (9999px) radius. 
- **Security Active:** `success` background with `on-success` text. 
- **Breach/Alert:** `error_container` background with `on-error-container` text.

### Smart Lists & Data Tables
- **Rule:** Forbid 1px horizontal dividers.
- **Implementation:** Use alternating row fills. `Row A: surface-container-lowest`, `Row B: surface-container-low`. 
- **Spacing:** Use 1.5rem (xl) vertical padding for list items to allow the data to "breathe."

### Security Inputs
- **Style:** `surface-container-highest` background with a `Ghost Border`. 
- **Focus State:** Transition the border to 100% opacity `primary` and add a 4px soft glow using the `primary_fixed` color.

### Microservice Health Monitor (Custom Component)
- A specialized component using a small sparkline (linear gradient) and a `label-sm` status. Encapsulated in a `surface-container-low` pod with an `xl` (1.5rem) radius.

---

## 6. Do’s and Don’ts

### Do
- **Do** use whitespace as a functional tool to group security modules.
- **Do** utilize the `surface-container` tiers to create a "nested" UI architecture.
- **Do** use `manrope` for any numerical data to emphasize its importance.
- **Do** apply `backdrop-filter: blur(12px)` to any element that sits above the primary scroll layer.

### Don't
- **Don't** use 100% black (#000000) for shadows; always use a tint of the navy `on-surface` color.
- **Don't** use solid 1px borders to separate the sidebar from the dashboard. Use a background color transition.
- **Don't** use sharp 90-degree corners. Even the most "serious" data should be housed in a `DEFAULT` (0.5rem) or `lg` (1rem) container.
- **Don't** use standard "Success Green" if it clashes with the brand; stick strictly to the `success` (#16a34a) and `on-success-container` tokens provided.