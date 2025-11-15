import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Build NFT mint transaction
 */
export async function buildMintTransaction(params: {
  nftContractId: string;
  to: string;
  tokenId: string;
  metadataUrl: string;
  sourceAccount: string;
  server: StellarSdk.SorobanRpc.Server;
  networkPassphrase: string;
}): Promise<string> {
  const {
    nftContractId,
    to,
    tokenId,
    metadataUrl,
    sourceAccount,
    server,
    networkPassphrase,
  } = params;

  // Load source account
  const account = await server.getAccount(sourceAccount);
  const sourceAccountObj = new StellarSdk.Account(account.accountId(), account.sequence);

  // Build contract call
  const contract = new StellarSdk.Contract(nftContractId);

  // Convert parameters to ScVal
  const toAddress = StellarSdk.Address.fromString(to);
  const tokenIdVal = StellarSdk.nativeToScVal(tokenId, { type: 'string' });
  const metadataVal = StellarSdk.nativeToScVal(metadataUrl, { type: 'string' });

  // Build transaction
  const transaction = new StellarSdk.TransactionBuilder(sourceAccountObj, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'mint',
        toAddress.toScVal(),
        tokenIdVal,
        metadataVal,
      ),
    )
    .setTimeout(30)
    .build();

  // Simulate to get the exact fee and resource requirements
  const simulated = await server.simulateTransaction(transaction);

  if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
    const prepared = StellarSdk.SorobanRpc.assembleTransaction(
      transaction,
      simulated,
    );

    return prepared.toXDR();
  } else {
    throw new Error(`Simulation failed: ${JSON.stringify(simulated)}`);
  }
}

/**
 * Build NFT transfer transaction
 */
export async function buildTransferTransaction(params: {
  nftContractId: string;
  from: string;
  to: string;
  tokenId: string;
  sourceAccount: string;
  server: StellarSdk.SorobanRpc.Server;
  networkPassphrase: string;
}): Promise<string> {
  const {
    nftContractId,
    from,
    to,
    tokenId,
    sourceAccount,
    server,
    networkPassphrase,
  } = params;

  const account = await server.getAccount(sourceAccount);
  const sourceAccountObj = new StellarSdk.Account(account.accountId(), account.sequence);

  const contract = new StellarSdk.Contract(nftContractId);

  const fromAddress = StellarSdk.Address.fromString(from);
  const toAddress = StellarSdk.Address.fromString(to);
  const tokenIdVal = StellarSdk.nativeToScVal(tokenId, { type: 'string' });

  const transaction = new StellarSdk.TransactionBuilder(sourceAccountObj, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'transfer',
        fromAddress.toScVal(),
        toAddress.toScVal(),
        tokenIdVal,
      ),
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(transaction);

  if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
    const prepared = StellarSdk.SorobanRpc.assembleTransaction(
      transaction,
      simulated,
    );

    return prepared.toXDR();
  } else {
    throw new Error(`Simulation failed: ${JSON.stringify(simulated)}`);
  }
}

/**
 * Get NFT owner from contract
 */
export async function getNFTOwner(params: {
  nftContractId: string;
  tokenId: string;
  server: StellarSdk.SorobanRpc.Server;
}): Promise<string | null> {
  const { nftContractId, tokenId, server } = params;

  try {
    const contract = new StellarSdk.Contract(nftContractId);
    const tokenIdVal = StellarSdk.nativeToScVal(tokenId, { type: 'string' });

    // Note: This is a simplified version
    // In production, you'd need to properly simulate a read-only call
    // or query contract storage directly

    return null; // Placeholder
  } catch (error) {
    console.error('Failed to get NFT owner:', error);
    return null;
  }
}

/**
 * Parse mint event from transaction
 */
export function parseMintEvent(event: any): {
  to: string;
  tokenId: string;
  metadataUrl: string;
} | null {
  try {
    // Parse the event based on your contract's event structure
    // This is a placeholder - adjust based on actual event format
    return {
      to: event.to,
      tokenId: event.tokenId,
      metadataUrl: event.metadataUrl,
    };
  } catch (error) {
    console.error('Failed to parse mint event:', error);
    return null;
  }
}
