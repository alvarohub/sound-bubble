# Sound Bubble — Standalone AR Demo

## Priority override

Implement this demo BEFORE the milestones in SPEC.md. SPEC.md remains the specification for the later civic application, but its database, authentication, dashboard, and persistence requirements do not apply to this demo.

The goal is a playful proof of possibility, not a production platform.

## Experience

On a compatible Android phone:

1. Open an HTTPS link in Chrome.
2. Optionally press `Enable microphone` and approve audio access.
3. Press `Start AR` and approve the browser's AR permissions.
4. Move the phone gently until a targeting ring appears on a floor or tabletop.
5. Tap to place a small colorful bubble at that point.
6. Speak, hum, or clap: the bubble expands, brightens, and gently deforms with the sound level.
7. Walk around it: it should remain approximately at the chosen position within this session.
8. Exit AR. Nothing is saved or uploaded.

The bubble reacts to loudness, not speech meaning. No AI service is needed.

## Technology and hosting

- TypeScript + Vite + Three.js.
- WebXR immersive-ar, using hit-test to obtain a surface pose.
- Web Audio API for local microphone loudness analysis.
- Procedurally generated sphere: no external 3D assets required.
- GitHub repository and GitHub Pages deployment over HTTPS.
- No Unity, database, login, backend, geolocation, or external API keys.
- Pin compatible dependency versions and commit the lockfile.

Target Chrome on ARCore-supported Android hardware. Detect capabilities at runtime. Do not promise AR on every Android phone or on iOS.

## Surface placement, not geometry reconstruction

Let the browser/AR runtime handle environmental tracking. Request a viewer-space hit-test source and draw a reticle using valid hit results in the rendering reference space.

Do NOT implement custom computer vision, floor reconstruction, plane meshing, or depth sensing. This demo only needs a surface intersection and pose; hit-test does not provide a complete model of the room.

The camera view is provided by the immersive AR session. Do not start a separate getUserMedia video stream or place a webcam video underneath WebXR.

Required behavior:

- Check navigator.xr and isSessionSupported('immersive-ar').
- Start the XR session directly from a user gesture; request hit-test.
- Show the reticle only when a valid hit pose exists.
- Ignore placement taps without a valid hit.
- Place only one bubble; subsequent valid scene taps move it.
- Ignore taps originating from overlay controls if DOM overlay is enabled.
- Keep the placed transform fixed in the session reference space; do not parent the bubble to the camera or keep moving it with the reticle.
- Do not promise tracking through walls or realistic occlusion.
- In-session anchors are optional, capability-detected enhancements, not a prerequisite.
- Exact placement does not survive session restart or transfer to another phone.

Initially target upward-facing horizontal surfaces: floor or table. Avoid vertical surfaces in the first version.

## Bubble appearance and interaction

- Approximately 15 cm resting diameter, using meters as scene units.
- Colorful, softly shaded, slightly translucent-looking appearance.
- Use a simple robust material first; no expensive refraction, transmission, or camera-texture sampling.
- Add a subtle ring at the contact point to make the placement readable. This is not a physically accurate shadow.
- Idle motion: a small breathing pulse.
- Sound: bounded expansion, brighter color, and gentle squash/stretch.
- Keep the sphere's bottom just above the surface as its radius changes; scaling should not push it through the floor.
- Avoid strong flashes or violent motion. Keep maximum size modest, e.g. 1.8 times the resting size.
- Implement scale/color reaction first; shader deformation is optional polish after the basic demo works.

Keep visual effects deterministic and independent of the audio implementation: renderBubble(level, deltaTime) receives a normalized level between 0 and 1.

## Microphone and sound analysis

Microphone permissions and immersive AR can interact differently across browsers/devices. Test them together on the target phone early.

Use a two-button startup flow:

1. `Enable microphone`: request getUserMedia with audio only, create/resume AudioContext from the user interaction, connect the stream to an AnalyserNode.
2. `Start AR`: start immersive AR from a separate explicit user interaction after microphone setup completes or is skipped.

Do not await microphone permission and then assume transient user activation is still available to start XR.

Audio graph:

microphone -> MediaStreamAudioSourceNode -> AnalyserNode

Do not connect microphone audio to speakers; avoid feedback. Do not record, transcribe, retain, or upload audio.

For each frame, read time-domain samples and calculate RMS:

```text
rms = sqrt(sum(sample[i] * sample[i]) / sampleCount)
rawLevel = clamp((rms - noiseFloor) * gain, 0, 1)
smoothedLevel += (rawLevel - smoothedLevel) * (1 - exp(-deltaTime / responseTime))
```

