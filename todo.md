# The Flush Report — Coastal News Revision Todo

- [x] Shift the global palette from dark futuristic newsroom to warm white, light ocean blue, sea-glass teal, and restrained navy.
- [x] Reduce aggressive red, heavy black panels, neon glows, scanline effects, and sci-fi motion.
- [x] Keep the news/broadcast credibility through typography, editorial cards, lower-thirds, and structured reporting labels.
- [x] Restore more soul through Hawaii/coastal origin language, public-service framing, and calmer community-centered copy.
- [x] Revise the hero so it feels cleaner, brighter, and less intimidating while retaining a strong call to action.
- [x] Update the File Your Report form to feel approachable and professional rather than emergency/incident-heavy.
- [x] Run TypeScript and production build checks after edits.
- [ ] Save a final checkpoint and return the updated website version.

# Live Tweak Pass Todo

- [ ] Identify the first high-impact visual area to tweak live with the user, starting with hero mood, color intensity, headline scale, navigation feel, or section spacing.
- [ ] Apply small, reversible refinements rather than broad redesigns so the user can compare changes clearly.
- [ ] Validate the page after each meaningful tweak and keep the live preview ready for review.
- [ ] Save a new checkpoint only after the user likes a revision direction.

# Live Header Ticker Todo

- [x] Add a live user-facing date and time display in the top header.
- [x] Replace the simple ticker with an animated broadcast bumper that centers “THE FLUSH REPORT” between two toilet icons and flashes three times before scrolling.
- [x] Add a “This Week’s Top Stories” ticker segment with a maximum of five source-linked wastewater, flushing, wipes, legislation, viral, or prevention stories.
- [x] Keep official/source links visible and clickable in the ticker without making the header feel cluttered.
- [x] Build the ticker data structure so a future daily scraper can replace the current curated story list.
- [x] Validate TypeScript and production build after the ticker update.

# Future Automation Reminder

- [ ] Later, connect the ticker to a backend daily scrape workflow that finds the newest relevant Flush Report stories, limits the feed to five items, verifies official/source URLs, and updates the public ticker automatically.
- [ ] Upgrade to backend support in a later session before automating ticker refreshes.
- [ ] Gather relevant stories from official legislation pages, municipal utility notices, public-works alerts, clean-water associations, credible consumer outlets, and wastewater-sector news sources.
- [ ] Rank and deduplicate stories, verify source URLs, limit the public ticker to five active items, and archive older items for a future newsroom page.
- [ ] Keep the current MVP static ticker as the fallback if the automated workflow is unavailable.

# Live Header Time Placement Tweak

- [x] Move the live date/time display from the navy ticker strip into the white header space above the ticker.
- [x] Keep the ticker strip focused on the animated bumper and linked weekly stories only.
- [x] Validate the header spacing on desktop and confirm the page still builds cleanly.

# Header, Ticker, Education, and Origin Image Revision

- [x] Slow the story ticker down substantially and make the typography more readable and less old-terminal-like.
- [x] Add a timezone selector next to the live local date and time.
- [x] Remove the blue File Report CTA box from the top header.
- [x] Position the date/time controls on the right side of the header and increase the font size to visually match the Flush Report wordmark scale.
- [x] Add an educational section before the anti-flushing content with four hard-hitting vision points.
- [x] Add three medium clickable pill feature boxes: upload videos on the left, socials in the center, and merch on the right, each with a short description.
- [x] Shift the visible page treatment toward a cleaner white background throughout.
- [x] Search for a real Pua Pump Station or Puhi Bay visual reference connected to County of Hawaii/Hilo wastewater context.
- [x] Replace the Keaukaha origin visual with the best real-source image if a usable reference is found, or document the limitation if not.
- [x] Validate TypeScript, production build, and desktop preview after the revision.

# Slim Sponsor Rail Addition

- [x] Add a small, lightweight advertising ticker or sponsor rail directly below the three educational pill boxes.
- [x] Keep the sponsor area visually slim and non-bulky so it supports monetization without interrupting the page flow.
- [x] Make the sponsor rail feel consistent with the public-service broadcast identity and white-background treatment.

