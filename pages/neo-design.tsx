import React, { useState } from "react";
import Head from "next/head";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import SourcesDock from "@/components/neo/common/sources-dock";
import DecisionsCard from "@/components/neo/common/decisions-card";
import { GhostButton, PrimaryButton } from "@/components/neo/common/box-ui";
import NeoMark from "@/components/neo/common/neo-mark";
import type { NeoCard, NeoUploadFile } from "@/types/pages/neo";

/**
 * Neo's design guide (24 Oct 2026): the brand's colour and type as the
 * prototype uses them, how they feed shadcn's tokens, the shadcn
 * components Neo is built from, and the upload card in each state.
 * Everything here is the real component or the real token, not a picture.
 */

const RAMP = (name: string, hexes: string[]) => ({
  name,
  steps: hexes.map((hex, i) => ({
    step: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i],
    hex,
    v: `--palette-${name}-${[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][i]}`,
  })),
});

const RAMPS = [
  RAMP("blue", ["#f6f7ff", "#e2e5fb", "#bac3f4", "#7e8ee7", "#465ed5", "#3146b0", "#344593", "#35437e", "#333f66", "#303850", "#21263c"]),
  RAMP("neutral", ["#efefef", "#e0e0e0", "#c4c4c4", "#a8a8a8", "#8c8c8c", "#707070", "#545454", "#383838", "#242424", "#121212", "#080808"]),
];

const MEANING = [
  { name: "Success", v: "--palette-green-500", hex: "#03a000", use: "Matched, done, a file Neo is sure about" },
  { name: "Warning", v: "--palette-amber-500", hex: "#ffa800", use: "Allowed, but worth a look (E04, partial coverage)" },
  { name: "Danger", v: "--palette-red-600", hex: "#d21313", use: "A file or row that can't be used" },
];

const TOKENS = [
  ["--primary", "blue-500", "#3146b0", "Primary action: one per card, on the right"],
  ["--primary-hover", "blue-600", "#344593", "Primary hover"],
  ["--accent", "blue-50", "#f6f7ff", "Tinted surfaces, selected rows"],
  ["--secondary / --muted", "blue-100", "#e2e5fb", "Quiet fills"],
  ["--input", "blue-200", "#bac3f4", "Field borders"],
  ["--ring", "blue-400", "#465ed5", "Focus ring (was blue-200, 1.6:1 on white; now 4.4:1)"],
  ["--foreground", "neutral-900", "#121212", "Text"],
  ["--muted-foreground", "neutral-500", "#707070", "Secondary text"],
  ["--border", "neutral-200", "#c4c4c4", "Dividers and card edges"],
  ["--destructive-foreground", "red-600", "#d21313", "Errors"],
  ["--radius", "8px", "", "Controls 8 · cards 12 · badges and chips round"],
];

const TYPE = [
  ["text-h5", "24 / 30", "Page and empty-state headings", "Hi Soundar, what can I help you with?"],
  ["text-h6", "20 / 24", "Card titles, document headings", "September 2026 reconciliation"],
  ["text-label-1", "16 / 22", "Section labels", "Payout reports"],
  ["text-body-2", "16 / 24", "Neo's answers (Source Serif 4)", "Your books match the bank for 28 of 30 days."],
  ["text-body-3", "14 / 20", "Everything on the prompt box: questions, rows, buttons", "Neo only reads your files and never changes your books."],
  ["text-body-4", "12 / 16", "Notes, hints, counts", "1–30 Sep · 99% sure"],
  ["text-caption-1", "10 / 12", "Tags only", "ILLUSTRATIVE RULE"],
];

const f = (p: Partial<NeoUploadFile> & Pick<NeoUploadFile, "slot" | "name">): NeoUploadFile => ({
  size: 24_000,
  state: "ready",
  ...p,
});

const CONTEXT = {
  client: "Nandhini Deluxe",
  period: "September 2026",
  from: "2026-09-01",
  to: "2026-09-30",
};
const SLOTS: Extract<NeoCard, { kind: "sources-upload" }>["slots"] = [
  { id: "bank", label: "Bank statement", hint: "From net banking, for the whole period" },
  { id: "gateway", label: "Payout reports", hint: "Card, UPI, Zomato and Swiggy settlement reports", multi: true },
  { id: "sales", label: "Sales report", hint: "Your POS or Tally export", connected: "From Tally, synced 2 min ago" },
];

