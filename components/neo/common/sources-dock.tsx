import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  Lock,
  Upload,
  X,
} from "@/components/icons";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { GhostButton, PrimaryButton, questionShell } from "./box-ui";
import { fileOf, keepFile } from "@/utils/pages/neo/attachment-files";
import {
  CHANNELS,
  ROLE_LABEL,
  detectFile,
  sureLabel,
  type UploadRole,
} from "@/utils/pages/neo/detect-file";
import type { NeoCard, NeoUploadFile } from "@/types/pages/neo";

type Card = Extract<NeoCard, { kind: "sources-upload" }>;

type Props = {
  card: Card;
  onChange: (card: Card) => void;
  /** "go" with all the files, "sample" for Neo's, "cancel" to stop. */
  onAnswer: (id: "go" | "sample" | "cancel") => void;
};

const sizeOf = (n: number) =>
  n >= 1_048_576
    ? `${(n / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

const ROLES: UploadRole[] = ["bank", "gateway", "sales"];

const orList = (xs: string[]) =>
  xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`;

/** The slot a file counts toward, once it is read and usable. */
const usable = (f: NeoUploadFile) => f.state !== "reading" && f.state !== "error";

/** What the card still needs, in the order a person would add it. */
export const coverageOf = (card: Card) => {
  const ok = card.files.filter((f) => usable(f) && f.slot);
  const has = (slot: string) => ok.filter((f) => f.slot === slot);
  const missing = card.slots.filter(
    (s) => !s.connected && has(s.id).length === 0
  );
  const channels = CHANNELS.map((c) => ({
    ...c,
    found: has("gateway").some((f) => f.channel === c.label),
  }));
  return {
    missing,
    channels,
    ready: missing.length === 0,
    reading: card.files.some((f) => f.state === "reading"),
    gateway: has("gateway").length > 0,
  };
};

/**
 * Neo waiting on your own files. The prompt box becomes one card that
 * says what it is for (client and period), takes any files, reads each
 * one and shows what it understood ("HDFC ·0418 · Bank statement · 1–30
 * Sep · 98% sure"), catches the wrong month, duplicates and unreadable
 * files at once, and keeps a coverage checklist of the three sources, so
 * a missing Swiggy payout shows before the run, not after.
 *
 * Keyboard: focus lands on the card; Enter reconciles when ready, Esc
 * cancels.
 */
