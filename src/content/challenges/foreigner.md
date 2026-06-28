---
title: 'Foreigner'
description: 'Geolocate a deceptively ordinary parking-lot photo. The title is the clue: an Italian goes abroad without ever boarding a plane.'
pubDate: 2026-06-28
draft: false
event: 'Mntcrl CTF 2026'
category: 'osint'
difficulty: 'easy'
flagFormat: 'mntcrl{xx.xxxxx,yy.yyyyy}'
tags: ['osint', 'geolocation', 'image']
---

> I went abroad without boarding a plane. Somewhere in this picture lies the answer. Can you pinpoint the exact location?

## Overview

The challenge provides a single image, `foreigner.jpg`. At first glance, it appears to be an ordinary parking lot photo.

The title, **Foreigner**, is the main clue. The objective is to determine the exact location where the image was taken and recover the coordinates of the pole visible in the picture.

## Step 1 Interpret the title

The challenge description is the real hint: *"I went abroad without boarding a plane."* The key word is **without a plane**, the destination is a foreign country reachable overland from Italy, by train or by car, with no flight involved. That rules out distant destinations and points to somewhere just across a border or to one of the enclaves embedded inside Italy itself, close enough to drive or take a train to.

For an Italian player, the most likely nearby foreign locations reachable without flying are:

- Vatican City
- San Marino
- Border regions such as Slovenia, Austria, or Switzerland

The image shows rocky elevated terrain, tourist parking infrastructure, panoramic roadside positioning, and dense vegetation. These are highly consistent with the roads surrounding San Marino's historic center, and the challenge title fits perfectly: crossing into **San Marino** technically places an Italian abroad while requiring only a short trip.

## Step 2 Use the restaurant as the geolocation anchor

Knowing the country is San Marino is not enough: the whole republic is far too large to pinpoint a single pole. The next step is to scan the photo for a fixed, searchable landmark that can tie it to one specific spot.

The most distinctive visual clue is the building in the background displaying multiple national flags, paired with the gazebos and parasols of its outdoor dining area, the kind of detail a tourist-oriented venue advertises online. Combining the now-known location with these features gives a targeted search:

```text
San Marino restaurant flags
```

Comparing the results against the photo identifies the structure as **Ristorante Pizzeria Bar Cacciatori**. This anchors the image to a precise area, narrowing the search space to the parking lot facing the restaurant.

## Step 3 Refine to the exact pole

The restaurant only provides the approximate area. To recover the flag, the exact position of the pole visible in the foreground must be identified.

Street View is **not** the right tool here: the pole sits in a parking lot off the main road, where Street View coverage either does not reach or does not frame it usefully, so it cannot be used to read off the precise coordinates. The correct approach is the **satellite imagery layer with the globe (3D) rendering enabled**, which shows the parking lot from above with enough detail to pick out individual poles and match the photo's geometry. With this view, several details can be aligned:

- Relative angle between the restaurant and parking rows
- Pole placement
- Nearby vegetation
- Parking line orientation
- Rock wall geometry

By aligning these features on the satellite/globe view, the pole is pinpointed. The coordinates are then read by copying them directly from Google Maps and **truncating each value to the 5th decimal place** to match the flag format:

```text
43.93297, 12.44834
```

## Step 4 Construct the flag

The challenge specifies the format `mntcrl{xx.xxxxxxx,yy.yyyyyyy}`. Substituting the recovered coordinates:

**Flag:** `mntcrl{43.93297,12.44834}`
