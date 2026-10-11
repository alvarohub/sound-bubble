import '@picocss/pico';
import { createIcons, Info, Mic, Orbit, Play, ScanLine, ScanSearch, ShieldCheck, Sparkles } from 'lucide';
import { AudioInput } from './audio-input';
import { ArSessionController, getArAvailability } from './ar-session';
import { createBubble } from './bubble';
import { PreviewRenderer } from './preview';
import './styles.css';

const host = document.querySelector<HTMLElement>('#render-host')!;
const previewButton = document.querySelector<HTMLButtonElement>('#preview-button')!;
const arButton = document.querySelector<HTMLButtonElement>('#ar-button')!;
const micButton = document.querySelector<HTMLButtonElement>('#mic-button')!;
const simulation = document.querySelector<HTMLInputElement>('#simulation')!;
const simulationOutput = document.querySelector<HTMLOutputElement>('#simulation-output')!;
const meter = document.querySelector<HTMLMeterElement>('#level-meter')!;
const micStatus = document.querySelector<HTMLElement>('#mic-status')!;
const arStatus = document.querySelector<HTMLElement>('#ar-status')!;
const guidance = document.querySelector<HTMLElement>('#guidance p')!;
const modeLabel = document.querySelector<HTMLElement>('#mode-label')!;

createIcons({ icons: { Info, Mic, Orbit, Play, ScanLine, ScanSearch, ShieldCheck, Sparkles } });

const bubble = createBubble();
const preview = new PreviewRenderer(host, bubble);
const audio = new AudioInput();
let currentLevel = 0;
let arActive = false;
const ar = new ArSessionController(preview, bubble, () => currentLevel, setGuidance, () => {
  arActive = false;
  arButton.disabled = false;
  arButton.innerHTML = '<i data-lucide="scan-line"></i> Start AR';
  createIcons({ icons: { ScanLine } });
  modeLabel.textContent = '3D preview - not AR';
});

preview.start();
void refreshArAvailability();

function setGuidance(message: string): void {
  guidance.textContent = message;
}

async function refreshArAvailability(): Promise<void> {
  const availability = await getArAvailability();
  if (availability === 'available') {
    arStatus.textContent = 'AR is available. Start it from a user action, then wait for a valid surface reticle.';
    arButton.disabled = false;
  } else {
    arStatus.textContent = 'AR is not available here. The ordinary 3D preview remains fully usable.';
    arButton.disabled = true;
  }
}

previewButton.addEventListener('click', () => {
  host.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setGuidance('3D preview is active. Enable the microphone or use the labeled simulated sound control.');
});

micButton.addEventListener('click', async () => {
  try {
    await audio.enable();
    micStatus.textContent = 'Microphone is active. Sound stays local to this device.';
    micButton.disabled = true;
    micButton.innerHTML = '<i data-lucide="check"></i> Microphone active';
    createIcons({ icons: { ShieldCheck } });
  } catch {
    micStatus.textContent = 'Microphone permission was unavailable. You can still use AR or simulate sound.';
  }
});

simulation.addEventListener('input', () => {
  simulationOutput.value = `${simulation.value}%`;
});

arButton.addEventListener('click', async () => {
  try {
    if (arActive) {
      await ar.end();
      return;
    }
    arButton.disabled = true;
    await ar.start();
    arActive = true;
    arButton.innerHTML = '<i data-lucide="x"></i> Exit AR';
    createIcons({ icons: { ScanLine } });
    arButton.disabled = false;
    modeLabel.textContent = 'Immersive AR - session-local placement';
  } catch (error) {
    arButton.disabled = false;
    setGuidance(error instanceof Error ? error.message : 'Could not start AR.');
  }
});

let lastTime = performance.now();
function updateLevel(now: number): void {
  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const microphoneLevel = audio.read(delta);
  const simulatedLevel = Number(simulation.value) / 100;
  currentLevel = audio.active ? Math.max(microphoneLevel, simulatedLevel) : simulatedLevel;
  preview.setLevel(currentLevel);
  meter.value = currentLevel;
  requestAnimationFrame(updateLevel);
}
requestAnimationFrame(updateLevel);

window.addEventListener('pagehide', () => {
  void audio.stop();
  preview.dispose();
});