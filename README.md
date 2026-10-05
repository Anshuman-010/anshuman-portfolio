# Anshuman Prakhar: Portfolio

Single-page portfolio (HTML/CSS/JavaScript) with a Node.js + Express backend for the contact form.

```
anshuman-portfolio/
├── public/
│   ├── index.html          <- the whole site; edit the CONTENT block at the top
│   └── assets/
│       ├── hero-main.jpg   <- hero image (line-art portrait)
│       ├── hero-reveal.jpg <- shown under the cursor/finger (colour portrait)
│       └── Anshuman-Prakhar-Resume.pdf   <- ADD YOUR RESUME HERE (not included)
├── server.js               <- contact form API + serves the site locally
├── package.json
└── .env.example
```

## 1. Run it locally

```bash
npm install
cp .env.example .env      # then fill in SMTP_PASS (see below)
npm start                 # http://localhost:3000
```

## 2. Make the contact form work

The form needs somewhere to send messages. **Until you add a key or run the backend**, pressing Send Message just opens the visitor's own email app with the Subject and message pre-filled (a `mailto:` link). A `mailto:` link can only fill To, Subject and Body. The sender is always the account signed in on that device, so the visitor's name and email cannot be placed in the "From" field, and they appear under the message instead. To receive messages with every field in its proper place, use one of these:

**Option A: no server (easiest, works on any static hosting)**
1. Create a free access key at web3forms.com using your email.
2. Paste it into `contact.web3formsKey` in the CONTENT block of `public/index.html`.
3. Messages arrive in your inbox: the visitor's name as the sender name, their email as Reply-To (hit Reply to answer them), their subject as the subject line, and their message as the body. The visitor is not redirected anywhere.

The key is visible in the page source. That is how the service is designed to be used from the browser.

**Option B: your own Node backend (`server.js`)**
1. Turn on 2-Step Verification for your Google account.
2. Google Account > Security > App passwords > create one.
3. Put the 16-character password in `.env` as `SMTP_PASS` (not your normal password).
4. Run `npm start` and open http://localhost:3000. Leave `web3formsKey` empty.

## 3. Things only you can fill in

| What | Where |
|---|---|
| Swap the hero images later (note: `index.html` also holds embedded copies, `HERO_FALLBACK`, used only when the page is opened as a local file, so on the hosted site your new files are used) | Replace `public/assets/hero-main.jpg` and `hero-reveal.jpg` (keep both the same 4:5 shape so they line up) |
| Resume PDF | Save as `public/assets/Anshuman-Prakhar-Resume.pdf` (or change `resumeUrl`) |
| Readra GitHub link | `projects[0].links` -> GitHub `url` |
| Readra live demo | `projects[0].links` -> Live Demo `url` (leave `""` until deployed) |
| WhatsApp link | `contact.whatsapp` (country code + number, digits only). It builds the WhatsApp button and is not shown as text, but it is visible in the page source |
| Portfolio links | `projects[1].links` -> Live Site, Frontend Code, Backend Code |

A link left as `""` automatically shows "(coming soon)".

## 4. Deploy

- **Simplest:** deploy the whole folder to a Node host (Render, Railway). It serves the site and the API together. Set the `.env` values as environment variables.
- **Like the reference site (page on Vercel, API elsewhere):** deploy `public/` to Vercel or Netlify, deploy `server.js` to Render or Railway, then
  1. set `contact.apiUrl` in `index.html` to your API URL, e.g. `https://your-api.onrender.com/api/contact`
  2. set `CORS_ORIGIN` on the API to your site URL.

Never commit `.env`. It is already in `.gitignore`.
