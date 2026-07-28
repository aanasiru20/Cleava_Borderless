# 🌐 Cleva Borderless
**Save in $, Spend Borderless, Get Paid Globally.**

*Built for the **Cleva x Tether: Future of Payments Hackathon (ABU Zaria Edition)***

Cleva Borderless is a unified multi-persona wallet designed to eliminate financial borders for users in emerging markets. It bridges local currencies with USD stablecoins (USDT) seamlessly, targeting three distinct user types in a single mobile-first interface.

---

## 💡 The Problem
Financial friction affects key participants in emerging markets:
1. **Freelancers:** Face exorbitant payment gateway fees (often up to 20%) and delay periods when collecting funds globally.
2. **Merchants:** Suffer transaction failures, bank network downtime, and currency devaluation on daily retail earnings.
3. **Everyday Users:** Experience rapid erosion of local savings due to high inflation, alongside high transfer fees for local payments.

## 🚀 The Solution: Cleva Borderless
A unified stablecoin solution built for mobile viewports using a flexible persona switcher:
- 💸 **CampusPay / Merchant Pay (Spend):** High-speed, zero-fee QR transactions in USDT for everyday purchases.
- 🛡️ **StableSave (Save):** 1-click NGN to USDT swaps with built-in inflation trackers and AI-powered recommendations.
- 🔗 **PayLinks (Earn):** Instant global invoice creation (e.g., `cleva-borderless.io/pay/user101/50`) to collect USDT with simple share links.

---

## 🛠 Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Custom color schemes including Cleva Green `#00D26A` & Tether Teal `#009393`)
- **Icons:** Lucide React
- **Configuration:** PostCSS, TypeScript 5, Tailwind compilation

---

## ⚙️ Interactive MVP Walkthrough
The prototype runs in a fully constrained native mobile device frame (`max-w-md h-[850px]`) and implements stateful simulations for:
- **Persona Switcher:** Seamlessly toggle between **Freelancer**, **Merchant**, and **User** dashboards.
- **Dynamic Balance & Feed:** View persona-tailored balances and recent history (e.g., Upwork payouts, local POS sales, student groceries).
- **Simulated QR Scanner:** Experience a live camera viewfinder animation that simulates scanning, executes a 1.5s transaction verification, shows success feedback, and dynamically deducts the USDT/NGN balance.
- **StableSave Swaps:** Approve AI-suggested auto-saves to convert local Naira to stablecoins instantly with a simulated loading spin and confirmation toast.
- **PayLink Generation:** Modify billing amounts and descriptions in real-time with an active preview and one-click copy feedback.

---

## ⚙️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cleva-borderless.git
   cd cleva-borderless
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.