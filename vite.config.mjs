import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function localApiPlugin() {
  return {
    name: "local-api-handler",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/")) return next();
        const url = new URL(req.url, "http://localhost");
        const pathname = url.pathname;

        let body = {};
        if (req.method === "POST") {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const raw = Buffer.concat(buffers).toString();
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch (e) {
            body = {};
          }
        }

        const mockRes = {
          setHeader: (k, v) => res.setHeader(k, v),
          status: (code) => ({
            json: (data) => {
              res.statusCode = code;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
            end: () => {
              res.statusCode = code;
              res.end();
            },
          }),
        };

        req.query = Object.fromEntries(url.searchParams);
        req.body = body;

        if (pathname === "/api/fastrr-otp") {
          const handler = (await import("./api/fastrr-otp.js")).default;
          return handler(req, mockRes);
        }

        if (pathname === "/api/fastrr-order") {
          const handler = (await import("./api/fastrr-order.js")).default;
          return handler(req, mockRes);
        }

        if (pathname === "/api/fastrr-user") {
          const handler = (await import("./api/fastrr-user.js")).default;
          return handler(req, mockRes);
        }

        if (pathname === "/api/track-order") {
          const handler = (await import("./api/track-order.js")).default;
          return handler(req, mockRes);
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          if (id.includes("src/indiaMapData")) {
            return "map-data";
          }
          if (id.includes("src/productsData")) {
            return "products-data";
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), localApiPlugin()],
});
