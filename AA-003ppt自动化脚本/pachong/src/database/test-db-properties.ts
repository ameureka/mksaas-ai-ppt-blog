import fc from 'fast-check';
import { TaskRepository } from './repositories/TaskRepository';
import { getDb, closeDb } from './db';
import { resolve } from 'path';
import fs from 'fs-extra';
import { resetConfig } from '../config';

console.log('Running Property Tests for Database Layer...');

const TEST_DB_PATH = resolve(__dirname, '../../test-db.sqlite');

// Helper to setup clean DB
function setupTestDb() {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
        fs.unlinkSync(TEST_DB_PATH);
    }
    // Mock Config
    process.env.DB_PATH = TEST_DB_PATH;
    process.env.DOWNLOAD_DIR = '/tmp';
    resetConfig(); 
}

// Property 1: Idempotence of URL insertion
console.log('  Testing Property 1: Idempotence of URL insertion...');
setupTestDb();

fc.assert(
    fc.property(fc.webUrl(), fc.string(), (url, meta) => {
        // Run twice
        TaskRepository.createOrUpdate({ url, type: 'list', meta });
        TaskRepository.createOrUpdate({ url, type: 'list', meta });
        
        const task = TaskRepository.findByUrl(url);
        if (!task) throw new Error('Task not found');
        
        // Check count
        const count = getDb().prepare('SELECT count(*) as c FROM tasks WHERE url = ?').get(url) as any;
        return count.c === 1;
    }),
    { numRuns: 50 }
);

// Property 2: State Transition Consistency
console.log('  Testing Property 2: State Transition Consistency...');
setupTestDb();

fc.assert(
    fc.property(fc.webUrl(), (url) => {
         TaskRepository.createOrUpdate({ url, type: 'detail' });
         const task = TaskRepository.findByUrl(url);
         if (!task) return false;
         
         // Mark processing
         const t0 = new Date(task.updated_at).getTime();
         
         // Sleep 1ms to ensure timestamp change (sqlite is second precision by default usually? 
         // Better-sqlite3 might handle CURRENT_TIMESTAMP as string. 
         // Actually sqlite CURRENT_TIMESTAMP is second precision. 
         // So we might not see a change unless we wait 1s.
         // Let's just check status.
         
         TaskRepository.markAsProcessing(task.id);
         const processed = TaskRepository.findByUrl(url);
         
         if (processed?.status !== 'PROCESSING') throw new Error('Status failed to update to PROCESSING');
         
         TaskRepository.markAsCompleted(task.id);
         const completed = TaskRepository.findByUrl(url);
         if (completed?.status !== 'COMPLETED') throw new Error('Status failed to update to COMPLETED');
         
         return true;
    }),
    { numRuns: 20 }
);

// Cleanup
closeDb();
if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
}

console.log('✅ All DB Property Tests Passed!');
