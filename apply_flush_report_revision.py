from pathlib import Path

path = Path('/home/ubuntu/flush-report/client/src/pages/Home.tsx')
text = path.read_text()

replacements = []

replacements.append((
    'const navItems = ["Mission", "Cost", "FRTV", "File Report", "Sponsor"];',
    'const navItems = ["Mission", "Cost", "FRTV", "Upload Proof", "Sponsor"];'
))

replacements.append((
'''const featurePills = [
  {
    title: "Upload your videos",
    eyebrow: "Field proof",
    copy: "Send clips and photos from clogs, rag pulls, grease blockages, and plant debris so the public can see what bad flushing creates.",
    href: "#file-report",
    icon: UploadCloud,
  },
  {
    title: "Follow the socials",
    eyebrow: "FRTV feed",
    copy: "Short clips, operator notes, prevention reminders, and shareable stories built for public works awareness.",
    href: "#frtv",
    icon: Share2,
  },
  {
    title: "Merch coming soon",
    eyebrow: "Fund the mission",
    copy: "Sponsor-safe shirts, stickers, and worksite-friendly gear that carry the message beyond the website.",
    href: null,
    icon: ShoppingBag,
  },
];''',
'''const featurePills = [
  {
    title: "Upload videos",
    eyebrow: "Field proof",
    copy: "Send respectful clips and photos from clogs, rag pulls, grease blockages, and plant debris so the public can see what bad flushing creates.",
    href: "#upload-proof",
    action: "Start an upload",
    icon: UploadCloud,
  },
  {
    title: "Follow socials",
    eyebrow: "FRTV feed",
    copy: "Short clips, operator notes, prevention reminders, and shareable stories built for public works awareness across FRTV channels.",
    href: "#frtv",
    action: "See programming",
    icon: Share2,
  },
  {
    title: "Win merch",
    eyebrow: "Community reward",
    copy: "Selected educational submissions can be considered for FRTV shirts, hats, stickers, or worksite-friendly gear as the merch program launches.",
    href: null,
    action: "Giveaway details",
    icon: ShoppingBag,
  },
];'''
))

replacements.append((
'''const sponsorRailItems = ["Sponsor slot available", "Public education partners", "Wastewater vendors", "Clean-water campaigns", "Merch collabs"];''',
'''const sponsorRailItems = ["Sponsor slot available", "Public education partners", "Wastewater vendors", "Clean-water campaigns", "Merch collabs"];

const adPlacements = {
  awareness: {
    label: "Ad break 01",
    title: "Sponsor the weekly prevention bulletin",
    copy: "A clean rectangular placement for utilities, safety vendors, environmental campaigns, and local businesses that want their name beside practical public education.",
    slot: "Top awareness sponsor",
  },
  field: {
    label: "Ad break 02",
    title: "Field gear and wastewater vendor placement",
    copy: "A mid-story unit positioned beside the cost-of-clog narrative, built for equipment, PPE, hauling, inspection, and infrastructure partners.",
    slot: "Field education sponsor",
  },
  community: {
    label: "Ad break 03",
    title: "Community merch and giveaway partner",
    copy: "A sponsor-safe lower-page unit for shirts, hats, cleanup campaigns, local partners, and giveaway support tied to selected educational submissions.",
    slot: "Giveaway sponsor",
  },
};'''
))

replacements.append((
'''  const scrollToReport = () => {
    document.getElementById("file-report")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };''',
'''  const scrollToReport = () => {
    document.getElementById("upload-proof")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };'''
))

replacements.append((
'''    toast.success("Report draft captured for the MVP demo", {
      description:
        "The front-end flow is ready. The next build step is secure upload storage and review notifications.",
    });''',
'''    toast.success("Field proof draft captured for the MVP demo", {
      description:
        "The front-end flow now frames uploads for education, consent review, FRTV social use, and future merch giveaway workflows.",
    });'''
))

replacements.append((
'''                File Your Report <ArrowRight className="ml-3 h-4 w-4 transition group-hover:translate-x-1" />''',
'''                Upload Field Proof <ArrowRight className="ml-3 h-4 w-4 transition group-hover:translate-x-1" />'''
))