# Uploaded Ick-Factor Visual Assets

- [x] Review the nine uploaded HEIC field images and select the strongest visuals that communicate the clogged-waste reality without overwhelming the page.
- [x] Convert selected HEIC files into web-safe JPEG or WebP assets outside the project directory.
- [x] Upload selected web-safe visuals using the required webdev asset workflow and reference the returned storage paths in the frontend.
- [x] Integrate selected images into the educational and/or origin/story sections in a way that strengthens the public-awareness message.
- [x] Avoid making the page feel gratuitous; keep captions educational, worker-respectful, and sponsor-safe.

# CTA, Upload Education, and Sponsor Placement Revision

- [x] Convert the three rounded pill feature boxes into stronger rectangular CTA cards that match the rest of the site flow.
- [x] Add subtle shadows and outlined button styling so the feature cards feel clickable without looking bulky.
- [x] Move the quick-access feature cards to the top of the page directly under the ticker.
- [x] Rename the File Report area into a more educational upload/field proof section rather than a generic report form.
- [x] Explain the upload purpose, what users can submit, and how submissions may help public education.
- [x] Add clear consent language for using uploaded clog or gross videos/photos on FRTV social channels and site content.
- [x] Mention the chance to win FRTV shirts, hats, or related merch for selected submissions.
- [x] Add at least three additional strategic sponsor/ad placements throughout the page beyond the existing slim sponsor rail.
- [x] Keep all new sponsor/ad placements tasteful, rectangular, sponsor-safe, and consistent with the white public-service broadcast design.
- [x] Add recognizable social app emblems for Instagram, TikTok, Facebook, YouTube, X, and related FRTV social channels.
- [x] Place the social app emblems where they support the quick-access social CTA and FRTV programming section without cluttering the white broadcast layout.
- [x] Validate TypeScript, production build, and desktop preview after the revision.

# Merch CTA Revision

- [x] Change the quick-access CTA title from “Win merch” to “Merch.”
- [x] Reframe the merch CTA copy around getting the latest Flush Report merch instead of primarily winning merch.
- [x] Update button/action text from giveaway-focused language to merch-shopping or merch-preview language.
- [x] Preserve giveaway references only where they support upload submissions and consent language.
- [x] Validate TypeScript and production build after the merch copy revision.

# Streamlined Quick Access and Scroll Incentive Revision

- [x] Remove the “Upload. Watch. Wear the message.” headline/copy block so the area under the ticker feels less friction-heavy.
- [x] Make the three quick-access CTA boxes smaller, tighter, and more streamlined while keeping them easy to scan and click.
- [x] Preserve the upload, social, and merch functions, but reduce repeated explanatory copy in the top cards.
- [x] Make the section immediately below quick access more visually present so users feel encouraged to scroll and explore the page.
- [x] Validate TypeScript, production build, and preview after the layout revision.

# Wastewater News and Featured Submission CTA Revision

- [x] Replace the top “Upload videos” quick-access card with “Top Wastewater News.”
- [x] Make the new news card navigate to a dedicated wastewater news page with latest articles, legislation, public works alerts, and major wastewater incidents.
- [x] Reframe the “Follow socials” CTA into “Be featured on The Flush Report,” emphasizing awareness, worst wastewater videos, pump repairs, clogs, rag pulls, and field proof.
- [x] Preserve social app emblems as secondary distribution context, not the main CTA message.
- [x] Add or update routing so the news page is reachable from the CTA and has a clear way back to the homepage.
- [x] Validate TypeScript, production build, and preview navigation after the revision.

# Cursor Handoff Package

- [ ] Document what The Flush Report is, including its purpose, goals, voice, audience, and current product vision.
- [ ] Summarize the current frontend implementation, active routes, key components, styling approach, asset handling, and validation status.
- [ ] Create a remaining-work roadmap that separates near-term static-site completion from later backend, outreach, automation, and agent operations.
- [ ] Package the full project source code for Cursor handoff while excluding dependency/build/cache folders that can be regenerated.
- [ ] Deliver the handoff document and code package to the user with concise next-step guidance.
