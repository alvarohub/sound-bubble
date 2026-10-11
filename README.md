# Sound Bubble

Sound Bubble is a session-local WebXR experiment: preview a small procedural Three.js bubble, then manually place it on a detected floor or tabletop in compatible Android Chrome AR. Optional microphone loudness changes its scale and glow entirely on-device.

## Run locally

```sh
npm install
npm run dev
```

Run checks with `npm test` and `npm run build`.

## Use

1. Open the app and inspect the labeled ordinary 3D preview.
2. Optionally select **Enable microphone**. Audio is not recorded or uploaded.
3. On an ARCore-compatible Android device in Chrome over HTTPS, select **Start AR**.
4. Move gently over a well-lit, textured horizontal floor or table. Tap only once the orange reticle appears.

Tapping a later valid hit moves the one bubble. Placement lasts only for that immersive session; exiting or reloading clears it. Unsupported and permission-denied devices still retain the ordinary preview and simulated-sound control.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages. The Vite base is relative, so the same build works at a repository subpath.

Physical Android AR/audio validation has not yet been performed. Record the phone model, Chrome version, Android version, AR availability, microphone behavior, placement behavior, and restart behavior after field testing.