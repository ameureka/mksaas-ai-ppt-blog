'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  Gem,
  Gift,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface UserDownloadState {
  isLoggedIn: boolean;
  credits: number;
  isFirstDownload: boolean;
}

interface DownloadOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pptId: string;
  pptTitle: string;
  userState: UserDownloadState;
  creditCost?: number;
  initialStep?: 1 | 2 | 3;
  downloadUrl?: string;
  onSelectAd: () => void;
  onSelectCredit: () => void;
  onSelectRegister: () => void;
  onSelectInvite: () => void;
}

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits?: string[];
  badge?: string;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  extra?: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
}

function OptionCard({
  icon,
  title,
  description,
  benefits,
  badge,
  recommended,
  disabled,
  disabledReason,
  extra,
  onClick,
  selected,
}: OptionCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 border-2',
        'hover:shadow-md hover:scale-[1.01]',
        selected
          ? 'border-primary ring-1 ring-primary bg-primary/5'
          : 'border-transparent bg-card hover:bg-accent',
        !selected && recommended && 'border-primary/50',
        disabled &&
          'opacity-60 cursor-not-allowed hover:shadow-none hover:scale-100 hover:bg-card border-transparent'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl transition-colors',
            selected || recommended
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn('font-medium', selected && 'text-primary')}>
              {title}
            </h4>
            {badge && (
              <Badge
                variant={recommended || selected ? 'default' : 'secondary'}
                className="text-xs"
              >
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {disabled ? disabledReason : description}
          </p>
          {benefits && benefits.length > 0 && !disabled && (
            <div className="flex flex-wrap gap-3 mt-2">
              {benefits.map((benefit, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Check className="h-3 w-3 text-green-500" />
                  {benefit}
                </span>
              ))}
            </div>
          )}
          {extra && <div className="mt-3">{extra}</div>}
        </div>
        {!disabled && (
          <div
            className={cn(
              'shrink-0 transition-opacity',
              selected ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {selected ? (
              <Check className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { number: 1, label: '选择' },
    { number: 2, label: '确认' },
    { number: 3, label: '下载' },
  ];
  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isLast = index === steps.length - 1;
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                  isCompleted || isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isCompleted || isCurrent
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'w-12 h-[2px] mx-2 -mt-6 transition-colors',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DownloadOptionsModal({
  open,
  onOpenChange,
  pptId,
  pptTitle,
  userState: initialUserState,
  creditCost = 1,
  initialStep = 1,
  downloadUrl,
  onSelectAd,
  onSelectCredit,
  onSelectRegister,
  onSelectInvite,
}: DownloadOptionsModalProps) {
  const [userState, setUserState] =
    useState<UserDownloadState>(initialUserState);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep);
  const [selectedOption, setSelectedOption] = useState<
    'ad' | 'credits' | 'register' | 'invite'
  >('ad');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
      setIsProcessing(false);
      if (userState.isLoggedIn && userState.credits >= creditCost) {
        setSelectedOption('ad');
      } else if (!userState.isLoggedIn) {
        setSelectedOption('ad');
      } else {
        setSelectedOption('ad');
      }
    }
  }, [open, userState, creditCost, initialStep]);

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleConfirmAction();
    }
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    switch (selectedOption) {
      case 'ad':
        onSelectAd();
        break;
      case 'credits':
        onSelectCredit();
        break;
      case 'register':
        onSelectRegister();
        break;
      case 'invite':
        onSelectInvite();
        break;
    }
    setIsProcessing(false);
  };

  const renderStep2Content = () => (
    <div className="py-6 text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
        {selectedOption === 'ad' && (
          <PlayCircle className="w-8 h-8 text-primary" />
        )}
        {selectedOption === 'credits' && (
          <Gem className="w-8 h-8 text-primary" />
        )}
        {selectedOption === 'register' && (
          <Gift className="w-8 h-8 text-primary" />
        )}
        {selectedOption === 'invite' && (
          <Copy className="w-8 h-8 text-primary" />
        )}
      </div>
      <h3 className="text-xl font-semibold">
        {selectedOption === 'ad' && '准备观看广告'}
        {selectedOption === 'credits' && '确认使用积分'}
        {selectedOption === 'register' && '前往注册'}
        {selectedOption === 'invite' && '复制邀请链接'}
      </h3>
      <p className="text-muted-foreground max-w-xs mx-auto">
        {selectedOption === 'ad' &&
          '观看一段30秒的视频广告，完成后即可免费下载此PPT模板。'}
        {selectedOption === 'credits' &&
          `将扣除 ${creditCost} 积分用于下载《${pptTitle}》。当前余额：${userState.credits} 积分。`}
        {selectedOption === 'register' &&
          '注册账号后即可获得5积分，免费下载5个PPT模板。'}
        {selectedOption === 'invite' &&
          '分享专属链接给好友，好友注册后您将获得奖励。'}
      </p>
    </div>
  );

  const renderStep3Content = () => (
    <div className="py-6 text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-chart-4/10 dark:bg-chart-4/30 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">准备就绪</h3>
        <p className="text-muted-foreground">
          您的下载链接已生成，请点击下方按钮开始下载。
        </p>
      </div>
      {downloadUrl && (
        <Button
          className="w-full h-12 text-lg gap-2"
          onClick={() => window.open(downloadUrl, '_blank')}
        >
          <Download className="w-5 h-5" /> 立即下载
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pptTitle}</DialogTitle>
        </DialogHeader>
        <Stepper currentStep={currentStep} />
        {currentStep === 1 && (
          <div className="space-y-3">
            <OptionCard
              icon={<PlayCircle className="h-6 w-6" />}
              title="观看广告下载"
              description="观看一段短视频（约30秒）即可免费下载"
              benefits={
                userState.isLoggedIn
                  ? ['完全免费', '无需积分', '立即获得']
                  : ['完全免费', '无需注册', '立即获得']
              }
              badge="推荐"
              recommended={true}
              selected={selectedOption === 'ad'}
              onClick={() => setSelectedOption('ad')}
            />
            {userState.isLoggedIn && (
              <OptionCard
                icon={<Gem className="h-6 w-6" />}
                title="使用积分下载"
                description="使用1积分立即下载，无需等待"
                badge={`余额: ${userState.credits}积分`}
                disabled={userState.credits < creditCost}
                disabledReason="⚠️ 积分不足，无法使用此方式"
                selected={selectedOption === 'credits'}
                onClick={() => setSelectedOption('credits')}
              />
            )}
            {!userState.isLoggedIn && (
              <OptionCard
                icon={<Gift className="h-6 w-6" />}
                title="注册获取积分"
                description="注册账号立即获得5积分，可下载5个PPT"
                benefits={['免费注册', '永久保存下载记录']}
                badge="+5积分"
                selected={selectedOption === 'register'}
                onClick={() => setSelectedOption('register')}
              />
            )}
            {userState.isLoggedIn && (
              <OptionCard
                icon={<Gift className="h-6 w-6" />}
                title="邀请好友获取积分"
                description="邀请1位好友注册，获得3积分奖励"
                selected={selectedOption === 'invite'}
                onClick={() => setSelectedOption('invite')}
              />
            )}
          </div>
        )}
        {currentStep === 2 && renderStep2Content()}
        {currentStep === 3 && renderStep3Content()}
        {currentStep !== 3 && (
          <DialogFooter className="mt-4">
            {currentStep === 2 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                disabled={isProcessing}
              >
                上一步
              </Button>
            )}
            <Button
              className="w-full h-11 text-lg font-medium"
              size="lg"
              onClick={handleNext}
              disabled={isProcessing}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {currentStep === 1 ? '下一步' : '确认'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
