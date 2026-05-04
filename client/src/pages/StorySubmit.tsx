import { useState } from "react";
import { ArrowLeft, Link2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StorySubmit() {
  const [articleUrl, setArticleUrl] = useState("");
  const [fileName, setFileName] = useState("No file selected yet");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleSendTip = () => {
    const hasUrl = articleUrl.trim().length > 0;
    const hasFile = fileName !== "No file selected yet";

    if (!hasUrl && !hasFile) {
      toast.error("Add a URL or upload a file first.");
      return;
    }

    toast.success("Story tip captured for review", {
      description: hasUrl && hasFile ? "URL and upload received." : hasUrl ? "URL received." : "Upload received.",
    });
  };

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>, source: "record" | "pdf" | "files") => {
    const picked = event.target.files?.[0]?.name ?? "No file selected yet";
    setFileName(picked);
    setIsPickerOpen(false);

    if (picked !== "No file selected yet") {
      const sourceLabel = source === "record" ? "Record" : source === "pdf" ? "PDF" : "Files";
      toast.success(`${sourceLabel} selected`, { description: `Attached: ${picked}` });
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#102a43] selection:bg-[#0b6fa4] selection:text-white sm:px-6 sm:py-10 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between sm:mb-6">
        <a href="/news" className="inline-flex min-h-11 items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to News
        </a>
      </div>

      <section className="mx-auto max-w-3xl">
        <div className="news-card p-5 sm:p-6">
          <h1 className="font-display text-[2.1rem] font-black uppercase leading-none tracking-[-0.03em] text-[#102a43] sm:text-5xl">Send a Story.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#526d82] sm:text-base">
            Keep it simple: paste an article URL, upload a PDF, or send a recording.
          </p>
          <p className="mt-2 text-xs text-[#64748b]">Fast tip flow: add source, choose upload option, send.</p>

          <label className="field-label mt-5 block">
            Article URL
            <div className="mt-2 flex items-center gap-2">
              <Link2 className="h-4 w-4 shrink-0 text-[#64748b]" />
              <input
                className="field-input mt-0"
                placeholder="https://..."
                value={articleUrl}
                onChange={(event) => setArticleUrl(event.target.value)}
                inputMode="url"
              />
            </div>
          </label>

          <Button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="mt-6 h-14 w-full bg-[#0b6fa4] px-4 text-center font-mono text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_30px_rgba(11,111,164,0.2)] hover:bg-[#095c87]"
          >
            <Send className="mr-2 h-4 w-4 shrink-0" /> Upload PDF / Record / Files
          </Button>

          <Button
            type="button"
            onClick={handleSendTip}
            className="mt-3 h-12 w-full border border-[#89c2d9] bg-[#f4fbff] px-4 text-center font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] shadow-none hover:bg-[#e7f6fc]"
          >
            Send tip
          </Button>

          <p className="mt-3 text-center text-xs text-[#64748b]">Selected file: {fileName}</p>
          <p className="mt-3 text-center text-xs leading-6 text-[#64748b]">
            By sending, you confirm you have rights to share this content for review and public-awareness reporting.
            {" "}
            <a href="/privacy" className="underline decoration-[#0b6fa4] underline-offset-4 hover:text-[#0b6fa4]">Privacy Policy</a>
            {" · "}
            <a href="/terms" className="underline decoration-[#0b6fa4] underline-offset-4 hover:text-[#0b6fa4]">Terms &amp; Conditions</a>
          </p>
        </div>
      </section>

      <input type="file" accept="video/*,audio/*" capture="user" className="sr-only" id="story-record" onChange={(event) => handleFilePicked(event, "record")} />
      <input type="file" accept=".pdf,application/pdf" className="sr-only" id="story-pdf" onChange={(event) => handleFilePicked(event, "pdf")} />
      <input type="file" accept=".pdf,.doc,.docx,.txt,.zip,image/*,video/*,audio/*" className="sr-only" id="story-files" onChange={(event) => handleFilePicked(event, "files")} />

      {isPickerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setIsPickerOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl border border-[#cdeaf5] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_24px_60px_rgba(11,111,164,0.2)] sm:rounded-xl sm:pb-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Choose upload type</h2>
              <button type="button" onClick={() => setIsPickerOpen(false)} className="inline-flex h-10 w-10 items-center justify-center border border-[#cdeaf5] text-[#526d82] hover:text-[#102a43]" aria-label="Close upload type picker">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2.5">
              <button type="button" onClick={() => document.getElementById("story-record")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                Record
              </button>
              <button type="button" onClick={() => document.getElementById("story-pdf")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                PDF
              </button>
              <button type="button" onClick={() => document.getElementById("story-files")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                Files
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
