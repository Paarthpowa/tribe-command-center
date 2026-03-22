# Tribe Command Center — UI & Visual Design Plan

## Design Philosophy
- **Visual-first**: Tiles, cards, progress rings — not tables and lists
- **Map-integrated**: EF-Map embeds for spatial planning
- **Dark EVE aesthetic**: Deep space theme consistent with EVE Frontier
- **Minimal clicks**: See status at a glance, drill down for details

---

## Page Structure

### 1. Login / Landing Page
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              [EF-Map embed - cinematic orbit]            │
│              (galaxy background, full width)             │
│                                                         │
│         ┌──────────────────────────────────┐             │
│         │   TRIBE COMMAND CENTER           │             │
│         │   "Organize. Coordinate. Build." │             │
│         │                                  │             │
│         │   [ Connect Wallet ]             │             │
│         └──────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
- Background: EF-Map embed in orbit mode (cinematic, purple/blue theme)
- Center: Glass-morphism card with wallet connect button
- After connect: auto-read character name + tribe from chain → redirect to dashboard

---

### 2. Tribe Dashboard (Main Hub)
```
┌──────────────────────────────────────────────────────────────────┐
│ TRIBE COMMAND CENTER          [Tribe: Alpha]  [🔔]  [👤 User]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  🎯 Active  │  │  ✅ Done    │  │  👥 Members │              │
│  │    Goals    │  │   Goals     │  │             │              │
│  │     5       │  │     12      │  │     23      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ACTIVE GOALS (tile grid)                      [+ New Goal]     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │ ⚡ CRITICAL     │  │ 🔶 HIGH        │  │ 🟢 MEDIUM      │     │
│  │                │  │                │  │                │     │
│  │ Gated Network  │  │ Resource Hub   │  │ Scout System   │     │
│  │ SOL Corridor   │  │ Sector 7       │  │ ARC-005        │     │
│  │                │  │                │  │                │     │
│  │ ████████░░ 78% │  │ ███░░░░░░ 34%  │  │ █░░░░░░░░ 10%  │     │
│  │                │  │                │  │                │     │
│  │ 4/5 tasks done │  │ 2/6 tasks done │  │ 1/3 tasks done │     │
│  │ 12 contributors│  │ 5 contributors │  │ 2 contributors │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│                                                                  │
│  RECENT ACTIVITY (feed)                                          │
│  • Player_A delivered 20 foam to Gate SOL-001        2h ago     │
│  • Player_B pledged 50 fuel to Resource Hub          5h ago     │
│  • Officer_C created new task: Scout ARC-005         1d ago     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Goal tiles:**
- Color-coded border by priority (critical=red, high=orange, medium=green, low=blue)
- Circular or bar progress indicator
- Click opens Goal Detail page
- Hover: subtle glow effect (EVE style)

---

### 3. Goal Detail Page
```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚡ GATED NETWORK — SOL CORRIDOR                                │
│  Priority: CRITICAL   Status: ACTIVE   Deadline: Mar 28         │
│  Created by: Commander_X                                         │
│                                                                  │
│  "Build a network of smart gates connecting SOL-001 through     │
│   SOL-005 for fast tribe travel."                                │
│                                                                  │
│  Overall Progress                                                │
│  ████████████████████░░░░░░░░░░ 78%                              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐       │
│  │                                                       │       │
│  │         [EF-Map Embed]                                │       │
│  │         Systems: SOL-001, SOL-002, SOL-003,           │       │
│  │                  SOL-004, SOL-005                      │       │
│  │         Links: SOL-001→002 (green/done)               │       │
│  │                SOL-002→003 (green/done)               │       │
│  │                SOL-003→004 (yellow/in progress)       │       │
│  │                SOL-004→005 (red/not started)          │       │
│  │                                                       │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                  │
│  TASKS                                              [+ Add Task] │
│  ┌────────────────────────────────────────────────────────┐      │
│  │ ✅ Gate SOL-001 → SOL-002          COMPLETED           │      │
│  │    46/46 foam · 3 contributors                        │      │
│  ├────────────────────────────────────────────────────────┤      │
│  │ ✅ Gate SOL-002 → SOL-003          COMPLETED           │      │
│  │    46/46 foam · 2 contributors                        │      │
│  ├────────────────────────────────────────────────────────┤      │
│  │ 🔨 Gate SOL-003 → SOL-004          IN PROGRESS        │      │
│  │    31/46 foam · 2 contributors     [Click to expand]  │      │
│  │    ┌──────────────────────────────────────────────┐    │      │
│  │    │  Player_A:  20 foam  ✅ delivered             │    │      │
│  │    │  Player_B:  11 foam  ⏳ pledged               │    │      │
│  │    │  Remaining: 15 foam  ⬚ open                  │    │      │
│  │    │                                              │    │      │
│  │    │  [ Pledge Resources ]                        │    │      │
│  │    └──────────────────────────────────────────────┘    │      │
│  ├────────────────────────────────────────────────────────┤      │
│  │ ⬚ Gate SOL-004 → SOL-005          OPEN               │      │
│  │    0/46 foam · no contributors yet                    │      │
│  │    [ Pledge Resources ]                               │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key visual elements:**
- **EF-Map embed** showing the gate network with:
  - `systems=` all involved system IDs
  - `links=` between systems, color-coded by status (green=done, yellow=in-progress, red=open)
  - `fit=1` to auto-zoom to show all systems
  - Dynamic updates via `postMessage` API when user clicks different tasks
- **Task cards** are expandable — click to see individual contributions
- **Progress bars** on each task showing pledged vs required
- **"Pledge Resources" button** opens modal

---

