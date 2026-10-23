# DRG Arquitetura

Quero abrir esse site aqui

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://drgarquitetura.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75a71b2a-703e-4b49-9000-b19c3ddb1211).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

## Vercel

- Build command: `bun run build` (or `npm run build`). Do not force a static `dist` output directory; Nitro generates Vercel server functions and assets.
- The build configuration targets Vercel outside Lovable. Lovable builds keep their managed hosting target.
- Vercel automatically sets `VERCEL=1`. Without managed Cloud server credentials, the validated `/api/leads` and `/api/events` requests are forwarded server-side to `https://drgarquitetura.lovable.app`, so contacts and traffic stay in the existing Cloud. Keep that published app available.
- Never copy a service-role key into browser configuration or GitHub. Lovable Cloud's managed private key is not available for export.
- Private admin reads on external hosting still require a separately supported authenticated server connection; the capture relay does not proxy private data or administrator sessions.
- After syncing these changes to GitHub, trigger a new Vercel deployment; an existing deployment will keep its previous server code.

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
