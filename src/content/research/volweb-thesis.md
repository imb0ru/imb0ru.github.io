---
title: 'YARA on VolWeb: my thesis extension, open-sourced'
description: 'My BSc thesis at the University of Bari: a VolWeb extension that natively integrates YARA pattern matching into the Volatility 3 web interface, now open source.'
pubDate: 2025-10-16
draft: false
venue: 'BSc thesis · University of Bari'
tags: ['volweb', 'yara', 'volatility3', 'memory-forensics', 'dfir', 'open-source']
---

> The result of my BSc thesis in Computer Science at the University of Bari: an extension for VolWeb that natively integrates YARA pattern matching into the Volatility 3 web interface.

I'm excited to share the result of my thesis project in Computer Science at the Università degli Studi di Bari: an extension for **VolWeb** (the open-source web interface for Volatility 3) that natively integrates **YARA** pattern matching, enhancing the investigative capabilities of the tool.

## What's new

- **Multiple sources** - rules can come from local files, GitHub repositories, or be written on the fly through an integrated editor; in every case, validation is performed automatically.
- **Hybrid scanning** - supports combining individual rules, full rulesets, or a mix of both, even from different sources.
- **Streamlined architecture** - I removed unnecessary layers such as cloud storage support and authentication systems to keep the tool lightweight, stable, and fully focused on memory forensics.
- **Detailed results** - for each match it shows the triggered YARA rule, the exact matched pattern, the precise offset in the memory dump, and the specific condition that led to the match.

Special thanks to my supervisor Prof.ssa Vita Santa Barletta and the teams at SERLAB and SER&P for their constant support and encouragement.

The code is open source on GitHub: [k1nd0ne/VolWeb](https://github.com/k1nd0ne/VolWeb). The project is open to contributions and discussion, and feedback is crucial to its growth.

---

*Originally posted on [LinkedIn](https://www.linkedin.com/posts/ferrara-marco_github-k1nd0nevolweb-a-centralized-and-activity-7437127233829511168-4l3a?utm_source=share&utm_medium=member_desktop&rcm=ACoAADuO9SgBHQeOf0j1bHjYWNXBgxOvQzwRm_8).*
