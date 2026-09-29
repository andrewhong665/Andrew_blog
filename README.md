# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Supabase table

The Data Table page reads all columns from the `public."MyInfo"` table. Create a local
`.env` file based on `.env.example` and set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project's Connect panel.
Restart the Vite server after changing environment variables.

The page derives its columns from the returned rows. Configure the Data API and
database grants/RLS policies to allow the intended app users to read this data.
Do not put a service-role or secret key in a `VITE_` variable.

The Photo Album page reads public images from the `Andrew_Blog_photos` Storage
bucket. Its Vercel API functions provide administrator sign-in and protected
upload/delete operations. Four quick clicks on the footer copyright open the
admin login dialog.

Set these variables in Vercel **Project Settings → Environment Variables** for
Production, Preview, and Development, then redeploy:

- `SUPABASE_SERVICE_ROLE_KEY`: the project's server-side service-role/secret
  key. This must never use a `VITE_` prefix or be exposed in browser code.
- `ADMIN_PASSWORD`: a strong, unique password of at least 12 characters.
- `ADMIN_SESSION_SECRET`: a random secret with at least 32 characters.
- `ADMIN_USERNAME`: optional; defaults to `Admin`.

The Vercel API also uses `VITE_SUPABASE_URL` to connect to the project. The
`SUPABASE_SERVICE_ROLE_KEY` bypasses Storage RLS, so it is used only inside
server-side API functions after validating the signed, HttpOnly admin session.
Keep `.env` out of Git. For local testing of Vercel API functions, run
`vercel dev`; the Vite development server alone does not run the `api/`
functions.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
