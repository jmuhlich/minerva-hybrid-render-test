import { p as process } from './process-2545f00a.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'loader assertion failed.');
  }
}

const isBrowser = Boolean(typeof process !== 'object' || String(process) !== '[object process]' || process.browser);
const matches = typeof process !== 'undefined' && process.version && /v([0-9]*)/.exec(process.version);
matches && parseFloat(matches[1]) || 0;

export { assert as a, isBrowser as i };
