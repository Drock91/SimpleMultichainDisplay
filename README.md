# 🌐 Simple Multichain Wallet Viewer

A minimalist Node.js + EJS web app that lets users enter an **XRP** or **EVM-compatible** address to view:

- ✅ Native token balances across Ethereum, Polygon, Arbitrum, Optimism, Avalanche, Moonbeam, and Fantom
- ✅ Axelar-wrapped token balances (AXL, axlUSDC, axlTIA)
- ✅ XRP trustline tokens
- ✅ XRP NFTs (XLS-20 standard)

Built for coders, blockchain dabblers, and multichain explorers.

---

## 🚀 How It Works

1. Users enter an XRP and/or EVM address.
2. The app queries balances across multiple chains via:
   - `ethers.js` for EVM networks
   - `xrpl.js` for XRP Ledger (trustlines + NFTs)
3. Everything is rendered dynamically with EJS templates.

---

## 💻 Installation

```bash
git clone git@github.com:Drock91/SimpleMultichainDisplay.git
cd SimpleMultichainDisplay
npm install
```
▶️ Running the App

bash
node app.js
Then open:
http://localhost:3000


🌐 Networks Queried
EVM Native Networks:

Ethereum Mainnet

Polygon

Arbitrum One

Optimism

Avalanche C-Chain

Moonbeam

Fantom Opera

Axelar Tokens Queried:

AXL (Ethereum, Polygon)

axlUSDC (Polygon)

axlTIA (Ethereum)

XRP Ledger:

XRP balance

Trustline tokens

XLS-20 NFTs
