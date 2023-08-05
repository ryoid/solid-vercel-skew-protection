import { APIEvent, json } from "solid-start/api";

export async function GET(ev: APIEvent) {
  return json({
    deploymentId: import.meta.env.VITE_VERCEL_DEPLOYMENT_ID ?? "undefined",
  });
}
