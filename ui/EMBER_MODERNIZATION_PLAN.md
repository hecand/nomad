# Nomad UI — Ember Modernization Plan (SFC, Vite, TypeScript)

> **Prerequisite:** Complete the core Ember upgrade (Phases 0-4) described in [EMBER_UPGRADE_PLAN.md](EMBER_UPGRADE_PLAN.md) first. These phases require Ember 5.x+ as a minimum.

## Overview

This plan covers three optional but highly recommended modernization initiatives that can begin once the core Ember upgrade reaches Phase 3 (Ember 5.4 LTS):

| Phase                    | Description                                    | Prerequisite | Effort      | Risk        |
| ------------------------ | ---------------------------------------------- | ------------ | ----------- | ----------- |
| Phase 5 — SFC Conversion | Convert `.hbs` + `.js` → `.gjs` / `.gts`       | Ember 5.4+   | 3-5 sprints | Low         |
| Phase 6 — Vite Migration | Replace Broccoli build with Vite via Embroider | Ember 6.x    | 2-4 sprints | Medium-High |
| Phase 7 — TypeScript     | Incremental JS → TS migration                  | Ember 5.x+   | 4-8 sprints | Low-Medium  |

All three can run **incrementally** and **in parallel** with each other. There is no requirement to convert the entire app at once for any of these.

**ember-data is the biggest blocker across all three phases** — its string-based resolution, Broccoli build hooks, and lack of TypeScript types create friction at every stage.

---

## Phase 5: Single File Component (SFC) Conversion — `.gjs` / `.gts`

> **Goal:** Convert the codebase from separate `.hbs` + `.js` files to Ember's modern Single File Component format using the `<template>` tag.
> **Prerequisite:** Ember 5.4+ (Phase 3 complete). The `<template>` tag is stable in Ember 5.x and the recommended authoring format going forward.
> **Estimated effort:** 3-5 sprints (incremental, can run in parallel with Phase 4)
> **Risk:** Low — this is a file format migration, not a behavioral change. Components work identically after conversion.

### Why SFC?

The `<template>` tag format (`.gjs` / `.gts` files) is Ember's future and brings significant benefits:

| Benefit                     | Details                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Co-location**             | Template, component class, and local helpers/modifiers live in one file — no more jumping between `.hbs` and `.js`                            |
| **Explicit imports**        | Every component, helper, and modifier used in the template is explicitly imported. No more magic resolution — you can see exactly what's used |
| **Tree-shaking**            | Because imports are explicit, unused components are eliminated from the bundle automatically. This can significantly reduce bundle size       |
| **TypeScript support**      | `.gts` files provide full type-checking across the template boundary — args, yielded values, and helper return types are all checked          |
| **Better DX**               | IDE features (autocomplete, go-to-definition, rename) work across template + JS because they're in the same file                              |
| **Simplified mental model** | No implicit this-fallback, no implicit component resolution, no `{{this.}}` ambiguity — everything is explicit                                |
| **Inline helpers**          | Define small helpers/modifiers directly in the component file rather than creating separate files                                             |
| **Future-proof**            | This is the only authoring format that will receive new features. Classic `.hbs` + `.js` is in maintenance mode                               |

### Scope

| Category                                        | Files          | Conversion Complexity                                    |
| ----------------------------------------------- | -------------- | -------------------------------------------------------- |
| Template-only components (`.hbs` with no `.js`) | ~33            | **Trivial** — wrap in `<template>`, add explicit imports |
| Backed components (`.hbs` + `.js` pairs)        | ~151           | **Moderate** — merge files, add explicit imports         |
| Route templates (`app/templates/*.hbs`)         | ~97            | **Moderate** — convert to route template components      |
| Helpers (`app/helpers/*.js`)                    | ~31            | **Low** — many can become inline functions               |
| **Total**                                       | **~312 files** |                                                          |

### 5.1 — Install Tooling & Configure

1. Install `ember-template-imports` (enables `<template>` tag support)
2. Update `ember-template-lint` and `eslint-plugin-ember` for `.gjs` / `.gts` support
3. Configure the build pipeline to handle `.gjs` files
4. Update `.prettierrc` / formatting config for `<template>` tag
5. Add a sample `.gjs` component as proof-of-concept

