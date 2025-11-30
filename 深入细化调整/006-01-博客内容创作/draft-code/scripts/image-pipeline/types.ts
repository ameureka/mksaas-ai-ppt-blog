/**
 * 图片流水线类型定义
 */

export type TaskStatus = 'pending' | 'generated' | 'approved' | 'uploaded';
export type MediaStatus = 'none' | 'partial' | 'done';
export type TextStrategy = 'short-zh' | 'english' | 'blank';
export type SceneType = 'flow' | 'chart' | 'cards' | 'compare' | 'scene' | 'concept';

export interface CoverTask {
  filename: string;
  prompt: string;
  textStrategy: TextStrategy;
  textToRender: string;
  status: TaskStatus;
  generatedAt?: string;
  approvedAt?: string;
  uploadedAt?: string;
}

export interface InlineImageTask {
  filename: string;
  scene: string;
  sceneType: SceneType;
  prompt: string;
  status: TaskStatus;
  generatedAt?: string;
  approvedAt?: string;
  uploadedAt?: string;
}

export interface ImageTask {
  slug: string;
  title: string;
  shortTitleZh: string;
  shortTitleEn: string;
  category: string;
  categoryEn: string;
  styleHint: string;
  palette: string;
  keywords: string[];

  cover: CoverTask;
  inlineImages: InlineImageTask[];

  mediaStatus: MediaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ImageTasksData {
  version: string;
  generatedAt: string;
  totalTasks: number;
  tasks: ImageTask[];
}

/**
 * 计算任务的 mediaStatus
 */
export function calculateMediaStatus(task: ImageTask): MediaStatus {
  const coverDone = task.cover.status === 'approved' || task.cover.status === 'uploaded';
  const inlineDone = task.inlineImages.filter(
    (img) => img.status === 'approved' || img.status === 'uploaded'
  ).length;
  const totalInline = task.inlineImages.length;

  if (!coverDone && inlineDone === 0) return 'none';
  if (coverDone && inlineDone >= 3) return 'done';
  return 'partial';
}

/**
 * 验证 ImageTask 数据完整性
 */
export function validateImageTask(task: ImageTask): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.slug) errors.push('缺少 slug');
  if (!task.title) errors.push('缺少 title');
  if (!task.category) errors.push('缺少 category');
  if (!task.cover?.filename) errors.push('缺少封面文件名');
  if (!task.cover?.prompt) errors.push('缺少封面 Prompt');
  if (task.inlineImages.length < 3) errors.push('内页图片少于 3 张');

  for (let i = 0; i < task.inlineImages.length; i++) {
    const img = task.inlineImages[i];
    if (!img.filename) errors.push(`内页 ${i + 1} 缺少文件名`);
    if (!img.prompt) errors.push(`内页 ${i + 1} 缺少 Prompt`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 统计任务进度
 */
export interface TaskProgress {
  total: number;
  coverPending: number;
  coverGenerated: number;
  coverApproved: number;
  coverUploaded: number;
  inlinePending: number;
  inlineGenerated: number;
  inlineApproved: number;
  inlineUploaded: number;
  mediaStatusNone: number;
  mediaStatusPartial: number;
  mediaStatusDone: number;
}

export function calculateProgress(tasks: ImageTask[]): TaskProgress {
  const progress: TaskProgress = {
    total: tasks.length,
    coverPending: 0,
    coverGenerated: 0,
    coverApproved: 0,
    coverUploaded: 0,
    inlinePending: 0,
    inlineGenerated: 0,
    inlineApproved: 0,
    inlineUploaded: 0,
    mediaStatusNone: 0,
    mediaStatusPartial: 0,
    mediaStatusDone: 0,
  };

  for (const task of tasks) {
    // 封面统计
    switch (task.cover.status) {
      case 'pending': progress.coverPending++; break;
      case 'generated': progress.coverGenerated++; break;
      case 'approved': progress.coverApproved++; break;
      case 'uploaded': progress.coverUploaded++; break;
    }

    // 内页统计
    for (const img of task.inlineImages) {
      switch (img.status) {
        case 'pending': progress.inlinePending++; break;
        case 'generated': progress.inlineGenerated++; break;
        case 'approved': progress.inlineApproved++; break;
        case 'uploaded': progress.inlineUploaded++; break;
      }
    }

    // mediaStatus 统计
    switch (task.mediaStatus) {
      case 'none': progress.mediaStatusNone++; break;
      case 'partial': progress.mediaStatusPartial++; break;
      case 'done': progress.mediaStatusDone++; break;
    }
  }

  return progress;
}
