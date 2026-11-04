# Study Ambient Sounds

A calm, distraction-free ambient sound mixer for students.

## Features

- Five generated ambient soundscapes: rain, forest (with subtle bird chirps), fan, wind, and white noise
- Mix any combination of sounds, with independent volume controls
- Master volume and play/pause controls
- Sleep timer presets and a custom duration (1–720 minutes)
- Ten calming color themes
- Browser fullscreen mode (where supported)
- Saves theme, selected sounds, volume levels and sleep timer duration with `localStorage`
- Responsive design for desktop and mobile
- No frameworks, external API calls, audio downloads or accounts

## Run locally

1. Extract the ZIP archive.
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).
3. Select sound switches and press **Play sounds** to start. Browser policies require a user gesture before audio begins.

## Publish using GitHub Pages

1. Create a public repository called `study-ambient-sounds`.
2. Upload `index.html`, `styles.css`, `app.js`, `favicon.svg`, and `README.md` into the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/(root)`.
4. Once deployed, the default URL will be `https://YOUR_USERNAME.github.io/study-ambient-sounds/`.

## Notes

All sounds are **synthetically generated using the Web Audio API**, so the app works offline after its files load. These are intentionally gentle approximations, not recordings of nature. Audio quality depends on speakers and headphones. The app does not play audio automatically; tap **Play sounds** after opening it. Mobile devices may restrict audio in the background or after the screen sleeps. The sleep countdown runs while the tab remains active and is not restored across page reloads. When playback is paused, the sleep timer pauses too.

The app stores preferences only in your browser. To clear them, remove the website's local storage data.

## Files

- `index.html` — UI markup
- `styles.css` — layout, responsive styles and themes
- `app.js` — sound synthesis, controls, persistence and sleep timer
- `favicon.svg` — custom icon

## Author

Created for [BiharKalyan.in](https://biharkalyan.in) by [Arnav Giri](https://github.com/arnavgiri).
