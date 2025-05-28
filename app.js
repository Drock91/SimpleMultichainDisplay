const express = require('express');
const xrpl = require('xrpl');
const ethers = require('ethers');
const app = express();
require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static('public'));

const { getAddress } = ethers;
const hexToUtf8 = (hex) => {
    try {
        return Buffer.from(hex, 'hex').toString('utf8');
    } catch {
        return '';
    }
};

// Define EVM networks to check
const evmNetworks = [
    {
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        rpc: 'https://eth.llamarpc.com'
    },
    {
        name: 'Polygon',
        symbol: 'MATIC',
        rpc: 'https://polygon-rpc.com'
    },
    {
        name: 'Arbitrum One',
        symbol: 'ETH',
        rpc: 'https://arb1.arbitrum.io/rpc'
    },
    {
        name: 'Optimism',
        symbol: 'ETH',
        rpc: 'https://mainnet.optimism.io'
    },
    {
        name: 'Avalanche C-Chain',
        symbol: 'AVAX',
        rpc: 'https://api.avax.network/ext/bc/C/rpc'
    },
    {
        name: 'Moonbeam',
        symbol: 'GLMR',
        rpc: 'https://rpc.api.moonbeam.network'
    },
    {
        name: 'Fantom Opera',
        symbol: 'FTM',
        rpc: 'https://rpcapi.fantom.network'
    }
];

// ✅ Axelar tokens including AXL and wrapped assets
const axelarTokens = [
    {
        name: 'Axelar ERC-20',
        symbol: 'AXL',
        decimals: 6,
        address: getAddress('0x467719aD09025FcC6cF6F8311755809d45a5E5f3'),
        network: 'Ethereum Mainnet',
        rpc: 'https://eth.llamarpc.com'
    },

    {
        name: 'Axelar Polygon',
        symbol: 'AXL',
        decimals: 6,
        address: getAddress('0x6e4E624106Cb12E168E6533F8ec7c82263358940'),
        network: 'Polygon',
        rpc: 'https://polygon-rpc.com'
    },

    {
        name: 'Axelar Wrapped TIA',
        symbol: 'AXLTIA',
        decimals: 6,
        address: getAddress('0x65e3fA51C4ce0af1B9CD5CBC7C5fDb80a09D431D'),
        network: 'Ethereum Mainnet',
        rpc: 'https://eth.llamarpc.com'
    },
    {
        name: 'axlUSDC',
        symbol: 'axlUSDC',
        decimals: 6,
        address: getAddress('0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed'),
        network: 'Polygon',
        rpc: 'https://polygon-rpc.com'
    }
];

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];
app.get('/', async (req, res) => {
    const xrpAddress = req.query.xrp || '';
    const evmAddress = req.query.evm || '';
    let xrpBalance = '';
    let evmBalance = '';
    let xrpTokens = [];
    let xrpNfts = [];
    let evmBalances = [];
    let axelarBalances = [];

    try {
        if (xrpAddress.trim() !== '' && xrpAddress.startsWith('r')) {
            console.log(`[XRP] Looking up balances for ${xrpAddress}`);
            const client = new xrpl.Client("wss://s1.ripple.com");
            await client.connect();

            xrpBalance = await client.getXrpBalance(xrpAddress);
            console.log(`[XRP] Balance: ${xrpBalance} XRP`);

            const trustlines = await client.request({
                command: "account_lines",
                account: xrpAddress
            });
            xrpTokens = trustlines.result.lines.map(line => ({
                currency: line.currency,
                balance: line.balance,
                issuer: line.account
            }));
            console.log(`[XRP] Trustline tokens: ${xrpTokens.length}`);

            const nftsResponse = await client.request({
                command: "account_nfts",
                account: xrpAddress
            });
            xrpNfts = nftsResponse.result.account_nfts.map(nft => ({
                id: nft.NFTokenID,
                uri: hexToUtf8(nft.URI || '')
            }));
            console.log(`[XRP] NFTs found: ${xrpNfts.length}`);

            await client.disconnect();
        }

        if (evmAddress.trim() !== '' && evmAddress.startsWith('0x')) {
            console.log(`[EVM] Looking up balances for ${evmAddress}`);

            // Native tokens
            for (const net of evmNetworks) {
                try {
                    const provider = new ethers.JsonRpcProvider(net.rpc);
                    const balance = await provider.getBalance(evmAddress);
                    const formatted = ethers.formatEther(balance);
                    evmBalances.push({
                        network: net.name,
                        symbol: net.symbol,
                        balance: formatted
                    });
                    console.log(`[EVM] ${net.name} (${net.symbol}): ${formatted}`);
                } catch (err) {
                    console.warn(`[EVM] Failed on ${net.name}: ${err.message}`);
                }
            }

            // Axelar-wrapped tokens
            for (const token of axelarTokens) {
                try {
                    const provider = new ethers.JsonRpcProvider(token.rpc);
                    const code = await provider.getCode(token.address);
                    if (code === '0x') {
                        console.warn(`[Axelar] ${token.symbol} on ${token.network} is not a contract`);
                        continue;
                    }

                    const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
                    const raw = await contract.balanceOf(evmAddress);
                    const formatted = Number(raw) / 10 ** token.decimals;

                    //if (formatted > 0) {
                        axelarBalances.push({
                            network: `${token.network} (Axelar)`,
                            symbol: token.symbol,
                            balance: formatted.toString()
                        });
                        console.log(`[Axelar] ${token.symbol} on ${token.network}: ${formatted}`);
                    //}
                } catch (err) {
                    console.warn(`[Axelar] Failed to fetch ${token.symbol} on ${token.network}: ${err.message}`);
                }
            }

            const polygon = evmBalances.find(e => e.network.includes('Polygon') && e.symbol === 'MATIC');
            evmBalance = polygon ? polygon.balance : '';
        }

    } catch (err) {
        console.error('Error fetching balances:', err.message);
    }

    res.render('index', {
    xrpAddress,
    evmAddress,
    xrpBalance,
    evmBalance,
    xrpTokens,
    xrpNfts,
    evmBalances,
    axelarBalances,
    hexToUtf8 // ✅ Now available in EJS
});
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));