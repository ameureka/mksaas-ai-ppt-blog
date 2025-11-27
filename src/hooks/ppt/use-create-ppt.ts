'use client';

import { createPPT } from '@/actions/ppt';
import type { CreatePPTInput, PPT } from '@/lib/types/ppt/ppt';
import type { ServerActionResult } from '@/lib/types/ppt/server-action';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseCreatePPTOptions {
  onSuccess?: (data: PPT) => void;
  onError?: (error: string) => void;
}

interface UseCreatePPTReturn {
  createPPTMutation: (data: CreatePPTInput) => Promise<ServerActionResult<PPT>>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useCreatePPT(
  options?: UseCreatePPTOptions
): UseCreatePPTReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPPTMutation = useCallback(
    async (data: CreatePPTInput): Promise<ServerActionResult<PPT>> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createPPT(data);

        if (result.success) {
          toast.success('PPT 已成功创建');
          options?.onSuccess?.(result.data);
        } else {
          const errorMsg = result.error || '创建失败';
          setError(errorMsg);
          toast.error(errorMsg);
          options?.onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '创建失败';
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
    createPPTMutation,
    isLoading,
    error,
    reset,
  };
}
