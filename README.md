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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### 1. Convex Deployment (Backend)
First, deploy your backend schema and functions to the production Convex environment:

```bash
npx convex deploy
```

This will give you the `CONVEX_URL` and `CONVEX_DEPLOYMENT` variables needed for your frontend.

### 2. Next.js Deployment (Frontend)
We recommend **Vercel** for hosting.

1. Push your code to GitHub/GitLab.
2. Import the project in Vercel.
3. **Environment Variables**: Add the following in Vercel Project Settings:
   - `CONVEX_DEPLOYMENT`: (Value from step 1)
   - `NEXT_PUBLIC_CONVEX_URL`: (Value from step 1)
4. Deploy!

### 3. Verify
Visit your Vercel URL. Open the app on your phone to test mobile responsiveness.
