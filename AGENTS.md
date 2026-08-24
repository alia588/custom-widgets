<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Session, Branch, and Change-Safety Workflow

Follow this workflow for every feature, fix, or other repository change. Its purpose is to make progress recoverable, reviewable, and reproducible across sessions and worktrees.

## Start of a new session

1. Inspect the current repository and worktree status before changing anything. Do not overwrite, stash, discard, or otherwise alter existing uncommitted work without the user's explicit approval.
2. Update the local `main` branch from its configured remote before beginning new work. If the repository is dirty, the current branch is not `main`, or updating would require resolving a conflict, stop and clearly report the condition to the user rather than attempting to work around it.
3. Create and switch to a new, descriptive branch from the updated `main` branch before implementing the requested work. Use one branch for one cohesive change whenever practical.
4. State the branch name and any pre-existing working-tree changes or risks before starting implementation.

## Iteration checkpoints and remote branches

1. At the end of each meaningful implementation or review iteration, inspect the diff and commit the completed, coherent changes locally with a descriptive commit message. Do not mix unrelated changes in one commit.
2. Remind the user that the current iteration is ready to be committed if a commit has not yet been made, and explain what will be included.
3. Pushing a branch or creating/updating its remote tracking branch is an external action and requires the user's explicit permission. Ask before each push unless the user has already given ongoing permission for pushes in the current task.
4. After a user-approved push, report the branch and commit that were pushed. Never claim that a commit or push occurred unless it actually completed.
5. If a commit cannot be made because of test failures, incomplete work, merge state, missing user information, or another issue, preserve the worktree and clearly report the exact blocker and the current uncommitted state.

## Database and data changes

1. Every schema or persistent database change must include a version-controlled migration file in the repository's established migration format and location. Do not make schema-only changes through an untracked manual database operation.
2. Keep the migration focused, ordered, reversible where the project's tooling supports rollback, and safe for the expected existing data. Include any required indexes, constraints, backfill, seed, or application compatibility changes in the same cohesive branch, with their execution order documented.
3. Do not run migrations, data repairs, seeds, or other production-affecting database commands without explicit user authorization. Distinguish files prepared in the repository from database actions that were actually executed.
4. Commit migration files with the code that depends on them so a checked-out commit represents a coherent application and schema state. Verify migrations with the project-supported checks when it is safe and authorized to do so.

## Multiple worktrees, branches, and merge conflicts

1. Before editing shared files, check whether the same repository is active in another worktree or whether current work may overlap another branch. Communicate likely overlap early.
2. Never automatically resolve merge or rebase conflicts. When a conflict occurs or is likely, stop at the conflict, identify the affected files and branches, and ask the user to resolve it unless they explicitly instruct you to perform the resolution.
3. Do not use destructive Git commands or silently overwrite another branch's work to make progress. Preserve all local work and explain any conflict or divergence that needs the user's decision.
4. Keep branch-specific work isolated. Merge, rebase, force-push, reset, or delete branches only with explicit user authorization.

## Progress records and handoff

1. Keep source code, configuration, migrations, tests, documentation, and generated artifacts that are required for reproducibility under version control; never rely on chat context or uncommitted local files as the only record of required work.
2. Before handing off, report the current branch, latest commit, working-tree status, tests or checks run, database changes prepared or executed, and any pending user decisions.
3. If work remains uncommitted, identify every relevant file and why it remains uncommitted so the user can safely resume in another session.
