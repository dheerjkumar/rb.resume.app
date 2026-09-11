# RB — Resume Builder & Career Networking Platform
## Full Technical Specification (Enhanced Build Prompt)

**Role:** You are an expert Full-Stack Software Engineer. Your task is to build "RB," a comprehensive, SaaS-grade MERN stack (MongoDB, Express.js, React, Node.js) resume builder and career networking platform.

## Tech Stack Requirements

- **Frontend:** React (Vite), Tailwind CSS, Context API or Redux Toolkit for state management, React Router for navigation.
- **Backend:** Node.js, Express.js, RESTful API design.
- **Database:** MongoDB with Mongoose ODM.
- **Authentication:** Passport.js (`passport-google-oauth20`), JSON Web Tokens (JWT).
- **AI:** Google Gemini API.
- **Media Storage:** Cloudinary (profile photos, institute logos, resume assets).
- **Email:** Nodemailer.
- **Real-Time:** Socket.io.
- **Editors:** TipTap or ReactQuill (rich text), react-grid-layout (drag-and-drop), react-joyride (onboarding tour).
- **PDF Export:** `@react-pdf/renderer` or `html2pdf.js` (client-side rendering) for standard templates; a server-side LaTeX toolchain (TeX Live + `pdflatex`, invoked via `node-latex` or a sandboxed child process) for LaTeX-authored templates.

Build the application according to the following module specifications.

---

## Module 1 — Authentication & User Management

1. **Frictionless Auth:** Implement Google OAuth 2.0 via `passport-google-oauth20`. Issue a JWT and persist it securely on the frontend (e.g., httpOnly cookie or encrypted storage). On app load, rehydrate authentication state from the token **before** rendering protected routes, so that navigating back to a previously authenticated page never briefly flashes a false "logged out" state.
2. **Dashboard & History:** Build a user dashboard listing every resume the user has generated. Each entry is tagged with a `targetCompany` field and a precise creation timestamp (date + time), with quick actions to view, edit, or re-download.
3. **Global UI Components:** Persistent navbar with a custom-designed "RB" logo, and a persistent footer reading "All rights reserved 2026–2027, made with love." Include static/functional pages for Help Desk, Contact, Feedback, and a Beginner's Guide & History of RB.
4. **Onboarding Tour:** Integrate `react-joyride` to trigger a one-time interactive tour (tooltips + spotlights) for new users, highlighting the Dashboard, Template Gallery, Resume Builder, AI-Enhance feature, Career Insights community, and Referral program. Store a `hasSeenTour` flag on the user document so it never repeats.

---

## Module 2 — The Resume Engine (Frontend)

### Data Schema
Collect the following, organized as independently editable sections:

- **Personal Details:** Full name, professional title/summary, profile photo (uploaded to Cloudinary), email, phone number, location.
- **Education:** 10th grade (school, location, board, year of passing, percentage/CGPA), 12th grade (school, location, board, year of passing, percentage/CGPA), Institute/College (name, location, degree, CGPA, years attended).
- **Experience:** Company, location, role, duration (start–end), detailed bullet-point description, optional link (e.g., a repo tied to the role).
- **Projects:** Title, description, tech stack, duration, and an *optional* link with a user-defined display label (e.g., "Live Demo," "View Repo," "Case Study").
- **Skills:** Grouped under **user-defined category labels** rather than a fixed taxonomy (e.g., "Languages," "Web Technologies," "Libraries/Frameworks," "Database & Tools," "Core Concepts" — or simply "Technical / Tools / Soft Skills"), so each template can present its own grouping convention.
- **Achievements / Honors & Awards:** Academic, research, and hackathon accomplishments. A template may relabel this section (e.g., as "Honors and Awards") without changing the underlying data shape.
- **Hobbies & Extracurriculars.**
- **Custom Hyperlinks:** GitHub, LinkedIn, and coding-profile links (LeetCode, Codeforces, etc.), each with a user-defined display label — kept separate from the personal-details contact fields above.

### Template Gallery
- Implement 2–4 distinct resume templates.
- Each template in the gallery is shown **pre-filled with realistic sample data** (not a blank frame), so users can compare layouts side by side before committing to one.
- **Conditional Fields:** Selecting a template drives which fields appear in the builder. Standard templates simply omit fields they don't use (e.g., no Institute Logo picker) rather than merely disabling them.

**Template 1 — "Classic ATS" (ported from the supplied `.tex` source):**
A single-page, ATS-optimized layout, rebuilt as an editable React/Tailwind component for the live builder while preserving the original LaTeX design:
  - **Header:** two-column layout — name (large, bold), phone/email, and a row of clickable contact-icon links (LinkedIn, GitHub, LeetCode, portfolio) on the left; profile photo (from Cloudinary) on the right.
  - **Section headings** use small-caps bold text with a full-width horizontal rule underneath (Education, Experience, Projects, Technical Skills, Honors and Awards, Extracurricular Activities).
  - **Education & Experience entries** render as a two-column subheading row — institution/company + location on the left, degree/role + dates on the right — followed by bullet points.
  - **Project entries** show the title, an inline optional link with its user-defined label (e.g., "Live Link"), the tech stack in italics, and the duration right-aligned, followed by bullet points.
  - **Technical Skills** render as labeled category rows (per the user-defined categories in the Skills schema above), not a tag cloud.
  - **Honors and Awards** and **Extracurricular Activities** reuse the Achievements and Hobbies data respectively, styled as compact subheading / one-line entries.
  - **Density:** tight vertical spacing throughout so a typical resume fits on one page; show a non-blocking warning in the live preview if content overflows onto a second page.
  - No Institute Logo field — this is a standard, logo-free template.

