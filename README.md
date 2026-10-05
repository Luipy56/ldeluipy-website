# ldeluipy-website

Personal site for **Luipy** — full-stack developer and sysadmin. Live at [ldeluipy.es](https://ldeluipy.es).

## What this is

A single-page presentation in two languages: Spanish at `/`, English at `/en/`. Who I am, what I build, how the pieces connect, and real cases with public URLs or repositories. Designed to be clear for hiring and collaboration without sounding like a sales pitch.

Accent color: `#0f0`. Stack on the site itself: **plain HTML, CSS, and JavaScript** — no frameworks and no Node build step.

## Structure

```
.
├── index.html       # Spanish page
├── en/index.html    # English page
├── site.css         # Shared styles
├── site.js          # Shared behaviour (marquees, copy-to-clipboard)
├── favicon.svg
├── primordial.css   # Shared design tokens (paper / ink / accent)
└── README.md
```

## Run locally

Open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Contact

- Email: luipy@ldeluipy.es
- GitHub: [Luipy56](https://github.com/Luipy56)
- Discord: invite linked from the live site

## License

All rights reserved unless otherwise noted. Code and content belong to Luipy.
