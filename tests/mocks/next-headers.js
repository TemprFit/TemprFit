// Mock implementation of next/headers for test execution

let mockCookies = new Map();
let mockHeaders = new Headers();

export function setMockCookies(cookieObj) {
  mockCookies = new Map(Object.entries(cookieObj));
}

export function clearMockCookies() {
  mockCookies = new Map();
}

export function setMockHeaders(headersObj) {
  mockHeaders = new Headers(headersObj);
}

export function clearMockHeaders() {
  mockHeaders = new Headers();
}

export function cookies() {
  return {
    get(name) {
      if (!mockCookies.has(name)) return undefined;
      return { name, value: mockCookies.get(name) };
    },
    set(name, value) {
      mockCookies.set(name, value);
    },
    delete(name) {
      mockCookies.delete(name);
    },
  };
}

export function headers() {
  return mockHeaders;
}
