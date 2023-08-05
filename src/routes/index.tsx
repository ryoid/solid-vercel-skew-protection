export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <button
        onClick={() => {
          import("~/data").then((mod) => {
            console.log("loaded data", mod.data);
          });
        }}
      >
        load dynamic data ({import.meta.env.VITE_VERCEL_DEPLOYMENT_ID})
      </button>
    </main>
  );
}
