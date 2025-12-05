# Acceptafy - Design Guidelines (User-Specified System)

## Design Approach
**System: Pre-Defined Custom Design System**
This application uses an exact, pre-built design system with all visual specifications already defined in the provided codebase. All styling, animations, spacing, and component structures are explicitly coded and must be preserved precisely.

## Core Design Elements

### A. Color Palette (Fixed)
- **Background**: Dark slate (`#0f172a`, `#121212`)
- **Text**: White primary, gray-400 secondary
- **Accent**: Purple gradients (`#9333ea`, `#7c3aed`, `#6d28d9`)
- **Status Colors**: Red (`rgba(239, 68, 68)`), Yellow (`rgba(234, 179, 8)`), Green (`rgba(74, 222, 128)`)
- **Borders**: `rgba(255, 255, 255, 0.1)` - subtle white transparency

### B. Typography
- System font stack via browser defaults
- **Sizes**: Text-xl, text-2xl for headers; text-sm for secondary content
- **Weights**: Bold for headers, regular for body
- **Hierarchy**: Established through size and color contrast (white → purple-300 → gray-400)

### C. Layout System
**Spacing**: Tailwind units - p-4, p-6 for padding; gap-2, gap-3, gap-4 for element spacing
**Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive card layouts
**Containers**: max-w-5xl, max-w-3xl for content width constraints
**Borders**: `border border-white/10` with `rounded-lg`, `rounded-2xl` for cards/modals

### D. Component Library

**Cards**: Dark backgrounds with subtle borders, hover effects with `hover:bg-white/10`
**Buttons**: 
- Primary: Purple gradient with shadow (`btn-gradient-purple`)
- Secondary: Border-only with hover states
- Blur backgrounds for overlay contexts

**Modals**: Fixed overlays with `backdrop-blur-sm`, dark-bg gradient animation, rounded-2xl
**Inputs**: `input-glow-focus` with purple border on focus, `input-inset-shadow` for depth
**Tooltips**: Dark slate (`#1e293b`) with arrow, 240px width

### E. Animations (All Pre-Defined)
- `pulse-red-border`: 2s infinite pulsing shadow
- `gradient-animation`: 18s infinite background position shift
- `fade-in`: 0.5s opacity + translateY
- `scale-in`: 0.3s scale transform
- `shimmer-effect`: 2s infinite shimmer overlay
- `aurora-background`: 15s infinite gradient animation

**Animation Usage**: Applied to specific contexts (status indicators, page transitions, loading states)

### F. Special Effects
- **Glow Effects**: `bg-glow-red`, `bg-glow-yellow`, `bg-glow-green` for status-based shadows
- **Gradient Backgrounds**: `.dark-bg` and `.aurora-background` for immersive atmosphere
- **Dark Mode Preview**: Invert filter system for email preview rendering

## Images
No hero images specified. Application is tool-focused with data visualization and form-based interfaces. Visual interest comes from gradients, animations, and structured layouts rather than photography.

## Implementation Notes
- All CSS is provided via inline `<style>` blocks in index.html
- Tailwind loaded via CDN (`https://cdn.tailwindcss.com`)
- Icons from custom CategoryIcons component library
- Responsive breakpoints: base (mobile), md (tablet), lg (desktop)
- Accessibility: Focus states, ARIA labels, keyboard navigation support built into components

**Critical**: This design is complete and finalized. Implement exactly as specified in provided code without modifications or interpretations.