### 5.2 — Convert Template-Only Components (~33 files)

**Priority: First** — These are the simplest conversions.

Before (two files):

```
{{!-- app/components/my-icon.hbs --}}
<svg class="icon {{@name}}" ...attributes>
  {{yield}}
</svg>
```

After (one `.gjs` file):

```gjs
// app/components/my-icon.gjs
<template>
  <svg class="icon {{@name}}" ...attributes>
    {{yield}}
  </svg>
</template>
```

For template-only components with dependencies (other components/helpers used in the template), add explicit imports:

```gjs
// app/components/job-row.gjs
import JobStatus from './job-status';
import { formatTs } from '../helpers/format-ts';

<template>
  <tr>
    <td><JobStatus @job={{@job}} /></td>
    <td>{{formatTs @job.submitTime}}</td>
  </tr>
</template>
```

### 5.3 — Convert Backed Components (~151 files)

**Priority: Second** — Merge `.hbs` and `.js` into single `.gjs` files.

Before (two files):

```js
// app/components/job-list.js
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";

export default class JobListComponent extends Component {
  @tracked sortBy = "name";

  @action
  setSortBy(field) {
    this.sortBy = field;
  }
}
```

```hbs
{{! app/components/job-list.hbs }}
<table>
  <thead>
    <tr>
      <th {{on "click" (fn this.setSortBy "name")}}>Name</th>
    </tr>
  </thead>
  <tbody>
    {{#each @jobs as |job|}}
      <JobRow @job={{job}} />
    {{/each}}
  </tbody>
</table>
```

After (one `.gjs` file):

```gjs
// app/components/job-list.gjs
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import JobRow from './job-row';

export default class JobListComponent extends Component {
  @tracked sortBy = 'name';

  @action
  setSortBy(field) {
    this.sortBy = field;
  }

  <template>
    <table>
      <thead>
        <tr>
          <th {{on "click" (fn this.setSortBy "name")}}>Name</th>
        </tr>
      </thead>
      <tbody>
        {{#each @jobs as |job|}}
          <JobRow @job={{job}} />
        {{/each}}
      </tbody>
    </table>
  </template>
}
```

**Key points for backed component conversion:**

- All component/helper/modifier usages in the template must be explicitly imported
- Built-in helpers (`if`, `each`, `yield`, `hash`, `array`, `concat`, `on`, `fn`) are available globally — no import needed
- Non-built-in helpers, modifiers, and components MUST be imported
- The `<template>` tag replaces the export default when the component has no class (template-only), or goes inside the class body for backed components

### 5.4 — Convert Route Templates (~97 files)

**Priority: Third** — Route templates become route template components.

Before:

```hbs
{{! app/templates/jobs/index.hbs }}
<JobList @jobs={{this.model}} />
```

After:

```gjs
// app/templates/jobs/index.gjs
import JobList from '../../components/job-list';

<template>
  <JobList @jobs={{@model}} />
</template>
```

> **Note:** In route templates, `this.model` becomes `@model` in the `<template>` tag format. The route template receives `@model`, `@controller`, and `@outlet` as args.

### 5.5 — Convert Helpers (~31 files)

**Priority: Fourth** — Many helpers can become plain functions.

Before:

```js
// app/helpers/format-bytes.js
import { helper } from "@ember/component/helper";

export function formatBytes([bytes]) {
  // ...
  return formatted;
}

export default helper(formatBytes);
```

After:

```gjs
// app/helpers/format-bytes.js (or .gjs)
export default function formatBytes(bytes) {
  // ...
  return formatted;
}
```

In SFC, plain functions used in templates are auto-invoked as helpers — no need for the `helper()` wrapper.

### 5.6 — Cleanup & Finalize

1. Remove all empty `app/templates/components/` directories
2. Update test files to import from `.gjs` if needed
3. Enable `ember-template-lint` rule `no-implicit-this` at error level (should already be clean)
4. Verify build output — bundle size should decrease due to tree-shaking
5. Update contribution docs with SFC authoring guidelines

### Tooling for SFC Conversion

