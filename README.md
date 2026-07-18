# MediMind Backend (OpenCode)

AI-powered healthcare and medicine assistant platform — backend API.

## Built With

| Tool | Purpose |
|------|---------|
| **Express** | HTTP server & routing |
| **TypeScript** | Type-safe runtime |
| **Nodemon + ts-node** | Dev hot-reload |
| **Helmet** | Security headers |
| **Cors** | Cross-origin requests |
| **Morgan** | Request logging |
| **MongoDB Driver** | Native database access (no Mongoose) |

## Folder Structure

```
medimind-backend/
├── src/
│   ├── config/        Environment variables & DB config
│   ├── db/            Collection handles & DB helpers
│   ├── routes/        Route definitions (entry points)
│   ├── controllers/   Request handlers & status coordination
│   ├── services/      Business logic & third-party integrations
│   ├── middleware/     Auth guards, rate limiting, error handler
│   ├── types/         Shared TypeScript interfaces
│   └── utils/         Helpers & uniform API response formatters
├── dist/              Compiled output (gitignored)
├── .env               Environment variables
├── package.json
├── tsconfig.json
└── vercel.json
```

## Quickstart

```bash
# Install dependencies
npm install

# Start development server (with hot-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The server starts at `http://localhost:5000`. Verify with:

```bash
curl http://localhost:5000/api/v1/health
```
