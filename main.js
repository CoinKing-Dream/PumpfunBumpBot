import { Connection, KeyPair, PublicKey } from "@solana/web3.js";
import { SolanaTracker } from "solana-swap";
import { performSwap } from "./temp.js";
import base58 from "bs58";

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

