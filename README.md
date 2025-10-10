This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Social workspace

- Visit `/social` to access the community feed with post creation, likes, comments, and follow actions.
- Posts live under the Firestore collection `social_posts`, with per-post `comments` and `likes` subcollections, and follow relationships under `social_follows`.
- Topic channels and project groups live under `social_channels` with membership in `social_channel_members`, letting teams organise conversations before posting.
- Server routes expose REST endpoints under `/api/social/**` for creating posts, toggling likes, managing comments, maintaining follow relationships, and administering channels/groups.
- Make sure your Firebase client and admin env variables are configured; both are required so the API routes can mint custom tokens and talk to Firestore securely.
- The feed UI resides in `components/social/**` and provides a clear starting point for extending attachments, surfacing AI highlights, or adding custom moderation hooks.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
