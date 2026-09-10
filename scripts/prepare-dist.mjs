#!/usr/bin/env node
import { cpSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

if (!existsSync(client)) {
  throw new Error("Missing dist/client directory to mirror to root dist");
}

// Mirror all client bundle items directly into dist/ so that Vercel's default
// "dist" outputDirectory setting resolves index.html and assets immediately,
// while preserving dist/client intact for Sites packaging and tests.
for (const item of readdirSync(client)) {
  cpSync(path.join(client, item), path.join(dist, item), { recursive: true });
}

console.log("Prepared root dist: successfully mirrored client assets to dist/ for Vercel.");
