# DESIGN.md — SMF Queue Check Design System

> Semantic design reference optimised for Stitch. All values are described in natural language first, with their verbatim hex/token equivalents available in parentheses where precision matters.

---

## 1. Design Atmosphere

The interface is **Kawaii Tech Claymorphism**: a style that merges cute, high-saturation arcade aesthetics (inspired by rhythm-game cabinets like maimai) with three-dimensional, tactile surfaces that feel like pressed soft clay. The overall sensation is **playful, approachable, and slightly physical** — as if every card, button, and pill-shaped bar has physical weight you could pick up.

Light mode glows with warm candy pinks and sky blues on a faintly blush canvas. Dark mode retreats into deep, almost-black jewel tones while the same vivid primaries carry through — so the palette always reads as bold rather than muted. Surfaces are never perfectly flat: they have subtle inner highlights and soft outer shadows that give them a pillowy, raised quality. Interactive elements (buttons especially) physically lift on hover and press down on click.

The atmosphere is optimistic, tournament-ready, and communal.

---

## 2. Colour Palette

### Semantic Roles

| Role | Light value | Dark value | Description |
|---|---|---|---|
| **Background** | Blush white (`#FFF5FA`) | Deep plum-black | Page canvas; clean and lightly tinted |
| **Surface** | Semi-transparent white (`rgba(255,255,255,0.7)`) | Rich dark tone | Cards, modals, panels — raised off the background |
| **Primary** | Hot pink (`#FF28A9`) | Same | Brand colour; used for CTAs, active states, focus rings |
| **Secondary** | Electric cyan (`#00D2FF`) | Brighter cyan | Complement to primary; edit/info actions |
| **Accent** | Traffic yellow (`#FFD200`) | Same | "NEXT UP" call-outs, VS badge, star highlights |
| **Text — Primary** | Deep magenta-black (`#2D0A1F`) | White | Body copy and headings |
| **Text — Muted** | Dusty mauve (`#7B5A78`) | Lavender-grey | Timestamps, labels, helper text |
| **Border** | Soft pink with 50% opacity (`rgba(255,168,225,0.5)`) | Pink with 35% opacity | Dividers and field outlines |
| **Error** | Crimson red (`#D63352`) | Same | Destructive actions, validation |
| **Success** | Forest green (`#2DA74F`) | Same | Confirmations, added queue items |
| **Warning** | Traffic yellow (`#FFD200`) | Same | Shared with Accent |

### Player Side Indicators

Two distinct team colours used on queue row side labels:

- **Player 1** — themed via `--theme-player1` (vivid pink / primary family)
- **Player 2** — themed via `--theme-player2` (cyan / secondary family)

Both render as white-text pills with a subtle text shadow for legibility.

### Achievement / Rank Tiers

Used in chart tables for "subtitle" rank colouring:

- **Gold** — `#FFD700` (rank 1–2)
- **Silver** — `#C0C0C0` (rank 3–5)
- **Bronze** — `#CD7F32` (rank 6–9)
- **Unranked** — inherits default text colour (rank 10)

### Hover Variants

All three primary colours darken 10% on hover using `color-mix(in srgb, <color>, black 10%)`. This creates a predictable, consistent hover darkening without needing separate static values.

---

## 3. Theme System (Named Palettes)

The app ships five switchable palettes. Each supports a light and dark variant. All palettes share the same structural roles (primary / secondary / accent / background / surface / text), only the colours differ.

| Theme | Primary | Secondary | Accent | Character |
|---|---|---|---|---|
| **Circle** *(default)* | Logo pink `#FF1493` | Cyan `#00A6FF` | Lime `#8BFF2E` | Maimai logo faithful; punchy and bright |
| **Prism** | Sky blue `#03A9F4` | Lavender `#9570FF` | Pale cyan `#66D8FF` | Cool, airy, tech-forward |
| **Buddies** | Golden yellow `#FFD700` | Warm orange `#FF7A2F` | Hot pink `#FF4A8A` | Sunny, friendly, festival fair |
| **Festival** | Royal purple `#9C27B0` | Pumpkin orange `#FF9800` | Bright pink `#FF3CA6` | Lantern festival; regal and dramatic |
| **Universe** | Dodger blue `#1E90FF` | Nebula magenta `#F06292` | Star gold `#FFD54F` | Space-age; deep and cosmic |

Dark variants of each palette keep the primary hue but shift backgrounds to near-blacks that lean into the palette's undertone (teal-black for Prism, plum-black for Festival, midnight-navy for Universe, etc.).

---

## 4. Typography

### Typeface Stack

