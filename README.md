# Hassan Haroon: portfolio

Live site: https://hassanharoon321.netlify.app/

A single-page portfolio built with React, TypeScript, Vite and Tailwind CSS. The floor plan at
the top of the page is not a video. It is a small simulation that runs in the browser: synthetic
guests walk around a restaurant while a miniature of my occupancy and footfall engines counts
them and works out the state of every table.

## Run it

Needs Node 20.19 or newer. Node 22 is what Netlify builds with.

```bash
npm install
npm run dev        # development server at http://localhost:5173
npm run build      # type-check, then build into ./build
npm run preview    # serve the production build locally
```

Other scripts: `npm run typecheck`, `npm run format`, `npm run check-format`.

## Change the content

Everything the site says lives in one file: [src/data/profile.ts](src/data/profile.ts). Edit a
project, a job or a paragraph there and the page follows. Page titles and link-preview text are
in [index.html](index.html).

Add `?theme=light` or `?theme=dark` to the URL to open the page in one theme.

## Layout

```
index.html              page shell, meta tags, theme bootstrap
src/data/profile.ts     all content
src/components/         one file per section, plus the live plan
src/lib/sim/            the simulation: scene geometry, the world, the two engines
src/lib/                theme and small hooks
src/styles/globals.css  design tokens, type scale, plan drawing styles
public/                 fonts, icons, link-preview image
```

## Deploying

Netlify reads [netlify.toml](netlify.toml): it runs `npm run build` and publishes `build/`.
Asset paths are relative, so the same build also works under a sub-path such as GitHub Pages.

## Credits

Typeface: Sofia Sans by Lettersoup, under the SIL Open Font License
([public/fonts/OFL.txt](public/fonts/OFL.txt)).
