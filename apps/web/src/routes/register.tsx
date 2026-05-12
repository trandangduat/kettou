import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/register")({
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
        fetch("/api/register", {
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
                    action="/api/register"
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

                    <label htmlFor="retype-password">Retype password</label>
                    <input
                        type="password"
                        name="retype-password"
                        placeholder="Retype password"
                    />

                    <button type="submit">Register</button>
                    {pending && <p>Registering...</p>}
                    {error && <p>{error}</p>}
                </form>
            </div>
        </>
    );
}
