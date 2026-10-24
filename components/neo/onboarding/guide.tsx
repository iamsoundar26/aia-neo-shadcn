import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { place, useAnchorBox } from "@/components/guide/tour-popover";
import { NeoStar } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { GUIDE_COPY, GUIDE_STEPS } from "@/config/pages/neo/onboarding";
import {
  dismissCoach,
  exitGuide,
  useReconOnboarding,
} from "@/hooks/pages/neo/use-recon-onboarding";
import { cn } from "@/lib/utils";

/**
 * Guided mode's hint (24 Oct 2026): one short line, a step count and a
 * Next button, pointing at the part of the screen it is about. It was a
 * card with a head, a title, a paragraph and a foot; for someone who reads
 * little that was more to read than the screen it explained.
 */

/** Opens the prompt box's file dialog: choosing files starts the run. */
export const chooseFiles = () => document.getElementById("neo-attach")?.click();

const WIDTH = 288;
const TOTAL = GUIDE_STEPS.length;

type Box = NonNullable<ReturnType<typeof useAnchorBox>>;

/**
 * The pointer from the card to what it annotates, on the facing edge, in the
 * colour of the band it leaves from: the head above, the foot below.
 */
const Pointer = ({
  box,
  card,
}: {
  box: Box;
  card: { top: number; left: number; height: number; width: number };
}) => {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const style: React.CSSProperties = {};
  let rotate = 45;
  let band = "var(--background-color, #fff)";
  if (card.top >= box.top + box.height - 1) {
    style.top = -6;
    style.left = Math.min(card.width - 26, Math.max(20, cx - card.left - 6));
    band = "var(--background-color, #fff)";
  } else if (card.top + card.height <= box.top + 1) {
    style.bottom = -6;
    style.left = Math.min(card.width - 26, Math.max(20, cx - card.left - 6));
    rotate = 225;
    band = "var(--background-color, #fff)";
  } else if (card.left >= box.left + box.width - 1) {
    style.left = -6;
    style.top = Math.min(card.height - 26, Math.max(20, cy - card.top - 6));
    rotate = -45;
  } else {
    style.right = -6;
    style.top = Math.min(card.height - 26, Math.max(20, cy - card.top - 6));
    rotate = 135;
  }
  return (
    <span
      aria-hidden
      style={{ ...style, transform: `rotate(${rotate}deg)`, background: band }}
      className="absolute h-3 w-3 rounded-tl-[3px] border-l border-t border-pi-line bg-background"
    />
  );
};


const GuideCoach = (_props: { onPrompt?: (p: string) => void }) => {
  const { hints, coach, coachSeen } = useReconOnboarding();
  const shown = hints && !!coach && !coachSeen;
  const box = useAnchorBox(shown ? coach?.anchor : undefined);
  const card = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(96);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useLayoutEffect(() => {
    const h = card.current?.offsetHeight;
    if (h && h !== height) setHeight(h);
  });

  // Enter moves on, unless you are typing.
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "Enter" || t?.closest("textarea,input,button,[contenteditable]"))
        return;
      e.preventDefault();
      dismissCoach();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  // A hint with an anchor waits until the anchor is measured; if it never
  // turns up it centres after a moment.
  const [late, setLate] = useState(false);
  useEffect(() => {
    setLate(false);
    if (!shown || !coach?.anchor) return;
    const t = window.setTimeout(() => setLate(true), 800);
    return () => window.clearTimeout(t);
  }, [shown, coach?.anchor, coach?.body]);

  if (!mounted || !shown || !coach) return null;
  if (coach.anchor && !box && !late) return null;

  const width = Math.min(WIDTH, window.innerWidth - 32);
  const pos = box
    ? place(box, height, coach.placement, width)
    : {
        top: Math.max(16, window.innerHeight / 2 - height / 2),
        left: Math.max(16, window.innerWidth / 2 - width / 2),
      };
  const pad = 6;
  const dots = coach.step > 0;

  return createPortal(
    <>
      {box && (
        <div
          aria-hidden
          key={coach.anchor}
          className="neo-fade-in pointer-events-none fixed left-0 top-0 z-[65]"
          style={{
            transform: `translate(${box.left - pad}px, ${box.top - pad}px)`,
            width: box.width + pad * 2,
            height: box.height + pad * 2,
            borderRadius: 12,
            boxShadow: "0 0 0 2px var(--pi-brand)",
          }}
        />
      )}
      <div
        ref={card}
        role="dialog"
        aria-label={`Guide: ${coach.body}`}
        key={coach.body}
        data-testid="guide-hint"
        className="fixed z-[70] rounded-xl border border-pi-line bg-background p-3 shadow-[0_1px_2px_rgb(18_18_18/0.06),0_16px_40px_-12px_rgb(40_48_87/0.28)] duration-200 animate-in fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
        style={{ top: pos.top, left: pos.left, width }}
      >
        {box && (
          <Pointer
            box={box}
            card={{ top: pos.top, left: pos.left, height, width }}
          />
        )}
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md bg-pi-brand text-white">
            <NeoStar className="h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 flex-1 text-[16px] font-semibold leading-6 text-pi-ink">
            {coach.body}
          </p>
          <button
            type="button"
            onClick={exitGuide}
            aria-label={GUIDE_COPY.exit}
            title={GUIDE_COPY.exit}
            className="-mr-1 -mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md text-pi-faint hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {dots ? (
            <ol
              aria-label={`Step ${coach.step} of ${TOTAL}`}
              className="flex flex-1 items-center gap-1"
            >
              {GUIDE_STEPS.map((x) => (
                <li
                  key={x.n}
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-300",
                    x.n === coach.step
                      ? "w-4 bg-pi-brand"
                      : x.n < coach.step
                        ? "w-1.5 bg-pi-brand"
                        : "w-1.5 bg-pi-line-2"
                  )}
                />
              ))}
            </ol>
          ) : (
            <span className="flex-1" />
          )}
          <Button
            data-testid="guide-next"
            onClick={() => (coach.final ? exitGuide() : dismissCoach())}
            className="h-8 rounded-lg px-3.5 text-[14px] font-semibold"
          >
            {coach.final ? (
              <>
                <Check className="h-4 w-4" /> Done
              </>
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default GuideCoach;
