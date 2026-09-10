import { createHashHistory, createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const staticSpa = import.meta.env.VITE_STATIC_SPA === "1";
  const raw = import.meta.env.BASE_URL || "/";
  const basepath =
    !staticSpa && raw !== "/" && !raw.startsWith(".")
      ? raw.replace(/\/$/, "")
      : undefined;
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    ...(basepath ? { basepath } : {}),
    ...(staticSpa ? { history: createHashHistory() } : {}),
  });
}
