import { fetchMe } from "#/api/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";

function Logo() {
    return <div className="font-bold">kettou.</div>;
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

export function NavBar({}) {
    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
        retry: false,
    });
    const router = useRouter();
    const queryClient = useQueryClient();
    const logout = () => {
        fetch("/api/logout").then(async () => {
            queryClient.invalidateQueries({ queryKey: ["me"] });
            await router.invalidate();
        });
    };
    return (
        <div className="fixed flex justify-center w-full top-0 left-0 z-50">
            <div className="flex items-center justify-between w-full max-w-7xl bg-sidebar p-4 mt-6 rounded-xl">
                <Logo />
                <NavLinks />
                {user ? (
                    <div className="flex gap-4">
                        <p className="text-primary font-bold">
                            {" "}
                            {user.username}{" "}
                        </p>
                        <button onClick={logout}>Logout</button>
                    </div>
                ) : (
                    <div className="flex">
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
