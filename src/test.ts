// Vitest setup file: the @angular/build:unit-test builder initialises the
// Angular test environment itself; this only adds Zone.js testing helpers
// (fakeAsync / waitForAsync) on top of the zone.js polyfill.
import 'zone.js/testing';

// jsdom has no IntersectionObserver; Ionic components such as ion-datetime use it.
if (!('IntersectionObserver' in globalThis)) {
  class NoopIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', { value: NoopIntersectionObserver, writable: true });
}
