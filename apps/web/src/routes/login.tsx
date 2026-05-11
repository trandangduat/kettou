import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/login")({
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
        fetch("http://localhost:3000/login", {
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
                    action="/login"
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
