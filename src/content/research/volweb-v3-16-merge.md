---
title: 'VolWeb v3.16.0: my thesis fork merged into the official project'
description: "After open-sourcing my VolWeb fork, the whole thing was merged into the official repository and shipped in the v3.16.0 release. I'm now an official contributor to the project."
pubDate: 2026-03-10
draft: false
venue: 'VolWeb · open source'
tags: ['volweb', 'yara', 'volatility3', 'memory-forensics', 'dfir', 'open-source']
---

> A big milestone for my thesis project and open-source journey: the whole fork was merged into the official VolWeb repository and shipped in the v3.16.0 release.

## The merge

A few months ago I announced my open-source fork of **VolWeb**, a web platform for memory analysis. Since then I kept iterating: adding features, refactoring, fixing edge cases. Now all of that work has been **merged into the official VolWeb repository**, and not as a small change: it is a massive, multi-feature pull request that deeply evolves how VolWeb works, both technically and from a UX point of view. From now on I'm also an official contributor to the project.

What this PR brings to VolWeb:

- Full YARA engine integration
- New plugin selection workflow
- Extraction lifecycle controls
- Smart re-execution and failure handling
- Fine-grained authorization and access control
- UX and UI improvements
- Infrastructure and performance optimizations
- Real-time updates via WebSockets

It touches backend, frontend, infrastructure, and UX in a single, coherent effort, and is one of the most substantial contributions to VolWeb so far.

- PR #42: [github.com/k1nd0ne/VolWeb/pull/42](https://github.com/k1nd0ne/VolWeb/pull/42)
- Repository: [github.com/k1nd0ne/VolWeb](https://github.com/k1nd0ne/VolWeb)

## It's live: v3.16.0

The official release is out. **VolWeb v3.16.0** ships everything from that PR: the full YARA engine integration, the plugin selection workflow, extraction lifecycle controls (pause / resume / stop), smart re-execution and failure tracking, fine-grained authorization, UX and performance improvements, and real-time updates via WebSockets.

If you work in memory forensics, incident response, or malware analysis, this release is worth checking out: [github.com/k1nd0ne/VolWeb](https://github.com/k1nd0ne/VolWeb).

---

*Originally posted on [LinkedIn](https://www.linkedin.com/posts/ferrara-marco_release-volweb-v3160-k1nd0nevolweb-activity-7441033357150351360-BtI0?utm_source=share&utm_medium=member_desktop&rcm=ACoAADuO9SgBHQeOf0j1bHjYWNXBgxOvQzwRm_8).*
