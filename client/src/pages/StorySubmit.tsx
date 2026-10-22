import { ArrowLeft } from "lucide-react";

export default function StorySubmit() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#102a43] sm:px-6 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto max-w-3xl">
        <a href="/news" className="inline-flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to News
        </a>

        <section className="news-card mt-6 p-6 sm:p-8">
          <p className="eyebrow">Story tips</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none text-[#102a43]">Story tips open soon.</h1>
          <p className="mt-5 text-sm leading-7 text-[#334e68]">
            Article links and field files are not being collected yet. The newsroom is still worth reading while that opens.
          </p>
          <a href="/news" className="article-read-button mt-6 inline-flex">
            Read the news
          </a>
        </section>
      </div>
    </main>
  );
}
