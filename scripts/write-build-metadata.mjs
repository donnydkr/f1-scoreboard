import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, ".git");
const outputDir = path.join(repoRoot, "generated");
const outputPath = path.join(outputDir, "build-metadata.json");

function readText(filePath) {
  return readFileSync(filePath, "utf8").trim();
}

function resolveCommitFromHead() {
  if (!existsSync(gitDir)) {
    return {
      branch: null,
      commit: null
    };
  }

  const headValue = readText(path.join(gitDir, "HEAD"));

  if (!headValue.startsWith("ref:")) {
    return {
      branch: null,
      commit: headValue || null
    };
  }

  const ref = headValue.slice(5).trim();
  const refPath = path.join(gitDir, ...ref.split("/"));
  const branch = ref.startsWith("refs/heads/") ? ref.replace("refs/heads/", "") : ref;

  if (existsSync(refPath)) {
    return {
      branch,
      commit: readText(refPath) || null
    };
  }

  const packedRefsPath = path.join(gitDir, "packed-refs");

  if (existsSync(packedRefsPath)) {
    const packedRefs = readFileSync(packedRefsPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("^"));

    for (const line of packedRefs) {
      const [commit, packedRef] = line.split(" ");

      if (packedRef === ref) {
        return {
          branch,
          commit: commit || null
        };
      }
    }
  }

  return {
    branch,
    commit: null
  };
}

function parseOriginRepo() {
  const configPath = path.join(gitDir, "config");

  if (!existsSync(configPath)) {
    return null;
  }

  const config = readFileSync(configPath, "utf8");
  const originSectionMatch = config.match(/\[remote "origin"\]([\s\S]*?)(\n\[|$)/);

  if (!originSectionMatch) {
    return null;
  }

  const urlMatch = originSectionMatch[1].match(/url\s*=\s*(.+)/);
  const url = urlMatch?.[1]?.trim();

  if (!url) {
    return null;
  }

  const repoMatch = url.match(/github\.com[:/](.+?)(?:\.git)?$/i);
  return repoMatch?.[1] || null;
}

const head = resolveCommitFromHead();
const metadata = {
  branch: head.branch,
  commit: head.commit,
  shortCommit: head.commit ? head.commit.slice(0, 7) : null,
  repo: parseOriginRepo(),
  builtAt: new Date().toISOString()
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
console.log(`Wrote build metadata to ${outputPath}`);
