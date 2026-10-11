# Related Ideas

These are adjacent to Sound Bubble, but are deliberately not part of the current AR proof of concept.

## Speech Inside a Placed Bubble

After a bubble is placed, speech could be transcribed and made visible inside it.

1. Begin with a short floating text fragment inside the bubble.
2. Evolve the words, letters, and sentences into moving three-dimensional snakes.
3. Keep those creatures inside the bubble, either through a physical boundary or a softer attraction to its centre.

The reference points are the *Viva Voce* project and the earlier *Knowledge Voxels* project. The important artistic question is whether language should feel contained by a membrane or gathered by a centre while still able to roam.

## Questions To Explore Later

- Does speech appear as live partial transcription, as completed phrases, or as a deliberately delayed memory?
- Should the text remain readable before it becomes an organism, or should readability dissolve immediately?
- Can sentence snakes inherit a direction from the speaker, bubble motion, or ambient sound?
- How does the bubble respond when several speakers or several bubbles are present?
- Is a persistent bubble a private memory, a geographic public record, or both?

## Technical Direction, Not A Commitment

Speech-to-text changes the privacy and deployment model: the current app analyses loudness locally and does not retain or transmit audio. A later transcription feature must explicitly choose between an on-device recognizer and an opt-in speech service, including how audio, transcripts, consent, and retention work.

The first text experiment can stay simple: one placed bubble, a short manually supplied or transcribed phrase, and a small set of text meshes. Do not begin with a full 3D sentence-physics system.