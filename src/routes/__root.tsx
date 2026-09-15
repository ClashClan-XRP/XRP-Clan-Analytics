import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useState } from "react";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import { AuthProvider } from "@/lib/auth/provider";
import { APP_NAME } from "@/lib/cr/defaults";
import appCss from "../styles.css?url";

/** Hostname suitable for absolute share-card URLs. Mirrors publicAppHost. */
function publicShareHost(): string {
  const raw = (import.meta.env?.VITE_PUBLIC_HOSTNAME as string | undefined) || "";
  const host = String(raw).split(",")[0].trim().split(":")[0].toLowerCase();
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
  if (
    host === "vercel.app" ||
    host.endsWith(".vercel.app") ||
    host === "vercel.com" ||
    host.endsWith(".vercel.com")
  ) {
    return "";
  }
  return host;
}

export const Route = createRootRoute({
  head: () => {
    const host = publicShareHost();
    const xBanner = host ? `https://${host}/x-banner.jpg` : "";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: APP_NAME },
        {
          name: "description",
          content:
            "XRP Arena Intel — Clash Royale meta, upgrades, and 2v2 pairings for CryptoClan-$XRP.",
        },
        { name: "theme-color", content: "#0b1016" },
        ...(xBanner
          ? [
              { property: "x:game:image", content: xBanner },
              { property: "x:game:image:width", content: "1200" },
              { property: "x:game:image:height", content: "264" },
            ]
          : []),
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Teko:wght@500;600;700&display=swap",
        },
      ],
    };
  },
  component: Root,
});

function Root() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 0 } },
      }),
  );

  const app = (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Shell>
            <Outlet />
          </Shell>
        </QueryClientProvider>
      </AuthProvider>
    </>
  );

  const spaRoot = typeof document !== "undefined" && document.getElementById("root");
  if (spaRoot) return app;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {app}
        <Scripts />
      </body>
    </html>
  );
}
