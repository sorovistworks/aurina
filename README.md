# Aurina

Landing site for Aurina: Reiki healing and Reiki Level 1 teaching.
Founder: Sourav Nath. Practitioner: Sanghamitra Nath.

Static site built with Vite, GSAP (ScrollTrigger, SplitText), Lenis and a small WebGL shader.

## Before going live

1. Edit `.env` with the real WhatsApp number, email and city.
2. Add portraits: replace the two `.portrait-slot` figures in `index.html` with `<img>` tags (put the files in `public/img/`).
3. Review the draft bios in the "people" section.

## Develop

```bash
npm install
npm run dev
```

## Deploy to Spaceship hosting

```bash
npm run build
```

Upload everything inside `dist/` (not the folder itself) to `public_html` with the Spaceship hosting File Manager or FTP.
If you are not using Spaceship hosting, the same `dist/` folder works on Netlify, Vercel or Cloudflare Pages; point the domain's DNS records there from the Spaceship dashboard.
