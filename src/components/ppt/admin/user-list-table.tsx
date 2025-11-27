'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import type { User } from '@/lib/types/ppt/user';
import { Coins, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface UserListTableProps {
  users: User[];
  onUserUpdate: (userId: string) => void;
}

export function UserListTable({ users, onUserUpdate }: UserListTableProps) {
  const [adjustCreditUserId, setAdjustCreditUserId] = useState<string | null>(
    null
  );
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');

  const handleBanUser = (userId: string, username: string) => {
    toast.success(`${ADMIN_I18N.user.banSuccess}: ${username}`);
    onUserUpdate(userId);
  };

  const handleUnbanUser = (userId: string, username: string) => {
    toast.success(`${ADMIN_I18N.user.unbanSuccess}: ${username}`);
    onUserUpdate(userId);
  };

  const handleAdjustCredits = () => {
    if (!creditAmount || !creditReason.trim()) {
      toast.error(ADMIN_I18N.validation.fillAll);
      return;
    }
    const amount = Number.parseInt(creditAmount);
    if (Number.isNaN(amount) || amount === 0) {
      toast.error(ADMIN_I18N.validation.invalidCredits);
      return;
    }
    const action = amount > 0 ? ADMIN_I18N.user.add : ADMIN_I18N.user.deduct;
    toast.success(
      `${ADMIN_I18N.user.creditsAdjustedPrefix}${action}${ADMIN_I18N.user.creditsAdjustedSuffix}: ${Math.abs(amount)}`
    );
    setAdjustCreditUserId(null);
    setCreditAmount('');
    setCreditReason('');
    if (adjustCreditUserId) onUserUpdate(adjustCreditUserId);
  };

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{ADMIN_I18N.user.userLabel}</TableHead>
              <TableHead>{ADMIN_I18N.user.emailLabel}</TableHead>
              <TableHead>{ADMIN_I18N.user.creditsLabel}</TableHead>
              <TableHead>{ADMIN_I18N.user.statusLabel}</TableHead>
              <TableHead>{ADMIN_I18N.user.registerTime}</TableHead>
              <TableHead>{ADMIN_I18N.user.lastLogin}</TableHead>
              <TableHead className="text-right">
                {ADMIN_I18N.common.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || '/placeholder.svg'} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.username}
                      </div>
                      {user.emailVerified && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          {ADMIN_I18N.user.verified}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{user.credits}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.status === 'active' && (
                    <Badge variant="default">
                      {ADMIN_I18N.user.statusActive}
                    </Badge>
                  )}
                  {user.status === 'banned' && (
                    <Badge variant="destructive">
                      {ADMIN_I18N.user.statusBanned}
                    </Badge>
                  )}
                  {user.status === 'suspended' && (
                    <Badge variant="secondary">
                      {ADMIN_I18N.user.statusSuspended}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setAdjustCreditUserId(user.id)}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        {ADMIN_I18N.user.adjustCredits}
                      </DropdownMenuItem>
                      {user.status === 'active' ? (
                        <DropdownMenuItem
                          onClick={() => handleBanUser(user.id, user.username)}
                          className="text-destructive"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {ADMIN_I18N.user.banUser}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            handleUnbanUser(user.id, user.username)
                          }
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          {ADMIN_I18N.user.unbanUser}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog
        open={adjustCreditUserId !== null}
        onOpenChange={(open) => !open && setAdjustCreditUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ADMIN_I18N.user.adjustCreditsTitle}</DialogTitle>
            <DialogDescription>
              {ADMIN_I18N.user.adjustCreditsDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{ADMIN_I18N.user.creditsAmount}</Label>
              <Input
                id="amount"
                type="number"
                placeholder={ADMIN_I18N.user.creditsPlaceholder}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{ADMIN_I18N.user.adjustReason}</Label>
              <Textarea
                id="reason"
                placeholder={ADMIN_I18N.user.reasonPlaceholder}
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustCreditUserId(null)}
            >
              {ADMIN_I18N.common.cancel}
            </Button>
            <Button onClick={handleAdjustCredits}>
              {ADMIN_I18N.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
