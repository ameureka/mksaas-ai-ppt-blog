'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { AdminRoutes, PublicRoutes } from '@/lib/constants/ppt-routes';
import {
  CreditCard,
  LogOut,
  Presentation,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NavigationHeader() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    toast.success('已退出登录');
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/auth/sign-in');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <LocaleLink
          href={PublicRoutes.Home}
          className="flex items-center space-x-2"
        >
          <Presentation className="h-6 w-6" />
          <span className="font-bold text-xl">PPT-AI</span>
        </LocaleLink>

        {/* Right side - Auth section */}
        <div className="flex items-center gap-4">
          <LocaleLink href={AdminRoutes.Dashboard}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">管理后台</span>
            </Button>
          </LocaleLink>

          {user ? (
            <>
              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.image || '/placeholder.svg'}
                        alt={user.name || ''}
                      />
                      <AvatarFallback>
                        {(user.name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LocaleLink href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <LocaleLink href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </LocaleLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={handleLogin} size="sm">
              登录 / 注册
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { NavigationHeader };
