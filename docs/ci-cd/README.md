# CI/CD Pipeline Documentation

This directory contains comprehensive documentation for setting up and maintaining the CI/CD pipeline for this monorepo.

## Overview

The CI/CD pipeline consists of three main components:

1. **Drone CI** - Self-hosted continuous integration server for running type checks and linting
2. **SonarCloud** - Code quality and security analysis platform
3. **GitHub Actions** - Automated workflows for code quality checks on pull requests

## Documentation Structure

- [Pipeline Architecture](./pipeline-architecture.md) - Visual overview and execution flow
- [Drone CI Setup](./drone-setup.md) - Self-hosted Drone CI configuration
- [SonarCloud Setup](./sonarcloud-setup.md) - Code quality analysis configuration
- [GitHub Configuration](./github-configuration.md) - Secrets, branch protection, and workflows
- [Configuration Files](./configuration-files.md) - Reference for all CI/CD configuration files

## Quick Start

Follow these steps in order to set up the complete CI/CD pipeline:

1. **Set up Drone CI** (self-hosted) - [Drone CI Setup Guide](./drone-setup.md)
2. **Configure SonarCloud** - [SonarCloud Setup Guide](./sonarcloud-setup.md)
3. **Add GitHub secrets and branch protection** - [GitHub Configuration Guide](./github-configuration.md)
4. **Verify all configuration files** - [Configuration Files Reference](./configuration-files.md)

## Pipeline Checks

The pipeline runs the following checks on every push and pull request:

### Drone CI Pipeline

- **Type Checking** - TypeScript validation across all packages (7 packages)
- **Linting** - Biome code quality checks in CI mode

### GitHub Actions Workflows

- **SonarCloud Analysis** - Code quality, security, and technical debt tracking
- **Biome Lint** - Inline annotations on pull requests for immediate feedback

## Required Status Checks

Before merging to `main`, the following checks must pass:

- ✅ **CI** (Drone CI pipeline) - Type checking and linting
- ✅ **sonar** (SonarCloud) - Code quality analysis
- ✅ **lint** (Biome) - PR inline comments (informational, doesn't block)

## Support

For issues or questions about the CI/CD pipeline:

1. Check this documentation first
2. Review workflow logs for error messages
3. Consult the specific setup guides
4. Reach out to the team for assistance