const STATES: { title: string; note: string; files: NeoUploadFile[] }[] = [
  {
    title: "Empty",
    note: "One card, opened straight away. Focus lands on it; Esc cancels. 'Use the sample' is the escape.",
    files: [],
  },
  {
    title: "Reading and checking",
    note: "Each file shows what Neo understood and how sure it is. The wrong month, an unsupported type and an unknown file are caught on the spot.",
    files: [
      f({ slot: "bank", name: "hdfc-0418-statement-sep26.csv", rows: 93, label: "HDFC ·0418 · Bank statement", range: "1–30 Sep", confidence: 0.99 }),
      f({ slot: "gateway", name: "zomato-payouts-sep26.csv", state: "reading" }),
      f({ slot: "", name: "bank-aug-statement.csv", state: "error", problem: "Covers 1–30 Aug 2026, not this period. Export 1–30 Sep instead." }),
      f({ slot: "", name: "mystery-file.csv", label: "mystery-file.csv", confidence: 0 }),
    ],
  },
  {
    title: "Ready, with a coverage gap",
    note: "The three sources are a checklist. A missing channel shows before the run (E04) and never blocks it.",
    files: [
      f({ slot: "bank", name: "hdfc-0418-statement-sep26.csv", rows: 93, label: "HDFC ·0418 · Bank statement", range: "1–30 Sep", confidence: 0.99 }),
      f({ slot: "gateway", name: "hdfc-card-settlements-sep26.csv", rows: 41, label: "Card · Payout report", channel: "Card", range: "1–30 Sep", confidence: 0.97 }),
      f({ slot: "gateway", name: "zomato-payouts-sep26.csv", rows: 10, label: "Zomato · Payout report", channel: "Zomato", range: "1–28 Sep", confidence: 0.99, warning: "Covers 1–28 Sep; the period runs 1–30 Sep. Days outside the file won't match." }),
    ],
  },
];

const Demo = ({ files }: { files: NeoUploadFile[] }) => {
  const [card, setCard] = useState<Extract<NeoCard, { kind: "sources-upload" }>>({
    kind: "sources-upload",
    slots: SLOTS,
    context: CONTEXT,
    files,
  });
  return <SourcesDock card={card} onChange={setCard} onAnswer={() => undefined} />;
};

type QCard = Extract<NeoCard, { kind: "decisions" }>;
const QUESTIONS: QCard = {
  kind: "decisions",
  title: "Before I draft September",
  items: [
    {
      id: "period",
      question: "Which period should this run reconcile?",
      why: "Rows outside the period are not counted.",
      recommended: "sep",
      pick: "sep",
      options: [
        { id: "sep", label: "September 2026", hint: "2026-09-01 to 2026-09-30" },
        { id: "oct", label: "1–15 October 2026", hint: "2026-10-01 to 2026-10-15" },
      ],
    },
    {
      id: "swiggy",
      question: "Swiggy paid ₹10 less than the books. What should Neo do?",
      why: "Pick one. It applies to this run only.",
      recommended: "fee",
      pick: "fee",
      options: [
        { id: "fee", label: "Treat it as a platform fee", hint: "Books it to Commission and matches the rest" },
        { id: "hold", label: "Hold it for review", hint: "Leaves the payment unmatched" },
        { id: "write", label: "Write it off", hint: "Adjusts the books by ₹10" },
      ],
      other: { fallback: "hold" },
    },
    {
      id: "carry",
      question: "A Zomato payout is due after 30 Sep. Where does it go?",
      recommended: "",
      pick: "",
      options: [
        { id: "next", label: "Carry it to October", hint: "Shows as open at month end" },
        { id: "now", label: "Count it in September" },
      ],
    },
  ],
};
const QDemo = () => {
  const [card, setCard] = useState<QCard>(QUESTIONS);
  return (
    <DecisionsCard
      card={card}
      live
      onChange={setCard}
      signoff={{
        secondary: <GhostButton>Cancel</GhostButton>,
        primary: <PrimaryButton>Continue</PrimaryButton>,
      }}
    />
  );
};

