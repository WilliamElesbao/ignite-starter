# CI/CD Pipeline Documentation

This directory contains comprehensive documentation for setting up and maintaining the CI/CD pipeline for this monorepo.

## Overview

The CI/CD pipeline consists of three main components:

1. **Drone CI** - Self-hosted continuous integration server for running tests, linting, and type checking
2. **SonarCloud** - Code quality and security analysis platform
3. **GitHub Actions** - Automated workflows for code quality checks on pull requests

## Documentation Structure

- [Pipeline Architecture](./pipeline-architecture.md) - Visual overview and execution flow
- [Drone CI Setup](./drone-setup.md) - Self-hosted Drone CI configuration
- [SonarCloud Setup](./sonarcloud-setup.md) - Code quality analysis configuration
- [GitHub Configuration](./github-configuration.md) - Secrets, branch protection, and workflows
- [Configuration Files](./configuration-files.md) - Reference for all CI/CD configuration files

## Quick Start

1. Set up [Drone CI](./drone-setup.md) (self-hosted)
2. Configure [SonarCloud](./sonarcloud-setup.md)
3. Add [GitHub secrets and branch protection](./github-configuration.md)
4. Verify all [configuration files](./configuration-files.md) are in place

## Pipeline Checks

The pipeline runs the following checks on every push and pull request:

- **Type Checking** - TypeScript validation across all packages
- **Linting** - Biome code quality checks
- **Testing** - Vitest unit tests
- **Code Quality** - SonarCloud analysis

## Required Status Checks

Before merging to `main`, the following checks must pass:

- ✅ CI (Drone CI pipeline)
- ✅ SonarCloud (Code quality analysis)
- ✅ Biome Lint (PR inline comments)

## Support

For troubleshooting common issues, refer to the specific setup guides linked above.