The app uses **four distinct typefaces** with clearly defined roles:

| Role | Typeface | Weight(s) | Character |
|---|---|---|---|
| **Headings (global CSS)** | Space Grotesk | 700 | Geometric, slightly condensed, modern feel |
| **Body (global CSS)** | Outfit | 400, 600 | Rounded, friendly, very legible at small sizes |
| **App subtitle / decorative** | Poppins | 400 italic | Soft, italic subtitle beneath the brand name |
| **Mantine component layer** | Fredoka | 600 | Rounded, playful — used by the component library headings |
| **Mantine body layer** | Nunito | 400 | Friendly, slightly rounded — used by the component library body |

> Stitch should use Space Grotesk for any heading-level text and Outfit for body and UI labels. Fredoka and Nunito are present only inside Mantine-rendered component internals.

### Heading Behaviour

All headings (`h1`–`h6`) share these traits:
- **Weight:** Bold (700)
- **Line-height:** Tight — 1.1 (headings read as compact blocks, not airy)
- **Letter-spacing:** Slightly negative (-0.02em) — creates a modern, pulled-together look

### Brand Name Treatment

The app's title text uses a **left-to-right gradient from primary to secondary**, rendered as a clipped background gradient so the text fills with the gradient. A light drop shadow adds a grounded feel.

### Button Labels

Buttons use the **heading typeface (Space Grotesk)** at weight 700 with a slight +0.01em letter-spacing. This keeps button text crisp and distinct from body copy.

### Base Font Size

- Desktop: 16px root
- Small mobile (≤480px): 14px root — scales everything down proportionally

---

## 5. Spacing & Sizing

### Container & Layout

- Maximum content width for the queue manager: **1000px**, centred
- The primary content column spans full width on mobile and respects a comfortable max-width on desktop
- Grid gaps between major sections: **1–2rem**
- Section padding: **1–1.25rem** inside cards, **2rem** on full-page sections

### Component Padding Conventions

| Component | Horizontal | Vertical |
|---|---|---|
| Primary (filled) button | 1.25rem | inherited from height |
| Subtle / ghost button | 0.75rem | inherited |
| Queue row | 1.25rem (desktop), 0.5rem (mobile) | 1rem (desktop), 0.75rem (mobile) |
| Card / Paper | 1–1.25rem | 1–1.25rem |
| Navbar (inner) | 1rem | 0.8rem |
| Form / section headers | 0.5rem bottom border gap | — |

### Touch Targets

All interactive controls respect a minimum **44×44px** touch area on mobile, even when the visual element is smaller.

### Responsive Breakpoints

| Label | Pixel boundary | Behaviour |
|---|---|---|
| Desktop-wide | ≥1150px | Full nav links visible, full spacing |
| Desktop-mid | 990–1150px | Nav links compact, brand slightly smaller |
| Tablet | 769–990px | Nav links still visible but very compact |
| Mobile | ≤768px | Nav collapses to a **floating bottom dock pill** |
| Small mobile | ≤480px | Root font scales to 14px, tighter padding everywhere |

---

## 6. Shape & Radius Language

This UI uses a **dual-radius vocabulary**:

- **Pill / full-round (`border-radius: 999px`)** — used for the navbar bar itself, the mobile bottom dock, all primary buttons, toggle groups, search inputs, and the "busy" status overlay. This creates the signature smooth-edged, rounded-rectangle look.
- **Card radius (`border-radius: 24px`)** — used for all cards, modals, Paper components, and menu dropdowns. On mobile this reduces to 20px. This is the "clay tile" shape.
- **Minor radius (4–16px)** — used for player name chips (16px), player side badges (12px), small action buttons (4px), and inline error banners (4px). These are subordinate elements that read as flat compared to the main clay tiles.
- **Circle (`border-radius: 50%`)** — used only for the VS badge in queue rows.

---

## 7. Claymorphism Shadow System

This is the **defining visual technique** of the interface. Surfaces use a four-layer shadow stack that simulates clay:

### Card / Paper (light mode)
1. Outer drop shadow — bottom-right, soft and dark (creates a cast shadow beneath)
2. Outer highlight — top-left, white and soft (lifts the card off the page)
3. Inner highlight — top-left inset, bright white (simulates a bevel catching light)
4. Inner shadow — bottom-right inset, barely-dark (creates depth inside the card edge)

### Card / Paper (dark mode)
Same four layers, but the white highlights become near-invisible (2–5% white) and the dark shadows become much heavier (40–60% dark). The card still appears raised but now feels like a dark ceramic tile.

