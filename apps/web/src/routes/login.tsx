import { fetchMe } from "#/api/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/login")({
    beforeLoad: async ({ context, search }) => {
        console.log(context.queryClient);
        const user = await context.queryClient.ensureQueryData({
            queryKey: ["me"],
            queryFn: fetchMe,
            retry: false,
        });
        console.log(user);
        if (user) {
            throw redirect({ to: "/" });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    const [pending, setPending] = useState<Boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const data = Object.fromEntries(formData.entries());
        setPending(true);
        fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                setPending(false);
                if (res.ok) {
                    setError(null);
                }
                return res.text();
            })
            .then((data) => {
                console.log(data);
                setError(data);
            });
    };
    return (
        <>
            <div className="">
                <form
                    action="/api/login"
                    method="post"
                    className="flex flex-col w-2xl"
                    ref={formRef}
                    onSubmit={handleSubmit}
                >
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" placeholder="Username" />

                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                    />

                    <button type="submit">Login</button>
                    {pending && <p>Logging in...</p>}
                    {error && <p>{error}</p>}
                </form>
            </div>
        </>
    );
}
