# Quiz Battle Arena 🎮

A real-time multiplayer trivia game built with WebSockets for competitive knowledge testing.

## App Description

Quiz Battle Arena is fast real-time multiplayer trivia game where players compete to answer questions correctly and quickly. The game features a speed-based scoring system where the fastest correct answers earn the most points.

### Key Features:
- **Real-time multiplayer gameplay** for 2+ players
- **Speed-based scoring system**: First correct answer gets 100 points, second gets 80, third gets 60, others get 40
- **20 diverse trivia questions**
- **Live leaderboards** with instant score updates
- **Automatic game flow** with lobby, active game, and results phases

## Justification for Using WebSockets

WebSockets are essential for this application because:

1. **Real-time Competition**: Players need to see questions simultaneously and compete on speed. HTTP requests would create unfair timing advantages.

2. **Live Scoring Updates**: As players submit answers, everyone needs to see real-time score changes and leaderboard updates without page refreshes.

3. **Synchronized Game State**: All players must stay synchronized through game phases (lobby → question → results → next question) in real-time.

4. **Instant Feedback**: Players need immediate confirmation when they submit answers, and results must appear simultaneously for all participants.

5. **Dynamic Player Management**: Players joining and leaving the game need to be reflected instantly across all connected clients.

## App Mockup with Event Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    QUIZ BATTLE ARENA                        │
├─────────────────┬───────────────────────────────────────────┤
│   SIDEBAR       │           MAIN GAME AREA                 │
│                 │                                           │
│ 🏆 Quiz Battle  │  ┌─────────────────────────────────────┐ │
│                 │  │     Question 5 of 20                │ │
│ Game Status:    │  │  ████████░░ (8s remaining)          │ │
│ ✅ Active       │  └─────────────────────────────────────┘ │
│                 │                                           │
│ Players:        │  What is the capital of France?          │
│ • Alice: 340pts │                                           │
│ • Bob: 280pts   │  ┌─────────────┐ ┌─────────────┐         │
│ • You: 220pts   │  │ A. London   │ │ B. Berlin   │         │
│                 │  └─────────────┘ └─────────────┘         │
│ [Start Game]    │  ┌─────────────┐ ┌─────────────┐         │
│                 │  │ C. Paris    │ │ D. Madrid   │         │
│                 │  └─────────────┘ └─────────────┘         │
└─────────────────┴───────────────────────────────────────────┘
```

### Event Flow Diagram:

```
CLIENT EVENTS                    SERVER EVENTS
     │                               │
     ├─── player-join ──────────────→ player-joined
     │                               │
     ├─── start-game ───────────────→ game-started
     │                               │
     │    ←────── question-broadcast ─┤
     │                               │
     ├─── submit-answer ─────────────→ question-results
     │                               │
     │    ←────── game-complete ──────┤
     │                               │
     └─── disconnect ────────────────→ player-left
```

### Event Details:

1. **player-join**: Client sends player name → Server broadcasts new player to all
2. **start-game**: Any client can start → Server begins question sequence  
3. **question-broadcast**: Server sends question data → All clients display question
4. **submit-answer**: Client sends answer index → Server processes and scores
5. **question-results**: Server sends results → All clients show scores and correct answer
6. **game-complete**: Server sends final results → All clients display winner
7. **player-left**: Client disconnects → Server updates player list for all

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KJSDR/quiz-websockets
   cd quiz-websockets
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create required directories:**
   ```bash
   mkdir static sockets
   ```

4. **Ensure file structure matches:**
   ```
   📂 quiz-websockets
   ├── 📂 static
   │   ├── 📄 client.js
   │   ├── 📄 style.css
   ├── 📂 sockets
   │   └── 📄 quiz.js
   ├── 📂 views
   │   └── 📄 index.handlebars
   ├── 📄 app.js
   ├── 📄 package.json
   └── 📄 README.md
   ```

### Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

