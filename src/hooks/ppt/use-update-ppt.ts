'use client';

import { updatePPT } from '@/actions/ppt';
import type { PPT, UpdatePPTInput } from '@/lib/types/ppt/ppt';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseUpdatePPTOptions {
  onSuccess?: (data: PPT) => void;
  onError?: (error: string) => void;
}

interface UseUpdatePPTReturn {
  updatePPTMutation: (
    id: string,
    data: UpdatePPTInput
  ) => Promise<ServerActionResult<PPT>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpdatePPT(
  options?: UseUpdatePPTOptions
): UseUpdatePPTReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePPTMutation = useCallback(
    async (
      id: string,
      data: UpdatePPTInput
    ): Promise<ServerActionResult<PPT>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await updatePPT(id, data);

        if (result.success) {
          toast.success('PPT 信息已更新');
          options?.onSuccess?.(result.data);
        } else {
          const errorMsg = result.error || '更新失败';
          setError(errorMsg);
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '更新失败';
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
    updatePPTMutation,
    isLoading,
    error,
    reset,
  };
}