replacements.append((
'''      </header>

      <section id="top" className="relative min-h-screen overflow-hidden bg-white pt-28">''',
'''      </header>

      <section aria-label="Quick access to Flush Report features" className="relative z-20 border-b border-[#cdeaf5] bg-white px-4 pb-8 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 border-b border-[#d6eaf2] pb-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Quick access</p>
              <h2 className="mt-2 font-display text-4xl font-black uppercase leading-none tracking-[-0.035em] text-[#102a43] sm:text-5xl">Upload. Watch. Wear the message.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#526d82]">
              The first actions sit directly under the live ticker so visitors can send field proof, follow the media feed, or join the merch-and-giveaway lane without hunting through the page.
            </p>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {featurePills.map((feature) => {
              const Icon = feature.icon;
              const content = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">{feature.eyebrow}</span>
                    <Icon className="h-7 w-7 text-[#0b6fa4]" />
                  </div>
                  <h3 className="mt-5 font-display text-3xl font-black uppercase leading-none tracking-[-0.02em] text-[#102a43]">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#526d82]">{feature.copy}</p>
                  <span className="feature-cta-action mt-6">
                    {feature.action} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </>
              );

              return feature.href ? (
                <a key={feature.title} href={feature.href} className="feature-pill group" aria-label={`${feature.title}: ${feature.copy}`}>
                  {content}
                </a>
              ) : (
                <button
                  key={feature.title}
                  type="button"
                  className="feature-pill group text-left"
                  onClick={() => toast.info("Merch and giveaway details are queued for the next build", { description: "Selected educational submissions can be tied to FRTV shirts, hats, stickers, and sponsor-supported rewards." })}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="top" className="relative min-h-screen overflow-hidden bg-white">'''
))

replacements.append((
'''          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featurePills.map((feature) => {
              const Icon = feature.icon;
              const content = (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">{feature.eyebrow}</span>
                    <Icon className="h-7 w-7 text-[#0b6fa4]" />
                  </div>
                  <h3 className="mt-5 font-display text-3xl font-black uppercase leading-none tracking-[-0.02em] text-[#102a43]">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#526d82]">{feature.copy}</p>
                </>
              );

              return feature.href ? (
                <a key={feature.title} href={feature.href} className="feature-pill group" aria-label={`${feature.title}: ${feature.copy}`}>
                  {content}
                </a>
              ) : (
                <button
                  key={feature.title}
                  type="button"
                  className="feature-pill group text-left"
                  onClick={() => toast.info("Merch is queued for the next build", { description: "The current MVP keeps this as a lightweight coming-soon path." })}
                >
                  {content}
                </button>
              );
            })}
          </div>
''',
''''''
))

hero_ad = '''\n      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Strategic sponsor placement after hero">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.awareness.label}</p>
            <h2>{adPlacements.awareness.title}</h2>
            <p>{adPlacements.awareness.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.awareness.slot}</span>
            <a href="mailto:sponsor@flushreport.live">Reserve placement</a>
          </div>
        </div>
      </section>\n'''
replacements.append((
'''      </section>

      <section id="mission" className="relative border-y border-[#cdeaf5] bg-white px-4 py-20 sm:px-6 lg:px-8">''',
'''      </section>
''' + hero_ad + '''
      <section id="mission" className="relative border-y border-[#cdeaf5] bg-white px-4 py-20 sm:px-6 lg:px-8">'''
))

field_ad = '''\n      <section className="bg-white px-4 pb-8 sm:px-6 lg:px-8" aria-label="Strategic sponsor placement before FRTV programming">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.field.label}</p>
            <h2>{adPlacements.field.title}</h2>
            <p>{adPlacements.field.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.field.slot}</span>
            <a href="mailto:sponsor@flushreport.live">Request media kit</a>
          </div>
        </div>
      </section>\n'''
replacements.append((
'''      </section>

      <section id="frtv" className="bg-white px-4 py-24 sm:px-6 lg:px-8">''',
'''      </section>
''' + field_ad + '''
      <section id="frtv" className="bg-white px-4 py-24 sm:px-6 lg:px-8">'''
))

