# Partial PR Merger

A precision tool for cherry-picking specific lines from a GitHub Pull Request and merging them into your target branch without the need to clone the repository locally.

![Partial PR Merger Hero](public/assets/hero-card-readme.png)

## 🚀 Key Features

*   **Surgical Selection**: Choose exactly which lines to merge from a PR.
    *   **Keep (Repo Version)**: Retain the original code (Red lines).
    *   **Add (PR Version)**: Apply the new changes (Green lines).
    *   **Smart Mutual Exclusion**: Selecting a block of changes automatically handles conflicts, ensuring you don't merge duplicate logic.
*   **No-Clone Workflow**: Operates entirely via the GitHub API. No `git clone`, no local storage overhead.
*   **Sidebar Navigation**:
    *   Click file names to smooth-scroll to changes.
    *   **Bulk Actions**: Toggle entire files between "PR Version" and "Repo Version" with a single click.
    *   **Status Indicators**: identifying partial or mixed selections at a glance.
    *   **Resizable**: Drag the sidebar edge to resize it (200px – 600px).
*   **🤖 AI-Powered Feature Grouping** *(optional)*:
    *   Sends the PR diff to an LLM (Gemini, OpenAI, or Anthropic) which groups changes into logical **features**.
    *   Toggle entire features on/off with a single click.
    *   Automatic **dependency detection** between features with confirmation prompts.
    *   **Pre-annotated diffs** with exact line IDs for high accuracy.
    *   **Coverage validation**: any lines the AI misses are auto-grouped into "Uncategorized Changes" so nothing is lost.
    *   Prominent warning banner reminding users to always verify AI suggestions manually.

## 🛠️ Tech Stack

*   **Frontend**: React + Vite
*   **Styling**: Tailwind CSS (Custom Design System)
*   **Icons**: Lucide React
*   **API**: Octokit (GitHub REST API)
*   **AI**: Native `fetch` (no SDK dependencies) — supports Google Gemini, OpenAI, and Anthropic

## 📖 Usage Guide

### Authentication

1.  Enter your **GitHub Personal Access Token (PAT)** when prompted.
2.  Required Scope: `repo` (to read code and push commits).
3.  *Tip: Use the built-in Help ('?') link to generate one with the correct permissions.*
4.  **Optional Storage**: Check "Remember me" to store your token locally. Uncheck for a one-time session (token cleared on exit).

### Analyze a Pull Request

1.  Paste the full URL of a GitHub PR (e.g., `https://github.com/owner/repo/pull/123`).
2.  Click **"Analyze"**.

### Select Your Changes

*   **Master Toggle**: Switch between **"Block"** (select entire chunks) and **"Single"** (select individual lines) modes globally.
*   **Per-File Overrides**: You can also toggle the mode for specific files individually.
*   The **Left Sidebar** shows all changed files. Click to jump to them.
*   **Green Checkbox**: Select to **ADD** the change from the PR.
*   **Red Checkbox**: Select to **KEEP** the original version (reject the change).

### AI Feature Grouping *(Optional)*

1.  Click **"Analyze with AI"** in the header.
2.  If not configured, the AI setup modal opens — select a provider (Gemini recommended) and enter your API key.
3.  Choose whether to **save the key locally** (Remember me) or keep it for the current session only.
4.  The AI analyzes the diff and groups changes into named features in the sidebar.
5.  **Toggle** features on/off — dependencies are checked automatically.
6.  Use **"Select All"** / **"Deselect All"** for bulk actions.

> ⚠️ AI suggestions may be inaccurate. Always verify the selected lines manually before merging.

### Merge

1.  Click **"Merge Selected Lines"**.
2.  The app constructs a new commit on the target branch with *only* your selected changes and pushes it to GitHub.

### Log Out

*   Click **"Forget keys & exit"** to clear all saved keys (GitHub PAT & AI API key) and return to the home page.

## 📦 Installation (Local Dev)

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` to start merging!

## 🔒 Privacy & Security

*   All API keys are stored **only** in your browser's `localStorage` (if you opt in) or kept in memory for the session.
*   Keys are **never** sent to any server — all API calls go directly from your browser to GitHub / your AI provider.
*   Click "Forget keys & exit" at any time to wipe everything.

---
*Built for precision and speed.*
