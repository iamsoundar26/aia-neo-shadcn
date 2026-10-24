/**
 * What Neo understood from a file the person added (24 Oct 2026): its
 * role (bank statement, payment-gateway report, sales report), the account
 * or channel, the rows and date range it covers, and anything wrong with it
 * for the period being reconciled. Each answer carries how sure Neo is.
 *
 * CSV is read for real: its header names and first rows. Spreadsheets and
 * PDFs are placed by name only, so they show a lower confidence and say so.
 *
 * DEV: POST /api/neo/files/classify — the server's file-identification
 * step (S1); the rules here only stand in for it.
 */

export type UploadRole = "sales" | "gateway" | "bank";

export type Detected = {
  role?: UploadRole;
  /** "HDFC ·0418 · Bank statement" */
  label: string;
  /** Zomato, Swiggy, Card, UPI… for a gateway report. */
  channel?: string;
  /** "1–30 Sep", when dates could be read. */
  range?: string;
  from?: string;
  to?: string;
  rows?: number;
  /** 0–1 */
  confidence: number;
  /** Read from the file's content, not only its name. */
  fromContent: boolean;
  /** Stops the file being used. */
  problem?: string;
  /** Allows the file, but worth a look. */
  warning?: string;
};

export const ROLE_LABEL: Record<UploadRole, string> = {
  sales: "Sales report",
  gateway: "Payout report",
  bank: "Bank statement",
};

export const MAX_BYTES = 10 * 1024 * 1024;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const CHANNELS: { id: string; label: string; test: RegExp }[] = [
  { id: "card", label: "Card", test: /card|pos[-_ ]?machine|mpr|tid\d/i },
  { id: "upi", label: "UPI", test: /upi|phonepe|gpay|bharatpe|mid\d/i },
  { id: "zomato", label: "Zomato", test: /zomato|eternal/i },
  { id: "swiggy", label: "Swiggy", test: /swiggy/i },
];

const BANKS = /hdfc|icici|sbi|axis|kotak|yes ?bank|idfc|indusind|pnb|canara/i;

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** One date cell → ISO, or undefined. Accepts 2026-09-04, 04/09/2026, 04-Sep-26. */
export const parseDate = (raw: string): string | undefined => {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -,]*(\d{2,4})/);
  if (m) {
    const mi = MONTHS.findIndex((x) => x.toLowerCase() === m![2].toLowerCase());
    if (mi >= 0) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], mi + 1, +m[1]);
  }
  return undefined;
};

export const rangeLabel = (from: string, to: string) => {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const mon = (m: number) => MONTHS[m - 1];
  return fy === ty && fm === tm
    ? `${fd}–${td} ${mon(tm)}`
    : `${fd} ${mon(fm)}–${td} ${mon(tm)}`;
};

/** A small CSV reader: quotes, commas, newlines. Enough for a header sniff. */
const parseCsv = (text: string, limit = 4000): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length && rows.length < limit; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((x) => x.trim())) rows.push(row);
  }
  return rows;
};

const channelOf = (hay: string) => CHANNELS.find((c) => c.test.test(hay));

const roleByName = (name: string): UploadRole | undefined =>
  BANKS.test(name) && /statement|stmt|acc|a-c|\d{4}/i.test(name)
    ? "bank"
    : /bank|statement|passbook/i.test(name)
      ? "bank"
      : /zomato|swiggy|payout|settle|gateway|razorpay|paytm|upi|card|mpr/i.test(
            name
          )
        ? "gateway"
        : /sales|pos|tally|receipt|invoice|billing|daybook/i.test(name)
          ? "sales"
          : undefined;

const roleByHeader = (head: string): UploadRole | undefined => {
  const h = head.toLowerCase();
  const bank = /narration|withdrawal|deposit|chq|closing balance|value dat/.test(
    h
  );
  const gw = /settlement|payout|mdr|utr|commission|net payable|tid|mid\b|order id/.test(
    h
  );
  const sales = /bill no|invoice no|voucher|pos|item|gross sales|receipt/.test(
    h
  );
  if (bank && !gw) return "bank";
  if (gw && !bank) return "gateway";
  if (sales && !gw && !bank) return "sales";
  return undefined;
};

const accountOf = (hay: string) => {
  const d = hay.match(/(?:a\/c|acct?|account|[·•x*-])\D{0,12}(\d{4})(?!\d)/i);
  const bank = hay.match(BANKS)?.[0];
  return bank
    ? `${bank.toUpperCase().replace(/ /g, "")}${d ? ` ·${d[1]}` : ""}`
    : d
      ? `A/c ·${d[1]}`
      : "";
};

const pct = (n: number) => `${Math.round(n * 100)}% sure`;
export { pct as sureLabel };

