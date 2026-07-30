/**
 * Architecture boundary rules (Doc 13 §5.2: cross-module write/import isolation
 * enforced by architecture tests in CI; ADR-008 one aggregate, one write owner).
 *
 * Module packages live under packages/modules/mNN-*. Other modules may import
 * ONLY from a module's contracts/ directory. domain/, application/ and
 * infrastructure/ are private to the owning module.
 */
module.exports = {
  forbidden: [
    {
      name: 'module-internals-are-private',
      severity: 'error',
      comment:
        'M01–M18 module internals (domain/application/infrastructure) must not be imported by other packages; only contracts/ is public (ADR-008, Doc 13 §5).',
      from: {
        pathNot: '^packages/modules/(m[0-9]{2}-[a-z-]+)/',
      },
      to: {
        path: '^packages/modules/m[0-9]{2}-[a-z-]+/(domain|application|infrastructure)/',
      },
    },
    {
      name: 'no-cross-module-internals',
      severity: 'error',
      comment:
        'One module must not reach into another module\'s internals; cross-module interaction is commands/queries/events via contracts only.',
      from: {
        path: '^packages/modules/(m[0-9]{2}-[a-z-]+)/',
      },
      to: {
        path: '^packages/modules/(m[0-9]{2}-[a-z-]+)/(domain|application|infrastructure)/',
        pathNot: '^packages/modules/$1/',
      },
    },
    {
      name: 'domain-layer-purity',
      severity: 'error',
      comment:
        'Domain layer must not depend on web frameworks, DB drivers, provider SDKs (Doc 13 §12.7).',
      from: { path: '^packages/modules/m[0-9]{2}-[a-z-]+/domain/' },
      to: {
        dependencyTypes: ['npm'],
        pathNot: '^node_modules/(uuid|zod)($|/)',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
  },
};
