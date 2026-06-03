---
title: "Gianbruno's Clicker"
description: "Bhackari CTF forensics on Gianbruno's seized PC: one flag hides in a base64-encoded filename inside the .minecraft folder, the second is painted into the autoclicker GUI bitmap embedded in the PE."
pubDate: 2026-06-02
ctf: 'Bhackari CTF 2026'
category: 'Forensics'
difficulty: 'easy'
tags: ['forensics', 'ntfs', 'prefetch', 'base64', 'pe', 'bitmap', 'minecraft']
---

> Gianbruno swears he never cheated on the Bhackari Minecraft server. His seized PC (a Windows disk image) tells a different story, and two flags hide around his autoclicker.

## Setup

The challenge provides `GianbrunosPC.ova`, a virtual machine image. The VMDK is extracted and mounted read-only via `qemu-nbd`:

```bash
sudo modprobe nbd max_part=16
sudo qemu-nbd --read-only -c /dev/nbd0 ~/gianbruno/GianbrunosPC-disk001.vmdk
sudo mount -o ro,noload /dev/nbd0p1 ~/gianbruno/mnt
```

The user profile is located at `~/gianbruno/mnt/Users/gianbruno/`.

## Part 1 - Flag in the Prefetch

Browsing Gianbruno's `.minecraft` directory reveals a file with an unusually long, base64-encoded name:

```
AppData/Roaming/.minecraft/YmhhY2thcmlDVEZ7d2g0dF80cjNfeTB1X2.QwaW5HXzFuX3RoM19wcjNmM3RjaD99
```

The filename contains a `.` separator, which splits it into two base64-encoded segments. Removing the separator and decoding:

```bash
echo "YmhhY2thcmlDVEZ7d2g0dF80cjNfeTB1X2.QwaW5HXzFuX3RoM19wcjNmM3RjaD99" \
  | tr -d '.' \
  | base64 -d
```

Output:

```
bhackariCTF{wh4t_4r3_y0u_d0inG_1n_th3_pr3f3tch?}
```

The flag is the decoded filename itself. The download origin is also visible in the NTFS Zone.Identifier alternate data stream (ADS) attached to the file, which records a `HostUrl` pointing to a MediaFire download URL whose path component contains the same base64 string, confirming the file was downloaded from the internet.

### Technique summary

- Recognize base64-encoded filenames as a low-effort obfuscation technique
- Strip NTFS-incompatible characters (the `.` used as a segment separator) before decoding
- Cross-reference the Zone.Identifier ADS for download provenance

## Part 2 - Flag in the Embedded Bitmap

The same file decoded in Part 1 is a valid **PE32 executable** (2.3 MB). `file` confirms it:

```
PE32 executable (GUI) Intel 80386, for MS Windows
```

`strings` on the binary reveals the string `Gianbruno's Clicker`, confirming this is the autoclicker program referenced in the challenge title.

### PE resource extraction

The PE file contains a `.rsrc` section. Using a hex editor or PE analysis tools, the section can be located at offset `0xd0600` with a size of `0x173c00`. The section holds a raw Windows **DIB (Device-Independent Bitmap)**, the program's GUI background image.

The DIB header indicates:

- Resolution: **738 x 687 pixels**
- Bit depth: **24 bpp** (true color)
- Format: raw BITMAPINFOHEADER with BGR pixel data, stored bottom-up as per DIB convention

To render it, the raw bytes must be converted to a standard BMP by prepending a BITMAPFILEHEADER (BMP stores rows bottom-up natively, so no manual flip is needed):

```python
import struct

with open("rsrc_section.bin", "rb") as f:
    data = f.read()

# Parse BITMAPINFOHEADER
width  = struct.unpack_from("<i", data, 4)[0]   # 738
height = struct.unpack_from("<i", data, 8)[0]   # 687
bpp    = struct.unpack_from("<H", data, 14)[0]  # 24

header_size = struct.unpack_from("<I", data, 0)[0]  # 40
pixel_data_offset = 14 + header_size

# Build BITMAPFILEHEADER
file_size = 14 + len(data)
file_header = struct.pack("<2sIHHI", b"BM", file_size, 0, 0, pixel_data_offset)

with open("bitmap.bmp", "wb") as f:
    f.write(file_header + data)
```

Opening `bitmap.bmp` in any image viewer reveals the autoclicker GUI. The flag is **written visually at the bottom of the image**.

**Flag:** `bhackariCTF{b1ud_c4n7_3v3n_h1d3_1t}`


### Technique summary

- PE32 static analysis: identify and carve the `.rsrc` section
- Parse a raw DIB (no BITMAPFILEHEADER) by manually prepending the file header
- Account for bottom-up row storage when rendering or converting the bitmap
- Remember that challenge authors sometimes embed flags directly in UI assets (splash screens, bitmaps) to avoid string-based detection
