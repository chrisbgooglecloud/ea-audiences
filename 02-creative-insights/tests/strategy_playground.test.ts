import { expect, test, describe } from 'vitest';
import { AppMode } from '../types';
import fs from 'fs';
import path from 'path';

describe('Strategy Module / Agent Playground Integration', () => {
  test('AppMode includes AGENT_PLAYGROUND', () => {
    expect(Object.values(AppMode)).toContain('AGENT_PLAYGROUND');
  });

  test('AppMode includes AGENT_PLAYGROUND mode definition', () => {
    expect(Object.values(AppMode)).toContain('AGENT_PLAYGROUND');
  });
});
