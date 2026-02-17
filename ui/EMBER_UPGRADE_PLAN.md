# Nomad UI — Ember.js Upgrade Plan

## Current State (main branch)

| Package                    | Current Version |
| -------------------------- | --------------- |
| ember-source               | ~3.28.10        |
| ember-cli                  | ~3.28.5         |
| ember-data                 | ~3.24           |
| ember-concurrency          | ^4.0.4          |
| ember-cli-babel            | ^7.26.10        |
| ember-auto-import          | ^2.4.0          |
| ember-modifier             | 3.2.6           |
| ember-power-select         | ^8.6.2          |
| @glimmer/component         | ^1.0.4          |
| @glimmer/tracking          | ^1.0.4          |
| ember-data-model-fragments | 5.0.0-beta.3    |
| ember-cli-htmlbars         | ^5.7.2          |
| ember-basic-dropdown       | ^8.6.2          |

## Target: Ember 4.12 LTS (then 5.x+)

## Deprecated Pattern Audit (current codebase)

### Template-Layer Patterns

| Pattern                                                  | Count | Removed In | Effort |
| -------------------------------------------------------- | ----- | ---------- | ------ |
| `{{action "string"}}` in templates                       | ~325  | 5.0        | High   |
| `(mut this.prop)` helper                                 | 66    | 5.0        | Medium |
| `toggle-action` helper                                   | 3     | 5.0        | Low    |
| Array prototype extensions (`.filterBy`, `.mapBy`, etc.) | ~271  | 5.0        | High   |

### Component-Layer Patterns

| Pattern                                     | Count    | Status                       | Effort |
| ------------------------------------------- | -------- | ---------------------------- | ------ |
| Classic `Component.extend({})`              | 50       | Deprecated 3.x, works in 4.x | High   |
| Classic component `from '@ember/component'` | 71 files | Deprecated 3.x, works in 4.x | High   |
| `@classNames` / `@classNameBindings`        | 35 / 9   | Deprecated 3.x, works in 4.x | Medium |
| `@attributeBindings`                        | 18       | Deprecated 3.x, works in 4.x | Medium |
| `@tagName`                                  | 48       | Deprecated 3.x, works in 4.x | High   |
| `didInsertElement` / `willDestroyElement`   | 7 / 3    | Deprecated 3.x, works in 4.x | Medium |
| `@ember-decorators` usage                   | 73 files | Unmaintained                 | High   |

### JavaScript-Layer Patterns

| Pattern                                   | Count          | Status                           | Effort |
| ----------------------------------------- | -------------- | -------------------------------- | ------ |
| `computed()` properties                   | 316            | Deprecated 3.x, works in 4.x     | High   |
| `this.set()` calls                        | 154 (47 files) | Deprecated 3.x, works in 4.x     | High   |
| `set(this, ...)` from `@ember/object`     | 18             | Deprecated 3.x, works in 4.x     | Low    |
| `this.get()` calls                        | 116 (44 files) | Deprecated 3.x, works in 4.x     | Medium |
| `Route.extend({})`                        | 34             | Deprecated 3.x, works in 4.x     | Medium |
| `Controller.extend({})`                   | 16             | Deprecated 3.x, works in 4.x     | Medium |
| `Service.extend({})`                      | 0              | Already native classes ✅        | —      |
| `Model.extend({})`                        | 0              | Already native classes ✅        | —      |
| `import Ember from 'ember'` (barrel)      | 21 files       | Deprecated 3.x, works in 4.x     | Low    |
| Mixins (10 mixin files + 56 consumers)    | 66 files       | Deprecated 3.x, works in 4.x     | High   |
| `@ember/string` (`camelize`, `dasherize`) | 9              | Deprecated 4.x, removed 5.0      | Low    |
| `PromiseProxyMixin`                       | 2              | Deprecated 3.x, works in 4.x     | Medium |
| `ObjectProxy` / `ArrayProxy`              | 2              | Deprecated 3.x, works in 4.x     | Medium |
| `@ember/runloop` usage                    | 34             | Partially deprecated             | Medium |
| Dynamic `{{component}}` invocations       | 2              | Incompatible w/ Embroider strict | Medium |

### `@ember/runloop` Migration Detail (34 files)

The 34 `@ember/runloop` imports break down by function:

| Function       | Files | Deprecated? | Replacement                                                         |
| -------------- | ----- | ----------- | ------------------------------------------------------------------- |
| `scheduleOnce` | 13    | No          | Still available in 5.x — safe to keep                               |
| `schedule`     | 6     | No          | Still available in 5.x — safe to keep                               |
| `next`         | 9     | No          | Still available, but prefer `await settled()` in tests              |
| `debounce`     | 5     | No          | Consider native `setTimeout` or utility library                     |
| `once`         | 3     | No          | Still available in 5.x — safe to keep                               |
| `run`          | 2     | Partially   | `run()` wrapper often unnecessary in Octane — remove where possible |
| `bind`         | 1     | Yes         | Replace with arrow function or `.bind()`                            |
| `later`        | 1     | No          | Consider `setTimeout` for clarity                                   |

> **Key insight:** Most `@ember/runloop` imports are **not** deprecated in 5.x. Only `bind` is deprecated. The others (`schedule`, `scheduleOnce`, `next`, etc.) remain in `@ember/runloop` through 5.x and 6.x. **This is NOT a blocker for the upgrade.** However, reducing reliance on the runloop is good practice — consider replacing `debounce`/`later` with native timers and `next` with `requestAnimationFrame` or `Promise.resolve()` during Phase 2 cleanup.

### Dynamic `{{component}}` Invocations (2 files)

Dynamic component invocations using `{{component (concat ...)}}` are **incompatible with Embroider's strict mode** (Phase 6). These must be refactored before the Vite migration.

| File                                 | Usage                                             | Replacement                        |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------- |
| `app/components/app-breadcrumbs.hbs` | `{{component (concat "breadcrumbs/" type)}}`      | Explicit `{{#if}}` / component map |
| `app/components/job-editor.hbs`      | `{{component (concat 'job-editor/' this.stage)}}` | Explicit `{{#if}}` / component map |

> **Note:** Only 2 files — this is a small, targeted fix. Can be done in Phase 0.10 or deferred to Phase 6.1 (Embroider compatibility).

### Deprecated Patterns in Test Files

Test files also contain deprecated patterns that must be migrated alongside app code in Phase 4:

| Pattern      | Test Files Affected | Notes                             |
| ------------ | ------------------- | --------------------------------- |
| `this.set()` | 43 files            | Must migrate alongside Phase 2.5  |
| `action`     | 16 files            | Must migrate alongside Phase 2.1  |
| `this.get()` | 13 files            | Must migrate alongside Phase 2.13 |
| `computed()` | 2 files             | Must migrate alongside Phase 2.4  |

> **Important:** Each Phase 2 sub-task must include corresponding test file updates. Failing to update tests will leave deprecated patterns in the test suite that break in 5.x.

### ember-data Layer

| Pattern                                        | Count  | Notes                                   |
| ---------------------------------------------- | ------ | --------------------------------------- |
| Model files                                    | 61     | All use native classes already          |
| Serializer files                               | 42     | Custom serialization logic              |
| Adapter files                                  | 26     | Custom adapter logic                    |
| Model fragments                                | varies | `ember-data-model-fragments` dependency |
| `belongsTo` without explicit `async`/`inverse` | 37     | **Must fix for ember-data 4.x**         |
| `hasMany` without explicit `async`/`inverse`   | 18     | **Must fix for ember-data 4.x**         |

> **ember-data 4.x requires explicit `async` and `inverse` options** on all `belongsTo`/`hasMany` declarations. Currently **55 relationships** omit these options. This must be addressed in Phase 1 (or Phase 0 as pre-work — the explicit options are backward-compatible with 3.24).

### Initializer Audit (4 files)

| File                                         | Status    | Notes                                                                      |
| -------------------------------------------- | --------- | -------------------------------------------------------------------------- |
| `app/initializers/app-env.js`                | Phase 0.3 | Uses `application.inject()` — must remove                                  |
| `app/initializers/app-token.js`              | Phase 0.3 | Uses `application.inject()` — must remove                                  |
| `app/initializers/custom-inflector-rules.js` | ✅ Clean  | Sets plural rules via `ember-inflector` — no deprecated patterns           |
| `app/initializers/fragment-serializer.js`    | ✅ Clean  | Registers serializer via `application.register()` — no deprecated patterns |

> No `instance-initializers` directory exists. Only the 2 files in Phase 0.3 need changes.

### Already Clean ✅

| Pattern          | Count | Notes |
| ---------------- | ----- | ----- |
| `sendAction`     | 0     | N/A   |
| `getWithDefault` | 0     | N/A   |
| `observer()`     | 0     | N/A   |
| `reopenClass`    | 0     | N/A   |
| `volatile()`     | 0     | N/A   |
| `{{partial}}`    | 0     | N/A   |
| `tryInvoke`      | 0     | N/A   |

### Mixin Inventory (10 mixin files + 56 consumer files)

These must each be individually refactored before Ember 5.0.
10 mixin files in `app/mixins/` + 56 files that import from them.
Additionally, several files in `app/utils/classes/` use `Mixin.create()` patterns:

| Mixin File                                          | Strategy                    |
| --------------------------------------------------- | --------------------------- |
| `app/mixins/window-resizable.js`                    | → modifier                  |
| `app/mixins/with-forbidden-state.js`                | → service or decorator      |
| `app/mixins/with-watchers.js`                       | → service or base class     |
| `app/mixins/with-route-visibility-detection.js`     | → route service / modifier  |
| `app/mixins/searchable.js`                          | → utility function          |
| `app/mixins/sortable-factory.js`                    | → utility function          |
| `app/mixins/sortable.js`                            | → utility function          |
| `app/mixins/with-component-visibility-detection.js` | → modifier                  |
| `app/mixins/with-namespace-resetting.js`            | → route service             |
| `app/mixins/with-model-error-handling.js`           | → route utility / decorator |
| `app/utils/classes/abstract-logger.js`              | → base class (uses Mixin)   |
| `app/utils/classes/promise-object.js`               | → native Promise + tracked  |
| `app/utils/classes/promise-array.js`                | → native Promise + tracked  |
| `app/utils/classes/abstract-stats-tracker.js`       | → base class                |
| `app/controllers/jobs.js`                           | → composition               |

### Addon Risk Assessment

