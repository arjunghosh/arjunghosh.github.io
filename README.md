# Arjun Ghosh - Chief AI Officer Portfolio

A premium, single-screen portfolio website designed for high-impact professional presence. This static site combines glassmorphism aesthetics with interactive data visualizations to showcase leadership roles in AI and Technology.

**Live Site:** [https://arjunghosh.github.io/](https://arjunghosh.github.io/)

## 🎨 Design Philosophy
*   **Single Screen Focus**: Engineered to fit 100% of the viewport height (100vh) on standard desktops, eliminating the need to scroll.
*   **Premium Glassmorphism**: Utilizes semi-transparent backgrounds, blurs, and subtle borders to create depth and a modern "tech" feel.
*   **Visual Hierarchy**:
    *   **Tier 1**: Name & Critical Roles (CAIO/CTO/Founder).
    *   **Tier 2**: Key Actions (Community & Resume).
    *   **Tier 3**: Interactive Social Proof (GitHub Graph & Social Links).
*   **Interactive Elements**:
    *   **GitHub Calendar**: A self-rendered SVG contribution graph (no third-party widget) using GitHub's neon-green dark-mode palette, with active-cell hover glows.
    *   **Profile Images**: Grayscale-to-Color transitions on hover.
    *   **Glass Pills**: High-end button styles with gradients and lift effects.

## 🛠 Tech Stack
*   **HTML5 / CSS3**: Semantic structure with advanced Flexbox/Grid layouts.
*   **Vanilla JavaScript**: Lightweight interactivity for the GitHub Graph.
*   **GitHub Pages**: Zero-cost, high-performance static hosting.
*   **FontAwesome**: Vector icons for intuitive navigation.
*   **Google Fonts**: 'Inter' and 'Georgia' for professional typography.

## 🚀 Features
*   **Interactive Contribution Graph**: Dynamic visualization of coding activity, rendered inline as SVG from a live contributions API. Hardened with a 6s request timeout and a three-tier fallback chain (live JSON → static chart image → GitHub profile link), so the section can never sit on "Loading..." if an upstream service goes down.
*   **Dual Profile Header**: Showcasing both the Corporate (Flexilytics) and Developer (GitHub) personas.
*   **Responsive Layout**: Adapts gracefully from wide desktop screens to mobile devices.
*   **Performance**: Zero external frameworks, ensuring instant load times (99+ Lighthouse score).

## 📦 Setup & Development
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/arjunghosh/arjunghosh.github.io.git
    cd arjunghosh.github.io
    ```

2.  **Run Locally**:
    Since this is a static site, you can serve it with Python's built-in server:
    ```bash
    python3 -m http.server 8000
    ```
    Open `http://localhost:8000` in your browser.

3.  **Run the Tests**:
    Playwright covers the contribution graph and guards against the CDN/proxy
    failure modes that have broken it before.
    ```bash
    npm install
    npx playwright install chromium
    npm test                 # local static server on a random free port
    npm run test:live        # same suite against https://arjunghosh.github.io
    ```

4.  **Deploy**:
    Commit and push to the `main` branch. GitHub Pages will auto-deploy.

## 🛡 Dependency Policy
This site is public-facing and has no build step, so every external asset is a
direct production dependency:
*   **Never use `@latest`** on a CDN URL. Pin an explicit version. An upstream
    publish must never be able to change the live site.
*   **Every remote fetch needs a timeout and a fallback.** Third-party services
    go down; the page must still render something useful.
*   **Prefer server-rendered images or self-rendered SVG** over third-party JS
    widgets for anything on the critical visual path.
*   **Never hotlink images from another site.** Commit them to `assets/`. A
    hotlinked portrait broke twice; the second time it flapped between HTTP 403
    and 200, which no amount of client-side retrying would have fixed.
*   **Every `<img>` gets an `onerror` fallback**, so a dead asset degrades to
    something sensible instead of stretched alt text.

## 📝 Changelog
### [v1.7.3] - 2026-08-04
*   **Design**: The lead portrait is now larger than the secondary avatar
    (140px vs 100px) via a `.profile-img--lead` modifier, and the crop was
    loosened (3200px source square instead of 2600px) so there is headroom
    above the head instead of the frame cutting in tight.
*   **Asset**: Re-exported at 640×640 / 42 KB, enough for a 140px circle at 3×
    device pixel ratio.
*   **Tests**: 30 passing. Added checks that the lead portrait measures 140px
    while the secondary stays 100px, and that the lead image ships at least
    420px of real pixels.

### [v1.7.2] - 2026-08-04
*   **Fix**: The left header portrait is now served from this repo
    (`assets/arjun-ghosh.jpg`) instead of hotlinking
    `https://www.flexilytics.ai/assets/team/arjun.jpeg`. That asset began
    returning HTTP 403 (confirmed in a real browser, `naturalWidth 0x0` on the
    live page) and rendered as stretched alt text. It has since been observed
    flapping back to 200 — an intermittently available asset is exactly what a
    homepage should not depend on. The Flexilytics *link* is unaffected and
    still points at `/about`, which resolves normally.
*   **Asset**: Source portrait downscaled and square-cropped to head-and-shoulders
    — 4096×3848 / 8.4 MB → 512×512 / 29 KB progressive JPEG, for a 100px circle.
*   **Resilience**: Added an `onerror` fallback on the portrait so a missing
    image degrades to the GitHub avatar rather than broken alt text.
*   **Design**: Empty contribution cells changed from GitHub's near-black L0
    (`#151b23`) to a translucent white veil (`#ffffff` at 12% opacity). Measured
    on this card's purple background, a solid light L0 is 7.50:1 while the
    brightest green is 4.38:1 — empty days would have outshone busy ones. The
    veil sits at 1.35:1 and recedes behind every green.
*   **Tests**: 28 passing. Added portrait coverage (both images decode, left
    image is same-origin, no `<img>` points at flexilytics.ai, `onerror`
    fallback works, committed asset under a 200KB budget) and updated the
    palette/legend tests for the translucent empty cell.

### [v1.7.1] - 2026-08-04
*   **Design**: Recoloured the contribution grid from Loyla cyan to GitHub's
    neon-green contribution palette.
*   **Palette**: Uses GitHub's **dark-mode** ramp
    (`#151b23`, `#033a16`, `#196c2e`, `#2ea043`, `#56d364`), verified by reading
    computed `backgroundColor` off `[data-level]` nodes on a live GitHub profile
    under `colorScheme: dark`. The light-mode ramp was rejected because on this
    card's purple background it inverts — its empty cells outshine its busiest
    days (7.19:1 vs 1.35:1 contrast).
*   **Feature**: Added the right-aligned "Less → More" legend.
*   **Change**: Hover glow switched from cyan to `#56d364` so the halo matches
    the cells; removed the `opacity: 0.3` override on empty cells in favour of
    GitHub's literal level-0 fill.
*   **Change**: Fallback chart image recoloured to match (`ghchart.rshah.org/56d364/`).
*   **Tests**: 22 passing. Added palette-pinning tests (exact hex per level,
    no cyan remaining, green hover glow, green fallback URL) and legend tests
    (five ordered swatches, Less/More labels).

### [v1.7.0] - 2026-08-04
*   **Fix**: Restored the GitHub contribution graph, which had been stuck on
    "Loading GitHub Activity...". Root cause: `github-calendar@latest` fetched
    from a single hardcoded proxy (`api.bloggify.net`) whose origin was returning
    `HTTP 522`, with no timeout and no fallback in the widget.
*   **Change**: Removed the `github-calendar` dependency entirely. The graph is
    now rendered inline as SVG from `github-contributions-api.jogruber.de`,
    reusing the existing `ContributionCalendar-day` glow styling.
*   **Resilience**: Added a 6s abort timeout and a three-tier fallback chain
    (live JSON → `ghchart.rshah.org` image → GitHub profile link).
*   **Feature**: Added the "N contributions in the last year" headline, matching
    the GitHub profile page.
*   **Hardening**: Pinned/annotated all CDN assets, added `crossorigin` +
    `referrerpolicy` to remote stylesheets, and added font `preconnect` hints.
*   **Tests**: Added a Playwright suite (15 tests) covering the grid, the
    fallback chain, the degraded state, and regression guards against `@latest`
    and the dead proxy.
*   **Repo Hygiene**: Added `.gitignore`; untracked `node_modules/` and
    `.DS_Store` (files retained on disk).

### [v1.6.2] - 2026-06-16
*   **Content Update**: Replaced the April resume PDF with the latest CTO/CAIO resume dated 16-Jun-2026.
*   **Fix**: Updated the resume download button to point at the new PDF in `docs`.

### [v1.6.1] - 2026-05-17
*   **Cleanup**: Removed broken "Weekday Works" link and icon.
*   **Verification**: Systematically verified all other social icon links (LinkedIn, GitHub, X, etc.) to ensure they point to Arjun Ghosh's active profiles.

### [v1.6.0] - 2026-05-17
*   **Fix**: Resolved broken Flexilytics profile image by updating to a verified URL (`arjun.jpeg`).
*   **Fix**: Upgraded FontAwesome from v6.4.0 to v6.6.0 to fix missing social icons (specifically the "X" / Twitter logo).
*   **Maintenance**: Verified overall site layout and resume link integrity.

### [v1.5.0] - 2026-04-24
*   **Content Update**: Updated the resume download link to the latest 2026 version.
*   **File Restructuring**: Migrated the resume PDF into a dedicated `docs` folder for better organization.
*   **Verification**: Verified that the GitHub contributions wall design (`github-calendar.js`) is correctly fetching and auto-updating dynamic data.

## 📜 Credits
*   **Design**: Custom "Loyla AI" Theme (Deep Purple/Gold/Cyan).
*   **Graph Data**: [jogruber/github-contributions-api](https://github.com/grubersjoe/github-contributions-api) (primary), [ghchart.rshah.org](https://ghchart.rshah.org/) (fallback).

---
*© 2026 Arjun Ghosh. AI for Everyone.*
