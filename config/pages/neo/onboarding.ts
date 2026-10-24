import type { TourStep } from "@/types/pages/guide";
import { asset } from "@/lib/base-path";

/** Launch copy and the simplified product animation's media-time captions.
 * Editable source: ../Neo Launch Motion/Product happy flow/Neo-Happy-Flow.tsrct.
 */
export const RECON_WELCOME = {
  badge: "New in AI Accountant",
  title: "Neo",
  subtitle: "Your accounting assistant",
  body: "Ask Neo in chat. Neo does the work. You check it.",
  launchLabel: "First job",
  launch: "Three-way reconciliation",
  detail:
    "Neo checks every payment in your bank statement against your payout reports and books. Done in minutes, not hours.",
  outcomes: [
    "Find every payment that doesn't match",
    "Get a report you can edit and download",
    "Nothing changes in your books until you approve",
  ],
  primary: "Try it now",
  media: {
    video: asset("/onboarding/neo-happy-flow.mp4"),
    poster: asset("/onboarding/neo-happy-flow-poster.png"),
    alt: "A simplified animation of Neo: type “Match September payouts with my bank and books”, Neo checks the bank statement, payout reports and accounting records, then opens a sample reconciliation report. Happy-path illustration with setup and exception handling omitted.",
    pause: "Pause preview",
    play: "Play preview",
    listTitle: "What the preview shows",
  },
};

/** Chapter boundaries match the authored Tesseract timeline, in seconds. */
export const RECON_EXPLAINER_STEPS = [
  { title: "Ask Neo to check your month.", start: 0 },
  { title: "Neo compares your bank, payouts and books.", start: 4.8 },
  { title: "Open the report and see what's off.", start: 10.1 },
];

/**
 * Three hints for the first sample run, anchored on the report file.
 * Copy is written for a first-time user (23 Oct 2026): short sentences,
 * everyday words, one idea per card.
 */
export const RECON_TOUR: TourStep[] = [
  {
    anchor: "recon-report",
    placement: "left",
    title: "This is your report",
    body: "It's an Excel file. It shows what matched and what didn't.",
  },
  {
    anchor: "recon-report",
    placement: "left",
    title: "Fill in the yellow cells",
    body: "For each problem, choose what to do and add a short reason. Click Apply. Neo makes a new version.",
  },
  {
    title: "Or just type it",
    body: "For example: “wait on E1, payout comes 3 Oct”. Your old version stays saved.",
  },
];

export const RECON_COMPLETION =
  "All done. Your month is checked and the report is saved. Nothing in your books was changed. Next, try it with your own files.";

/**
 * The guided first reconciliation (22 Oct 2026): what "Try it now"
 * opens. Five steps, each with one note from the guide in the chat at the
 * moment it matters; the rail above the chat shows where you are.
 */
export const GUIDE_PROMPT = "Guide me through my first reconciliation";
export const GUIDE_SAMPLE_PROMPT = "Reconcile September with the sample files";

export const GUIDE_STEPS = [
  { n: 1, label: "Pick files" },
  { n: 2, label: "Check files" },
  { n: 3, label: "Match" },
  { n: 4, label: "Decide" },
  { n: 5, label: "See report" },
] as const;

/**
 * Guided mode's hints (24 Oct 2026). Written for a first-time SME user who
 * reads little: one line each, everyday words, no more than eight. Each
 * hint ends in "Next".
 */
export const GUIDE_COPY = {
  rail: "Guide",
  exit: "Turn off guide",
  done: "Done",
  again: "Try with my files",
  month: {
    title: "",
    body: "Pick the month.",
    anchor: "neo-sheet",
    placement: "top" as const,
  },
  intro: {
    title: "",
    body: "Add your files. Any order.",
    anchor: "neo-sources-dock",
    placement: "top" as const,
  },
  choice: {
    sample: { label: "Use sample files", title: "", body: "", tag: "Recommended" },
    own: { label: "Use my own files", title: "", body: "" },
  },
  upload: { title: "", needs: [] as { label: string; hint: string; auto?: boolean }[], choose: "Choose files", fallback: "Use sample files instead", note: "" },
  notes: {
    check: {
      title: "",
      body: "Neo is reading your files.",
      anchor: "neo-reasoning-live",
      placement: "bottom" as const,
      holds: true,
    },
    rejected: {
      title: "",
      body: "Some rows can't be read. Pick a fix.",
      anchor: "neo-sheet",
      placement: "top" as const,
    },
    match: {
      title: "",
      body: "Neo is matching your money.",
      anchor: "neo-reasoning-live",
      placement: "bottom" as const,
      holds: true,
    },
    decide: {
      title: "",
      body: "Check Neo's answers. Then submit.",
      anchor: "neo-sheet",
      placement: "top" as const,
    },
    review: {
      title: "",
      body: "Done. Open your report.",
      anchor: "recon-report",
      placement: "left" as const,
      final: true,
    },
    setup: {
      title: "",
      body: "Check these. Then confirm.",
      anchor: "neo-sheet",
      placement: "top" as const,
    },
    edit: {
      title: "",
      body: "Fill the yellow cells. Then apply.",
      anchor: "recon-report",
      placement: "left" as const,
    },
  },
};
