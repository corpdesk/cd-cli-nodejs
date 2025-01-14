import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable unused-imports/no-unused-vars */
import { exec } from 'node:child_process';
/* eslint-disable node/prefer-global/process */
import fs, { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, jest, test } from '@jest/globals';
import axios from 'axios';

jest.mock('axios');

jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/'),
}));

jest.mock('chalk', () => ({
  green: jest.fn((text: string) => text),
  red: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
}));

const execPromise = promisify(exec);

const TEMP_DIR = resolve('./temp-tests');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  process.env.CD_CLI_ENCRYPT_KEY =
    '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'; // Example 64-character key
  process.env.CD_CLI_CONFIG_PATH = './test-config.json'; // Example configuration path
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR);
  }
  (axios.get as jest.Mock).mockReset();
  (axios.post as jest.Mock).mockReset();
  try {
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR);
    }
  } catch (error) {
    console.error(`Failed to create TEMP_DIR: ${(error as Error).message}`);
  }
});

afterAll(() => {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  jest.restoreAllMocks();
  delete process.env.CD_CLI_ENCRYPT_KEY;
  delete process.env.CD_CLI_CONFIG_PATH;
});

expect.extend({
  toBeValidPath(received) {
    const pass = existsSync(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid path`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid path`,
        pass: false,
      };
    }
  },
});

export async function runCliCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execPromise(`pnpm ${command}`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to execute command: ${command}`);
  }
}

export async function createTestModule(
  moduleBuilder: (builder: typeof Test) => Promise<TestingModule>,
): Promise<TestingModule> {
  try {
    const moduleRef = await moduleBuilder(Test);
    if (!moduleRef) {
      throw new Error('Failed to build TestingModule.');
    }
    return moduleRef;
  } catch (error) {
    console.error('Error during module creation:', (error as Error).message);
    throw error;
  }
}

export function mockPathJoin() {
  jest.mock('path', () => ({
    join: (...args: string[]) => args.join('/'),
  }));
}
