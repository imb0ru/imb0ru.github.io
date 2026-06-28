---
title: 'Cousin'
description: 'An attachment-less OSINT/CTI chain: from an ESET Botconf 2022 talk to the three TA410 sub-teams and the FlowCloud implant, ending in a SHA1-derived flag.'
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'osint'
difficulty: 'medium'
flagFormat: 'mntcrl{<sha1>}'
tags: ['osint', 'cti', 'apt', 'ta410', 'yara', 'malware']
---

> Between Q2 and Q4 of 2022, public malware sandbox submissions repeatedly triggered a YARA rule contributed earlier that year to a Slovak antivirus vendor's open indicator repository by a Montreal-based malware researcher. The rule targets a modular C++ remote access tool exclusively deployed by one of three sub-teams operating beneath a Chinese-aligned cyberespionage umbrella that the vendor's research team formally disambiguated from a more famous Chinese APT at a French malware conference in almost mid 2022. The flag is the lowercase SHA1 of the following concatenation, with no separators, no whitespace, and no surrounding characters: the codename component shared across all three sub-team names, followed by the integer audio-surveillance activation threshold of the implant in decibels.

## Overview

The challenge provides no attachments. It consists solely of a short English description that anchors on a Slovak antivirus vendor, a French malware conference held in late April 2022, a Montreal-based malware researcher, and a Chinese-aligned cyberespionage umbrella that was formally disambiguated from a more famous Chinese APT cluster.

The objective is to identify the cluster and its implant from public sources alone, and to recover two specific technical facts that combine into the flag. The title, **Cousin**, becomes meaningful only after the cluster is identified.

## Step 1 Identify the vendor and the conference

The description contains three orthogonal identifying constraints that, taken together, point to a single talk:

- *Slovak antivirus vendor* narrows to **ESET** (Bratislava-based)
- *French malware conference, late April 2022* narrows to **Botconf 2022**, held 26-29 April in Nantes
- *Montreal-based malware researcher* narrows to **Alexandre Côté Cyr**, an ESET malware researcher

The Botconf 2022 official schedule lists one ESET talk on a Chinese-aligned cluster on Wednesday 27 April, 14:35-15:05:

```text
TA410: APT10's distant cousin
Alexandre Côté Cyr | Matthieu Faou
```

The title of this talk also explains the challenge name.

## Step 2 Identify the cluster

From the talk title and abstract, the cluster is **TA410**: a Chinese-aligned cyberespionage umbrella that earlier public reporting had conflated with APT10, due to shared TTPs (overlapping VBA macros, use of QuasarRAT, similar lure infrastructure).

ESET's companion WeLiveSecurity post (27 April 2022) formalizes the disambiguation:

```text
https://www.welivesecurity.com/2022/04/27/lookback-ta410-umbrella-cyberespionage-ttps-activity/
```

It establishes TA410 as composed of three sub-teams operating under one umbrella, with distinct toolsets, infrastructure, and victimology.

## Step 3 Identify the three sub-teams

From the Botconf slides and the WeLiveSecurity post, the three sub-teams ESET assigns within the TA410 umbrella are:

```text
FlowingFrog
LookingFrog
JollyFrog
```

The four-letter component shared across all three sub-team names is **`Frog`**. This is the first half of the flag-derivation string.

## Step 4 Identify the implant

The description specifies a *modular C++ remote access tool exclusively deployed by one of the three sub-teams*. From ESET's research:

- **FlowingFrog** operates **FlowCloud**, a complex modular C++ RAT with over 50 custom classes
- **LookingFrog** operates the X4 simple backdoor and the LookBack backdoor (originally described by Proofpoint in 2019)
- **JollyFrog** operates generic tooling (QuasarRAT, Korplug)

FlowCloud is the only modular C++ RAT used exclusively by a single sub-team. It is the implant targeted by the YARA rule referenced in the description.

## Step 5 Recover the audio surveillance threshold

ESET's analysis of the new FlowCloud version highlights an unusual surveillance capability: the implant controls connected microphones and triggers recording automatically when ambient sound exceeds a fixed environmental threshold. The ESET press release (27 April 2022) states verbatim:

```text
"This latter function is triggered automatically by any sound over a
threshold of 65 decibels, which is in the upper range of normal
conversation volume."
```

The Botconf slides confirm this under the *FlowCloud Capabilities* diagram:

```text
>= 65 dB    Rootkit
```

The integer audio surveillance activation threshold is **`65`**. This is the second half of the flag-derivation string.

## Step 6 Construct the flag

The challenge specifies the flag as the lowercase SHA1 of the concatenation, with no separators and no whitespace, of the four-letter shared codename component followed by the integer audio threshold in decibels:

```text
Frog65
```

Hashing:

```bash
$ echo -n "Frog65" | sha1sum
bce05158c0bd94550452fac45f72a661aec7cb26
```

**Flag:** `mntcrl{bce05158c0bd94550452fac45f72a661aec7cb26}`
