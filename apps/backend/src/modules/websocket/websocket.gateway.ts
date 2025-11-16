/**
 * WebSocket Gateway
 *
 * Real-time updates for NFT mints, transfers, sales, etc.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

interface SocketWithAuth extends Socket {
  userId?: string;
  publicKey?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class WebSocketEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketEventsGateway.name);
  private activeConnections = new Map<string, SocketWithAuth>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: SocketWithAuth, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.activeConnections.set(client.id, client);

    // Send initial connection success
    client.emit('connected', {
      message: 'Connected to Nuna Curate real-time events',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: SocketWithAuth) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeConnections.delete(client.id);
  }

  /**
   * Subscribe to NFT events
   */
  @SubscribeMessage('subscribe:nft')
  handleSubscribeNFT(
    @MessageBody() data: { tokenId?: number; collectionId?: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = data.tokenId
      ? `nft:${data.tokenId}`
      : data.collectionId
      ? `collection:${data.collectionId}`
      : 'nft:all';

    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return { success: true, room };
  }

  /**
   * Unsubscribe from NFT events
   */
  @SubscribeMessage('unsubscribe:nft')
  handleUnsubscribeNFT(
    @MessageBody() data: { tokenId?: number; collectionId?: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = data.tokenId
      ? `nft:${data.tokenId}`
      : data.collectionId
      ? `collection:${data.collectionId}`
      : 'nft:all';

    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);

    return { success: true, room };
  }

  /**
   * Subscribe to marketplace events
   */
  @SubscribeMessage('subscribe:marketplace')
  handleSubscribeMarketplace(
    @MessageBody() data: { listingId?: number; userId?: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = data.listingId
      ? `listing:${data.listingId}`
      : data.userId
      ? `user:${data.userId}:marketplace`
      : 'marketplace:all';

    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return { success: true, room };
  }

  /**
   * Subscribe to user-specific events
   */
  @SubscribeMessage('subscribe:user')
  handleSubscribeUser(
    @MessageBody() data: { publicKey: string },
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const room = `user:${data.publicKey}`;
    client.publicKey = data.publicKey;
    client.join(room);

    this.logger.log(`Client ${client.id} subscribed to user events: ${data.publicKey}`);

    return { success: true, room };
  }

  /**
   * Get active connections count
   */
  @SubscribeMessage('stats')
  handleGetStats(@ConnectedSocket() client: Socket) {
    return {
      activeConnections: this.activeConnections.size,
      rooms: Array.from(client.rooms),
    };
  }

  // ========== EVENT LISTENERS FROM INDEXER ==========

  /**
   * NFT Minted event
   */
  @OnEvent('nft.minted')
  handleNFTMinted(payload: any) {
    this.logger.debug('Broadcasting NFT minted event');

    // Broadcast to all NFT subscribers
    this.server.to('nft:all').emit('nft:minted', payload);

    // Broadcast to collection subscribers
    if (payload.collectionId) {
      this.server.to(`collection:${payload.collectionId}`).emit('nft:minted', payload);
    }

    // Broadcast to owner
    if (payload.owner) {
      this.server.to(`user:${payload.owner}`).emit('nft:minted', payload);
    }
  }

  /**
   * NFT Transferred event
   */
  @OnEvent('nft.transferred')
  handleNFTTransferred(payload: any) {
    this.logger.debug('Broadcasting NFT transferred event');

    this.server.to('nft:all').emit('nft:transferred', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('nft:transferred', payload);

    // Notify both parties
    if (payload.from) {
      this.server.to(`user:${payload.from}`).emit('nft:transferred', payload);
    }
    if (payload.to) {
      this.server.to(`user:${payload.to}`).emit('nft:transferred', payload);
    }
  }

  /**
   * NFT Burned event
   */
  @OnEvent('nft.burned')
  handleNFTBurned(payload: any) {
    this.logger.debug('Broadcasting NFT burned event');

    this.server.to('nft:all').emit('nft:burned', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('nft:burned', payload);

    if (payload.owner) {
      this.server.to(`user:${payload.owner}`).emit('nft:burned', payload);
    }
  }

  /**
   * Listing Created event
   */
  @OnEvent('marketplace.listing.created')
  handleListingCreated(payload: any) {
    this.logger.debug('Broadcasting listing created event');

    this.server.to('marketplace:all').emit('listing:created', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('listing:created', payload);

    if (payload.seller) {
      this.server.to(`user:${payload.seller}:marketplace`).emit('listing:created', payload);
    }
  }

  /**
   * Listing Cancelled event
   */
  @OnEvent('marketplace.listing.cancelled')
  handleListingCancelled(payload: any) {
    this.logger.debug('Broadcasting listing cancelled event');

    this.server.to('marketplace:all').emit('listing:cancelled', payload);
    this.server.to(`listing:${payload.listingId}`).emit('listing:cancelled', payload);
  }

  /**
   * Sale Completed event
   */
  @OnEvent('marketplace.sale.completed')
  handleSaleCompleted(payload: any) {
    this.logger.debug('Broadcasting sale completed event');

    this.server.to('marketplace:all').emit('sale:completed', payload);
    this.server.to(`listing:${payload.listingId}`).emit('sale:completed', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('sale:completed', payload);

    // Notify both parties
    if (payload.seller) {
      this.server.to(`user:${payload.seller}:marketplace`).emit('sale:completed', {
        ...payload,
        role: 'seller',
      });
    }
    if (payload.buyer) {
      this.server.to(`user:${payload.buyer}:marketplace`).emit('sale:completed', {
        ...payload,
        role: 'buyer',
      });
    }
  }

  /**
   * Offer Made event
   */
  @OnEvent('marketplace.offer.made')
  handleOfferMade(payload: any) {
    this.logger.debug('Broadcasting offer made event');

    this.server.to('marketplace:all').emit('offer:made', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('offer:made', payload);

    if (payload.buyer) {
      this.server.to(`user:${payload.buyer}:marketplace`).emit('offer:made', payload);
    }
  }

  /**
   * Offer Accepted event
   */
  @OnEvent('marketplace.offer.accepted')
  handleOfferAccepted(payload: any) {
    this.logger.debug('Broadcasting offer accepted event');

    this.server.to('marketplace:all').emit('offer:accepted', payload);

    // Notify both parties
    if (payload.seller) {
      this.server.to(`user:${payload.seller}:marketplace`).emit('offer:accepted', {
        ...payload,
        role: 'seller',
      });
    }
    if (payload.buyer) {
      this.server.to(`user:${payload.buyer}:marketplace`).emit('offer:accepted', {
        ...payload,
        role: 'buyer',
      });
    }
  }

  /**
   * Price Update event (for real-time price changes)
   */
  @OnEvent('marketplace.price.updated')
  handlePriceUpdated(payload: any) {
    this.logger.debug('Broadcasting price update event');

    this.server.to('marketplace:all').emit('price:updated', payload);
    this.server.to(`nft:${payload.tokenId}`).emit('price:updated', payload);
  }

  /**
   * Floor Price Update event
   */
  @OnEvent('collection.floor.updated')
  handleFloorPriceUpdated(payload: any) {
    this.logger.debug('Broadcasting floor price update');

    this.server.to('marketplace:all').emit('floor:updated', payload);
    this.server.to(`collection:${payload.collectionId}`).emit('floor:updated', payload);
  }

  /**
   * Broadcast custom message to all clients
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  /**
   * Get active connections
   */
  getActiveConnections(): number {
    return this.activeConnections.size;
  }
}
