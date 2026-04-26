import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frappeUrl = env.VITE_FRAPPE_URL || "https://gt.digigalaxy.cloud";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/frappe": {
          target: frappeUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/frappe/, "/api"),
        },
      },
    },
  };
});
