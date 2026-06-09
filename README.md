# Investment Diary (Bondbazaar Logbook)

Responsive web app (mobile-friendly) to manually track:
- Wallet funds (manual)
- Buy trades with **T+1** settlement
- Maturity events that **reduce Portfolio value only**

Data is saved locally in your browser (localStorage). You can also sync the diary JSON to GitHub from Settings by entering:
- repo owner
- repo name
- branch
- file path such as `data/investment-diary.json`
- a fine-grained GitHub token with `Contents: Read and write`

Use Settings → Export for an offline backup.

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
- GitHub sync keeps a local browser copy too; GitHub acts as the shared JSON backup/source
