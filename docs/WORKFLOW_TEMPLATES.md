# Centralized Workflow Templates

This document describes the centralized GitHub Actions workflow templates in the FibonRoseTrust repository that support automation and autonomous QA.

## Workflow Overview

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `reusable-qa.yml` | Reusable QA workflow template | Called by other workflows |
| `ci.yml` | Main CI/CD pipeline | Push/PR to main, develop |
| `branch-analyzer.yml` | Branch activity analysis | Daily schedule, manual |
| `microservice-evolution.yml` | Microservice change detection | Push to feature/*, etc. |
| `pr-automation.yml` | PR automation & triage | PR events, comments |
| `deploy.yml` | Deployment pipeline | Push to main, manual |
| `local-ai.yml` | AI model management | Daily schedule, manual |

## Reusable QA Workflow

The `reusable-qa.yml` workflow provides a centralized template for quality assurance that can be called by any workflow.

### Usage

```yaml
jobs:
  qa:
    uses: ./.github/workflows/reusable-qa.yml
    with:
      node-version: '20.x'
      run-tests: true
      run-lint: true
      run-build: true
      upload-coverage: true
    secrets:
      CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `node-version` | string | `20.x` | Node.js version to use |
| `run-tests` | boolean | `true` | Whether to run tests |
| `run-lint` | boolean | `true` | Whether to run linting |
| `run-build` | boolean | `true` | Whether to run build |
| `upload-coverage` | boolean | `false` | Whether to upload coverage |
| `environment` | string | `development` | Target environment |

### Outputs

| Output | Description |
|--------|-------------|
| `test-passed` | Whether all tests passed |
| `build-passed` | Whether build succeeded |
| `is-mergeable` | Whether the branch is ready to merge |

## Branch Activity Analyzer

The `branch-analyzer.yml` workflow analyzes branch activity and PR health.

### Features

- **Branch Activity Tracking**: Identifies most active branches by recent commits
- **Stale Branch Detection**: Flags branches with no activity > 60 days
- **PR Analysis**: Tracks open PRs, mergeability status, and review state
- **Activity Reports**: Generates JSON reports for tracking trends

### Outputs

The workflow produces:
- Branch activity summary in workflow step summary
- PR analysis with mergeability status
- JSON activity report as artifact

### Schedule

Runs daily at 6 AM UTC, or can be triggered manually.

## Microservice Evolution Pipeline

The `microservice-evolution.yml` workflow handles continuous evolution of microservices.

### Features

- **Change Detection**: Automatically detects which services changed
- **Selective Testing**: Runs tests only for affected components
- **Mergeability Assessment**: Determines if PR is ready to merge
- **PR Comments**: Adds automated comments with merge status

### Supported Branches

- `feature/**` - New features
- `hotfix/**` - Critical fixes
- `release/**` - Release branches
- `copilot/**` - AI-generated changes

### Components Tracked

| Component | Path |
|-----------|------|
| Client | `client/` |
| Server | `server/` |
| Shared | `shared/` |
| Tools | `tools/` |
| Tests | `test/` |
| Docs | `docs/` |

## PR Automation

The `pr-automation.yml` workflow automates PR management.

### Features

- **Auto-labeling**: Labels PRs based on branch name and size
- **Welcome Comments**: Adds helpful comments on new PRs
- **Testability Checks**: Runs tests and reports status
- **Review Automation**: Adds labels when PRs are approved
- **Merge Commands**: Supports `/merge` command in comments

### Labels Applied

| Condition | Label |
|-----------|-------|
| Branch starts with `feature/` | `feature` |
| Branch starts with `hotfix/` | `hotfix` |
| Branch starts with `release/` | `release` |
| Branch starts with `copilot/` | `copilot` |
| Branch starts with `fix/` | `bug` |
| Branch starts with `docs/` | `documentation` |
| <= 10 lines changed | `size/XS` |
| <= 50 lines changed | `size/S` |
| <= 200 lines changed | `size/M` |
| <= 500 lines changed | `size/L` |
| > 500 lines changed | `size/XL` |
| PR is draft | `WIP` |

### Merge Command

Maintainers can use `/merge` in comments to trigger squash merge.

## Security

All workflows follow security best practices:

- **Minimal Permissions**: Each job has explicit, minimal permissions
- **No Secrets in Logs**: Sensitive data is never printed
- **Protected Actions**: Merge commands require write access
- **Checkout Security**: Uses `pull_request_target` safely with explicit SHA

## Adding New Workflows

When adding new workflows, follow these patterns:

1. **Use the Reusable QA Template** for consistency
2. **Define Explicit Permissions** at workflow and job level
3. **Add Documentation** in this file
4. **Create Step Summaries** for visibility

### Example

```yaml
name: New Feature Workflow

on:
  push:
    branches: [ main ]

permissions:
  contents: read

jobs:
  my-job:
    name: My Job
    runs-on: ubuntu-latest
    permissions:
      contents: read
    
    steps:
      - uses: actions/checkout@v4
      # ... your steps
      
      - name: Summary
        run: |
          echo "## Results" >> $GITHUB_STEP_SUMMARY
          echo "Job completed successfully" >> $GITHUB_STEP_SUMMARY
```

## Monitoring

### Workflow Status

Check workflow status in:
- GitHub Actions tab
- PR status checks
- Workflow artifacts (reports)

### Activity Reports

Activity reports are generated daily and stored as artifacts for 30 days.

### Metrics Tracked

- Branch activity (commits, staleness)
- PR health (mergeability, review status)
- Test results and build status
- Deployment success rates

## Troubleshooting

### Common Issues

1. **Workflow not running**: Check if branch name matches trigger patterns
2. **Permission denied**: Verify workflow has required permissions
3. **Tests failing**: Check test output in Actions logs
4. **Merge blocked**: Review mergeability check output

### Debugging

Enable workflow debug logging:
1. Add secret `ACTIONS_STEP_DEBUG` = `true`
2. Add secret `ACTIONS_RUNNER_DEBUG` = `true`