Use a fast attack and slower release with separate configurable time constants (initial suggestions: 0.05 s and 0.25 s). Make gain and noise floor configurable; tune on a real phone rather than treating the initial values as calibrated measurements.

- Request reduced automatic gain control/noise suppression/echo cancellation where useful, but tolerate devices ignoring those constraints.
- Explain that the response is relative to the phone's microphone, not a calibrated decibel meter.
- Show a small level meter before AR so permissions and microphone response can be checked independently.
- If audio is refused, unavailable, or suspended during XR, allow AR with idle animation or a clearly labeled simulated sound mode.
- Never silently present simulated input as actual microphone analysis.
- Reuse typed sample buffers; do not allocate new arrays every frame.

## Controls and fallback

Before AR:

- `Enable microphone` / microphone status.
- `Start AR` / AR support status.
- `Try 3D preview`.
- Short instructions: `Move your phone to find a surface. Tap to place. Make a sound!`

In AR:

- A small overlay with status and an exit button if DOM overlay is supported.
- Native XR exit remains usable when overlay is unavailable.
- Microphone muted/active state must be truthful; keep sound optional.

Fallback preview:

- Ordinary 3D view with the same bubble.
- Use real microphone response if available.
- Offer a labeled `Simulate sound` button or slider.
- Clearly say `3D preview — not AR`.
- An unsupported device is not an error that blocks the entire application.

Privacy text: `Sound is processed on your device. No audio is recorded or sent anywhere.`

## Lifecycle and error handling

- Handle denied microphone, denied XR, unsupported hit-test, no surface found, model/render errors, and session end.
- After several seconds without a hit, show helpful guidance, not a guarantee: `Try a well-lit textured floor or table and move your phone slowly.`
- Stop microphone tracks and close/suspend the audio context as appropriate on explicit exit; a new session can re-enable them.
- Cancel hit-test sources, remove session listeners, stop render loops, and dispose abandoned Three.js resources.
- Ensure preview and XR do not run competing animation loops.
- Support starting, ending, and starting again without duplicate listeners or microphone streams.
- Avoid logging raw microphone samples.

## Suggested repository

```text
AR_DEMO.md
SPEC.md                  # later full application; do not implement yet
README.md
package.json
package-lock.json
vite.config.ts
index.html
src/
  main.ts
  styles.css
  bubble.ts
  audio-input.ts
  ar-session.ts
  preview.ts
tests/
.github/workflows/deploy.yml
```

Keep this small. Do not add React, accounts, a backend, or a general-purpose AR engine wrapper without a demonstrated need.

## Build order

### D1 — Animated preview

Create the procedural bubble in a regular Three.js scene. Add idle animation and a simulated-level slider. Establish the visual effect without device permissions.

### D2 — AR proof on a real phone

Implement support checks, session start, hit-test reticle, tap-to-place, and session exit. Deploy an HTTPS build and test physical Android hardware. Use idle/simulated input initially if needed.

### D3 — Sound reaction

Add microphone setup, level meter, RMS analysis, smoothing, and bubble response. Test actual microphone input while immersive AR is running, not only before it starts.

### D4 — Demo polish

Improve instructions, fallback states, lifecycle cleanup, performance, and deployment documentation. Keep optional effects behind the working core.

## Acceptance tests

- A deployed GitHub Pages link loads under the actual repository base path.
- A supported physical Android phone can start immersive AR.
- The camera background comes from XR, not a separate webcam feed.
- A valid surface reticle appears on a suitable floor or table.
- Tapping places one bubble; walking around reveals a stable session-local position.
- No valid hit means no placement.
- Speaking/clapping changes the bubble while XR is active using real microphone input.
- Quiet conditions settle back to idle without persistent jitter.
- Denied microphone still permits AR with an honest fallback state.
- Unsupported AR still permits the labeled ordinary preview.
- Exiting releases microphone resources; restarting works.
- No audio recordings or audio uploads occur.
- Reloading resets the demo; no persistence is implied.

Desktop mocks and automated tests do not count as successful physical-device AR/audio verification. Record device/browser versions and actual results in README.

## Copilot kickoff prompt

Read AR_DEMO.md. It overrides SPEC.md for the immediate task: build the standalone Sound Bubble demo, not the database application. Propose a short plan, then implement D1 and D2 first. Use TypeScript, Vite, Three.js, and WebXR hit-test. Keep the bubble procedural and the code small. Add GitHub Pages deployment with the correct Vite base path. Then add local microphone loudness analysis in D3, with graceful permission and device fallbacks. Do not claim physical-device tests have passed unless I provide the results.