| Addon                                 | Version      | 4.12 Compat  | 5.x Risk                                | Notes                                                   |
| ------------------------------------- | ------------ | ------------ | --------------------------------------- | ------------------------------------------------------- |
| `ember-data`                          | ~3.24        | Bump to 4.12 | **HIGH** — major API restructure in 5.x | Has 61 models, 42 serializers, 26 adapters              |
| `ember-data-model-fragments`          | 5.0.0-beta.3 | Needs update | **HIGH** — historically lags ember-data | May need fork or alternative                            |
| `ember-concurrency`                   | ^4.0.4       | ✅ Works     | Medium                                  | v4 uses generators; v5 drops them                       |
| `ember-power-select`                  | ^8.6.2       | ✅ Works     | Low                                     | Already on v8                                           |
| `ember-basic-dropdown`                | ^8.6.2       | ✅ Works     | Low                                     | Already on v8                                           |
| `ember-copy`                          | ^2.0.1       | ✅ Works     | **HIGH** — deprecated/unmaintained      | Replace with `structuredClone()` or spread              |
| `ember-fetch`                         | ^8.1.1       | ✅ Works     | Medium                                  | Installed but not imported; replace with native `fetch` |
| `ember-cli-moment-shim`               | ^3.8.0       | ✅ Works     | Medium                                  | Consider switching to native `Intl` or `date-fns`       |
| `ember-decorators`                    | ^6.1.1       | ⚠️ Verify    | **HIGH** — unmaintained                 | 73 files; must remove before 5.x                        |
| `ember-overridable-computed`          | ^1.0.0       | ⚠️ Verify    | **HIGH** — won't work with @tracked     | 14 files; replace with @tracked                         |
| `ember-statecharts`                   | 0.14.0       | ⚠️ Verify    | Medium                                  | Check for newer version                                 |
| `ember-cli-mirage`                    | 2.2.0        | ✅ Works     | Low                                     | 98 mirage files                                         |
| `ember-modifier`                      | 3.2.6        | Bump to ^4.x | Low                                     | Needs update for 4.x compat                             |
| `ember-composable-helpers`            | ^5.0.0       | ✅ Works     | Low                                     |                                                         |
| `ember-truth-helpers`                 | ^3.0.0       | ✅ Works     | Low                                     |                                                         |
| `ember-cli-flash`                     | ^3.0.0       | Needs update | Low                                     |                                                         |
| `ember-stargate`                      | ^0.4.1       | Needs update | Low                                     | In-element portals                                      |
| `ember-resources`                     | —            | Not present  | —                                       | Consider adding for async patterns                      |
| `@ember/legacy-built-in-components`   | ^0.4.1       | ✅ Works     | Medium                                  | Polyfill for removed built-in components                |
| `ember-classic-decorator`             | ^3.0.0       | ✅ Works     | **HIGH** — to be removed                | Remove alongside `ember-decorators`                     |
| `ember-export-application-global`     | ^2.0.1       | ✅ Works     | Low                                     | Deprecated; remove                                      |
| `ember-can`                           | ^4.1.0       | ⚠️ Verify    | Medium                                  | Check for updates                                       |
| `ember-sinon`                         | ^5.0.0       | ✅ Works     | Low                                     | Unnecessary; remove (use sinon directly)                |
| `@ember/render-modifiers`             | ^2.0.4       | ✅ Works     | Low                                     | `{{did-insert}}`, `{{will-destroy}}`                    |
| `ember-responsive`                    | ^4.0.2       | ✅ Works     | Low                                     | Responsive breakpoint service                           |
| `ember-cli-string-helpers`            | ^6.1.0       | ✅ Works     | Low                                     | Template string helpers                                 |
| `ember-cli-deprecation-workflow`      | ^2.1.0       | Upgrade      | Low                                     | Upgrade to ^4.0.0 in Phase 0.1                          |
| `@hashicorp/design-system-components` | 4.13.0       | ✅ Works     | Low                                     | v4 has Ember 4.x+ support                               |
| `@hashicorp/design-system-tokens`     | ^2.3.0       | ✅ Works     | Low                                     | CSS tokens, no Ember API dependency                     |
| `ember-page-title`                    | ^7.0.0       | ✅ Works     | Low                                     | v7+ supports Ember 4.x                                  |
| `ember-auto-import`                   | ^2.4.0       | ✅ Works     | Low                                     | Required; v2 has tree-shaking improvements              |

---

## Phased Upgrade Plan

### Phase 0: Pre-work on 3.28 (Prep — no version bump)

> **Goal:** Eliminate patterns that are _removed_ in 4.0 while still on 3.28, so the 4.x upgrade is a clean version bump. All changes are backward-compatible.
> **Estimated effort:** 2-3 sprints

#### 0.1 Enable Deprecation Logging

- Install `ember-cli-deprecation-workflow` (currently at ^2.1.0 — upgrade to ^4.0.0)
- Set `EmberENV.RAISE_ON_DEPRECATION` in `config/environment.js` (dev only)
- Run the app and the test suite to catalog all deprecation warnings
- Create `config/deprecation-workflow.js` to triage warnings

#### 0.2 Remove Array Prototype Extensions (~271 usages)

- ~271 usages of `.filterBy`, `.mapBy`, `.sortBy`, `.uniqBy`, `.findBy`, `.rejectBy`, `.firstObject`, `.lastObject`, `.compact`, `.without`, `.toArray` across ~99 files
- Convert to native array methods + Ember `@ember/object/computed` or manual iteration
- A codemod can automate most of this — see `scripts/fix-ember-array-extensions.js`
- Backward-compatible with 3.28

#### 0.3 Remove `application.inject()` (4 calls in 2 files)

- `app/initializers/app-env.js` — injects `config` service into all controllers/components
- `app/initializers/app-token.js` — injects `token` service into all controllers/components
- These must be replaced with explicit `@service config` / `@service token` injection in each consuming file, or made no-ops if consumers already use `@service`

#### 0.4 Migrate `import Ember from 'ember'` barrel imports (21 files)

The barrel `import Ember from 'ember'` is deprecated. Replace with specific imports:

```js
// Before
import Ember from 'ember';
const { testing } = Ember;

// After
import { isTesting } from '@ember/test-helpers'; // or check macros
```

Files: mixins (3), utils (2), components (7), controllers (5), routes (1), and others.

This is backward-compatible with 3.28 and should be done before the 4.x bump.

#### 0.5 Convert `.extend()` to Native Classes (Route, Controller)

Most routes and controllers already use native classes. Remaining work — 50 files:

- **34 Route files** still using `Route.extend({})` (out of 74 total)
- **16 Controller files** still using `Controller.extend({})` (out of 79 total)
- **0 Service files** — all 12 already use native classes ✅
- **0 Model files** — all 61 already use native classes ✅

Use the `ember-native-class-codemod` for automated conversion:

```bash
npx ember-native-class-codemod app/routes/
npx ember-native-class-codemod app/controllers/
```

This is backward-compatible with 3.28 (native classes work since 3.15).

> **Note:** This does NOT require converting to `@tracked` yet. The codemod preserves `computed()` and just converts the class syntax.

#### 0.6 Resolve `ember-data-model-fragments` Version

- Currently on `5.0.0-beta.3` — evaluate upgrading to stable `6.x`
- Ensure compatibility with ember-data ~3.24
- This addon is the single biggest risk for the entire upgrade path

#### 0.7 Remove Legacy Addons

Several addons in the codebase are deprecated, unmaintained, or replaceable with native browser APIs. These should be removed **before** the 4.x upgrade to reduce the dependency surface. All replacements are backward-compatible with 3.28.

##### `ember-copy` (^2.0.1) — Replace with `structuredClone()` or spread

**What it does:** Provides `copy()` for deep-cloning Ember objects — a leftover from when Ember had its own object model. There's zero reason to use this today.

**10 files import `copy` from `ember-copy`:**

| File                                                                         | Usage                     | Replacement                                                   |
| ---------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------- |
| [app/serializers/application.js](app/serializers/application.js)             | Deep-copies JSON payloads | `structuredClone(hash)` or `JSON.parse(JSON.stringify(hash))` |
| [app/serializers/token.js](app/serializers/token.js)                         | Deep-copies JSON payloads | `structuredClone(hash)`                                       |
| [app/serializers/task-group.js](app/serializers/task-group.js)               | Deep-copies JSON payloads | `structuredClone(hash)`                                       |
| [app/serializers/role.js](app/serializers/role.js)                           | Deep-copies JSON payloads | `structuredClone(hash)`                                       |
| [app/components/distribution-bar.js](app/components/distribution-bar.js)     | Copies data array         | `[...data]` or `structuredClone(data)`                        |
| [app/components/variable-form.js](app/components/variable-form.js)           | Copies form data          | `structuredClone(data)`                                       |
| [app/components/scale-events-chart.js](app/components/scale-events-chart.js) | Copies chart data         | `structuredClone(data)`                                       |
| [app/services/watch-list.js](app/services/watch-list.js)                     | Copies watch list         | `structuredClone()` or spread                                 |
| [app/utils/json-with-default.js](app/utils/json-with-default.js)             | Copies JSON defaults      | `structuredClone()`                                           |
| [mirage/config.js](mirage/config.js)                                         | Copies mirage fixtures    | `structuredClone()`                                           |

**Migration:** Find-and-replace `import { copy } from 'ember-copy'` → remove import, replace `copy(obj)` with `structuredClone(obj)`. For shallow copies of arrays/objects, prefer spread (`[...arr]`, `{...obj}`).

##### `ember-cli-moment-shim` (^3.8.0) + `ember-moment` (^9.0.1) — Replace with native `Intl`

**What they do:** `ember-cli-moment-shim` is a Broccoli-based wrapper that bundles moment.js. `ember-moment` provides template helpers like `{{moment-from-now}}` and `{{moment-format}}`. Together they add **~300KB** to the bundle.

**~22 template usages of `{{moment-from-now}}`** across:

