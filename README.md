# Investment Diary (Bondbazaar Logbook)

Responsive web app (mobile-friendly) to manually track:
- Wallet funds (manual)
- Buy trades with **T+1** settlement
- Maturity events that **reduce Portfolio value only**

Data is saved locally in your browser (localStorage). Use Settings → Export to back up.

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

