#!/usr/bin/env node
/**
 * prune-vercel-deployments.mjs
 * 
 * Automatically purges older Vercel deployments, keeping ONLY the latest active deployment
 * to prevent Vercel deployment storage from accumulating over time.
 * 
 * Usage:
 *   VERCEL_TOKEN=your_token node scripts/prune-vercel-deployments.mjs
 * 
 * Optional environment variables:
 *   VERCEL_PROJECT_ID: Project name or ID (defaults to 'hanboro')
 *   VERCEL_ORG_ID: Team / Scope ID (if using a team account)
 *   KEEP_COUNT: Number of recent deployments to keep (default: 1)
 */

import https from "node:https";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let token = process.env.VERCEL_TOKEN || process.env.VERCEL_AUTH_TOKEN;
let teamId = process.env.VERCEL_ORG_ID;

if (!token || !teamId) {
  try {
    const cliDir = path.join(os.homedir(), "Library/Application Support/com.vercel.cli");
    const authPath = path.join(cliDir, "auth.json");
    const configPath = path.join(cliDir, "config.json");
    if (!token && fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
      token = auth.token;
    }
    if (!teamId && fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      teamId = config.currentTeam;
    }
  } catch {}
}

const projectName = process.env.VERCEL_PROJECT_NAME || "hanboro";
const keepCount = Math.max(1, parseInt(process.env.KEEP_COUNT || "1", 10));

if (!token) {
  console.log("----------------------------------------------------------------------");
  console.log("ℹ️  Vercel Deployment Storage Optimizer");
  console.log("----------------------------------------------------------------------");
  console.log("To automatically prune older deployments and free up storage, run:");
  console.log("  VERCEL_TOKEN=your_token node scripts/prune-vercel-deployments.mjs");
  console.log("");
  console.log("Alternatively, enable automatic retention directly in your Vercel Dashboard:");
  console.log("  1. Open https://vercel.com/dashboard");
  console.log("  2. Navigate to your project -> Settings -> Security");
  console.log("  3. Under 'Deployment Retention Policy', configure Preview/Canceled/Errored to 1 day.");
  console.log("----------------------------------------------------------------------");
  process.exit(0);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function run() {
  console.log(`🔍 Fetching project details for "${projectName}"...`);
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let resolvedProjectId = process.env.VERCEL_PROJECT_ID;
  try {
    const projUrl = `https://api.vercel.com/v9/projects/${projectName}${teamId ? `?teamId=${teamId}` : ""}`;
    const { status, body } = await request(projUrl, { headers });
    if (status === 200 && body?.id) {
      resolvedProjectId = body.id;
      console.log(`✓ Resolved Project ID: ${resolvedProjectId}`);
    }
  } catch (e) {
    console.warn("Could not query project ID dynamically:", e.message);
  }

  if (!resolvedProjectId) {
    resolvedProjectId = "prj_M7MImII2ndTrx1sFruPcnoZAni5n";
  }

  console.log(`🔍 Fetching deployments for project "${projectName}" (${resolvedProjectId})...`);

  const projectDeployments = [];
  let until;
  do {
    const query = new URLSearchParams({ limit: "100", projectId: resolvedProjectId });
    if (teamId) query.set("teamId", teamId);
    if (until) query.set("until", String(until));

    const listUrl = `https://api.vercel.com/v6/deployments?${query.toString()}`;
    const { status, body } = await request(listUrl, { headers });
    if (status !== 200 || !body || !Array.isArray(body.deployments)) {
      console.error(`❌ Failed to fetch deployments (HTTP ${status}):`, body);
      process.exit(1);
    }

    projectDeployments.push(...body.deployments);
    const last = body.deployments.at(-1);
    until = body.deployments.length === 100 && last?.createdAt ? last.createdAt : undefined;
  } while (until);

  console.log(`Found ${projectDeployments.length} total deployments for ${projectName} (${resolvedProjectId}).`);
  if (projectDeployments.length <= keepCount) {
    console.log(`✅ Only ${projectDeployments.length} deployment(s) exist (<= ${keepCount} to keep). No pruning needed.`);
    return;
  }

  // Sort newest to oldest
  projectDeployments.sort((a, b) => b.createdAt - a.createdAt);

  const keep = projectDeployments.slice(0, keepCount);
  const toDelete = projectDeployments.slice(keepCount);

  console.log(`🛡️ Keeping ${keep.length} latest deployment(s):`);
  keep.forEach((d) => console.log(`   - ${d.url} (State: ${d.state}, Created: ${new Date(d.createdAt).toISOString()})`));

  console.log(`\n🗑️ Pruning ${toDelete.length} older deployment(s) to optimize storage...`);
  let deletedCount = 0;
  for (const dep of toDelete) {
    const deleteUrl = `https://api.vercel.com/v13/deployments/${dep.uid || dep.id}${teamId ? `?teamId=${teamId}` : ""}`;
    try {
      const delRes = await request(deleteUrl, { method: "DELETE", headers });
      if (delRes.status === 200) {
        deletedCount++;
        console.log(`   ✓ Deleted ${dep.url} (${dep.uid || dep.id})`);
      } else {
        console.warn(`   ⚠️ Could not delete ${dep.url}:`, delRes.body);
      }
    } catch (err) {
      console.error(`   ⚠️ Error deleting ${dep.url}:`, err.message);
    }
  }

  console.log(`\n🎉 Successfully pruned ${deletedCount} older deployment(s). Only latest deployment remains active.`);
}

run().catch((err) => {
  console.error("Fatal error during deployment pruning:", err);
  process.exit(1);
});
