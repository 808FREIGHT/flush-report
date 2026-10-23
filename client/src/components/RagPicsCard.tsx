import { useRef, useState } from "react";

const PHOTO_ACCEPT = "image/*,.heic,.heif";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mov,.mp4,.webm";
const MAX_VIDEO_SECONDS = 6;

function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    video.src = url;
  });
}

export default function RagPicsCard() {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [chooser, setChooser] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const addFiles = (next: File[]) => {
    if (next.length === 0) return;
    setFiles((current) => [...current, ...next]);
    setStatus("idle");
    setMessage("");
  };

  const onPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(next);
  };

  const onVideos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (next.length === 0) return;

    const kept: File[] = [];
    let rejected = false;
    for (const file of next) {
      try {
        const duration = await videoDuration(file);
        if (Number.isFinite(duration) && duration <= MAX_VIDEO_SECONDS + 0.05) kept.push(file);
        else rejected = true;
      } catch {
        rejected = true;
      }
    }

    if (kept.length > 0) addFiles(kept);
    if (rejected) {
      setStatus("error");
      setMessage("Videos have to be 6 seconds or under.");
    }
  };

  const choose = (kind: "photo" | "video") => {
    setChooser(false);
    if (kind === "photo") photoRef.current?.click();
    else videoRef.current?.click();
  };

  const onSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (files.length === 0) return;

    const body = new FormData();
    for (const file of files) body.append("files", file);
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/rag-pics", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error || "Those files did not go through. Try again.");
        return;
      }
      setFiles([]);
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
      setMessage("Those files did not go through. Try again.");
    }
  };

  const countLabel = files.length === 1 ? "1 file attached" : `${files.length} files attached`;
  const isOpen = chooser || files.length > 0 || status === "sending" || status === "sent" || status === "error";

  return (
    <div className={`feature-pill rag-pics-card${isOpen ? " rag-pics-card--open" : ""}`}>
      <h3 className="rag-pics-headline font-display text-[1.15rem] font-black uppercase leading-[0.9] tracking-[-0.04em]">
        <span className="rag-pics-title">Send us your rag pics!</span>
      </h3>
      <p className="rag-pics-line">We're ready for your worst! Clogged pumps. Bar screens. Rag hoppers. We want 'em all.</p>

      {!isOpen ? (
        <button
          type="button"
          className="rag-pics-compact-hit"
          aria-label="Send us your rag pics. Attach a photo or a 6 second video."
          onClick={() => setChooser(true)}
        />
      ) : null}

      <form className="rag-pics-actions" onSubmit={onSend}>
        {status === "sent" ? (
          <p className="rag-pics-thanks">Rags submitted!</p>
        ) : (
          <>
            {chooser ? (
              <div className="rag-pics-sheet" role="dialog" aria-label="Choose a photo or a 6 second video">
                <button type="button" onClick={() => choose("photo")}>
                  Photo
                </button>
                <button type="button" onClick={() => choose("video")}>
                  6-second video
                </button>
              </div>
            ) : null}
            {files.length > 0 ? <p className="rag-pics-count">{countLabel}</p> : null}
            <div className="rag-pics-actions-row">
              <button type="button" className="rag-pics-attach" onClick={() => setChooser((open) => !open)}>
                Attach
              </button>
              {files.length > 0 ? (
                <button type="submit" className="rag-pics-send" disabled={status === "sending"}>
                  {status === "sending" ? "Sending" : "Submit"}
                </button>
              ) : null}
            </div>
          </>
        )}
        <input ref={photoRef} className="sr-only" type="file" multiple accept={PHOTO_ACCEPT} onChange={onPhotos} />
        <input ref={videoRef} className="sr-only" type="file" multiple accept={VIDEO_ACCEPT} onChange={onVideos} />
        {status === "error" && message ? <p className="rag-pics-note rag-pics-note--error">{message}</p> : null}
      </form>
    </div>
  );
}
