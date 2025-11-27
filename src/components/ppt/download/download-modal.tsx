'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { authClient } from '@/lib/auth-client';
import {
  AlertCircle,
  Check,
  Clock,
  Coins,
  Copy,
  Download,
  Loader2,
  Play,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PPT {
  id: string;
  title: string;
  price?: number;
  isFirstDownloadFree?: boolean;
}

interface DownloadOption {
  type: 'firstFree' | 'credits' | 'ad' | 'register';
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  disabledReason?: string;
  requiredCredits?: number;
  rewardCredits?: number;
}

interface UserDownloadStatus {
  pptId: string;
  hasDownloadedBefore: boolean;
  isFirstDownloadAvailable: boolean;
  remainingFreeDownloads: number;
}

interface DownloadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ppt: PPT;
}

type DownloadMethod = 'firstFree' | 'credits' | 'ad' | 'register';
type FlowStep = 1 | 2 | 3;

export function DownloadModal({ open, onOpenChange, ppt }: DownloadModalProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [step, setStep] = useState<FlowStep>(1);
  const [selectedMethod, setSelectedMethod] =
    useState<DownloadMethod>('firstFree');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  const [adCompleted, setAdCompleted] = useState(false);
  const [userDownloadStatus, setUserDownloadStatus] =
    useState<UserDownloadStatus | null>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedMethod('firstFree');
      setIsProcessing(false);
      setDownloadLink(null);
      setError(null);
      setAgreedToTerms(false);
      setAdCountdown(30);
      setAdCompleted(false);
      fetchUserDownloadStatus();
    }
  }, [open, ppt.id]);

  const fetchUserDownloadStatus = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockStatus: UserDownloadStatus = {
        pptId: ppt.id,
        hasDownloadedBefore: false,
        isFirstDownloadAvailable: ppt.isFirstDownloadFree || false,
        remainingFreeDownloads: 1,
      };
      setUserDownloadStatus(mockStatus);
      if (
        !mockStatus.hasDownloadedBefore &&
        mockStatus.isFirstDownloadAvailable
      ) {
        setSelectedMethod('firstFree');
      } else {
        setSelectedMethod('credits');
      }
    } catch (err) {
      console.error('Failed to fetch download status', err);
    }
  };

  const downloadOptions: DownloadOption[] = [
    {
      type: 'firstFree',
      label: '首次免费下载',
      description: '首次下载此模板无需积分',
      icon: '🎁',
      enabled:
        (userDownloadStatus?.isFirstDownloadAvailable &&
          !userDownloadStatus?.hasDownloadedBefore) ||
        false,
      disabledReason: userDownloadStatus?.hasDownloadedBefore
        ? '您已下载过此模板'
        : '此模板不支持免费下载',
    },
    {
      type: 'credits',
      label: '积分下载',
      requiredCredits: ppt.price || 5,
      description: `使用 ${ppt.price || 5} 积分立即下载`,
      icon: '💎',
      enabled: true,
    },
    {
      type: 'ad',
      label: '观看广告下载',
      rewardCredits: 5,
      description: '观看30秒广告，获得5积分并下载',
      icon: '📺',
      enabled: true,
    },
    {
      type: 'register',
      label: '注册获得积分',
      rewardCredits: 10,
      description: '新用户注册即送10积分',
      icon: '🎉',
      enabled: !user,
    },
  ];

  const handleSelectMethod = (method: DownloadMethod) => {
    const option = downloadOptions.find((opt) => opt.type === method);
    if (option?.enabled) {
      setSelectedMethod(method);
    }
  };

  const handleContinue = () => {
    setError(null);
    if (selectedMethod === 'register') {
      toast.info('请先完成注册');
      onOpenChange(false);
      return;
    }
    if (selectedMethod === 'firstFree') {
      handleGenerateLink();
    } else {
      setStep(2);
    }
  };

  const handleConfirmMethod = async () => {
    if (selectedMethod === 'ad' && !adCompleted) {
      toast.error('请先观看完整广告');
      return;
    }
    await handleGenerateLink();
  };

  const handleGenerateLink = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockLink = `https://download.example.com/${ppt.id}/template.pptx?token=mock_token_${Date.now()}`;
      const mockExpiresAt = new Date(
        Date.now() + 48 * 60 * 60 * 1000
      ).toISOString();
      setDownloadLink(mockLink);
      setExpiresAt(mockExpiresAt);
      setStep(3);
      toast.success('下载链接已生成', { description: '链接48小时内有效' });
    } catch (err) {
      setError('生成下载链接失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    if (downloadLink) {
      navigator.clipboard.writeText(downloadLink);
      toast.success('链接已复制到剪贴板');
    }
  };

  const handleDirectDownload = () => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
      toast.success('开始下载');
    }
  };

  useEffect(() => {
    if (selectedMethod === 'ad' && step === 2 && adCountdown > 0) {
      const timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            setAdCompleted(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedMethod, step, adCountdown]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ppt.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Stepper */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                      step >= s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {s === 1 ? '选择' : s === 2 ? '确认' : '下载'}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors ${step > s ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Separator />

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">选择下载方式</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {downloadOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleSelectMethod(option.type)}
                    disabled={!option.enabled}
                    className="text-left"
                  >
                    <Card
                      className={`transition-all cursor-pointer ${
                        !option.enabled
                          ? 'opacity-50 cursor-not-allowed'
                          : selectedMethod === option.type
                            ? 'border-2 border-primary shadow-md'
                            : 'hover:border-primary/50'
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{option.icon}</div>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {option.label}
                                {!option.enabled && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    不可用
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {selectedMethod === option.type && option.enabled && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.enabled
                            ? option.description
                            : option.disabledReason}
                        </p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleContinue}
                disabled={
                  !downloadOptions.find((o) => o.type === selectedMethod)
                    ?.enabled
                }
              >
                继续
              </Button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">确认下载信息</h3>
              {selectedMethod === 'ad' && (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex flex-col items-center justify-center">
                      {!adCompleted ? (
                        <>
                          <Play className="h-16 w-16 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            广告视频播放中...
                          </p>
                          <Badge
                            variant="secondary"
                            className="mt-3 font-mono text-lg px-4 py-1"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            {adCountdown}s
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Check className="h-16 w-16 text-primary mb-4" />
                          <p className="text-sm font-medium text-primary">
                            广告已看完！
                          </p>
                        </>
                      )}
                    </div>
                    <Progress
                      value={((30 - adCountdown) / 30) * 100}
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              )}
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h4 className="font-medium text-sm">下载须知</h4>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• 下载链接48小时内有效</li>
                  <li>• 模板仅供个人学习和商业使用</li>
                </ul>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    我已阅读并同意相关条款
                  </label>
                </div>
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={isProcessing}
                >
                  返回
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleConfirmMethod}
                  disabled={isProcessing || !agreedToTerms}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '确认下载'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">下载链接已生成</h3>
                <p className="text-sm text-muted-foreground">
                  链接48小时内有效，请尽快下载
                </p>
              </div>
              {downloadLink && (
                <>
                  <Card>
                    <CardContent className="p-4">
                      <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all">
                        {downloadLink}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCopyLink}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      复制链接
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleDirectDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      立即下载
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
