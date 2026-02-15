# Partial PR Merger

A precision tool for cherry-picking specific lines from a GitHub Pull Request and merging them into your target branch without the need to clone the repository locally.

![Project Merge Landing](https://media.discordapp.net/attachments/placeholder.png)

## 🚀 Key Features

*   **Surgical Selection**: Choose exactly which lines to merge from a PR.
    *   **Keep (Repo Version)**: Retain the original code (Red lines).
    *   **Add (PR Version)**: Apply the new changes (Green lines).
    *   **Smart Mutual Exclusion**: Selecting a block of changes automatically handles conflicts, ensuring you don't merge duplicate logic.
*   **No-Clone Workflow**: Operates entirely via the GitHub API. No `git clone`, no local storage overhead.
*   **Premium Design**:
    *   **Typography**: distinct 'DM Serif Display' headings and 'Outfit' body text.
    *   **Visuals**: Clean, dark-mode interface with syntax highlighting for diffs.
*   **Sidebar Navigation**:
    *   Click file names to smooth-scroll to changes.
    *   **Bulk Actions**: Toggle entire files between "PR Version" and "Repo Version" with a single click.
    *   **Status Indicators**: identifying partial or mixed selections at a glance.

## 🛠️ Tech Stack

*   **Frontend**: React + Vite
*   **Styling**: Tailwind CSS (Custom Design System)
*   **Icons**: Lucide React
*   **API**: Octokit (GitHub REST API)

## 📖 Usage Guide

1.  **Authentication**:
    *   Enter your **GitHub Personal Access Token (PAT)** when prompted.
    *   Required Scope: `repo` (to read code and push commits).
    *   *Tip: Use the built-in Help ('?') link to generate one with the correct permissions.*

2.  **Analyze a Pull Request**:
    *   Paste the full URL of a GitHub PR (e.g., `https://github.com/owner/repo/pull/123`).
    *   Click **"Analyze"**.

3.  **Select Your Changes**:
    *   The **Left Sidebar** shows all changed files. use the checkbox to bulk-select the PR version or the Repo version.
    *   The **Main Diff View** allows line-by-line control.
    *   **Green Checkbox**: Select to **ADD** the change from the PR.
    *   **Red Checkbox**: Select to **KEEP** the original version (reject the change).

4.  **Merge**:
    *   Click **"Merge Selected Lines"**.
    *   The app will construct a new commit on the target branch with *only* your selected changes and push it to GitHub.

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

---
*Built for precision and speed.*
