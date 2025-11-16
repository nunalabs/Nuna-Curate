-- ============================================================================
-- NUNA CURATE - DATABASE INITIALIZATION SCRIPT
-- ============================================================================
-- Creates all tables, indexes, and constraints for the NFT marketplace
-- Optimized for high-performance queries and blockchain data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For faster text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For complex indexes

-- Set timezone
SET timezone = 'UTC';

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled', 'expired');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE transaction_type AS ENUM ('mint', 'transfer', 'sale', 'listing_created', 'listing_cancelled', 'offer_made', 'offer_accepted');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address VARCHAR(56) UNIQUE NOT NULL,  -- Stellar address (G...)
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    twitter_handle VARCHAR(50),
    discord_handle VARCHAR(50),
    website_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,  -- Platform verification
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_is_verified ON users(is_verified) WHERE is_verified = TRUE;

-- ============================================================================
-- NFT COLLECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nft_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id VARCHAR(56) UNIQUE NOT NULL,  -- Soroban contract address
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    description TEXT,
    base_uri TEXT,
    image_url TEXT,
    banner_url TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_supply INTEGER DEFAULT 0,
    floor_price BIGINT,  -- In stroops
    volume_traded BIGINT DEFAULT 0,  -- Total volume in stroops
    royalty_bps INTEGER DEFAULT 0,  -- Basis points (0-1000 = 0%-10%)
    royalty_recipient VARCHAR(56),
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for collections
CREATE INDEX idx_collections_contract_id ON nft_collections(contract_id);
CREATE INDEX idx_collections_creator ON nft_collections(creator_id);
CREATE INDEX idx_collections_verified ON nft_collections(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_collections_volume ON nft_collections(volume_traded DESC);
CREATE INDEX idx_collections_floor_price ON nft_collections(floor_price);

-- ============================================================================
-- NFTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nfts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES nft_collections(id) ON DELETE CASCADE,
    token_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    metadata_url TEXT NOT NULL,
    attributes JSONB DEFAULT '[]'::jsonb,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    owner_address VARCHAR(56) NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_address VARCHAR(56),
    minted_at TIMESTAMP WITH TIME ZONE,
    last_sale_price BIGINT,
    last_sale_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(collection_id, token_id)
);

-- Indexes for NFTs
CREATE INDEX idx_nfts_collection ON nfts(collection_id);
CREATE INDEX idx_nfts_token_id ON nfts(token_id);
CREATE INDEX idx_nfts_owner ON nfts(owner_id);
CREATE INDEX idx_nfts_owner_address ON nfts(owner_address);
CREATE INDEX idx_nfts_creator ON nfts(creator_id);
CREATE INDEX idx_nfts_minted_at ON nfts(minted_at DESC);
CREATE INDEX idx_nfts_last_sale ON nfts(last_sale_at DESC NULLS LAST);
CREATE INDEX idx_nfts_attributes ON nfts USING gin(attributes);  -- For JSON queries
CREATE INDEX idx_nfts_name_trgm ON nfts USING gin(name gin_trgm_ops);  -- For fuzzy search

-- ============================================================================
-- LISTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id BIGINT UNIQUE NOT NULL,  -- On-chain listing ID
    nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    seller_address VARCHAR(56) NOT NULL,
    price BIGINT NOT NULL,  -- In stroops
    status listing_status NOT NULL DEFAULT 'active',
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_address VARCHAR(56),
    sold_price BIGINT,
    platform_fee BIGINT,
    royalty_fee BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    sold_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for listings
CREATE INDEX idx_listings_listing_id ON listings(listing_id);
CREATE INDEX idx_listings_nft ON listings(nft_id);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status) WHERE status = 'active';
CREATE INDEX idx_listings_price ON listings(price) WHERE status = 'active';
CREATE INDEX idx_listings_created ON listings(created_at DESC);
CREATE INDEX idx_listings_active ON listings(status, price) WHERE status = 'active';

