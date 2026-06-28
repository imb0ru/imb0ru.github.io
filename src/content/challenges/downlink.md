---
title: 'Downlink'
description: 'An SDR-captured RF recording hides MAVLink2 drone telemetry. Demodulate the FSK/Manchester signal and reassemble the flag from chunked STATUSTEXT messages.'
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'forensics'
difficulty: 'hard'
flagFormat: 'mntcrl{...}'
tags: ['forensics', 'sdr', 'rf', 'mavlink', 'dsp', 'drone']
---

> An SDR operator captured this radio transmission while monitoring suspicious activity. We believe a drone was transmitting something it shouldn't have. Find out what.

## Overview

The challenge provides a single audio file:

- `downlink.wav` 60 seconds, 48 kHz mono, 16-bit PCM (~5.5 MB)

The recording is an SDR-captured RF signal, baseband-demodulated to audio. The first 5 seconds contain only noise, then a complex multi-band signal appears. Within the noise are encoded MAVLink telemetry messages, and among them ten chunks of a fragmented STATUSTEXT carry the flag.

The challenge requires recognizing FSK modulation among decoy spectral components, demodulating it correctly (including a Manchester layer), parsing MAVLink2 frames from the raw byte stream, and reassembling the flag from chunked STATUSTEXT messages.

## Step 1 Initial inspection

```bash
file downlink.wav
# RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 48000 Hz
```

The flag is not stored as text. Open the file in Audacity or `inspectrum` to look at the spectrogram:

```bash
audacity downlink.wav
# or:
inspectrum -r 48000 downlink.wav
```

The spectrogram shows several distinct frequency bands active between 5 and 50 seconds:

- A slow sinusoidal sweep around 2 kHz
- A noisy band around 5-7 kHz that looks like FSK
- A bright pair of bands around 10 and 14 kHz
- A continuous tone at ~18 kHz

The 5-7 kHz band looks like FSK but is random noise (decoy). The real FSK is at 10/14 kHz, observable because the two bands switch in a structured way (not random) and last for the entire signal duration.

## Step 2 Identify FSK parameters

Measure on the spectrogram:

- **Carrier frequencies**: 10 kHz (low) and 14 kHz (high) - FSK deviation 4 kHz
- **Symbol rate**: look at the shortest stable interval at one frequency. With careful inspection, the shortest symbols last ~70 us, suggesting ~14400 symbols/s. This is not a typical baud rate, most likely **half** of the data is encoded (Manchester) at 7200 baud.

Two clues converge:

1. 14400 symbols/s is double the common 7200 baud, Manchester suspected
2. Counting bits per second in a known long preamble pattern confirms 7200 baud (after Manchester decode)

## Step 3 Demodulate FSK

A clean approach uses a bandpass filter around the FSK band (8-16 kHz) to suppress out-of-band noise, then computes energy at each FSK frequency per bit window:

```python
import math
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, filtfilt

SR, samples = wavfile.read("downlink.wav")
samples = samples.astype(np.float32) / 32768.0

# Skip 5s of initial noise
samples = samples[int(5 * SR):]

# Bandpass 8-16 kHz around the FSK band
nyq = SR / 2
b, a = butter(6, [8000/nyq, 16000/nyq], btype='band')
samples = filtfilt(b, a, samples)

# Demodulate FSK at 7200 baud
BAUD = 7200
F_LOW, F_HIGH = 10000, 14000
samples_per_bit = SR / BAUD
n_bits = int(len(samples) / samples_per_bit)

bits = []
for i in range(n_bits):
    start = int(i * samples_per_bit)
    end = int((i + 1) * samples_per_bit)
    win = samples[start:end]
    if len(win) < 2:
        break
    t_arr = np.arange(len(win)) / SR
    e_low = abs(np.sum(win * np.exp(-2j * math.pi * F_LOW * t_arr)))
    e_high = abs(np.sum(win * np.exp(-2j * math.pi * F_HIGH * t_arr)))
    bits.append(1 if e_high > e_low else 0)
```

## Step 4 Manchester decode

Each data bit is encoded as a pair: bit 0: `01`, bit 1: `10`. To decode, try both phase alignments (0 or 1 offset) and pick the one with fewer Manchester violations:

