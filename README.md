# Investment Diary (Bondbazaar Logbook)

Responsive web app (mobile-friendly) to manually track:
- Wallet funds (manual)
- Buy trades with **T+1** settlement
- Maturity events that **reduce Portfolio value only**

Data is saved locally in your browser (localStorage). You can also connect it to a free Supabase database.

## Supabase setup
1. Create a free Supabase project.
2. Open the SQL editor and run `supabase-schema.sql`.
3. Copy `.env.example` to `.env`.
4. Fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Restart the dev server.

The app will then:
- load the latest diary from the database on startup
- auto-save changes to the database
- keep a local browser copy as backup

Use Settings → Export for an offline backup too.

## Run locally
```bash
npm install
npm run dev
```

Open the URL printed in the terminal.

## MVP calculation rules
- **Funds (date D):** Wallet += amount  
- **Trade placed (T):** Wallet −= amount, Reserved += amount  
- **Settlement (T+1):** Reserved −= amount, Portfolio += amount  
- **Maturity (date M):** Portfolio −= matured amount (Wallet unchanged)

## Notes
- INR only
- No sell trades (yet)
- No fees field (per your request)
- Current free-database mode uses one shared public diary record in Supabase
