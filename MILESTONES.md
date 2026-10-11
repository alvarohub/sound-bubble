# Sound Bubble Milestones

This document records the working prototype, the decisions that keep it small, and the directions reserved for later.

## Current State: Single-Bubble AR Proof

Status: implemented and deployed to GitHub Pages.

- TypeScript, Vite, and Three.js provide a small static web application.
- GitHub Pages supplies the required HTTPS deployment; no Azure service or backend is involved.
- Chrome on Android hardware with ARCore is the supported immersive-AR target.
- WebXR hit testing finds a horizontal floor or tabletop; the camera image comes from the AR session.
- A local microphone level changes the bubble's scale and colour. Audio is neither recorded nor uploaded.
- The ordinary 3D preview remains available when AR is unsupported.
- One bubble exists in a session. A later valid tap moves that bubble rather than creating another.
- Its transform is valid only for the active AR session; it is intentionally not saved.

This is a proof of placement and live sound response, not yet a shared spatial database.

## Why The Prototype Is Constrained

WebXR coordinates are local to one AR session. Saving their numeric $x$, $y$, and $z$ values does not restore an object to the same real-world spot after reloading or on another phone. Geographic coordinates are useful for finding an approximate place, but they do not solve exact spatial relocalization.

Keeping one procedural bubble also makes the first physical-device test easier: it isolates hit testing, rendering, and microphone interaction before scene management or persistence complicates the result.

## Next: Field-Test The Existing Experience

- Record the Android phone model, Android version, and Chrome version.
- Confirm reticle acquisition, placement, microphone response, session exit, and restart behavior.
- Test in different light, texture, and surface conditions.
- Keep the current fallback preview working throughout.

## Later: Multiple Bubbles In One Session

- Change a valid tap from “move the bubble” to “create another bubble.”
- Set a small scene limit and measure phone frame rate and thermal behavior.
- Give each bubble its own visual state and, eventually, text content.
- Provide explicit controls to select, move, or remove bubbles.

This can work without a database, but it remains temporary: all bubbles disappear when the AR session ends.

## Later: Persistence And Place

- Start with local-only records if an offline personal sketch is useful.
- For shared bubbles, add a backend with a record ID, text/content, timestamp, geographic position, accuracy, and privacy/access rules.
- Treat GPS as a geographic index, not as an exact AR anchor.
- Keep manual AR placement separate from saved geographic data until a deliberate relocalization method is chosen.

## Related Language Direction

See [RELATED_IDEAS.md](RELATED_IDEAS.md): speech-to-text fragments inside the bubble, later evolving into constrained 3D sentence and letter creatures inspired by *Viva Voce* and *Knowledge Voxels*.

## iPhone Compatibility

The current immersive AR mode should not be promised on iPhone. iOS Safari does not provide a broadly reliable equivalent of Android Chrome plus ARCore WebXR `immersive-ar` with hit testing, so this application will fall back to the ordinary 3D preview there.

An iPhone version is possible, but it is a distinct future decision:

- A native iOS ARKit application or native wrapper can provide proper tracked AR placement.
- Apple Quick Look can place a USDZ object, but it is not a replacement for this live interactive Three.js scene.
- Speech-to-text in a browser should not be assumed consistent across iPhone versions. A production direction needs either a carefully tested on-device browser capability or an explicit, consent-based transcription service.

The current GitHub Pages URL remains useful on iPhone for the normal preview and interface; it is not evidence that immersive AR works there.