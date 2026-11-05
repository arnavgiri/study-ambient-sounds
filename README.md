# Study Ambient Sounds

A calm, distraction-free ambient sound mixer for students.

**Live Demo:** [Study Ambient Sounds](https://arnavgiri.github.io/study-ambient-sounds/)

## Features

- Six generated ambient soundscapes: rain, forest (with subtle bird chirps), fan, wind, white noise, and distant thunder
- Mix any combination of sounds, with independent volume controls
- Master volume and play/pause controls
- Sleep timer presets and a custom duration (1–720 minutes)
- Ten calming color themes
- Browser fullscreen mode (where supported)
- Saves theme, selected sounds, volume levels and sleep timer duration with `localStorage`
- Responsive design for desktop and mobile
- No frameworks or accounts; a bundled public-domain thunder recording complements the synthesized sounds

## Run locally

1. Extract the ZIP archive.
2. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).
3. Select sound switches and press **Play sounds** to start. Browser policies require a user gesture before audio begins.

## Publish using GitHub Pages

1. Create a public repository called `study-ambient-sounds`.
2. Keep these files together in the project folder.
3. In **Settings → Pages**, choose **Deploy from a branch**, then `main` and `/(root)`.
4. The published project is available at [https://arnavgiri.github.io/study-ambient-sounds/](https://arnavgiri.github.io/study-ambient-sounds/).

## Notes

Rain, forest, fan, wind, and white noise are **synthetically generated using the Web Audio API**. Thunder uses a real 19-second rain-and-thunder recording, bundled as `thunder.ogg` (with a Wikimedia Commons online fallback). The app works offline after its files load when `thunder.ogg` is present. Audio quality depends on speakers and headphones. The app does not play audio automatically; tap **Play sounds** after opening it. Mobile devices may restrict audio in the background or after the screen sleeps. The sleep countdown runs while the tab remains active and is not restored across page reloads. When playback is paused, the sleep timer pauses too.

The app stores preferences only in your browser. To clear them, remove the website's local storage data.

## Files

- `index.html` — UI markup
- `styles.css` — layout, responsive styles and themes
- `app.js` — sound synthesis, controls, persistence and sleep timer
- `favicon.svg` — custom icon
- `thunder.ogg` — real public-domain rain and thunder recording

## Thunder audio credit

"Rain and thunder.ogg" was recorded by [User:Caesar](https://commons.wikimedia.org/wiki/User:Caesar) and released into the public domain. [Source and license](https://commons.wikimedia.org/wiki/File:Rain_and_thunder.ogg).

## Author

Created by Arnav Giri.
