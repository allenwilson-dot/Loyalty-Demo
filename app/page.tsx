import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExperienceCard {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  cta: string;
  highlights: string[];
  tone: "navy" | "cyan" | "emerald";
}

const EXPERIENCES: ExperienceCard[] = [
  {
    title: "Customer Loyalty",
    description:
      "Polished member experience with a live points balance, tier progress, and a curated rewards catalogue.",
    icon: Users,
    href: "/user/loyalty",
    cta: "Open member dashboard",
    highlights: [
      "Real-time points balance & expiry",
      "Tier progress with perks",
      "Redemption flow with vouchers",
    ],
    tone: "cyan",
  },
  {
    title: "Admin Back Office",
    description:
      "Operational control center for the loyalty program — members, tiers, vouchers, and audit logs.",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    cta: "Enter back office",
    highlights: [
      "Role-based access (Admin, Merchant, Viewer)",
      "Voucher & merchant management",
      "Tamper-evident audit trail",
    ],
    tone: "navy",
  },
  {
    title: "Merchant Portal",
    description:
      "Partner workspace for onboarding, voucher issuance, and redemption performance tracking.",
    icon: Store,
    href: "/admin/vouchers",
    cta: "Explore merchant tools",
    highlights: [
      "Onboarding workflow",
      "Voucher issuance & status",
      "Redemption performance",
    ],
    tone: "emerald",
  },
];

const TONE_STYLES: Record<ExperienceCard["tone"], string> = {
  navy: "from-navy-900 to-navy-700",
  cyan: "from-cyan-600 to-cyan-500",
  emerald: "from-emerald-600 to-emerald-500",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-mesh">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
            <span className="text-sm font-semibold">LM</span>
          </span>
          <span className="text-sm font-semibold text-foreground">
            Loyalty Co.
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#experiences" className="transition-colors hover:text-foreground">
            Experiences
          </a>
          <a href="#foundation" className="transition-colors hover:text-foreground">
            Foundation
          </a>
          <Button asChild size="sm">
            <a href="/admin/dashboard">Open back office</a>
          </Button>
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24">
        <section className="pt-12 md:pt-20">
          <Badge variant="accent" className="uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> Foundation build · v0.1
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground text-balance md:text-6xl">
            A high-end loyalty program, designed for members and the teams behind it.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Choose how you want to explore the product. The customer experience
            and the back-office admin panel are both ready to walk through —
            pick a starting point to get oriented.
          </p>
        </section>

        <section
          id="experiences"
          className="mt-14 grid gap-6 md:grid-cols-3"
          aria-label="Experiences"
        >
          {EXPERIENCES.map((exp) => {
            const Icon = exp.icon;
            return (
              <article
                key={exp.title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div
                  className={`bg-gradient-to-br ${TONE_STYLES[exp.tone]} p-6 text-white`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-semibold">{exp.title}</h2>
                  </div>
                  <p className="mt-4 text-sm text-white/80">{exp.description}</p>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {exp.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Star className="mt-0.5 h-3.5 w-3.5 text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {exp.cta}
                    </span>
                    <Button
                      asChild
                      size="sm"
                      variant={exp.tone === "navy" ? "default" : "accent"}
                      className="gap-1.5"
                    >
                      <Link href={exp.href}>
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section
          id="foundation"
          className="mt-20 grid gap-6 rounded-2xl border border-border/60 bg-white p-8 shadow-card md:grid-cols-3"
        >
          {[
            {
              title: "Production-ready scaffolding",
              body: "Next.js App Router, TypeScript, Tailwind, and a shadcn/ui base — wired up like a real product, not a demo.",
            },
            {
              title: "Role-based access",
              body: "Admin, Merchant, and Viewer roles are enforced through a single RBAC layer that drives the sidebar.",
            },
            {
              title: "Extensible data model",
              body: "Typed domain models, localStorage persistence, and a clean separation between UI and data so future steps drop in cleanly.",
            },
          ].map((item) => (
            <div key={item.title}>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-navy-900">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-white/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-6 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© 2026 Loyalty Co. — Foundation build</span>
          <span>Built with Next.js, Tailwind, and shadcn/ui conventions.</span>
        </div>
      </footer>
    </div>
  );
}
