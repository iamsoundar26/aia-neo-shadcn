import React from "react";

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
};

/**
 * An answered question (24 Oct 2026): the person's reply, so it sits on
 * their side in the same bubble as anything they type. The question Neo
 * asked is small and muted on top; what they picked or said is under it.
 * Several answers from one sheet stack in one bubble.
 */
const ReplyBubble = ({ children, title, pairs }: Props) => {
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