### Buttons (filled, light mode)
Buttons use the same four-layer clay shadow, but more pronounced. On hover, the shadows expand (the card rises higher). On press/active, the shadows **invert** — the inner shadow deepens and the outer drop vanishes — physically simulating a button being pressed into the surface.

### Navigation Pill
The navbar and mobile dock pills use the same clay shadow structure but oriented downward to simulate a bar floating above the page.

### Active / Selected States (e.g. nav links)
Selected pills use **inset-only shadows** — the outer lift disappears, making the element look pressed *into* the surface rather than raised above it. This is the "selected" affordance across nav links, tab pills, and toggle buttons.

---

## 8. Animation & Motion

### Easing Philosophy

Two curves are used throughout:

- **Standard smooth:** `cubic-bezier(0.16, 1, 0.3, 1)` — a fast-out, exponential ease used for entrance animations. Elements arrive crisply.
- **Springy / bouncy:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — an overshoot curve used on interactive hover states (nav links, buttons, theme toggle). Creates a playful micro-bounce when elements lift.

### Durations

| Interaction | Duration |
|---|---|
| Button hover / lift | 150ms |
| Button press / depress | 150ms |
| Global theme switch (background/text/border) | 300–400ms |
| Entrance animation (cards, modals) | 350–600ms |
| Queue item added (slide in from left) | 600ms |
| Queue item reordered (blue pulse) | 500ms |
| Queue item removed (fade + slide right, collapse) | 400ms |
| "Now Playing" updated pulse ring | 600ms |

### Entrance Pattern

Most cards and modals enter via **`fadeInUp`**: starting from `opacity: 0` and 20px below their final position, arriving into `opacity: 1` at their natural position. Staggered delays (100ms increments up to 500ms) create a cascading wave when multiple items enter together.

### Button Hover

Buttons physically **rise 3px** (`translateY(-3px)`) and scale up 2% on hover. On press they **sink 2px** and scale down 2%. This range of ±5px gives them a tactile piston quality.

### Theme Toggle

The theme toggle button itself scales up 10% on hover using the springy overshoot curve for a satisfying bounce.

---

## 9. Component Patterns

### The Navbar

Desktop: a pill-shaped bar floating near the top, using the clay shadow, with two zones — the brand name on the left (gradient primary colour, heading typeface, clamp-fluid size) and nav links centred. Active links appear "pressed in" using an inset shadow. Links use the springy bounce curve on hover and rise 2px.

Mobile: the top navbar is minimal; the main navigation migrates to a **floating bottom dock** — a full-width pill fixed 0.8rem above the bottom edge, containing icon-only link buttons. The active link appears pressed/sunken. This pattern is borrowed directly from native iOS/Android dock UX.

### Cards & Modals

All use the 24px clay radius, the four-layer clay shadow (adapts to dark mode), and the semi-transparent surface colour. Content inside is padded 1–1.25rem. On mobile, modals are capped at 85vh and scroll internally.

### Buttons

Three visual tiers:
- **Filled (primary)** — gradient from primary to its dark hover variant, full clay shadow, pill-shaped. The default CTA style.
- **Light** — primary colour at 15% opacity background with primary-coloured text. For secondary actions that still need colour association.
- **Subtle / Ghost** — completely transparent background, primary-coloured text, no shadow. Becomes slightly raised with a minimal clay shadow on hover. Used in tight spaces (e.g. inline row actions).

### Queue Rows

Each row is a **three-column grid**: order number (fixed, left), player names (flexible, centre), action buttons (fixed, right). On mobile this collapses to tighter fixed-width columns. The "NEXT UP" row has a left accent border in the yellow accent colour (4px wide) and a faint gold-to-transparent gradient wash. Animations (slide in / pulse / fade out) communicate state changes without toast messages.

### Player Name Chips

Names are displayed in **softly rounded pill chips** (16px radius) with a surface-hover background, 1px theme border, and centre-aligned text. They truncate with ellipsis when too long. Solo entries span the full two-column width.

### Badges

All badges are normalised: no text-transform (displayed as written, not all-caps), slightly positive letter-spacing (+0.02em), weight 600. Filled badges use a subtle clay shadow; light badges use a primary-tinted background (15% opacity) with primary-coloured text.

### Tabs

Active tabs receive: a 3px bottom border in the tab highlight colour, a 10% tinted background of that colour, weight 700, and the primary colour text. Non-active tabs are muted coloured and lighten their background on hover.

### Section Titles (Monitor/View mode)

Small all-caps labels with wide letter-spacing (+0.05em) in the secondary colour. Used as category headers inside dashboard panels. Sit 0.75rem below a gap and 1.5rem above their section content.

