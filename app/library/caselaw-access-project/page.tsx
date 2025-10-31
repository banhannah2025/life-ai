import type { ReactNode } from "react";
import Link from "next/link";

import {
  buildCapCaseHtmlUrl,
  buildCapCaseJsonUrl,
  buildCapVolumeAssetUrl,
  buildCourtListenerUrl,
  getCapJurisdictions,
  getCapReporters,
} from "@/lib/caselaw/cap";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export default async function CaseLawAccessProjectPage() {
  const [jurisdictions, reporters] = await Promise.all([getCapJurisdictions(), getCapReporters()]);
  const totalCaseCount = jurisdictions.reduce((sum, entry) => sum + entry.caseCount, 0);
  const totalVolumeCount = jurisdictions.reduce((sum, entry) => sum + entry.volumeCount, 0);
  const totalReporterCount = reporters.length;
  const topJurisdictions = jurisdictions
    .slice()
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, 10);
  const regionalCoverage = reporters
    .filter((reporter) => reporter.jurisdictions.some((jurisdiction) => jurisdiction.name === "Regional"))
    .slice(0, 6);
  const sampleReporterSlug = "a2d";
  const sampleVolumeFolder = "100";
  const sampleCaseFile = "0036-01";
  const sampleZipUrl = buildCapVolumeAssetUrl(sampleReporterSlug, sampleVolumeFolder, "zip");
  const samplePdfUrl = buildCapVolumeAssetUrl(sampleReporterSlug, sampleVolumeFolder, "pdf");
  const sampleCaseJsonUrl = buildCapCaseJsonUrl(sampleReporterSlug, sampleVolumeFolder, sampleCaseFile);
  const sampleCaseHtmlUrl = buildCapCaseHtmlUrl(sampleReporterSlug, sampleVolumeFolder, sampleCaseFile);
  const sampleCourtListenerUrl =
    buildCourtListenerUrl(`/${sampleReporterSlug}/${sampleVolumeFolder}/${sampleCaseFile}`) ?? "https://www.courtlistener.com/";
  const helperCode = `import {
  buildCapCaseHtmlUrl,
  buildCapCaseJsonUrl,
  buildCapVolumeAssetUrl,
  buildCourtListenerUrl,
} from "@/lib/caselaw/cap";

const reporter = "${sampleReporterSlug}";
const volume = "${sampleVolumeFolder}";
const caseFile = "${sampleCaseFile}";

const zipUrl = buildCapVolumeAssetUrl(reporter, volume, "zip"); // ${sampleZipUrl}
const pdfUrl = buildCapVolumeAssetUrl(reporter, volume, "pdf"); // ${samplePdfUrl}
const caseJsonUrl = buildCapCaseJsonUrl(reporter, volume, caseFile); // ${sampleCaseJsonUrl}
const caseHtmlUrl = buildCapCaseHtmlUrl(reporter, volume, caseFile); // ${sampleCaseHtmlUrl}
const courtListenerUrl = buildCourtListenerUrl(\`/\${reporter}/\${volume}/\${caseFile}\`); // ${sampleCourtListenerUrl}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Harvard Law School • Caselaw Access Project
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Caselaw Access Project (CAP) Library Hub</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          Harvard Law School Library released more than six million state and federal opinions through the Caselaw Access
          Project (CAP). Life-AI connects to that open corpus via CourtListener and the CAP bulk downloads to keep our
          knowledge and training data grounded in primary authority.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total cases indexed" value={formatNumber(totalCaseCount)} />
          <StatCard label="Jurisdictions represented" value={formatNumber(jurisdictions.length)} />
          <StatCard label="Volumes available" value={formatNumber(totalVolumeCount)} />
          <StatCard label="Reporters in scope" value={formatNumber(totalReporterCount)} />
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6">
        <h2 className="text-xl font-semibold text-indigo-900">How Life-AI uses CAP</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <UsageCard
            title="CourtListener live search"
            body={
              <>
                Life-AI&apos;s legal search already calls the{" "}
                <ExternalLink href="https://www.courtlistener.com/help/api/">
                  CourtListener REST API
                </ExternalLink>{" "}
                which mirrors CAP. Set <code className="rounded bg-slate-900/90 px-1 py-0.5 text-xs text-white">COURT_LISTENER_API_KEY</code> (or username/password) in the
                environment to unlock authenticated requests, bulk downloads, and filters by jurisdiction or precedential
                status.
              </>
            }
            footer={
              <Link
                href="/(workspace)/search"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-900 hover:underline"
              >
                Open Legal Search →
              </Link>
            }
          />
          <UsageCard
            title="Bulk download ingest"
            body={
              <>
                CAP&apos;s static bucket gives us consistent JSON and HTML per volume. Use the helper utilities in{" "}
                <code className="rounded bg-slate-900/90 px-1 py-0.5 text-xs text-white">lib/caselaw/cap.ts</code> to fetch reporters, volumes, and case files for offline training
                jobs. Each volume exposes metadata alongside downloadable ZIP/PDF/TAR bundles.
              </>
            }
            footer={
              <ExternalLink href="https://static.case.law/">Browse static.case.law →</ExternalLink>
            }
          />
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-white/80 p-4 text-xs leading-relaxed text-indigo-900">
          <p>
            CAP is released under a <strong>Creative Commons Attribution 4.0</strong> license. Cite Harvard Law Library
            Innovations Lab and CourtListener when incorporating the data into Life-AI outputs or downstream datasets. Be
            mindful that some volumes are redacted; the metadata flags those instances.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Top jurisdictions by case volume</h2>
          <p className="mt-2 text-sm text-slate-600">
            Quick look at the jurisdictions with the largest number of CAP cases. Use these to seed jurisdiction-specific
            fine-tuning corpora or research collections.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Jurisdiction</th>
                <th className="px-4 py-3 text-right">Cases</th>
                <th className="px-4 py-3 text-right">Volumes</th>
                <th className="px-4 py-3 text-right">Reporters</th>
              </tr>
            </thead>
            <tbody>
              {topJurisdictions.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-100 bg-white">
                  <td className="px-4 py-3 font-medium text-slate-800">{entry.nameLong}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatNumber(entry.caseCount)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatNumber(entry.volumeCount)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatNumber(entry.reporterCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Regional reporter coverage</h2>
        <p className="text-sm text-slate-600">
          Regional reporters aggregate decisions across multiple states. They&apos;re especially useful when assembling
          training corpora focused on topic areas instead of a single jurisdiction.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {regionalCoverage.map((reporter) => (
            <div key={reporter.id} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">{reporter.fullName}</div>
              <div className="mt-2 text-xs text-slate-600">
                Covered jurisdictions:{" "}
                {reporter.jurisdictions.map((jurisdiction) => jurisdiction.nameLong).join(", ")}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Slug: <code className="rounded bg-slate-900/90 px-1 py-0.5 text-[0.7rem] text-white">{reporter.slug}</code>
              </div>
            </div>
          ))}
          {regionalCoverage.length === 0 && (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
              No regional reporters detected in the latest metadata pull.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">
        <h2 className="text-xl font-semibold text-emerald-900">Download helpers</h2>
        <p className="text-sm text-emerald-900/80">
          The helpers below illustrate how to assemble stable URLs for volume bundles and case files. Use them inside
          data pipelines or RAG indexing jobs.
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-emerald-200 bg-white/90 p-4 text-xs text-emerald-900">
{helperCode}
        </pre>
        <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4 text-xs leading-relaxed text-emerald-900">
          <p>
            For case-level citation enrichment, combine the helper output with <code>buildCourtListenerUrl</code> to link
            directly into CourtListener&apos;s enriched opinions interface.
          </p>
        </div>
      </section>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

type UsageCardProps = {
  title: string;
  body: ReactNode;
  footer: ReactNode;
};

function UsageCard({ title, body, footer }: UsageCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-indigo-200 bg-white/80 p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-indigo-950">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-indigo-900/80">{body}</p>
      </div>
      <div className="mt-5">{footer}</div>
    </div>
  );
}

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-indigo-900 hover:underline">
      {children} →
    </a>
  );
}
