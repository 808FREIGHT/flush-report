import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#102a43] sm:px-6 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to The Flush Report
        </a>

        <section className="news-card mt-6 p-6 sm:p-8">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none text-[#102a43]">Privacy Policy</h1>
          <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#64748b]">
            Last updated: May 03, 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-[#334e68]">
            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">What we collect</h2>
              <p className="mt-2">
                We may collect the information you submit in forms, including article URLs, story notes, upload metadata,
                selected social handles, and uploaded files. We also collect basic technical usage data needed to operate and
                secure the website.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Legal bases and compliance</h2>
              <p className="mt-2">
                Data is processed for legitimate interests in journalism, public-awareness publishing, operational security, and
                legal compliance. Where required by applicable law, we process data based on consent or contractual necessity.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">How we use your information</h2>
              <p className="mt-2">
                Information is used to review submissions, produce public-awareness reporting, publish selected content,
                improve site quality, and prevent misuse. We may use submitted information for editorial, legal, and safety
                review.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Uploads and media</h2>
              <p className="mt-2">
                Uploaded files may be reviewed, stored, and used in accordance with your submission consent. Do not upload
                private, confidential, or restricted information unless you have legal authorization to share it.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Sharing and disclosure</h2>
              <p className="mt-2">
                We do not sell personal data. We may disclose information when required by law, to protect rights and safety,
                or to investigate abuse of the platform.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Children and sensitive data</h2>
              <p className="mt-2">
                Do not submit personal data of children without required legal permissions. Do not submit medical, financial,
                or other sensitive data unless clearly necessary and lawfully authorized.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Retention</h2>
              <p className="mt-2">
                We retain data for as long as needed for editorial workflow, legal compliance, dispute resolution, and
                operational integrity.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Your choices</h2>
              <p className="mt-2">
                You may request updates or removal review for submitted content. Official contact instructions are provided on
                the site contact page and may be updated over time.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">International access</h2>
              <p className="mt-2">
                If you access the site from outside the primary operating region, you acknowledge your data may be processed in
                jurisdictions with different privacy laws.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
