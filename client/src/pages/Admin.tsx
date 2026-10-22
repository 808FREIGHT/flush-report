import { useEffect, useState } from "react";

type OfficeFile = {
  storedName: string;
  originalName: string;
  mime: string;
  size: number;
  url: string;
  onTicker?: boolean;
};

type Submission = {
  id: string;
  createdAt: string;
  files: OfficeFile[];
};

export default function Admin() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadError, setLoadError] = useState("");

  const loadInbox = async () => {
    const response = await fetch("/api/admin/submissions", { credentials: "same-origin" });
    if (response.status === 401) {
      setAuthed(false);
      return;
    }
    const payload = (await response.json()) as { submissions?: Submission[]; error?: string };
    if (!response.ok) {
      setLoadError(payload.error || "The inbox did not load.");
      return;
    }
    setLoadError("");
    setSubmissions(payload.submissions ?? []);
    setAuthed(true);
  };

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/session", { credentials: "same-origin" });
      if (response.ok) await loadInbox();
      setReady(true);
    })();
  }, []);

  const onLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setLoginError(payload?.error || "That password does not match.");
      return;
    }
    setPassword("");
    await loadInbox();
  };

  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    setAuthed(false);
    setSubmissions([]);
  };

  const onDelete = async (id: string) => {
    const response = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE", credentials: "same-origin" });
    if (response.ok) await loadInbox();
  };

  const onTicker = async (id: string, file: OfficeFile) => {
    const response = await fetch("/api/admin/ticker", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, storedName: file.storedName, onTicker: !file.onTicker }),
    });
    if (response.ok) await loadInbox();
  };

  const canTicker = (file: OfficeFile) =>
    file.mime.startsWith("image/") && file.mime !== "image/heic" && file.mime !== "image/heif";

  return (
    <main className="min-h-screen bg-[#0f172a] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <a href="/" className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb]">
            Back to The Flush Report
          </a>
          {authed ? (
            <button type="button" onClick={() => void onLogout()} className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#87ceeb]">
              Log out
            </button>
          ) : null}
        </div>

        <h1 className="mt-6 font-display text-5xl font-black uppercase leading-none">Back office</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d6e2f0]">
          Rag pics people send from the homepage land here. Add a photo to the ticker and it shows up in the slideshow and the bottom rag strip.
        </p>

        {!ready ? null : !authed ? (
          <form onSubmit={onLogin} className="news-card mt-8 max-w-md p-6">
            <label className="field-label block">
              Password
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className="rag-pics-send mt-4">
              Log in
            </button>
            {loginError ? <p className="mt-3 text-sm text-[#ffb4b4]">{loginError}</p> : null}
          </form>
        ) : (
          <section className="mt-8 space-y-6">
            {loadError ? <p className="text-sm text-[#ffb4b4]">{loadError}</p> : null}
            {submissions.length === 0 ? (
              <p className="text-sm text-[#d6e2f0]">No rag pics yet.</p>
            ) : (
              submissions.map((submission) => (
                <article key={submission.id} className="news-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#87ceeb]">
                      {new Date(submission.createdAt).toLocaleString()}
                    </p>
                    <button type="button" onClick={() => void onDelete(submission.id)} className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ffb4b4]">
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {submission.files.map((file) => (
                      <figure key={file.storedName} className="overflow-hidden rounded-xl border border-white/20">
                        {file.mime.startsWith("image/") && file.mime !== "image/heic" && file.mime !== "image/heif" ? (
                          <img src={file.url} alt={file.originalName} className="h-64 w-full object-cover" />
                        ) : file.mime.startsWith("video/") ? (
                          <video src={file.url} controls className="h-64 w-full bg-black object-contain" />
                        ) : (
                          <a href={file.url} className="block p-4 text-sm text-[#87ceeb]">
                            {file.originalName}
                          </a>
                        )}
                        <figcaption className="flex items-center justify-between gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#d6e2f0]">
                          <span className="truncate">{file.originalName}</span>
                          {canTicker(file) ? (
                            <button type="button" onClick={() => void onTicker(submission.id, file)} className="shrink-0 text-[#39ff14]">
                              {file.onTicker ? "On the ticker" : "Add to ticker"}
                            </button>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
