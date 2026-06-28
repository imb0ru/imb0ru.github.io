---
title: 'NFZ'
description: 'A seized DJI Mavic 3 microSD card with deleted photos. The flag survives in the EXIF thumbnail of a partially overwritten JPEG.'
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'forensics'
difficulty: 'medium'
flagFormat: 'mntcrl{...}'
tags: ['forensics', 'drone', 'dji', 'exfat', 'file-carving', 'exif']
---

> A drone operator was caught flying near a restricted airspace perimeter. The microSD card from his DJI Mavic 3 was seized. He claims he was just taking landscape photos, but the analyst noticed the storage media has more to say than what's on the surface.

## Overview

The challenge provides a 2 GB forensic image of a microSD card extracted from a DJI Mavic 3:

- `sdcard.img` (compressed as `sdcard.img.gz`, ~7 MB)

The image contains an exFAT filesystem with the standard DJI directory structure (`DCIM/100MEDIA/` with aerial photos plus a binary `.DAT` flight log).

Several photos have been **deleted and partially overwritten**. One of them carries the flag, hidden as **a rendered text image inside the EXIF ThumbnailImage** field, surviving the partial overwrite because the EXIF block lives at the head of the JPEG file.

## Step 1 Initial reconnaissance

Decompress and mount the image:

```bash
gunzip sdcard.img.gz
mkdir mnt
sudo losetup /dev/loop0 sdcard.img
sudo mount.exfat-fuse /dev/loop0 mnt -o ro
ls mnt/DCIM/100MEDIA/
```

You see 27 photos numbered `DJI_0001.JPG` through `DJI_0031.JPG`, but with gaps: numbers 6, 17, 19, 25 are missing. The numbering of DJI files is monotonically incrementing on a real camera, so missing numbers suggest deletions, not files never taken.

The naive grep fails:

```bash
strings sdcard.img | grep -i mntcrl
```

Nothing. The flag isn't a contiguous ASCII string anywhere.

## Step 2 Enumerate deleted files with The Sleuth Kit

```bash
fls -o 0 -r sdcard.img | grep "r/r \*"
```

Output:

```
++ r/r * 4114:    DJI_0006.JPG
++ r/r * 4147:    DJI_0017.JPG
++ r/r * 4153:    DJI_0019.JPG
++ r/r * 4171:    DJI_0025.JPG
```

Four deleted files, marked with `*`. The inode numbers vary depending on the build environment, extract them dynamically. Now recover each one:

## Step 3 Recover each deleted file

```bash
mkdir recovered
fls -o 0 -r sdcard.img | grep "r/r \*" | grep -oE "\* [0-9]+:" | grep -oE "[0-9]+" | while read inode; do
    fname=$(fls -o 0 -r sdcard.img | grep " ${inode}:" | awk '{print $NF}')
    icat -o 0 sdcard.img $inode > recovered/${inode}_${fname}
    echo "  recovered inode $inode -> $fname ($(stat -c %s recovered/${inode}_${fname}) bytes)"
done
```

Output:

```
  recovered inode 4114 -> DJI_0006.JPG (251684 bytes)
  recovered inode 4147 -> DJI_0017.JPG (175059 bytes)
  recovered inode 4153 -> DJI_0019.JPG (101780 bytes)
  recovered inode 4171 -> DJI_0025.JPG (251702 bytes)
```

All four files have been partially overwritten, opening any as an image fails:

```bash
file recovered/*
# all: JPEG image data... (but viewers refuse to display them)
```

The decoder crashes on garbage data after a certain point. **This is the signature of a JPEG whose tail has been overwritten while the head survived.**

## Step 4 The head of a JPEG contains EXIF and thumbnail

A JPEG file structure starts with:

```
FFD8           SOI
FFE0 ...       APP0 (JFIF marker)
FFE1 ...       APP1 (EXIF block - often contains an embedded thumbnail JPEG)
FFDB ...       DQT
FFC0 ...       SOF0
...
FFDA ...       SOS (start of image scan data)
[encoded pixels]
FFD9           EOI
```

The EXIF block (APP1) is at the head of the file. If the head is intact, `exiftool` reads the metadata regardless of how broken the rest of the file is. Try it on any of the recovered files:

```bash
exiftool recovered/4147_DJI_0017.JPG   # use the inode from your fls output
```

Output:

```
Make                            : DJI
Camera Model Name               : FC3582
DateTime Original               : 2024:06:12 10:30:00
GPS Latitude                    : 41 deg 6' 30.0" N
GPS Longitude                   : 16 deg 52' 58.0" E
...
Thumbnail Image                 : (Binary data 18949 bytes, use -b option to extract)
```

Compare the `ThumbnailImage` sizes for all four recovered files:

```bash
for f in recovered/*; do
    size=$(exiftool -b -ThumbnailImage "$f" 2>/dev/null | wc -c)
    echo "$(basename $f): thumbnail $size bytes"
done
```

Output:

```
4114_DJI_0006.JPG: thumbnail 1864 bytes
4147_DJI_0017.JPG: thumbnail 18949 bytes    <-- anomalous
4153_DJI_0019.JPG: thumbnail 1851 bytes
4171_DJI_0025.JPG: thumbnail 1843 bytes
```

The thumbnail of `DJI_0017.JPG` is roughly **10x larger** than the others. Standard DJI thumbnails (160x90 downscaled aerial views) are 1-5 KB. An 18 KB thumbnail at 800x200 is suspicious, it contains something different.

## Step 5 Extract the anomalous thumbnail

```bash
# Use the inode number from your fls output
INODE=$(fls -o 0 -r sdcard.img | grep "r/r \*" | grep "DJI_0017" | grep -oE "\* [0-9]+:" | grep -oE "[0-9]+")
exiftool -b -ThumbnailImage recovered/${INODE}_DJI_0017.JPG > flag_thumb.jpg
file flag_thumb.jpg
# JPEG image data, baseline, precision 8, 800x200, components 3
```

The thumbnail is 800x200, an unusual aspect ratio that doesn't match the main image (1920x1080). Open it:

```bash
xdg-open flag_thumb.jpg
```

The image displays the flag rendered as text on a dark background:

**Flag:** `mntcrl{un4uth0r1z3d_fl1gh7}`
