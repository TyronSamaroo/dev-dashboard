import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  HeartPulse,
  Lock,
  RefreshCw,
  Route,
  ShieldCheck,
  Trophy,
  Watch,
  Zap,
} from "lucide-react";
import { useEffect, type ElementType } from "react";
import { Link, useLocation } from "react-router-dom";

type ReleaseNote = {
  build: string;
  date: string;
  label: string;
  title: string;
  summary: string;
  icon: ElementType;
  tags: string[];
  highlights: string[];
};

const releaseNotes: ReleaseNote[] = [
  {
    build: "22",
    date: "Jun 21, 2026",
    label: "In review",
    title: "Compete invites and diagnostics",
    summary:
      "Build 22 is the next beta candidate for household competition: invite deep links, CloudKit share acceptance, join confirmation, and clearer sync diagnostics.",
    icon: Trophy,
    tags: ["Compete", "CloudKit", "Diagnostics"],
    highlights: [
      "Added compete invite deep links so a shared board can be joined from a link instead of manual copy/paste only.",
      "Added CKShare acceptance handling and a join confirmation screen for safer household-board setup.",
      "Added a Compete diagnostics sheet that separates iCloud status, board state, schema issues, and last sync details.",
      "PR #22 is open for this candidate; CI needs attention before it becomes the next merged/TestFlight build.",
    ],
  },
  {
    build: "21",
    date: "Jun 21, 2026",
    label: "Testing",
    title: "TestFlight build 21 and production CloudKit",
    summary:
      "Build 21 moved the app into TestFlight testing, refreshed beta notes, and deployed the production CloudKit schema for household compete.",
    icon: ShieldCheck,
    tags: ["TestFlight", "Compete", "CloudKit"],
    highlights: [
      "Uploaded 0.1.0 (21) to App Store Connect and moved the build from Ready to Submit into Testing.",
      "Prepared shared beta tester notes focused on HealthKit, Live Activity, Watch, Insights, and Compete.",
      "Deployed CloudKit schema changes to Production from CloudKit Console.",
      "Verified production schema includes queryable CompetitionEntry.groupHash and HouseholdCompetitionBoard.groupHash fields for household sync.",
    ],
  },
  {
    build: "20",
    date: "Jun 20, 2026",
    label: "Shipped",
    title: "Health refresh reliability",
    summary:
      "Build 20 focused on making Apple Health and Lock Screen step updates more dependable while keeping local data from being wiped by bad reads.",
    icon: RefreshCw,
    tags: ["HealthKit", "Reliability"],
    highlights: [
      "HealthKit observers register at launch for steps, distance, energy, flights, and workouts.",
      "Background wakes refresh local summaries before returning control to iOS.",
      "Suspicious all-zero reads preserve saved summaries instead of blanking the dashboard.",
      "Settings gained Health sync repair diagnostics for stuck data.",
    ],
  },
  {
    build: "19",
    date: "Jun 17, 2026",
    label: "Shipped",
    title: "Daily-use quality of life",
    summary:
      "This pass made the app feel better to open every day: fewer repeated taps, clearer sync state, and a faster route to troubleshooting.",
    icon: Zap,
    tags: ["QOL", "Settings"],
    highlights: [
      "Pull-to-refresh landed on Today, Activity, and Insights.",
      "Activity filters and Insights scope now remember the last selected view.",
      "Today Quick Digest summarizes peak hour, remaining steps, workouts, and the next best action.",
      "Compete sync state and Settings diagnostics became easier to read and copy.",
    ],
  },
  {
    build: "17",
    date: "Jun 15, 2026",
    label: "Shipped",
    title: "Cardio, zones, and drill-downs",
    summary:
      "Insights became more than a receipt. You can browse periods, open cardio detail, and move from a week to a day to a workout.",
    icon: HeartPulse,
    tags: ["Cardio", "Insights"],
    highlights: [
      "Day, week, and month Insights navigation with Monday-start weeks.",
      "Cardio analytics across walking, running, cycling, stairs, hiking, swimming, elliptical, and rowing.",
      "Editable heart-rate zones reused across Insights, Workout Detail, share cards, and Today coloring.",
      "Week and day drill-down screens navigate into existing workout details.",
    ],
  },
  {
    build: "11",
    date: "Jun 12, 2026",
    label: "Shipped",
    title: "Public repo readiness",
    summary:
      "The project got a cleaner GitHub story: validation notes, typecheck fixes, and a README that explains the product and privacy model.",
    icon: GitBranch,
    tags: ["GitHub", "Docs"],
    highlights: [
      "Fixed Live Activity typecheck issues in CI.",
      "Polished README and development notes for the public repository.",
      "Kept the privacy story clear: raw HealthKit samples stay on-device.",
    ],
  },
  {
    build: "10",
    date: "Jun 12, 2026",
    label: "Shipped",
    title: "Today Coach and home redesign",
    summary:
      "Today changed from a basic dashboard into the app's home base with goals, coaching, weather, and period receipt context.",
    icon: Activity,
    tags: ["Today", "Coach"],
    highlights: [
      "Added automatic Live Activity behavior and moved controls into Settings.",
      "Added period summaries, coach insights, receipt UI, and same-type workout context.",
      "Redesigned the Today home experience with clearer hero hierarchy.",
    ],
  },
  {
    build: "3",
    date: "Jun 11, 2026",
    label: "Shipped",
    title: "Workout receipts get real detail",
    summary:
      "Workout detail moved closer to an Apple Fitness-style experience, with stronger color, heart-rate context, and shareable cards.",
    icon: Watch,
    tags: ["Workouts", "Share"],
    highlights: [
      "Improved dashboard contrast and restored the light theme default.",
      "Added workout metadata, weather, heart-rate samples, zone breakdowns, and compact metrics.",
      "Added richer share cards for common workouts like strength, stairs, outdoor walk, and indoor walk.",
      "Added workout drill-ins, tags, templates, and route detail views.",
    ],
  },
  {
    build: "2",
    date: "Jun 11, 2026",
    label: "Shipped",
    title: "Family beta path",
    summary:
      "The app moved from local prototype toward family testing, with signing, privacy, TestFlight notes, and direct phone installs documented.",
    icon: ShieldCheck,
    tags: ["TestFlight", "Family"],
    highlights: [
      "Configured Apple developer team and production install scripts.",
      "Documented the build two TestFlight candidate and iPhone install proof.",
      "Added privacy policy, App Store Connect submission notes, and non-exempt encryption status.",
    ],
  },
  {
    build: "1",
    date: "Jun 10, 2026",
    label: "Foundation",
    title: "Apple Health dashboard foundation",
    summary:
      "The first usable direction proved the core idea: Apple Health as the source of truth, local summaries, and a simple activity product surface.",
    icon: Lock,
    tags: ["HealthKit", "CloudKit"],
    highlights: [
      "Added activity history, workouts, insights, settings, and GitHub readiness gates.",
      "Cached derived activity summaries for faster reads.",
      "Added early competition leaderboard and household check-ins.",
      "Prepared HealthKit and CloudKit entitlements with aggregate-only sync boundaries.",
    ],
  },
];

