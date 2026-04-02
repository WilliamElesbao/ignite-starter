/**
 * Configuration Validation Tests for GitHub Actions
 * 
 * **Validates: Requirements 7.2, 8.3, 18.2**
 * 
 * These tests validate the GitHub Actions workflow configurations to ensure:
 * - Property 4: Workflow Trigger Consistency
 * - Property 7: Workflow Permission Minimality
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

interface WorkflowPermissions {
  contents?: string;
  'pull-requests'?: string;
  checks?: string;
  [key: string]: string | undefined;
}

interface WorkflowJob {
  permissions?: WorkflowPermissions;
  [key: string]: unknown;
}

interface WorkflowTrigger {
  push?: {
    branches?: string[];
  };
  pull_request?: {
    types?: string[];
  };
  [key: string]: unknown;
}

interface WorkflowConfig {
  name: string;
  on: WorkflowTrigger;
  jobs: {
    [key: string]: WorkflowJob;
  };
}

/**
 * Parse a GitHub Actions workflow YAML file
 */
function parseWorkflowYaml(filePath: string): WorkflowConfig {
  const content = readFileSync(filePath, 'utf-8');
  return parse(content) as WorkflowConfig;
}

describe('GitHub Actions Configuration Validation', () => {
  describe('Property 4: Workflow Trigger Consistency', () => {
    /**
     * **Validates: Requirements 5.1, 7.2, 18.2**
     * 
     * Property: For any GitHub Actions workflow that should run on all branches,
     * the trigger configuration must use branches: ['**'] or omit branch filters
     * entirely to ensure universal execution.
     */
    it('SonarCloud workflow should trigger on all branches using branches: ["**"]', () => {
      const workflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      
      expect(workflow.on.push).toBeDefined();
      expect(workflow.on.push?.branches).toBeDefined();
      expect(workflow.on.push?.branches).toEqual(['**']);
    });

    it('SonarCloud workflow should trigger on pull request events', () => {
      const workflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      
      expect(workflow.on.pull_request).toBeDefined();
      expect(workflow.on.pull_request?.types).toContain('opened');
      expect(workflow.on.pull_request?.types).toContain('synchronize');
      expect(workflow.on.pull_request?.types).toContain('reopened');
    });

    it('PR Review workflow should trigger only on pull request events', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      
      expect(workflow.on.pull_request).toBeDefined();
      expect(workflow.on.pull_request?.types).toContain('opened');
      expect(workflow.on.pull_request?.types).toContain('synchronize');
      expect(workflow.on.pull_request?.types).toContain('reopened');
      
      // Should NOT have push trigger
      expect(workflow.on.push).toBeUndefined();
    });

    it('workflows that run on all branches should not have restrictive branch filters', () => {
      const sonarWorkflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      
      // If branches are specified, they should be ['**'] for universal execution
      if (sonarWorkflow.on.push?.branches) {
        const branches = sonarWorkflow.on.push.branches;
        
        // Either use ['**'] or a very permissive pattern
        const isUniversal = 
          branches.includes('**') || 
          branches.includes('*') ||
          branches.length === 0;
        
        expect(
          isUniversal,
          'Workflow should use universal branch pattern ["**"] or ["*"] for all-branch execution'
        ).toBe(true);
      }
    });
  });

  describe('Property 7: Workflow Permission Minimality', () => {
    /**
     * **Validates: Requirements 8.3**
     * 
     * Property: For any GitHub Actions workflow that decorates pull requests,
     * the permissions must include exactly the minimum required permissions
     * (contents: read, pull-requests: write, checks: write) and no additional
     * permissions.
     */
    it('PR Review workflow should have exactly the minimum required permissions', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      
      // Find the job that decorates PRs (biome-annotations)
      const biomeJob = workflow.jobs['biome-annotations'];
      expect(biomeJob).toBeDefined();
      expect(biomeJob.permissions).toBeDefined();
      
      const permissions = biomeJob.permissions!;
      
      // Must have exactly these three permissions
      expect(permissions.contents).toBe('read');
      expect(permissions['pull-requests']).toBe('write');
      expect(permissions.checks).toBe('write');
      
      // Count total permissions - should be exactly 3
      const permissionKeys = Object.keys(permissions);
      expect(
        permissionKeys.length,
        'PR Review workflow should have exactly 3 permissions (contents, pull-requests, checks)'
      ).toBe(3);
    });

    it('PR Review workflow should not have excessive permissions', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = workflow.jobs['biome-annotations'];
      const permissions = biomeJob.permissions!;
      
      // Should NOT have these permissions
      const excessivePermissions = [
        'actions',
        'deployments',
        'issues',
        'packages',
        'pages',
        'security-events',
        'statuses'
      ];
      
      for (const perm of excessivePermissions) {
        expect(
          permissions[perm],
          `PR Review workflow should not have ${perm} permission`
        ).toBeUndefined();
      }
    });

    it('PR Review workflow should not have write access to contents', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = workflow.jobs['biome-annotations'];
      const permissions = biomeJob.permissions!;
      
      // Contents should be read-only
      expect(permissions.contents).toBe('read');
      expect(permissions.contents).not.toBe('write');
    });

    it('workflows that decorate PRs should have pull-requests write permission', () => {
      const prWorkflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      
      // Any job that decorates PRs needs pull-requests: write
      for (const [jobName, job] of Object.entries(prWorkflow.jobs)) {
        if (job.permissions) {
          expect(
            job.permissions['pull-requests'],
            `Job ${jobName} that decorates PRs should have pull-requests permission`
          ).toBeDefined();
          
          expect(
            job.permissions['pull-requests'],
            `Job ${jobName} should have pull-requests: write for PR decoration`
          ).toBe('write');
        }
      }
    });

    it('workflows that create check runs should have checks write permission', () => {
      const prWorkflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = prWorkflow.jobs['biome-annotations'];
      
      // Jobs that create check runs need checks: write
      expect(
        biomeJob.permissions?.checks,
        'Job should have checks: write for creating check runs'
      ).toBe('write');
    });
  });

  describe('Additional GitHub Actions Configuration Validation', () => {
    it('SonarCloud workflow should use full git history', () => {
      const workflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      const sonarJob = workflow.jobs.sonarcloud;
      
      // Find the checkout step
      const steps = sonarJob.steps as Array<{ uses?: string; with?: { 'fetch-depth'?: number } }>;
      const checkoutStep = steps.find(s => s.uses?.startsWith('actions/checkout'));
      
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep?.with?.['fetch-depth']).toBe(0);
    });

    it('SonarCloud workflow should use correct Bun version', () => {
      const workflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      const sonarJob = workflow.jobs.sonarcloud;
      
      const steps = sonarJob.steps as Array<{ uses?: string; with?: { 'bun-version'?: string } }>;
      const bunStep = steps.find(s => s.uses?.startsWith('oven-sh/setup-bun'));
      
      expect(bunStep).toBeDefined();
      expect(bunStep?.with?.['bun-version']).toBe('1.3.3');
    });

    it('PR Review workflow should use correct Bun version', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = workflow.jobs['biome-annotations'];
      
      const steps = biomeJob.steps as Array<{ uses?: string; with?: { 'bun-version'?: string } }>;
      const bunStep = steps.find(s => s.uses?.startsWith('oven-sh/setup-bun'));
      
      expect(bunStep).toBeDefined();
      expect(bunStep?.with?.['bun-version']).toBe('1.3.3');
    });

    it('PR Review workflow should use continue-on-error for Biome check', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = workflow.jobs['biome-annotations'];
      
      const steps = biomeJob.steps as Array<{ 
        name?: string; 
        run?: string; 
        'continue-on-error'?: boolean 
      }>;
      const biomeStep = steps.find(s => s.run?.includes('biome check'));
      
      expect(biomeStep).toBeDefined();
      expect(
        biomeStep?.['continue-on-error'],
        'Biome check should use continue-on-error: true'
      ).toBe(true);
    });

    it('SonarCloud workflow should use continue-on-error for tests', () => {
      const workflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      const sonarJob = workflow.jobs.sonarcloud;
      
      const steps = sonarJob.steps as Array<{ 
        name?: string; 
        run?: string; 
        'continue-on-error'?: boolean 
      }>;
      const testStep = steps.find(s => s.run?.includes('test') && s.run?.includes('--coverage'));
      
      expect(testStep).toBeDefined();
      expect(
        testStep?.['continue-on-error'],
        'Test step should use continue-on-error: true to allow analysis even if tests fail'
      ).toBe(true);
    });

    it('workflows should use frozen lockfile for dependency installation', () => {
      const sonarWorkflow = parseWorkflowYaml('.github/workflows/sonar.yml');
      const prWorkflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      
      const checkFrozenLockfile = (workflow: WorkflowConfig) => {
        for (const job of Object.values(workflow.jobs)) {
          const steps = job.steps as Array<{ name?: string; run?: string }>;
          const installStep = steps.find(s => 
            s.name?.toLowerCase().includes('install') || 
            s.run?.includes('bun install')
          );
          
          if (installStep?.run?.includes('bun install')) {
            expect(
              installStep.run.includes('--frozen-lockfile'),
              `${workflow.name} should use --frozen-lockfile for dependency installation`
            ).toBe(true);
          }
        }
      };
      
      checkFrozenLockfile(sonarWorkflow);
      checkFrozenLockfile(prWorkflow);
    });

    it('PR Review workflow should use GitHub reporter for Biome', () => {
      const workflow = parseWorkflowYaml('.github/workflows/pr-review.yml');
      const biomeJob = workflow.jobs['biome-annotations'];
      
      const steps = biomeJob.steps as Array<{ run?: string }>;
      const biomeStep = steps.find(s => s.run?.includes('biome check'));
      
      expect(biomeStep).toBeDefined();
      expect(
        biomeStep?.run?.includes('--reporter=github'),
        'Biome check should use --reporter=github for PR annotations'
      ).toBe(true);
    });
  });
});
