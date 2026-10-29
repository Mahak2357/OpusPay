# OpusPay frontend

React and Vite client for the OpusPay wallet. The UI displays wallet balances, real transaction history and analytics returned by the API; it does not seed account balances or fabricate payment activity.

## Run locally

```powershell
npm install
npm run dev
```

The API defaults to `http://localhost:5000/api`. Set `VITE_API_URL` when the backend is hosted elsewhere.

## Backend requirements

Set these backend environment variables before starting the API:

- `MONGO_URI` — a MongoDB **replica set** connection string. OpusPay transfers use MongoDB transactions and are deliberately unavailable on standalone deployments.
- `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` — long, distinct random secrets.
- `CLIENT_ORIGIN` — allowed frontend origin; defaults to the Vite local origin.
- `MAX_TRANSFER_AMOUNT` — optional positive per-transfer limit.

Run client checks with:

```powershell
npm run lint
npm run build
```
