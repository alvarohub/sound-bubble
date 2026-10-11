import * as THREE from 'three';

export const RESTING_RADIUS_METERS = 0.075;

export interface BubbleVisual {
  group: THREE.Group;
  update: (level: number, elapsedSeconds: number) => void;
  dispose: () => void;
}

export function clampLevel(level: number): number {
  return Math.min(1, Math.max(0, level));
}

export function bubbleScale(level: number, elapsedSeconds: number): THREE.Vector3 {
  const safeLevel = clampLevel(level);
  const breath = 1 + Math.sin(elapsedSeconds * 1.6) * 0.025;
  const expansion = 1 + safeLevel * 0.8;
  const squash = 1 - safeLevel * 0.08;
  return new THREE.Vector3(expansion * breath, expansion * squash, expansion * breath);
}

export function createBubble(): BubbleVisual {
  const geometry = new THREE.IcosahedronGeometry(RESTING_RADIUS_METERS, 5);
  const material = new THREE.MeshPhysicalMaterial({
    color: '#f97316',
    emissive: '#6d28d9',
    emissiveIntensity: 0.25,
    roughness: 0.22,
    metalness: 0.05,
    transparent: true,
    opacity: 0.87,
  });
  const bubble = new THREE.Mesh(geometry, material);
  const contact = new THREE.Mesh(
    new THREE.RingGeometry(0.082, 0.092, 48),
    new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  contact.rotation.x = -Math.PI / 2;
  const group = new THREE.Group();
  group.add(contact, bubble);

  return {
    group,
    update(level, elapsedSeconds) {
      const safeLevel = clampLevel(level);
      const scale = bubbleScale(safeLevel, elapsedSeconds);
      bubble.scale.copy(scale);
      bubble.position.y = RESTING_RADIUS_METERS * scale.y;
      material.emissiveIntensity = 0.25 + safeLevel * 0.8;
      material.color.setHSL(0.06 + safeLevel * 0.07, 0.92, 0.58);
      contact.material.opacity = 0.42 + safeLevel * 0.25;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      contact.geometry.dispose();
      (contact.material as THREE.Material).dispose();
    },
  };
}