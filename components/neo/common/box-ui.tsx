import React from "react";
import { ArrowUp } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * One kit for everything that lives in or on Neo's prompt box (23 Oct 2026),
 * so the box, its questions, its upload card and its menus read as one
 * thing, and stay compact on a small Windows laptop.
 *
 * Radii: containers 12, controls 8, number badges 6, chips and tags round.
 * Controls are 32px; text is 14 / 13 / 12. Below 700px of window height
 * rows and drop areas tighten (`[@media(max-height:700px)]:`, written out where used).
 */
/** A card joined to the prompt box: questions, files, menus. */
export const boxShell =
  "relative z-0 overflow-hidden rounded-xl border border-pi-line-2 bg-background";

/** The grey bar a card opens with. */
export const boxHeader =
  "flex items-center gap-3 border-b border-pi-line bg-pi-head-bg px-4 py-2.5";

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border";

/** Cancel, Back and the like: text only. */
export const GhostButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...p }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "h-8 flex-none rounded-lg px-2.5 text-[14px] font-medium text-pi-ink-2 transition-colors hover:bg-pi-fill hover:text-pi-ink disabled:opacity-40",
      focus,
      className
    )}
    {...p}
  />
));
GhostButton.displayName = "GhostButton";

/** The one primary action of a card. */
export const PrimaryButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...p }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "h-8 flex-none rounded-lg bg-primary px-3.5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active disabled:cursor-not-allowed disabled:bg-pi-brand-border disabled:text-white",
      focus,
      className
    )}
    {...p}
  />
));
PrimaryButton.displayName = "PrimaryButton";

/** The send / next arrow: the same square wherever it appears. */
export const SendButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...p }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "grid h-8 w-8 flex-none place-items-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:bg-pi-brand-border disabled:text-white",
      focus,
      className
    )}
    {...p}
  >
    <ArrowUp className="h-4 w-4" />
  </button>
));
SendButton.displayName = "SendButton";

/** The number on an answer row. */
export const Badge = ({
  on,
  children,
}: {
  on?: boolean;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "grid h-6 w-6 flex-none place-items-center rounded-md border text-[12px] tabular-nums transition-colors duration-200",
      on
        ? "border-pi-brand bg-pi-brand text-white"
        : "border-pi-line-2 bg-background text-pi-body"
    )}
  >
    {children}
  </span>
);

/**
 * One shell for every question Neo asks (24 Oct 2026): a grey band with the
 * question, a white body with the answers, "Something else" and the way
 * on. 12px corners, the same border and shadow as the prompt box.
 */
export const questionShell =
  "overflow-hidden rounded-xl border border-pi-line-2 bg-background";
export const questionBand =
  "flex items-start justify-between gap-3 bg-pi-fill px-4 pb-6 pt-3";
/** The white body rises over the band with its own curved top edge. */
export const questionBody =
  "relative -mt-3 rounded-t-xl border-t border-pi-line-2 bg-background";
export const questionTitle =
  "min-w-0 flex-1 break-words text-[14px] font-semibold leading-5 text-pi-ink";

/** An answer row: grey on hover or under the cursor, tinted once picked. */
export const answerRow = (on: boolean, here: boolean) =>
  cn(
    "flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-left transition-colors duration-150 motion-reduce:transition-none [@media(max-height:700px)]:min-h-9",
    on
      ? "bg-pi-brand-tint"
      : here
        ? "bg-pi-fill"
        : "hover:bg-pi-fill"
  );

/** Text-only action: Cancel and Back. Darker than a hint, grey on hover. */
export const textAction =
  "h-8 flex-none rounded-lg px-2.5 text-[14px] font-medium text-pi-ink-2 transition-colors hover:bg-pi-fill hover:text-pi-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border";
