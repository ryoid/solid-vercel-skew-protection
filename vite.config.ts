import vercel from "solid-start-vercel";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

import { Plugin } from "vite";

const vercelDeploymentImports = (): Plugin => {
  let pluginEnabled = false;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  let clientEntry: string | undefined;
  return {
    name: "vercel-skew-handling",
    config(config: any, env) {
      pluginEnabled =
        env.command === "build" &&
        env.mode === "production" &&
        env.ssrBuild === false &&
        !!deploymentId &&
        deploymentId !== "";
      clientEntry = config.solidOptions.clientEntry;
      return {
        define: {
          "import.meta.env.VITE_VERCEL_DEPLOYMENT_ID": JSON.stringify(
            deploymentId ?? ""
          ),
        },
      };
    },
    transform(code, id) {
      if (!pluginEnabled || !clientEntry || id !== clientEntry) {
        return;
      }
      console.log("Adding deploymentImport to client entry", id);
      return {
        code:
          `
          window.__deploymentImport = (file) => {
            const url = new URL(file, import.meta.url)
            url.searchParams.set('dpl', import.meta.env.VITE_VERCEL_DEPLOYMENT_ID)
            return import(url)
          };
        ` + code,
      };
    },
    renderDynamicImport(options) {
      if (!pluginEnabled || !options.targetModuleId) {
        return;
      }
      return {
        left: "window.__deploymentImport(",
        right: ")",
      };
    },
  };
};

export default defineConfig({
  plugins: [
    solid({
      adapter: vercel(),
    }),
    vercelDeploymentImports(),
  ],
});
