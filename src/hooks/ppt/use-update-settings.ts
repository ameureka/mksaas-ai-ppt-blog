'use client';

import { updateSettings } from '@/actions/ppt';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseUpdateSettingsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseUpdateSettingsReturn {
  updateSettingsMutation: (
    settings: Record<string, unknown>
  ) => Promise<ServerActionResult<void>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpdateSettings(
  options?: UseUpdateSettingsOptions
): UseUpdateSettingsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettingsMutation = useCallback(
    async (
      settings: Record<string, unknown>
    ): Promise<ServerActionResult<void>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await updateSettings(settings);

        if (result.success) {
          toast.success('设置已更新');
          options?.onSuccess?.();
        } else {
          const errorMsg = result.error ?? '保存失败';
          setError(errorMsg);
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '保存失败';
        setError(errorMsg);
        toast.error(errorMsg);
        options?.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateSettingsMutation,
    isLoading,
    error,
    reset,
  };
}
