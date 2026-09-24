import { cva, type VariantProps } from "class-variance-authority";
import cn from "cnfast";
import * as React from "react";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border font-bold tracking-wide whitespace-nowrap transition-colors select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary/15 text-primary",
                secondary:
                    "border-border/60 bg-muted/40 text-muted-foreground",
                destructive:
                    "border-destructive/30 bg-destructive/15 text-destructive",
                outline: "border-border/60 text-foreground",
                warning:
                    "border-amber-400/30 bg-amber-400/10 text-amber-300",
                success:
                    "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                info: "border-sky-400/30 bg-sky-400/10 text-sky-300",
                neutral:
                    "border-border/60 bg-muted/20 text-muted-foreground",
                ranked:
                    "border-violet-400/30 bg-violet-400/15 text-violet-300",
            },
            size: {
                default:
                    "px-2.5 py-1 text-[11px] [&_svg:not([class*='size-'])]:size-3",
                sm: "gap-1 px-2 py-0.5 text-[10px] [&_svg:not([class*='size-'])]:size-3",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Badge({
    className,
    variant = "default",
    size = "default",
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            data-slot="badge"
            data-variant={variant}
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
