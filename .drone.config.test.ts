/**
 * Configuration Validation Tests for Drone CI
 * 
 * **Validates: Requirements 1.5, 12.5, 12.6, 12.7**
 * 
 * These tests validate the Drone CI pipeline configuration to ensure:
 * - Property 1: All check steps declare dependency on install step
 * - Property 6: All steps use consistent Docker image version
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

interface DroneStep {
  name: string;
  image: string;
  commands?: string[];
  depends_on?: string[];
}

interface DroneConfig {
  kind: string;
  type: string;
  name: string;
  clone?: {
    depth: number;
  };
  steps: DroneStep[];
}

/**
 * Parse the .drone.yml configuration file
 */
function parseDroneConfig(): DroneConfig {
  const droneYaml = readFileSync('.drone.yml', 'utf-8');
  return parse(droneYaml) as DroneConfig;
}

describe('Drone CI Configuration Validation', () => {
  describe('Property 1: Drone Pipeline Step Dependencies', () => {
    /**
     * **Validates: Requirements 1.5, 12.5, 12.6, 12.7**
     * 
     * Property: For any Drone pipeline configuration, all check steps 
     * (typecheck, lint, test) must declare a dependency on the install 
     * step to ensure dependencies are available before execution.
     */
    it('should have all check steps depend on install step', () => {
      const config = parseDroneConfig();
      const checkSteps = ['typecheck', 'lint', 'test'];
      
      for (const stepName of checkSteps) {
        const step = config.steps.find(s => s.name === stepName);
        
        expect(step).toBeDefined();
        expect(step?.depends_on).toBeDefined();
        expect(step?.depends_on).toContain('install');
      }
    });

    it('should have install step with no dependencies', () => {
      const config = parseDroneConfig();
      const installStep = config.steps.find(s => s.name === 'install');
      
      expect(installStep).toBeDefined();
      expect(installStep?.depends_on).toBeUndefined();
    });

    it('should have exactly 4 steps: install, typecheck, lint, test', () => {
      const config = parseDroneConfig();
      const expectedSteps = ['install', 'typecheck', 'lint', 'test'];
      const actualStepNames = config.steps.map(s => s.name);
      
      expect(actualStepNames).toEqual(expectedSteps);
    });
  });

  describe('Property 6: Docker Image Version Consistency', () => {
    /**
     * **Validates: Requirements 1.3, 12.4, 12.5, 12.6, 12.7**
     * 
     * Property: For any Drone pipeline with multiple steps, all steps 
     * must use the same Docker image version to ensure consistent 
     * runtime environment across the pipeline.
     */
    it('should use oven/bun:1.3.3 image for all steps', () => {
      const config = parseDroneConfig();
      const expectedImage = 'oven/bun:1.3.3';
      
      for (const step of config.steps) {
        expect(step.image).toBe(expectedImage);
      }
    });

    it('should have at least one step with Docker image defined', () => {
      const config = parseDroneConfig();
      
      expect(config.steps.length).toBeGreaterThan(0);
      expect(config.steps.every(step => step.image)).toBe(true);
    });

    it('should use consistent image version across all steps', () => {
      const config = parseDroneConfig();
      const images = config.steps.map(s => s.image);
      const uniqueImages = [...new Set(images)];
      
      // All steps should use the same image
      expect(uniqueImages.length).toBe(1);
    });
  });

  describe('Additional Configuration Validation', () => {
    it('should be a docker pipeline', () => {
      const config = parseDroneConfig();
      
      expect(config.kind).toBe('pipeline');
      expect(config.type).toBe('docker');
    });

    it('should have shallow clone depth of 50', () => {
      const config = parseDroneConfig();
      
      expect(config.clone).toBeDefined();
      expect(config.clone?.depth).toBe(50);
    });

    it('should have install step with frozen lockfile command', () => {
      const config = parseDroneConfig();
      const installStep = config.steps.find(s => s.name === 'install');
      
      expect(installStep?.commands).toBeDefined();
      expect(installStep?.commands).toContain('bun install --frozen-lockfile');
    });

    it('should have typecheck step with tsc commands for all packages', () => {
      const config = parseDroneConfig();
      const typecheckStep = config.steps.find(s => s.name === 'typecheck');
      const requiredPackages = ['web', 'backend', 'backend-base', 'database', 'emails', 'api', 'ui'];
      
      expect(typecheckStep?.commands).toBeDefined();
      const commandsStr = typecheckStep?.commands?.join('\n') || '';
      
      for (const pkg of requiredPackages) {
        expect(commandsStr).toContain(pkg);
      }
    });

    it('should have lint step with biome ci command', () => {
      const config = parseDroneConfig();
      const lintStep = config.steps.find(s => s.name === 'lint');
      
      expect(lintStep?.commands).toBeDefined();
      expect(lintStep?.commands).toContain('bun biome ci .');
    });

    it('should have test step with coverage flag for web', () => {
      const config = parseDroneConfig();
      const testStep = config.steps.find(s => s.name === 'test');
      
      expect(testStep?.commands).toBeDefined();
      const commandsStr = testStep?.commands?.join('\n') || '';
      
      expect(commandsStr).toContain('--coverage');
      expect(commandsStr).toContain('apps/web');
    });
  });
});
