import { requestUrl, RequestUrlResponse } from 'obsidian';

export interface DeployConfig {
  githubToken: string;
  githubRepo: string;
  githubBranch?: string;
}

export interface DeployResult {
  success: boolean;
  message: string;
  url?: string;
}

interface TreeEntry {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string | null; // null = delete the file from the tree
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function deploySite(
  files: Map<string, string>,
  config: DeployConfig,
  images?: Map<string, string> // deployPath → base64 content
): Promise<DeployResult> {
  if (!config.githubToken) {
    return { success: false, message: "GitHub token is required. Add it in VaultFolio settings." };
  }
  if (!config.githubRepo) {
    return { success: false, message: "GitHub repository is required (format: owner/repo)." };
  }

  const parts = config.githubRepo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      success: false,
      message: "Repository must be in owner/repo format (e.g. username/my-portfolio).",
    };
  }

  const [owner, repo] = parts;
  const branch = config.githubBranch ?? "gh-pages";

  try {
    // Step 1: resolve branch to its current commit + tree SHA
    const { commitSha, treeSha } = await getOrCreateBranch(owner, repo, branch, config.githubToken);

    // Step 1b: find stale VaultFolio-managed files that must be deleted
    const existingPaths = await fetchExistingPaths(owner, repo, treeSha, config.githubToken);
    const newPathSet = new Set<string>([
      ...files.keys(),
      ...(images ? images.keys() : []),
    ]);
    const stalePaths = findStalePaths(existingPaths, newPathSet);

    // Step 2: upload each file as a blob
    const entries: TreeEntry[] = [];
    for (const [path, content] of files) {
      const sha = await createBlob(owner, repo, content, "utf-8", config.githubToken);
      entries.push({ path, mode: "100644", type: "blob", sha });
    }
    if (images) {
      for (const [path, content] of images) {
        const sha = await createBlob(owner, repo, content, "base64", config.githubToken);
        entries.push({ path, mode: "100644", type: "blob", sha });
      }
    }
    // Mark stale files for deletion (sha: null removes them from the tree)
    for (const path of stalePaths) {
      entries.push({ path, mode: "100644", type: "blob", sha: null });
    }

    // Step 3: create a new tree containing all blobs
    const newTreeSha = await createTree(owner, repo, treeSha, entries, config.githubToken);

    // Step 4: create a commit pointing to the new tree
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const newCommitSha = await createCommit(
      owner,
      repo,
      `VaultFolio deploy — ${timestamp}`,
      newTreeSha,
      commitSha,
      config.githubToken
    );

    // Step 5: fast-forward the branch ref to the new commit
    await updateRef(owner, repo, branch, newCommitSha, config.githubToken);

    const url = `https://${owner}.github.io/${repo}/`;
    const total = files.size + (images?.size ?? 0);
    return {
      success: true,
      message: `Deployed ${total} file(s). View at ${url}`,
      url,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Git object helpers ────────────────────────────────────────────────────────

async function getOrCreateBranch(
  owner: string,
  repo: string,
  branch: string,
  token: string
): Promise<{ commitSha: string; treeSha: string }> {
  const refRes = await ghRequest("GET", `/repos/${owner}/${repo}/git/refs/heads/${branch}`, token);

  if (ok(refRes)) {
    const ref = refRes.json as { object: { sha: string } };
    const commitSha = ref.object.sha;
    const commit = await ghJson<{ tree: { sha: string } }>(
      "GET",
      `/repos/${owner}/${repo}/git/commits/${commitSha}`,
      token
    );
    return { commitSha, treeSha: commit.tree.sha };
  }

  if (refRes.status !== 404) {
    throw buildApiError(refRes, "checking branch");
  }

  // Branch doesn't exist — base it on main or master
  const baseSha = await findDefaultBranchSha(owner, repo, token);

  const createRes = await ghRequest("POST", `/repos/${owner}/${repo}/git/refs`, token, {
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });
  if (!ok(createRes)) throw buildApiError(createRes, "creating branch");

  const commit = await ghJson<{ tree: { sha: string } }>(
    "GET",
    `/repos/${owner}/${repo}/git/commits/${baseSha}`,
    token
  );
  return { commitSha: baseSha, treeSha: commit.tree.sha };
}

async function findDefaultBranchSha(owner: string, repo: string, token: string): Promise<string> {
  for (const name of ["main", "master"]) {
    const res = await ghRequest("GET", `/repos/${owner}/${repo}/git/refs/heads/${name}`, token);
    if (ok(res)) {
      const data = res.json as { object: { sha: string } };
      return data.object.sha;
    }
  }
  throw new Error(
    "Could not find main or master branch. Push an initial commit to the repo first."
  );
}

async function createBlob(
  owner: string,
  repo: string,
  content: string,
  encoding: "utf-8" | "base64",
  token: string
): Promise<string> {
  const data = await ghJson<{ sha: string }>(
    "POST",
    `/repos/${owner}/${repo}/git/blobs`,
    token,
    { content, encoding }
  );
  return data.sha;
}

async function createTree(
  owner: string,
  repo: string,
  baseTreeSha: string,
  entries: TreeEntry[],
  token: string
): Promise<string> {
  const data = await ghJson<{ sha: string }>(
    "POST",
    `/repos/${owner}/${repo}/git/trees`,
    token,
    { base_tree: baseTreeSha, tree: entries }
  );
  return data.sha;
}

async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
  token: string
): Promise<string> {
  const data = await ghJson<{ sha: string }>(
    "POST",
    `/repos/${owner}/${repo}/git/commits`,
    token,
    { message, tree: treeSha, parents: [parentSha] }
  );
  return data.sha;
}

async function updateRef(
  owner: string,
  repo: string,
  branch: string,
  commitSha: string,
  token: string
): Promise<void> {
  const res = await ghRequest(
    "PATCH",
    `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    token,
    { sha: commitSha, force: true }
  );
  if (!ok(res)) throw buildApiError(res, "updating branch ref");
}

// ── Stale-file helpers ────────────────────────────────────────────────────────

async function fetchExistingPaths(
  owner: string,
  repo: string,
  treeSha: string,
  token: string
): Promise<string[]> {
  const res = await ghRequest(
    "GET",
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    token
  );
  // A 404 or any error here just means no files to clean up yet
  if (!ok(res)) return [];
  const data = res.json as { tree: Array<{ path: string; type: string }> };
  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);
}

function findStalePaths(existingPaths: string[], newPaths: Set<string>): string[] {
  return existingPaths.filter(
    (p) => (p.endsWith(".html") || p.startsWith("images/")) && !newPaths.has(p)
  );
}

// ── Request utilities ─────────────────────────────────────────────────────────

function ok(res: RequestUrlResponse): boolean {
  return res.status >= 200 && res.status < 300;
}

function ghRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<RequestUrlResponse> {
  return requestUrl({
    url: `https://api.github.com${path}`,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    throw: false,
  });
}

async function ghJson<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<T> {
  const res = await ghRequest(method, path, token, body);
  if (!ok(res)) throw buildApiError(res, `${method} ${path}`);
  return res.json as T;
}

function buildApiError(res: RequestUrlResponse, context: string): Error {
  let detail = String(res.status);
  try {
    const body = res.json as { message?: string };
    if (body?.message) detail = body.message;
  } catch { /* ignore parse errors */ }

  if (res.status === 401) {
    return new Error("Invalid GitHub token. Check your token in VaultFolio settings.");
  }
  if (res.status === 404) {
    return new Error(
      `Not found while ${context}. Check the repository name and token permissions.`
    );
  }
  return new Error(`GitHub API error ${res.status} (${context}): ${detail}`);
}
