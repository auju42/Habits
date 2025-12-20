# Development Workflow Guide

This guide explains how to safely develop and test new features without breaking your working application.

## 🌳 1. The "Branch" Strategy (Version Control)
Think of your code like a tree.
- **`main`**: The trunk. This is your "Production" code. It should **always process**.
- **`feature/xyz`**: A new branch. This is where you experiment. If you break it, the trunk (`main`) is still safe.

### How to use it:
1.  **Start a new feature**:
    ```bash
    git checkout -b feature/google-calendar
    ```
    *Now you are in a parallel universe. You can delete everything, and `main` is still safe.*

2.  **Save your work (Commit)**:
    ```bash
    git add .
    git commit -m "Added google login button"
    ```

3.  **Switch back to safe mode**:
    ```bash
    git checkout main
    ```

4.  **Merge (Make it real)**:
    If your feature works perfectly, bring it into the main app:
    ```bash
    git merge feature/google-calendar
    ```

---

## 🧪 2. "Proof of Concept" (Testing before Developing)
Before building a complex UI (like "Settings Page -> Integrations -> Connect -> Sync"), we test the **core logic** first.

**How we will test Google Calendar:**
1.  We WON'T touch your real tasks yet.
2.  We will create a temporary "Test Button" somewhere hidden (or a new temporary page).
3.  **The Test**: Clicking it will try to just *console.log* your Google Name.
4.  **The Result**:
    - If it fails: We debug the "Test Button". Your app is fine.
    - If it works: We copy that logic into the real "taskService.ts".

## 🚀 Summary Checklist for Phase 4
1. [ ] Create branch `feature/google-calendar`.
2. [ ] Create a "Sandbox" component (isolated test).
3. [ ] Verify Google API works (POC).
4. [ ] Implement into real app.
5. [ ] Merge to `main`.
