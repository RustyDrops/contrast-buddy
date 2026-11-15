# Contrast Buddy Page Scanner

An optional Chrome/Edge Manifest V3 companion for scanning visible webpage text. `activeTab` and `scripting` let it inspect a page only after the user opens the extension and chooses **Scan this page**; `clipboardWrite` supports the user-triggered copy action. It does not save or send page content or screenshots.

## Load the unpacked extension

1. Open the browser's extensions page and enable developer mode.
2. Choose **Load unpacked** and select this `page-scanner-extension` folder.
3. Open a regular `http` or `https` webpage, select the extension, and choose **Scan this page**.
4. To use detected text colors in Contrast Buddy, select **Copy header, subheader & body colors**, then paste the result into **Import from page scanner** in the optional type-colors section. Only detected color values are copied, not page text. The scan uses the first visible H1, H2/H3, and paragraph text it finds; confirm they match the elements you intend to check.

If an older version of the unpacked extension is already installed, reload it on the browser's extensions page to use the new copy action.

The scan covers the visible viewport and the main frame. It reads rendered text, computed text/background colors, font size/weight, and background-image/gradient styles. It captures the visible viewport locally so image/gradient backgrounds can be sampled at points inside each text element's bounds. Screenshot samples are approximate; they may miss small contrast failures and are never presented as a conformance pass. Review image, gradient, transparent, filtered, and blended backgrounds manually.

The extension does not scan content outside the visible viewport, embedded cross-origin frames, browser UI, or pages where browser extension injection is restricted. It does not make network requests, retain results, or modify the page.
