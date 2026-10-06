# readly-admin

Admin app for **Readly**: upload EPUB books and their covers, set ratings and features, and manage
categories. Built with Next.js 16 (App Router) and Tailwind CSS 4, styled with the Readly palette.

It talks to [`readly-api`](https://github.com/ai-code-101/readly-api) through a same-origin route handler
(`src/app/api/v1/[...path]/route.ts`) that attaches the admin token on the server, so the token is never
exposed to the browser.

## Features

- **Upload a book**: drop an EPUB and the title, author, synopsis, language, page count and cover are read
  from it. You can override any field, upload your own cover, then **Publish** or **Save as draft**.
- **Book details**: category, genre tag (the small label on cards), **rating (0–5)**, page count, language,
  synopsis, and features: *Free book*, *Trending*, *Staff pick*, *Book of the day*.
- **Edit**: replace the EPUB or cover, publish or unpublish, download the EPUB, delete the book.
- **Books list**: search, filter by status and category, sort, paginate.
- **Categories**: create, edit, reorder, delete, upload an image.
- **Dashboard**: totals for books, free books, categories, opens and storage used.

## Getting started

```bash
cp .env.example .env.local   # point at the API and set the same admin token
npm install
npm run dev                  # http://localhost:3001
```

You need `readly-api` running (default `http://localhost:8080`) with `ADMIN_TOKEN` matching
`READLY_ADMIN_TOKEN`.

| Variable                 | Default                 | Notes |
|--------------------------|-------------------------|-------|
| `READLY_API_URL`         | `http://localhost:8080` | Server-side only |
| `READLY_ADMIN_TOKEN`     | —                       | Must equal the API's `ADMIN_TOKEN`; server-side only |
| `NEXT_PUBLIC_READER_URL` | `http://localhost:3000` | For "View on reader site" links |

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm run typecheck`

## Not yet implemented

Admin accounts and login. Until then the app is meant to run only on a trusted network, because anyone
who can reach it can manage the library.
