// Firebase ships getReactNativePersistence in its React Native build, but the package's top-level
// "types" entry points TypeScript at the browser typings, which leave it out. Metro resolves the
// React Native build at runtime, so only the type needs declaring.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
