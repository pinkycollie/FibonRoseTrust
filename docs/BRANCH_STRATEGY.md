# Git Branch Strategy

## Branch Structure

This repository follows a modern Git workflow using `main` as the default branch (not `master`). This aligns with current industry best practices and GitHub's recommendations.

### Default Branch: `main`

The `main` branch is the default and primary branch for this repository:
- Production-ready code
- Protected branch with required reviews
- All releases are tagged from `main`
- Direct commits are not allowed

### Development Branches

#### Feature Branches
Pattern: `feature/<feature-name>` or `copilot/<feature-name>`

- Created from `main` for new features
- Merged back to `main` via Pull Request
- Deleted after merge

Examples:
- `copilot/audit-and-archive-old-files`
- `feature/nft-minting`
- `feature/trust-score-v2`

#### Bugfix Branches
Pattern: `bugfix/<bug-description>` or `fix/<bug-description>`

- Created from `main` for bug fixes
- Merged back to `main` via Pull Request
- Deleted after merge

#### Hotfix Branches
Pattern: `hotfix/<critical-fix>`

- Created from `main` for urgent production fixes
- Merged directly to `main` with expedited review
- Tagged immediately after merge

### Release Strategy

#### Semantic Versioning
We follow [Semantic Versioning](https://semver.org/):
- MAJOR version: Incompatible API changes
- MINOR version: Backwards-compatible functionality
- PATCH version: Backwards-compatible bug fixes

Current version: `1.0.0`

#### Release Process
1. Create release branch from `main`: `release/v1.1.0`
2. Final testing and documentation updates
3. Merge to `main` via Pull Request
4. Tag the merge commit: `git tag -a v1.1.0 -m "Release v1.1.0"`
5. Push tags: `git push --tags`
6. GitHub Actions automatically creates release notes

### Pull Request Workflow

#### Creating a Pull Request
1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Push branch to GitHub
4. Create Pull Request targeting `main`
5. Fill out PR template with:
   - Description of changes
   - Testing performed
   - Breaking changes (if any)
   - Screenshots (for UI changes)

#### PR Review Process
- Automated CI/CD checks must pass:
  - ✓ Tests (Node.js 18.x and 20.x)
  - ✓ Type checking (TypeScript)
  - ✓ Build verification
  - ✓ Code coverage
- At least 1 approving review required
- No merge conflicts
- Branch up to date with `main`

#### Merging Strategies
- **Squash and merge**: Default for feature branches (cleaner history)
- **Merge commit**: For releases and significant feature sets
- **Rebase and merge**: For small fixes and documentation updates

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

#### Examples
```bash
feat(trust-score): implement Fibonacci level 21+ calculation

Add support for trust scores beyond level 21 with progressive verification requirements.

Closes #123

fix(auth): resolve DeafAuth session timeout issue

- Increase session timeout to 24 hours
- Add automatic refresh before expiration
- Improve error handling for expired sessions

Fixes #456

docs(ecosystem): add MBTQ integration documentation

Created comprehensive documentation for ecosystem integration including DeafAuth, PinkSync, and FibonRos connections.
```

### Protected Branch Rules

#### `main` Branch Protection
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - CI/CD tests
  - Build verification
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (no merge commits from PRs)
- ✅ Include administrators in restrictions
- ✅ Restrict who can push to matching branches

### Branch Naming Conventions

#### Good Branch Names ✅
- `feature/add-nft-metadata`
- `fix/broken-xano-integration`
- `docs/update-api-reference`
- `refactor/storage-service`
- `test/add-integration-tests`
- `copilot/audit-and-archive-old-files`

#### Poor Branch Names ❌
- `my-branch`
- `test123`
- `fix`
- `updates`
- `patch`

### Branch Cleanup

#### Automatic Cleanup
- Feature branches are automatically deleted after merge
- Stale branches (>90 days inactive) are flagged for review
- Merged branches are archived in Git history

#### Manual Cleanup
```bash
# List merged branches
git branch --merged main

# Delete local merged branch
git branch -d feature/branch-name

# Delete remote merged branch
git push origin --delete feature/branch-name

# Prune remote tracking branches
git fetch --prune
```

### Migration from `master` to `main`

This repository has migrated from the traditional `master` branch to `main`:

**Why the change?**
- Aligns with GitHub's default branch naming
- Follows industry best practices
- More inclusive terminology
- Better reflects the branch's purpose

**No `master` branch exists** - All development and deployment uses `main`.

If you have local clones using `master`:
```bash
# Update your local repository
git branch -m master main
git fetch origin
git branch -u origin/main main
git remote set-head origin -a
```

### Integration with CI/CD

The CI/CD pipeline (`.github/workflows/ci.yml`) is triggered on:
- Push to `main` branch
- Pull requests targeting `main` or `develop` branches
- Tagged releases

### Emergency Procedures

#### Reverting a Bad Merge
```bash
# Find the merge commit
git log --oneline --graph

# Revert the merge commit (use -m 1 for mainline)
git revert -m 1 <merge-commit-hash>

# Push the revert
git push origin main
```

#### Rolling Back a Release
```bash
# Create hotfix branch from previous good tag
git checkout -b hotfix/rollback-v1.1.0 v1.0.9

# Make necessary changes
git commit -am "Rollback to v1.0.9 and fix issue"

# Create PR to main
git push origin hotfix/rollback-v1.1.0
```

## Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)

## Questions?

For questions about the branch strategy, contact the repository maintainers or open a discussion in GitHub Discussions.

---

**Last Updated**: 2025-12-12  
**Version**: 1.0.0
