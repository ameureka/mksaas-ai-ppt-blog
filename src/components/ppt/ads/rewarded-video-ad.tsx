'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useRewardedVideo } from '@/hooks/ppt/use-rewarded-video';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Coins,
  Download,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import * as React from 'react';

interface RewardedVideoAdProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pptId: string;
  pptTitle: string;
  onComplete?: (result: { downloadUrl: string; credits: number }) => void;
  onSkip?: () => void;
  onError?: (error: Error) => void;
  onRewatch?: () => void;
  onUseCredits?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function VideoControls({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  onPlayPause,
  onMuteToggle,
}: {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onMuteToggle}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
        <div className="flex-1">
          <Progress value={(currentTime / duration) * 100} className="h-1" />
        </div>
        <span className="text-white text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

function SkipButton({
  canSkip,
  countdown,
  onSkip,
}: { canSkip: boolean; countdown: number; onSkip: () => void }) {
  return (
    <div className="absolute bottom-20 right-4">
      {canSkip ? (
        <Button
          variant="secondary"
          className="bg-black/60 hover:bg-black/80 text-white"
          onClick={onSkip}
        >
          跳过广告
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      ) : (
        <Badge variant="secondary" className="bg-black/60 text-white px-4 py-2">
          {countdown}秒后可跳过
        </Badge>
      )}
    </div>
  );
}

export function RewardedVideoAd({
  open,
  onOpenChange,
  pptId,
  pptTitle,
  onComplete,
  onSkip,
  onError,
  onRewatch,
  onUseCredits,
}: RewardedVideoAdProps) {
  const {
    status,
    currentTime,
    duration,
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
  } = useRewardedVideo({ pptId, videoDuration: 30, minWatchPercentage: 0.8 });

  const [isMuted, setIsMuted] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      bindVideoElement(videoRef.current);
    }
  }, [bindVideoElement, status]);

  React.useEffect(() => {
    if (open && status === 'idle') {
      load();
    } else if (!open && status !== 'idle') {
      reset();
    }
  }, [open, status, load, reset]);

  React.useEffect(() => {
    if (status === 'completed' && downloadLink) {
      onComplete?.({
        downloadUrl: downloadLink,
        credits: 1,
      });
    } else if (status === 'error' && error) {
      onError?.(error);
    }
  }, [status, error, onComplete, onError, downloadLink]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        play();
      } else {
        videoRef.current.pause();
        pause();
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoStart = () => {
    play();
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    skip();
    onSkip?.();
  };

  const handleRetry = () => {
    load();
  };

  const handleRewatch = () => {
    reset();
    load();
    onRewatch?.();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {status === 'completed'
              ? '下载权限已获得'
              : status === 'error'
                ? '广告加载失败'
                : status === 'skipped'
                  ? '已跳过广告'
                  : pptTitle}
          </DialogTitle>
          {(status === 'loading' ||
            status === 'ready' ||
            status === 'playing') && (
            <p className="text-center text-sm text-muted-foreground">
              观看广告免费下载此模板
            </p>
          )}
        </DialogHeader>

        {/* 状态1: Loading */}
        {status === 'loading' && (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-white/50 mx-auto" />
              <p className="text-white/70 mt-4">正在加载广告...</p>
            </div>
          </div>
        )}

        {/* 状态2: Ready */}
        {status === 'ready' && (
          <div
            className="aspect-video bg-black rounded-lg flex items-center justify-center cursor-pointer"
            onClick={handleVideoStart}
          >
            <div className="text-center">
              <Play className="h-16 w-16 text-white/80 mx-auto" />
              <p className="text-white/70 mt-4">点击播放</p>
            </div>
          </div>
        )}

        {/* 状态3: Playing / Paused */}
        {(status === 'playing' || status === 'paused') && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              className="w-full h-full object-contain"
              onTimeUpdate={(e) =>
                handleTimeUpdate(e.currentTarget.currentTime)
              }
              onEnded={() => {
                complete();
              }}
              onPlay={play}
              onPause={pause}
            />
            <VideoControls
              isPlaying={status === 'playing'}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              onPlayPause={handlePlayPause}
              onMuteToggle={handleMuteToggle}
            />
            <SkipButton
              canSkip={canSkip}
              countdown={skipCountdown}
              onSkip={handleSkip}
            />
          </div>
        )}

        {/* 状态: Verifying */}
        {status === 'verifying' && (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-white/50 mx-auto" />
              <p className="text-white/70 mt-4">正在验证观看...</p>
            </div>
          </div>
        )}

        {/* 状态4: Completed */}
        {status === 'completed' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-chart-4/20 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mt-6">
              恭喜! 您已获得下载权限
            </h3>
            <p className="text-muted-foreground mt-2">+1 积分已到账</p>
            <Button size="lg" className="mt-6" onClick={handleClose}>
              <Download className="mr-2 h-4 w-4" />
              立即下载
            </Button>
          </div>
        )}

        {/* 状态5: Error */}
        {status === 'error' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mt-6">加载失败</h3>
            <p className="text-muted-foreground mt-2">
              {error?.message || '广告加载失败，请重试'}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重试
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                选择其他方式
              </Button>
            </div>
          </div>
        )}

        {/* 状态6: Skipped */}
        {status === 'skipped' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
              <SkipForward className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mt-6">您已跳过广告</h3>
            <p className="text-muted-foreground mt-2">未能获得下载权限</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={handleRewatch}>
                <Play className="mr-2 h-4 w-4" />
                重新观看
              </Button>
              <Button variant="outline" onClick={() => onUseCredits?.()}>
                <Coins className="mr-2 h-4 w-4" />
                使用积分下载
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
