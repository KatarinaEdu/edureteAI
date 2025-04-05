import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense, cache } from "react";
import { v4 as uuidv4 } from "uuid";
import { SidebarList } from "./sidebar-list";
import { getUsersData, getChats } from "@/lib/redis-actions";
import { buttonVariants } from "@/components/ui/button";
import { Sidebar, SidebarContent } from "./ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/server";
import { Title } from "@/components/title";
import { SubscriptionButton } from "@/components/subscription-button";

const loadUsersData = cache(async () => {
  return await getUsersData();
});

const loadChats = cache(async (userId: string) => {
  return await getChats(userId);
});

export async function AppSidebar({ userId, user }: { userId: string | null | undefined; user: User | null | undefined }) {
  const chats = await loadChats(userId!);
  const userData = await loadUsersData();
  const role = user?.privateMetadata.role as string | null | undefined;

  return (
    <Sidebar>
      <SidebarContent className="pt-6 pb-2">
        <Title className="px-2 py-4" />
        <div className="mb-2 px-2">
          <Link
            href={`/c/${uuidv4()}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 w-full justify-start px-4 shadow-none transition-all border-emerald-500 text-white dark:text-emerald-500 bg-gradient-to-b from-emerald-500 to-emerald-300 dark:from-emerald-500/30 dark:to-transparent hover:text-gray-200 dark:hover:text-gray-300"
            )}
          >
            Novi razgovor
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="flex flex-col flex-1 px-4 space-y-4 overflow-auto">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full h-6 rounded-md shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              ))}
            </div>
          }
        >
          <SidebarList userId={userId} userData={userData} role={role} chats={chats} />
        </Suspense>
        <div className="px-2 py-2">
          <SubscriptionButton />
        </div>
        <div className="px-2 py-4 flex items-center gap-4">
          {userId && <UserButton />}
          <p className="text-sm">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
