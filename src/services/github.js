import { Octokit } from "octokit";

// Helper to get Octokit instance
const getOctokit = (token) => new Octokit({ auth: token });

export const checkAuth = async (token) => {
    try {
        const octokit = getOctokit(token);
        const { data } = await octokit.rest.users.getAuthenticated();
        return data;
    } catch (error) {
        throw new Error("Invalid Personal Access Token");
    }
};

export const parsePRUrl = (url) => {
    try {
        const regex = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
        const match = url.match(regex);
        if (!match) throw new Error("Invalid GitHub PR URL");
        return { owner: match[1], repo: match[2], pull_number: parseInt(match[3]) };
    } catch (e) {
        return null;
    }
};

export const getPRDetails = async (token, { owner, repo, pull_number }) => {
    const octokit = getOctokit(token);

    // Get PR metadata to find head branch and base branch
    const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number,
    });

    // Get Diff
    // We use the raw diff url or media type to get the diff text
    const { data: diff } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: { format: "diff" },
    });

    return { pr, diff };
};

export const getFileContent = async (token, { owner, repo, path, ref }) => {
    const octokit = getOctokit(token);
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        if (Array.isArray(data)) throw new Error("Path is a directory");

        // Decode content
        const content = atob(data.content.replace(/\n/g, ""));
        return { content, sha: data.sha };
    } catch (e) {
        // If file doesn't exist (new file), return empty
        return { content: "", sha: null };
    }
}

/**
 * The "No-Clone" Merge Strategy
 * 1. Get Context (Latest Commit SHA of target branch)
 * 2. Create Blob (File content with cherry-picked lines)
 * 3. Create Tree
 * 4. Create Commit
 * 5. Update Reference
 */
export const mergeLines = async (token, { owner, repo, baseBranch, itemsToMerge, message }) => {
    const octokit = getOctokit(token);

    // 1. Get Context (Latest Commit of Base Branch)
    const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
    });
    const latestCommitSha = refData.object.sha;
    const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha
    });
    const baseTreeSha = commitData.tree.sha;

    // 2. Create Blobs & Construct Tree Items
    const treeItems = [];

    for (const item of itemsToMerge) {
        // item: { path: string, content: string }
        // We assume 'content' is the FINAL content of the file we want to push

        const { data: blobData } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: item.content,
            encoding: "utf-8",
        });

        treeItems.push({
            path: item.path,
            mode: "100644", // standard file
            type: "blob",
            sha: blobData.sha,
        });
    }

    // 3. Create Tree
    const { data: treeData } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: treeItems,
    });
    const newTreeSha = treeData.sha;

    // 4. Create Commit
    const { data: newCommitData } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: message || "Cherry-pick specific lines via Partial Merger",
        tree: newTreeSha,
        parents: [latestCommitSha],
    });
    const newCommitSha = newCommitData.sha;

    // 5. Update Reference
    await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
        sha: newCommitSha,
    });

    return { newCommitSha };
};
