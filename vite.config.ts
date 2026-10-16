// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Only the isolated browser-test launcher supplies this override.
const securityTestPort =
  process.env.HRIS_SECURITY_TEST === "1" ? Number(process.env.HRIS_API_PORT) : 0;
if (
  process.env.HRIS_SECURITY_TEST === "1" &&
  (!Number.isInteger(securityTestPort) ||
    securityTestPort < 1024 ||
    securityTestPort > 65535 ||
    securityTestPort === 47102)
) {
  throw new Error("A separate API port is required for the security browser test");
}

export default defineConfig({
  vite: {
    preview: {
      proxy: {
        "/api": `http://127.0.0.1:${process.env.HRIS_API_PORT || 47102}`,
      },
    },
    server: {
      watch: {
        ignored: ["**/server/exports/**"],
      },
      proxy: {
        "/api": securityTestPort
          ? `http://127.0.0.1:${securityTestPort}`
          : "http://localhost:47102",
      },
    },
  },
});
