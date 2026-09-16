import { logout, meQueryOptions } from "#/api/auth";
import { Avatar, AvatarImage } from "#/components/ui/avatar";
import { connectSocket, disconnectSocket } from "#/socket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
    HouseIcon,
    CompassIcon,
    TrophyIcon,
    QuestionIcon,
    SignOutIcon,
    SignInIcon,
    UserPlusIcon,
} from "@phosphor-icons/react";

const NAV_ITEMS = [
    { name: "Home", href: "/", icon: HouseIcon },
    { name: "Browse", href: "/browse", icon: CompassIcon },
    { name: "Leaderboard", href: "/leaderboard", icon: TrophyIcon },
    { name: "Help", href: "#", icon: QuestionIcon },
] as const;

const ITEM_STEP = 60; // 48px button height + 12px gap

function Logo() {
    return (
        <div className="flex flex-col items-center gap-1 font-bold">
            <Link
                to="/"
                className="text-primary flex items-center justify-center text-xl"
                title="KETTOU"
            >
                K
            </Link>
        </div>
    );
}

function NavDockLinks() {
    const routerState = useRouterState();
    const currentPath = routerState.location.pathname;

    const activeIndex = NAV_ITEMS.findIndex((item) => {
        if (item.href === "/") {
            return currentPath === "/";
        }
        return item.href !== "#" && currentPath.startsWith(item.href);
    });

    const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);
    const currentIndex = optimisticIndex !== null ? optimisticIndex : activeIndex;

    // Reset optimistic index when route navigation completes
    useEffect(() => {
        setOptimisticIndex(null);
    }, [currentPath]);

    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [indicatorTop, setIndicatorTop] = useState(() => {
        return activeIndex !== -1 ? activeIndex * ITEM_STEP : 0;
    });
    const [isReady, setIsReady] = useState(false);

    // Update indicator position whenever active route changes
    useEffect(() => {
        if (currentIndex !== -1) {
            const el = itemRefs.current[currentIndex];
            setIndicatorTop(el ? el.offsetTop : currentIndex * ITEM_STEP);
        }
    }, [currentIndex]);

    // Avoid initial sliding animation on first page load
    useEffect(() => {
        const raf = requestAnimationFrame(() => setIsReady(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <nav className="relative flex flex-col items-center gap-3">
            <div
                aria-hidden="true"
                className={`absolute top-0 left-0 size-12 rounded-lg bg-primary pointer-events-none ${
                    isReady
                        ? "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        : ""
                }`}
                style={{
                    transform: `translateY(${indicatorTop}px)`,
                    opacity: currentIndex !== -1 ? 1 : 0,
                }}
            />

            {NAV_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentIndex === index;

                return (
                    <Link
                        key={item.name}
                        ref={(el) => {
                            itemRefs.current[index] = el;
                        }}
                        to={item.href as any}
                        onClick={() => setOptimisticIndex(index)}
                        title={item.name}
                        className={`relative z-10 size-12 rounded-lg flex items-center justify-center select-none ${
                            isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                    >
                        <Icon
                            className="size-6"
                            weight={isActive ? "fill" : "regular"}
                        />
                    </Link>
                );
            })}
        </nav>
    );
}

function UserSection() {
    const { data: user } = useQuery(meQueryOptions);
    const router = useRouter();
    const queryClient = useQueryClient();

    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: async () => {
            disconnectSocket();
            await router.invalidate();
            queryClient.invalidateQueries({ queryKey: ["me"] });
        },
    });

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
    };

    return (
        <div className="flex flex-col items-center gap-3 pt-3 border-t border-border/40 w-full">
            {user ? (
                <>
                    <Link
                        to="/profile/setting"
                        title={`Profile: ${user.id}`}
                        className="group relative flex flex-col items-center"
                    >
                        <Avatar className="size-10 border-2 border-primary group-hover:scale-105 transition">
                            <AvatarImage src={user.avatarUrls?.small} />
                        </Avatar>
                    </Link>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    >
                        <SignOutIcon className="size-5" />
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <Link
                        to="/login"
                        title="Login"
                        className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                    >
                        <SignInIcon className="size-5" />
                    </Link>
                    <Link
                        to="/register"
                        title="Register"
                        className="size-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                    >
                        <UserPlusIcon className="size-5" />
                    </Link>
                </div>
            )}
        </div>
    );
}

export function NavDock() {
    useEffect(() => {
        connectSocket();
    }, []);

    return (
        <aside className="h-screen py-4 pl-4 flex flex-col shrink-0">
            <div className="w-18 h-full bg-card border border-border/60 rounded-md p-3 flex flex-col items-center justify-between shadow-xl">
                <Logo />
                <NavDockLinks />
                <UserSection />
            </div>
        </aside>
    );
}
