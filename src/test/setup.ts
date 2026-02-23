import "@testing-library/jest-dom/vitest";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,

      addEventListener: () => {
      },

      removeEventListener: () => {
      },

      addListener: () => {
      },

      removeListener: () => {
      },

      dispatchEvent: () => false,
    }),
  });
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {
    }

    unobserve() {
    }

    disconnect() {
    }
  }
  window.ResizeObserver = ResizeObserverMock;
}

if (!window.HTMLElement.prototype.setPointerCapture) {
  window.HTMLElement.prototype.setPointerCapture = () => {
  };
}

if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.releasePointerCapture = () => {
  };
}
