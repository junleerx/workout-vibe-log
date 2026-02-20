# Juni's Gym — Workout Tracker

A full-stack progressive web app for tracking personal training sessions, managing workout programs, and analyzing performance over time.

## Features

- **Workout Logging** — Track sets, reps, and weight in real-time with a live elapsed timer and auto-rest timer
- **Program Builder** — Create structured programs with classic, AMRAP, EMOM, and RFT formats; build circuit blocks with configurable rounds
- **AI Workout Generation** — Generate personalized workouts via AI based on style, difficulty, duration, and focus area
- **Progress Analytics** — Visualize strength trends and volume over time with interactive charts
- **Workout Calendar** — Browse your training history day-by-day
- **Multi-unit Support** — Toggle between kg and lbs; stored in kg internally, displayed in the unit of your choice
- **Custom Exercises** — Add and manage your own exercises alongside the built-in library
- **Authentication** — Per-user data via Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | OpenAI API (via Supabase Edge Function) |
| Deployment | Vercel |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/junleerx/workout-vibe-log.git
cd workout-vibe-log

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# → Add your Supabase URL and anon key

# Start the development server
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database

Migrations are located in `supabase/migrations/`. Apply them via the Supabase dashboard SQL editor or with:

```bash
npx supabase db push
```

## Deployment

The app is deployed on Vercel. Each push to `main` triggers an automatic production deployment.

## License

MIT
