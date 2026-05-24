import { fetchMe } from "#/api/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";

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
        <div className="flex justify-between bg-gray-200 p-4">
            {user ? (
                <>
                    <p>
                        Hello, <b>{user.username}</b>
                    </p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                    <p>You're not logged in</p>
                    <div className="flex">
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </div>
                </>
            )}
        </div>
    );
}
