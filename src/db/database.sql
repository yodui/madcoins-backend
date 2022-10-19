DROP TABLE trades;
DROP TABLE coins;
DROP TABLE exchanges;
DROP TABLE markets;
-- Authorization tables
DROP TABLE users;
DROP TABLE tokens;

CREATE TABLE trades (
                        tradeId SERIAL,
    -- overkill exchange info (this info is also included in markets table)
                        exId INTEGER,
                        exTicker VARCHAR(64) DEFAULT NULL,
    -- exchange trade id
                        exTradeId INTEGER,
    -- market id (market contains pair of
                        marketId INTEGER,
                        mts BIGINT,
                        amount FLOAT,
                        rate FLOAT
);
-- Primary key for trades
ALTER TABLE trades ADD CONSTRAINT pkTradeId PRIMARY KEY (tradeId);
-- Only one trade id on exchange
CREATE UNIQUE INDEX ukTradeOnExchange ON trades (exId, exTradeId);

CREATE TABLE exchanges (
                           exId SERIAL,
                           ticker VARCHAR(32) NOT NULL,
                           name VARCHAR(64) NOT NULL,
                           descr VARCHAR(512),
                           dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Primary key foe exchanges
ALTER TABLE exchanges ADD CONSTRAINT pkExchangeId PRIMARY KEY (exId);
-- Only one exchange with name
CREATE UNIQUE INDEX ukExchangeName ON exchanges (name);
-- Only one exchange with ticker
CREATE UNIQUE INDEX ukExchangeTicker ON exchanges (ticker);

-- Test data
INSERT INTO exchanges (ticker, name, descr) VALUES ('BITFINEX', 'Bitfinex', 'Bitfinex exchange');

-- Trades foreign key for exchange
ALTER TABLE trades ADD CONSTRAINT fkExchangeId FOREIGN KEY (exId) REFERENCES exchanges (exId) ON DELETE CASCADE;

CREATE TABLE coins (
                       coinId SERIAL,
                       ticker VARCHAR(32) NOT NULL,
                       name VARCHAR(64) DEFAULT NULL,
                       descr VARCHAR(512) DEFAULT NULL,
                       dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Primary key for coins
ALTER TABLE coins ADD CONSTRAINT pkCoinId PRIMARY KEY (coinId);
-- Ticker is unique
CREATE UNIQUE INDEX ukTicker ON coins (ticker);

CREATE TABLE markets (
                         marketId SERIAL,
    -- turn on / turn off market for clients
                         active SMALLINT DEFAULT 0,
    -- link to exchange
                         exId INTEGER NOT NULL,
    -- links to coins
                         baseCoinId INTEGER NOT NULL,
                         quoteCoinId INTEGER NOT NULL,
    -- some overkill fields for fast selection
                         baseTicker VARCHAR(32) NOT NULL,
                         quoteTicker VARCHAR(32) NOT NULL
);
-- Primary key for pairs
ALTER TABLE markets ADD CONSTRAINT pkMarketId PRIMARY KEY (marketId);
-- Only one trading pair on exchange
CREATE UNIQUE INDEX ukPairOnExchange ON markets (exId, baseCoinId, quoteCoinId);

-- Trades foreign key for market
ALTER TABLE trades ADD CONSTRAINT fkMarketId FOREIGN KEY (marketId) REFERENCES markets (marketId) ON DELETE CASCADE;

CREATE TABLE users (
                       userId SERIAL,
                       email VARCHAR(64) NULL,
                       password VARCHAR(128) NULL,
                       active SMALLINT DEFAULT 0,
                       registerDate TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       lastVisitDate TIMESTAMP WITH TIME ZONE DEFAULT NULL,
                       activationLink VARCHAR(128) NULL
);
-- Primary key for user
ALTER TABLE users ADD CONSTRAINT pkUserId PRIMARY KEY (userId);

CREATE TABLE tokens (
                        tokenId SERIAL,
                        userId INT,
                        refreshToken VARCHAR(512) NULL
);

-- Primary key for tokens
ALTER TABLE tokens ADD CONSTRAINT pkTokenId PRIMARY KEY (tokenId);