export type DetectContext = {
  /** The period being reconciled, ISO. */
  from: string;
  to: string;
  /** Names/hashes already taken. */
  seen: { name: string; size: number }[];
};

/**
 * Read one file. `quick` skips the content read (a file that is not CSV,
 * or one the sample stands in for).
 */
export const detectFile = async (
  file: { name: string; size: number; text?: () => Promise<string> },
  ctx: DetectContext
): Promise<Detected> => {
  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const base = (over: Partial<Detected>): Detected => ({
    label: name,
    confidence: 0,
    fromContent: false,
    ...over,
  });

  if (!["csv", "xlsx", "xls", "pdf"].includes(ext))
    return base({
      problem: `.${ext || "?"} isn't supported. Add a CSV, Excel or PDF file.`,
    });
  if (file.size > MAX_BYTES)
    return base({
      problem: `${(file.size / 1_048_576).toFixed(1)} MB is over the 10 MB limit. Export a shorter period.`,
    });
  if (ctx.seen.some((s) => s.name === name && s.size === file.size))
    return base({ problem: "Already added. Remove one copy." });
  if (ext === "pdf" && /scan|image|photo|img_/i.test(name))
    return base({
      problem:
        "This looks like a scanned image. Neo reads PDFs with selectable text; download the statement from net banking instead.",
    });

  const nameRole = roleByName(name);
  const nameChannel = channelOf(name);

  // Spreadsheets and PDFs: by name only.
  if (ext !== "csv" || !file.text) {
    const role = nameRole;
    return base({
      role,
      channel: role === "gateway" ? nameChannel?.label : undefined,
      label: role
        ? [accountOf(name), nameChannel?.label, ROLE_LABEL[role]]
            .filter(Boolean)
            .join(" · ")
        : name,
      confidence: role ? 0.62 : 0,
      warning: role
        ? "Placed by file name. Neo checks the contents when you reconcile."
        : undefined,
    });
  }

  let text = "";
  try {
    text = await file.text();
  } catch {
    return base({ problem: "Couldn't read this file. Try exporting it again." });
  }
  const table = parseCsv(text.replace(/^﻿/, ""));
  if (table.length < 2)
    return base({ problem: "No rows found. The file is empty or has no data under the header." });

  // The header is the first row with several non-empty cells.
  const hi = Math.max(
    0,
    table.findIndex((r) => r.filter((c) => c.trim()).length >= 3)
  );
  const header = table[hi].map((c) => c.trim());
  const body = table.slice(hi + 1);
  const headRole = roleByHeader(header.join(" "));
  const role = headRole || nameRole;

  const dateCol = header.findIndex((c) => /date|day|period/i.test(c));
  const dates =
    dateCol >= 0
      ? body.map((r) => parseDate(r[dateCol] || "")).filter(Boolean).sort()
      : [];
  const from = dates[0];
  const to = dates[dates.length - 1];

  const hay = `${name} ${table
    .slice(0, hi + 1)
    .map((r) => r.join(" "))
    .join(" ")} ${body.slice(0, 5).map((r) => r.join(" ")).join(" ")}`;
  const channel = role === "gateway" ? channelOf(hay) : undefined;
  const acct = role === "bank" ? accountOf(hay) : "";

  let confidence = 0.3;
  if (headRole) confidence += 0.4;
  if (nameRole && nameRole === headRole) confidence += 0.25;
  else if (nameRole && !headRole) confidence += 0.15;
  if (from) confidence += 0.04;
  if (role === "gateway" && channel) confidence += 0.02;
  confidence = Math.min(0.99, confidence);
  if (!role) confidence = 0;

  const out: Detected = {
    role,
    channel: channel?.label,
    label: role
      ? [acct, role === "gateway" ? channel?.label : "", ROLE_LABEL[role]]
          .filter(Boolean)
          .join(" · ")
      : name,
    range: from && to ? rangeLabel(from, to) : undefined,
    from,
    to,
    rows: body.length,
    confidence,
    fromContent: true,
  };

  if (headRole && nameRole && headRole !== nameRole)
    out.warning = `The name says ${ROLE_LABEL[nameRole].toLowerCase()}, the columns say ${ROLE_LABEL[headRole].toLowerCase()}. Neo went with the columns.`;

  if (from && to) {
    if (to < ctx.from || from > ctx.to)
      out.problem = `Covers ${rangeLabel(from, to)} ${to.slice(0, 4)}, not this period. Export ${rangeLabel(ctx.from, ctx.to)} instead.`;
    else if (from > ctx.from || to < ctx.to)
      out.warning = `Covers ${rangeLabel(from, to)}; the period runs ${rangeLabel(ctx.from, ctx.to)}. Days outside the file won't match.`;
  }
  return out;
};
