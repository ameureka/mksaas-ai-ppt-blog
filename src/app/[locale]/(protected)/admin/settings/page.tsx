'use client';

import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateSettings } from '@/hooks/ppt/use-update-settings';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import { Bell, Database, Settings, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { updateSettingsMutation, isLoading: isSaving } = useUpdateSettings();
  const [siteName, setSiteName] = useState('PPT-AI');
  const [siteDescription, setSiteDescription] = useState(
    '3秒找到你要的PPT模板'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newUserCredits, setNewUserCredits] = useState('100');
  const [downloadCost, setDownloadCost] = useState('10');

  const handleSaveBasic = async () => {
    const result = await updateSettingsMutation({
      siteName,
      siteDescription,
      maintenanceMode,
    });
    if (result.success) {
      toast.success(ADMIN_I18N.settings.basicSaved);
    }
  };

  const handleSaveCredits = async () => {
    const result = await updateSettingsMutation({
      newUserCredits: Number.parseInt(newUserCredits),
      downloadCost: Number.parseInt(downloadCost),
    });
    if (result.success) {
      toast.success(ADMIN_I18N.settings.creditsSaved);
    }
  };

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: ADMIN_I18N.settings.pageTitle, isCurrentPage: true },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* 页面标题 */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {ADMIN_I18N.settings.pageTitle}
            </h1>
            <p className="text-muted-foreground mt-2">
              {ADMIN_I18N.settings.pageDesc}
            </p>
          </div>

          {/* 权限提示 */}
          <Card className="border-border bg-muted/50">
            <CardContent className="flex items-center gap-3 pt-6">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {ADMIN_I18N.settings.superAdminPerm}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ADMIN_I18N.settings.superAdminDesc}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 基础设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {ADMIN_I18N.settings.basicSettings}
              </CardTitle>
              <CardDescription>
                {ADMIN_I18N.settings.basicSettingsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">{ADMIN_I18N.settings.siteName}</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">
                  {ADMIN_I18N.settings.siteDesc}
                </Label>
                <Textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{ADMIN_I18N.settings.maintenanceMode}</Label>
                  <p className="text-sm text-muted-foreground">
                    {ADMIN_I18N.settings.maintenanceDesc}
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <Separator />

              <Button onClick={handleSaveBasic} disabled={isSaving}>
                {isSaving ? '保存中...' : ADMIN_I18N.settings.saveBasic}
              </Button>
            </CardContent>
          </Card>

          {/* 积分设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {ADMIN_I18N.settings.creditsSettings}
              </CardTitle>
              <CardDescription>
                {ADMIN_I18N.settings.creditsSettingsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserCredits">
                  {ADMIN_I18N.settings.newUserCredits}
                </Label>
                <Input
                  id="newUserCredits"
                  type="number"
                  value={newUserCredits}
                  onChange={(e) => setNewUserCredits(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {ADMIN_I18N.settings.newUserCreditsDesc}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downloadCost">
                  {ADMIN_I18N.settings.downloadCost}
                </Label>
                <Input
                  id="downloadCost"
                  type="number"
                  value={downloadCost}
                  onChange={(e) => setDownloadCost(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {ADMIN_I18N.settings.downloadCostDesc}
                </p>
              </div>

              <Separator />

              <Button onClick={handleSaveCredits} disabled={isSaving}>
                {isSaving ? '保存中...' : ADMIN_I18N.settings.saveCredits}
              </Button>
            </CardContent>
          </Card>

          {/* 功能开关 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {ADMIN_I18N.settings.featureSwitch}
              </CardTitle>
              <CardDescription>
                {ADMIN_I18N.settings.featureSwitchDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>{ADMIN_I18N.settings.userRegister}</Label>
                    <Badge variant="outline">
                      {ADMIN_I18N.settings.enabled}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ADMIN_I18N.settings.userRegisterDesc}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>{ADMIN_I18N.settings.emailVerify}</Label>
                    <Badge variant="outline">
                      {ADMIN_I18N.settings.enabled}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ADMIN_I18N.settings.emailVerifyDesc}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>{ADMIN_I18N.settings.creditSystem}</Label>
                    <Badge variant="outline">
                      {ADMIN_I18N.settings.enabled}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ADMIN_I18N.settings.creditSystemDesc}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* 系统信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {ADMIN_I18N.settings.systemInfo}
              </CardTitle>
              <CardDescription>
                {ADMIN_I18N.settings.systemInfoDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {ADMIN_I18N.settings.systemVersion}
                  </span>
                  <span className="font-medium text-foreground">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {ADMIN_I18N.settings.runEnv}
                  </span>
                  <span className="font-medium text-foreground">
                    Next.js 15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {ADMIN_I18N.settings.database}
                  </span>
                  <span className="font-medium text-foreground">
                    PostgreSQL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {ADMIN_I18N.settings.cache}
                  </span>
                  <span className="font-medium text-foreground">Redis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
