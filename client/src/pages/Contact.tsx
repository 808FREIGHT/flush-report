import { ArrowLeft } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";

const contactPlatforms = [
  { label: "Instagram", href: "https://www.instagram.com", Icon: FaInstagram },
  { label: "TikTok", href: "https://www.tiktok.com", Icon: FaTiktok },
  { label: "Facebook", href: "https://www.facebook.com", Icon: FaFacebookF },
  { label: "YouTube", href: "https://www.youtube.com", Icon: FaYoutube },
  { label: "X", href: "https://x.com", Icon: FaXTwitter },
  { label: "Threads", href: "https://www.threads.net", Icon: SiThreads },
];

export default function Contact() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#102a43] sm:px-6 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to The Flush Report
        </a>

        <section className="news-card mt-6 p-6 sm:p-8">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none text-[#102a43]">Get in touch</h1>
          <p className="mt-5 text-sm leading-7 text-[#334e68]">
            For story tips, submission-rights requests, or legal notice follow-up, contact us through our official social
            channels below. Dedicated legal inbox details will be added here once finalized.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {contactPlatforms.map((platform) => (
              <a
                key={platform.label}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-[#cdeaf5] bg-[#f8fdff] px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#0b6fa4] hover:border-[#0b6fa4]"
              >
                <platform.Icon className="h-4 w-4" /> {platform.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
