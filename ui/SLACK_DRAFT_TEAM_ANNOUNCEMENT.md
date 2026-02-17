# Draft: Team Announcement — Ember Upgrade Plan

> **Context:** Channel announcement introducing the phased Ember upgrade approach. Keep it high-level — benefits and what to expect, not implementation details.

---

**Ember Upgrade — Phased Approach**

I've been working on a plan to upgrade the Nomad UI from Ember 3.28 to 4.12 LTS (and eventually 5.x+). Wanted to share the approach and what to expect.

**Why this matters:**

- Security: Ember 3.28 is out of LTS support — no more security patches
- Performance: Ember 4.12+ unlocks tree-shaking, faster builds, and smaller bundles
- Developer experience: Modern patterns (native classes, tracked properties, Glimmer components) are cleaner and easier to work with
- Future-proofing: Opens the path to Embroider/Vite for significantly faster build times

**The approach:**
We're doing this in phases to keep risk low:

1. **Phase 0 (now):** Pre-work that's fully backward-compatible with 3.28. Removes deprecated patterns, cleans up unused dependencies, and modernizes code — all safe to land on `main` today. Several PRs are already in progress.

2. **Phase 1 (next cycle):** The actual version bump to Ember 4.12 LTS. By the time we get here, Phase 0 will have eliminated all breaking changes, so this should be a clean upgrade.

3. **Phase 2+:** Deprecation cleanup and further upgrades to 5.x, done incrementally.

**What this means for you:**

- Phase 0 PRs will start coming through for review — they're individually small and low-risk
- No breaking changes to the UI during this release cycle
- If you see deprecated pattern warnings in the console, that's expected and being tracked

Happy to answer any questions about the plan or the specific changes.

---

**TODO before sending:**

- [ ] Decide which channel to post in
- [ ] Link to Jira issue once created
- [ ] Adjust tone for audience (eng-wide vs. team-specific)
- [ ] Consider whether to link the full plan doc or keep it internal
