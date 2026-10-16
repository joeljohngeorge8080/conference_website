# SJ-BIESH 2027

The website for SJ-BIESH 2027, the Silver Jubilee Multidisciplinary International Conference, *Bridging Intelligence Across Engineering, Science, and Humanities*. It is organised by Mar Baselios Christian College of Engineering and Technology (MBCCET), Peermade, and St Joseph Engineering College (SJEC), Mangaluru, and runs from 27 to 29 May 2027.

The site is a set of static HTML, CSS and JavaScript files. There is no build step and nothing to install.

## Running it locally

From the repository root:

    cd idic
    python3 -m http.server 8000

Then open http://localhost:8000 in a browser.

## What is where

The site itself lives in `idic/`. The folder keeps its name from the earlier conference site.

- `index.html` is the home page: one long page with a section for each topic.
- `venue/index.html` covers both campuses and the photo gallery.
- `committee/index.html` lists the patrons and committees.
- `css/think.css` holds the styles. Visual changes go here.
- `js/main.js` handles navigation, scroll reveals and the opening animation.
- `js/paper/` drives the paper animation on the home page. It uses WebGL, with three.js and GSAP.
- `img/` holds the photos, split by use: `hero/`, `campus-gallery/` (MBCCET), `sjec-gallery/` (SJEC) and `committee/`.
- `lib/` holds third-party libraries such as Bootstrap, jQuery and three.js. Leave these as they are.

`speaker-details1.html` to `speaker-details5.html` and `brochure/` come from an earlier conference. They are no longer linked from the site.

## Editing content

Page text is written directly in the HTML.

- **Dates:** edit the timeline in `index.html`.
- **Committee members:** copy an existing `<li>` in `committee/index.html` and change the name and details. The Technical Advisory Committee is sorted alphabetically by name, so keep new entries in that order.
- **Gallery photos:** add an `<a>` with the `venobox` class to the right gallery in `venue/index.html`. The `data-gall` value keeps the MBCCET and SJEC lightboxes separate, so the arrows stay within one campus.

Resize gallery photos to about 1800 px wide, save them as JPEG at around 80% quality, and strip the metadata. Camera files often contain GPS data, which would otherwise be published with the image.

## Deploying

`deploy.sh` copies `idic/` to the AWS S3 bucket that serves the site and then clears the CloudFront cache. It shows what will change and asks for confirmation before uploading. It needs the AWS CLI and credentials with access to that bucket. Credentials must never be committed to the repository.

## Still open

- The paper submission link is shown as "to be announced".
- The keynote speakers and FAQ sections are placeholders.
- `img/hero/college-1.jpg` and `img/hero/college-2.jpg` are generated stand-ins. Replace them with real 1920 × 1080 campus photos, keeping the same filenames.

## Credits

The site is built on the TheEvent template by BootstrapMade (Bootstrap 3 and jQuery) and restyled. Template licence terms are at https://bootstrapmade.com/license/.

Developed by Joel John George, Reno Cherian and Jittu Bijju.

## Licence

The code in this repository is released under the MIT Licence; see `LICENSE`. This covers the code, not the conference content. The text, photos and logos belong to MBCCET and SJEC, and the bundled libraries and template keep their own licences.
