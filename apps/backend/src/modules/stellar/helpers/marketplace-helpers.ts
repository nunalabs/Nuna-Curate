import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Build marketplace listing creation transaction
 */
export async function buildCreateListingTransaction(params: {
  marketplaceContractId: string;
  nftContractId: string;
  tokenId: string;
  seller: string;
  price: string; // in stroops
  expiresAt?: number;
  sourceAccount: string;
  server: StellarSdk.SorobanRpc.Server;
  networkPassphrase: string;
}): Promise<string> {
  const {
    marketplaceContractId,
    nftContractId,
    tokenId,
    seller,
    price,
    expiresAt,
    sourceAccount,
    server,
    networkPassphrase,
  } = params;

  const account = await server.getAccount(sourceAccount);
  const sourceAccountObj = new StellarSdk.Account(account.accountId(), account.sequence);

  const contract = new StellarSdk.Contract(marketplaceContractId);

  // Convert parameters to ScVal
  const nftContractAddress = StellarSdk.Address.fromString(nftContractId);
  const sellerAddress = StellarSdk.Address.fromString(seller);
  const tokenIdVal = StellarSdk.nativeToScVal(tokenId, { type: 'string' });
  const priceVal = StellarSdk.nativeToScVal(BigInt(price), { type: 'i128' });

  const args = [
    nftContractAddress.toScVal(),
    tokenIdVal,
    sellerAddress.toScVal(),
    priceVal,
  ];

  if (expiresAt) {
    args.push(
      StellarSdk.nativeToScVal(expiresAt, { type: 'u64' })
    );
  }

  const transaction = new StellarSdk.TransactionBuilder(sourceAccountObj, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call('create_listing', ...args))
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
 * Build marketplace buy transaction
 */
export async function buildBuyTransaction(params: {
  marketplaceContractId: string;
  listingId: string;
  buyer: string;
  sourceAccount: string;
  server: StellarSdk.SorobanRpc.Server;
  networkPassphrase: string;
}): Promise<string> {
  const {
    marketplaceContractId,
    listingId,
    buyer,
    sourceAccount,
    server,
    networkPassphrase,
  } = params;

  const account = await server.getAccount(sourceAccount);
  const sourceAccountObj = new StellarSdk.Account(account.accountId(), account.sequence);

  const contract = new StellarSdk.Contract(marketplaceContractId);

  const buyerAddress = StellarSdk.Address.fromString(buyer);
  const listingIdVal = StellarSdk.nativeToScVal(listingId, { type: 'u64' });

  const transaction = new StellarSdk.TransactionBuilder(sourceAccountObj, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'buy',
        listingIdVal,
        buyerAddress.toScVal(),
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
 * Build cancel listing transaction
 */
export async function buildCancelListingTransaction(params: {
  marketplaceContractId: string;
  listingId: string;
  seller: string;
  sourceAccount: string;
  server: StellarSdk.SorobanRpc.Server;
  networkPassphrase: string;
}): Promise<string> {
  const {
    marketplaceContractId,
    listingId,
    seller,
    sourceAccount,
    server,
    networkPassphrase,
  } = params;

  const account = await server.getAccount(sourceAccount);
  const sourceAccountObj = new StellarSdk.Account(account.accountId(), account.sequence);

  const contract = new StellarSdk.Contract(marketplaceContractId);

  const sellerAddress = StellarSdk.Address.fromString(seller);
  const listingIdVal = StellarSdk.nativeToScVal(listingId, { type: 'u64' });

  const transaction = new StellarSdk.TransactionBuilder(sourceAccountObj, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'cancel_listing',
        listingIdVal,
        sellerAddress.toScVal(),
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
 * Parse listing created event
 */
export function parseListingCreatedEvent(event: any): {
  listingId: string;
  seller: string;
  nftContract: string;
  tokenId: string;
  price: string;
} | null {
  try {
    // Parse based on your contract's event structure
    // Placeholder implementation
    return {
      listingId: event.listingId,
      seller: event.seller,
      nftContract: event.nftContract,
      tokenId: event.tokenId,
      price: event.price,
    };
  } catch (error) {
    console.error('Failed to parse listing created event:', error);
    return null;
  }
}

/**
 * Parse sale completed event
 */
export function parseSaleCompletedEvent(event: any): {
  listingId: string;
  seller: string;
  buyer: string;
  price: string;
  tokenId: string;
} | null {
  try {
    // Parse based on your contract's event structure
    // Placeholder implementation
    return {
      listingId: event.listingId,
      seller: event.seller,
      buyer: event.buyer,
      price: event.price,
      tokenId: event.tokenId,
    };
  } catch (error) {
    console.error('Failed to parse sale completed event:', error);
    return null;
  }
}
