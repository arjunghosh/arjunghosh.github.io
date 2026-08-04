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
    *   **GitHub Calendar**: A self-rendered SVG contribution graph (no third-party widget) with active-cell hover glows.
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

## 📝 Changelog
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
