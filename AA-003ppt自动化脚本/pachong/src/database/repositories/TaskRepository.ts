import { getDb } from '../db';

export interface Task {
  id: number;
  url: string;
  type: 'list' | 'detail';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retry_count: number;
  meta: string | null;
  error_msg: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTaskInput = Pick<Task, 'url' | 'type'> & Partial<Pick<Task, 'meta' | 'status'>>;

export class TaskRepository {
  
  static createOrUpdate(input: CreateTaskInput) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO tasks (url, type, status, meta, updated_at)
      VALUES (@url, @type, @status, @meta, CURRENT_TIMESTAMP)
      ON CONFLICT(url) DO UPDATE SET
        type = excluded.type,
        updated_at = CURRENT_TIMESTAMP,
        -- Only update status if it's not already COMPLETED (optional logic, but good for idempotency)
        -- actually, for this crawler, if we re-queue a URL, we might want to process it again if it failed,
        -- but if it's completed, maybe not?
        -- For now, let's reset status to PENDING if we explicitly upsert it, 
        -- assuming the caller knows what they are doing (e.g. re-crawl).
        status = excluded.status,
        meta = excluded.meta
    `);
    
    stmt.run({
      url: input.url,
      type: input.type,
      status: input.status || 'PENDING',
      meta: input.meta || null
    });
  }

  static findPendingTasks(limit: number = 10): Task[] {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM tasks 
      WHERE status = 'PENDING' 
      ORDER BY created_at ASC 
      LIMIT ?
    `).all(limit) as Task[];
  }

  static markAsProcessing(id: number) {
    const db = getDb();
    db.prepare(`
      UPDATE tasks SET status = 'PROCESSING', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  }

  static markAsCompleted(id: number, meta?: object) {
    const db = getDb();
    const metaStr = meta ? JSON.stringify(meta) : null;
    
    if (metaStr) {
         db.prepare(`
            UPDATE tasks SET status = 'COMPLETED', meta = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(metaStr, id);
    } else {
        db.prepare(`
            UPDATE tasks SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(id);
    }
  }

  static markAsFailed(id: number, error: string) {
    const db = getDb();
    db.prepare(`
      UPDATE tasks SET status = 'FAILED', error_msg = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(error, id);
  }
  
  static incrementRetry(id: number) {
      const db = getDb();
      db.prepare(`
        UPDATE tasks SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(id);
  }

  static resetToPending(id: number) {
      const db = getDb();
      db.prepare(`
        UPDATE tasks SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(id);
  }
  
  // Helper for testing
  static findByUrl(url: string): Task | undefined {
      return getDb().prepare('SELECT * FROM tasks WHERE url = ?').get(url) as Task | undefined;
  }
}
