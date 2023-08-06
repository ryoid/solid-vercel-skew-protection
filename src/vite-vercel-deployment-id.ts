import { Plugin, ConfigEnv } from "vite";

const vercelDeploymentId = (): Plugin => {
  let pluginEnabled = false;
  const deploymentId =
    process.env.VITE_DEPLOYMENT_ID ?? process.env.VERCEL_DEPLOYMENT_ID;
  let configEnv: ConfigEnv;
  let clientEntry: string | undefined;
  return {
    name: "vercel-deployment-id",
    config(config: any, env) {
      configEnv = env;
      clientEntry = config.solidOptions.clientEntry;

      pluginEnabled = env.command === "build" && env.mode === "production";
      !!deploymentId && deploymentId !== "";
      return {
        define: {
          "import.meta.env.VITE_DEPLOYMENT_ID": JSON.stringify(
            deploymentId ?? ""
          ),
        },
      };
    },
    transform(code, id) {
      if (!pluginEnabled) {
        return;
      }
      if (configEnv.ssrBuild) {
        // Html tag transforms
        // TODO: Find a better way to do this
        if (id.endsWith("node_modules/solid-start/root/Scripts.tsx")) {
          console.log("Transforming server entry Scripts src", id);
          return {
            code: code.replace(
              /_\$ssrAttribute\("src", _\$escape\(([^,]+),/g,
              `_\$ssrAttribute("src", _\$escape($1 + "?dpl=" + import.meta.env.VITE_DEPLOYMENT_ID,`
            ),
          };
        } else if (id.endsWith("node_modules/solid-start/root/Links.tsx")) {
          console.log("Transforming server entry Links href", id);
          return {
            code: code.replace(
              /_\$ssrAttribute\("href", _\$escape\(([^,]+),/g,
              `_\$ssrAttribute("href", _\$escape($1 + "?dpl=" + import.meta.env.VITE_DEPLOYMENT_ID,`
            ),
          };
        }
      } else {
        if (id !== clientEntry) {
          return;
        }
        console.log("Adding deploymentImport to client entry", id);
        return {
          code:
            `
            window.__deploymentImport = (file) => {
              const url = new URL(file, import.meta.url)
              url.searchParams.set('dpl', import.meta.env.VITE_DEPLOYMENT_ID)
              return import(url)
            };
          ` + code,
        };
      }
    },
    renderChunk(code, chunk) {
      if (!pluginEnabled) {
        return;
      }
      if (!configEnv.ssrBuild) {
        // Handle codesplit imports
        chunk.imports.forEach((imported) => {
          // assets/ChevronLeftIcon-!~{00c}~.js
          // Include the deployment id search param
          const importedFile = imported.split("/").pop();
          if (!importedFile) {
            return;
          }
          // TODO: Verify if this is a reliable method
          code = code.replace(
            `from './${importedFile}'`,
            `from './${importedFile}?dpl=${deploymentId}'`
          );
        });
        return {
          code,
        };
      }
    },
    renderDynamicImport(options) {
      if (
        !pluginEnabled ||
        // Prevent replacing own entry import usage causing infinite loop;
        !options.targetModuleId
      ) {
        return;
      }
      if (!configEnv.ssrBuild) {
        // Handle dynamic imports (incl filerouter routes)
        // TODO: Does not trigger for worker imports `new Worker('./worker.js')`
        return {
          left: "window.__deploymentImport(",
          right: ")",
        };
      }
    },
  };
};

export default vercelDeploymentId;
