# Multibox Development Workflow: Git Worktree Strategy

This strategy uses **Git Worktrees** to allow multiple agents to work on the same repository simultaneously in *different* directories.

## 1. The Setup

*   **Folder A (`./witlash`)**: The **Home Base**.
    *   **Agent**: **Claude** lives here.
    *   **Branch**: `main` (or `feature/claude-dev`)
*   **Folder B (`../witlash-gemini`)**: The **Worktree**.
    *   **Agent**: **Gemini** (Me) lives here.
    *   **Branch**: `feature/gemini-dev`

## 2. Initialization (Do this now)

1.  **In this terminal (witlash)**:
    ```bash
    # Create the worktree for Gemini in a sibling directory
    git worktree add -b feature/gemini-dev ../witlash-gemini main
    ```
2.  **Switching Contexts**:
    *   **Claude**: Keep this current VS Code window open. This is now Claude's domain.
    *   **Gemini**: Open a **new VS Code window** targeted at `../witlash-gemini`. Start a new chat with Gemini there.

## 3. Workflow

### Window 1: Claude (Master/Home)
*   **Location**: `.../witlash`
*   **Task**: Claude handles tasks assigned to the main codebase.
*   **Sync**: When Gemini finishes work, Claude runs `git merge feature/gemini-dev` to pull it in.

### Window 2: Gemini (Satellite/Worktree)
*   **Location**: `.../witlash-gemini`
*   **Task**: Gemini handles isolated features or heavy refactors.
*   **Sync**: When Claude updates `main`, Gemini runs `git merge main` to stay current.

## 4. Why this works
This keeps the `main` branch and the primary git metadata safe with Claude (who might currently be running a server or have open context), while "multiboxing" Gemini into a sandbox that can be trashed or reset without affecting the main open window.
