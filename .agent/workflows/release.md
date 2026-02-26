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
$count = (git rev-list --count HEAD)
$next = [int]$count + 1
$version = "0.3.1.${next}a"
git commit -m "V3 Architecture Update | [Version: $version]"
```

// turbo
3. Push the commit to the remote repository

```powershell
git push origin main
```
