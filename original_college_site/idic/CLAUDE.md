# CLAUDE.md

Guidance for working in this folder.

## What this is

Static website for **SJ-BIESH 2027**, the Silver Jubilee Multidisciplinary International Conference "Bridging Intelligence Across Engineering, Science, and Humanities" (May 27-29, 2027), organised by Mar Baselios Christian College of Engineering and Technology (MBCCET), Peermade and St Joseph Engineering College (SJEC), Mangaluru. All page content comes from `../reference_brochure/SJEC-MBCCET- DRAFT BROCHURE _edited on 28 sept.docx`; do not add facts that are not in the brochure. It is the BootstrapMade **TheEvent** template (Bootstrap 3 + jQuery) restyled in the Think Forward look (`css/think.css`). The site replaced the previous IDIC 2.0 (2026, St Aloysius) content; old images, PDFs and `speaker-details*.html` are still on disk but no longer linked. The `.htaccess` still references the previous `senergy25.mbccet.in` deployment.

Placeholders awaiting content: conference email, website and paper-submission link ("To be announced"), plus empty Keynote Speakers, Gallery and FAQ sections (`.tf-placeholder`).

There is no build step, package manager, test suite or linter. Edit files directly and open `index.html` in a browser.

## Run / preview

```bash
python3 -m http.server 8000   # from this folder, then open http://localhost:8000
```

Deployment is plain file upload to an Apache host (`.htaccess` does an HTTPS/www redirect).

## Layout

- `index.html`: the whole single-page site, with unique section ids in this order: `#intro`, `#about`, `#institutions`, `#tracks` (call for papers), `#schedule` (important dates), `#registration` (fee table), `#speakers` (placeholder), `#committee` (patrons and committees), `#venue` (Peermade and Mangaluru), `#gallery` (placeholder), `#faq` (placeholder), `#contact`.
- `speaker-details1..5.html` and `brochure/`: legacy IDIC pages, unlinked and out of date. Leave them or delete them only when asked.
- `css/style.css`: the original template stylesheet. `css/think.css` loads after it and holds the current theme plus the `.tf-*` classes for the new blocks (tracks, fee table, people lists, cards, placeholders). Make new style changes in `think.css`. The theme's SCSS sources are not included (pro version only).
- `js/main.js`: jQuery glue: back-to-top, sticky header, WOW animations, Venobox lightbox, Superfish menu, mobile nav clone, owl carousels.
- `contactform/contactform.js`: client-side validation for the old contact form. The page no longer has a form, so the script is loaded but idle.
- `lib/`: vendored third-party libraries (bootstrap, jquery, superfish, wow, owlcarousel, font-awesome, animate, easing, venobox). Do not edit them.
- `img/`: images. `img/speakers/` holds numbered photos (`01.jpg`, `101.jpg`, `201.jpg`, ...) referenced from `index.html`; `TheEvent/` holds template leftovers.
- `.well-known/pki-validation/` and `.well-known.zip` (79 MB): SSL certificate validation files. Leave them alone.

## Conventions and gotchas

- Google Fonts is the only external dependency; everything else is served locally.
- Section ids in `index.html` are unique; keep them that way, since the nav and footer link to them.
- `js/main.js` sets `#intro` to the window height on mobile; `think.css` overrides this with `height: auto !important`.
- Large binary files (`.zip`, PDFs, images) live in the folder. Do not read or re-commit them without reason, and do not add new zips.
- Mobile behaviour of `#intro` height is set in `js/main.js` (viewport width below 768px).
