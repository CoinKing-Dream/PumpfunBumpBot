import { Connection, KeyPair, PublicKey } from "@solana/web3.js";
import { SolanaTracker } from "solana-swap";
import { performSwap } from "./temp.js";
import base58 from "bs58";
require('dotenv').config();

const TOKEN_ADDRESS = "";
const SOL_ADDRESS = "So11111111111111111111111111111111111111112";
const SOL_BUY_AMOUNT = 0.001;
const FEES = 0.0005;
const SLIPPAGE = 20;

async function swap(fromToken, toToken, solanaTracker, _keyPair, connection, amount) {
    try {
        const swapResponse = await solanaTracker.getSwapInstructions(
            fromToken,
            toToken,
            amount,
            SLIPPAGE,
            _keyPair.PublicKey.toBase58(),
            FEES,
            false
        );

        console.log("Send swap transaction...");

        const tx = await performSwap(swapResponse, _keyPair, connection, amount, tokenIn, {
            sendOptions: {skipPreflight: true},
            confirmationRetries: 30,
            confirmationRetryTimeout: 1000,
            lastValidBlockHeightBuffer: 150,
            resendInterval: 1000,
            confirmationCheckInterval: 1000,
            skipConfirmationCheck: true
        });

        console.log("Swap sent: " + tx);
        
    } catch (error) {
        console.error("Error when trying to swap");
    }
}

async function getTokenBalance(connection, walletAddress, tokenAddress) {
    var result = 350000;
    
    try {
        result = await connection.getTokenAccountByOwner(
            walletAddress, {
                mint: new PublicKey(tokenAddress)
            }
        );

        const info = await connection.getTokenAccountBalance(result.value[0].pubkey);

        if (info.value.uiAmount == null) throw new Error("No balance fount");
        return info.value.uiAmount;
    } catch (error) {
        return result;
    }
}

async function main() {
    const _keyPair = KeyPair.fromSecretKey(base58.decode(process.env.PRIVATE_KEY));
    const solanaTracker = new SolanaTracker(_keyPair);
    const connection = new Connection(env.RPC_URL);

    while (true) {
        const promises = [];

        // Buy Token
        promises.push(swap(SOL_ADDRESS, TOKEN_ADDRESS, solanaTracker, _keyPair, connection, SOL_BUY_AMOUNT));
        promises.push(swap(SOL_ADDRESS, TOKEN_ADDRESS, solanaTracker, _keyPair, connection, SOL_BUY_AMOUNT));
        promises.push(swap(SOL_ADDRESS, TOKEN_ADDRESS, solanaTracker, _keyPair, connection, SOL_BUY_AMOUNT));

        await Promise.all(promises);

        // Sell 
        const tokenBalance = Math.round(await getTokenBalance(connection, _keyPair.publicKey, TOKEN_ADDRESS));
        await swap(TOKEN_ADDRESS, SOL_ADDRESS, solanaTracker, _keyPair, connection, tokenBalance);

        //Pause
        await new Promise(r => setTimeout(r, 2000));
    }
}

// Start Scripts
main();