| Tool                                             | Purpose                                                  |
| ------------------------------------------------ | -------------------------------------------------------- |
| `ember-template-imports`                         | Enables `<template>` tag syntax in `.gjs` / `.gts` files |
| `prettier-plugin-ember-template-tag`             | Formats `<template>` blocks inside `.gjs` / `.gts` files |
| `eslint-plugin-ember` (v12+)                     | Lints `.gjs` / `.gts` files                              |
| `ember-template-lint` (v6+)                      | Lints templates inside `<template>` tags                 |
| `@glint/core` + `@glint/environment-ember-loose` | TypeScript type-checking for `.gts` templates            |

### SFC Conversion Strategy

The conversion can be done **incrementally** — `.hbs` + `.js` and `.gjs` files coexist perfectly. The recommended approach:

1. **New components** — write all new components in `.gjs` format immediately
2. **Touched components** — when modifying an existing component for any reason, convert it to `.gjs` as part of the same PR
3. **Batch sweeps** — periodically convert remaining files in batches by directory (e.g., all components under `app/components/job-page/`)
4. **Template-only first** — the 33 template-only components are trivial wins that can be done in a single PR

### Named Blocks & `{{yield}}` Modernization

During SFC conversion, take the opportunity to adopt **named blocks** (available since Ember 3.25) where components currently use multiple `{{yield}}` calls with positional semantics or conditional slots:

```hbs
{{! Before: positional/conditional yields (classic) }}
{{yield header}}
{{yield body}}
```

```gjs
{{!-- After: named blocks (modern) --}}
<template>
  <header>{{yield to="header"}}</header>
  <main>{{yield to="body"}}</main>
</template>

{{!-- Caller uses: --}}
<MyComponent>
  <:header>Title</:header>
  <:body>Content</:body>
</MyComponent>
```

Named blocks make component APIs **self-documenting** and are required for `.gts` type-checking (Glint can type-check named block args). Audit components with multiple `{{yield}}` calls during Phase 5.3 and convert them to named blocks.

---

## Phase 6: Migrate to Vite Build System (via Embroider)

> **Goal:** Replace the classic Broccoli/ember-cli build pipeline with Vite via `@embroider/vite`. Vite became the default build system in Ember 6.4.
> **Prerequisite:** Ember 6.x (Phase 4 complete). Embroider compatibility should be validated earlier, but the full switch happens here.
> **Estimated effort:** 2-4 sprints
> **Risk:** Medium-High — the build pipeline touches everything.

### Why Vite?

