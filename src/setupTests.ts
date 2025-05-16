// src/setupTests.ts - File di configurazione per Jest
import '@testing-library/jest-dom';

// Mock per window.matchMedia (usato da hooks/use-mobile)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock per AbortSignal.timeout
if (!global.AbortSignal.timeout) {
  global.AbortSignal.timeout = jest.fn().mockImplementation((ms) => {
    const controller = new AbortController();
    return controller.signal;
  });
}

// MockIntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});