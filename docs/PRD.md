# Tribe Command Center — Product Requirements Document

## Vision
A web-based coordination platform for EVE Frontier tribes that enables leaders to define strategic goals, break them into actionable tasks, and allow members to pledge and track resource contributions — rebuilding civilization through organized collaboration.

## Target User
- **Tribe Leaders/Officers** — create goals, plan tasks, monitor progress
- **Tribe Members** — browse tasks, pledge contributions, track their impact
- **Cross-tribe observers** — view public goals for diplomacy/competition awareness

## Problem Statement
EVE Frontier tribes have no structured way to coordinate large-scale efforts. Building a gate network, establishing trade routes, or defending territory requires coordination across many players — but currently, this happens through ad-hoc Discord messages with no tracking, accountability, or progress visibility.

## Stage
Hackathon build — functional MVP with clean UX, wallet auth, and core coordination loop.

## MVP Features

### 1. Wallet Authentication
- Login via EVE Vault / Sui wallet
- Identity linked to on-chain character data (character name, tribe ID)
- No traditional username/password

### 2. Tribe Dashboard
- Overview of tribe's active goals and progress
- Member list with contribution stats
- Quick navigation between goals/tasks

### 3. Goal Management
- Create goals with title, description, priority, deadline
- Goals have a status lifecycle: Draft → Active → Completed / Archived
- Each goal breaks down into tasks

### 4. Task Board
- Tasks belong to a goal
- Each task specifies: location (system), type (build gate, gather resources, etc.), required resources (e.g., 46 foam)
- Tasks have a status: Open → In Progress → Completed
- Visual progress bar (pledged vs required)

### 5. Contribution Pledging
- Members can pledge a specific amount toward a task (e.g., "I'll provide 20/46 foam")
- Pledges are tracked with status: Pledged → Delivered → Verified
- Multiple members can pledge toward the same task

## Out of Scope (v1)
- On-chain verification of resource delivery (future: World API integration)
- On-chain governance / voting
- Real-time chat / messaging
- Mobile app
- Multi-tribe alliance management

## Success Criteria
- Working demo with wallet login
- Create → plan → pledge → track loop functional
- Clean, intuitive UI that a non-technical tribe leader can use
- Compelling video demo for hackathon submission
