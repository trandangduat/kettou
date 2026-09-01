import { logout, meQueryOptions } from "#/api/auth";
import { Avatar, AvatarImage } from "#/components/ui/avatar";
import { connectSocket, disconnectSocket } from "#/socket";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

function Logo() {
    return (
        <div className="font-bold">
            <Link to="/">kettou.</Link>
        </div>
    );
}

let links = [
    { name: "Browse", href: "/browse" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Help", href: "#" },
];

function NavLinks() {
    return (
        <div className="flex gap-6">
            {links.map((link) => (
                <Link
                    className="lowercase font-semibold text-muted-foreground hover:text-foreground transition"
                    key={link.name}
                    to={link.href}
                >
                    {link.name}
                </Link>
            ))}
        </div>
    );
}

export function NavBar() {
    const { data: user } = useQuery(meQueryOptions);
    const router = useRouter();
    const queryClient = useQueryClient();
    const logoutMutation = useMutation({
        mutationFn: logout,
        onSuccess: async () => {
            disconnectSocket();
            await router.invalidate();
            queryClient.invalidateQueries({ queryKey: ["me"] });
            // window.location.reload();
        },
    });
    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
    };
    useEffect(() => {
        connectSocket();
    }, []);

    return (
        <div className="fixed flex justify-center w-full top-0 left-0 z-50">
            <div className="flex items-center justify-between w-full max-w-7xl bg-card p-4 mt-6 rounded-xl">
                <Logo />
                <NavLinks />
                {user ? (
                    <div className="flex gap-4">
                        <Link
                            to="/profile/setting"
                            className="flex flex-row gap-1 items-center"
                        >
                            <Avatar className="border-2 border-primary">
                                <AvatarImage src={user.avatarUrls.small} />
                            </Avatar>
                            <p className="text-primary font-bold">
                                {user.id}
                            </p>
                        </Link>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <div className="flex gap-2 items-center">
                        <Link
                            to="/login"
                            className="text-muted-foreground hover:text-primary transition font-semibold"
                        >
                            login
                        </Link>
                        <Link
                            to="/register"
                            className="text-muted-foreground hover:text-card-foreground transition font-semibold"
                        >
                            register
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
