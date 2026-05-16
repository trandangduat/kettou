import { fetchMe } from "#/api/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
        <div className="p-8">
            <h1 className="text-4xl font-bold">Welcome to mini-games hub</h1>
            {user ? (
                <>
                    <p>
                        Hello, <b>{user.username}</b>
                    </p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </>
            )}
        </div>
    );
}
