# Checkpoints

## `checkpoint/header-with-timezone-clock`

Permanent restore point for the tall site header that includes:

- Logo + **THE FLUSH REPORT** title
- Plain **Timezone:** label
- Bordered timezone select (Hawaii-Aleutian, Alaska, Pacific, etc.)
- Live clock

- **Git tag:** `checkpoint/header-with-timezone-clock`
- **Commit:** `5551a52` — *Grow the site header another 15%.*

### Restore that header

```bash
git checkout checkpoint/header-with-timezone-clock -- client/src/pages/Home.tsx client/src/index.css
```

### Current direction

The timezone select + live clock were restored beside the brand lockup on the news-desk branch. The git tag above remains the permanent restore point if the clock is removed again.
