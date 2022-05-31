CREATE TABLE trades (
    tradeId SERIAL,
    exId INTEGER,
    exTradeId INTEGER,
    pairId INTEGER,
    mts BIGINT,
    amount FLOAT,
    rate FLOAT
);
-- Primary key for trades
ALTER TABLE trades ADD CONSTRAINT pkTradeId PRIMARY KEY (tradeId);
-- Only one trade id on exchange
CREATE UNIQUE INDEX ukTradeOnExchange ON trades (exId, exTradeId);
-- Only one trading pair on exchange
CREATE UNIQUE INDEX ukPairOnExchange ON trades (exId, pairId);

CREATE TABLE exchanges (
    exId SERIAL,
    name VARCHAR(64) NOT NULL,
    descr VARCHAR(512),
    dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Primary key foe exchanges
ALTER TABLE exchanges ADD CONSTRAINT pkExchangeId PRIMARY KEY (exId);
-- Only one exchange with name
CREATE UNIQUE INDEX ukExchangeName ON exchanges (name);

CREATE TABLE coins (
    coinId SERIAL,
    ticker VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    descr VARCHAR(512)
);

-- Primary key for coins
ALTER TABLE coins ADD CONSTRAINT pkCoinId PRIMARY KEY (coinId);

CREATE TABLE tradingPairs (
    pairId SERIAL,
    -- turn on / turn off pair for clients
    active SMALLINT DEFAULT 0,
    firstCoinId INTEGER NOT NULL,
    secondCoinId INTEGER NOT NULL,
    -- some overkill fields for fast selection:
    firstTicker VARCHAR(32) NOT NULL,
    secondTicker VARCHAR(32) NOT NULL
);
-- Primary key for pairs
ALTER TABLE tradingPairs ADD CONSTRAINT pkTradingPairId PRIMARY KEY (pairId);

-- Foreign key for exchange
ALTER TABLE trades ADD CONSTRAINT fkExchangeId FOREIGN KEY (exId) REFERENCES exchanges (exId) ON DELETE CASCADE;
-- Foreign key for pair
ALTER TABLE trades ADD CONSTRAINT fkTradingPairId FOREIGN KEY (pairId) REFERENCES tradingPairs (pairId) ON DELETE CASCADE;

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
