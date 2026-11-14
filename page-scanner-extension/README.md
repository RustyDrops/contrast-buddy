# Contrast Buddy Page Scanner

An optional Chrome/Edge Manifest V3 companion for scanning visible webpage text. It uses only `activeTab` and `scripting`: the page is inspected only after the user opens the extension and chooses **Scan this page**. It does not save or send page content or screenshots.

## Load the unpacked extension

1. Open the browser's extensions page and enable developer mode.
2. Choose **Load unpacked** and select this `page-scanner-extension` folder.
3. Open a regular `http` or `https` webpage, select the extension, and choose **Scan this page**.

The scan covers the visible viewport and the main frame. It reads rendered text, computed text/background colors, font size/weight, and background-image/gradient styles. It captures the visible viewport locally so image/gradient backgrounds can be sampled at points inside each text element's bounds. Screenshot samples are approximate; they may miss small contrast failures and are never presented as a conformance pass. Review image, gradient, transparent, filtered, and blended backgrounds manually.

The extension does not scan content outside the visible viewport, embedded cross-origin frames, browser UI, or pages where browser extension injection is restricted. It does not make network requests, retain results, or modify the page.