| Benefit                      | Details                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Instant dev startup**      | Vite uses native ES modules in dev — no full rebuild on start. The current Broccoli pipeline rebuilds the entire app tree on every boot |
| **Sub-second HMR**           | Hot Module Replacement updates only the changed module. With Broccoli, even small changes trigger multi-second rebuilds                 |
| **Faster production builds** | Rollup (Vite's production bundler) produces smaller, more optimized output than Broccoli + ember-auto-import                            |
| **Ecosystem alignment**      | Vite is the industry-standard build tool. Access to the entire Vite plugin ecosystem (PWA, bundle analysis, compression, etc.)          |
| **Better tree-shaking**      | Rollup's tree-shaking is significantly more aggressive than Broccoli, especially when combined with SFC explicit imports (Phase 5)      |
| **Modern output**            | Native ESM output, dynamic imports, and code-splitting out of the box                                                                   |
| **Simpler configuration**    | `vite.config.js` replaces `ember-cli-build.js` + multiple Broccoli plugins                                                              |
| **Future-proof**             | Broccoli is in maintenance mode. All new Ember build features target Vite/Embroider only                                                |

### Current Build Pipeline (What Has to Change)

The current `ember-cli-build.js` uses:

| Current                                    | Replacement                                      |
| ------------------------------------------ | ------------------------------------------------ |
| `ember-cli/lib/broccoli/ember-app`         | `@embroider/vite`                                |
| `ember-cli-babel` (Broccoli plugin)        | Vite's built-in Babel/SWC                        |
| `ember-cli-sass` / `sassOptions`           | `vite-plugin-sass` or Vite's native SCSS support |
| `app.import()` for CSS (xterm, codemirror) | Standard `import` statements in JS/CSS           |
| Broccoli tree merging                      | Vite's module graph                              |
| `ember-auto-import`                        | Native ESM imports (Vite resolves them directly) |

### Migration Path

The migration goes through Embroider first (Ember's v2 build system), then to Vite:

#### 8.1 — Embroider Compatibility (can start on Ember 5.x)

1. Install `@embroider/compat`, `@embroider/core`, `@embroider/webpack` (the safe entry point)
2. Replace `app.toTree()` with Embroider's `compatBuild()` in `ember-cli-build.js`:

```js
const { Webpack } = require("@embroider/webpack");

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    /* existing options */
  });

  return require("@embroider/compat").compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true, // enable after SFC migration (Phase 5)
    staticEmberSource: true,
  });
};
```

3. Fix any Embroider compatibility issues — common problems:
   - **Dynamic component invocations** — `{{component dynamicName}}` must be refactored to use `ensureSafeComponent()` or explicit imports
   - **Implicit addon resolution** — addons that rely on Broccoli tree merging may need `packageRules` configuration
   - **Template-only components** — must be converted to actual component files (done in Phase 5)
4. Run full test suite under Embroider

#### 8.2 — Switch from Webpack to Vite

1. Replace `@embroider/webpack` with `@embroider/vite`
2. Create `vite.config.js`:

```js
import { defineConfig } from "vite";
import { extensions, ember } from "@embroider/vite";

export default defineConfig({
  plugins: [...ember()],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: [
          "./node_modules/bulma",
          "./node_modules/@hashicorp/design-system-tokens/dist/products/css",
          "./node_modules/@hashicorp/design-system-components/dist/styles",
          "./node_modules/ember-basic-dropdown",
          "./node_modules/ember-power-select",
          "./node_modules/bulma/sass",
        ],
      },
    },
  },
  resolve: {
    extensions,
  },
});
```

3. Remove `ember-cli-build.js` (replaced by `vite.config.js`)
4. Remove Broccoli-specific dependencies: `broccoli-*`, `ember-cli-sass` (use Vite's SCSS handling)
5. Replace `app.import()` calls with standard ES imports:

```js
// Before (ember-cli-build.js)
app.import("node_modules/xterm/css/xterm.css");
app.import("node_modules/codemirror/lib/codemirror.css");

// After (app/app.js or a dedicated imports file)
import "xterm/css/xterm.css";
import "codemirror/lib/codemirror.css";
```

6. Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "test": "vite build --mode test && ember test --path dist"
  }
}
```

#### 8.3 — Optimize & Validate

1. **Code splitting** — Configure route-based dynamic imports for lazy loading
2. **Bundle analysis** — Use `rollup-plugin-visualizer` to identify large chunks
3. **Performance baseline** — Compare build times and bundle sizes:
   - Dev startup time (Broccoli vs Vite)
   - HMR speed
   - Production build time
   - Production bundle size
4. **CI/CD updates** — Update build scripts, caching strategy (Vite uses `node_modules/.vite` cache)
5. Full regression test suite

### ember-data: The Biggest Blocker

`ember-data` is the **single biggest obstacle** to the Vite migration, for several reasons:

| Issue                            | Details                                                                                                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Broccoli-dependent internals** | Older versions of ember-data rely on Broccoli build hooks for model/adapter/serializer discovery. Embroider requires explicit registration                                                                                   |
| **Implicit model resolution**    | The classic `store.findRecord('model-name')` pattern relies on the resolver to find models by name. Under Embroider/Vite, models must be explicitly registered or use string-based lookups that are configured at build time |
| **Version coupling**             | ember-data versions are tightly coupled to ember-source versions. The Vite migration (Ember 6.x) requires ember-data 5.x+ at minimum, which itself has the major restructuring from Phase 3                                  |
| **`ember-data-model-fragments`** | This addon's Broccoli hooks are unlikely to work under Embroider without significant patching. This may be the forcing function to replace fragments entirely                                                                |
| **42 serializers + 26 adapters** | The sheer volume of custom serialization/adapter logic means any change to how ember-data resolves these has a large blast radius                                                                                            |
| **RequestManager migration**     | ember-data 5.x deprecates adapters/serializers in favor of `RequestManager` + handlers. Completing this migration before the Vite switch significantly reduces risk                                                          |

**Recommended approach:** Complete the ember-data modernization in two waves:

1. **Before Vite (Phase 3):** Upgrade ember-data to 5.x, fix import paths, resolve `ember-data-model-fragments` compatibility
2. **Before or during Vite (Phase 6.1):** Migrate from adapters/serializers to `RequestManager` pattern. This removes the build-time resolution dependency that causes Embroider issues:

```js
// Before (classic adapter/serializer — Broccoli resolves by convention)
// app/adapters/job.js
export default class JobAdapter extends ApplicationAdapter { ... }
// app/serializers/job.js
export default class JobSerializer extends ApplicationSerializer { ... }

// After (RequestManager — explicit, Vite-friendly)
import { RequestManager } from '@ember-data/request';
import { buildBaseURL, buildQueryParams } from '@ember-data/request-utils';

const FetchJobs = {
  request({ url }) {
    return fetch(url).then(r => r.json());
  }
};

const manager = new RequestManager();
manager.use([FetchJobs]);
```

### Addon Compatibility with Embroider/Vite

Some v1 Ember addons (pre-Embroider format) may not work directly under Embroider's strict mode. Check these:

| Addon                      | Risk   | Notes                                                                          |
| -------------------------- | ------ | ------------------------------------------------------------------------------ |
| `ember-cli-mirage`         | Medium | Has Embroider compat issues historically; check for v3+ with Embroider support |
| `ember-cli-moment-shim`    | High   | Broccoli-based shim; replace with native `Intl` or `date-fns` before Vite      |
| `ember-stargate`           | Low    | Simple in-element portal, likely compatible                                    |
| `ember-composable-helpers` | Low    | Should work under Embroider                                                    |
| `ember-truth-helpers`      | Low    | Should work under Embroider                                                    |
| `ember-power-select`       | Low    | v8+ is Embroider-compatible                                                    |
| `ember-concurrency`        | Low    | v4+ is Embroider-compatible                                                    |

---

## Phase 7: TypeScript Migration (Optional)

> **Goal:** Incrementally migrate the codebase from JavaScript to TypeScript for type safety, better refactoring confidence, and improved developer experience.
> **Prerequisite:** Phase 5 (SFC) should be substantially complete — `.gts` files provide full template type-checking via Glint, which is the main advantage over plain `.ts`. Phase 3 (Ember 5.x+) is the minimum for good TS support.
> **Estimated effort:** 4-8 sprints (incremental, can run over many months)
> **Risk:** Low-Medium — TypeScript is opt-in per-file. `.js` and `.ts`/`.gts` coexist.

### Why TypeScript?

| Benefit                      | Details                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Catch bugs at build time** | Type errors surface during development, not in production. Especially valuable for a large codebase (~562 app JS files)           |
| **Refactoring confidence**   | Rename a property, change an interface — the compiler tells you everywhere that needs updating. Critical for a codebase this size |
| **Template type-checking**   | With Glint + `.gts` files, component args, yields, and helper returns are fully type-checked across the template boundary         |
| **Self-documenting code**    | Interfaces and types serve as living documentation for component APIs, service contracts, and data models                         |
| **IDE superpowers**          | Autocomplete, inline errors, go-to-definition, and hover docs all improve dramatically with types                                 |
| **Onboarding**               | New developers can understand component contracts and data shapes without reading implementation details                          |
| **Ecosystem direction**      | Ember's official types (`@types/ember-source`) are mature. All new Ember APIs ship with first-class types                         |

### ember-data: The Biggest Blocker (Again)

`ember-data` is the **largest obstacle** to TypeScript adoption, even more so than for Vite:

| Issue                                | Details                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loose typing by design**           | `store.findRecord('job', id)` returns `any` — the string-based model lookup defeats TypeScript's type inference entirely                                                                    |
| **Model attribute types**            | `@attr('string')` decorators have no compile-time type information. Properties are typed at runtime via transforms, invisible to TS                                                         |
| **Relationship types**               | `belongsTo('allocation')` and `hasMany('task-group')` resolve to string-based lookups. TypeScript cannot infer the related model type                                                       |
| **ember-data-model-fragments**       | No TypeScript types exist. Fragments add another layer of untyped dynamic resolution                                                                                                        |
| **42 serializers + 26 adapters**     | Custom serialization logic is heavily stringly-typed — `attrs`, `keyForAttribute`, `normalizeResponse` all deal in raw JSON and string keys                                                 |
| **ember-data 5.x type improvements** | ember-data 5.x introduced `@ember-data/model` with better type support, but the `SchemaRecord` / `SchemaService` pattern (which enables real type safety) is still evolving                 |
| **Migration path unclear**           | Fully typing ember-data models requires either: (a) using the experimental `SchemaRecord` API, (b) manually typing every model with interfaces, or (c) accepting `any` for model properties |

**Recommended approach for ember-data + TypeScript:**

1. **Start with loose types** — Convert model files to `.ts` with explicit `declare` for each attribute:

```ts
// app/models/job.ts
import Model, { attr, belongsTo, hasMany } from "@ember-data/model";
import type AllocationModel from "./allocation";
import type TaskGroupModel from "./task-group";

export default class JobModel extends Model {
  @attr("string") declare name: string;
  @attr("string") declare status: string;
  @attr("number") declare priority: number;
  @attr("boolean") declare periodic: boolean;
  @attr() declare meta: Record<string, unknown>; // untyped attrs

  @belongsTo("namespace", { async: false, inverse: null })
  declare namespace: NamespaceModel;

  @hasMany("task-group", { async: false, inverse: "job" })
  declare taskGroups: TaskGroupModel[];
}
```

2. **Accept `any` in serializers/adapters initially** — These deal in raw JSON. Type them gradually:

```ts
// app/serializers/job.ts
import ApplicationSerializer from "./application";
import type { Snapshot } from "@ember-data/store";

export default class JobSerializer extends ApplicationSerializer {
  normalize(
    typeClass: unknown,
    hash: Record<string, any>
  ): Record<string, any> {
    // existing logic
  }
}
```

3. **Defer full type safety** until ember-data's `SchemaRecord` API stabilizes — this will eventually provide compile-time types for all model attributes without manual `declare` annotations

### Scope

| Category                        | Files    | TypeScript Difficulty | Notes                                       |
| ------------------------------- | -------- | --------------------- | ------------------------------------------- |
| Components (`.gjs` → `.gts`)    | ~151     | **Moderate**          | Args interfaces needed for each component   |
| Template-only (`.gjs` → `.gts`) | ~33      | **Low**               | Just add a `Signature` interface            |
| Services                        | ~12      | **Low**               | Well-defined APIs, few dependencies         |
| Utils                           | ~69      | **Low**               | Pure functions, easy to type                |
| Helpers                         | ~31      | **Low**               | Simple input → output                       |
| Routes                          | ~74      | **Low-Moderate**      | Model hooks need return types               |
| Controllers                     | ~79      | **Moderate**          | Query params, actions                       |
| Models                          | ~61      | **Moderate**          | ember-data typing challenges (see above)    |
| Serializers                     | ~42      | **High**              | Heavy `any` usage, raw JSON manipulation    |
| Adapters                        | ~26      | **High**              | URL building, custom headers, raw responses |
| Mixins                          | ~10      | **N/A**               | Should be removed before TS (Phase 2.6)     |
| Tests                           | ~173     | **Low priority**      | Type-check app code first, tests later      |
| Mirage                          | ~98      | **Low priority**      | Dev-only, type-check last                   |
| **Total app files**             | **~562** |                       |                                             |

### 7.1 — TypeScript Foundation

1. Install TypeScript and configure:

```bash
pnpm add -D typescript @tsconfig/ember
```

2. Create `tsconfig.json`:

```json
{
  "extends": "@tsconfig/ember/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "declaration": true,
    "declarationMap": true,
    "noEmit": true,
    "paths": {
      "nomad-ui/*": ["./app/*"],
      "*": ["./types/*"]
    }
  },
  "include": ["app/**/*", "types/**/*"]
}
```

3. Install Glint for template type-checking:

```bash
pnpm add -D @glint/core @glint/template @glint/environment-ember-loose
```

4. Create `types/` directory for ambient declarations and missing addon types
5. Add `tsc --noEmit` to CI as a non-blocking check initially

### 7.2 — Type Infrastructure (Signatures & Registries)

Before converting components, establish the type patterns:

```ts
// Component signature pattern
import type { TOC } from '@ember/component/template-only';

