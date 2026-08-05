import { Button } from "#/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { Field, FieldError } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_public/register")({
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
      <div className="m-auto flex flex-col items-center h-[calc(100dvh-6.5rem)]">
          <form
              className=""
              action="/api/register"
              method="post"
              ref={formRef}
              onSubmit={handleSubmit}
          >
              <Card className="w-lg">
                  <CardHeader className="mb-8">
                      <CardTitle className="text-center font-bold text-2xl">
                          new to kettou?
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
                          <Input
                              id="retype-password"
                              name="retype-password"
                              type="password"
                              className="font-bold text-md!"
                              placeholder="retype password*"
                          />
                      </Field>
                      <FieldError>{error}</FieldError>
                  </CardContent>
                  <CardFooter>
                      <Field>
                          <Button
                              type="submit"
                              className="font-bold text-lg py-5"
                          >
                              create account
                          </Button>
                      </Field>
                  </CardFooter>
              </Card>
          </form>
      </div>
    );
}