| File                                                                                                           | Count |
| -------------------------------------------------------------------------------------------------------------- | ----- |
| [app/components/allocation-row.hbs](app/components/allocation-row.hbs)                                         | 1     |
| [app/components/job-deployment.hbs](app/components/job-deployment.hbs)                                         | 1     |
| [app/components/job-client-status-row.hbs](app/components/job-client-status-row.hbs)                           | 2     |
| [app/components/plugin-allocation-row.hbs](app/components/plugin-allocation-row.hbs)                           | 1     |
| [app/components/reschedule-event-timeline.hbs](app/components/reschedule-event-timeline.hbs)                   | 1     |
| [app/components/variable-paths.hbs](app/components/variable-paths.hbs)                                         | 1     |
| [app/components/variable-form.hbs](app/components/variable-form.hbs)                                           | 1     |
| [app/components/token-editor.hbs](app/components/token-editor.hbs)                                             | 1     |
| [app/templates/settings/tokens.hbs](app/templates/settings/tokens.hbs)                                         | 2     |
| [app/templates/clients/client/index.hbs](app/templates/clients/client/index.hbs)                               | 2     |
| [app/templates/administration/tokens/index.hbs](app/templates/administration/tokens/index.hbs)                 | 2     |
| [app/templates/administration/roles/role.hbs](app/templates/administration/roles/role.hbs)                     | 2     |
| [app/templates/administration/policies/policy.hbs](app/templates/administration/policies/policy.hbs)           | 2     |
| [app/templates/storage/volumes/dynamic-host-volume.hbs](app/templates/storage/volumes/dynamic-host-volume.hbs) | 2     |
| [app/templates/storage/index.hbs](app/templates/storage/index.hbs)                                             | 1     |

**Migration:**

1. Create a `format-relative-time` helper using `Intl.RelativeTimeFormat`:

```js
// app/helpers/format-relative-time.js
import { helper } from '@ember/component/helper';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const DIVISIONS = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Infinity, name: 'years' },
];

function timeAgo(date) {
  let duration = (date - new Date()) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}

export default helper(([date]) => timeAgo(new Date(date)));
```

2. Replace `{{moment-from-now date}}` → `{{format-relative-time date}}`
3. For `interval=1000` live-updating, wrap in a tracked auto-refresh pattern or use `ember-resources` `clock`
4. Remove `ember-moment` and `ember-cli-moment-shim` from `package.json`
5. **Bundle size win:** ~300KB removed

##### `ember-overridable-computed` (^1.0.0) — Replace with `@tracked`

**What it does:** Provides a computed property decorator that allows the computed value to be overridden by setting a value directly. It's a pattern for "computed with a default that can be overwritten." Won't work with `@tracked` — must be removed before Phase 2.4.

**14 files import from `ember-overridable-computed`:**

| File                                                                                                         | Usage                                |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| [app/components/allocation-row.js](app/components/allocation-row.js)                                         | `@overridable` property              |
| [app/components/distribution-bar.js](app/components/distribution-bar.js)                                     | `@overridable(() => null) data`      |
| [app/components/drain-popover.js](app/components/drain-popover.js)                                           | `@overridable` property              |
| [app/components/job-deployments-stream.js](app/components/job-deployments-stream.js)                         | `@overridable(() => []) deployments` |
| [app/components/job-versions-stream.js](app/components/job-versions-stream.js)                               | `@overridable` property              |
| [app/components/list-accordion.js](app/components/list-accordion.js)                                         | `@overridable` property              |
| [app/components/list-pagination.js](app/components/list-pagination.js)                                       | `@overridable` property              |
| [app/components/list-table.js](app/components/list-table.js)                                                 | `@overridable(() => []) source`      |
| [app/components/multi-select-dropdown.js](app/components/multi-select-dropdown.js)                           | `@overridable` property              |
| [app/components/reschedule-event-row.js](app/components/reschedule-event-row.js)                             | `@overridable` property              |
| [app/controllers/allocations/allocation/index.js](app/controllers/allocations/allocation/index.js)           | `@overridable` property              |
| [app/controllers/allocations/allocation/task/index.js](app/controllers/allocations/allocation/task/index.js) | `@overridable` property              |
| [app/utils/classes/abstract-logger.js](app/utils/classes/abstract-logger.js)                                 | `@overridable` property              |
| [app/utils/classes/log.js](app/utils/classes/log.js)                                                         | `@overridable` property              |

**Migration pattern:**

```js
// Before
import { computed as overridable } from 'ember-overridable-computed';

export default class ListTable extends Component {
  @overridable(() => []) source;
}

// After — use @tracked with a getter that provides the default
import { tracked } from '@glimmer/tracking';

export default class ListTable extends Component {
  // If passed via @source arg, use that; otherwise default to []
  get source() {
    return this.args.source ?? [];
  }
}
```

Most of these are just "arg with a default value" — convert to a getter reading from `this.args` with a fallback. For the few cases in controllers/utils where it's a settable property, use `@tracked` with an initializer.

##### `ember-sinon` (^5.0.0) — Replace with direct `sinon` import

**What it does:** Wraps QUnit + sinon integration to auto-restore sinon sandboxes after each test. But Nomad's tests already import `sinon` directly (`import sinon from 'sinon'`) — the addon wrapper is unnecessary.

**28 test files import sinon directly** (not through `ember-sinon`):

All existing usages already use `import sinon from 'sinon'` — the addon is just a shim that auto-restores sandboxes. Replace with explicit `sinon.restore()` in test hooks:

```js
// Add to tests that use sinon
import { module, test } from 'qunit';
import sinon from 'sinon';

module('...', function (hooks) {
  hooks.afterEach(function () {
    sinon.restore();
  });
  // ... tests
});
```

Then remove `ember-sinon` from `package.json` and keep `sinon` as a direct devDependency.

#### 0.8 Remove `ember-fetch` (unused dependency)

- `ember-fetch` (^8.1.1) is in `package.json` but **not imported anywhere in app code**
- Safe to simply remove from `package.json` — no code changes needed
- Backward-compatible with 3.28

#### 0.9 Add Explicit `async`/`inverse` to All Relationships (55 declarations)

> **Why now:** ember-data 4.x **requires** explicit `async` and `inverse` options on all `belongsTo` and `hasMany` declarations. Omitting them throws deprecation warnings in 3.28 and errors in 4.x. Adding them is fully backward-compatible with 3.24.

| Relationship Type | Missing Options | Action                                                      |
| ----------------- | --------------- | ----------------------------------------------------------- |
| `belongsTo`       | 37 declarations | Add `{ async: false, inverse: null }` (or correct inverse)  |
| `hasMany`         | 18 declarations | Add `{ async: false, inverse: '...' }` (or correct inverse) |
| **Total**         | **55**          |                                                             |

Steps:

1. Audit each `belongsTo`/`hasMany` across all 61 model files
2. Determine correct `inverse` for each relationship (most are `null` for one-directional)
3. Set `async: false` for synchronous relationships (all current models use sync)
4. Run test suite to verify no regressions

This is mechanical but requires careful review of each relationship to determine the correct `inverse` value.

#### 0.10 Refactor Dynamic `{{component}}` Invocations (2 files)

> **Why now:** Dynamic `{{component (concat ...)}}` invocations are **incompatible with Embroider's strict mode** (Phase 6). Fixing them now simplifies the future Vite migration. This change is backward-compatible with 3.28.

| File                                 | Current Usage                                | Replacement                                      |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------------ |
| `app/components/app-breadcrumbs.hbs` | `{{component (concat "breadcrumbs/" type)}}` | Explicit `{{#if}}` chain or component map object |
| `app/components/job-editor.hbs`      | `{{component (concat 'job-editor/' stage)}}` | Explicit `{{#if}}` chain or component map object |

Pattern:

```hbs
{{! Before }}
{{component (concat 'job-editor/' this.stage) data=this.data fns=this.fns}}

{{! After }}
{{#if (eq this.stage 'plan')}}
  <JobEditor::Plan @data={{this.data}} @fns={{this.fns}} />
{{else if (eq this.stage 'review')}}
  <JobEditor::Review @data={{this.data}} @fns={{this.fns}} />
{{/if}}
```

> **Additional cleanup in this PR:**
>
> - `breadcrumbs/default.hbs` — replaced deprecated `<LinkTo @params={{@crumb.args}}>` (positional params API) with explicit `@route` / `@models` backed by getters. Also removed `@crumb.args.firstObject` (array prototype extension) and `(action)` wrappers.
> - `breadcrumbs/job.hbs` — removed `(action)` wrappers, moved route logic into `traverseUpALevel` override.
> - `job-editor.hbs` — replaced `onchange={{action ...}}` with `{{on "change" ...}}`.
> - `job-editor/edit.hbs`, `job-editor/read.hbs` — removed unnecessary `(action)` wrappers on `@fns` references.

#### 0.11 Replace Custom Breadcrumb System with `@bagaar/ember-breadcrumbs` (Post-4.12)

