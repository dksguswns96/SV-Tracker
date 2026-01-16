# Netlify Deployment Configuration

This project is built as a full-stack application with an Express backend and a React frontend.
To deploy to Netlify, you typically need to split the app or use Netlify Functions for the backend.

## Recommended Structure for Netlify:

1.  **Frontend**: The `client` directory can be built and deployed as a static site.
    -   Build command: `npm run build`
    -   Publish directory: `dist/public`

2.  **Backend (API)**: The `server/routes.ts` can be adapted into Netlify Functions.
    -   You would need to move the route handlers into a `netlify/functions` directory.

## Environment Variables:
Ensure you set the `DATABASE_URL` in your Netlify dashboard environment variables.

## Note on Scraper:
Netlify Functions have a 10-second timeout (up to 26s on Pro). The scraper might exceed this limit if scraping multiple months/nations.
Consider using a scheduled background job or keeping the scraper on a separate server (like Replit) and connecting the Netlify frontend to the Replit API.