interface JobRowSignature {
  Args: {
    job: JobModel;
    onClick?: (job: JobModel) => void;
  };
  Blocks: {
    default: [status: string];
  };
  Element: HTMLTableRowElement;
}

const JobRow: TOC<JobRowSignature> = <template>
  <tr ...attributes>
    <td>{{@job.name}}</td>
    <td>{{yield @job.status}}</td>
  </tr>
</template>;

export default JobRow;
```

```ts
// Backed component signature
import Component from "@glimmer/component";

interface JobListSignature {
  Args: {
    jobs: JobModel[];
  };
  Blocks: {
    default: [];
  };
  Element: HTMLDivElement;
}

export default class JobListComponent extends Component<JobListSignature> {
  // TypeScript now enforces that @job is JobModel[]
  // and template usage of @jobs is type-checked
}
```

### 7.3 — Convert Services & Utils First (~81 files)

**Priority: First** — These are the easiest wins and establish type foundations other files depend on.

- Services have well-defined APIs and are imported everywhere
- Utils are pure functions — trivial to type
- Getting these right first means components/routes that use them get type-checking "for free"

### 7.4 — Convert Models (~61 files)

**Priority: Second** — Models are the data backbone. Typing them (even loosely) improves everything downstream.

- Use `declare` for all `@attr`, `@belongsTo`, `@hasMany` properties
- Create a `types/ember-data.d.ts` for any missing ember-data types
- Accept loose typing for model fragments initially
- This is where ember-data's limitations will be most felt

### 7.5 — Convert Components (`.gjs` → `.gts`, ~184 files)

**Priority: Third** — This is the bulk of the work.

- Add `Signature` interfaces to every component
- Template-only components (33): trivial — just add `TOC<Signature>`
- Backed components (151): moderate — type args, tracked properties, actions
- Can be done incrementally by directory

### 7.6 — Convert Routes & Controllers (~153 files)

**Priority: Fourth** — Routes and controllers are less critical than components.

- Type the `model()` hook return values
- Type query params in controllers
- Type transition objects

### 7.7 — Convert Serializers & Adapters (~68 files)

**Priority: Last for app code** — These deal in raw JSON and will have the most `any` types.

- Start with `Record<string, any>` for JSON payloads
- Gradually introduce interfaces for API response shapes
- If RequestManager migration is done (Phase 6), this becomes much easier — request handlers have cleaner type boundaries

### 7.8 — Convert Tests & Mirage (~271 files, optional)

**Priority: Nice-to-have** — Tests benefit less from types. Do this last, if at all.

- Mirage factories and scenarios don't need strict typing
- Integration tests gain value from typed component signatures (tested args are validated)

### TypeScript Migration Strategy

Like SFC, TypeScript can be adopted **incrementally**:

1. **`allowJs: true`** — `.js` and `.ts` files coexist from day one. No big-bang migration needed
2. **`strict: true` from the start** — It's much harder to enable strict mode later. Start strict and use `// @ts-expect-error` for temporary exceptions
3. **New files in TypeScript** — All new files should be `.ts` / `.gts` immediately
4. **Convert on touch** — When modifying a `.js` file, convert it to `.ts` as part of the same PR
5. **Track coverage** — Add a CI metric for `% of files that are .ts/.gts` vs `.js/.gjs` to show progress
6. **Don't block on ember-data** — Convert everything else to TypeScript first. Accept loose types for model properties and serializers

