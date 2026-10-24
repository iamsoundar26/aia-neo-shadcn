import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Badge,
  PrimaryButton,
  answerRow,
  questionBand,
  questionBody,
  questionShell,
  questionTitle,
} from "./box-ui";
import type { NeoAsk } from "@/types/pages/neo";

type Props = {
  ask: NeoAsk;
  live: boolean;
  onPick: (id: string) => void;
};

/**
 * A question Neo can't answer from the data, with the likely answers as one
 * tap each — or one key: 1 to 4. Once answered, the question stays and the
 * pick reads back as the person's reply (`replyOfAsk`, in a ReplyBubble).
 *
 * Some answers are a value only the person knows — an amount to the rupee,
 * a phone number. Those get a field (the prompt box answers too), and any
 * options are quick fills under it, never the only choices.
 */
const AskOptions = ({ ask, live, onPick }: Props) => {
  const [text, setText] = useState("");
  // Answered, the exchange reads as one record under the message.
  if (!live && ask.answer !== undefined) return null;
  const [first, ...evidence] = ask.question.split("\n");
  return (
    <div className={questionShell} data-testid="ask-card">
      {/* First line is the question; anything after it is the evidence. */}
      <header className={questionBand}>
        <div className="min-w-0 flex-1">
          <h3 className={questionTitle}>{first}</h3>
          {evidence.length > 0 && (
            <p className="mt-0.5 text-[12px] font-normal leading-4 text-pi-body">
              {evidence.join(" ")}
            </p>
          )}
        </div>
      </header>
      {live && (
        <div className={cn(questionBody, "flex flex-col gap-1 p-2")}>
          {!ask.input &&
            ask.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onPick(o.id)}
                className={cn(
                  answerRow(false, false),
                  "focus-visible:bg-pi-fill focus-visible:outline-none"
                )}
              >
                <Badge>{i + 1}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] leading-5 text-pi-ink">
                    {o.label}
                  </span>
                  {o.hint && (
                    <span className="block truncate text-[12px] leading-[18px] text-pi-body tabular-nums">
                      {o.hint}
                    </span>
                  )}
                </span>
              </button>
            ))}
          {ask.input && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) onPick(text.trim());
              }}
              className="flex items-center gap-2 px-1"
            >
              <label className="sr-only" htmlFor="neo-ask-input">
                {first}
              </label>
              <input
                id="neo-ask-input"
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={ask.input.placeholder}
                className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[14px] tabular-nums text-pi-ink outline-none placeholder:text-pi-faint"
              />
              <PrimaryButton type="submit" disabled={!text.trim()}>
                Answer
              </PrimaryButton>
            </form>
          )}
          {ask.input && ask.options.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-pi-line-2 px-2 pt-2">
              <span className="text-[12px] text-pi-body">
                {ask.options[0].hint?.startsWith("Last") ? "Used before:" : "Or:"}
              </span>
              {ask.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onPick(o.id)}
                  className="h-7 rounded-full border border-pi-line-2 bg-background px-2.5 text-[12px] font-medium tabular-nums text-pi-ink-2 transition-colors hover:border-pi-brand-border hover:bg-pi-brand-tint hover:text-pi-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                  title={o.hint}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** The answer to a question, as the person would have typed it. */
export const replyOfAsk = (ask: NeoAsk) =>
  ask.answer === undefined
    ? undefined
    : ask.options.find((o) => o.id === ask.answer)?.label ?? ask.answer;

export default AskOptions;
