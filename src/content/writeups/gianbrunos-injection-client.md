---
title: "Gianbruno's Injection Client"
description: "Bhackari CTF: the Titan Launcher on Gianbruno's disk is a red herring. The real Minecraft injection client is xproc64.exe hiding in System32. Part 1 reads the flag from its PE version info; Part 2 reverses the Rust binary to recover the XOR/AES-protected payload it injects."
pubDate: 2026-06-02
ctf: 'Bhackari CTF 2026'
category: 'Forensics'
difficulty: 'medium'
tags: ['forensics', 'reversing', 'rust', 'ntfs', 'pe', 'aes', 'xor', 'sha256', 'minecraft']
---

> *"He has always bragged about having ~~forked~~ developed his own custom client, but nobody ever saw it. We are sure he hid it somewhere on his computer to make sure nobody could find it, but little does he know... some traces are still noticeable."*

The strikethrough on "forked" is the key hint: Gianbruno claimed to have *developed* a custom Minecraft injection client, but he actually just *forked* one. The challenge comes in two parts:

- **Part 1** asks where he hid the binary and recovers a flag from its metadata.
- **Part 2** asks what the client actually injects into Minecraft, beyond the visible cheats.

## Environment setup

The disk is provided as a VMDK/OVA file. To mount it on Kali Linux:

```bash
sudo modprobe nbd
sudo qemu-nbd --connect=/dev/nbd0 GianbrunoPC-disk001.vmdk

sudo mount -t ntfs-3g /dev/nbd0p1 /home/kali/gianbruno/mnt \
  -o streams_interface=windows,ro
```

Disk layout:

```
Device      Boot  Start       End   Sectors   Size  Type
/dev/nbd0p1 *      2048  75759615  75757568  36.1G  NTFS
```

The disk contains a single NTFS partition. Autopsy shows three "volumes" but two are unallocated areas (pre- and post-partition gaps).

## The red herring: Titan Launcher

Standard forensic analysis surfaces several artifacts that all point at the wrong binary.

On the Desktop is a file named `Minecraft Launcher.exe`, disguised as the official Mojang launcher. Binary analysis reveals it is the **Titan Launcher** (an unofficial cracked Minecraft launcher) with an embedded injection framework called **Fyre**.

```bash
file "Minecraft Launcher.exe"
# PE32+ executable (GUI), with an embedded JAR

binwalk "Minecraft Launcher.exe"
# JAR starts at offset 75264

dd if="Minecraft Launcher.exe" of=ml.jar bs=1 skip=75264
unzip ml.jar "net/titanindex/fyre/*" -d /tmp/fyre_src/
```

The namespace `net/titanindex/fyre` contains an injection framework, and Firefox history confirms the launcher was downloaded from `titan.mythicmc.org`. The `servers.dat` file even lists the competition server `mc.odioIbhackar.it` (`bhackaricraft`), and the game log shows a `fly_one_cm` statistic consistent with cheating.

All of this is a distraction. The Titan Launcher is not the custom client, and there is no flag inside it. A second binary in the Temp folder, `temp_1777585795_msvcp130_1.dll`, looks suspicious too but turns out to be a normal JVM runtime dependency.

## The real client: `xproc64.exe`

The actual injection client is `xproc64.exe`, sitting in `C:\Windows\System32`. The anomaly that gives it away: it lives among Microsoft system binaries, yet it carries no Microsoft Corporation signature. The name "xproc" stands for *cross-process*, describing a process injection tool, and the binary itself is written in Rust.

```
xproc64.exe: PE32+ executable (console) x86-64, Rust binary
```

## Part 1: Flag in the PE version info

Instead of opening the file Properties dialog in Windows, we parsed the PE directly on Kali and dumped the UTF-16LE strings from its resource section. The flag is stored in the `LegalCopyright` field of the `VS_VERSION_INFO` resource.

```python
import struct, re

data = open('/home/kali/gianbruno/mnt/Windows/System32/xproc64.exe', 'rb').read()

pe   = struct.unpack('<I', data[0x3c:0x40])[0]   # PE header offset (from DOS header)
nsec = struct.unpack('<H', data[pe+6:pe+8])[0]   # number of sections
opt  = struct.unpack('<H', data[pe+20:pe+22])[0] # size of optional header
so   = pe + 24 + opt                             # start of the section table

secs = {}
for i in range(nsec):
    s = data[so + i*40 : so + i*40 + 40]
    name  = s[:8].rstrip(b'\x00').decode('latin1')
    raddr = struct.unpack('<I', s[20:24])[0]     # PointerToRawData
    rsize = struct.unpack('<I', s[16:20])[0]     # SizeOfRawData
    secs[name] = (raddr, rsize)

off, size = secs['.rsrc']
blob = data[off:off+size]

# UTF-16LE strings: an ASCII byte followed by a null byte, repeated
for w in re.findall(rb'(?:[\x20-\x7e]\x00){3,}', blob):
    print(w.decode('utf-16-le'))
```

