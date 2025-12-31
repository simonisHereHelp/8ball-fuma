# Next.js 14 Google Drive-backed docs — clean-slate build guide

This guide builds a fresh Next.js 14 app that follows the Drive-only flow (Drive file → adapter → render spec → renderer). It uses NextAuth to obtain a session **AccessToken** and never exposes Google client libraries in the app. No uploader flows are included—the app is a Drive-backed documentation viewer only.

## 1) Scaffold the app
1. Create the project from the official template:
   ```bash
   pnpm create next-app@latest drive-docs \
     --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" \
     --no-git --no-turbo
   cd drive-docs
   ```
2. Enable strictness (optional but recommended):
   - Set `"strict": true` and `"noEmit": true` in `tsconfig.json`.
   - Keep `"nextLint": true` in `package.json` scripts.

## 2) Canonical module layout (Drive flow names)
Place modules under `src/` mirroring the flow:
- `src/drive/client.ts` — lightweight Drive REST wrapper that accepts a NextAuth `session.AccessToken`.
- `src/drive/catalog.ts` — recursive walker that yields `DriveLocator` entries (id, name, mime, breadcrumbs).
- `src/drive/smart-grouper.ts` — optional grouping of related files into smart bundles.
- `src/adapter/*` — adapters for mdx/pdf/text/image/json/media/smart bundles producing render specs.
- `src/render-spec/assembler.ts` — takes a slug and emits `{ kind, meta, renderSpec }` via adapters.
- `src/renderers/registry.tsx` — maps render spec `kind` → client component renderer.
- `src/app/docs/[[...slug]]/page.tsx` — catch-all route that reads the render spec and renders via the registry.

## 3) Dependencies to add
```bash
pnpm add next-auth fumadocs-core fumadocs-ui @fumadocs/mdx-remote fast-glob shiki unist-util-visit zod
```

## 4) Environment variables
Create `.env.local` with least-privilege scopes and secrets:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...
DRIVE_FOLDER_ID=...   # the folder that stores docs
```

## 5) Authentication (`auth.tsx` at repo root)
- Configure NextAuth with the Google provider and the `https://www.googleapis.com/auth/drive.readonly` scope.
- Persist the provider access token on the JWT and expose both `session.AccessToken` and `session.accessToken` in the session callback for server and client usage.
- Export `auth`, `signIn`, `signOut`, and `{ GET, POST }` from `auth.tsx` to plug into `app/api/auth/[...nextauth]/route.ts` via the Route Handlers provided by NextAuth.

## 6) Drive client (uses session.AccessToken)
- Implement a thin wrapper around Drive REST endpoints using `fetch` with the bearer token from NextAuth.
- Methods: `listChildren(folderId)`, `getFile(fileId)`, `downloadText(fileId)`, `getPreviewUrl`, `getExportUrl`.
- Keep it server-only; React must not import this module.

## 7) Render spec assembly
- Use `walkDriveCatalog` to list the Drive folder tree, optionally filter by MIME allowlist.
- Pass locators (or bundled descriptors) through the adapter registry to produce `AdapterResult` objects with `{ kind, meta, renderSpec, cachePolicy }`.
- The docs route calls `assembleRenderSpec` with `{ slug, rootFolderId, enableSmartBundles }` using the session `AccessToken`.

## 8) Renderer registry and UI
- Register renderers for mdx, pdf, text, images, json, media, and smart bundles in a single `renderers/registry.tsx` entry.
- Each renderer receives a normalized render spec; no Drive calls occur in the client.
- Keep PDF preview/download URLs as data passed from the server so no client credential handling is required.

## 9) Caching and observability
- Add `lib/cache/content-cache.ts` to memoize adapter outputs keyed by Drive file IDs or bundle keys.
- `lib/pipeline/metrics.ts` and `lib/pipeline/logger.ts` can wrap cache misses/hits and adapter timings.

## 10) Testing notes
- Mock the Drive client for unit tests by injecting a `fetchImpl`.
- For integration, use NextAuth test utilities to seed a session with a fake `AccessToken` and verify `/docs/...` pages render the expected renderer per kind.

Following this sequence yields a Drive-only documentation app with modules named after the flow and authenticated exclusively through NextAuth.
