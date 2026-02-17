# Draft: Reply to James Rasell

> **Context:** James asked about a Jira issue for the Ember upgrade, timeframe, and noted beta.1 targets March 18 and rc.1 April 2.

---

Hey James — good question. I'll get a Jira issue created for this shortly.

For timeframe: I've been working through a phased approach. The first phase (Phase 0) is all backward-compatible pre-work that runs on our current Ember 3.28 — things like removing deprecated patterns, cleaning up unused addons, and making ember-data relationships explicit. These are safe to land on `main` right now and don't carry any risk for the upcoming release.

I'm aiming to get as much of Phase 0 landed before rc.1 (April 2). One PR is already pushed and ready for review (dynamic component invocations).

The actual version bump to Ember 4.12 LTS (Phase 1) is a separate milestone that I'd target for the next release cycle — it touches too many things to squeeze into this one safely.

I'll link the Jira issue once it's up.

---

**TODO before sending:**

- [ ] Create Jira issue and add link
- [ ] Adjust tone/details as needed
- [ ] Confirm which Phase 0 PRs are ready to mention
