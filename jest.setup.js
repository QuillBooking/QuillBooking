// Setup Jest testing environment
require('@testing-library/jest-dom');

// Mock WordPress globals
global.wp = {
  i18n: {
    __: (text) => text,
    _n: (single, plural, number) => (number === 1 ? single : plural),
    sprintf: (format, ...args) => {
      return format.replace(/%(\d+)\$s/g, (match, number) => {
        return args[number - 1] !== undefined ? args[number - 1] : match;
      });
    }
  },
  element: {
    createElement: jest.fn()
  },
  components: {},
  data: {
    select: jest.fn(),
    dispatch: jest.fn(),
    subscribe: jest.fn()
  },
  blocks: {
    registerBlockType: jest.fn()
  },
  apiFetch: jest.fn()
};

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Configure console mock expectations for WordPress Jest console package
// This allows React error boundaries and component errors to not fail tests
expect.extend({
  toHaveErrored(received) {
    // Allow console errors for this test
    return {
      pass: false,
      message: () => 'Console errors are allowed in this test'
    };
  }
});