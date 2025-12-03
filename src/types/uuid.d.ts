/**
 * Type declarations for uuid module
 * Temporary fix until @types/uuid is properly installed
 */

declare module 'uuid' {
    export function v4(): string;
    export function v1(): string;
    export function v5(name: string | Buffer, namespace: string | Buffer): string;
    
    export namespace v4 {
      function randomUUID(): string;
    }
  }