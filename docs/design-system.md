# Maimai Queue Design System

This document outlines the visual language and implementation patterns for the Maimai Queue Check interface.

## 🎨 Theme: Kawaii Tech (Claymorphism)
The design uses **Claymorphism**—a soft, 3D tactile aesthetic that feels "squishy" and friendly, inspired by modern rhythm game interfaces (maimai).

### Signature Visuals
- **Backgrounds**: Soft, translucent surfaces (`--theme-surface`).
- **Shadows**: Double outer shadows (light/dark) combined with double inner highlights to create a 3D "pill" effect.
- **Radius**: Large, organic border radii (`24px` for panels, `12px` for buttons).

## 🛠 Design Tokens

### Radius
Standardized radii to ensure consistent tactility.
- `--radius-panel`: `16px` (Default for inner cards)
- `--radius-control`: `12px` (Buttons, inputs)
- `--radius-chip`: `16px` (Status indicators, small pills)
- **Global Panel (Clay)**: `24px` (Hardcoded for primary paper elements)

### Elevation (Clay Shadow)
All primary interactive surfaces use the "Clay" shadow pattern:
```css
box-shadow: 
  8px 8px 16px rgba(0, 0, 0, 0.06),
  -8px -8px 16px rgba(255, 255, 255, 0.8),
  inset 2px 2px 6px rgba(255, 255, 255, 0.8),
  inset -2px -2px 6px rgba(0, 0, 0, 0.03);
```

### Accessibility
- **Focus States**: Use `var(--focus-ring)` to provide high-visibility focus indicators without relying on default browser outlines.
- **Touch Targets**: Mobile buttons must maintain a minimum of `44x44px` hitting area.
- **Motion**: Honor `prefers-reduced-motion` by disabling transitions for users who require it.

## 📏 Layout & Breakpoints
- **Mobile/Table Transition**: `768px`.
- Use `clamp()` for responsive typography and spacing where possible.

## 🧩 Component Patterns
- **Buttons**: Should use `var(--radius-control)` and hover scales (`transform: scale(1.02)`).
- **Cards**: Use `.hologram-card` or equivalent clay-shadowed surfaces.
- **Navigation**: Desktop nav at top; Mobile nav docked at bottom (safe area aware).