### Key Dependencies

| Dependency                         | Required For                     | Status                                                  |
| ---------------------------------- | -------------------------------- | ------------------------------------------------------- |
| `@types/ember-source`              | Core Ember types                 | Stable, ships with `ember-source` 5.x+                  |
| `@types/ember-data`                | ember-data types                 | Improving but incomplete, especially for older patterns |
| `@glint/core`                      | Template type-checking in `.gts` | Stable in Ember 5.x+                                    |
| `@glint/environment-ember-loose`   | Loose-mode template resolution   | Needed until full strict mode (Embroider)               |
| `@tsconfig/ember`                  | Recommended TypeScript config    | Maintained by Ember core team                           |
| `ember-data-model-fragments` types | Type-checking fragments          | **Does not exist** — must write ambient declarations    |

---

## PR Strategy

| PR     | Branch From   | Description                                    | Size               | Parallelizable |
| ------ | ------------- | ---------------------------------------------- | ------------------ | -------------- |
| PR 5.1 | PR 3+         | SFC: template-only components → `.gjs`         | Large, mechanical  | With 5.2       |
| PR 5.2 | PR 3+         | SFC: backed components → `.gjs`                | Large, complex     | With 5.1       |
| PR 5.3 | PR 5.1+5.2    | SFC: route templates → co-located `.gjs`       | Large, mechanical  | —              |
| PR 5.4 | PR 5.3        | SFC: helpers to `.gjs` + cleanup               | Medium             | —              |
| PR 6.1 | PR 3+ (or 4)  | Embroider compatibility                        | Medium-Large       | With 5.x       |
| PR 6.2 | PR 6.1 + PR 4 | Switch Embroider from Webpack to Vite          | Medium             | —              |
| PR 6.3 | PR 6.2        | Vite optimization, code-splitting, CI updates  | Small-Medium       | —              |
| PR 7.1 | PR 5+ (or 3+) | TypeScript foundation + Glint setup            | Small              | With 6.x       |
| PR 7.2 | PR 7.1        | Type infrastructure: signatures & registries   | Small              | —              |
| PR 7.3 | PR 7.2        | Convert services & utils → `.ts`               | Medium             | With 7.4       |
| PR 7.4 | PR 7.2        | Convert models → `.ts` (loose typed)           | Medium             | With 7.3       |
| PR 7.5 | PR 7.3+7.4    | Convert components `.gjs` → `.gts` (batches)   | Large, incremental | —              |
| PR 7.6 | PR 7.3+7.4    | Convert routes & controllers → `.ts`           | Large, mechanical  | With 7.5       |
| PR 7.7 | PR 7.4        | Convert serializers & adapters → `.ts` (loose) | Medium             | With 7.5, 7.6  |

