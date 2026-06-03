---
title: 'Another VolWeb PR: explicit YARA scan scope selection'
description: 'After the v3.16.0 release I kept working on VolWeb: a new pull request adds explicit YARA scan scope selection (VAD vs Kernel) and fixes the FileScan Dump button.'
pubDate: 2026-05-28
draft: false
venue: 'VolWeb · open source'
tags: ['volweb', 'yara', 'memory-forensics', 'dfir', 'open-source']
---

> Still contributing to VolWeb: a new pull request adds explicit YARA scan scope selection and restores the FileScan "Dump" workflow.

After the big v3.16.0 release, I kept working on the project. A new pull request is now pending on the official repository, and it brings two things.

A **bug fix** for the "Dump" button on FileScan results: a small fix, but it restores an important workflow for extracting artifacts from memory dumps.

And a more substantial feature: **explicit YARA scan scope selection**. The original implementation only targeted the kernel layer, leaving user-space memory entirely out of scope. The fix adds a selector directly in the UI:

- **VAD** (default) - walks every process's VAD tree
- **Kernel** - the original kernel-layer scan

The change is fully backwards-compatible. Waiting for review, with more features on the way.

PR #46: [github.com/k1nd0ne/VolWeb/pull/46](https://github.com/k1nd0ne/VolWeb/pull/46)

---

*Originally posted on [LinkedIn](https://www.linkedin.com/posts/ferrara-marco_fix-dumpfile-address-configuration-to-use-activity-7465791112981626880-1jVw?utm_source=share&utm_medium=member_desktop&rcm=ACoAADuO9SgBHQeOf0j1bHjYWNXBgxOvQzwRm_8).*
