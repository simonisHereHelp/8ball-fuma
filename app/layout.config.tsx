import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="inline-flex flex-row gap-3 items-center pb-2 [aside_&]:-ms-1.5">
        <span className="inline-flex items-center justify-center size-8 rounded-lg bg-fd-primary/10 text-fd-primary">
          <svg
            aria-label="DocuSniff logo"
            role="img"
            viewBox="0 0 32 32"
            className="size-5"
          >
            <path
              d="M16 2C9.372 2 4 7.372 4 14c0 7.732 7.48 14.217 11.393 15.65a2 2 0 0 0 1.214 0C20.52 28.217 28 21.732 28 14 28 7.372 22.628 2 16 2Zm0 6.5a5.5 5.5 0 0 1 5.5 5.5c0 3.038-2.462 5.5-5.5 5.5a5.5 5.5 0 0 1 0-11Z"
              fill="currentColor"
            />
            <path
              d="M22.5 14.5c0 2.485-2.015 4.5-4.5 4.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </span>
      <span className="block w-px h-6 rotate-[16deg] bg-fd-border" />
      <span className="text-sm font-semibold tracking-tight">99 cents bagel</span>
      </span>
    ),
  },
  links: [
    {
      text: "Documentation",
      url: "/docs",
      active: "nested-url",
    },
    {
      text: "8ball-cam (文件狗)",
      url: "https://8ball-cam.vercel.app",
    }
  ],
};