> **Why:** The current custom breadcrumb system (`app/components/breadcrumb.js`, `app/components/breadcrumbs.js`, `app/services/breadcrumbs.js`, `app/components/breadcrumbs/default.*`, `app/components/breadcrumbs/job.*`, `app/components/app-breadcrumbs.*`) reimplements template-based breadcrumb management with a service-backed registration pattern. [`@bagaar/ember-breadcrumbs`](https://github.com/Bagaar/ember-breadcrumbs) (v5.1.0) provides the same pattern as a maintained v2 addon with TypeScript support, `{{in-element}}`-based rendering, and Embroider compatibility.
>
> **Compatibility:** Requires **Ember 4.8+** — cannot be adopted on 3.28. Schedule this for **after Phase 1** (Ember 4.12 upgrade).
>
> **Scope:** ~30+ route templates register breadcrumbs via `<Breadcrumb @crumb={{...}} />`. Migration involves:
>
> 1. Install `@bagaar/ember-breadcrumbs`
> 2. Replace `<Breadcrumb @crumb={{hash label="..." args=(array "route.name" model)}}>` → `<BreadcrumbsItem as |linkClass|><LinkTo @route="..." class={{linkClass}}>...</LinkTo></BreadcrumbsItem>`
> 3. Replace `<AppBreadcrumbs />` → `<BreadcrumbsContainer />`
> 4. Remove custom breadcrumb components, service, and the `breadcrumbs/job` specialization (inline the parent-job logic into the job route template)
> 5. Remove `app/components/breadcrumb.js`, `app/components/breadcrumbs.js`, `app/services/breadcrumbs.js`, `app/components/breadcrumbs/`, `app/components/app-breadcrumbs.*`
>
> **Note:** This addon is already used in other HashiCorp projects, so adopting it here aligns the team on a shared solution.

---

### Phase 1: Upgrade to Ember 4.12 LTS (Direct)

> **Goal:** Jump directly from 3.28 to 4.12 LTS in a single version bump. Phase 0 eliminates all patterns that are _removed_ in 4.0, so there are no hard breaking changes between 3.28 and 4.12 — only new deprecation warnings.
> **Estimated effort:** 1-2 sprints
>
> **Why skip 4.4/4.8:** The 4.x series has no hard breaking changes between 4.0 and 4.12 — only cumulative deprecation warnings. Since Phase 0 cleans up all patterns removed in 4.0 (array extensions, implicit injections, barrel imports), going direct to 4.12 saves ~1 sprint of intermediate upgrade cycles. If 4.12 breaks unexpectedly, fall back to 4.4 first, then step to 4.8, then 4.12.

#### Version Bumps

| Package            | From     | To      |
| ------------------ | -------- | ------- |
| ember-source       | ~3.28.10 | ~4.12.0 |
| ember-cli          | ~3.28.5  | ~4.12.0 |
| ember-data         | ~3.24    | ~4.12.0 |
| ember-cli-babel    | ^7.26.10 | ^8.0.0  |
| ember-cli-htmlbars | ^5.7.2   | ^6.1.0  |
| @glimmer/component | ^1.0.4   | ^1.1.2  |
| @glimmer/tracking  | ^1.0.4   | ^1.1.2  |
| ember-modifier     | 3.2.6    | ^4.1.0  |

> **Important:** Use `ember-cli-update` to automatically update config files:
>
> ```bash
> npx ember-cli-update --to 4.12.0
> ```
>
> This handles changes to `ember-cli-build.js`, `config/`, `.ember-cli`, etc.

#### Breaking Changes in 4.0 (all addressed in Phase 0)

| Change                                         | Status       | Action Required                     |
| ---------------------------------------------- | ------------ | ----------------------------------- |
| Array prototype extensions disabled by default | Phase 0.2 ✅ | Must complete before this upgrade   |
| `Ember.assign` removed                         | ✅ 0 usages  | None                                |
| `tryInvoke` removed                            | ✅ 0 usages  | None                                |
| `getWithDefault` removed                       | ✅ 0 usages  | None                                |
| `{{partial}}` helper removed                   | ✅ 0 usages  | None                                |
| `Ember.String` namespace deprecated            | 9 usages     | Migrate in Phase 2.9 (warning only) |
| Implicit injections removed                    | Phase 0.3 ✅ | Must complete before this upgrade   |
| ember-cli-babel v8 required                    | —            | Update package.json                 |

#### ember-data 3.24 → 4.12 Breaking Changes

ember-data 4.x introduces several breaking changes that Phase 0.9 and this phase must address:

| Change                                      | Impact                          | Action                  |
| ------------------------------------------- | ------------------------------- | ----------------------- |
| Explicit `async`/`inverse` required         | 55 relationships                | Phase 0.9 (pre-work)    |
| `store.findRecord` returns Promise strictly | May affect sync assumptions     | Test and verify         |
| `EmbeddedRecordsMixin` behavior changes     | Serializers using it            | Verify 42 serializers   |
| `Model.toJSON()` removed                    | Any code using `model.toJSON()` | Search and replace      |
| `store.pushPayload` requires modelName      | Any calls without model         | Verify                  |
| Strict relationship payloads                | Malformed payloads error        | Verify mirage factories |

> **This is the highest-risk part of Phase 1.** ember-data version jumps are not as smooth as ember-source. Budget extra time for serializer/adapter debugging.

#### Addon Compatibility Checks

- [ ] `ember-data` ~3.24 → bump to ~4.12
- [ ] `ember-concurrency` ^4.0.4 → should work
- [ ] `ember-power-select` ^8.6.2 → verify
- [ ] `ember-basic-dropdown` ^8.6.2 → verify
- [ ] `ember-data-model-fragments` → verify/update (**highest risk**)
- [ ] `ember-modifier` 3.2.6 → bump to ^4.1.0
- [ ] `ember-cli-mirage` 2.2.0 → verify (may need update for ember-data 4.x)
- [ ] `ember-statecharts` 0.14.0 → verify
- [ ] `ember-can` ^4.1.0 → verify

#### Fallback: Intermediate Steps

If the direct 3.28 → 4.12 jump fails:

1. **Try 4.4 first** — `npx ember-cli-update --to 4.4.0`, fix failures, then step to 4.8, then 4.12
2. **Isolate ember-data** — If ember-data 4.12 is the problem, try ember-source 4.12 + ember-data 4.4 (they can be pinned independently)
3. **Pin individual addon versions** — Some addons may need to stay at older versions temporarily

#### Validation

- [ ] `pnpm install` succeeds
- [ ] `ember build` succeeds
- [ ] App starts without errors
- [ ] Run full test suite, fix failures
- [ ] All API requests work (serializers/adapters)
- [ ] Model relationships resolve correctly
- [ ] Capture complete deprecation warning list
- [ ] All deprecation warnings categorized and prioritized for Phase 2
- [ ] Resolve all new deprecation warnings

---

### Phase 2: Deprecation Clean-Up (on 4.12, preparing for 5.0)

> **Goal:** Address all deprecation warnings while staying on 4.12 LTS. Every change here is backward-compatible with 4.12 and forward-compatible with 5.0.
> **Estimated effort:** 5-8 sprints (largest phase)
>
> **Critical ordering:** Some sub-tasks have dependencies. Recommended order:
>
> 1. First: 2.11 (`ember-overridable-computed` → `@tracked`) — must complete before 2.4
> 2. Then: 2.4 (`computed` → `@tracked`) + 2.5 (remove `set()` / `this.set()`) — enables everything else
> 3. Then: 2.1 (`{{action}}`) + 2.2 (`(mut)`) — template layer, independent of each other
> 4. Then: 2.3 (classic → Glimmer components) — depends on 2.4 and 2.5 being done
> 5. Then: 2.6 (mixins) + 2.7 (`@ember-decorators`) + 2.8 (lifecycle hooks) — cleanup
> 6. Finally: 2.9 (`@ember/string`) + 2.10 (PromiseProxy → tracked) + 2.12 — small items
> 7. Throughout: 2.13 (`this.get()`) — can be done any time
>
> **Phase 2A vs 2B:** Sub-tasks are split into two groups:
>
> - **Phase 2A (Must complete before 5.0):** 2.1, 2.2, 2.3, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12 — patterns that are **removed** in 5.0
> - **Phase 2B (Should complete, still works in 5.x):** 2.4, 2.5, 2.13 — patterns that are deprecated but **not removed** in 5.0
>
> This split means you can ship Phase 3 (Ember 5.x upgrade) after 2A is done, even if 2B isn't finished. That gives significant scheduling flexibility.

> **Test files:** Each sub-task below must include updates to corresponding test files. Tests contain deprecated patterns too: `this.set()` in 43 test files, `action` in 16 test files, `this.get()` in 13 test files, `computed()` in 2 test files. Failing to update tests leaves deprecated patterns that break in 5.x.

This is the heavy-lifting phase. It can be broken into sub-PRs:

#### 2.1 — Migrate `{{action}}` helper/modifier (~325 template usages)

**Priority: High** — Removed in 5.0

| Pattern                                | Replacement                                     | Count |
| -------------------------------------- | ----------------------------------------------- | ----- |
| `{{action "methodName"}}` on elements  | `{{on "click" this.methodName}}`                | ~151  |
| `(action "methodName")` subexpressions | `this.methodName` or `(fn this.methodName arg)` | ~174  |

Steps:

1. Ensure all string action targets have `@action` decorator in JS
2. Replace `{{action "name"}}` on elements → `{{on "click" this.name}}`
3. Replace `(action "name")` subexpressions → `this.name` or `(fn this.name arg)`
4. Replace `@attr={{action "name" arg}}` → `@attr={{fn this.name arg}}`
5. Remove `actions: {}` hash from any remaining classic components

#### 2.2 — Migrate `(mut)` helper (~66 usages)

**Priority: High** — Removed in 5.0

| Pattern                                 | Replacement                                                   |
| --------------------------------------- | ------------------------------------------------------------- |
| `@onFoo={{action (mut this.bar) true}}` | `@onFoo={{fn (set this "bar") true}}` or create setter action |
| `@value={{mut this.bar}}`               | `@value={{this.bar}} @onChange={{fn (set this "bar")}}`       |

Steps:

1. Install `ember-set-helper` for `(set)` helper or use `@tracked` + setter methods
2. For each `(mut)` usage, create an explicit `@action` setter method on the component
3. Preferred pattern: `@onClick={{this.setIsOpen}}` with `@action setIsOpen(val) { this.isOpen = val; }`

#### 2.3 — Migrate Classic Components to Glimmer (~71 files)

**Priority: Medium** — Classic components work in 4.12 but are deprecated

71 files import from `@ember/component` (should migrate to `@glimmer/component`).
50 of those still use `Component.extend({})`, the other 21 already use native class syntax but need the Glimmer conversion.

For each classic component:

1. Convert `Component.extend({})` → `class extends Component` (from `@glimmer/component`)
2. Remove `@tagName` (48 usages), `@classNames` (35), `@classNameBindings` (9), `@attributeBindings` (18) — add wrapper element to template
3. Replace `this.element` → use `{{did-insert}}` modifier or `...attributes`
4. Replace lifecycle hooks: `didInsertElement` (7 files) → `{{did-insert}}`, `willDestroyElement` (3 files) → `{{will-destroy}}`
5. Replace `this.set()` / `set(this,)` → use `@tracked` properties with direct assignment
6. Ensure all accessed properties use `@tracked` or `@computed`

**Sub-tasks by component complexity:**

- Simple components (no lifecycle hooks, few bindings): ~35 files
- Medium components (lifecycle hooks, some bindings): ~20 files
- Complex components (mixins, many bindings, heavy classic patterns): ~16 files

#### 2.4 — Migrate `computed()` to `@tracked` (~316 usages)

**Priority: Medium** — Works in 4.12, deprecated

Steps:

1. Replace simple `computed('dep', function() {})` with `get propName()` + `@tracked` deps
2. Replace `computed.alias()` → use `@tracked` or getter
3. Replace `computed.reads()` / `computed.readOnly()` → getter
4. Replace `computed.and/or/not()` → getter with boolean logic

#### 2.5 — Remove `set()` and `this.set()` (~172 usages)

**Priority: Medium** — Works in 4.12, deprecated

| Pattern                    | Count | Replacement                      |
| -------------------------- | ----- | -------------------------------- |
| `this.set('prop', value)`  | 154   | `this.prop = value` + `@tracked` |
| `set(this, 'prop', value)` | 18    | `this.prop = value` + `@tracked` |

Steps:

1. Replace all `this.set('prop', value)` → `this.prop = value` (154 occurrences in 47 files)
2. Replace all `set(this, 'prop', value)` → `this.prop = value` (18 occurrences)
3. Ensure target properties are `@tracked`
4. For nested paths like `set(this, 'a.b.c', val)` — refactor to tracked objects

#### 2.6 — Remove Mixins (~66 files: 10 mixin definitions + 56 consumers)

**Priority: Medium** — Works in 4.12, deprecated

Steps:

1. Audit each mixin for shared behavior
2. Convert to: utility functions, services, or component composition
3. Replace `.extend(MyMixin)` with direct imports/service injection

#### 2.7 — Remove `@ember-decorators` (~73 files)

**Priority: Medium** — Unmaintained, will break in 5.x

Also remove `ember-classic-decorator` (used alongside `ember-decorators`).

**Scope:** 76 component files use `@ember-decorators/component` and/or `ember-classic-decorator`. Additionally, 125 non-component files (adapters, serializers, models, controllers, routes, services, utils) use `ember-classic-decorator` alone.

**Decorator usage breakdown (components only):**

| Decorator            | Files               | Migration                                  |
| -------------------- | ------------------- | ------------------------------------------ |
| `@tagName`           | 43                  | Add wrapper element to template            |
| `@classNames`        | 35                  | Add static classes to wrapper element      |
| `@classNameBindings` | 9                   | Conditional classes in template            |
| `@attributeBindings` | 18                  | `...attributes` on wrapper element         |
| `@observes`          | 1 (+ 3 controllers) | Convert to tracked getter or explicit call |

**Component conversion complexity (76 components):**

##### Simple (46 components) — decorators only, maybe `@computed`

No lifecycle hooks, no `this.element`, no mixins. Mechanical conversion: change import, add wrapper element to template, move classes/attributes.

| Component                           | Tag     | Classes                     | Bindings                                                          | Extra Patterns                        |
| ----------------------------------- | ------- | --------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| `administration-subnav`             | `''`    | —                           | —                                                                 | —                                     |
| `client-subnav`                     | `''`    | —                           | —                                                                 | —                                     |
| `global-header`                     | div     | —                           | `data-test-global-header`                                         | —                                     |
| `json-viewer`                       | div     | `json-viewer`               | `isArrayBinding`                                                  | —                                     |
| `job-diff-fields-and-objects`       | `''`    | —                           | —                                                                 | —                                     |
| `page-layout`                       | div     | `page-layout`               | —                                                                 | yield                                 |
| `safe-link-to`                      | —       | —                           | —                                                                 | —                                     |
| `job-diff`                          | div     | `job-diff`                  | `isEditedBinding`                                                 | —                                     |
| `toggle`                            | `label` | `toggle`                    | `isDisabled:is-disabled`, `isActive:is-active`, `data-test-label` | yield                                 |
| `job-row`                           | `tr`    | `job-row`, `is-interactive` | `data-test-job-row`                                               | —                                     |
| `attributes-section`                | `''`    | —                           | —                                                                 | —                                     |
| `forbidden-message`                 | `''`    | —                           | —                                                                 | —                                     |
| `hamburger-menu`                    | `''`    | —                           | —                                                                 | —                                     |
| `job-deployment`                    | div     | `job-deployment`            | —                                                                 | —                                     |
| `allocation-subnav`                 | `''`    | —                           | —                                                                 | —                                     |
| `proxy-tag`                         | `''`    | —                           | —                                                                 | —                                     |
| `server-subnav`                     | `''`    | —                           | —                                                                 | —                                     |
| `placement-failure`                 | div     | —                           | —                                                                 | 1 test                                |
| `task-subnav`                       | `''`    | —                           | —                                                                 | —                                     |
| `job-deployment/deployment-metrics` | `''`    | —                           | —                                                                 | —                                     |
| `list-pagination/list-pager`        | `''`    | —                           | —                                                                 | yield                                 |
| `job-page/parts/error`              | `''`    | —                           | —                                                                 | —                                     |
| `job-page/parts/title`              | `''`    | —                           | —                                                                 | yield                                 |
| `job-page/parts/placement-failures` | `''`    | —                           | —                                                                 | 1 test                                |
| `list-table/table-body`             | `tbody` | —                           | —                                                                 | yield                                 |
| `list-table/table-head`             | `thead` | —                           | —                                                                 | yield                                 |
| `exec/open-button`                  | `''`    | —                           | —                                                                 | —                                     |
| `exec/task-contents`                | `''`    | —                           | —                                                                 | —                                     |
| `list-accordion/accordion-body`     | `''`    | —                           | —                                                                 | yield                                 |
| `list-accordion/accordion-head`     | div     | `accordion-head`            | `isOpen:is-active`, `data-test-accordion-head`                    | yield                                 |
| `fs/link`                           | `''`    | —                           | —                                                                 | yield                                 |
| `allocation-status-bar`             | div     | —                           | `data-test-allocation-status-bar`                                 | computed                              |
| `lifecycle-chart-row`               | `''`    | —                           | —                                                                 | computed                              |
| `job-client-status-bar`             | div     | —                           | `data-test-job-client-status-bar`                                 | computed, 1 test                      |
| `service-status-bar`                | div     | —                           | `data-test-service-status-bar`                                    | computed, 1 test                      |
| `search-box`                        | div     | `search-box`                | —                                                                 | `this.set`                            |
| `children-status-bar`               | div     | —                           | `data-test-children-status-bar`                                   | computed                              |
| `lifecycle-chart`                   | `''`    | —                           | —                                                                 | computed, 1 test                      |
| `plugin-allocation-row`             | div     | —                           | `data-test-allocation`                                            | `didReceiveAttrs`, `this.set`, 1 test |
| `stepper-input`                     | div     | `stepper-input`             | `disabled:is-disabled`                                            | `this.set`, 1 test, yield             |
| `allocation-stat`                   | `''`    | —                           | —                                                                 | computed                              |
| `job-page/parts/summary`            | div     | `boxed-section`             | —                                                                 | computed, 1 test                      |
| `list-table/sort-by`                | `th`    | `is-sortable`               | `active:is-active`, `desc:is-desc`, `data-test-sort-by`           | computed, yield                       |
| `exec/task-group-parent`            | `''`    | —                           | —                                                                 | computed                              |
| `fs/breadcrumbs`                    | `nav`   | `breadcrumb`                | `aria-label`                                                      | computed                              |
| `fs/browser`                        | `''`    | —                           | —                                                                 | computed                              |

> **Subgroup: `@tagName('')` (21 components):** These are tagless — already render no wrapper element. Conversion: just change `@ember/component` → `@glimmer/component`, remove `@classic`/`@tagName('')`, update `this.propName` to `this.args.propName` for passed-in args. Easiest batch.
>
> **Subgroup: `@tagName('div')` with classes (15 components):** Wrap template content in `<div class="...">`. If `...attributes` is needed, add it to the wrapper.
>
> **Subgroup: Custom tag names (10 components):** `tr`, `th`, `label`, `tbody`, `thead`, `nav`, `figure`, `ol`, `pre`, `table`. Wrap template in the corresponding HTML element.

##### Medium (17 components) — `this.set`, `overridable`, or `didReceiveAttrs`

Requires additional refactoring beyond mechanical template changes:

| Component                           | Key Patterns                                     | Notes                                                        |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `task-group-row`                    | computed, this.get                               | `@tagName('tr')` — wrap in `<tr>`                            |
| `server-agent-row`                  | computed, this.get                               | `@tagName('tr')`, `@classNameBindings('isActive:is-active')` |
| `image-file`                        | this.set, computed                               | `@tagName('figure')` — wrap in `<figure>`                    |
| `gutter-menu`                       | computed, this.get                               | No decorators except `@classic`                              |
| `reschedule-event-row`              | overridable                                      | No decorators except `@classic`                              |
| `region-switcher`                   | computed, this.get                               | No decorators except `@classic`                              |
| `fs/directory-entry`                | computed, this.get                               | No decorators except `@classic`                              |
| `task-row`                          | didReceiveAttrs, this.set, computed, this.get    | `@tagName('tr')`, complex row component                      |
| `job-versions-stream`               | computed, overridable                            | `@tagName('ol')`, `@classNames('timeline')`                  |
| `task-log`                          | this.set, computed, this.get                     | `@classNames('boxed-section', 'task-log')`                   |
| `job-deployments-stream`            | computed, overridable                            | `@tagName('ol')`, `@classNames('timeline')`                  |
| `list-table`                        | computed, overridable                            | `@tagName('table')`, `@classNames('table')`                  |
| `job-page/parts/recent-allocations` | this.set, computed, this.get                     | `@classNames('boxed-section')`                               |
| `fs/file`                           | this.set, computed, this.get                     | `@classNames('boxed-section', 'task-log')`                   |
| `list-accordion`                    | this.set, computed, overridable                  | `@classNames('accordion')`                                   |
| `drain-popover`                     | didReceiveAttrs, this.set, computed, overridable | No tag decorators                                            |
| `list-pagination`                   | computed, overridable, this.get                  | No decorators except `@classic`                              |

> **`overridable` pattern (6 components):** These use `ember-overridable-computed` which provides "arg with default" — convert to a getter: `get prop() { return this.args.prop ?? defaultValue; }`
>
> **`didReceiveAttrs` (3 components):** Convert to a getter or tracked property that recomputes based on args. Often used to "sync" an arg to local state.
>
> **`this.set` / `this.get` (10+ components):** Convert to `@tracked` with direct assignment.

##### Complex (13 components) — lifecycle hooks, `this.element`, mixins

Requires significant refactoring. Each needs individual architectural review:

| Component                    | Key Patterns                                                                    | Critical Issues                                               |
| ---------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `agent-monitor`              | lifecycle_hooks, this.set, computed                                             | Has `didInsertElement` for terminal setup                     |
| `allocation-row`             | didReceiveAttrs, this.set, computed, overridable, this.get                      | `@tagName('tr')`, 3 attributeBindings                         |
| `client-node-row`            | didReceiveAttrs, computed, mixin, this.get                                      | `@tagName('tr')`, uses mixin                                  |
| `job-page/parts/task-groups` | computed, mixin, this.get                                                       | Uses mixin                                                    |
| `popover-menu`               | didReceiveAttrs, this.element, this.set                                         | Uses `this.element` for click-outside detection               |
| `two-step-button`            | this.element, this.set                                                          | Uses `this.element` for focus management                      |
| `job-page/parts/children`    | this.set, computed, mixin, this.get                                             | Uses mixin                                                    |
| `multi-select-dropdown`      | didReceiveAttrs, this.element, this.set, overridable                            | Uses `this.element` for focus/keyboard management             |
| `global-search/control`      | lifecycle_hooks, this.element                                                   | Uses `this.element` for positioning, `didInsertElement`       |
| `exec-terminal`              | lifecycle_hooks, this.element, mixin                                            | Uses `this.element` for xterm.js terminal mounting            |
| `gauge-chart`                | lifecycle_hooks, this.element, this.set, computed, mixin                        | Uses `this.element` for d3.js chart rendering                 |
| `streaming-file`             | lifecycle_hooks, didReceiveAttrs, this.element, this.set, mixin, this.get       | Uses `this.element` for streaming content                     |
| `distribution-bar`           | lifecycle_hooks, this.element, this.set, computed, overridable, mixin, observes | Most complex — d3.js chart, observer, mixin, DOM manipulation |

> **`this.element` components (9):** Must replace with `{{did-insert}}` modifier + element reference management. Pattern: add a modifier that captures the element, store in a class field.
>
> **Mixin components (7):** Audit each mixin dependency:
>
> - `window-resizable` → `{{did-insert}}` + `{{will-destroy}}` with `ResizeObserver`
> - `searchable` → utility function
> - `sortable-factory` → utility function
> - `with-component-visibility-detection` → `IntersectionObserver` modifier
>
> **`@observes` (1 component: distribution-bar):** Replace with explicit call. `@observes('data')` → tracked getter or `{{did-update}}` modifier.

**Non-component `@classic` removal (125 files):**

These files use `ember-classic-decorator` but NOT `@ember-decorators/component`. The `@classic` decorator only suppresses a warning about using classic patterns. Removing it is safe **if** the class doesn't use any classic-specific APIs (which it will still have access to via `@ember/component` etc.). These can be done in a single mechanical pass:

| Category    | Files | Notes                                                         |
| ----------- | ----- | ------------------------------------------------------------- |
| Adapters    | 28    | Just remove `@classic` import + decorator                     |
| Serializers | 42    | Just remove `@classic` import + decorator                     |
| Models      | 14    | Just remove `@classic` import + decorator                     |
| Controllers | 17    | Just remove `@classic` import + decorator. 3 have `@observes` |
| Routes      | 10    | Just remove `@classic` import + decorator                     |
| Services    | 2     | Just remove `@classic` import + decorator                     |
| Abilities   | 4     | Just remove `@classic` import + decorator                     |
| Utils       | 8     | Just remove `@classic` import + decorator                     |

> **Warning:** The 3 controllers with `@observes` (`application.js`, `clients/client/index.js`, `allocations/allocation/index.js`) need the observer replaced with a tracked getter or explicit effect pattern before `@ember-decorators/object` can be removed.

**Recommended execution order (PRs):**

1. **PR A — Non-component `@classic` removal (125 files):** Mechanical — just remove import + decorator. No behavior change. Quick win.
2. **PR B — Tagless simple components (21 files):** Components with `@tagName('')` — just change import, remove decorators, update arg access (`this.x` → `this.args.x`).
3. **PR C — Simple components with wrapper elements (25 files):** Add wrapper `<div>`/`<tr>`/`<th>`/etc. to template, move classes and attributes there.
4. **PR D — Medium components (17 files):** Requires `overridable` → getter, `this.set` → `@tracked`, `didReceiveAttrs` → getter.
5. **PR E — Complex components (13 files):** Individual architectural review per component. `this.element` → modifier, mixins → utilities, `@observes` → tracked.
6. **PR F — Remove `@ember-decorators` + `ember-classic-decorator` from `package.json`.**

**Dependencies:**

- PR A has no dependencies
- PR B-C depend on understanding arg access patterns (`this.x` vs `this.args.x`)
- PR D depends on Phase 2.11 (`ember-overridable-computed` removal) for the 6 overridable components
- PR E depends on Phase 2.6 (mixin removal) for the 7 mixin components
- PR F depends on all of A-E being complete

#### 2.8 — Migrate `didInsertElement` / `willDestroyElement` (~10 usages across 8 files)

**Priority: Medium** — Part of classic component migration

Steps:

1. `ember-modifier` is at 3.2.6 on main — upgrade to ^4.x, or use `@ember/render-modifiers` (^2.0.4 already installed) for `{{did-insert}}` / `{{will-destroy}}`
2. Move DOM setup from `didInsertElement` → modifier or `{{did-insert}}` modifier
3. Move cleanup from `willDestroyElement` → `{{will-destroy}}` modifier

#### 2.9 — Migrate `@ember/string` (9 usages)

**Priority: Medium** — Deprecated in 4.x, removed in 5.0

| Import       | Replacement                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `camelize`   | Native: `str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())` or keep `@ember/string` as standalone package |
| `dasherize`  | Native: `str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()`                                             |
| `capitalize` | Native: `str.charAt(0).toUpperCase() + str.slice(1)`                                                        |
| `htmlSafe`   | Move to `import { htmlSafe } from '@ember/template'`                                                        |

Files: `app/adapters/auth-method.js`, `app/adapters/application.js`, `app/components/job-page/parts/summary-chart.js`, `app/components/das/recommendation-chart.js`, `app/serializers/volume.js`, `app/serializers/application.js`, `app/serializers/dynamic-host-volume.js`, `app/helpers/format-template-label.js`, `app/helpers/css-class.js`

#### 2.10 — Replace `PromiseProxyMixin` / `ObjectProxy` / `ArrayProxy` (2 files)

**Priority: Medium** — Deprecated, no direct replacement in 5.x

| File                                  | Replacement                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `app/utils/classes/promise-object.js` | Use `@tracked` + async getter pattern or `ember-resources` |
| `app/utils/classes/promise-array.js`  | Use `@tracked` + async getter pattern or `ember-resources` |

Pattern:

```js
// Before (PromiseProxyMixin)
export default ObjectProxy.extend(PromiseProxyMixin);

// After (@tracked + resource)
class AsyncData {
  @tracked data = null;
  @tracked isLoading = true;
  @tracked error = null;

  constructor(promise) {
    promise
      .then((d) => {
        this.data = d;
        this.isLoading = false;
      })
      .catch((e) => {
        this.error = e;
        this.isLoading = false;
      });
  }
}
```

#### 2.11 — Migrate `ember-overridable-computed` (14 files)

**Priority: HIGH** — Won't work with `@tracked`. Must complete **before** 2.4 `@tracked` migration.

> **⚠️ Ordering dependency:** This must be done FIRST in Phase 2, before 2.4 converts `computed()` → `@tracked`.

See Phase 0.7 for full file list and migration pattern. All 14 usages are "arg with default" patterns — convert to getters reading `this.args` with fallback values.

#### 2.12 — Remove `ember-cli-moment-shim` + `ember-moment` (~22 template usages)

**Priority: Medium** — Works but deprecated, adds ~300KB to bundle

See Phase 0.7 for full file list and replacement helper. Replace `{{moment-from-now}}` with a native `Intl.RelativeTimeFormat` helper.

#### 2.13 — Replace `this.get()` calls (~116 usages in 44 files)

**Priority: Low** — Deprecated but still functional. Can be done incrementally.

Replace `this.get('propName')` with direct property access `this.propName`. For nested paths like `this.get('model.name')`, use optional chaining: `this.model?.name`.

This is safe to do any time and can be parallelized with any other Phase 2 sub-task.

#### Phase 2 Validation

- [ ] Zero deprecation warnings on 4.12
- [ ] Full test suite passes
- [ ] All components render correctly
- [ ] Performance baseline established

---

### Phase 3: Upgrade to Ember 5.4 LTS (Future)

> **Goal:** Cross the 5.0 boundary. All deprecated patterns from Phase 2A are now _removed_.
> **Estimated effort:** 1-2 sprints (mostly addon compat)
>
> **Note:** Phase 2B work (`computed()`, `this.set()`, `this.get()`) can continue after this upgrade — those patterns are deprecated but not removed in 5.0.

#### Version Bumps

| Package         | From    | To     |
| --------------- | ------- | ------ |
| ember-source    | ~4.12.0 | ~5.4.0 |
| ember-cli       | ~4.12.0 | ~5.4.0 |
| ember-data      | ~4.12   | ~5.3   |
| ember-cli-babel | ^8.0.0  | Verify |

#### Key Removals in 5.0 (should be zero if Phase 2A complete)

- `{{action}}` helper/modifier → already migrated
- `(mut)` helper → already migrated
- Array prototype extensions → already migrated
- `{{partial}}` → already at 0
- Classic component `.extend()` → still works via `@ember/component` but deprecated
- `sendAction` → already at 0
- `@ember/string` utilities → already migrated
- `PromiseProxyMixin` → already migrated

#### ember-data 4.x → 5.x Migration (CRITICAL)

This is the **highest-risk part** of the entire upgrade. ember-data 5.x introduces:

1. **Package restructuring** — `ember-data` umbrella package splits into:

   - `@ember-data/store` (core store)
   - `@ember-data/model` (Model class)
   - `@ember-data/adapter` (adapters)
   - `@ember-data/serializer` (serializers)
   - `@ember-data/request` (new request system)

2. **Import path changes** — but backward-compat imports still work in 5.x

3. **`ember-data-model-fragments`**:

   - Check if `6.x` stable supports ember-data 5.x
   - If not, options:
     a. Fork and maintain internally
     b. Replace fragments with embedded records + custom transforms
     c. Flatten models that use fragments
   - **Audit fragment usage** to understand scope:
     ```bash
     grep -rn 'fragment(' app/models/ --include='*.js'
     grep -rn 'fragmentArray(' app/models/ --include='*.js'
     ```

4. **Serializer/Adapter deprecations in 5.x** — the traditional adapter/serializer pattern is deprecated in favor of `RequestManager` + handlers. This is a large architectural shift but does NOT need to happen immediately — it's deprecated, not removed.

#### Scope of ember-data work

| Category          | Files | Effort                        |
| ----------------- | ----- | ----------------------------- |
| Models            | 61    | Low (import paths, mostly)    |
| Serializers       | 42    | Medium (may need refactoring) |
| Adapters          | 26    | Medium (may need refactoring) |
| Model fragments   | TBD   | **High** (addon compat)       |
| Custom transforms | TBD   | Low-Medium                    |

#### Validation

- [ ] Clean build with zero errors
- [ ] Full test suite passes
- [ ] All API requests work correctly (adapters/serializers)
- [ ] Model relationships resolve correctly

---

### Phase 4: Upgrade to Ember 5.12 LTS / 6.x (Future)

> **Goal:** Reach latest LTS
> **Estimated effort:** 1-2 sprints

This phase is straightforward if Phase 2 was thorough. Main concerns:

- ember-data package restructuring (v5 → v6 has breaking changes)
- `ember-data-model-fragments` compatibility
- Third-party addon compatibility

> **Next steps:** After completing Phases 0-4, see [EMBER_MODERNIZATION_PLAN.md](EMBER_MODERNIZATION_PLAN.md) for SFC conversion (Phase 5), Vite migration (Phase 6), and TypeScript adoption (Phase 7).

---

## Recommended PR Strategy

Each phase should be a **separate PR** for reviewability. Phase 2 should be broken into **multiple PRs** (one per sub-task 2.1-2.13).

| PR      | Branch From  | Description                                                  | Size                 | Parallelizable |
| ------- | ------------ | ------------------------------------------------------------ | -------------------- | -------------- |
| PR 0a   | main         | Remove array prototype extensions (~271)                     | Large but mechanical | —              |
| PR 0b   | main         | Remove `application.inject`                                  | Small                | With 0a        |
| PR 0c   | main         | Barrel `import Ember` → specific imports (21 files)          | Medium, mechanical   | With 0a, 0b    |
| PR 0d   | main         | Convert Route/Controller `.extend` → native class (50 files) | Medium, automated    | With 0a-0c     |
| PR 0e   | main         | Replace `ember-copy` + `ember-fetch`                         | Small                | With 0a-0d     |
| PR 0f   | main         | Remove legacy addons (moment, overridable-computed, sinon)   | Medium               | With 0a-0e     |
| PR 0g   | main         | Add explicit `async`/`inverse` to relationships (55)         | Medium, mechanical   | With 0a-0f     |
| PR 0h   | main         | Refactor dynamic `{{component}}` invocations (2 files)       | Small                | With 0a-0g     |
| PR 1    | main + PR 0x | Ember 4.12 LTS upgrade (direct)                              | Medium-Large         | —              |
| PR 2.11 | PR 1         | Migrate `ember-overridable-computed` (14 files)              | Small                | — (**first**)  |
| PR 2.4  | PR 2.11      | `computed()` → `@tracked` (316 usages)                       | Large, mechanical    | With 2.5       |
| PR 2.5  | PR 2.11      | Remove `set()` + `this.set()` (~172 usages)                  | Medium, mechanical   | With 2.4       |
| PR 2.1  | PR 2.4+2.5   | Migrate `{{action}}` (~325 usages)                           | **XL**, mechanical   | With 2.2       |
| PR 2.2  | PR 2.4+2.5   | Migrate `(mut)` (66 usages)                                  | Medium               | With 2.1       |
| PR 2.3  | PR 2.1+2.2   | Classic → Glimmer components (~71 files)                     | **XL**, complex      | —              |
| PR 2.6  | PR 2.3       | Remove Mixins (66 files)                                     | Large, complex       | With 2.7, 2.8  |
| PR 2.7  | PR 2.3       | Remove `@ember-decorators` (~73 files)                       | Large                | With 2.6, 2.8  |
| PR 2.8  | PR 2.3       | Lifecycle hooks → modifiers (10 usages)                      | Small-Medium         | With 2.6, 2.7  |
| PR 2.9  | PR 1         | `@ember/string` migration (9 usages)                         | Small                | With 2.1-2.8   |
| PR 2.10 | PR 2.4       | PromiseProxy → tracked (2 files)                             | Small                | With 2.1-2.8   |
| PR 2.12 | PR 1         | Remove moment (22 template usages)                           | Medium               | With 2.1-2.8   |
| PR 2.13 | PR 1         | Replace `this.get()` (116 usages)                            | Medium, mechanical   | With any       |
| PR 3    | all PR 2.x   | Ember 5.4 LTS upgrade                                        | Medium-Large         | —              |
| PR 4    | PR 3         | Ember 5.12 / 6.x LTS upgrade                                 | Medium               | —              |

> **Note:** Phase 0 PRs can all land on main independently — they're backward-compatible with 3.28. This de-risks the upgrade significantly.

### Branching Strategy

Phase 0 and Phase 1+ have fundamentally different dependency models, so they use different branching strategies:

#### Phase 0: Independent Feature Branches from `main`

All Phase 0 sub-tasks are **backward-compatible with 3.28** and have **no dependencies on each other**. Each gets its own branch from `main`:

```text
main
 ├── ember-upgrade/array-extensions           ← PR 0a (0.2)
 ├── ember-upgrade/remove-implicit-injections ← PR 0b (0.3)
 ├── ember-upgrade/barrel-imports             ← PR 0c (0.4)
 ├── ember-upgrade/native-classes             ← PR 0d (0.5)
 ├── ember-upgrade/replace-ember-copy         ← PR 0e (0.7 + 0.8)
 ├── ember-upgrade/remove-legacy-addons       ← PR 0f (0.7)
 ├── ember-upgrade/explicit-relationships     ← PR 0g (0.9)
 └── ember-upgrade/dynamic-component-invocations ← PR 0h (0.10) ✅ DONE
```

**Why independent:** No coupling means no cascading rebase pain. PRs can be reviewed, revised, and merged in any order. If one PR gets blocked by review feedback, others continue landing.

**Naming convention:** `ember-upgrade/<descriptive-slug>`

#### Phase 1+: Stacked Milestone Branch

Once all Phase 0 PRs have landed on `main`, Phase 1 onward uses a **milestone branch** with stacked PRs. This is necessary because Phase 2 sub-tasks have real dependency ordering (e.g., 2.11 before 2.4, 2.4+2.5 before 2.1).

```
main (with all Phase 0 merged)
 └── ember-upgrade/4.12                        ← milestone branch
      ├── ember-upgrade/phase-1-version-bump   ← PR 1: version bump + config
      ├── ember-upgrade/overridable-computed    ← PR 2.11 (must be first in Phase 2)
      ├── ember-upgrade/tracked-migration      ← PR 2.4: computed → @tracked
      ├── ember-upgrade/remove-set             ← PR 2.5: remove set()/this.set()
      ├── ember-upgrade/migrate-action         ← PR 2.1: {{action}} → {{on}}
      ├── ember-upgrade/migrate-mut            ← PR 2.2: (mut) → setter actions
      ├── ember-upgrade/glimmer-components     ← PR 2.3: classic → Glimmer
      ├── ember-upgrade/remove-mixins          ← PR 2.6
      ├── ember-upgrade/remove-decorators      ← PR 2.7
      ├── ember-upgrade/lifecycle-modifiers    ← PR 2.8
      ├── ember-upgrade/ember-string           ← PR 2.9
      ├── ember-upgrade/promise-proxy          ← PR 2.10
      ├── ember-upgrade/remove-moment          ← PR 2.12
      └── ember-upgrade/remove-this-get        ← PR 2.13
```

**Workflow for stacked PRs:**

1. Create milestone branch: `git checkout -b ember-upgrade/4.12 main`
2. Each sub-task branches from the milestone: `git checkout -b ember-upgrade/phase-1-version-bump ember-upgrade/4.12`
3. PR targets the milestone branch (not `main`)
4. After merge into milestone, rebase subsequent branches
5. When all Phase 2 work is done, merge `ember-upgrade/4.12` → `main` (or merge incrementally)

**Periodic sync:** Rebase `ember-upgrade/4.12` onto `main` periodically to avoid drift, especially as Phase 0 PRs land.

#### Phase 3+: New Milestone Branch

```
main (with ember-upgrade/4.12 merged)
 └── ember-upgrade/5.x                        ← new milestone branch
      ├── ember-upgrade/phase-3-version-bump   ← PR 3
      └── ember-upgrade/phase-4-version-bump   ← PR 4
```

#### Summary

| Phase   | Strategy              | Target Branch        | Reason                                |
| ------- | --------------------- | -------------------- | ------------------------------------- |
| Phase 0 | Independent from main | `main`               | No dependencies, all backward-compat  |
| Phase 1 | Stacked on milestone  | `ember-upgrade/4.12` | Version bump is prerequisite for Ph 2 |
| Phase 2 | Stacked on milestone  | `ember-upgrade/4.12` | Sub-tasks have ordering dependencies  |
| Phase 3 | New milestone         | `ember-upgrade/5.x`  | New version target                    |
| Phase 4 | New milestone         | `ember-upgrade/5.x`  | Continuation of 5.x work              |

---

## Effort Estimates Summary

| Phase                         | Effort             | Risk        | Files Touched |
| ----------------------------- | ------------------ | ----------- | ------------- |
| Phase 0 (Pre-work on 3.28)    | 2-3 sprints        | Low         | ~250          |
| Phase 1 (→ 4.12 LTS direct)   | 1-2 sprints        | Medium      | ~30 (config+) |
| Phase 2 (Deprecation cleanup) | 5-8 sprints        | Medium-High | ~500+         |
| Phase 3 (→ 5.4 LTS)           | 2-3 sprints        | Medium-High | ~150          |
| Phase 4 (→ 5.12/6.x)          | 1-2 sprints        | Medium      | ~20           |
| **Total**                     | **~11-18 sprints** | —           | —             |

> **Aggressive timeline:** If Phase 0 pre-work is thorough and Phase 2 work is parallelized across 2-3 developers, Phases 0-4 can be compressed to **~8-12 sprints**.
>
> **Phase 2A/2B flexibility:** Phase 2A (patterns removed in 5.0) must complete before Phase 3. Phase 2B (patterns deprecated but functional in 5.x) can continue after the 5.0 upgrade, reducing the critical path.
>
> **Note:** Phase 2 is significantly larger than initial estimates due to corrected counts: `{{action}}` is ~325 usages (not 79), `@ember-decorators` spans 73 files (not 42), `this.set()` adds 154 additional occurrences, mixins affect 66 files (10 definitions + 56 consumers), and test files add ~74 additional files with deprecated patterns.
>
> **Next:** For SFC conversion, Vite migration, and TypeScript adoption estimates, see [EMBER_MODERNIZATION_PLAN.md](EMBER_MODERNIZATION_PLAN.md).

## Key Risks

1. **ember-data-model-fragments** — This addon has historically lagged behind ember-data releases. It's on a beta version now (`5.0.0-beta.3`). May need to fork or find alternatives for 5.x+. This is the **single highest risk item**.
2. **ember-data 3.24 → 4.x** — 55 relationships missing explicit `async`/`inverse` options, plus potential `EmbeddedRecordsMixin` behavior changes across 42 serializers. Phase 0.9 addresses this but debugging may be needed.
3. **ember-data 5.x** — Major restructuring of the package. 61 models, 42 serializers, 26 adapters all potentially affected. The new RequestManager pattern is a paradigm shift.
4. **`{{action}}` migration (~325 usages + 16 test files)** — The largest single migration by count. Affects templates across the entire app. High risk of regressions if action arguments or event handling semantics differ.
5. **Classic → Glimmer component conversion** (~71 files) — The most labor-intensive work. 50 still use `Component.extend()`. 48 `@tagName` usages, 35 `@classNames`, 18 `@attributeBindings`, and 10 lifecycle hooks must all be manually refactored.
6. **`computed()` → `@tracked` (316 usages)** — High volume. Risk of subtle reactivity bugs if dependency chains are not correctly mapped.
7. **`this.set()` (154 in 47 app files + 43 test files) + `this.get()` (116 in 44 app files + 13 test files)** — Adds significant scope. Test files must be updated in lockstep with app code.
8. **Third-party addon compatibility** — Particularly `ember-decorators` + `ember-classic-decorator` (unmaintained, 73 files), `ember-overridable-computed` (won't work with @tracked, 14 files), `ember-statecharts`.
9. **Mirage** — 98 mirage files may need updates for ember-data changes. `ember-cli-mirage` 2.2.0 may need updating for 4.x+ compat.
10. **Mixins (66 files)** — 10 mixin definitions are consumed by 56 files across routes, controllers, components, and utils. Each consumer must be refactored individually.
11. **Feature development conflicts** — Long-running upgrade work across ~500+ files will create merge conflicts with ongoing feature development. See "Feature Development Strategy" below.

## Rollback Strategy

Each phase should include:

- **Git tag** before starting (e.g., `pre-ember-4.12-upgrade`)
- **Feature flag** for any UI-visible behavior changes
- **Independent PR merges** — never batch multiple phases into one merge
- **CI green gate** — don't merge if any tests fail

For Phase 2 sub-tasks, if a sub-task introduces regressions:

- Revert the specific PR
- Investigate on a branch
- The rest of Phase 2 can continue independently (due to parallelization)

## Feature Development Strategy

Upgrading across ~500+ files over 11-18 sprints will create merge conflicts with ongoing feature development. This section defines how to minimize friction.

### Principles

1. **Land Phase 0 PRs directly on main** — Every Phase 0 change is backward-compatible with 3.28. Merge them independently, in any order. This is the safest phase and should never require a long-lived branch.
2. **Short-lived branches only** — Each PR should branch from main, stay open for 1-3 days max, then merge. Never maintain a long-lived upgrade branch.
3. **No staging branch** — Do NOT create a cumulative `ember-upgrade` branch that accumulates changes. This creates impossible-to-resolve merge conflicts.
4. **CI lint guardrails prevent regressions** — As each deprecated pattern is removed, enable the corresponding lint rule in the same PR. This prevents other developers from re-introducing the pattern.

### Workflow Per-Phase

| Phase      | Branch Strategy               | Merge Target | Conflict Risk                              |
| ---------- | ----------------------------- | ------------ | ------------------------------------------ |
| Phase 0    | Branch from main per-PR       | main         | Low — independent, backward-compatible     |
| Phase 1    | Single PR from main           | main         | Medium — config changes, lock file         |
| Phase 2    | Branch from main per sub-task | main         | Medium-High — many template/JS touchpoints |
| Phases 3-4 | Single PR from main           | main         | Medium — mostly config + addon compat      |

### Preventing Regressions

When a Phase 2 sub-task PR merges:

1. Enable the corresponding lint rule in the **same PR** (e.g., when `{{action}}` migration merges, set `no-action: error`)
2. This immediately prevents any other PR from using `{{action}}`
3. The lint rule acts as a permanent guardrail — no coordination needed with other developers

### Communicating with the Team

- Post in team channel before starting each Phase 2 sub-task: "Starting `{{action}}` removal — will touch 50+ template files"
- Avoid starting migration PRs on Friday — merge conflicts compound over weekends
- If a conflict arises, the migration PR should rebase, not the feature PR

## Node.js Requirements

| Ember Version | Minimum Node | Recommended | Notes       |
| ------------- | ------------ | ----------- | ----------- |
| 3.28          | 12           | 16 LTS      | Current     |
| 4.4           | 14           | 16 LTS      |             |
| 4.8           | 14           | 18 LTS      |             |
| 4.12          | 16           | 18 LTS      |             |
| 5.4           | 18           | 20 LTS      | Node 16 EOL |
| 5.12          | 18           | 20 LTS      |             |
| 6.x           | 18           | 22 LTS      |             |

> **Current workspace:** Node v25.6.1 — this is fine for all versions but will produce "unsupported engine" warnings. Pin CI to the recommended LTS version for each phase.

## CI/CD Considerations

- **Deprecation CI check** — Add a CI step that fails on new deprecation warnings (guards against regressions)
- **Bundle size tracking** — The upgrade should reduce bundle size as deprecated patterns are removed. Track this:
  - `ember-auto-import` v2 has better tree-shaking
  - Removing `moment.js` saves ~300KB
  - Glimmer components are lighter than classic components

## Performance KPIs

Measure these metrics **before starting Phase 0** to establish a baseline, then track after each phase:

| Metric                                      | When to Measure      | Target                                     |
| ------------------------------------------- | -------------------- | ------------------------------------------ |
| `ember build --environment=production` time | Each phase           | Baseline → monitor for regression          |
| `ember test` full suite time                | Each phase           | Baseline → should stay stable              |
| Production bundle size (vendor.js + app.js) | Each phase           | -20% by Phase 4 (moment removal + Glimmer) |
| Dev server startup time                     | After Phase 6 (Vite) | <5s (currently ~30-60s with Broccoli)      |
| HMR update time                             | After Phase 6 (Vite) | <500ms (currently multi-second rebuild)    |
| Number of deprecation warnings              | Each phase           | → 0 by end of Phase 2                      |

> **Why baseline early:** Without a before-measurement, you can't show improvement to stakeholders. Run `ember build --environment=production && ls -la dist/assets/*.js` and record sizes before starting.

## Custom Codemod Investment

For the three largest mechanical migrations, writing custom AST transforms can save 1-2 sprints compared to manual conversion. Budget 2-3 days per codemod.

### Recommended Custom Codemods

| Migration                                   | Usages | Codemod Approach                                        | Estimated Savings        |
| ------------------------------------------- | ------ | ------------------------------------------------------- | ------------------------ |
| `{{action}}` → `{{on}}` / `(fn)`            | ~325   | Template AST via `ember-template-recast`                | 3-5 days vs 10-15 manual |
| `this.set('prop', val)` → `this.prop = val` | 154    | JS AST via `jscodeshift`                                | 1-2 days vs 5-7 manual   |
| `this.get('prop')` → `this.prop`            | 116    | JS AST via `jscodeshift`                                | 1 day vs 3-4 manual      |
| Array extensions → native                   | ~271   | Already exists: `scripts/fix-ember-array-extensions.js` | —                        |

### `{{action}}` Codemod Detail

The `{{action}}` migration has three sub-patterns that need different transforms:

```js
// Pattern 1: {{action "name"}} on elements → {{on "click" this.name}}
// Pattern 2: (action "name") subexpression → this.name or (fn this.name arg)
// Pattern 3: @attr={{action "name" arg}} → @attr={{fn this.name arg}}
```

Use `ember-template-recast` to write a transform:

```js
// scripts/codemod-action-to-on.js
const { transform } = require('ember-template-recast');
// Walk MustacheStatement/SubExpression nodes where path.original === 'action'
// Replace based on context (element modifier vs subexpression vs attr)
```

### `this.set()` Codemod Detail

```js
// jscodeshift transform
// Find: this.set('propName', value)
// Replace: this.propName = value
// Also add @tracked decorator to class property if not present
```

> **Important:** Codemods handle the mechanical 80% — the remaining 20% (edge cases, nested paths, dynamic keys) require manual review. Always diff the codemod output carefully.

## Linting Strategy

Enable deprecation lint rules incrementally to prevent regressions:

```js
// .template-lint.js — enable per-phase
module.exports = {
  rules: {
    // Phase 2.1
    'no-action': 'error',
    // Phase 2.2
    'no-mut-helper': 'error',
    // Phase 2.3
    'no-curly-component-invocation': 'error',
  },
};
```

```js
// .eslintrc.js — enable per-phase
module.exports = {
  rules: {
    // Phase 0.4
    'ember/no-classic-classes': 'warn', // then 'error' after conversion
    // Phase 2.4
    'ember/no-computed-properties-in-native-classes': 'error',
    // Phase 2.5
    'ember/no-ember-set': 'error',
    // Phase 2.6
    'ember/no-mixins': 'error',
    // Phase 0.4
    'ember/no-import-ember-global': 'error',
  },
};
```

## Tools & Resources

### Codemods (automate the boring parts)

| Codemod                            | Phase    | What It Does                                        |
| ---------------------------------- | -------- | --------------------------------------------------- |
| `ember-native-class-codemod`       | 0.5, 2.3 | Converts `.extend()` → native `class` syntax        |
| `ember-no-implicit-this-codemod`   | —        | Adds `this.` prefix (already done in this codebase) |
| `ember-tracked-properties-codemod` | 2.4      | Converts `computed()` → `@tracked` + getters        |
| `ember-angle-brackets-codemod`     | —        | Already done (angle bracket invocation)             |
| `ember-cli-update`                 | 1        | Updates ember-cli config files automatically        |

### Lint Tools

- [`ember-cli-deprecation-workflow`](https://github.com/ember-cli/ember-cli-deprecation-workflow) — Capture, triage, and silence deprecation warnings per-phase
- [`ember-template-lint`](https://github.com/ember-template-lint/ember-template-lint) — `no-action`, `no-mut-helper`, `no-curly-component-invocation` rules
- [`eslint-plugin-ember`](https://github.com/ember-cli/eslint-plugin-ember) — `no-classic-classes`, `no-computed-properties-in-native-classes`, `no-ember-set`, `no-mixins`, `no-import-ember-global`

### Documentation

- [Ember Deprecation Guides](https://deprecations.emberjs.com/) — Official guide for each deprecation
- [Ember 4.0 Release Blog](https://blog.emberjs.com/ember-4-0-released/) — What was removed
- [Ember 5.0 Release Blog](https://blog.emberjs.com/ember-5-0-released/) — What was removed
- [Ember Octane Upgrade Guide](https://guides.emberjs.com/release/upgrading/current-edition/) — Classic → Octane patterns
- [ember-data 5.x Migration Guide](https://guides.emberjs.com/release/upgrading/ember-data/) — RequestManager patterns

### Testing Strategy

For each phase:

1. Run `ember test --filter=""` to get the full test suite baseline
2. Use `ember exam --split=4 --partition=N` for parallel test execution
3. Track test count: currently ~173 test files
4. Set up deprecation workflow to not fail tests on known deprecations (silence per-phase)