community_ad = '''\n      <section className="bg-white px-4 py-8 sm:px-6 lg:px-8" aria-label="Strategic sponsor placement after upload section">
        <div className="ad-placement mx-auto max-w-7xl">
          <div>
            <p className="ad-placement-label">{adPlacements.community.label}</p>
            <h2>{adPlacements.community.title}</h2>
            <p>{adPlacements.community.copy}</p>
          </div>
          <div className="ad-placement-slot">
            <span>{adPlacements.community.slot}</span>
            <a href="mailto:sponsor@flushreport.live">Sponsor rewards</a>
          </div>
        </div>
      </section>\n'''
replacements.append((
'''      </section>

      <section id="sponsor" className="bg-white px-4 py-24 sm:px-6 lg:px-8">''',
'''      </section>
''' + community_ad + '''
      <section id="sponsor" className="bg-white px-4 py-24 sm:px-6 lg:px-8">'''
))

old_upload = '''      <section id="file-report" className="relative overflow-hidden border-y border-[#cdeaf5] bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#dff5fb]/70 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">File your report</p>
            <h2 className="headline-section mt-3">Turn field footage into public awareness.</h2>
            <p className="mt-6 text-lg leading-8 text-[#334e68]">
              Operators are the correspondents. The MVP intake flow is designed for fast mobile use: what happened, where it happened, what it cost, and what the public should learn from it.
            </p>
            <div className="mt-8 overflow-hidden border border-[#cdeaf5] bg-[#f8fdff] p-3 shadow-[0_24px_60px_rgba(11,111,164,0.12)]">
              <img src={ASSETS.report} alt="Operator filing a field report from a wastewater facility" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>

          <form onSubmit={handlePrototypeSubmit} className="news-card p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-[#d6eaf2] pb-5">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">Field Report Intake</p>
                <h3 className="mt-2 font-display text-4xl font-black uppercase leading-none text-[#102a43]">FR-001</h3>
              </div>
              <ClipboardList className="h-9 w-9 text-[#0b6fa4]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label sm:col-span-2">
                Report title
                <input className="field-input" placeholder="Example: 200 lb rag pull at lift station" required />
              </label>
              <label className="field-label">
                Report type
                <select className="field-input" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  {reportTypes.map((type) => (
                    <option key={type} value={type} className="bg-white text-[#102a43]">
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Location
                <input className="field-input" placeholder="City, state, or facility nickname" required />
              </label>
              <label className="field-label sm:col-span-2">
                What should the public understand?
                <textarea className="field-input min-h-28 resize-none" placeholder="Keep it short, clear, and operator-real." required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label mb-2 block">Upload clip or photo</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "No file selected yet")}
                  id="field-file"
                />
                <span className="flex min-h-24 cursor-pointer items-center justify-center border border-dashed border-[#89c2d9] bg-[#f4fbff] p-5 text-center font-mono text-xs uppercase tracking-[0.12em] text-[#526d82] transition hover:border-[#0b6fa4] hover:bg-[#e7f6fc]" onClick={() => document.getElementById("field-file")?.click()}>
                  <FileVideo className="mr-3 h-5 w-5 text-[#0b6fa4]" /> {fileName}
                </span>
              </label>
            </div>

            <Button type="submit" className="mt-6 h-14 w-full bg-[#0b6fa4] font-mono text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(11,111,164,0.2)] hover:bg-[#095c87]">
              <Send className="mr-2 h-4 w-4" /> Submit MVP Report Draft
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-[#64748b]">
              MVP note: this demo captures the front-end flow. Secure cloud uploads and review emails can be connected in the next build step.
            </p>
          </form>
        </div>
      </section>'''

