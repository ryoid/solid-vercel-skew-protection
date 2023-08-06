import vercel from "solid-start-vercel";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

import vercelDeploymentId from "./src/vite-vercel-deployment-id";

export default defineConfig({
  plugins: [
    solid({
      adapter: vercel(),
    }),
    vercelDeploymentId(),
  ],
});
