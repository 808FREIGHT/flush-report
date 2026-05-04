import { ArrowLeft } from "lucide-react";

export default function TermsConditions() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#102a43] sm:px-6 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to The Flush Report
        </a>

        <section className="news-card mt-6 p-6 sm:p-8">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none text-[#102a43]">Terms &amp; Conditions</h1>
          <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#64748b]">
            Last updated: May 03, 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-[#334e68]">
            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Use of the website</h2>
              <p className="mt-2">
                By using The Flush Report, you agree to use the site lawfully and in good faith. You may not submit harmful,
                deceptive, infringing, or illegal material.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Submission rights</h2>
              <p className="mt-2">
                You represent that you own submitted content or have permission to share it. You grant The Flush Report a
                non-exclusive, worldwide, royalty-free license to review, edit, publish, and distribute accepted submissions
                for education and public-awareness purposes.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Prohibited submissions</h2>
              <p className="mt-2">
                You may not submit unlawful, defamatory, infringing, deceptive, or confidential material without authorization.
                You may not submit content that violates privacy, safety, or intellectual-property rights.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Editorial discretion</h2>
              <p className="mt-2">
                We may accept, reject, edit, or remove content at our discretion. Submission does not guarantee publication.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Accuracy and external links</h2>
              <p className="mt-2">
                The site may reference third-party articles and sources. We do not control third-party websites and are not
                responsible for their content, availability, or policy changes.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">No warranty</h2>
              <p className="mt-2">
                The service is provided "as is" without warranties of uninterrupted availability, fitness for a specific
                purpose, or error-free operation.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Copyright and takedown requests</h2>
              <p className="mt-2">
                Rights holders may request review or removal of allegedly infringing material through the contact channel. We
                reserve the right to remove or restrict content during review.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Limitation of liability</h2>
              <p className="mt-2">
                To the maximum extent allowed by law, The Flush Report is not liable for indirect, incidental, or consequential
                damages arising from use of the site or submitted content workflows.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Changes to terms</h2>
              <p className="mt-2">
                We may update these terms periodically. Continued use after updates constitutes acceptance of the revised
                terms.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Jurisdiction and governing law</h2>
              <p className="mt-2">
                These terms are interpreted under applicable law in the primary operating jurisdiction, subject to mandatory
                consumer protections where required.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
