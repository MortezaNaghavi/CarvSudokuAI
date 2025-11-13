# CARV Sudoku: AI vs Human - Design Guidelines

## Design Approach
**Selected Framework:** Material Design + Gaming aesthetics
**Rationale:** Utility-focused puzzle game requiring clear interaction patterns, strong visual feedback for game states, and modern web3 polish. Material's emphasis on surfaces and elevation works perfectly for game boards, while gaming aesthetics add engagement.

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, h-8)

**Game-First Layout:**
- Mobile: Single-column, full-viewport game board dominates
- Desktop: Two-column split - Sudoku board (60%) + sidebar (40%) with stats/hints/leaderboard

**Viewport Strategy:**
- Game container: Natural height based on board size, not forced 100vh
- Board maintains square aspect ratio with max-width constraints
- Sidebars use sticky positioning for persistent access to tools

## Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - UI, buttons, stats
- Game Numbers: 'JetBrains Mono' - monospace for crisp number display in cells
- Accents: 'Space Grotesk' - headings, blockchain stats

**Hierarchy:**
- Game numbers: text-2xl font-bold (given cells), text-xl font-normal (user inputs)
- Headings: text-3xl font-bold
- Stats/Labels: text-sm font-medium uppercase tracking-wide
- AI Hints: text-base font-mono
- Leaderboard: text-sm tabular-nums

## Component Library

### Core Game Components

**Sudoku Board:**
- 9x9 grid rendered on HTML Canvas with clear cell separation
- 3x3 box divisions with thicker borders (3px vs 1px)
- Selected cell: Elevated appearance with glow effect
- Conflicting cells: Red highlight border
- Given numbers: Higher opacity, slightly bolder
- User numbers: Standard weight, editable state

**Number Input Pad (Mobile):**
- 3x3 grid of number buttons (1-9)
- Large touch targets (min 56px)
- Erase and Notes buttons flanking the grid
- Fixed to bottom on mobile, sidebar on desktop

**Wallet Connection:**
- Prominent "Connect Phantom" button in top-right
- Connected state shows truncated address with Solana icon
- Balance display (SOL) if connected
- Connection status badge (green dot)

**AI Hint Panel:**
- Card-style container with subtle border
- "Ask CARV AI" button with AI sparkle icon
- Hint display: "Possible numbers: 4, 7, 9" in mono font
- Hint counter showing remaining hints
- Cost display: "0.001 SOL per hint"

**Timer & Stats Bar:**
- Top bar spanning full width
- Left: Timer (MM:SS format)
- Center: Difficulty badge
- Right: Mistakes counter (X/3)

**NFT Mint Modal:**
- Overlay appears on puzzle completion
- Centered card showing "Sudoku Soul" NFT preview
- Completion stats: Time, Hints used, Difficulty
- "Mint NFT on CARV" primary button
- Transaction progress states (Pending, Success, Error)

**Leaderboard:**
- Table layout with rank, address, time, date
- Top 3 highlighted with medal icons
- "Your Rank" row emphasized if user is connected
- Daily/Weekly/All-time tabs

**Daily Challenge Banner:**
- Hero-style section at page top (desktop) or collapsible card (mobile)
- Challenge details: Difficulty, Reward, Time remaining
- "Start Daily Challenge" CTA button
- Progress indicator if challenge in progress

### Interactive Elements

**Buttons:**
- Primary (Mint, Connect, Start): Solid with subtle gradient
- Secondary (Hints, Notes): Outline style
- Icon buttons: Circle with centered icon, hover lift effect
- All buttons: 2px rounded corners, active press state

**Share to X:**
- Fixed position button (bottom-right on desktop)
- Pre-filled tweet: "Just solved a Sudoku on CARV in [TIME]! 🧩⛓️ #CARVHackathon"
- X logo icon with share animation on click

**Celebration Effects:**
- Confetti explosion from board center on solve
- Subtle particle effects for correct number placement
- Sound toggle button (speaker icon) in top-left

## Visual Feedback System

**Game States:**
- Loading: Pulsing skeleton board
- Active: Crisp, interactive
- Paused: Overlay blur with resume button
- Completed: Confetti + modal overlay

**Blockchain States:**
- Connecting: Animated dots
- Connected: Green check icon
- Transaction pending: Spinner with tx hash link
- Success: Green checkmark with confetti
- Error: Red alert with retry button

## Mobile Optimizations

- Touch-friendly cell selection (min 48px tap targets)
- Bottom sheet for number input pad
- Collapsible AI hints section
- Simplified top bar with hamburger menu for secondary functions
- Swipe gestures for undo/redo

## Icons
**Library:** Heroicons (CDN)
**Key Icons:** wallet, sparkles (AI), trophy, share, sound, pause, trash (erase)

## Accessibility
- High contrast between board and numbers
- Selected cell clearly indicated with multiple visual cues
- Keyboard navigation support (arrow keys, number keys)
- Screen reader labels for all interactive elements
- Focus visible states on all controls

## Animation Budget
**Sparingly Used:**
- Cell selection: Instant
- Number placement: Quick fade-in (100ms)
- Confetti: On solve only
- Button hovers: Subtle lift (2px transform)
- Modal entrance: Fade + scale (200ms)

**No Animations:**
- Background effects, parallax, continuous animations, scroll-triggered effects