# Workplace Price Scanner

Public barcode scanning and price lookup, with local batch entry and GitHub-controlled catalog publishing.

## Add hundreds of products

1. Open the hosted site over HTTPS.
2. Enable **Scan to add products**, then press **Start** and allow camera access.
3. Scan one product. Its barcode fills the form and scanning pauses for entry.
4. Enter its name and price, plus optional department, location, note, and image path.
5. Press **Save draft & next** and scan the next product. Department and location stay filled for products on the same shelf.
6. Use **Saved drafts** to edit or remove entries. Leading zeros in barcodes are preserved.
7. Regularly press **Back up drafts** to save product-drafts.json. **Restore draft backup** combines backups with current drafts; conflicting details are rejected.
8. Press **Download updated items.json**. This refreshes the deployed catalog and combines it with your saved drafts. Existing products are preserved; conflicting barcodes block export rather than overwrite published data.
9. Sign in to GitHub as **2handzxd**, follow **Upload catalog on GitHub**, upload the downloaded file as items.json at the repository root, and commit.
10. Wait for the Pages deployment, then reload the scanner.

Drafts are stored in this browser on this device, not in GitHub. Browser data clearing, private browsing, or changing device can lose drafts. If browser storage fails, entries remain only in the current tab and the site tells you to download a backup. Downloading does not delete drafts or publish them. Avoid simultaneous editing in multiple tabs.

The download merges against the latest deployed catalog; confirm no newer catalog commits are awaiting deployment and review the GitHub diff before publishing. Existing product edits use GitHub's catalog editor. Draft conflicts can be removed or corrected from Saved drafts.

## Owner-only publishing

**2handzxd** is the repository owner and intended sole publisher. GitHub enforces repository permissions on uploads and commits. Keep the repository collaborator list empty if only the owner should have write access:

https://github.com/2handzxd/workplace-price-scanner/settings/access

The site does not authenticate local drafting: anyone can make drafts on their own browser. Those drafts cannot change the shared catalog. Forks and proposed pull requests do not update this repository until an authorized maintainer merges them. Do not grant other accounts write/admin access or share a personal access token.

Changing GitHub collaborator permissions requires the owner's authenticated GitHub settings; code changes alone do not remove existing collaborators.

## Camera setup

### iPhone Safari

Open the HTTPS site directly in Safari. Press Start and allow camera permission. Use Back Camera or choose a named camera after permission is granted. Video uses muted inline autoplay, and camera access requests video only. If blocked, allow camera access for the site in Safari settings and retry. After switching apps or locking the phone, press Start again.

### Laptops

Press Start, allow camera access, then choose the named built-in webcam or USB camera from the camera selector. The app enumerates devices after permission. Front / laptop camera is also available as a preference. Unsupported camera constraints fall back to the browser's default camera. Close other camera apps when the device is busy.

Focus and flashlight are offered only when the camera reports support. Not all webcams focus on small product barcodes; try better lighting, hold the label steady, or use a keyboard scanner.

Camera compatibility paths have automated checks; physical iPhone Safari and laptop camera validation must still be done on actual devices.

## Dedicated barcode scanners

A USB HID keyboard scanner works with laptops; a Bluetooth HID model with documented iOS support can work with iPhones. Configure an Enter suffix. Focus the Barcode / SKU field in the batch form before scanning. No scanner SDK or camera permission is required for keyboard input.

## Product format

items.json is an array of objects:
- barcode: unique string, including leading zeros
- name: non-empty product name
- price: non-negative number
- department, location, note: descriptive strings
- image: optional relative path, such as images/product.jpg

Upload product images separately into images/. The app does not upload camera photos.

## Authentication and data flow

The browser fetches index.html, catalog-draft.js, items.json, product images, and ZXing 0.21.3 from unpkg. Search and camera decoding run locally. Drafts contain product data and live in localStorage. Export creates a temporary Blob download URL and then revokes it.

There are no passwords, API keys, OAuth tokens, or application sessions in this app. Catalog publication happens on GitHub's own site. Never put GitHub credentials into JavaScript, HTML, or JSON. The catalog remains public.

## Verify

With Node.js installed:

    node tests/scanner.test.cjs

Tests cover a 500-product merge, validation and conflicts, entry locking, persistence, backup import, export, video settings, device selection, constraint fallback, async decoder failures, and canceled camera requests.
