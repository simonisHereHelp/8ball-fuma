## Next.js Fumadocs

View the Next.js docs with Fumadocs.

Google-drive.ts fails to carryout

## Why the TOC/page tree is stale (shows deleted folders)

1) fetch(..., { cache: "force-cache" }), which tells Next/Vercel to cache 
【lib/sources/google-drive.ts】

 ```
  fetch calls to cache: "no-store" or set next: { revalidate: 0 }, which forces fresh
 ```
2) Docs pages are statically cached for 2 hours

export const revalidate = 7200;

【app/docs/[[...slug]]/page.tsx】

