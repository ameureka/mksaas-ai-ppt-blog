'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type VideoStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'verifying'
  | 'completed'
  | 'error'
  | 'skipped';

interface UseRewardedVideoOptions {
  pptId: string;
  videoDuration?: number;
  minWatchPercentage?: number;
  skipAllowedAfter?: number;
}

interface UseRewardedVideoReturn {
  status: VideoStatus;
  currentTime: number;
  duration: number;
  canSkip: boolean;
  skipCountdown: number;
  downloadLink: string | null;
  error: Error | null;

  load: () => Promise<void>;
  play: () => void;
  pause: () => void;
  skip: () => void;
  complete: () => Promise<void>;
  reset: () => void;
  handleTimeUpdate: (currentTime: number) => void;
  bindVideoElement: (video: HTMLVideoElement | null) => void;
}

class AntiCheatDetector {
  private focusLostTime = 0;
  private lastCheckTime = Date.now();
  private focusHandler: (() => void) | null = null;
  private seekingHandler: (() => void) | null = null;
  private rateChangeHandler: (() => void) | null = null;

  // 监测页面焦点
  setupFocusDetection(video: HTMLVideoElement, onPause: () => void) {
    this.focusHandler = () => {
      if (document.hidden) {
        onPause(); // 页面隐藏时暂停视频
        this.focusLostTime += Date.now() - this.lastCheckTime;
      } else {
        this.lastCheckTime = Date.now();
      }
    };
    document.addEventListener('visibilitychange', this.focusHandler);
  }

  // 阻止快进
  preventSeeking(video: HTMLVideoElement, getCurrentTime: () => number) {
    this.seekingHandler = () => {
      const maxAllowedTime = getCurrentTime() + 1; // 允许1秒误差
      if (video.currentTime > maxAllowedTime) {
        // console.log('[AntiCheat] 检测到非法快进，重置进度');
        video.currentTime = getCurrentTime();
      }
    };
    video.addEventListener('seeking', this.seekingHandler);
  }

  // 强制1倍速
  enforcePlaybackRate(video: HTMLVideoElement) {
    this.rateChangeHandler = () => {
      if (video.playbackRate !== 1) {
        // console.log('[AntiCheat] 检测到非法倍速，重置为1倍速');
        video.playbackRate = 1;
      }
    };
    video.addEventListener('ratechange', this.rateChangeHandler);
  }

  // 清理监听器
  cleanup(video: HTMLVideoElement | null) {
    if (this.focusHandler) {
      document.removeEventListener('visibilitychange', this.focusHandler);
    }
    if (video) {
      if (this.seekingHandler)
        video.removeEventListener('seeking', this.seekingHandler);
      if (this.rateChangeHandler)
        video.removeEventListener('ratechange', this.rateChangeHandler);
    }
  }

  // 验证观看有效性
  validate(reportedWatchTime: number, startTimestamp: number): boolean {
    const realTimePassed = (Date.now() - startTimestamp) / 1000;
    const timeDrift = Math.abs(realTimePassed - reportedWatchTime);

    // 允许3秒偏差
    if (timeDrift > 3) {
      console.log('[AntiCheat] 时间偏差过大:', timeDrift);
      return false;
    }

    // 焦点丢失时间不能超过10秒
    if (this.focusLostTime > 10000) {
      console.log('[AntiCheat] 焦点丢失时间过长:', this.focusLostTime);
      return false;
    }

    return true;
  }
}

export function useRewardedVideo(
  options: UseRewardedVideoOptions
): UseRewardedVideoReturn {
  const {
    pptId,
    videoDuration = 30,
    minWatchPercentage = 0.8,
    skipAllowedAfter = 15,
  } = options;

  const [status, setStatus] = useState<VideoStatus>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const viewIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const antiCheatRef = useRef<AntiCheatDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const skipCountdown = Math.max(0, Math.ceil(skipAllowedAfter - currentTime));

  useEffect(() => {
    antiCheatRef.current = new AntiCheatDetector();
    return () => {
      if (antiCheatRef.current && videoRef.current) {
        antiCheatRef.current.cleanup(videoRef.current);
      }
    };
  }, []);

  const bindVideoElement = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video && antiCheatRef.current) {
      // 绑定防作弊监听
      antiCheatRef.current.setupFocusDetection(video, () => {
        // 页面隐藏时暂停
        video.pause();
        setStatus('paused');
      });

      antiCheatRef.current.preventSeeking(video, () => video.currentTime);
      antiCheatRef.current.enforcePlaybackRate(video);
    }
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // 加载广告
  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      // TODO: 调用API开始观看
      // const { viewId, token } = await startWatching({ pptId, videoDuration });
      // viewIdRef.current = viewId;
      // tokenRef.current = token;

      // Mock
      viewIdRef.current = `view_${Date.now()}`;
      tokenRef.current = 'mock_token';

      await new Promise((resolve) => setTimeout(resolve, 2000)); // 模拟加载

      startTimeRef.current = Date.now();
      setStatus('ready');

      if (antiCheatRef.current) {
        antiCheatRef.current = new AntiCheatDetector();
        if (videoRef.current) bindVideoElement(videoRef.current);
      }
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  }, [pptId, videoDuration, bindVideoElement]);

  // 播放
  const play = useCallback(() => {
    setStatus('playing');
  }, []);

  // 暂停
  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  // 跳过
  const skip = useCallback(() => {
    if (!canSkip) return;
    setStatus('skipped');
    // TODO: 调用API记录跳过
  }, [canSkip]);

  // 完成观看
  const complete = useCallback(async () => {
    setStatus('verifying');

    try {
      if (antiCheatRef.current) {
        const isValid = antiCheatRef.current.validate(
          currentTime,
          startTimeRef.current
        );
        if (!isValid) {
          throw new Error('验证失败：检测到异常观看行为');
        }
      }

      // TODO: 调用API验证并获取下载链接
      // const { downloadLink } = await completeWatching({
      //   viewId: viewIdRef.current!,
      //   token: tokenRef.current!,
      //   watchTime: currentTime,
      // });

      // Mock
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockDownloadLink = `/api/download/ppt/${pptId}?token=reward_${Date.now()}`;

      setDownloadLink(mockDownloadLink);
      setStatus('completed');
    } catch (err) {
      setError(err as Error);
      setStatus('error');
    }
  }, [pptId, currentTime]);

  // 重置
  const reset = useCallback(() => {
    setStatus('idle');
    setCurrentTime(0);
    setCanSkip(false);
    setDownloadLink(null);
    setError(null);
    viewIdRef.current = null;
    tokenRef.current = null;
    if (antiCheatRef.current && videoRef.current) {
      antiCheatRef.current.cleanup(videoRef.current);
    }
  }, []);

  // 更新时间时检查状态
  useEffect(() => {
    if (currentTime >= skipAllowedAfter && !canSkip) {
      setCanSkip(true);
    }

    if (
      currentTime >= videoDuration * minWatchPercentage &&
      status === 'playing'
    ) {
      complete();
    }
  }, [
    currentTime,
    skipAllowedAfter,
    canSkip,
    videoDuration,
    minWatchPercentage,
    status,
    complete,
  ]);

  return {
    status,
    currentTime,
    duration: videoDuration,
    canSkip,
    skipCountdown,
    downloadLink,
    error,
    load,
    play,
    pause,
    skip,
    complete,
    reset,
    handleTimeUpdate,
    bindVideoElement,
  };
}

// 导出给外部使用的辅助函数
export function updateCurrentTime(
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>,
  time: number
) {
  setCurrentTime(time);
}
