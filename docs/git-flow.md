# Git Flow for f1-scoreboard

This document outlines the Git workflow for managing the `f1-scoreboard` project across multiple developer PCs and a production server. The goal is to ensure a stable `main` branch that is only deployed to production after thorough testing on development environments.

## Branching Strategy: GitHub Flow

We will use a simplified GitHub Flow, where `main` is always deployable. All development happens in feature branches, which are merged into `main` after review and testing.

### Core Branches:

*   `main`: Represents the latest stable and deployable version of the application. Only tested features are merged into `main`.

### Workflow Steps:

#### 1. Developer PC Setup (Initial Clone)

Each developer will clone the repository to their local machine.

```bash
git clone https://github.com/donnydkr/f1-scoreboard.git
cd f1-scoreboard
git checkout main
git pull origin main
```

#### 2. Starting New Work (Developer PC)

Before starting any new feature or bug fix, developers should:

1.  Ensure their `main` branch is up-to-date.
    ```bash
git checkout main
git pull origin main
    ```
2.  Create a new feature branch from `main`.
    ```bash
git checkout -b feature/your-feature-name
    ```
    (Replace `feature/your-feature-name` with a descriptive name, e.g., `feature/admin-csv-import` or `bugfix/telemetry-parser-bug`)

#### 3. Developing and Committing (Developer PC)

Work on your feature, making regular commits.

```bash
# Make your changes to files
git add .
git commit -m "feat: Add new feature functionality" # Use descriptive commit messages
```

Regularly push your feature branch to the remote to back up your work and facilitate collaboration.

```bash
git push origin feature/your-feature-name
```

#### 4. Keeping Feature Branch Up-to-Date (Developer PC)

If the `main` branch has new changes while you are working on your feature, it's good practice to rebase your feature branch to keep it current. This helps avoid large merge conflicts later.

```bash
git checkout feature/your-feature-name
git pull origin main # This will fetch and rebase your branch on main
# If there are conflicts, resolve them and then run:
git add .
git rebase --continue
git push --force-with-lease origin feature/your-feature-name
```

#### 5. Completing a Feature (Developer PC - Pull Request)

Once the feature is complete and tested locally:

1.  Ensure your feature branch is rebased on the latest `main` (as in step 4).
2.  Push your feature branch to the remote.
    ```bash
git push origin feature/your-feature-name
    ```
3.  Open a Pull Request (PR) on GitHub (or your chosen Git platform) from `feature/your-feature-name` to `main`.
4.  Request reviews from other developers.
5.  Once approved and all tests pass (if applicable), merge the PR into `main`. **Prefer squashing or rebase merging** to keep `main` clean with meaningful commit history.

#### 6. Deploying to Production (Production PC)

The production PC will only pull changes from the `main` branch. This assumes that all features merged into `main` have been thoroughly tested on developer environments (e.g., local setup, staging environments).

```bash
# On the production server
cd /path/to/your/f1-scoreboard/project
git checkout main
git pull origin main
# After pulling, restart your application or deployment process
# (e.g., docker compose down -v && docker compose up -d --build, or your specific deployment script)
```

#### 7. Deleting Feature Branches (Optional, but Recommended)

After a feature branch has been successfully merged into `main` and deployed, it's good practice to delete the branch.

```bash
# On your developer PC
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Summary of Commands and Workflow:

### Developer PC:

*   **Initial Setup:**
    ```bash
git clone https://github.com/donnydkr/f1-scoreboard.git
cd f1-scoreboard
git checkout main
git pull origin main
    ```
*   **Starting New Feature:**
    ```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
    ```
*   **During Development:**
    ```bash
git add .
git commit -m "feat: Description of changes"
git push origin feature/your-feature-name
    ```
*   **Keeping Up-to-Date (optional, but good practice):**
    ```bash
git checkout feature/your-feature-name
git pull origin main
git push --force-with-lease origin feature/your-feature-name
    ```
*   **Finishing Feature (before PR):**
    ```bash
git checkout feature/your-feature-name
git pull origin main # Ensure latest main is incorporated
git push origin feature/your-feature-name
    ```
*   **After Merging PR:**
    ```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
    ```

### Production PC:

*   **Deployment (after features are tested and merged to `main`):**
    ```bash
cd /path/to/your/f1-scoreboard/project
git checkout main
git pull origin main
# Restart application (e.g., docker compose down -v && docker compose up -d --build)
    ```

This workflow ensures a clear separation of development from production, with `main` serving as the single source of truth for deployments, always containing tested and stable code.