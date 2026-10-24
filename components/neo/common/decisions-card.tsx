import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
} from "@/components/icons";
import type { NeoCard, NeoDecisionItem } from "@/types/pages/neo";
import {
  Badge,
  GhostButton,
  PrimaryButton,
  answerRow,
  questionBand,
  questionShell,
  questionTitle,
} from "./box-ui";
import { cn } from "@/lib/utils";
import { answered, applies, OTHER } from "@/utils/pages/neo/decisions";

type Card = Extract<NeoCard, { kind: "decisions" }>;

type Props = {
  card: Card;
  /** Answerable: the run is waiting on these questions. */
  live: boolean;
  onChange: (card: Card) => void;
  /** The sign-off on the last question: its quiet buttons, then its primary. */
  signoff?: { secondary: React.ReactNode; primary: React.ReactNode };
  /**
   * Words sent from the prompt box under the card: the open question's
   * "Something else" (`n` counts sends, so the same words twice still land).
   */
  typed?: { text: string; n: number };
  /** Which question is open, so the prompt box can say what typing does. */
  onActive?: (item?: NeoDecisionItem) => void;
  /** Where the run is in the reconciliation journey, for the header. */
  stage?: { n: number; of: number };
};

/**
 * Neo's questions, asked the way Claude asks them (20 Oct 2026): one
 * question at a time in a card, a tab per question across the top with a
 * tick once answered, numbered answers with the recommended one first, and
 * a last Submit tab to review everything before the run goes on.
 *
 * Keys: 1–9 or ↑↓ and Enter pick and move on; ← → change question. A pick
 * Neo recommends is already filled in, so Submit can come straight away;
 * a question with no recommendation waits for an answer. "Something else"
 * takes your own words. What the records settle isn't asked: it's listed
 * on the Submit tab.
 */
