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
    "/typst_ts_web_compiler_bg.wasm": async () => {
      const file = Bun.file("./public/typst_ts_web_compiler_bg.wasm");
      return new Response(file, {
        headers: { "Content-Type": "application/wasm" },
      });
    },
    "/typst_ts_renderer_bg.wasm": async () => {
      const file = Bun.file("./public/typst_ts_renderer_bg.wasm");
      return new Response(file, {
        headers: { "Content-Type": "application/wasm" },
      });
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Listening on ${server.url}`);
