/**
 * PPT 模块 Hooks 统一导出
 */

// Query Hooks
export { useGetPPTs } from './use-get-ppts';
export { useGetPPT } from './use-get-ppt';
export { useGetUsers } from './use-get-users';
export { useGetUser } from './use-get-user';
export { useGetDashboardStats } from './use-get-dashboard-stats';

// PPT Mutation Hooks
export { useCreatePPT } from './use-create-ppt';
export { useUpdatePPT } from './use-update-ppt';
export { useDeletePPT } from './use-delete-ppt';

// User Mutation Hooks
export { useUpdateUser } from './use-update-user';
export { useBanUser } from './use-ban-user';
export { useAdjustCredits } from './use-adjust-credits';

// Settings Mutation Hooks
export { useUpdateSettings } from './use-update-settings';

// Video Hooks
export { useRewardedVideo } from './use-rewarded-video';
