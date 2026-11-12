# PREVE B brand assets

Applied in app.config.js to mobile and Pleos.

- icon.png: 1024px opaque legacy launcher icon
- adaptive-foreground.png: 1024px transparent color layer
- adaptive-monochrome.png: same alpha silhouette, white RGB for launcher theming
- Background: #F0F7FF, system provides final icon mask
- All foreground pixels inside 66dp diameter safe circle on 108dp canvas (with margin)
- play-store-icon-512.png: 512px opaque store icon, no baked rounded corners
- splash.png: 1024px transparent logo + PREVE, native 288dp image on white background
- splash-preview.png: presentation preview only, not stretched on device
- icon-mask-preview.png: circle, rounded square and themed previews

Logo master extracted with built-in image_gen from approved concept B. Mechanical sizing, alpha cleanup, monochrome and text typesetting use Sharp. App holds the native splash until authentication restoration is ready. No artificial delay.

Sources:
https://developer.android.com/develop/ui/compose/system/icon_design_adaptive
https://developer.android.com/develop/ui/views/launch/splash-screen
https://developer.android.com/distribute/google-play/resources/icon-design-specifications

Generation prompt: Extract only the exact blue folded ribbon P emblem from concept B onto transparent background. Preserve ribbon silhouette, folds, blue gradient and proportions. Remove all pale blue background including P opening, no halo/glow/shadow, no text or redesign.
