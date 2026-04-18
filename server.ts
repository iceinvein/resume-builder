import index from "./src/index.html";

const server = Bun.serve({
  routes: {
    "/": index,
    "/typst-worker.js": async () => {
      const file = Bun.file("./public/typst-worker.js");
      return new Response(file, {
        headers: { "Content-Type": "application/javascript" },
      });
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Listening on ${server.url}`);
