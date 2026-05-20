import { readFile } from "node:fs/promises";
import path from "node:path";

async function getBuildMetadata() {
  try {
    const filePath = path.join(process.cwd(), "generated", "build-metadata.json");
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      branch: null,
      commit: null,
      shortCommit: null,
      repo: null,
      builtAt: null
    };
  }
}

async function getLatestGithubCommit(repo, branch) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "f1-scoreboard-update-check"
  };

  if (process.env.GITHUB_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_API_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(branch)}`, {
    headers,
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status}`);
  }

  const payload = await response.json();

  return {
    sha: payload?.sha || null,
    shortSha: payload?.sha ? String(payload.sha).slice(0, 7) : null,
    message: payload?.commit?.message?.split("\n")[0] || null
  };
}

export async function getDeploymentStatus() {
  const metadata = await getBuildMetadata();
  const branch = process.env.GITHUB_REPO_BRANCH || metadata.branch || "main";

  if (!metadata.repo || !metadata.commit) {
    return {
      state: "unavailable",
      branch,
      repo: metadata.repo,
      currentCommit: metadata.shortCommit,
      latestCommit: null,
      latestMessage: null,
      builtAt: metadata.builtAt
    };
  }

  try {
    const latest = await getLatestGithubCommit(metadata.repo, branch);
    const currentCommit = String(metadata.commit);
    const latestCommit = String(latest.sha || "");
    const isUpToDate =
      currentCommit === latestCommit ||
      currentCommit.startsWith(latestCommit) ||
      latestCommit.startsWith(currentCommit);

    return {
      state: isUpToDate ? "up_to_date" : "update_available",
      branch,
      repo: metadata.repo,
      currentCommit: metadata.shortCommit,
      latestCommit: latest.shortSha,
      latestMessage: latest.message,
      builtAt: metadata.builtAt
    };
  } catch {
    return {
      state: "error",
      branch,
      repo: metadata.repo,
      currentCommit: metadata.shortCommit,
      latestCommit: null,
      latestMessage: null,
      builtAt: metadata.builtAt
    };
  }
}
