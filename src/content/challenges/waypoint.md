---
title: 'Waypoint'
description: "Fifty DJI flight logs from one 'test' afternoon. Overlay every GPS trace and the drone's real message appears written in the sky."
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'misc'
difficulty: 'easy'
flagFormat: 'mntcrl{...}'
tags: ['drone', 'flight-log', 'gps', 'misc']
---

> A pilot says he just did "some tests" on the university campus. The flight logs tell a different story. Recover the message he was trying to send.

## Overview

The challenge provides an archive of ~50 CSV files exported from a DJI Fly app. Each file is a separate flight record with full telemetry: GPS coordinates, altitude, speed, attitude, flight mode.

The pilot claims he was only doing "test flights" on the campus of the Computer Science Department in Bari (DIB), but the sheer number of flights and the timing pattern suggest otherwise.

The objective is to discover what the flights, taken together, were actually doing.

## Step 1 Explore the data

```bash
unzip waypoint.zip
ls DJIFlightRecord_*.csv | wc -l
head -3 DJIFlightRecord_2024-06-12_10-39-07_FRF68D9D9B034131.csv
```

The files contain standard DJI Fly telemetry columns: `flightTime`, `utcTime`, `latitude`, `longitude`, `height`, `speed`, attitude, battery, `flightMode`.

The first peculiarity: ~50 separate flights in a single afternoon. That is not casual testing.

## Step 2 Plot a single flight

A natural first attempt is to plot one flight to see its shape:

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("DJIFlightRecord_2024-06-12_10-39-07_FRF68D9D9B034131.csv")
plt.plot(df['longitude'], df['latitude'])
plt.axis('equal')
plt.show()
```

The trajectory looks vaguely like a letter, but is ambiguous on its own. Some letters take more than one continuous stroke (the pilot landed, repositioned, and took off again to draw the next part).

## Step 3 Overlay all flights

The insight is to plot **every** flight on the same plane:

```python
import pandas as pd
import matplotlib.pyplot as plt
import glob

fig, ax = plt.subplots(figsize=(20, 8))
for fp in sorted(glob.glob("DJIFlightRecord_*.csv")):
    df = pd.read_csv(fp)
    ax.plot(df['longitude'], df['latitude'], '-', linewidth=1, color='black', alpha=0.7)
ax.set_aspect('equal')
plt.savefig("all_flights.png", dpi=150)
```

The flag emerges, written in the sky over the DIB campus:

```
mntcrl{n3v3r_tru5t_4_p1l0t}
```

A small cluster of decoy flights appears off to the side (hovers, orbits, RTH, perimeter checks). They can be quickly identified by their `flightMode` field (`HOVER`, `ORBIT`, `RTH`, etc.) and by their distance from the main flight cluster.

**Flag:** `mntcrl{n3v3r_tru5t_4_p1l0t}`
