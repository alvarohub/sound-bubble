import * as THREE from 'three';
import type { BubbleVisual } from './bubble';
import type { PreviewRenderer } from './preview';

export type ArAvailability = 'available' | 'unavailable';

export async function getArAvailability(): Promise<ArAvailability> {
  if (!navigator.xr) return 'unavailable';
  return (await navigator.xr.isSessionSupported('immersive-ar')) ? 'available' : 'unavailable';
}

export class ArSessionController {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera();
  private readonly reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.06, 40).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: '#f97316', side: THREE.DoubleSide }),
  );
  private hasHit = false;
  private placed = false;
  private startedAt = 0;

  public constructor(
    private readonly preview: PreviewRenderer,
    private readonly bubble: BubbleVisual,
    private readonly getLevel: () => number,
    private readonly onStatus: (message: string) => void,
    private readonly onEnded: () => void,
  ) {
    this.reticle.visible = false;
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#075985', 2.2), this.reticle);
  }

  public async start(): Promise<void> {
    if (this.session) return;
    if (await getArAvailability() !== 'available') throw new Error('Immersive AR is not available on this device.');
    let session: XRSession | null = null;

    try {
      session = await navigator.xr!.requestSession('immersive-ar', { requiredFeatures: ['hit-test'] });
      this.preview.stop();
      this.preview.detachBubble();
      this.scene.add(this.bubble.group);
      this.preview.renderer.xr.enabled = true;
      await this.preview.renderer.xr.setSession(session);
      this.referenceSpace = await session.requestReferenceSpace('local');
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const requestHitTestSource = session.requestHitTestSource;
      if (!requestHitTestSource) throw new Error('Hit testing is not supported by this AR session.');
      const hitTestSource = await requestHitTestSource.call(session, { space: viewerSpace });
      if (!hitTestSource) throw new Error('Could not create an AR hit-test source.');

      this.session = session;
      this.hitTestSource = hitTestSource;
      this.session.addEventListener('end', () => void this.finish());
      this.session.addEventListener('select', () => this.place());
      this.startedAt = performance.now();
      this.preview.renderer.setAnimationLoop((_, frame) => this.render(frame));
      this.onStatus('Looking for a horizontal floor or tabletop. Tap once the orange ring appears.');
    } catch (error) {
      this.restorePreview();
      if (session) await session.end().catch(() => undefined);
      throw error;
    }
  }

  public async end(): Promise<void> {
    await this.session?.end();
  }

  private render(frame: XRFrame | undefined): void {
    if (!frame || !this.referenceSpace) return;
    const hit = this.hitTestSource ? frame.getHitTestResults(this.hitTestSource)[0] : undefined;
    const pose = hit?.getPose(this.referenceSpace);
    this.hasHit = Boolean(pose);
    this.reticle.visible = this.hasHit;
    if (pose) this.reticle.matrix.fromArray(pose.transform.matrix);
    this.reticle.matrixAutoUpdate = false;
    if (!this.hasHit && performance.now() - this.startedAt > 6000) {
      this.onStatus('Try a well-lit textured floor or table and move your phone slowly.');
    }
    this.bubble.update(this.getLevel(), performance.now() / 1000);
    this.preview.renderer.render(this.scene, this.camera);
  }

  private place(): void {
    if (!this.hasHit) return;
    this.bubble.group.position.setFromMatrixPosition(this.reticle.matrix);
    this.bubble.group.quaternion.setFromRotationMatrix(this.reticle.matrix);
    this.bubble.group.position.y += 0.001;
    this.placed = true;
    this.onStatus('Bubble placed for this session. Tap a new valid surface to move it.');
  }

  private async finish(): Promise<void> {
    this.hitTestSource?.cancel();
    this.hitTestSource = null;
    this.referenceSpace = null;
    this.session = null;
    this.restorePreview();
    this.onStatus(this.placed ? 'AR session ended. The bubble was not saved.' : 'AR session ended without placing a bubble.');
    this.onEnded();
  }

  private restorePreview(): void {
    this.preview.renderer.setAnimationLoop(null);
    this.preview.renderer.xr.enabled = false;
    this.scene.remove(this.bubble.group);
    this.preview.attachBubble();
    this.preview.start();
  }
}