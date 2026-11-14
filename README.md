# Day 1: Contrast Buddy

**Purpose:** Check WCAG contrast for text and interface colors.

**First version:** Check WCAG contrast for text and interface colors. The MVP should work in a browser, explain its assumptions, and keep personal inputs local where practical.

**Status:** Complete

## Build log

- **Improvement:** Invalid HEX input now clears the old score, grades, and preview so stale results cannot be mistaken for the current pair. `node qa.mjs` covers the invalid and recovery states.
- **Follow-up improvement:** When a valid pair misses AA for normal text, the result suggests a nearby text color by adjusting lightness while preserving hue where possible, then offers a one-click apply action. The suggestion clears when the pair passes or either color is invalid.
- **UX / QA pass:** Fixed six-digit HEX typing so a valid three-digit prefix is not expanded while the user is still typing. Added the WCAG 2.2 AA graphics/UI threshold, visible ratio thresholds, a full-precision pass/fail note, concise ratio announcements, reduced-motion support, denser spacing, and collapsed calculation guidance to protect first-screen space. `node qa.mjs` covers character-by-character typing, threshold boundaries, clipboard failure, and 250 deterministic color pairs to verify each suggested fix passes AA.
- **Workflow pass:** Added side-by-side current/suggested samples, AA normal / AA large-UI / AAA normal fix targets, CSS declaration and custom-property copy, one-click suggested CSS copy, undo for an applied fix, and reset to the starting pair. AAA fixes that cannot be reached by changing text alone explain that the background must change. `node qa.mjs` covers each workflow.
- **Explore better options:** Generates three clearly labeled paths for the current colors and target: adjust text only, background only, or both. Selecting a card previews its readability without changing the original inputs or removing the other options. More options appends up to three distinct passing cards per request. Users can return to the original, copy a selected pair, or request AAA options. AAA is labeled optional. A single-color path is marked unavailable when it cannot reach the target.
- **More tools:** Added a screen eyedropper where supported; local image sampling with keyboard access; pair links encoded in the URL fragment; a six-pair session board; and an AA normal-text audit for up to 12 pasted HEX colors. Images stay on the device and the board clears when the page closes. Links made from a local file are device-specific; host the page to share links with other people. The live preview is at the top of the readability panel.
- **More diverse options:** The first three suggestions keep their close-adjustment roles. Additional sets start with moderate hue and saturation changes while retaining the text-only, background-only, and both-colors choices; every available pair is checked against the selected contrast target.
- **Two-color suggestions:** Candidate backgrounds are searched near the original and ranked by combined RGB change. The original light/dark relationship is retained when a passing pair exists, and extra sets use bounded hue changes rather than pushing colors progressively toward black and white.
- **Optional type colors:** Header, subheader, and body HEX colors can be checked independently against the current preview background, with AA normal and large-text results shown separately. Screen-picking controls appear below the privacy notice when the browser supports the EyeDropper API.
- **Default target:** AA normal text (4.5:1) is selected on load and reset. Unavailable options and text-only fixes that cannot reach the chosen target have a gentle highlighted note.
- **Page scan:** Added an optional [Chrome/Edge extension](page-scanner-extension/README.md) that scans visible text in the active tab only after the user invokes it. Solid opaque CSS pairs are calculated directly. Image/gradient/translucent backgrounds get local screenshot sampling and an explicit visual-review warning; those estimates are not reported as conformance passes.

Implemented as a standalone, browser-only page in `index.html`.

- **Build:** Live HEX input and color pickers, generated passing alternatives, swap and copy actions, contrast ratio, AA/AAA checks, and a live preview.
- **QA:** `node qa.mjs` checks contrast boundaries, Explore options and appended cards, screen-picker and image-sampling mocks, share-link round trip, session-board limits, token audit, preview order, and existing controls. `page-scanner-extension/qa.mjs` checks solid pass/fail pairs, large-text sizing, and gradient review flags; `pixel-qa.mjs` checks screenshot sampling.
- **Accessibility review:** Labeled controls, keyboard-operable buttons, visible focus styles, announced validation and result updates, and responsive single-column layout below 780px.
- **Privacy:** Color values stay in page memory; there is no upload or tracking code.
- **Scanner privacy:** The optional extension requests temporary access only to the active tab after user invocation (`activeTab` + `scripting`). Page text and viewport screenshots remain in memory in the browser and are not sent or saved.
- **Browser visual QA:** Not completed. The browser URL policy denied opening the local file URL, so rendered desktop/mobile layout review was unavailable. The app was not opened through a server or alternate browser path.
- **Retest:** Corrected the static no-JavaScript fallback score from 7.44 to 8.29, then reran the harness successfully.
- **Reproducible QA:** `node qa.mjs` runs the retained behavior checks; it uses mocked DOM and clipboard APIs, not a rendered browser.

Next: visually inspect in a browser when the local preview is available, then proceed to Day 2.
