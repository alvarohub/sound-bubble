import * as THREE from 'three';
import type { BubbleVisual } from './bubble';

export class PreviewRenderer {
  public readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.01, 20);
  private readonly clock = new THREE.Clock();
  private running = false;
  private level = 0;

  public constructor(private readonly host: HTMLElement, private readonly bubble: BubbleVisual) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor('#f8fafc', 0);
    this.host.append(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#075985', 2.2));
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.3);
    keyLight.position.set(0.3, 0.6, 0.7);
    this.scene.add(keyLight, this.bubble.group);
    this.camera.position.set(0, 0.13, 0.38);
    this.camera.lookAt(0, 0.08, 0);
    new ResizeObserver(() => this.resize()).observe(this.host);
    this.resize();
  }

  public setLevel(level: number): void {
    this.level = level;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.render());
  }

  public stop(): void {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  public detachBubble(): THREE.Group {
    this.scene.remove(this.bubble.group);
    return this.bubble.group;
  }

  public attachBubble(): void {
    this.scene.add(this.bubble.group);
  }

  public dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.bubble.dispose();
  }

  private render(): void {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    this.bubble.group.rotation.y += delta * 0.35;
    this.bubble.update(this.level, elapsed);
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
}