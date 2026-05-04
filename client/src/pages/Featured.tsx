import { useState } from "react";
import { ArrowLeft, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiThreads } from "react-icons/si";
import { toast } from "sonner";

export default function Featured() {
  const [fileName, setFileName] = useState("No file selected yet");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformHandles, setPlatformHandles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isUploadPickerOpen, setIsUploadPickerOpen] = useState(false);

  const socialApps = [
    { label: "Instagram", key: "instagram", Icon: FaInstagram },
    { label: "TikTok", key: "tiktok", Icon: FaTiktok },
    { label: "Facebook", key: "facebook", Icon: FaFacebookF },
    { label: "YouTube", key: "youtube", Icon: FaYoutube },
    { label: "X", key: "x", Icon: FaXTwitter },
    { label: "Threads", key: "threads", Icon: SiThreads },
  ];

  const handleFilePicked = (event: React.ChangeEvent<HTMLInputElement>, source: "camera" | "library" | "files") => {
    const nextName = event.target.files?.[0]?.name ?? "No file selected yet";
    setFileName(nextName);
    setIsUploadPickerOpen(false);

    if (nextName !== "No file selected yet") {
      const sourceLabel = source === "camera" ? "Camera" : source === "library" ? "Photo library" : "Files";
      toast.success(`${sourceLabel} selected`, {
        description: `Attached: ${nextName}`,
      });
    }
  };

  const togglePlatform = (platformKey: string) => {
    setSelectedPlatforms((current) =>
      current.includes(platformKey) ? current.filter((key) => key !== platformKey) : [...current, platformKey],
    );
  };

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#102a43] selection:bg-[#0b6fa4] selection:text-white sm:px-6 sm:py-10 lg:px-8 dark:bg-[#0f172a] dark:text-white">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between sm:mb-6">
        <a href="/" className="inline-flex min-h-11 items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to The Flush Report
        </a>
      </div>

      <section className="mx-auto max-w-3xl">
        <div className="news-card p-5 sm:p-6">
          <h1 className="font-display text-[2.1rem] font-black uppercase leading-none tracking-[-0.03em] text-[#102a43] sm:text-5xl">Be Featured.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#526d82] sm:text-base">
            Real workers, real situations. Share a quick upload to help educate the public on the impacts of flushing wipes.
          </p>
          <p className="mt-2 text-xs text-[#64748b]">3 quick steps: add details, choose file, tap upload.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Location
              <input className="field-input" placeholder="City, state, or facility" required />
            </label>
            <label className="field-label sm:col-span-2">
              TAG ME!
              <div className="mt-2 flex flex-wrap gap-2">
                {socialApps.map((app) => {
                  const selected = selectedPlatforms.includes(app.key);
                  return (
                    <button
                      key={app.key}
                      type="button"
                      onClick={() => togglePlatform(app.key)}
                      className={`inline-flex min-h-11 items-center gap-2 border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                        selected ? "border-[#0b6fa4] bg-[#e7f6fc] text-[#0b6fa4]" : "border-[#cdeaf5] bg-white text-[#526d82] hover:border-[#0b6fa4]"
                      }`}
                    >
                      <app.Icon className="h-4 w-4" /> {app.label}
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selectedPlatforms.map((platformKey) => {
                    const selectedApp = socialApps.find((app) => app.key === platformKey);
                    if (!selectedApp) return null;

                    return (
                      <label key={`${platformKey}-handle`} className="field-label normal-case tracking-normal">
                        {selectedApp.label} handle
                        <input
                          className="field-input"
                          placeholder={`Enter your ${selectedApp.label} handle`}
                          value={platformHandles[platformKey] ?? ""}
                          onChange={(event) =>
                            setPlatformHandles((current) => ({
                              ...current,
                              [platformKey]: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-xs normal-case tracking-normal text-[#64748b]">Select one or more platforms if you want to be tagged.</p>
              )}
            </label>
            <label className="field-label sm:col-span-2">
              Short message
              <textarea
                className="field-input min-h-24 resize-none"
                placeholder="Tell us what happened and what people should know."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={240}
                required
              />
              <span className="mt-2 block text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748b]">{message.length}/240</span>
            </label>
          </div>

          <Button
            type="button"
            onClick={() => setIsUploadPickerOpen(true)}
            className="mt-6 h-14 w-full bg-[#0b6fa4] px-4 text-center font-mono text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_30px_rgba(11,111,164,0.2)] hover:bg-[#095c87] sm:text-xs sm:tracking-[0.16em]"
          >
            <Send className="mr-2 h-4 w-4 shrink-0" /> Upload now
          </Button>
          <p className="mt-3 text-center text-xs text-[#64748b]">Selected file: {fileName}</p>
          <p className="mt-3 text-center text-xs leading-6 text-[#64748b]">
            By uploading, you confirm you have rights to this content and consent to The Flush Report using it for education and awareness across website and social platforms. Official contact details for consent and removal requests are being finalized and will be posted here.
            {" "}
            <a href="/privacy" className="underline decoration-[#0b6fa4] underline-offset-4 hover:text-[#0b6fa4]">Privacy Policy</a>
            {" · "}
            <a href="/terms" className="underline decoration-[#0b6fa4] underline-offset-4 hover:text-[#0b6fa4]">Terms &amp; Conditions</a>
          </p>
          <div className="social-broadcast-strip mt-6" aria-label="FRTV social channel emblems">
            <div>
              <p className="font-mono text-sm font-black uppercase tracking-[0.16em] text-[#0b6fa4] sm:text-base">Follow and tag The Flush Report</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {socialApps.map((app) => (
                <span key={app.label} className={`social-icon social-icon-${app.key}`} title={app.label} aria-label={app.label}>
                  <app.Icon />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <input type="file" accept="image/*,video/*" capture="environment" className="sr-only" id="upload-camera" onChange={(event) => handleFilePicked(event, "camera")} />
      <input type="file" accept="image/*,video/*" className="sr-only" id="upload-library" onChange={(event) => handleFilePicked(event, "library")} />
      <input type="file" accept=".pdf,.doc,.docx,.txt,.zip,image/*,video/*" className="sr-only" id="upload-files" onChange={(event) => handleFilePicked(event, "files")} />

      {isUploadPickerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={() => setIsUploadPickerOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl border border-[#cdeaf5] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_24px_60px_rgba(11,111,164,0.2)] sm:rounded-xl sm:pb-4" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl font-black uppercase text-[#102a43]">Choose upload source</h2>
              <button type="button" onClick={() => setIsUploadPickerOpen(false)} className="inline-flex h-10 w-10 items-center justify-center border border-[#cdeaf5] text-[#526d82] hover:text-[#102a43]" aria-label="Close upload source picker">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2.5">
              <button type="button" onClick={() => document.getElementById("upload-camera")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                Camera
              </button>
              <button type="button" onClick={() => document.getElementById("upload-library")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                Photo library
              </button>
              <button type="button" onClick={() => document.getElementById("upload-files")?.click()} className="h-12 border border-[#b8cce4] bg-[#f4fbff] px-4 text-left font-mono text-xs font-black uppercase tracking-[0.14em] text-[#0b6fa4] hover:border-[#0b6fa4]">
                Files
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