### Scrollbars

Styled as narrow 8px rails. Track matches the surface colour. Thumb uses the border colour (soft pink) and rounds with a 4px radius. Hovered thumb deepens to the muted text colour.

---

## 10. Dark Mode Notes

Dark mode is not simply an inversion. Key principles:

- Backgrounds are **deep jewel tones** derived from the theme's hue (near-black with a warm, cool, or purple undertone) rather than generic dark greys.
- Surface colour is slightly lighter than background but still very dark — creating subtle layering.
- Primary colours stay the same or become slightly brighter to maintain contrast.
- Clay shadows become more aggressive dark layers; white highlights shrink to near-invisible.
- All transitions between light and dark are animated (400ms ease on background/color).

---

## 11. Voice & Tone (Visual)

- **Playful but legible** — type is always bold at heading level; body type is never too light.
- **Physically grounded** — everything simulates tactility through shadow and hit-state animation.
- **High contrast within the palette** — backgrounds are light/dark neutrals so the vivid primaries pop without competing with each other.
- **No pure-black text** — text primaries are deep-coloured (plum-black `#2D0A1F`, navy `#0A192F`) rather than neutral black, which soften the look while maintaining readability.
- **Rounded everything** — no sharp corners on featured elements; pills and 24px radii dominate.

---

## 12. Queue List & Play Timer

### Queue List Container

The queue list is a surface card (surface background, 1px theme border, 8px radius, subtle shadow) with two distinct zones:

- **Header bar** — uses the `surface-hover` (slightly darkened surface) background separated by a 1px border. Contains the section title (left) and the "Start Game" CTA button (right). On mobile the header stacks vertically and the button expands full-width.
- **Column label row** — sits below the header. Uses the page background (not surface) to visually distinguish it from the rows. Muted text, 0.9rem, weight 600, centred per column. The "Player" column label is hidden on mobile to save space.
- **Row area** — scrollable at max 500px (desktop) / 400px (mobile) / 350px (small mobile). Rows sit flush inside, separated only by the theme border.

### Empty State

When the queue is empty a centred block appears: a large emoji icon (2.5rem, 50% opacity) above a short heading and a description paragraph. The heading inherits the muted text colour. The block gets comfortable breathing room (2.5rem padding on desktop, 1.5rem on small mobile).

### Start Game Button

A green (`--theme-success`) filled button — one of the few non-primary-colour filled buttons. Weight 600, 6px radius, 44px minimum height, lifts 1px on hover with a brightness boost.

### Play Timer

The timer sits **inline** within the "Now Playing" section header — it doesn't break to its own line. Layout is a horizontal flex row:

- **Label** (`ELAPSED` / similar) — small all-caps, muted colour, +0.5px letter-spacing, weight 600, 0.8rem
- **Time display** — rendered in `Courier New` (monospace) with tabular numerals so the digits don't shift width as they tick. Primary colour, weight 700, 1.2rem. This is the **only place in the UI where a monospace font appears**.

---

## 13. Playlist Stack (Fan Animation)

The playlist card on the profile page uses a **3D fan / stacked-card** effect. Three cards are absolutely stacked on top of each other with `perspective: 1000px` on the container. Background cards are darkened (60% brightness) and offset with `translate3d` + `rotate`:

- First background card: 6px right / 6px up / 2° clockwise
- Second background card: 12px right / 12px up / 4° clockwise

On hover, the whole stack rises 5px, and the background cards dramatically fan out (15px/15px/5° and 30px/30px/10° respectively) while brightening slightly. The top card gains a deep drop shadow (`0 15px 30px rgba(0,0,0,0.4)`) to lift it further above the fanned cards.