```python
def manchester_decode(bits):
    def decode(off):
        out, errs = [], 0
        i = off
        while i + 1 < len(bits):
            a, b = bits[i], bits[i+1]
            if (a, b) == (0, 1):
                out.append(0)
            elif (a, b) == (1, 0):
                out.append(1)
            else:
                errs += 1
                if errs > 50:
                    break
            i += 2
        return out, errs

    b0, e0 = decode(0)
    b1, e1 = decode(1)
    return b0 if len(b0) > len(b1) else b1

data_bits = manchester_decode(bits)
```

## Step 5 Pack into bytes and find MAVLink2 frames

The recovered bytestream is a sequence of raw MAVLink2 frames. MAVLink2 messages start with magic byte `0xFD`:

```python
def bits_to_bytes(bits):
    out = bytearray()
    for i in range(0, len(bits) - 7, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | bits[i + j]
        out.append(byte)
    return bytes(out)

data = bits_to_bytes(data_bits)
print(f"{len(data)} bytes, {data.count(0xFD)} MAVLink2 magic bytes")
```

A healthy demodulation gives ~20000 bytes with ~600 `0xFD` markers.

## Step 6 Parse MAVLink with pymavlink

```python
import os
os.environ['MAVLINK20'] = '1'
import io
from pymavlink import mavutil

mav = mavutil.mavlink.MAVLink(io.BytesIO())
mav.robust_parsing = True

statustext_msgs = []
for byte in data:
    try:
        msg = mav.parse_char(bytes([byte]))
        if msg and msg.get_type() == 'STATUSTEXT':
            statustext_msgs.append(msg)
    except Exception:
        continue

print(f"Parsed {len(statustext_msgs)} STATUSTEXT messages")
```

~70 messages parsed. Before filtering, inspect what they actually contain:

```python
from collections import Counter

severity_names = {
    0: 'EMERGENCY', 1: 'ALERT', 2: 'CRITICAL', 3: 'ERROR',
    4: 'WARNING', 5: 'NOTICE', 6: 'INFO', 7: 'DEBUG'
}

severity_counts = Counter(msg.severity for msg in statustext_msgs)
for sev in sorted(severity_counts):
    name = severity_names.get(sev, f'sev={sev}')
    print(f"  severity {sev} ({name}): {severity_counts[sev]} messages")
```

Output:

```
  severity 4 (WARNING):  12 messages
  severity 5 (NOTICE):   21 messages
  severity 6 (INFO):     27 messages
  severity 7 (DEBUG):    10 messages
```

DEBUG stands out: a real ArduPilot/PX4 drone in flight almost never emits DEBUG-level STATUSTEXT over the air, those are filtered out in production firmware and logged locally at most. Ten DEBUG messages in a 60-second capture is anomalous.

Inspecting them:

```python
for msg in statustext_msgs:
    if msg.severity == 7:
        text = msg.text if isinstance(msg.text, str) else msg.text.decode('ascii', errors='replace')
        print(f"  id={msg.id:3d}  chunk_seq={msg.chunk_seq}  text={text.rstrip(chr(0))!r}")
```

Output:

```
  id= 42  chunk_seq=0  text='mnt'
  id= 42  chunk_seq=1  text='crl'
  id= 42  chunk_seq=2  text='{1n'
  id= 42  chunk_seq=3  text='t3r'
  id= 42  chunk_seq=4  text='c3p'
  id= 42  chunk_seq=5  text='t3d'
  id= 42  chunk_seq=6  text='_t3'
  id= 42  chunk_seq=7  text='l3m'
  id= 42  chunk_seq=8  text='3tr'
  id= 42  chunk_seq=9  text='y}'
```

All 10 share the same `id=42` and have incrementing `chunk_seq`, this is the MAVLink2 STATUSTEXT chunking mechanism for messages longer than 50 bytes. The content is the flag fragmented into 3-character pieces.

## Step 7 Reassemble

```python
chunks = {msg.chunk_seq: msg.text for msg in statustext_msgs
          if msg.severity == 7 and msg.id != 0}

flag = ''.join(
    (chunks[k].decode() if isinstance(chunks[k], bytes) else chunks[k]).rstrip('\x00')
    for k in sorted(chunks)
)
print(flag)
```

**Flag:** `mntcrl{1nt3rc3pt3d_t3l3m3try}`
