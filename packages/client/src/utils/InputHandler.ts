import type { InputSnapshot } from '@sphere-coop/shared';

export class InputHandler {
  private keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  getSnapshot(): InputSnapshot {
    return {
      up:    this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down:  this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      left:  this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
    };
  }

  destroy(): void {
    // Listeners are scoped to window; caller should manage lifecycle
    this.keys.clear();
  }
}
