// ABOUTME: Verifies built-in showcase projects only seed when registry data is stale.
// ABOUTME: Prevents component mounts from rewriting an already-current registry.

import { describe, expect, it } from 'vitest';
import { createBuiltInProjects } from '../lib/projectSharedObject';
import { projectRegistryNeedsBuiltIns } from './ProjectSubmissions';

function currentRegistry() {
  const projects = createBuiltInProjects();
  return {
    projects,
    reservedSharedIds: Object.fromEntries(
      Object.values(projects).map((project) => [project.sharedObject.id, true]),
    ) as Record<string, true>,
  };
}

describe('showcase built-in seeding', () => {
  it('does not seed an already-current registry', () => {
    expect(projectRegistryNeedsBuiltIns(currentRegistry())).toBe(false);
  });

  it('seeds when a built-in project is missing', () => {
    const registry = currentRegistry();
    delete registry.projects['builtin-class-site'];

    expect(projectRegistryNeedsBuiltIns(registry)).toBe(true);
  });

  it('seeds when a built-in shared ID is not reserved', () => {
    const registry = currentRegistry();
    delete registry.reservedSharedIds[
      registry.projects['builtin-class-site'].sharedObject.id
    ];

    expect(projectRegistryNeedsBuiltIns(registry)).toBe(true);
  });
});
