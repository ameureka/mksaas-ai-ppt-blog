import fc from 'fast-check';
import { ConfigManager } from './index';
import { isAbsolute, resolve } from 'path';

console.log('Running Property Tests for ConfigManager...');

// Property 1: Absolute path resolution
console.log('  Testing Property 1: Absolute path resolution...');
fc.assert(
  fc.property(fc.webUrl(), fc.string({ minLength: 1 }), (mockUrl, mockPath) => {
    // We mock env vars
    const env = {
      DOWNLOAD_DIR: mockPath,
      DB_PATH: './data.db',
    };
    // Mock root dir
    const rootDir = '/tmp/mock-root';
    
    try {
        const mgr = new ConfigManager(env, rootDir);
        const config = mgr.get();
        
        // Assertion: Path must be absolute
        if (!isAbsolute(config.DOWNLOAD_DIR)) {
            throw new Error(`Expected absolute path, got ${config.DOWNLOAD_DIR}`);
        }
        
        // Assertion: If input was relative, it should be resolved against rootDir
        if (!isAbsolute(mockPath)) {
            const expected = resolve(rootDir, mockPath);
            if (config.DOWNLOAD_DIR !== expected) {
                throw new Error(`Path mismatch. Expected ${expected}, got ${config.DOWNLOAD_DIR}`);
            }
        } else {
             // If input was absolute, it should be preserved (on POSIX systems, might differ on Windows if roots differ)
             // For simplicity in this env (darwin), it should match or be normalized.
             if (config.DOWNLOAD_DIR !== resolve(mockPath)) {
                 throw new Error(`Absolute path changed. Expected ${resolve(mockPath)}, got ${config.DOWNLOAD_DIR}`);
             }
        }
        return true;
    } catch (e) {
        // If it throws "Invalid configuration", that's fine if the random string was somehow invalid (empty), 
        // but we filtered minLength: 1.
        // Actually, resolve() shouldn't fail on strings. 
        // The only fail is schema validation.
        throw e;
    }
  }),
  { numRuns: 100 }
);

// Property 2: Rejection of missing required fields
console.log('  Testing Property 2: Rejection of missing required fields...');
fc.assert(
    fc.property(fc.object(), (randomObj) => {
        // We want to ensure that if DOWNLOAD_DIR is missing, it throws.
        // But randomObj might have it.
        const safeObj = { ...randomObj } as any;
        delete safeObj.DOWNLOAD_DIR;
        
        try {
            new ConfigManager(safeObj, '/tmp');
            return false; // Should have thrown
        } catch (e) {
            return (e as Error).message.includes('DOWNLOAD_DIR');
        }
    })
);

console.log('✅ All Property Tests Passed!');
