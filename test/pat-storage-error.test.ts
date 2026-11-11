// PAT storage error handling tests using Node's test runner
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { savePat, clearPat, isStorageAvailable } from '../lib/pat/storage.ts';

describe('PAT storage error handling', () => {
  test('savePat returns error when localStorage throws SecurityError', () => {
    const original = (global as any).localStorage;
    const mock = {
      setItem: () => { throw new Error('SecurityError'); },
      getItem: () => null,
      removeItem: () => {},
    } as unknown as Storage;
    Object.defineProperty(global, 'localStorage', { value: mock, configurable: true, writable: true });
    const result = savePat('ghp_dummyToken');
    assert.equal(result.success, false);
    assert.match(result.error ?? '', /Unable to save token/);
    Object.defineProperty(global, 'localStorage', { value: original, configurable: true, writable: true });
  });

  test('clearPat returns error when localStorage throws SecurityError', () => {
    const original = (global as any).localStorage;
    const mock = {
      setItem: () => {},
      getItem: () => null,
      removeItem: () => { throw new Error('SecurityError'); },
    } as unknown as Storage;
    Object.defineProperty(global, 'localStorage', { value: mock, configurable: true, writable: true });
    const result = clearPat();
    assert.equal(result.success, false);
    assert.match(result.error ?? '', /Unable to clear token/);
    Object.defineProperty(global, 'localStorage', { value: original, configurable: true, writable: true });
  });

  test('isStorageAvailable returns false when localStorage throws', () => {
    const original = (global as any).localStorage;
    const mock = {
      setItem: () => { throw new Error('QuotaExceeded'); },
      removeItem: () => {},
    } as unknown as Storage;
    Object.defineProperty(global, 'localStorage', { value: mock, configurable: true, writable: true });
    const result = isStorageAvailable();
    assert.equal(result, false);
    Object.defineProperty(global, 'localStorage', { value: original, configurable: true, writable: true });
  });
});