const SourcesDock = ({ card, onChange, onAnswer }: Props) => {
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLElement>(null);
  const latest = useRef(card);
  latest.current = card;
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const { slots, files, context } = card;
  const cov = coverageOf(card);
  const [heard, setHeard] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    root.current?.focus({ preventScroll: true });
    // Files that came in from the paperclip arrive unread: read them now.
    const unread = latest.current.files.filter((f) => !f.state);
    if (!unread.length) return;
    push(
      latest.current.files.map((f) =>
        f.state ? f : { ...f, state: "reading" as const }
      )
    );
    unread.forEach((f, i) => {
      const file = fileOf(f.name);
      if (file) scan(file, i);
      else
        patchFile(`${f.name}:${f.size}`, {
          state: "ready",
          label: f.name,
          slot: "",
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = (next: NeoUploadFile[]) => {
    latest.current = { ...latest.current, files: next };
    onChange(latest.current);
  };
  const keyOf = (f: { name: string; size: number }) => `${f.name}:${f.size}`;
  const patchFile = (key: string, patch: Partial<NeoUploadFile>) =>
    push(
      latest.current.files.map((f) =>
        keyOf(f) === key ? { ...f, ...patch } : f
      )
    );

  /** Read one file and show what Neo understood from it. */
  const scan = (f: File, i = 0) => {
    const range = {
      from: context?.from || "0000-00-00",
      to: context?.to || "9999-99-99",
    };
    void detectFile(f, { ...range, seen: [] }).then((d) =>
      window.setTimeout(
        () =>
          patchFile(keyOf(f), {
            slot: d.role || "",
            state: d.problem ? "error" : "ready",
            label: d.label,
            channel: d.channel,
            range: d.range,
            rows: d.rows,
            confidence: d.confidence,
            fromContent: d.fromContent,
            problem: d.problem,
            warning: d.warning,
          }),
        // A beat, so reading is seen to happen.
        450 + i * 160
      )
    );
  };

  const add = (list: FileList | File[]) => {
    const have = new Set(latest.current.files.map(keyOf));
    const incoming: File[] = [];
    const dups: string[] = [];
    for (const f of Array.from(list)) {
      // The same file twice is one file: say so, don't add a second row.
      if (have.has(keyOf(f))) dups.push(f.name);
      else {
        have.add(keyOf(f));
        incoming.push(f);
        keepFile(f);
      }
    }
    setNotice(
      dups.length
        ? `${dups.length === 1 ? dups[0] : `${dups.length} files`} already added`
        : ""
    );
    if (dups.length) window.setTimeout(() => setNotice(""), 3500);
    if (!incoming.length) return;
    push([
      ...latest.current.files,
      ...incoming.map(
        (f): NeoUploadFile => ({
          slot: "",
          name: f.name,
          size: f.size,
          state: "reading",
        })
      ),
    ]);
    setHeard(
      `Reading ${incoming.length} file${incoming.length === 1 ? "" : "s"}`
    );
    incoming.forEach(scan);
  };

  const remove = (key: string) =>
    push(latest.current.files.filter((f) => keyOf(f) !== key));

  const move = (key: string, role: UploadRole) =>
    patchFile(key, {
      slot: role,
      moved: true,
      label: ROLE_LABEL[role],
      channel: undefined,
      confidence: 1,
    });

  const status = (() => {
    if (notice) return notice;
    if (cov.reading) return "Reading your files…";
    if (cov.ready && files.length === 0) return "";
    if (cov.ready) {
      const miss = cov.channels.filter((c) => !c.found);
      return miss.length
        ? `Ready. No ${orList(miss.map((m) => m.label))} payout found yet.`
        : "Everything Neo needs is here.";
    }
    return `Still needed: ${cov.missing.map((s) => s.label.toLowerCase()).join(", ")}`;
  })();

  return (
    <section
      ref={root}
      tabIndex={-1}
      aria-label="Add your documents"
      data-guide-id="neo-sources-dock"
      data-testid="sources-dock"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onAnswer("cancel");
        } else if (
          e.key === "Enter" &&
          cov.ready &&
          !cov.reading &&
          (e.target as HTMLElement) === e.currentTarget
        ) {
          e.preventDefault();
          onAnswer("go");
        }
      }}
      onDragEnter={(e) => {
        if (!Array.from(e.dataTransfer.types).includes("Files")) return;
        e.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!Array.from(e.dataTransfer.types).includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        if (e.dataTransfer.files.length) add(e.dataTransfer.files);
      }}
      className={cn(
        questionShell,
        "flex max-h-[min(72vh,560px)] flex-col overflow-hidden outline-none duration-200 animate-in fade-in-0 slide-in-from-bottom-2"
      )}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept=".csv,.xlsx,.xls,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose files"
        data-testid="sources-input"
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5">
        <button
          type="button"
          data-testid="sources-drop"
          onClick={() => input.current?.click()}
          className={cn(
            "group flex w-full flex-none flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand-border",
            over
              ? "border-pi-brand bg-[var(--palette-blue-100)]"
              : "border-pi-line-2 bg-pi-head-bg hover:border-pi-brand hover:bg-[var(--palette-blue-100)]",
            files.length
              ? "h-[52px] flex-row gap-2"
              : "h-[120px] [@media(max-height:700px)]:h-[88px]"
          )}
        >
          <Upload className="h-5 w-5 flex-none text-pi-brand" />
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold leading-5 text-pi-ink">
              {over
                ? "Release to add"
                : files.length
                  ? "Add more files"
                  : "Drop your files here"}
            </span>
            {!files.length && (
              <span className="mt-0.5 block text-[14px] leading-5 text-pi-body">
                {slots
                  .filter((x) => !x.connected)
                  .map((x) => x.label)
                  .join(" · ")}{" "}
                · or{" "}
                <span className="text-pi-brand underline underline-offset-2">
                  choose files
                </span>
              </span>
            )}
          </span>
        </button>
        {files.length > 0 && (
          <ul className="order-2 mt-2 flex flex-none flex-col gap-1.5" data-testid="sources-files">
            {files.map((f) => {
              const key = keyOf(f);
              const unplaced = f.state === "ready" && !f.slot;
              const Icon = /\.pdf$/i.test(f.name) ? FileText : FileSpreadsheet;
              return (
                <li
                  key={key + (f.problem || "")}
                  data-state={unplaced ? "unplaced" : f.state}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border px-2.5 py-2 duration-200 animate-in fade-in-0",
                    f.state === "error"
                      ? "border-pi-danger-line bg-pi-danger-bg"
                      : unplaced
                        ? "border-pi-warning-line bg-pi-warning-bg"
                        : "border-pi-line-2 bg-background"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg",
                      f.state === "error"
                        ? "bg-background text-pi-danger"
                        : "bg-pi-brand-tint text-pi-brand"
                    )}
                  >
                    {f.state === "reading" ? (
                      <Spinner className="h-4 w-4" />
                    ) : f.state === "error" ? (
                      <CircleAlert className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-body-3 font-medium leading-5 text-pi-ink"
                      title={f.name}
                    >
                      {f.name}
                      <span className="ml-2 font-normal text-pi-faint">
                        {sizeOf(f.size)}
                        {f.rows ? ` · ${f.rows.toLocaleString("en-IN")} rows` : ""}
                      </span>
                    </p>
                    {f.state === "reading" && (
                      <p className="text-[12px] leading-4 text-pi-body">
                        Reading…
                      </p>
                    )}
                    {f.state === "error" && (
                      <p
                        className="text-[12px] leading-4 text-pi-danger"
                        role="alert"
                      >
                        {f.problem}
                      </p>
                    )}
                    {f.state === "ready" && !unplaced && (
                      <p className="text-[12px] leading-4 text-pi-body">
                        {[f.label, f.range].filter(Boolean).join(" · ")}
                        {f.confidence !== undefined && f.confidence > 0 && !f.moved && (
                          <>
                            {" · "}
                            <span
                              className={cn(
                                f.confidence >= 0.85
                                  ? "text-pi-success"
                                  : "text-pi-warning"
                              )}
                            >
                              {sureLabel(f.confidence)}
                            </span>
                          </>
                        )}
                      </p>
                    )}
                    {unplaced && (
                      <p className="text-[12px] leading-4 text-pi-warning">
                        Neo couldn&apos;t tell what this is. Pick one.
                      </p>
                    )}
                    {f.state === "ready" && f.warning && !unplaced && (
                      <p className="mt-0.5 flex items-start gap-1 text-[12px] leading-4 text-pi-warning">
                        <CircleAlert className="mt-px h-3 w-3 flex-none" />
                        {f.warning}
                      </p>
                    )}
                  </div>
                  {f.state === "ready" && (
                    <Select
                      value={f.slot || undefined}
                      onValueChange={(v) => move(key, v as UploadRole)}
                    >
                      <SelectTrigger
                        aria-label={`What ${f.name} is`}
                        className="h-8 w-[150px] flex-none rounded-lg text-body-3 max-sm:w-[44px]"
                      >
                        <SelectValue placeholder="What is it?" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-body-3">
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => remove(key)}
                    className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg text-pi-body hover:bg-pi-fill hover:text-pi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-brand-border"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

      </div>

      <div className="mx-4 h-px flex-none bg-pi-line-2" aria-hidden />
      <div className="flex-none px-4">
        <label className="sr-only" htmlFor="neo-upload-note">
          Something else
        </label>
        <input
          id="neo-upload-note"
          value={card.note || ""}
          onChange={(e) => {
            latest.current = { ...latest.current, note: e.target.value };
            onChange(latest.current);
          }}
          placeholder="Something else…"
          className="h-10 w-full bg-transparent text-[14px] leading-5 text-pi-ink outline-none placeholder:text-pi-faint"
        />
      </div>

      <footer className="flex flex-none items-center gap-3 px-3 pb-3 pt-0.5">
        <GhostButton onClick={() => onAnswer("cancel")}>Cancel</GhostButton>
        <p
          className="min-w-0 flex-1 truncate text-[14px] text-pi-faint"
          aria-live="polite"
        >
          {status && (
            <span className={cn(cov.ready && !cov.reading && "text-pi-body")}>
              {status}
            </span>
          )}
        </p>
        <button
          type="button"
          data-testid="sources-sample"
          onClick={() => onAnswer("sample")}
          className="h-8 flex-none rounded-lg px-2 text-[14px] font-semibold text-pi-brand transition-colors hover:bg-pi-brand-tint hover:text-pi-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
        >
          Use the sample
        </button>
        <span className="sr-only" role="status">
          {heard}
        </span>
        <PrimaryButton
          data-testid="sources-go"
          disabled={!cov.ready || cov.reading}
          onClick={() => onAnswer("go")}
        >
          Reconcile
          {cov.ready && !cov.reading && (
            <Kbd className="ml-1.5 bg-white/20 text-primary-foreground max-sm:hidden">
              ⏎
            </Kbd>
          )}
        </PrimaryButton>
      </footer>
    </section>
  );
};

export default SourcesDock;
