'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { websiteConfig } from '@/config/website';
import { LocaleLink } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { DiscordIcon } from '../icons/discord';

export function DiscordCard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-2 p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="size-4 flex items-center justify-center rounded bg-[#07C160] text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
              <path d="M8.5,13.5A2.5,2.5 0 0,0 11,11A2.5,2.5 0 0,0 8.5,8.5A2.5,2.5 0 0,0 6,11A2.5,2.5 0 0,0 8.5,13.5M16.5,14.5A2.5,2.5 0 0,0 19,12A2.5,2.5 0 0,0 16.5,9.5A2.5,2.5 0 0,0 14,12A2.5,2.5 0 0,0 16.5,14.5M3.5,11C3.5,17.5 7.5,22 13.5,22C14.5,22 15.5,21.8 16.5,21.5L20.5,23.5L19.5,19.5C21.5,17.5 22.5,15.5 22.5,12C22.5,5.5 17.5,1.5 12.5,1.5C7.5,1.5 3.5,6.5 3.5,11Z" />
            </svg>
          </span>
          加入微信群
        </CardTitle>
        <CardDescription className="text-xs">
          扫码加入用户交流群，获取最新资讯和帮助。
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex flex-col items-center">
        <div className="bg-white p-2 rounded-lg border shadow-sm">
          {/* Placeholder QR Code - 替换为真实二维码图片 */}
          <img
            src="/images/wechat-group-qr.png"
            alt="微信群二维码"
            className="size-32 object-contain"
            onError={(e) => {
              e.currentTarget.src =
                'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mksaas.com&color=07C160';
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          如二维码失效，请联系客服
        </p>
      </CardContent>
    </Card>
  );
}