The animation curve for all card transitions is `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — a strong overshoot bounce (similar to the springy button curve but more pronounced). Duration is 400ms.

**Add playlist card** — appears in the same grid position as existing playlists. It's a dashed-border card at 75% size, transparent background, 40% opacity at rest. On hover it brightens to 80% opacity, lifts 5px, and the dashed border switches to the primary colour.

---

## 14. Login Form

### Adaptive Google Sign-In Button

On desktop the Google login button shows its full text label and spans the container width. On mobile (≤768px) it **collapses to a circular icon-only button** (44×44px, `border-radius: 50%`). The text label is hidden via `display: none` and the icon section loses its margin so only the icon fills the circle. This follows the 44px minimum touch target rule while preserving space.

### Login Icon

The app icon / avatar shown at the top of the login form scales up 10% on hover (same springy feel as the theme toggle). Transition is the standard 200ms ease.

---

## 15. Admin & Audit Pages

### Branch Manager / Schedule Grid

The admin page uses an **auto-fit responsive grid** (`repeat(auto-fit, minmax(140px, 1fr))`) for displaying schedule day cards. Cards gain a 2px lift and a Mantine small shadow on hover. On mobile the minimum column width reduces to 120px to fit more columns per row.

The schedule editing panel uses a scrollable container (max 400px) with a styled scrollbar — grey track plus slightly-darker grey thumb that deepens further on hover. In dark mode the track and thumb switch to the Mantine dark scale colours.

Collapsible schedule sections use a light grey background (`mantine-color-gray-0`) in light mode and the Mantine dark-6 swatch in dark mode, distinguishing them visually from the surrounding card surface.

### Audit Logs Table

The audit log table uses a reduced body font size (0.9rem) for data density. Row hover is a very subtle, fast (100ms) background flash to `mantine-color-gray-0`. Record ID cells use the **monospace font stack** (same use of fixed-width characters as the Play Timer) to prevent UUID values from reflowing.

JSON detail fields in the audit detail modal use a resizable textarea: height starts at 120px minimum and the user can drag to resize on hover. Font is monospace at 0.85rem.

---

## 16. Songs, Search & Song Detail

### Songs Database Layout

A two-pane layout: on desktop (≥992px) a **fixed 300px left sidebar** for filters sits beside a flexible main content area. On mobile the sidebar stacks above the content at full width. Gap between panes: 2rem. Content aligns to the start of the grid (not stretched).

### Release Image Cards (Feed & Search)

Clickable song/release cards have:
- A square `aspect-ratio: 1/1` image container with 12px radius and overflow hidden
- On hover: lift 3px, border shifts toward a 55%-opacity primary tint, a bloom glow shadow of 20%-opacity primary spreads below (`0 8px 20px …`)
- Placeholder (no image): a diagonal gradient blending 55%-opacity primary into 55%-opacity secondary

### Placeholder Image Gradient

Used whenever a song/release has no cover art. The gradient runs at 140° from primary to secondary both at 55% opacity over a transparent base. This ensures placeholder tiles still feel palette-aware and vibrant.

---

## 17. Profile, Discussion & Remaining Pages

### Public Profile Page

The profile page has two layout modes:
- **Desktop** — avatar aligned to the top of its column (`align-items: flex-start`). Avatar displays at full size.
- **Mobile** — avatar centres horizontally (`align-items: center`) and renders at 110×110px minimum.

The profile page title (username / display name) on mobile uses the same **gradient text treatment** as the app brand name — left-to-right gradient from primary to secondary, clipped to the text, with a light drop shadow beneath.

### Discussion Page

The discussion page follows the general card/surface system without bespoke CSS. Comment threads, voter lists, and action buttons all inherit the global Mantine + claymorphism overrides: clay-radius cards, pill buttons, filled-primary CTAs, and muted label text.

### Export / Best 50 Page

On desktop, songs render with the full `2.25rem` title size. On mobile this reduces to `1.5rem` (the `.mobile-song-title` class). The page is designed for screenshot / image export — during export rendering (`rendering-export` class on root) the 24px border-radius is locked and padding is removed so edges render cleanly in the captured image.

### Contact Page

Static content page. Follows the same surface card / muted label / primary link text conventions as the rest of the UI. No bespoke component patterns.

---

## 18. Page Inventory

| Page / Route | Key visual patterns |
|---|---|
| **Queue (main)** | Queue manager, queue list, now-playing card, play timer, queue form |
| **View (public monitor)** | Two-column cabinet grid, section title labels, monitor cards with playing state |
| **Feed / Community** | Two-pane layout, release cards with hover bloom, trending panel, playlist strip rows |
| **Songs / Database** | Sidebar + main two-pane layout, song rows, song detail modal |
| **Profile (public)** | Adaptive avatar layout, gradient page title on mobile, playlist stack fan, favorite song cards, recent plays |
| **Discussion** | Comment thread cards, voter modal, reply actions — all via global system |
| **Search** | Search results grid, song cards with hover bloom |
| **Export / Best 50** | Fluid title size, export-locked border-radius, screenshot-ready layout |
| **Admin / Branch Manager** | Auto-fit schedule grid, day cards, schedule collapse, user manager table |
| **Audit Logs** | Dense data table, monospace IDs, resizable JSON textarea |
| **Login** | Adaptive Google button (full width → round icon-only on mobile) |
| **Contact** | Static content, global surface card convention |
