# Contrast Buddy: UX and UI Improvement Backlog

A broad set of opportunities for making Day 1 feel clearer, more polished, and more useful. The goal is a fast, trustworthy single-page checker. Add an idea only when it helps a real task and can stay understandable in the first screen.

## Product principles

- Help a person answer three questions quickly: What is my contrast? What passes? What is the smallest useful fix?
- Keep the main action and result visible together on common laptop screens.
- Treat WCAG results as evidence about a specific color pair and text size, not as a claim that a whole page or product is accessible.
- Preserve a designer's intent when suggesting fixes; show the color change before applying it.
- Make the tool work without an account, upload, tracking, or saved color history.
- Prefer progressive disclosure for advanced explanations and features.

## Highest-value improvements and current status

| Priority | Idea | User value | Scope | Status |
|---|---|---|---|
| P1 | Add a small before/after comparison for a suggested color, with the original and adjusted pair visible at once. | Makes the trade-off obvious before applying the fix. | Small | Implemented |
| P1 | Add a button to copy the suggested color and the passing pair without applying it. | Lets users take the fix into a design tool while keeping their current preview untouched. | Small | Implemented as suggested CSS copy |
| P1 | Add copy formats for `color`, `background-color`, and CSS custom properties, while keeping “Copy pair” as the default. | Fits developer handoff without cluttering the basic workflow. | Small | Implemented |
| P1 | Add an optional target selector: AA normal (4.5:1), AA large/UI (3:1), or AAA normal (7:1). | Makes the auto-fix match the user's actual requirement and avoids over-adjusting. | Small | Implemented |
| P1 | Explain that large text means at least 24 CSS px regular or about 18.67 CSS px bold; link directly to the WCAG definition. | Reduces mistakes when users decide which grade applies. | Small | Size guidance implemented; improve link placement in a visual review |
| P1 | Add a compact pass/fail summary sentence, such as “AA normal text fails; AA large text and UI pass.” | Makes a multi-card result easier to scan and easier to understand with assistive technology. | Small | Partially covered by the result verdict |
| P1 | Add undo for applying a suggested color. | Makes experimentation feel safe and reversible. | Small | Implemented |
| P1 | Add a visible “Reset to default” action that restores the starting pair and preview. | Gives users a reliable way back without refreshing. | Small | Implemented |
| P1 | Verify the compact layout in a real browser at 1366×768, 1280×720, tablet, and phone widths; tune until the primary controls and core result fit above the fold where practical. | Confirms the main product promise instead of relying on CSS estimates. | Small | Pending rendered-browser access |
| P1 | Run keyboard-only, screen-reader, zoom, forced-colors, and reduced-motion checks in actual browsers. | Covers behavior the current mocked-DOM harness cannot verify. | Medium | Pending manual browser review |

## Make the visual design pop

### Hierarchy and composition

- Make the score the visual anchor; keep its ratio, primary verdict, and the strongest next action grouped tightly.
- Reduce competing card titles and eyebrow labels. Use one clear heading and one sentence of context.
- Use a consistent spacing scale, radius scale, and type scale rather than one-off values.
- Tighten the vertical rhythm so there is less dead space above the tool and more room for the actual result.
- Align the left and right cards at the top, and tune their internal spacing so the pair feels balanced at common viewport widths.
- Give the primary action one clear visual style. Keep secondary actions quiet but still obvious.
- Make pass, warning, and fail states distinct through text, icon, and color; never rely on color alone.
- Use a restrained accent color and reserve bright colors for meaningful status or interaction.
- Add subtle hover, pressed, and focus states that feel responsive without distracting motion.
- Consider a small, custom contrast mark or split-color glyph for the brand instead of generic decorative art.
- Keep the preview authentic: show a clearly labeled large-text sample, normal body sample, and, if graphics/UI checks remain visible, one simple interface-control sample.
- Choose sample copy that explains the difference between normal and large text without taking up space.
- Check all text and control colors used by the tool itself for contrast against the page background.

### Responsive and fold behavior