**Template 2 — "NIRF Institute":** Same layout conventions as Template 1, with the Institute Logo dropdown enabled — queries a curated, Cloudinary-hosted asset library of NIRF-ranked Indian institutes (an admin-managed, extensible list — new logos can be added without a code deploy).

Additional templates (up to 4 total) can reuse this same data schema with different visual styling.

### WYSIWYG & Typography
- Use TipTap or ReactQuill so users can click directly on the live resume preview and edit text in place.
- Provide **per-section** typography controls (font size, bold, italic), scoped to each template's default styling rules.
- **Font-Size Guardrail:** A state-watcher monitors the selected font size and shows a non-blocking warning if the value falls outside professional norms (e.g., smaller than ~9pt or larger than ~14pt for body text).

### Drag, Drop & Reflow
- Integrate `react-grid-layout` so users can manually drag elements (profile photo, section headers, etc.) to adjust spacing. Moving an element automatically reflows everything positioned below it.
- **Section Removal:** Each section carries a "remove" icon to delete it from the active layout.
- **Immutable Reset:** A "Reset to Default" button overwrites the active layout state with the template's original, immutable configuration, letting users safely undo any formatting mistakes.

---

## Module 3 — AI Processing & Document Generation

1. **AI Enhancement:** Integrate the Gemini API. Place an "Enhance with AI" button beside the Project and Experience text areas to correct grammar and elevate tone/professionalism.
2. **Validation Threshold:** Gate the enhancement button behind a minimum content requirement — both a minimum word/character count **and** a minimum number of bullet points — so the AI always has enough substance to work with before it runs.
3. **Document Generation (dual path):**
   - **Standard templates:** Use `@react-pdf/renderer` or `html2pdf.js` to convert the live DOM into a high-quality PDF entirely on the client, avoiding server memory constraints.
   - **LaTeX-authored templates (e.g., "Classic ATS"):** To preserve the exact professional typesetting of the source `.tex` file, generate these PDFs server-side instead. Populate a working copy of the `.tex` template with the user's data (placeholder substitution or a templating layer such as Handlebars), download the user's Cloudinary profile photo to a temporary local file (LaTeX cannot `\includegraphics` a remote URL), compile with `pdflatex` (via `node-latex` or a sandboxed child process), stream the compiled PDF back to the client, then delete the temp files.

---

## Module 4 — Distribution, Limits & Gamification

1. **Daily Quotas:** Backend rate limiting caps each user at 2 PDF generations per day, resetting on a rolling 24-hour or midnight-UTC basis.
2. **Referral Growth Loop:** Generate a unique `?ref=CODE` link per user and track incoming unique visits. If a user drives 5 unique referred visitors within a rolling 7-day window, automatically grant +1 bonus generation for that week, stacked on top of the daily cap.
3. **Native Sharing:** Implement the Web Share API (`navigator.share`) so users can send their resume directly to installed apps like WhatsApp.
4. **Opt-In Email Delivery:** Integrate Nodemailer so users can optionally have their PDF emailed to their registered Google address, wrapped in a creative, branded HTML message (e.g., "Here is your RB-built resume…").

---

## Module 5 — "Career Insights" Community Platform

1. **Rich-Text Blogging:** A notepad-style WYSIWYG editor (headings, bold/italic, font size) for writing and sharing career tips. The same AI-enhancement tool from Module 3 is available here so users can refine posts before publishing.
2. **Seeded Starter Content:** Pre-populate the platform with a handful of admin-authored posts covering resume fundamentals (e.g., "quantify your achievements," "tailor your resume per role") so first-time visitors immediately have useful, credible content to read.
3. **Social Graph:** User profiles with follow/unfollow. The home feed prioritizes posts from authors the viewer follows.
4. **Engagement Mechanics:**
   - Thumbs-up (like) system on posts.
   - Nested comment architecture — comments on posts, replies to comments — with comment-level likes.
   - A "Share" button on individual posts.
5. **Direct Messaging:** A lightweight private-messaging inbox between users (particularly between people who follow each other), so a user can reach out to a tip's author directly. This can be an asynchronous inbox rather than a live chat.
6. **Real-Time Notifications:** Use Socket.io to push a live UI notification to an author whenever their post or comment receives a like or a comment.

---

## Non-Functional Requirements

- Modular, well-separated code structure (routes / controllers / models / services on the backend; components / hooks / context on the frontend).
- Strict environment-variable management for every credential — never hard-code secrets.
- Robust error handling and input validation across all frontend and backend routes.
- Mobile-responsive layouts throughout, including the resume builder and community feed.
- Basic security hardening: rate limiting, sanitized inputs, and secure JWT/cookie handling.
- **System dependency:** the backend host/container must ship a working TeX Live installation (`pdflatex` on the `PATH`) with the packages the "Classic ATS" template uses — `fontawesome5`, `titlesec`, `marvosym`, `enumitem`, `hyperref`, `fancyhdr`, `graphicx` — to support server-side compilation of LaTeX-authored templates.

### Required Environment Variables
```
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
CLIENT_URL=
PORT=
```
