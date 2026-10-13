# Workplace Price Scanner

Public barcode scanning and price lookup, with catalog updates handled through GitHub.

## Use the scanner

Open the hosted index.html over HTTPS (or localhost for development). Manual lookup works without camera access. Click Start and allow camera permission to scan. Camera support, focus, and flashlight availability depend on your browser and device.

The app loads items.json once per page load. Reload after catalog changes have been deployed.

## Update the catalog

Click **Edit catalog on GitHub**. GitHub handles sign-in and repository permissions. An account with write access can commit changes; other accounts may be offered a fork/pull-request workflow, which requires maintainer approval before changing this repository.

Edit items.json as a JSON array. Each product uses:
- barcode: a unique string (preserve leading zeros)
- name: product name
- department: category
- price: a number
- location and note: optional descriptive strings
- image: optional relative image path under images/

Validate JSON before committing. Upload new product images into images/ and reference their paths. Changes appear after the hosting deployment completes.

## Authentication and data flow

1. The browser loads index.html and ZXing 0.21.3 from unpkg.
2. It fetches ./items.json without an application authorization header.
3. Searches and barcode decoding run in browser memory. Product images are fetched when displayed.
4. Catalog editing opens GitHub in a separate tab. GitHub authenticates the editor and enforces write permissions.

This app has no passwords, API keys, OAuth callbacks, access/refresh tokens, or application sessions. Do not put GitHub tokens or secrets into HTML, JavaScript, or items.json. GitHub credentials remain in GitHub's own sign-in flow.

The catalog is public. The app provides no in-browser save endpoint or local export editor. GitHub is the authority for shared catalog updates.

## Verification

With Node.js installed, run:

    node tests/scanner.test.cjs

Tests cover public catalog loading, lookup, camera failure cleanup, camera stopping, and the GitHub editing link.
