# Backend and PostgreSQL setup

This project now has a small Express API in `server/` and is ready for a live PostgreSQL database.

## Local development

Run the frontend in one terminal:

```powershell
npm run dev
```

Run the backend in another terminal:

```powershell
npm run dev:api
```

Health check:

```text
http://127.0.0.1:4000/api/health
```

## PostgreSQL environment

Add these values to `.env.local` for local testing, and to your hosting provider environment variables for production:

```env
DATABASE_URL=postgresql://username:password@host:5432/database
DATABASE_SSL=true
PORT=4000
CLIENT_ORIGIN=http://127.0.0.1:5173
```

Use `DATABASE_SSL=true` for most hosted PostgreSQL providers.

## Apply schema

After `DATABASE_URL` is set, run:

```powershell
npm run db:schema
```

This creates:

- `contact_messages`
- `assistant_logs`

## Contact route

The portfolio contact form posts to:

```http
POST /api/contact
```

Required fields:

- `name`
- `email`
- `message`

Optional field:

- `subject`
