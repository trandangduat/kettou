import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "#/components/ui/card";
import {
    Field,
    FieldError,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import {
    KeyIcon,
} from "@heroicons/react/24/solid";

export const Route = createFileRoute("/_public/login")({
    component: RouteComponent,
});

function RouteComponent() {
    const [pending, setPending] = useState<Boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formRef.current) return;

        const formData = new FormData(formRef.current);
        const data = Object.fromEntries(formData.entries());

        setPending(true);
        setError(null);

        const res = await fetch("/api/login", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
            },
        });

        setPending(false);
        if (!res.ok) {
            setError(await res.text());
            return;
        }

        queryClient.invalidateQueries({
            queryKey: ["me"],
        });
        await router.invalidate();
    };
    return (
        <div className="m-auto flex flex-col items-center h-[calc(100dvh-6.5rem)]">
            <form
                className=""
                action="/api/login"
                method="post"
                ref={formRef}
                onSubmit={handleSubmit}
            >
                <Card className="w-lg">
                    <CardHeader className="mb-8">
                        <CardTitle className="text-center font-bold text-2xl">
                            login to kettou
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Field>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                className="font-bold text-md!"
                                placeholder="username*"
                            />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                className="font-bold text-md!"
                                placeholder="password*"
                            />
                            <span className="w-full">
                                <Link
                                    to="#"
                                    className="float-right hover:text-primary hover:underline text-sm transition"
                                >
                                    forgot password?
                                </Link>
                            </span>
                        </Field>
                        <FieldError>{error}</FieldError>
                    </CardContent>
                    <CardFooter>
                        <Field>
                            <Button
                                type="submit"
                                className="font-bold text-lg py-5"
                            >
                                <KeyIcon />
                                login
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="text-md py-5"
                            >
                                create new account
                            </Button>
                        </Field>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
