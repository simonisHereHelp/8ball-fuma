## Next.js Fumadocs

View the Next.js docs with Fumadocs.

Google-drive.ts fails to carryout

## include PDF in /docs
The Docs route now renders Markdown/MDX/TXT and PDF files sourced from Google Drive with inline viewing (and a download fallback) while keeping the gallery image-only.
issue: how to prevent "stale file trees"?

## failed attempt: cover json and txt in /Docs route
- modify compile-md and Docs/[..slug]/page to cover json and text
- page-like UI with TOC
- poor json and text TOC response
- heavy page build load upon [..slug] page path, irresponsive page load

## Authentication

Add the following environment variables to enable the Google-based NextAuth flow and Drive uploads:

```
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `GOOGLE_DRIVE_UPLOAD_FOLDER_ID` (optional – defaults to the Drive folder used for docs)
```

Once configured, `/api/auth/[...nextauth]` will persist sessions and expose Drive-scoped access tokens to the app.

## Why the TOC/page tree is stale (shows deleted folders)

1) fetch(..., { cache: "force-cache" }), which tells Next/Vercel to cache 
【lib/sources/google-drive.ts】

 ```
  fetch calls to cache: "no-store" or set next: { revalidate: 0 }, which forces fresh
 ```
2) Docs pages are statically cached for 2 hours

export const revalidate = 7200;

【app/docs/[[...slug]]/page.tsx】

