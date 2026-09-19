#!/usr/bin/env node
/**
 * prune-vercel-deployments.mjs
 * 
 * Automatically purges older Vercel deployments, keeping ONLY the latest active deployment
 * to prevent Vercel deployment storage from accumulating over time.
 * 
 * Usage:
 *   node scripts/prune-vercel-deployments.mjs
 *   node scripts/prune-vercel-deployments.mjs --all   # Prunes older deployments across all projects in account
 * 
 * Optional environment variables:
 *   VERCEL_TOKEN: Personal Access Token
 *   VERCEL_PROJECT_NAME: Project name or ID (defaults to 'hanboro')
 *   VERCEL_ORG_ID: Team / Scope ID (defaults to team_84kghfxkIvBUGdILrsBNIvJj)
 *   KEEP_COUNT: Number of recent deployments to keep (default: 1)
 */

import https from "node:https";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const isAllMode = process.argv.includes("--all") || process.argv.includes("--account") || process.env.PRUNE_ALL === "true";
const keepCount = Math.max(1, parseInt(process.env.KEEP_COUNT || "1", 10));
const projectName = process.env.VERCEL_PROJECT_NAME || "hanboro";

function getCredentials() {
  let token = process.env.VERCEL_TOKEN || process.env.VERCEL_AUTH_TOKEN;
  let teamId = process.env.VERCEL_ORG_ID;

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

  if (!teamId) {
    teamId = "team_84kghfxkIvBUGdILrsBNIvJj";
  }

  return { token, teamId };
}

let { token, teamId } = getCredentials();

function refreshAuth() {
  console.log("🔄 Refreshing Vercel credentials via CLI...");
  try {
    execSync("npx -y vercel whoami", { stdio: "ignore" });
    const creds = getCredentials();
    token = creds.token;
    teamId = creds.teamId;
    return true;
  } catch (e) {
    console.warn("⚠️ CLI refresh failed:", e.message);
    return false;
  }
}

if (!token) {
  refreshAuth();
}

if (!token) {
  console.log("----------------------------------------------------------------------");
  console.log("ℹ️  Vercel Deployment Storage Optimizer");
  console.log("----------------------------------------------------------------------");
  console.log("To automatically prune older deployments and free up storage, run:");
  console.log("  VERCEL_TOKEN=your_token node scripts/prune-vercel-deployments.mjs");
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

async function authenticatedRequest(url, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  let res = await request(url, { ...options, headers });
  if (res.status === 403 && res.body?.error?.invalidToken) {
    console.log("Token expired. Attempting token refresh...");
    if (refreshAuth()) {
      headers.Authorization = `Bearer ${token}`;
      res = await request(url, { ...options, headers });
    }
  }
  return res;
}

async function pruneProject(targetProjectName, targetProjectId) {
  console.log(`\n🔍 Checking deployments for "${targetProjectName}" (${targetProjectId || "by name"})...`);
  const projectDeployments = [];
  let until;

  do {
    const query = new URLSearchParams({ limit: "100" });
    if (targetProjectId) query.set("projectId", targetProjectId);
    if (teamId) query.set("teamId", teamId);
    if (until) query.set("until", String(until));

    const listUrl = `https://api.vercel.com/v6/deployments?${query.toString()}`;
    const { status, body } = await authenticatedRequest(listUrl);

    if (status !== 200 || !body || !Array.isArray(body.deployments)) {
      console.error(`❌ Failed to fetch deployments for ${targetProjectName} (HTTP ${status}):`, body);
      return 0;
    }

    const matching = targetProjectId 
      ? body.deployments 
      : body.deployments.filter(d => d.name === targetProjectName);

    projectDeployments.push(...matching);
    const last = body.deployments.at(-1);
    until = body.deployments.length === 100 && last?.createdAt ? last.createdAt : undefined;
  } while (until && projectDeployments.length < 500);

  if (projectDeployments.length <= keepCount) {
    console.log(`   ✅ Project "${targetProjectName}" has ${projectDeployments.length} deployment(s) (<= ${keepCount} to keep). Clean.`);
    return 0;
  }

  // Sort newest first
  projectDeployments.sort((a, b) => b.createdAt - a.createdAt);

  const keep = projectDeployments.slice(0, keepCount);
  const toDelete = projectDeployments.slice(keepCount);

  console.log(`   🛡️ Keeping latest ${keep.length} deployment(s):`);
  keep.forEach((d) => console.log(`      - ${d.url} (${new Date(d.createdAt).toISOString().slice(0, 10)})`));

  console.log(`   🗑️ Pruning ${toDelete.length} older deployment(s)...`);
  let deletedCount = 0;
  for (const dep of toDelete) {
    const deleteUrl = `https://api.vercel.com/v13/deployments/${dep.uid || dep.id}${teamId ? `?teamId=${teamId}` : ""}`;
    try {
      const delRes = await authenticatedRequest(deleteUrl, { method: "DELETE" });
      if (delRes.status === 200) {
        deletedCount++;
        console.log(`      ✓ Deleted ${dep.url}`);
      } else {
        console.warn(`      ⚠️ Could not delete ${dep.url}:`, delRes.body?.error?.message || delRes.body);
      }
    } catch (err) {
      console.error(`      ⚠️ Error deleting ${dep.url}:`, err.message);
    }
  }

  console.log(`   🎉 Pruned ${deletedCount} older deployments from "${targetProjectName}".`);
  return deletedCount;
}

async function run() {
  console.log("======================================================================");
  console.log("🛡️  VERCEL DEPLOYMENT STORAGE OPTIMIZER");
  console.log(`Mode: ${isAllMode ? "All Projects in Account" : `Single Project (${projectName})`}`);
  console.log(`Retention Target: Keep latest ${keepCount} deployment(s)`);
  console.log("======================================================================");

  if (isAllMode) {
    const projsUrl = `https://api.vercel.com/v9/projects?limit=100${teamId ? `&teamId=${teamId}` : ""}`;
    const { status, body } = await authenticatedRequest(projsUrl);
    if (status !== 200 || !Array.isArray(body?.projects)) {
      console.error("❌ Failed to list account projects:", body);
      process.exit(1);
    }

    console.log(`Found ${body.projects.length} projects in account.`);
    let totalPruned = 0;
    for (const proj of body.projects) {
      const pruned = await pruneProject(proj.name, proj.id);
      totalPruned += pruned;
    }
    console.log(`\n✨ Account Cleanup Complete! Total older deployments pruned: ${totalPruned}`);
  } else {
    let resolvedProjectId = process.env.VERCEL_PROJECT_ID;
    if (!resolvedProjectId) {
      try {
        const projUrl = `https://api.vercel.com/v9/projects/${projectName}${teamId ? `?teamId=${teamId}` : ""}`;
        const { status, body } = await authenticatedRequest(projUrl);
        if (status === 200 && body?.id) {
          resolvedProjectId = body.id;
        }
      } catch {}
    }
    if (!resolvedProjectId) {
      resolvedProjectId = "prj_M7MImII2ndTrx1sFruPcnoZAni5n";
    }

    const pruned = await pruneProject(projectName, resolvedProjectId);
    console.log(`\n✨ Done! Older deployments pruned: ${pruned}. Only latest deployment remains active.`);
  }
}

run().catch((err) => {
  console.error("Fatal error during deployment pruning:", err);
  process.exit(1);
});
