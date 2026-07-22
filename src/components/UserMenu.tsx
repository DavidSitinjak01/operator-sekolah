"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, KeyRound, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  onChangePassword: () => void;
  collapsed?: boolean;
}

export default function UserMenu({ onChangePassword, collapsed = false }: UserMenuProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const name = user?.name || "User";
  const role = ((session?.user as Record<string, unknown>)?.role as string) || "user";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isAdmin = role === "admin";

  // Role display: capitalize first letter for custom roles
  const roleDisplay = role === "admin"
    ? "Admin"
    : role === "user"
      ? "User"
      : role;

  const getRoleBadgeClass = (r: string) => {
    if (r === "admin") return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-600";
  };

  // Collapsed mode: show just avatar with tooltip
  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm hover:bg-emerald-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" sideOffset={8} align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground">({user?.email})</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onChangePassword}>
              <KeyRound className="w-4 h-4 mr-2" />
              Ganti Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  const badgeClass = getRoleBadgeClass(role);

  // Expanded mode
  return (
    <div className="px-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className={cn(
                  "text-xs font-semibold",
                  isAdmin
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 font-medium hover:bg-opacity-100",
                    badgeClass
                  )}
                >
                  {roleDisplay}
                </Badge>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">({user?.email})</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onChangePassword}>
            <KeyRound className="w-4 h-4 mr-2" />
            Ganti Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}