How it works step by step:

1. Read the PE header offset from the four bytes at `0x3c` in the DOS header.
2. From the COFF header, read the number of sections (offset `+6`) and the size of the optional header (offset `+20`) to compute where the section table begins.
3. Walk all sections (40 bytes each) until `.rsrc` is found, reading its `PointerToRawData` and `SizeOfRawData`.
4. On that raw resource blob, match every UTF-16LE string with the regex `(?:[\x20-\x7e]\x00){3,}`.

Among the `VERSIONINFO` entries, the `LegalCopyright` field contains the flag:

```
bhackariCTF{y3s_5ys7em32_1s_7h3_p3rf3c7_h1d1ng_sp07}
```

**Part 1 flag:** `bhackariCTF{y3s_5ys7em32_1s_7h3_p3rf3c7_h1d1ng_sp07}`

## Part 2: Reversing the injected payload

Part 1 only read the binary's metadata. Part 2 asks what the client injects into Minecraft beyond the visible cheat modules.

The intended solution is to run the client as administrator, let it inject into `javaw.exe`, and scan the game's process memory (for example with Process Hacker) for the hidden payload. We took the static route instead and reversed the binary to recover the same payload offline, without ever executing it.

### Step 1 - XOR key derivation

Static analysis reveals a string decoder at `0x140008431` that rebuilds two XOR-obfuscated strings at runtime. The 4-byte XOR key is the first four bytes of the SHA256 of the string `"de c0 ad de"`:

```python
import hashlib

key = hashlib.sha256(b"de c0 ad de").digest()[:4]
# 70 da dd bf
```

### Step 2 - Decoding the obfuscated strings

Applying the XOR key `70 da dd bf` to the two embedded blobs yields the host and path of a GitHub raw URL:

```
raw.githubusercontent.com
/gianbruno-sys/8j2a05ty8h2r/refs/heads/main/a8ed3b145c0a
```

Full URL:

```
https://raw.githubusercontent.com/gianbruno-sys/8j2a05ty8h2r/refs/heads/main/a8ed3b145c0a
```

This is where Gianbruno hosts the payload his client fetches and injects, the fork he claimed to have written himself.

### Step 3 - AES key reconstruction

At `0x14000b772`, the binary rebuilds a 16-byte AES key by XOR-ing a set of embedded bytes with the fixed constant `0xa0`:

```
AES-128 key: a26d77d87e71b127[...]
```

### Step 4 - Fetching and decrypting the payload

The cryptographic routine at `0x140006d7d` uses AES key expansion helpers (`aeskeygenassist`, `aesimc`), confirming **AES-128-ECB**, with **PKCS#7** padding on the decrypted output. The GitHub blob is 48 bytes long, exactly three AES blocks:

```python
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

url = "https://raw.githubusercontent.com/gianbruno-sys/8j2a05ty8h2r/refs/heads/main/a8ed3b145c0a"
payload = requests.get(url).content          # 48 bytes

key = bytes.fromhex("a26d77d87e71b127...")    # 16-byte key from step 3
cipher = AES.new(key, AES.MODE_ECB)

plaintext = unpad(cipher.decrypt(payload), 16)
print(plaintext.decode())
```

Decrypted output:

```
bhackariCTF{y0_ch47_1s_7hi5_p4yl04d_d4ng3r0u5?}
```

**Part 2 flag:** `bhackariCTF{y0_ch47_1s_7hi5_p4yl04d_d4ng3r0u5?}`


## Notes

- The Titan Launcher, the embedded Fyre framework, and the Temp DLL are all distractions. The real client is the unsigned `xproc64.exe` hidden in plain sight inside `System32`.
- Part 2 layers two independent protections: a simple XOR to hide the GitHub URL and AES-128-ECB to protect the payload retrieved from it. Both must be reversed to recover the flag statically.
- Using GitHub raw content as a delivery channel for an encrypted payload is a realistic pattern: the traffic blends in with ordinary developer activity and avoids hardcoding the payload in the binary.
- The intended path for Part 2 (running the injector and dumping `javaw.exe` memory with Process Hacker) reaches the same flag dynamically. Static reversing is more work but never executes potentially harmful code.