const DecisionsCard = ({
  card,
  live,
  onChange,
  signoff,
  typed,
  onActive,
}: Props) => {
  const asked = card.items.filter((i) => applies(card, i) && !i.settled);
  const submitTab = Math.max(0, asked.length - 1);
  const [tab, setTab] = useState(0);
  const item = asked[tab] as NeoDecisionItem | undefined;
  const rows = item ? rowsOf(item) : [];
  const [cursor, setCursor] = useState(0);
  const [typing, setTyping] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Each question opens with the cursor on its answer, or the first row.
  useEffect(() => {
    if (!item) return;
    const at = rows.findIndex((r) => r.id === item.pick);
    setCursor(at < 0 ? 0 : at);
    setTyping(item.pick === OTHER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  useEffect(() => {
    if (live) box.current?.focus({ preventScroll: true });
  }, [live]);
  useEffect(() => {
    if (typing) input.current?.focus({ preventScroll: true });
  }, [typing]);
  useEffect(() => {
    onActive?.(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, item?.id, live]);
  // Words from the prompt box answer the open question in your own words.
  useEffect(() => {
    if (!typed || !item) return;
    onChange({
      ...card,
      items: card.items.map((i) =>
        i.id === item.id ? { ...i, pick: OTHER, note: typed.text } : i
      ),
    });
    setTab((t) => Math.min(t + 1, submitTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed?.n]);

  if (!live) return null;

  const patch = (id: string, p: Partial<NeoDecisionItem>) =>
    onChange({
      ...card,
      items: card.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    });
  const next = () => setTab((t) => Math.min(t + 1, submitTab));
  const choose = (i: number) => {
    if (!item) return;
    const row = rows[i];
    setCursor(i);
    if (row.id === OTHER) {
      patch(item.id, { pick: OTHER });
      setTyping(true);
      input.current?.focus({ preventScroll: true });
      return;
    }
    patch(item.id, { pick: row.id });
    setTyping(false);
    box.current?.focus({ preventScroll: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target === input.current) {
      if (e.key === "Enter" && item?.note?.trim()) {
        e.preventDefault();
        setTyping(false);
        box.current?.focus({ preventScroll: true });
        next();
      }
      return;
    }
    // Native buttons keep their own Enter/Space activation.
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setTab((t) => Math.min(t + 1, submitTab));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTab((t) => Math.max(t - 1, 0));
    } else if (!item) {
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(cursor);
    } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= rows.length) {
      e.preventDefault();
      choose(Number(e.key) - 1);
    }
  };

  const last = tab === submitTab;
  const toRecommended = (i: NeoDecisionItem) =>
    i.recommended ? { ...i, pick: i.recommended } : i;
  // "Decide this one": take Neo's recommendation and move on.
  const decideThis = () => {
    if (!item?.recommended) return;
    patch(item.id, { pick: item.recommended });
    next();
  };
  // "Decide all": take Neo's recommendation for every open question that
  // has one, and go to the last, where it is confirmed.
  const decideAll = () => {
    onChange({
      ...card,
      items: card.items.map((i) =>
        applies(card, i) && !i.settled && !answered(i) ? toRecommended(i) : i
      ),
    });
    setTab(submitTab);
  };
  const canDecideAll =
    asked.length > 1 &&
    !last &&
    asked.some((i) => !answered(i) && !!i.recommended);

  return (
    <section
      aria-label={card.title}
      data-guide-id="neo-sheet"
      data-testid="question-card"
      className={cn("neo-decision", questionShell)}
    >
      <div
        ref={box}
        tabIndex={-1}
        onKeyDown={onKey}
        className="focus-visible:outline-none"
      >
        {/* The question, and where you are among several. */}
        <header className={questionBand}>
          <h2 title={item?.why} className={questionTitle}>
            {item?.question || card.title}
          </h2>
          {asked.length > 1 && (
            <div className="flex flex-none items-center gap-1 text-[14px] leading-5 text-pi-ink-2">
              <button
                type="button"
                aria-label="Previous question"
                disabled={tab === 0}
                onClick={() => setTab((t) => Math.max(0, t - 1))}
                className="grid h-6 w-6 place-items-center rounded-md text-pi-ink-2 transition-colors hover:bg-pi-fill-2 hover:text-pi-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[44px] text-center tabular-nums">
                {tab + 1} of {submitTab + 1}
              </span>
              <button
                type="button"
                aria-label="Next question"
                disabled={last}
                onClick={() => setTab((t) => Math.min(submitTab, t + 1))}
                className="grid h-6 w-6 place-items-center rounded-md text-pi-ink-2 transition-colors hover:bg-pi-fill-2 hover:text-pi-ink disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </header>

        <div className="p-2">
          {item ? (
            <div key={item.id} className="neo-question-enter">
              <ol
                role="listbox"
                tabIndex={0}
                onFocus={() =>
                  setCursor(
                    Math.max(
                      0,
                      rows.findIndex((r) => r.id === item.pick)
                    )
                  )
                }
                aria-label={item.question}
                aria-activedescendant={`neo-q-${item.id}-${cursor}`}
                className="flex flex-col gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand-border"
              >
                {rows
                  .filter((r) => r.id !== OTHER)
                  .map((r, i) => {
                    const on = item.pick === r.id;
                    return (
                      <li
                        key={r.id}
                        id={`neo-q-${item.id}-${i}`}
                        role="option"
                        aria-selected={on}
                        onClick={() => choose(i)}
                        className={cn(
                          "neo-answer-option",
                          answerRow(on, cursor === i)
                        )}
                      >
                        <Badge on={on}>{i + 1}</Badge>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-[14px] leading-5 text-pi-ink">
                            {r.label}
                            {r.id === item.recommended && (
                              <span className="ml-2 text-[12px] text-pi-faint">
                                Recommended
                              </span>
                            )}
                          </span>
                          {r.hint && (
                            <span className="block break-words text-[12px] leading-[18px] text-pi-body">
                              {r.hint}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
              </ol>
              <div aria-hidden className="mx-3 mt-2 h-px bg-pi-line-2" />
              <div className="px-3">
                <label className="sr-only" htmlFor={`neo-other-${item.id}`}>
                  Your answer
                </label>
                <input
                  id={`neo-other-${item.id}`}
                  ref={input}
                  value={item.note || ""}
                  onFocus={() => {
                    setCursor(rows.length - 1);
                    setTyping(true);
                    if (item.pick !== OTHER) patch(item.id, { pick: OTHER });
                  }}
                  onChange={(e) =>
                    patch(item.id, { pick: OTHER, note: e.target.value })
                  }
                  placeholder={item.other?.placeholder || "Something else…"}
                  aria-label={`${item.question}: your answer`}
                  className="h-10 w-full bg-transparent text-[14px] leading-5 text-pi-ink outline-none placeholder:text-pi-faint"
                />
              </div>
            </div>
          ) : null}

          {/* Cancel and Back on the left, deciding for you, then the one
              primary, with its words, on the right. */}
          <div className="flex flex-wrap items-center gap-1 px-1 pb-0.5 pt-1">
            {last && signoff ? (
              signoff.secondary
            ) : (
              <GhostButton
                onClick={() =>
                  box.current?.dispatchEvent(
                    new KeyboardEvent("keydown", {
                      key: "Escape",
                      bubbles: true,
                    })
                  )
                }
              >
                Cancel
              </GhostButton>
            )}
            {tab > 0 && (
              <GhostButton onClick={() => setTab((t) => Math.max(0, t - 1))}>
                Back
              </GhostButton>
            )}
            {canDecideAll && (
              <GhostButton data-testid="decide-all" onClick={decideAll}>
                Decide all
              </GhostButton>
            )}
            {!last && item?.recommended && (
              <GhostButton data-testid="decide-this" onClick={decideThis}>
                Decide this one
              </GhostButton>
            )}
            <span className="ml-auto flex items-center">
              {last && signoff ? (
                signoff.primary
              ) : (
                <PrimaryButton
                  data-testid="question-next"
                  disabled={!item || !answered(item)}
                  onClick={next}
                >
                  Next
                </PrimaryButton>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

/** A question's answers, then "Something else" when it takes words. */
const rowsOf = (item: NeoDecisionItem) => [
  ...item.options,
  {
    id: OTHER,
    label: "Something else",
    hint: "",
  },
];

const labelOf = (item: NeoDecisionItem) =>
  item.pick === OTHER
    ? `“${item.note?.trim() || "…"}”`
    : item.options.find((o) => o.id === item.pick)?.label || "Not answered";

const Tab = ({
  active,
  done,
  onClick,
  children,
}: {
  active: boolean;
  done: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={cn(
      "flex h-7 flex-none items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12px] font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border",
      active
        ? "bg-pi-brand-tint text-pi-brand shadow-contact ring-1 ring-inset ring-pi-brand-border"
        : "text-pi-body hover:text-pi-ink"
    )}
  >
    {done ? (
      <Check className="h-3 w-3 flex-none text-pi-success" />
    ) : (
      <span className="h-1.5 w-1.5 flex-none rounded-full bg-pi-warning-dot" />
    )}
    {children}
  </button>
);

/** The Submit tab: every answer, what the records settle, then the sign-off. */
const Review = ({
  card,
  asked,
  settled,
  onTab,
}: {
  card: Card;
  asked: NeoDecisionItem[];
  settled: NeoDecisionItem[];
  onTab: (i: number) => void;
}) => (
  <div role="tabpanel" className="neo-sheet-panel px-6 pb-5 max-sm:px-4">
    {asked.length > 0 && (
      <ul className="flex flex-col gap-2">
        {asked.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onTab(i)}
              className="group flex min-h-[60px] w-full items-center gap-3 rounded-xl border border-pi-brand-border bg-pi-brand-tint px-3.5 py-3 text-left transition-colors hover:border-pi-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border"
            >
              {answered(q) ? (
                <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
              ) : (
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-pi-warning-bg">
                  <span className="h-2 w-2 rounded-full bg-pi-warning-dot" />
                </span>
              )}
              <span className="min-w-0 flex-1 text-body-3 leading-5">
                <span className="block text-[12px] text-pi-body">
                  {q.question}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block font-semibold",
                    answered(q) ? "text-pi-ink" : "text-pi-warning"
                  )}
                >
                  {labelOf(q)}
                </span>
              </span>
              <span className="pr-1 text-[12px] font-medium text-pi-brand">
                Edit
              </span>
            </button>
          </li>
        ))}
      </ul>
    )}
    {settled.length > 0 && (
      <div className="mt-5 border-t border-pi-line pt-4">
        <p className="pb-2 text-[12px] font-medium text-pi-body">
          From your records
        </p>
        <ul className="flex flex-col">
          {settled.map((q) => (
            <li
              key={q.id}
              className="flex items-start gap-2.5 py-1.5 text-[12px] leading-5"
            >
              <Check className="mt-1 h-3 w-3 flex-none text-pi-faint" />
              <span className="min-w-0">
                <span className="text-pi-ink">{labelOf(q)}</span>
                <span className="text-pi-body"> · {q.settled}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/**
 * After it's submitted, the sheet reads back as the person's reply (22 Oct
 * 2026): the answers they gave, in order, each under the question it
 * answers, so the bubble reads on its own without matching it to a list on
 * Neo's side. What the records settled isn't theirs, so it stays out.
 */
export const replyOf = (card: Card) => {
  const items = card.items.filter((i) => applies(card, i) && !i.settled);
  return {
    // Kept for replies that skip the picks ("Not now"): the questions read
    // back on Neo's side so the bare reply under them answers something.
    asked:
      items.length === 1
        ? items[0].question
        : items.map((i, n) => `${n + 1}. ${i.question}`).join("\n"),
    pairs: items.map((i) => ({ question: i.question, answer: labelOf(i) })),
    text: items.map(labelOf).join(", "),
    title: undefined,
  };
};

export default DecisionsCard;
