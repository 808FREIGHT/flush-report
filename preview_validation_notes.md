# Preview Validation Notes

Date: 2026-05-03 HST

The live preview was checked at `https://3000-i2bqnu09vvzozb7hzz5xf-24a8b143.us2.manus.computer/` after updating the quick-access cards and adding the news route.

## Homepage Quick-Access Section

The quick-access subtitle now reads **Top News · Be Featured · Get Merch**. The three rectangular CTA cards render as **Top Wastewater News**, **Be Featured**, and **Merch**. The Top Wastewater News card uses source-backed wastewater news language and presents a **Read the latest** action. The Be Featured card uses The Flush Report awareness language and includes the FRTV social emblems plus a **Submit field proof** action. The Merch card remains a general merch-shopping lane.

## Navigation Flow Checks

Clicking the **Top Wastewater News** quick-access card navigated successfully from `/` to `/news`. The `/news` route rendered the Top Wastewater News page with six source-backed cards and the bottom Be Featured call to action.

Clicking the **Be Featured** quick-access card navigated successfully to `/#upload-proof` and scrolled the preview to the upload form. The upload form, consent language, file input, and submit button were visible after the jump.

## Build Validation

`pnpm check` completed with zero TypeScript errors. `pnpm build` completed successfully. Vite emitted only the existing large chunk warning, not a build failure.
