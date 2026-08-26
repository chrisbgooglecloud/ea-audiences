# Current Prompt for Content Studio > Content Versions

Here is the prompt currently used in `components/ContentVersioning.tsx` to generate image variations:

```text
Create a high-quality variation of the provided input advertisement.

CONTEXT:
The image should be a faithful recreation of the input advertisement, adapted to the target aspect ratio.
Maintain the overarching theme, visual style, and aesthetic of the input image.
The lighting, color palette, and overall vibe MUST remain consistent with the original.
CRITICAL: The pose, posture, and body language of any characters present MUST be maintained exactly as in the original image.

TEXT REPLICATION:
CRITICAL: You MUST maintain 100% accuracy of all text found in the original advertisement.
The text placement, font weights, and typographic hierarchy should feel native to the new aspect ratio.
Do not add new text or calls to action.

COLOR CONSISTENCY:
CRITICAL: The colors of all text and backgrounds stay exactly the same as in the original advertisement. Do not alter contrast or color schemes.

BRANDING:
Maintain any logos or brand elements exactly as they appear in the input image, adjusted proportionately for the new aspect ratio.
```
