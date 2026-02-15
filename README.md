# SpartaHack Volunteer Matchmaker

A full-stack web application built in 24 hours at **SpartaHack X** that connects volunteers with local community members who need help. Think "Tinder for volunteering" — swipe right to help, get matched, chat, and make a difference.


---

## The Problem

Finding local volunteer opportunities is fragmented and time-consuming. Meanwhile, people who need help (elderly, disabled, busy parents) struggle to find reliable assistance for everyday tasks.

## Our Solution

A smart matching platform that:
- **Matches volunteers** to nearby jobs based on skills, location, and availability
- **Gamifies helping** with a badge achievement system
- **Enables secure communication** through built-in chat
- **Incentivizes organizations** with an Ethereum donation leaderboard

---

## Features

### Swipe-Based Job Discovery
Browse volunteer opportunities with a Tinder-style swipe interface. Our matching algorithm considers:
- **Distance** — prioritizes jobs close to you
- **Skills** — matches your abilities to job requirements
- **Urgency** — surfaces time-sensitive requests
- **Reliability** — rewards consistent volunteers

### Badge Achievement System
Earn badges across 4 tracks as you volunteer:

| Badge | Track | Levels |
|-------|-------|--------|
| Specialist | Complete skill-tagged jobs | Bronze (1) → Silver (5) → Gold (15) |
| Firefighter | Handle urgent requests (<24h) | Bronze (1) → Silver (5) → Gold (10) |
| Anchor | Months of active participation | Bronze (1mo) → Silver (3mo) → Gold (6mo) |
| Inclusionist | Help with accessibility needs | Bronze (1) → Silver (5) → Gold (5+) |

### Real-Time Chat
Once matched, communicate directly with requesters through our built-in messaging system. No phone numbers or emails exchanged until you're ready.

### AI-Powered Job Posts
- **Smart Description Enhancement** — AI helps requesters write clear, compelling job descriptions
- **Image Generation** — Auto-generate relevant images for job posts

### Ethereum Donation Leaderboard
Organizations can receive ETH donations tracked on-chain. Monthly rounds reward top organizations, creating healthy competition for community impact.

### Privacy-First Location
- City-level display only (exact coordinates never shown)
- GPS or manual entry
- Revokable permissions anytime

---

## Tech Stack

### Frontend
- **Next.js 15** with React and TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Leaflet** for interactive maps with heatmaps
- **Ethers.js** for blockchain integration

### Backend
- **Django 5.2** with Django REST Framework
- **PostgreSQL** database
- **JWT authentication**
- **Google Gemini API** for AI features

### Blockchain
- **Solidity** smart contract for donation leaderboard
- Deployed on Ethereum network

### DevOps
- **Docker & Docker Compose** for containerization

---

## Project Structure

```
SpartaHack_Project/
├── frontend/                 # Next.js frontend
│   ├── app/(modules)/        # Feature pages (matching, chat, profile, etc.)
│   ├── components/           # React components
│   ├── lib/                  # Services & state management
│   └── types/                # TypeScript definitions
│
├── server/                   # Django backend
│   ├── authentication/       # User auth & avatars
│   ├── matching/             # Core matching engine & badges
│   ├── chat/                 # Messaging system
│   └── ai_assist/            # Gemini AI integration
│
└── contracts/                # Solidity smart contracts
    └── VolunteerLeaderboard.sol
```

---

## The Team

Built in 24 hours at **SpartaHack X**.
