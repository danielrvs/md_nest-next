/// <reference types="jest-extended" />
import 'jest-extended';
import { webcrypto } from 'node:crypto';

if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
        value: webcrypto,
        writable: true
    });
}