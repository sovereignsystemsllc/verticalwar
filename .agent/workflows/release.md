---
description: Trigger a full push to GitHub with a version update (Current: 0.3.1.0)
---

# Release Protocol

This workflow stages all current changes, commits them with a specific version tag, and pushes them to the repository.

1. Stage all changes in the workspace

```powershell
git add .
```

// turbo
2. Commit the changes with the updated version number

```powershell
git commit -m "V3 System Update: Version 0.3.1.0"
```

// turbo
3. Push the commit to the remote repository

```powershell
git push origin main
```
