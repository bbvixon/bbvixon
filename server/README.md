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

Production startup applies this idempotent schema automatically before starting the API.

This creates:

- `contact_messages`
- `assistant_logs`
- `design_stories`
- `portfolio_apps`

## Design stories CMS

Set a long random admin key locally and in Render:

```env
CMS_ADMIN_KEY=replace_with_a_long_random_secret
```

After deployment, open the private editor at:

```text
https://your-domain.example/#cms
```

Enter the admin key to load the editor. Saving a story writes it to PostgreSQL and updates the public portfolio through `/api/design-stories`; content changes do not require a new build or deploy.

The admin key is kept only in the browser tab's session storage. Story images use public URLs, because Render's service filesystem is ephemeral.

The same editor includes an Apps tab. App cards can be added, reordered, published, or hidden without redeploying the portfolio.

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
