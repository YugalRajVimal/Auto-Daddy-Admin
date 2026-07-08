## Android adaptive icon

Android adaptive icons are masked (circle/squircle/etc). If you use a full-bleed logo as the
foreground, it will get clipped.

This repo uses:

- `assets/images/app-icon-square.png`: full artwork (used for iOS / general icon)
- `assets/images/app-icon-adaptive-foreground.png`: padded foreground for Android adaptive icon

If you update the logo, regenerate the adaptive foreground so the important content sits inside
the safe area (about 70% of the canvas).