new_upload = '''      <section id="upload-proof" className="relative overflow-hidden border-y border-[#cdeaf5] bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#dff5fb]/70 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="eyebrow">Upload field proof</p>
            <h2 className="headline-section mt-3">Turn clogs, pulls, and gross proof into public education.</h2>
            <p className="mt-6 text-lg leading-8 text-[#334e68]">
              The Flush Report is not asking for shock value alone. It is collecting respectful, worksite-aware photos and videos that help the public understand why wipes, grease, rags, plastics, and random trash do not belong in wastewater systems.
            </p>
            <div className="mt-7 grid gap-3">
              <div className="border border-[#cdeaf5] bg-white p-4 shadow-[0_12px_30px_rgba(11,111,164,0.07)]">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">What to submit</p>
                <p className="mt-2 text-sm leading-6 text-[#526d82]">Clog photos, rag pulls, grease issues, pump debris, plant screenings, before-and-after cleanup visuals, or short operator explanations that can teach without exposing private information.</p>
              </div>
              <div className="border border-[#cdeaf5] bg-white p-4 shadow-[0_12px_30px_rgba(11,111,164,0.07)]">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">Why it matters</p>
                <p className="mt-2 text-sm leading-6 text-[#526d82]">Selected submissions can become FRTV educational clips, prevention reminders, sponsor-safe explainers, and public works awareness posts that connect bad flushing habits to real crews and real costs.</p>
              </div>
              <div className="border border-[#cdeaf5] bg-white p-4 shadow-[0_12px_30px_rgba(11,111,164,0.07)]">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">Giveaway lane</p>
                <p className="mt-2 text-sm leading-6 text-[#526d82]">As the merch program opens, selected educational uploads may be considered for FRTV shirts, hats, stickers, or sponsor-supported rewards.</p>
              </div>
            </div>
            <div className="mt-8 overflow-hidden border border-[#cdeaf5] bg-[#f8fdff] p-3 shadow-[0_24px_60px_rgba(11,111,164,0.12)]">
              <img src={ASSETS.report} alt="Operator preparing a field proof submission from a wastewater facility" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>

          <form onSubmit={handlePrototypeSubmit} className="news-card p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-[#d6eaf2] pb-5">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#0b6fa4]">Educational Upload Intake</p>
                <h3 className="mt-2 font-display text-4xl font-black uppercase leading-none text-[#102a43]">FRTV-001</h3>
              </div>
              <ClipboardList className="h-9 w-9 text-[#0b6fa4]" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label sm:col-span-2">
                Submission title
                <input className="field-input" placeholder="Example: 200 lb rag pull at lift station" required />
              </label>
              <label className="field-label">
                Submission type
                <select className="field-input" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  {reportTypes.map((type) => (
                    <option key={type} value={type} className="bg-white text-[#102a43]">
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Location context
                <input className="field-input" placeholder="City, state, or facility nickname" required />
              </label>
              <label className="field-label sm:col-span-2">
                What should the public understand?
                <textarea className="field-input min-h-28 resize-none" placeholder="Explain the lesson: what caused it, what crews had to do, and what people should stop flushing." required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label mb-2 block">Upload clip or photo</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "No file selected yet")}
                  id="field-file"
                />
                <span className="flex min-h-24 cursor-pointer items-center justify-center border border-dashed border-[#89c2d9] bg-[#f4fbff] p-5 text-center font-mono text-xs uppercase tracking-[0.12em] text-[#526d82] transition hover:border-[#0b6fa4] hover:bg-[#e7f6fc]" onClick={() => document.getElementById("field-file")?.click()}>
                  <FileVideo className="mr-3 h-5 w-5 text-[#0b6fa4]" /> {fileName}
                </span>
              </label>
              <label className="sm:col-span-2 flex gap-3 border border-[#cdeaf5] bg-[#f8fdff] p-4 text-sm leading-6 text-[#526d82]">
                <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#0b6fa4]" />
                <span>
                  I confirm I have permission to share this material, have avoided private or confidential information, and consent to The Flush Report reviewing, editing, and using selected content for FRTV social posts, website education, sponsor-safe explainers, and related public-awareness materials. I understand selected educational submissions may be considered for FRTV shirts, hats, stickers, or other merch giveaways.
                </span>
              </label>
            </div>

            <Button type="submit" className="mt-6 h-14 w-full bg-[#0b6fa4] font-mono text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(11,111,164,0.2)] hover:bg-[#095c87]">
              <Send className="mr-2 h-4 w-4" /> Submit Field Proof Draft
            </Button>
            <p className="mt-4 text-center text-xs leading-5 text-[#64748b]">
              MVP note: this demo captures the front-end flow. Secure cloud uploads, content releases, review emails, and merch-giveaway eligibility can be connected in the next build step.
            </p>
          </form>
        </div>
      </section>'''
replacements.append((old_upload, new_upload))

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Missing expected block:\n{old[:300]}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Home.tsx revision applied successfully.')
