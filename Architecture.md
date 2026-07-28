# SYSTEM ARCHITECTURE
**Project:** Cleva Borderless 
**Context:** Hackathon MVP (24-hour build limit). Scope must be strictly maintained.

## 1. Tech Stack Overview
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Database/Auth:** Supabase (PostgreSQL)
- **AI:** Vercel AI SDK (`ai` package) + Google Gemini (`@google/genai`)
- **QR Codes:** `qrcode.react` (Frontend rendering) & `react-qr-reader` (Scanning)

## 2. Directory Structure (App Router)
```text
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Phone OTP input
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Bottom nav + Wrapper
│   │   ├── page.tsx                # Main Balances & Tx History
│   │   ├── spend/page.tsx          # QR Scanner / Vendor Pay
│   │   ├── save/page.tsx           # NGN->USDT Swap + AI Suggestion
│   │   └── earn/page.tsx           # PayLink generator
│   └── api/
│       ├── auth/verify/route.ts    # Supabase OTP verify + User creation
│       ├── tx/campus-pay/route.ts  # Wallet to Wallet USDT transfer
│       ├── tx/stable-save/route.ts # NGN to USDT API wrapper
│       └── ai/smart-save/route.ts  # Gemini prompt route
├── components/
│   ├── ui/                         # shadcn components (button, card, input, etc.)
│   ├── shared/                     # Navbar, BottomNav, AuthWrapper
│   └── dashboard/                  # BalanceCard, TxList, AiSuggestionModal
├── lib/
│   ├── supabase.ts                 # Supabase client init
│   ├── cleva.ts                    # Cleva API helper functions
│   └── utils.ts                    # Tailwind merge / formatting utils
└── types/
    └── index.ts                    # Shared TypeScript interfaces

## Target Audience & Personas
1. Freelancer: Receives global payments (USD/USDT), protects earnings from inflation.
2. Merchant: Accepts instant, low-fee QR payments without bank network downtime.
3. Everyday User: Swaps local currency to stablecoins seamlessly and pays for goods.
