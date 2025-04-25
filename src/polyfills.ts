// src/polyfills.ts
// Ensure the buffer module is available globally
import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

// Make sure global is defined
window.global = window.global || window;

// Provide process for any dependencies that might need it
import process from 'process';
window.process = window.process || process;