const testerGuide = [
  "Install the latest beta build, then open Today, pull to refresh, and confirm real Health data appears.",
  "Open a workout and inspect duration, burn, heart-rate zones, and share card output.",
  "Browse Insights by week and month, then drill into cardio and day details.",
  "Use Compete sync and confirm both beta phones can see the same shared board.",
  "Use Settings diagnostics or Repair Health Sync if data looks stale.",
];

const pillars = [
  {
    title: "Local-first health data",
    body: "Raw HealthKit samples stay on the iPhone. CloudKit is limited to private aggregate summaries and preferences.",
    icon: Lock,
  },
  {
    title: "Workout receipts",
    body: "Strength, stair stepper, outdoor walk, and indoor walk views show compact stats, heart rate, zones, and share cards.",
    icon: Watch,
  },
  {
    title: "Shared beta testing",
    body: "The beta path is built around real iPhones, TestFlight, production CloudKit, and practical household-board validation.",
    icon: Trophy,
  },
];

const currentStatus = [
  ["Latest build", "0.1.0 (22) candidate in review"],
  ["Compete", "Invite links and diagnostics added"],
  ["CloudKit", "Production schema deployed and queryable fields verified"],
  ["Next proof", "Fix PR checks, merge, upload, then verify on both beta phones"],
];

