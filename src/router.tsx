import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  // When deployed to GitHub Pages the app lives under /24hournews/.
  // VITE_BASE_PATH is injected by the deploy workflow; it is undefined in
  // local dev and on any other host, so the router falls back to "/".
  const basepath = import.meta.env["VITE_BASE_PATH"] ?? "/";

  const router = createRouter({
    routeTree,
    basepath,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