## Effort Estimates

| Phase                    | Effort            | Risk        | Files Touched |
| ------------------------ | ----------------- | ----------- | ------------- |
| Phase 5 (SFC conversion) | 3-5 sprints       | Low         | ~450+         |
| Phase 6 (Vite build)     | 2-4 sprints       | Medium-High | ~20 (config)  |
| Phase 7 (TypeScript)     | 4-8 sprints       | Low-Medium  | ~562 (app)    |
| **Total**                | **~9-17 sprints** | —           | —             |

> All three phases can be done incrementally and in parallel. ember-data will be the biggest friction point across all three.

## Tooling

| Tool                                 | Phase | Purpose                                     |
| ------------------------------------ | ----- | ------------------------------------------- |
| `ember-template-imports`             | 5.1   | Enables `<template>` tag syntax             |
| `prettier-plugin-ember-template-tag` | 5.1   | Formats `<template>` blocks                 |
| `@embroider/compat`                  | 6.1   | Embroider compatibility layer for v1 addons |
| `@embroider/vite`                    | 6.2   | Vite integration for Ember                  |
| `@tsconfig/ember`                    | 7.1   | Official Ember TypeScript config            |
| `@glint/core`                        | 7.1   | Template type-checking for `.gts` files     |
| `eslint-plugin-ember` (v12+)         | 5-7   | Lints `.gjs` / `.gts` files                 |
| `ember-template-lint` (v6+)          | 5-7   | Lints templates inside `<template>` tags    |
| `@glint/environment-ember-loose`     | 7.1   | Loose-mode template type resolution         |

## Documentation

- [Ember TypeScript Guide](https://guides.emberjs.com/release/typescript/) — Official TS setup and patterns
- [Glint](https://typed-ember.gitbook.io/glint) — Template type-checking documentation
- [@tsconfig/ember](https://github.com/ember-cli/ember-cli-tsconfig) — Recommended TypeScript configuration
- [Embroider Initiative](https://github.com/embroider-build/embroider) — v2 addon and build system documentation
- [@embroider/vite](https://github.com/embroider-build/embroider/tree/main/packages/vite) — Vite integration guide
