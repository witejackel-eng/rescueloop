import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card variant — controls the surface treatment.
 *
 *  - default   : current styling (border + shadow-sm). Backward compatible.
 *  - elevated  : shadow-md + subtle gradient overlay for a more premium feel.
 *  - outline   : stronger border, no shadow — crisp and minimal.
 *  - glass     : glassmorphism effect (uses the existing .glass utility).
 */
export type CardVariant = "default" | "elevated" | "outline" | "glass";

interface CardProps extends React.ComponentProps<"div"> {
  variant?: CardVariant;
  /**
   * When true, the card gains a subtle shadow lift on hover. Opt-in so
   * existing cards don't suddenly become interactive.
   */
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-card text-card-foreground border shadow-sm",
  elevated:
    "bg-card text-card-foreground border shadow-md " +
    "[background-image:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0)_40%)]",
  outline:
    "bg-card text-card-foreground border-[1.5px] border-[var(--hairline-strong)] shadow-none",
  glass: "glass text-card-foreground border border-white/10",
};

function Card({
  className,
  variant = "default",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "flex flex-col gap-6 rounded-xl border py-6",
        VARIANT_CLASSES[variant],
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-200 ease-out " +
            "hover:-translate-y-px hover:shadow-[0_6px_20px_-8px_rgba(17,17,15,0.18)] " +
            "hover:border-[var(--hairline-strong)] " +
            "dark:hover:shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