const H = ({ id, children, sub }: { id: string; children: React.ReactNode; sub?: string }) => (
  <div id={id} className="scroll-mt-20 pt-12">
    <h2 className="text-h6 font-semibold tracking-tight text-foreground">{children}</h2>
    {sub && <p className="mt-1 max-w-[62ch] text-body-3 text-muted-foreground">{sub}</p>}
  </div>
);

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="rounded-md px-2.5 py-1.5 text-body-3 text-muted-foreground hover:bg-accent hover:text-primary">
    {children}
  </a>
);

const NeoDesign = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Head>
      <title>Neo design guide</title>
    </Head>
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-2 px-6">
        <NeoMark className="h-5 w-5 text-primary" />
        <span className="mr-4 text-label-2 font-semibold">Neo design guide</span>
        <nav className="flex gap-0.5 overflow-x-auto">
          <NavLink href="#colour">Colour</NavLink>
          <NavLink href="#type">Type</NavLink>
          <NavLink href="#shadcn">shadcn</NavLink>
          <NavLink href="#questions">Questions</NavLink>
          <NavLink href="#upload">Upload card</NavLink>
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-[1040px] px-6 pb-24">
      <section className="pt-12">
        <p className="text-label-3 font-semibold uppercase tracking-wide text-primary">24 Oct 2026</p>
        <h1 className="mt-2 text-h5 font-semibold tracking-tight">One system for everything on Neo&apos;s prompt box</h1>
        <p className="mt-2 max-w-[62ch] text-body-2 text-muted-foreground">
          Built on shadcn/ui (new-york), with the brand&apos;s palette and type feeding its tokens. Containers 12px, controls 32px tall with 8px corners, number badges 6px, chips and tags round. Text is 14 and 12 only: 13 isn&apos;t on the brand scale.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <a href="/inbox?module=NEO">Open the prototype</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="#upload">See the upload card</a>
          </Button>
        </div>
      </section>

      <H id="colour" sub="One blue carries every action and every tint; neutrals carry text and lines. Colour means something: green is done, amber is worth a look, red can't be used.">
        Colour
      </H>
      <div className="mt-5 space-y-5">
        {RAMPS.map((r) => (
          <div key={r.name}>
            <p className="mb-2 text-label-3 font-semibold capitalize text-muted-foreground">{r.name === "blue" ? "Brand blue" : "Neutral"}</p>
            <div className="grid grid-cols-11 overflow-hidden rounded-xl border border-border max-md:grid-cols-6">
              {r.steps.map((s) => (
                <div key={s.step} className="min-w-0">
                  <div className="h-14" style={{ background: `var(${s.v})` }} />
                  <div className="px-1.5 py-1.5">
                    <p className="text-label-3 font-semibold">{s.step}</p>
                    <p className="text-caption-1 uppercase text-muted-foreground">{s.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-3">
          {MEANING.map((m) => (
            <div key={m.name} className="flex gap-3 rounded-xl border border-border p-3">
              <span className="h-10 w-10 flex-none rounded-lg" style={{ background: `var(${m.v})` }} />
              <div className="min-w-0">
                <p className="text-label-2 font-semibold">
                  {m.name} <span className="font-normal uppercase text-muted-foreground">{m.hex}</span>
                </p>
                <p className="text-body-4 text-muted-foreground">{m.use}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-body-3">
            <thead className="bg-accent text-label-3 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">shadcn token</th>
                <th className="px-3 py-2 font-semibold">Brand value</th>
                <th className="px-3 py-2 font-semibold max-sm:hidden">Used for</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map(([t, v, hex, use]) => (
                <tr key={t} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">
                    <code className="text-body-4">{t}</code>
                  </td>
                  <td className="px-3 py-2">
                    {hex && <span className="mr-2 inline-block h-3 w-3 rounded-sm align-[-1px]" style={{ background: hex }} />}
                    {v}
                    {hex && <span className="ml-1.5 text-body-4 uppercase text-muted-foreground">{hex}</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground max-sm:hidden">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <H id="type" sub="Three families, each with one job. Open Sans is the interface; Source Serif 4 is Neo's reading voice; IBM Plex Mono is for IDs and amounts in documents.">
        Typography
      </H>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Open Sans", "var(--font-family-primary)", "Interface", "Aa 0123 ₹"],
          ["Source Serif 4", "var(--font-family-reading)", "Neo's answers", "Aa 0123 ₹"],
          ["IBM Plex Mono", "var(--font-family-mono)", "Voucher IDs, amounts", "RCT/4137 17,151.00"],
        ].map(([n, ff, job, sample]) => (
          <div key={n} className="rounded-xl border border-border p-4">
            <p className="text-h6" style={{ fontFamily: ff }}>
              {sample}
            </p>
            <p className="mt-2 text-label-2 font-semibold">{n}</p>
            <p className="text-body-4 text-muted-foreground">{job}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        {TYPE.map(([cls, size, use, sample], i) => (
          <div key={cls} className={`flex items-baseline gap-4 px-4 py-3 ${i ? "border-t border-border" : ""}`}>
            <div className="w-[150px] flex-none">
              <code className="text-body-4 font-medium">{cls}</code>
              <p className="text-body-4 text-muted-foreground">{size}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`${cls} ${cls === "text-body-2" ? "[font-family:var(--font-family-reading)]" : ""} truncate`}>{sample}</p>
              <p className="text-body-4 text-muted-foreground">{use}</p>
            </div>
          </div>
        ))}
      </div>

      <H id="shadcn" sub="Reused as they are: nothing here is custom-drawn. The prompt box's own Button, Badge and Kbd come from components/ui; box-ui.tsx only fixes their sizes.">
        shadcn components in Neo
      </H>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-label-3 font-semibold text-muted-foreground">Button</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="h-8 rounded-lg">Reconcile</Button>
            <Button variant="outline" className="h-8 rounded-lg">Review report</Button>
            <Button variant="secondary" className="h-8 rounded-lg">Use the sample</Button>
            <Button variant="ghost" className="h-8 rounded-lg text-muted-foreground">Cancel</Button>
            <Button className="h-8 rounded-lg" disabled>Reconcile</Button>
          </div>
          <p className="mt-3 text-body-4 text-muted-foreground">One primary per card, on the right. Cancel is text-only, on the left.</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-label-3 font-semibold text-muted-foreground">Badge</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="md" className="rounded-full">Nandhini Deluxe</Badge>
            <Badge variant="neutral" size="md" className="rounded-full">September 2026</Badge>
            <Badge variant="positive" size="md" className="rounded-full">Matched</Badge>
            <Badge variant="notice" size="md" className="rounded-full">Needs a look</Badge>
            <Badge variant="negative" size="md" className="rounded-full">Can&apos;t use</Badge>
          </div>
          <p className="mt-3 text-body-4 text-muted-foreground">Chips and tags are fully round.</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-label-3 font-semibold text-muted-foreground">Kbd and Spinner</p>
          <div className="flex flex-wrap items-center gap-3 text-body-3">
            <span><Kbd>Esc</Kbd> cancel</span>
            <span><Kbd>⏎</Kbd> reconcile</span>
            <span><Kbd>1</Kbd>–<Kbd>4</Kbd> pick an answer</span>
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Spinner /> Reading…</span>
          </div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-label-3 font-semibold text-muted-foreground">Also used</p>
          <p className="text-body-3 text-muted-foreground">
            Select (role of a file) · Tooltip · Sheet and Dialog (welcome, panels) · Table (reports) · Tabs · Sonner · Command menu. Same 12px container, same rows.
          </p>
          <Separator className="my-3" />
          <p className="text-body-4 text-muted-foreground">Design tokens live in styles/globals.css; sizes for the prompt box in components/neo/common/box-ui.tsx.</p>
        </div>
      </div>

      <H id="questions" sub="Wherever Neo asks you something: the question, why, numbered answers with a recommended one, your own words, and the way on. 1–9 or arrows pick; Enter moves on; Decide all takes Neo's recommendation for every open question.">
        Questions from Neo
      </H>
      <div className="mt-5 rounded-2xl bg-accent p-4 max-sm:p-2">
        <div className="mx-auto max-w-[800px]">
          <QDemo />
        </div>
      </div>

      <H id="upload" sub="Live, and interactive: drop or choose real CSV files and Neo reads them. Opens straight from 'Reconcile September'; the sample is one link away.">
        Upload card
      </H>
      <div className="mt-5 space-y-10">
        {STATES.map((s) => (
          <div key={s.title}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-label-1 font-semibold">{s.title}</h3>
              <p className="text-body-3 text-muted-foreground">{s.note}</p>
            </div>
            <div className="rounded-2xl bg-accent p-4 max-sm:p-2">
              <div className="mx-auto max-w-[800px]">
                <Demo files={s.files} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

export default NeoDesign;
