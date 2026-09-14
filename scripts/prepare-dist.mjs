#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

if (!existsSync(client)) {
  throw new Error("Missing dist/client directory to mirror to root dist");
}

// Mirror index.html directly into dist/ for backward compatibility with tools
// expecting dist/index.html, without duplicating the heavy 1.5GB assets.
const clientIndex = path.join(client, "index.html");
const distIndex = path.join(dist, "index.html");
if (existsSync(clientIndex)) {
  copyFileSync(clientIndex, distIndex);
}

console.log("Prepared root dist: index.html mirrored without duplicating heavy assets.");
