# CLAUDE.md

Guidance for working in this folder.

## What this is

Static website for **SJ-BIESH 2027**, the Silver Jubilee Multidisciplinary International Conference "Bridging Intelligence Across Engineering, Science, and Humanities" (May 27-29, 2027), organised by Mar Baselios Christian College of Engineering and Technology (MBCCET), Peermade and St Joseph Engineering College (SJEC), Mangaluru. All page content comes from `../reference_brochure/SJEC-MBCCET- DRAFT BROCHURE _edited on 28 sept.docx`; do not add facts that are not in the brochure. It is the BootstrapMade **TheEvent** template (Bootstrap 3 + jQuery) restyled in the Think Forward look (`css/think.css`). The site replaced the previous IDIC 2.0 (2026, St Aloysius) content; old images, PDFs and `speaker-details*.html` are still on disk but no longer linked. The `.htaccess` still references the previous `senergy25.mbccet.in` deployment.

Placeholders awaiting content: conference email, website and paper-submission link ("To be announced"), plus empty Keynote Speakers, Gallery and FAQ sections (`.tf-placeholder`). The two campus photos `img/hero/college-1.jpg` (MBCCET) and `college-2.jpg` (SJEC) are still generated dummies; replace them in place with real 1920x1080 photos (used in the split hero and the venue panels).

There is no build step, package manager, test suite or linter. Edit files directly and open `index.html` in a browser.

## Frontend design and edits

For any frontend design or UI change in this project, always use these skills before editing:

- `frontend-design` (invoke as `frontend-design:frontend-design`)
- `ui-ux-pro-max`
- `shadcn` (the shadcn MCP server is registered in `.mcp.json`)

If one of these is not installed or not available in the session, tell the user instead of skipping it silently. Keep to the visual system in `css/think.css`, and remember this is a plain HTML and jQuery site: shadcn/React components must be ported to vanilla HTML, CSS and JS, not added as a React build.

Visual system (Convoke-inspired, redesigned Sep 2026): full-bleed colour blocks drawn from the two host places (`--ink` hero/footer, `--mist` paper, `--ghats` green, `--turmeric` accent, `--laterite`, `--sea`), Big Shoulders Display condensed caps for headings plus Instrument Sans for body, square controls, hairline rules. Most sections use `.sj-split` (sticky heading column left, content right). Motion budget: one hero arrival, the venue photo wipes, the dates stagger and the About scroll-reveal; do not add fade-ups to every section.

## Earth transition hook

A separate Earth, zoom and transition experience will hand users to this page; it is not built here. The hero (`#intro`) is the arrival point: a head script adds `.js-arrival` before paint, and `js/main.js` adds `.is-arrived` to play the entrance (campus photos open as a widening circle from the centre, then the headline rises). By default it plays on load. To hold it for the Earth scene, add `data-await-arrival` to `<html>` and call `document.dispatchEvent(new Event('sjb:arrive'))` when the transition ends. Without that attribute, a 4s failsafe in the head script shows the hero even if `main.js` fails.

## Run / preview

```bash
python3 -m http.server 8000   # from this folder, then open http://localhost:8000
```

Deployment is plain file upload to an Apache host (`.htaccess` does an HTTPS/www redirect).

## Layout

- `index.html`: the whole single-page site, with unique section ids in this order: `#intro`, `#about`, `#institutions`, `#tracks` (call for papers), `#schedule` (important dates), `#registration` (fee table), `#speakers` (placeholder), `#venue` (Peermade and Mangaluru), `#gallery` (placeholder), `#faq` (placeholder), `#contact`.
- `committee/index.html`: the Patrons & Committees page, served at `/committee` (Apache and `http.server` redirect to `/committee/`). It reuses the site header, footer, `think.css` and `js/main.js` with `../` asset paths and a permanently solid header (`header-fixed`); its nav links back to `../#section`. Keep its nav and footer in step with `index.html`.
- `speaker-details1..5.html` and `brochure/`: legacy IDIC pages, unlinked and out of date. Leave them or delete them only when asked.
- `css/style.css`: the original template stylesheet. `css/think.css` loads after it and holds the current theme: the `.sj-*` layout blocks (hero, splits, timeline, fee stubs, venue panels) plus the older `.tf-*`/`.ui-*` classes still in use. Make new style changes in `think.css`. `style.css` styles many elements by id (`#intro h1`, `#about h2`, `#about p`), so overrides there need an id prefix (`#intro .sj-title`, `#main .section-header h2`). The theme's SCSS sources are not included (pro version only).
- `js/main.js`: jQuery glue: back-to-top, sticky and hide-on-scroll header, mobile nav clone, Read-more toggles (custom labels via `data-label-closed`/`data-label-open`), hero arrival, one rAF scroll handler (progress bar, nav highlight, venue parallax), IntersectionObserver reveals for `.sj-timeline` rows and `[data-reveal-media]`.
- `js/decrypted-text.js`: vanilla port of the React Bits DecryptedText effect. No longer loaded (the hero uses a line reveal); kept on disk. `components/decrypted_text/` holds only the React usage example; the site does not use React.
- `contactform/contactform.js`: client-side validation for the old contact form. The page no longer has a form, so the script is loaded but idle.
- `lib/`: vendored third-party libraries (bootstrap, jquery, superfish, wow, owlcarousel, font-awesome, animate, easing, venobox). Do not edit them.
- `img/`: images. `img/speakers/` holds numbered photos (`01.jpg`, `101.jpg`, `201.jpg`, ...) referenced from `index.html`; `TheEvent/` holds template leftovers.
- `.well-known/pki-validation/` and `.well-known.zip` (79 MB): SSL certificate validation files. Leave them alone.

## Conventions and gotchas

- Google Fonts (Big Shoulders Display, Instrument Sans) is the only external dependency; everything else is served locally. No GSAP: motion is CSS transitions plus IntersectionObserver and one rAF handler, all gated by `prefers-reduced-motion`.
- Section ids in `index.html` are unique; keep them that way, since the nav and footer link to them.
- `js/main.js` sets `#intro` to the window height on mobile; `think.css` overrides this with `height: auto !important`.
- Large binary files (`.zip`, PDFs, images) live in the folder. Do not read or re-commit them without reason, and do not add new zips.
- Mobile behaviour of `#intro` height is set in `js/main.js` (viewport width below 768px).
