import React from "react";
import { FileSpreadsheet, FileText } from "@/components/icons";
import type { NeoUploadFile } from "@/types/pages/neo";

type Pair = { question?: string; answer: string };

type Props = {
  children: React.ReactNode;
  /** The questions behind the answer, on hover. */
  title?: string;
  /**
   * The questions Neo asked and what was picked for each. Given, the
   * exchange reads as a record; without them, `children` is the pick.
   */
  pairs?: Pair[];
  /** Files the person added: shown as cards, with what Neo read from each. */
  files?: NeoUploadFile[];
  heading?: string;
};

/**
 * An answered question (24 Oct 2026): the person's reply, so it sits on
 * their side in the same bubble as anything they type. The question Neo
 * asked is small and muted on top; what they picked or said is under it.
 * Several answers from one sheet stack in one bubble.
 */
const sizeOf = (n: number) =>
  n >= 1_048_576
    ? `${(n / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

const ReplyBubble = ({ children, title, pairs, files, heading }: Props) => {
  if (files && files.length)
    return (
      <section
        aria-label="Your files"
        data-testid="reply-files"
        className="neo-reply-in ml-auto flex w-fit min-w-[260px] max-w-[88%] flex-col gap-2 self-end rounded-2xl bg-pi-bubble p-2.5"
      >
        <p className="px-1.5 pt-0.5 text-[14px] leading-5 text-pi-faint">
          {heading || `${files.length} file${files.length === 1 ? "" : "s"} added`}
        </p>
        <ul className="flex flex-col gap-1.5">
          {files.map((f) => {
            const Icon = /\.pdf$/i.test(f.name) ? FileText : FileSpreadsheet;
            return (
              <li
                key={f.name}
                className="flex items-center gap-3 rounded-xl border border-pi-line-2 bg-background px-2.5 py-2"
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-pi-brand-tint text-pi-brand">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium leading-5 text-pi-ink">
                    {f.name}
                  </span>
                  <span className="block truncate text-[12px] leading-4 text-pi-body">
                    {[
                      f.label,
                      f.range,
                      f.rows ? `${f.rows.toLocaleString("en-IN")} rows` : "",
                      sizeOf(f.size),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  const rows: Pair[] =
    pairs && pairs.length
      ? pairs
      : [
          {
            answer: typeof children === "string" ? children : String(children),
          },
        ];
  return (
    <section
      aria-label="Your answer"
      title={title}
      data-testid="reply-bubble"
      className="neo-reply-in ml-auto flex w-fit max-w-[88%] flex-col gap-3 self-end rounded-2xl bg-pi-bubble px-4 py-2.5"
    >
      {rows.map((r, i) => (
        <div key={`${r.question}-${i}`} className="min-w-0">
          {r.question && (
            <p className="break-words text-[14px] leading-5 text-pi-faint">
              {r.question}
            </p>
          )}
          <p className="break-words text-[14px] leading-5 text-pi-ink">
            {r.answer}
          </p>
        </div>
      ))}
    </section>
  );
};

export default ReplyBubble;
