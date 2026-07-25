import { fetchMe } from "#/api/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";

function Logo() {
    return <div> KETTOU </div>
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
            <div className="flex justify-between w-full max-w-7xl bg-sidebar p-4 mt-6 rounded-xl">
                <Logo />
                {user ? (
                    <div className="flex gap-4">
                        <p className="text-primary font-bold"> {user.username} </p>
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