- Confirm the primary color controls, score, key pass/fail states, and preview fit in the first desktop viewport at 720–800 px tall.
- On narrow screens, keep color inputs and the most important result close together; avoid making the user scroll past optional explanations.
- Test very narrow widths, browser zoom at 200% and 400%, long translated labels, and large default font settings.
- Prevent verdict pills, HEX fields, buttons, and grade labels from wrapping into awkward or ambiguous layouts.
- Consider a compact mobile summary that keeps the score and verdict visible before the preview and explanatory note.

## Input and color workflows

- Keep support for 3- and 6-digit HEX with or without `#`; clearly show the accepted format near the fields.
- Preserve the in-progress HEX text while typing; normalize only on blur or after a picker selection.
- Test leading/trailing spaces, lowercase, shorthand, missing `#`, incomplete values, invalid characters, pasted values, and rapid edits.
- Make the native color picker and HEX field visibly and predictably synchronized.
- Add a small “Use text color as background” swap action with a clear accessible name and state announcement.
- Let users click a swatch preview to copy that one color, if this can be done without making the swatch look like an unexplained control.
- Consider accepting `rgb()` and `hsl()` only if discovery shows people regularly need them; convert to the same internal HEX representation.
- Consider a screen eyedropper for deployed secure contexts, behind capability detection and an explicit click. Always keep manual entry available.
- Do not make the page depend on eyedropper support; the browser API is not available in all browsers and requires a secure context.
- Consider reading colors from pasted CSS declarations as an advanced convenience, with a clear preview of exactly which two colors were detected.
- Avoid accepting arbitrary color names unless users can see the normalized output; names can be ambiguous across tools and formats.

## Contrast results and recommendations

- Keep AA normal, AA large, AAA normal, AAA large, and non-text AA checks clearly separated and labeled with their thresholds.
- Explain that the non-text 3:1 result applies to meaningful UI components and graphics against adjacent colors, and does not certify a whole interface.
- Include the relevant WCAG success-criterion numbers in a details panel: 1.4.3 for text and 1.4.11 for non-text contrast.
- Compare the current pair with the closest passing adjustment while preserving hue where possible; display both before and after ratios.
- Let users choose whether a fix should adjust foreground, background, or either. Default to changing foreground because it is easier to compare.
- Allow target-specific suggestions for 4.5:1, 3:1, and 7:1 rather than always solving for AA normal text.
- Offer a short list of passing candidates (for example, closest, darker, lighter) only if the alternatives remain easy to scan.
- Show the actual suggested ratio and never label a rounded display value as a pass unless the full-precision calculation passes.
- Explain when a suggested color changes the intended hue substantially or reaches a near-neutral endpoint.
- For impossible or unusual constraints, show a plain-language explanation and let users adjust both colors rather than silently changing the target.
- Keep the contrast algorithm's sRGB assumptions and relative-luminance method accessible in a small “How this is calculated” disclosure.
- Consider a monochrome or color-vision simulation preview only as an optional secondary view; do not imply that simulation replaces contrast or accessibility review.

## Preview and design handoff

- Label the preview examples with their size category and keep normal and large samples visually distinct.
- Add a small UI component preview only when the graphics/UI result is enabled, so users see what the 3:1 check represents.
- Offer copyable CSS snippets for the selected pair and suggested pair.
- Show a brief success state when copying, with a live announcement that does not steal focus.
- Consider a “copy report” action with the pair, ratio, grades, and calculation caveat for QA tickets.
- Keep preview examples stable so before/after comparisons are meaningful.
- Do not add a full palette builder to this page; link to a separate tool if palette creation becomes a repeated need.

## Accessibility and inclusive interaction

