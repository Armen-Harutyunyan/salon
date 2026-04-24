# Salon Telegram Mini App

Telegram Mini App for a neighborhood salon. The platform has two surfaces:

- client mini app for booking
- internal admin panel for the salon owner
- staff Telegram flow for masters to add manual bookings and blocks

## Product Goal

A client opens a Telegram bot, launches the mini app, chooses a service, chooses a master, sees only valid available time slots, and creates a booking without manual operator work.

## Stack

- `Next.js`
- `Payload CMS`
- `MongoDB`
- `Tailwind CSS`
- `Telegram Bot API`
- `Vercel`

Why this stack:

- `Payload` gives us a real admin panel immediately
- `MongoDB` is the chosen database for this build and is officially supported by Payload
- `Next.js` lets us keep mini app, admin panel, API routes, and bot integration in one codebase
- `Tailwind CSS` will be used for the client UI
- `Vercel` is a straightforward deployment target for the web layer

## MVP Scope

### Client Mini App

- view services
- view masters
- choose a service
- choose a master
- select a date
- see available time slots
- create a booking
- view booking confirmation

### Admin Panel

- manage masters
- manage services
- set service duration and price
- manage working hours per master
- manage exceptions: day off, break, blocked intervals
- view bookings
- confirm, cancel, or adjust bookings

### Staff Telegram Flow

- create manual booking from a phone call
- create manual booking for walk-in clients
- block time for a break or personal busy interval
- view today's bookings
- use one shared Telegram bot with a dedicated staff flow

## Data Model

Initial collections:

- `users`
- `media`
- `masters`
- `services`
- `working-hours`
- `schedule-exceptions`
- `bookings`

Notes:

- `users` is intentionally simple for now: one CMS user type for the owner
- masters are not CMS users in the MVP
- manual bookings from masters will be created through Telegram and stored in `bookings`
- masters are identified by `masters.telegramUserId`

## Booking Logic

Available slots are generated from:

1. master regular working hours
2. schedule exceptions
3. service duration
4. existing active bookings

Core rules:

- no overlapping bookings
- slot must fully fit inside working hours
- slot must not intersect a blocked interval
- slot duration depends on the selected service
- cancelled bookings do not block time
- booking source is stored explicitly: `telegram`, `phone`, `walk-in`, `staff-bot`

## Local Development

1. Copy env file: `cp .env.example .env`
2. Start MongoDB locally or through Docker
3. Install dependencies: `npm install`
4. Seed demo salon data: `npm run seed:demo`
5. Run dev server: `npm run dev`
6. Open `http://localhost:3000`
7. Open admin panel at `http://localhost:3000/admin`

## Important Env Vars

- `DATABASE_URL` MongoDB connection string
- `PAYLOAD_SECRET` Payload secret, use a long random value
- `SALON_TIMEZONE` timezone used for slot calculation
- `SLOT_INTERVAL_MINUTES` slot step, default `15`
- `APP_BASE_URL` public app URL used in Telegram web app buttons
- `TELEGRAM_BOT_TOKEN` token for the shared bot
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` optional bot username for frontend links

## Docker

The repository includes a production-style `Dockerfile` and `docker-compose.yml`.

Run:

```bash
cp .env.example .env
docker compose up --build
```

Notes:

- the app container runs as a non-root user
- `docker-compose.yml` overrides `DATABASE_URL` to `mongodb://mongo:27017/salon` inside the container network
- container health is exposed on `GET /api/health`

## Vercel

Required project envs:

- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `APP_BASE_URL`

Recommended defaults:

- `SALON_TIMEZONE=Europe/Moscow`
- `SLOT_INTERVAL_MINUTES=15`

Optional envs:

- `TELEGRAM_BOT_TOKEN`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`

Production values:

- `APP_BASE_URL` should be your public HTTPS URL, for example `https://salon.example.com`
- `PAYLOAD_SECRET` should be generated, for example with `openssl rand -base64 32`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` should be stored without leading `@`
- set Node.js version to `22.x` in Vercel to match the project runtime and Docker image

Important limitation:

- the current `media` collection uses Payload local disk uploads
- Vercel filesystem is not durable, so production media uploads should be moved to S3, R2, or another external object storage before relying on admin uploads

## Phases

### Phase 1

- scaffold `Next.js + Payload`
- configure `MongoDB`
- add core collections
- add admin auth
- add frontend shell with `Tailwind`

### Phase 2

- build booking domain service
- generate available slots
- validate bookings on server
- add staff token flow and manual booking routes

### Phase 3

- build Telegram mini app flow
- add Telegram bot entrypoint
- deep link from bot to mini app
- open staff panel from the same bot for masters

### Phase 4

- deployment to Vercel
- harden auth and permissions
- add notifications and operational polish

## Engineering Priorities

- correctness of slot calculation over UI speed
- server-side validation for every booking mutation
- minimal but extensible schema
- no hidden business logic in the client
- one source of truth for schedule state

## Non-Goals For First Version

- payments
- loyalty program
- advanced CRM analytics
- multi-branch support
- multilingual UI
