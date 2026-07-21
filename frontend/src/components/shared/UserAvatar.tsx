import { cn } from "../../lib/utils";
import type { AuthUser } from "../../services/api";

type UserAvatarProps = {
  user: Pick<AuthUser, "name" | "avatarUrl"> | null | undefined;
  className?: string;
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initial = user?.name?.slice(0, 1).toUpperCase() || "U";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={cn("h-8 w-8 rounded-lg object-cover ring-1 ring-border", className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700",
        className,
      )}
    >
      {initial}
    </div>
  );
}