### 4. Pledge Modal
```
┌────────────────────────────────────────┐
│  PLEDGE TO: Gate SOL-003 → SOL-004    │
│                                        │
│  Required: 46 foam                     │
│  Already pledged: 31 foam              │
│  Remaining: 15 foam                    │
│                                        │
│  Your contribution:                    │
│  ┌──────────────────────────────┐      │
│  │  Resource: [foam ▼]         │      │
│  │  Amount:   [____15____]     │      │
│  │            max: 15          │      │
│  └──────────────────────────────┘      │
│                                        │
│  [ Cancel ]        [ Pledge ✓ ]        │
└────────────────────────────────────────┘
```

---

### 5. Create Goal Flow (Wizard)
```
Step 1: Basics
┌────────────────────────────────────────────────────────────┐
│  CREATE NEW GOAL                                Step 1/3  │
│                                                            │
│  Title:    [_Gated Network - SOL Corridor___]              │
│  Priority: [ ⚡Critical  🔶High  🟢Medium  🔵Low ]        │
│  Deadline: [ Mar 28, 2026 ]                                │
│                                                            │
│  Description:                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Build smart gates connecting SOL-001 through     │      │
│  │ SOL-005 for fast tribe travel within sector.     │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│                                    [ Next → ]              │
└────────────────────────────────────────────────────────────┘

Step 2: Map Planning (optional)
┌────────────────────────────────────────────────────────────┐
│  PLAN ON MAP                                    Step 2/3  │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │                                                  │      │
│  │         [EF-Map Embed - interactive]              │      │
│  │         Click systems to add to plan              │      │
│  │                                                  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│  Selected systems: SOL-001, SOL-002, SOL-003               │
│  [ Add system by ID: _______ ]                             │
│                                                            │
│                          [ ← Back ]  [ Next → ]            │
└────────────────────────────────────────────────────────────┘

Step 3: Add Tasks
┌────────────────────────────────────────────────────────────┐
│  DEFINE TASKS                                   Step 3/3  │
│                                                            │
│  Auto-generated from selected systems:                     │
│  ✓ Gate SOL-001 → SOL-002  |  46 foam  [ Edit ]           │
│  ✓ Gate SOL-002 → SOL-003  |  46 foam  [ Edit ]           │
│  ✓ Gate SOL-003 → SOL-004  |  46 foam  [ Edit ]           │
│  [ + Add custom task ]                                     │
│                                                            │
│                 [ ← Back ]  [ Create Goal ✓ ]              │
└────────────────────────────────────────────────────────────┘
```

---

## EF-Map Integration — Technical Details

### Embed Usage
EF-Map provides a full embeddable iframe with postMessage API:

```tsx
// Embed with highlighted systems and colored links
<iframe
  src={`https://ef-map.com/embed?systems=${systemIds.join(',')}&links=${links}&fit=1&performance=1`}
  width="100%"
  height="450px"
  frameBorder="0"
  loading="lazy"
/>
```

### Dynamic Updates (no reload)
```tsx
// Navigate to a system when user clicks a task
const navigateMap = (systemId: number) => {
  iframeRef.current?.contentWindow?.postMessage(
    { type: 'ef-map-navigate', systemId, zoom: 100 },
    '*'
  );
};

// Update highlights when task status changes
const updateHighlights = (systemIds: number[]) => {
  iframeRef.current?.contentWindow?.postMessage(
    { type: 'ef-map-highlight', systems: systemIds },
    '*'
  );
};
```

### Link Color Coding for Goal Progress
| Task Status | Link Color | Meaning |
|---|---|---|
| Completed | `green` | Gate built and operational |
| In Progress | `yellow` | Resources being gathered |
| Open | `red` | Not yet started |

### Where Maps Appear
1. **Login page** — cinematic background (orbit mode, no interaction needed)
2. **Goal Detail** — showing the systems involved in the goal with status-colored links
3. **Create Goal wizard** — step 2 for selecting systems on map
4. **Direct links** — "Open in EF-Map" buttons for full map experience

---

## Color Palette & Theme

```css
/* EVE Frontier Dark Theme */
--bg-primary:     #0a0e17;    /* Deep space black */
--bg-secondary:   #111827;    /* Card backgrounds */
--bg-tertiary:    #1a2332;    /* Hover/active states */
--border:         #1e293b;    /* Subtle borders */
--text-primary:   #e2e8f0;    /* Main text */
--text-secondary: #94a3b8;    /* Muted text */
--accent-blue:    #3b82f6;    /* Primary action */
--accent-cyan:    #06b6d4;    /* Highlights */
--accent-green:   #10b981;    /* Success/completed */
--accent-yellow:  #f59e0b;    /* Warning/in-progress */
--accent-red:     #ef4444;    /* Critical/danger */
--accent-orange:  #f97316;    /* High priority */
--glass:          rgba(17, 24, 39, 0.8); /* Glass-morphism */
```

## Component Library

Building on **Radix UI** (unstyled, accessible) + **Tailwind CSS**:

| Component | Usage |
|---|---|
| **GoalTile** | Dashboard tile with priority border, progress ring, stats |
| **TaskCard** | Expandable card showing task details + contributions |
| **ProgressRing** | Circular SVG progress indicator (used on tiles) |
| **ProgressBar** | Linear progress for tasks (pledged vs required) |
| **PledgeModal** | Dialog for pledging resources |
| **MapEmbed** | Reusable EF-Map iframe component with postMessage API |
| **ActivityFeed** | Real-time feed of recent tribe actions |
| **StatCard** | Top-level metric cards (active goals, members, etc.) |
| **PriorityBadge** | Colored badge (critical/high/medium/low) |
| **StatusDot** | Small colored indicator for task status |
| **WalletButton** | Connect/disconnect wallet with character info |
| **GoalWizard** | Multi-step goal creation flow |