function ReleaseArticle({ release, index }: { release: ReleaseNote; index: number }) {
  const Icon = release.icon;

  return (
    <article className="group grid gap-4 border-t border-zinc-800/80 py-8 md:grid-cols-[9rem_1fr]">
      <div className="flex items-start gap-3 md:block">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-emerald-300 transition-colors group-hover:border-emerald-400/40">
          <Icon size={18} />
        </div>
        <div className="md:mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{release.date}</p>
          <p className="mt-1 text-sm font-medium text-zinc-300">Build {release.build}</p>
          <p className="mt-1 text-xs text-emerald-300">{release.label}</p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{release.title}</h2>
          {index === 0 && (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
              Latest
            </span>
          )}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{release.summary}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {release.tags.map((tag) => (
            <span key={tag} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
              {tag}
            </span>
          ))}
        </div>

        <ul className="mt-5 grid gap-3">
          {release.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-3 text-sm leading-6 text-zinc-300">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function StepReceiptChangelog() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.slice(1);
    if (!id) return;

    const scrollToSection = () => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    const frame = window.requestAnimationFrame(scrollToSection);
    const timeout = window.setTimeout(scrollToSection, 250);
    const settledTimeout = window.setTimeout(scrollToSection, 900);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(settledTimeout);
    };
  }, [location.hash]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100">
          <ArrowLeft size={16} />
          Back to selected work
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Updated Jun 21, 2026</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Latest candidate 0.1.0 (22)</span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">Production CloudKit verified</span>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_80%_24%,rgba(59,130,246,0.14),transparent_28%)]" />
        <div className="relative grid gap-10 p-6 md:grid-cols-[1fr_20rem] md:p-10 lg:p-12">
          <div className="flex min-h-[28rem] flex-col justify-between md:min-h-[34rem]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-emerald-300/70" />
                <span className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-300">Project changelog</span>
              </div>
              <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-zinc-50 sm:text-6xl md:text-7xl lg:text-8xl">
                StrideSlip
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                A personal-first iPhone activity app built around Apple Health, workout receipts, heart-rate context, and shared beta feedback.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["HealthKit", "Source of truth"],
                ["ActivityKit", "Lock Screen steps"],
                ["CloudKit", "Aggregate sync only"],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-zinc-800 pt-4">
                  <p className="text-sm font-semibold text-zinc-100">{label}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[18rem] self-end">
            <div className="absolute -inset-8 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-700 bg-zinc-900 p-2 shadow-2xl shadow-black/50">
              <img
                src="/portfolio/stride-slip-build-22.png"
                alt="StrideSlip Today screen showing steps, weather, and progress"
                className="h-full w-full rounded-[1.5rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 py-8 md:grid-cols-4">
        {currentStatus.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</p>
            <p className="mt-3 text-sm font-medium leading-6 text-zinc-100">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.title} className="border-t border-zinc-800 pt-5">
              <Icon className="mb-4 h-5 w-5 text-emerald-300" />
              <h2 className="text-base font-semibold text-zinc-100">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{pillar.body}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">On this page</p>
              <div className="mt-3 grid gap-2 text-sm">
                <a href="#timeline" className="text-zinc-400 transition-colors hover:text-zinc-100">Release timeline</a>
                <a href="#tester-guide" className="text-zinc-400 transition-colors hover:text-zinc-100">Tester guide</a>
                <a href="#limits" className="text-zinc-400 transition-colors hover:text-zinc-100">Known limits</a>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Project links</p>
              <a
                href="https://github.com/TyronSamaroo/step-receipt-ios"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Source repo <ArrowUpRight size={14} />
              </a>
              <a
                href="https://github.com/TyronSamaroo/step-receipt-ios/pull/22"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-emerald-300 transition-colors hover:text-emerald-200"
              >
                Latest PR <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </aside>

        <div id="timeline" className="scroll-mt-24">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Release timeline</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">What changed over time</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500">
              Based on local build notes, git history, App Store Connect state, PR review status, and CloudKit production schema proof from June 10 through June 21, 2026.
            </p>
          </div>

          {releaseNotes.map((release, index) => (
            <ReleaseArticle key={`${release.build}-${release.title}`} release={release} index={index} />
          ))}

          <section id="tester-guide" className="scroll-mt-24 border-t border-zinc-800 py-8">
            <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
              <div>
                <CalendarDays className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-zinc-50">Shared beta test guide</h2>
              </div>
              <ul className="grid gap-3">
                {testerGuide.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-300">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section id="limits" className="scroll-mt-24 border-t border-zinc-800 py-8">
            <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
              <div>
                <Route className="h-5 w-5 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-zinc-50">Known limits</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-zinc-400">
                <p>
                  Lock Screen steps are limited by iOS background scheduling. Apple Health can wake the app, but it cannot guarantee every-step or every-minute updates while the app is closed.
                </p>
                <p>
                  Build 22 is still a candidate until the open PR checks are fixed, merged, and uploaded as a new beta build.
                </p>
                <p>
                  Household competition uses aggregate totals only. Raw HealthKit samples, routes, and workouts remain on-device.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
