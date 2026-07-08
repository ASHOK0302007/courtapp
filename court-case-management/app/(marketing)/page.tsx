import Link from "next/link";
import { Button } from "@/components/ui/button";

const DOCKET_STEPS = [
  { entry: "01", title: "File", detail: "Submit an appeal with supporting documents." },
  { entry: "02", title: "Verify", detail: "A court officer reviews filings and evidence." },
  { entry: "03", title: "Hear", detail: "A judge is assigned and a hearing is scheduled." },
  { entry: "04", title: "Judge", detail: "Notes are recorded and a judgment is published." },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col">
      <header className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-ink-800 font-display text-sm font-semibold text-ink-800">
            D
          </div>
          <span className="font-display text-lg font-medium text-ink-900">Docket</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">File a case</Button>
          </Link>
        </nav>
      </header>

      <section className="grid grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-brass-500">
            Case management, in order
          </p>
          <h1 className="font-display text-4xl font-medium leading-tight text-ink-900 md:text-5xl">
            Every appeal, tracked from filing to judgment.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-500">
            Docket gives citizens, court officers, and judges one shared record of a
            case&apos;s progress — who filed it, who reviewed it, when it&apos;s heard, and what
            was decided.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register">
              <Button size="lg">File a case appeal</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* Signature element: a docket stamp / case-file card, standing in
            for the generic "big stat + gradient" hero pattern. */}
        <div className="relative mx-auto w-full max-w-sm rotate-1 rounded-lg border border-ink-100 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-dashed border-ink-200 pb-3">
            <span className="font-mono text-xs text-ink-400">CASE-2026-000123</span>
            <span className="rounded-sm border border-brass-400/50 bg-brass-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-brass-600">
              Verified
            </span>
          </div>
          <p className="mt-4 font-display text-base text-ink-900">
            Appeal against zoning permit denial
          </p>
          <ul className="mt-4 space-y-3 border-t border-dashed border-ink-200 pt-4">
            {DOCKET_STEPS.map((step) => (
              <li key={step.entry} className="flex gap-3 text-sm">
                <span className="font-mono text-ink-300">{step.entry}</span>
                <span className="font-medium text-ink-800">{step.title}</span>
                <span className="text-ink-400">{step.detail}</span>
              </li>
            ))}
          </ul>
          <div className="absolute -right-3 -top-3 flex h-16 w-16 -rotate-12 items-center justify-center rounded-full border-2 border-brass-400 font-display text-[10px] font-semibold uppercase leading-tight text-brass-500">
            Filed &amp; sealed
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-4">
        {[
          { role: "Citizen", copy: "File appeals, upload evidence, and follow the outcome." },
          { role: "Court officer", copy: "Verify filings, assign cases, and schedule hearings." },
          { role: "Judge", copy: "Review assigned cases, record notes, publish judgments." },
          { role: "Admin", copy: "Manage accounts, monitor the docket, configure the system." },
        ].map((item) => (
          <div key={item.role} className="rounded-lg border border-ink-100 bg-white p-5">
            <h3 className="font-display text-base font-medium text-ink-900">{item.role}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.copy}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-ink-100 px-6 py-8 text-sm text-ink-400">
        Docket — Court Case Management System
      </footer>
    </div>
  );
}
