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
    *   **GitHub Calendar**: A custom JS-rendered contribution graph (`github-calendar.js`) with active-cell hover glows.
    *   **Profile Images**: Grayscale-to-Color transitions on hover.
    *   **Glass Pills**: High-end button styles with gradients and lift effects.

## 🛠 Tech Stack
*   **HTML5 / CSS3**: Semantic structure with advanced Flexbox/Grid layouts.
*   **Vanilla JavaScript**: Lightweight interactivity for the GitHub Graph.
*   **GitHub Pages**: Zero-cost, high-performance static hosting.
*   **FontAwesome**: Vector icons for intuitive navigation.
*   **Google Fonts**: 'Inter' and 'Georgia' for professional typography.

## 🚀 Features
*   **Interactive Contribution Graph**: Dynamic visualization of coding activity using `github-calendar.js`.
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

3.  **Deploy**:
    Commit and push to the `main` branch. GitHub Pages will auto-deploy.

## 📜 Credits
*   **Design**: Custom "Loyla AI" Theme (Deep Purple/Gold/Cyan).
*   **Graph Library**: [Bloggify/github-calendar](https://github.com/Bloggify/github-calendar)

---
*© 2026 Arjun Ghosh. AI for Everyone.*