- Use visible labels for both HEX fields and descriptive accessible names for picker controls.
- Keep every action keyboard-operable and provide a strong, unobscured focus indicator.
- Announce one concise score/verdict update per edit. Avoid announcing every grade card separately on every keystroke.
- Ensure invalid values clear stale score, grade, preview, and recommendation states.
- Keep error text adjacent to its field, connected with `aria-describedby`, and expose `aria-invalid` accurately.
- Respect reduced-motion preferences and avoid flashing status changes.
- Verify text and controls in Windows High Contrast / forced-colors mode.
- Ensure status remains understandable without color, icons, or visual positioning.
- Check minimum target sizes and spacing for touch users, especially swap, copy, and preset controls.
- Test browser zoom and text enlargement without clipped labels or horizontal scrolling.
- Check that the native color input is reachable and usable with keyboard and common screen readers.
- Confirm the live preview does not create an unnecessary screen-reader announcement on each keystroke.
- Keep heading order, landmarks, link names, and the reading order aligned with the visual order.
- Consider translated or long text labels before finalizing narrow card widths.

## Trust, privacy, and resilient behavior

- Keep colors in page memory by default; do not add analytics, uploads, or persistent storage without a clear user need.
- Keep error handling explicit for clipboard and optional eyedropper features.
- Treat Escape from the eyedropper as a normal cancellation, not an error.
- Provide a useful no-JavaScript fallback or a clear message if the tool requires JavaScript.
- Verify the page still works when clipboard access is denied or the browser is offline.
- Avoid loading fonts, scripts, or image assets from third parties unless the value justifies the privacy and reliability cost.
- Keep external guidance links clear about their destination and open them safely.

## QA and validation plan

### Automated behavior checks

- Verify black on white and white on black produce 21:1.
- Test exact AA and AAA boundaries with pairs immediately above and below each threshold.
- Test 3:1 large-text and non-text boundaries independently.
- Test color parsing: 3/6 digit, uppercase/lowercase, optional hash, whitespace, empty, partial typing, invalid characters, and pasted input.
- Type all six-digit test colors one character at a time to catch input normalization regressions.
- Verify swapping, presets, picker synchronization, recommendation apply/undo, all copy formats, and reset.
- Verify a recommendation always reaches the requested threshold at full precision; sample broad deterministic color-pair sets.
- Verify invalid edits clear every result tied to the old pair, including recommendations and preview styling.
- Simulate denied clipboard and canceled/unsupported eyedropper states.
- Assert that no personal values are persisted or transmitted.

### Manual quality checks

- Test Chromium-based Edge and Chrome, Firefox, and Safari where available.
- Inspect screenshots at 1366×768, 1280×720, 1024×768, 390×844, and 320×640.
- Test keyboard-only, NVDA or Narrator, VoiceOver where available, 200%/400% zoom, forced colors, and reduced motion.
- Confirm that all primary actions and the key result are visible together at desktop laptop heights.
- Ask 3–5 people to complete three tasks: enter a pair, understand which sizes pass, and apply/copy a fix. Note hesitation and errors rather than asking only whether they like it.
- Run a short expert review against WCAG 2.2 AA; clearly state that the checker itself cannot certify an entire website.
- Keep a regression note for every found failure and add it to the retained QA harness where practical.

## Ideas to keep out of the first screen

These could be useful later, but would make the core task slower or imply capabilities the tool does not have:

- Automatic URL crawling, persistent extension access to every website, or automatic website certification. The optional scanner uses a user-invoked active-tab permission and only checks visible content.
- Image or screenshot upload and pixel-region analysis.
- Account-based color history or cloud-synced projects.
- A large palette generator, color wheel, or design-system audit table.
- APCA presented as a WCAG conformance result. If ever offered, label it clearly as a separate, non-WCAG evaluation.
- Color-vision simulation as a substitute for contrast testing.
- Large batches of candidate colors before a user asks for them.
- Persistent history or tracking that conflicts with the local-only promise.

## Research references

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — ratio, text-size grades, preview, HEX inputs, and lightness adjustment.
- [Adobe Color Contrast Analyzer](https://color.adobe.com/create/color-contrast-analyzer) — AA/AAA text categories and a separate graphics/UI category.
- [W3C: Understanding Contrast (Minimum), WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — text thresholds and large-text definition.
- [W3C: Understanding Non-text Contrast, WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) — 3:1 threshold for applicable components and graphics.
- [MDN: EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) — explicit user activation, secure-context requirement, and browser support limitations.
