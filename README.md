# MABBR - Next.js Paper Trading Platform with Gamification and Social Features

A [Next.js](https://nextjs.org) based paper trading application that lets users practice trading in a simulated environment, play games, earn rewards, and engage with a social trading community.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup & Seeding](#database-setup--seeding)
- [API Routes](#api-routes)
- [Folder Structure](#folder-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Citations](#citations)

## Features

- **Paper Trading**: Trade stocks with virtual funds.
- **AI-Powered Insights**: Trade suggestions based on current news.
- **Market Mini-Games**: Trading based games, scratch offs, lootboxes, and more.
- **Daily Market Pulse**: Vote on market sentiment to earn free daily tokens.
- **Portfolio Dashboard**: Track performance, trade history, and risk assessment scores.
- **Social Trading**: Global chat, comment feed, follow accounts, and trading leaderboard.
- **Secure Authentication**: Multi-device login with session management and user profile customization.
- **News & Research**: Real-time market news feed powered by external APIs.

## Tech Stack

- **Framework**: Next.js 15 with the App Router
- **Languages**: TypeScript, React 19
- **Styling & Theming**: Tailwind CSS, tailwindcss-animate, Lucide & Heroicons, next-themes
- **State & Data Fetching**: SWR, React Hook Form
- **Charts & Visualization**: Chart.js, ApexCharts, D3, ECharts
- **Backend & Database**: Next.js API Routes, Prisma ORM with MongoDB
- **Authentication & Security**: better-auth, Zod validation
- **Storage & Assets**: AWS S3 (via @aws-sdk), react-easy-crop for avatars
- **Real-Time & AI**: WebSockets for chat, OpenAI API for AI chat support
- **Utilities**: react-hot-toast (Sonner), Framer Motion, clsx, date-fns, lodash

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm, yarn, pnpm, or bun
- Database (MongoDB instance with Prisma)
- AWS S3 bucket
- OpenAI API key

### Installation

```bash
git clone https://github.com/your-username/mabbr-senior-project.git
cd mabbr-senior-project
npm install
# or
yarn
# or
pnpm install
```

## Environment Variables

Create a `.env.local` in the project root:

```env
DATABASE_URL="mongodb://user:pass@host:port/db"
NEXTAUTH_SECRET="your-session-secret"
AWS_S3_BUCKET_NAME="your-s3-bucket"
AWS_REGION="your-region"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
OPENAI_API_KEY="your-openai-key"
BETTER_AUTH_URL="http://localhost:3000/api/auth"
EMAIL_VERIFICATION_CALLBACK_URL="http://localhost:3000/api/auth/verify-email"
GITHUB_CLIENT_ID="your-github-id"
GITHUB_CLIENT_SECRET="your-github-secret"
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
DISCORD_CLIENT_ID="your-discord-id"
DISCORD_CLIENT_SECRET="your-discord-secret"
```

## Database Setup & Seeding

Push Prisma schema to the database and seed initial data:

```bash
npx prisma db push
npm run seedAll
```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

All backend endpoints are defined under `src/app/api`. Highlights include:

- `GET /api/stocks` – fetch simulated stock listings
- `GET /api/quote/[symbol]` – real-time quote
- `GET /api/news` – market news articles
- `POST /api/market-sentiment/vote` – daily vote for market pulse
- `REST /api/games` – game management (Stocket, Prediction)
- `GET/POST /api/chat`, `/api/comment` – global chat and comments
- `GET /api/leaderboard` – trading leaderboard
- `POST /api/lootboxes` – loot box draws
- …and more in the `api` directory

## Folder Structure

```
mabbr-senior-project/
├─ prisma/             # Prisma schema & migrations
├─ public/             # Static assets and images
├─ src/
│  ├─ app/
│  │  ├─ api/          # Next.js API routes
│  │  ├─ components/   # Reusable React components
│  │  ├─ constants/    # Static config (e.g. feature list)
│  │  ├─ games/        # Mini-game pages and components
│  │  ├─ hooks/        # Custom React hooks
│  │  └─ page.tsx      # Landing page
│  ├─ seed/            # Database seeding scripts
├─ tailwind.config.ts  # Tailwind CSS config
├─ next.config.ts      # Next.js config
└─ package.json        # Dependencies & scripts
```

## Deployment

Build for production and start the server:

```bash
npm run build
npm run start
```

## Citations

- create-next-app: Vercel. (2023). create-next-app. https://nextjs.org/docs/app/api-reference/cli/create-next-app
- Next.js: Vercel. (2023). Next.js Documentation. https://nextjs.org/docs
- React: Meta Platforms, Inc. (2023). React. https://reactjs.org/
- Tailwind CSS: Tailwind Labs. (2023). Tailwind CSS. https://tailwindcss.com/
- Prisma: Prisma. (2023). Prisma ORM. https://www.prisma.io/
- better-auth: Arcjet Labs. (2023). better-auth. https://www.npmjs.com/package/better-auth
- next-themes: Paco Coursey. (2023). next-themes. https://github.com/pacocoursey/next-themes
- SWR: Vercel. (2023). SWR. https://swr.vercel.app/
- React Hook Form: React Hook Form Contributors. (2023). React Hook Form. https://react-hook-form.com/
- Zod: Colinhacks. (2023). Zod. https://zod.dev/
- Lodash: John-David Dalton. (2023). Lodash. https://lodash.com/
- Heroicons: Tailwind Labs. (2023). Heroicons. https://heroicons.com/
- Lucide: Lucide Contributors. (2023). Lucide. https://lucide.dev/
- Sonner (react-hot-toast alternative): phntmxyz. (2023). Sonner. https://github.com/phntmxyz/sonner
- react-easy-crop: ValentineMostly. (2023). react-easy-crop. https://github.com/ValentineMostly/react-easy-crop
- AWS SDK v3: Amazon Web Services. (2023). AWS SDK for JavaScript v3. https://github.com/aws/aws-sdk-js-v3
- Chart.js: Chart.js Contributors. (2023). Chart.js. https://www.chartjs.org/
- ApexCharts: ApexCharts. (2023). ApexCharts. https://apexcharts.com/
- D3.js: Mike Bostock. (2023). D3.js. https://d3js.org/
- Apache ECharts: Apache Software Foundation. (2023). ECharts. https://echarts.apache.org/
- Framer Motion: Framer. (2023). Framer Motion. https://www.framer.com/motion/
- clsx: Luke Edwards. (2023). clsx. https://github.com/lukeed/clsx
- date-fns: date-fns Contributors. (2023). date-fns. https://date-fns.org/
- yahoo-finance2: gadicc. (2023). yahoo-finance2. https://github.com/gadicc/node-yahoo-finance2
- OpenAI API: OpenAI. (2023). OpenAI Platform API Reference. https://platform.openai.com/docs/api-reference