-- ============================================================================
-- OFFERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id BIGINT UNIQUE NOT NULL,  -- On-chain offer ID
    nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    buyer_address VARCHAR(56) NOT NULL,
    amount BIGINT NOT NULL,  -- In stroops
    status offer_status NOT NULL DEFAULT 'pending',
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_price BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for offers
CREATE INDEX idx_offers_offer_id ON offers(offer_id);
CREATE INDEX idx_offers_nft ON offers(nft_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_amount ON offers(amount DESC);
CREATE INDEX idx_offers_created ON offers(created_at DESC);

-- ============================================================================
-- TRANSACTIONS TABLE (Blockchain Events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(64) UNIQUE NOT NULL,
    ledger_sequence BIGINT NOT NULL,
    type transaction_type NOT NULL,
    nft_id UUID REFERENCES nfts(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES nft_collections(id) ON DELETE SET NULL,
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    from_address VARCHAR(56),
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_address VARCHAR(56),
    price BIGINT,
    platform_fee BIGINT,
    royalty_fee BIGINT,
    gas_fee BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_ledger ON transactions(ledger_sequence DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_nft ON transactions(nft_id);
CREATE INDEX idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- ============================================================================
-- FAVORITES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nft_id UUID NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, nft_id)
);

-- Indexes for favorites
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_nft ON favorites(nft_id);

-- ============================================================================
-- ACTIVITIES TABLE (User Activity Feed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nft_id UUID REFERENCES nfts(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    from_address VARCHAR(56),
    to_address VARCHAR(56),
    price BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_nft ON activities(nft_id, created_at DESC);
CREATE INDEX idx_activities_collection ON activities(collection_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- ============================================================================
-- INDEXER STATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS indexer_state (
    id SERIAL PRIMARY KEY,
    contract_type VARCHAR(50) NOT NULL,  -- 'nft', 'marketplace', etc.
    contract_id VARCHAR(56) NOT NULL,
    last_indexed_ledger BIGINT NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_syncing BOOLEAN DEFAULT FALSE,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(contract_type, contract_id)
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON nft_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfts_updated_at BEFORE UPDATE ON nfts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active listings with NFT and collection info
CREATE OR REPLACE VIEW active_listings_view AS
SELECT
    l.*,
    n.name as nft_name,
    n.image_url as nft_image,
    n.collection_id,
    c.name as collection_name,
    c.contract_id as collection_contract,
    u.username as seller_username,
    u.avatar_url as seller_avatar
FROM listings l
JOIN nfts n ON l.nft_id = n.id
JOIN nft_collections c ON n.collection_id = c.id
LEFT JOIN users u ON l.seller_id = u.id
WHERE l.status = 'active';

-- Collection statistics
CREATE OR REPLACE VIEW collection_stats_view AS
SELECT
    c.*,
    COUNT(DISTINCT n.id) as items_count,
    COUNT(DISTINCT n.owner_id) as owners_count,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_listings_count,
    MIN(l.price) FILTER (WHERE l.status = 'active') as floor_price_current,
    AVG(t.price) FILTER (WHERE t.type = 'sale' AND t.created_at > NOW() - INTERVAL '7 days') as avg_sale_price_7d
FROM nft_collections c
LEFT JOIN nfts n ON c.id = n.collection_id
LEFT JOIN listings l ON n.id = l.nft_id
LEFT JOIN transactions t ON c.id = t.collection_id
GROUP BY c.id;

-- ============================================================================
-- GRANTS (For application user)
-- ============================================================================

-- Create application user if needed (will fail if exists, that's OK)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'nuna_app') THEN
        CREATE USER nuna_app WITH PASSWORD 'nuna_app_password_dev';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE nuna_curate TO nuna_app;
GRANT USAGE ON SCHEMA public TO nuna_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nuna_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nuna_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nuna_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nuna_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO nuna_app;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert system user for contract actions
INSERT INTO users (id, address, username, is_verified)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'SYSTEM_CONTRACT', 'system', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON DATABASE nuna_curate IS 'Nuna Curate NFT Marketplace Database';
