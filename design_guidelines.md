# Acceptafy - Design Guidelines

## Design Approach
**Hybrid System: Material Design + Gaming UI Patterns**
Combining Material Design's information architecture with gamification patterns inspired by Duolingo and Habitica. Professional dashboard functionality enhanced with game-like reward systems and playful interactions.

**Key Principle**: Data-driven productivity wrapped in an engaging, achievement-focused experience.

---

## Core Design Elements

### A. Color Palette
**Base Dark Theme:**
- Background layers: `#0a0a0f` (deepest), `#121218` (cards), `#1a1a24` (elevated surfaces)
- Text: White primary, `#a0a0b0` secondary, `#606070` tertiary

**Gradient System:**
- Purple Core: `#9333ea → #7c3aed → #6d28d9` (primary actions, XP elements)
- Blue Energy: `#3b82f6 → #2563eb → #1d4ed8` (achievements, progress)
- Pink Rewards: `#ec4899 → #db2777 → #be185d` (streaks, special badges)
- Combo: Purple-to-pink diagonal gradients for premium features

**Status & Gamification:**
- XP Gain: Pulsing green `#10b981`
- Level Up: Gold `#f59e0b` with glow
- Streak Fire: Orange-red gradient `#f97316 → #ef4444`
- Locked Content: `#4b5563` desaturated

### B. Typography
**System font stack** (San Francisco, Segoe UI, Roboto fallbacks)

**Hierarchy:**
- Display (Level/XP counters): 2xl-3xl, bold, gradient text fill
- Headers: xl-2xl, semibold
- Body: base, regular
- Metadata/stats: sm, medium, uppercase tracking-wide

**Gamification Typography:** Numeric displays use tabular-nums for smooth counting animations

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 3, 4, 6, 8 for consistent rhythm
- Card padding: p-6
- Section gaps: gap-4, gap-6
- Page margins: p-8
- Icon spacing: gap-2, gap-3

**Grid Patterns:**
- Dashboard: `grid-cols-1 lg:grid-cols-3` (sidebar 1fr, main 2fr)
- Achievement grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Analytics cards: `grid-cols-1 md:grid-cols-2 gap-6`

**Containers:** max-w-7xl for main content, max-w-sm for modals

### D. Component Library

**Sidebar Navigation (Fixed Left):**
- Dark `#121218` background, `border-r border-white/5`
- Width: 280px desktop, slide-in drawer mobile
- Structure: Logo/profile top → main nav → gamification panel (XP, level, streak) bottom
- Active state: Purple gradient left border + bg-white/5

**Gamification Components:**

*XP Bar*
- Horizontal progress bar with gradient fill (purple-blue)
- Animated fill on gain with number counter
- Current/Next level display with glow effect on milestone

*Achievement Badges*
- Circular icons 64x64px, gradient borders when unlocked
- Grayscale with lock icon when locked
- Pop-in animation with confetti effect on unlock
- Tooltip shows title, description, progress

*Level Display*
- Prominent circular badge with level number
- Rotating ring animation for "about to level up" state
- Burst animation on level up with modal celebration

*Streak Counter*
- Flame icon with number, grows in size with longer streaks
- Pulsing glow effect, color intensifies (orange → red) as streak increases
- Warning state at risk of breaking (gray, dimmed)

**Dashboard Cards:**
- `rounded-2xl` corners, `border border-white/10`
- Subtle gradient overlay (top-to-bottom, white/0 → white/5)
- Hover: `hover:border-purple-500/30` with `scale-[1.02]` transform
- Shadow: Soft purple glow on hover

**Action Buttons:**
- Primary: Purple gradient background, white text, shadow-lg with purple glow
- Secondary: Border-only (border-purple-500), transparent bg
- Icon buttons: Rounded-full, hover:bg-white/10

**Data Visualizations:**
- Score displays with radial progress indicators
- Animated number counters (count-up effect)
- Color-coded metrics (green positive, red negative, purple neutral)
- Sparkline graphs with gradient fills

### E. Animations & Micro-Interactions

**Core Animations:**
- XP gain: Pulse green flash → fill animation → number count-up (0.8s)
- Level up: Scale burst → confetti particles → modal slide-in (2s sequence)
- Achievement unlock: Icon shake → color flood → badge pop-in (1.2s)
- Streak increment: Flame flicker → size bump → glow intensify (0.6s)
- Loading: Gradient shimmer sweep (1.5s infinite)

**Interaction States:**
- Button press: Scale-down to 0.95
- Card hover: Lift with shadow (translate-y -2px)
- Sidebar items: Smooth color transition (0.3s ease)
- Score updates: Brief highlight pulse

**Page Transitions:**
- Fade-in with slight translateY (0.5s)
- Stagger child elements by 50ms

**Playful Loading States:**
- Skeleton loaders with gradient sweep
- "Analyzing emails..." with animated dots
- Progress bar with percentage + fun copy ("Counting the wins...")

### F. Special Effects
- **Glow System:** Use box-shadow with gradient colors for status emphasis (purple for active, green for success, gold for level-up)
- **Gradient Overlays:** Subtle animated gradients on backgrounds (slow 15s rotation)
- **Particle Effects:** Reserved for major achievements (level up, milestone completion)
- **Focus States:** Purple ring with offset for accessibility

---

## Images
**No hero image** - This is a dashboard application prioritizing data and functionality.

**Icon System:** Use Heroicons via CDN for UI icons. Custom illustrated icons for:
- Achievement badges (categories: Email Master, Engagement Pro, etc.)
- Empty states (friendly illustrations, 200x200px, purple-pink gradient style)
- Celebration modals (confetti, trophy graphics)

---

## Responsive Behavior
- **Desktop (lg):** Full sidebar + 2-column main area
- **Tablet (md):** Collapsible sidebar drawer + 1-column main
- **Mobile:** Hidden sidebar (hamburger menu), single-column cards, stacked gamification elements

---

## Implementation Notes
- Tailwind CSS via CDN for rapid prototyping
- Transition-all with duration-300 for smooth interactions
- Z-index layers: Sidebar (40) → Modals (50) → Tooltips (60)
- Accessibility: ARIA labels on all interactive elements, keyboard navigation for all actions, focus-visible states
- Performance: CSS animations over JavaScript where possible, will-change hints for animated elements

**Philosophy:** Every interaction should feel rewarding. Even mundane tasks (opening an email report) should include subtle celebratory feedback. Professional enough for work, fun enough to want to use daily.