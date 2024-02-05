DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS coins CASCADE;
DROP TABLE IF EXISTS exchanges CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
-- Authorization tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
-- Global stats of project
DROP TABLE IF EXISTS stats CASCADE;

CREATE TABLE trades (
    tradeId SERIAL,
    -- additional exchange info (this info is also included in markets table)
    exId INTEGER,
    exTicker VARCHAR(64) DEFAULT NULL,
    -- exchange trade id
    exTradeId INTEGER,
    -- market id
    marketId INTEGER,
    dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- additional info, market ticker (coin tickers also contained in markets table)
    marketTicker VARCHAR(32) DEFAULT NULL,
    -- exchange timestamp of trade
    mts BIGINT,
    -- general trade info - amount and exchange rate
    amount DOUBLE PRECISION,
    rate DOUBLE PRECISION
);
-- Primary key for trades
ALTER TABLE trades ADD CONSTRAINT pkTradeId PRIMARY KEY (tradeId);
-- Only one trade id on exchange
CREATE UNIQUE INDEX ukTradeOnExchange ON trades (exId, exTradeId);


CREATE TABLE candles (
    -- Interval id, based on timestamp
    intervalId INTEGER,
    marketId INTEGER,
    -- Highest/lowest price by interval
    high DOUBLE PRECISION,
    low DOUBLE PRECISION,
    -- Open/close price by interval
    open DOUBLE PRECISION,
    close DOUBLE PRECISION,
    -- Overall count of trades on interval
    tradeCount INTEGER DEFAULT 0,
    -- Timestamp open/close time for interval
    openTime TIMESTAMP DEFAULT NULL,
    closeTime TIMESTAMP DEFAULT NULL,
    buyAmount DOUBLE PRECISION DEFAULT 0,
    sellAmount DOUBLE PRECISION DEFAULT 0,
    -- Average price by period
    avgPrice DOUBLE PRECISION DEFAULT NULL
);


CREATE TABLE exchanges (
    exId SERIAL,
    ticker VARCHAR(32) NOT NULL,
    name VARCHAR(64) NOT NULL,
    descr VARCHAR(512),
    dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Primary key foe exchanges
ALTER TABLE exchanges ADD CONSTRAINT pkExchangeId PRIMARY KEY (exId);
-- Only one exchange per name
CREATE UNIQUE INDEX ukExchangeName ON exchanges (name);
-- Only one exchange per ticker
CREATE UNIQUE INDEX ukExchangeTicker ON exchanges (ticker);

-- Test data
INSERT INTO exchanges (exId, ticker, name, descr) VALUES (1, 'BITFINEX', 'Bitfinex', 'Bitfinex exchange'), (2, 'POLONIEX', 'Poloniex', 'Poloniex exchange');

-- Trades foreign key for exchanges
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
-- Ticker is unique field (only one coin per ticker)
CREATE UNIQUE INDEX ukTicker ON coins (ticker);

CREATE TABLE markets (
    marketId SERIAL,
    -- turn on / turn off market for clients
    enabled SMALLINT DEFAULT 1,
    -- online market status: 0 - offline, 1 - online
    isOnline SMALLINT DEFAULT 0,
    -- link to exchange
    exId INTEGER NOT NULL,
    -- links to coins
    baseCoinId INTEGER NOT NULL,
    quoteCoinId INTEGER NOT NULL,
    -- some overkill fields for fast selection
    baseTicker VARCHAR(32) NOT NULL,
    quoteTicker VARCHAR(32) NOT NULL,
    -- market price
    rate DOUBLE PRECISION DEFAULT NULL,
    -- date add
    dateAdd TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dateChange TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
-- Primary key for pairs
ALTER TABLE markets ADD CONSTRAINT pkMarketId PRIMARY KEY (marketId);
-- Only one trading pair on exchange
CREATE UNIQUE INDEX ukPairOnExchange ON markets (exId, baseCoinId, quoteCoinId);

-- Markets baseCoinId foreign key
ALTER TABLE markets ADD CONSTRAINT fkBaseCoinId FOREIGN KEY (baseCoinId) REFERENCES coins (coinId) ON DELETE SET NULL;
-- Markets quoteCoinId foreign key
ALTER TABLE markets ADD CONSTRAINT fkQuoteCoinId FOREIGN KEY (quoteCoinId) REFERENCES coins (coinId) ON DELETE SET NULL;

-- Markets market id foreign key for trades
ALTER TABLE trades ADD CONSTRAINT fkMarketId FOREIGN KEY (marketId) REFERENCES markets (marketId) ON DELETE SET NULL;


CREATE OR REPLACE FUNCTION updateMarket() RETURNS trigger AS $$
BEGIN
    UPDATE markets SET dateChange = now(), rate = NEW.rate WHERE marketId = NEW.marketId;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketChangeDateUpdateTrigger AFTER INSERT OR UPDATE ON trades
    FOR EACH ROW EXECUTE PROCEDURE updateMarket();


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

CREATE TABLE invites (
    inviteId SERIAL,
    code VARCHAR(32) NULL,
    userId INT NULL,
    activated SMALLINT DEFAULT 0,
    activatedDate TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Primary key for invites
ALTER TABLE invites ADD CONSTRAINT pkInviteId PRIMARY KEY (inviteId);

-- Only one unique invite code in table
CREATE UNIQUE INDEX ukInviteCode ON invites (code);

-- Users foreign key for Invites
ALTER TABLE invites ADD CONSTRAINT fkUserId FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE;

INSERT INTO invites (code) VALUES ('A001'), ('A002'), ('A003'), ('A004'), ('B001'), ('B002'), ('B003'), ('B004');


-- Global project stats
CREATE TABLE stats (
    statId SERIAL,
    trades INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0,
    markets INTEGER DEFAULT 0,
    -- type of stat record: 0 - global (current state), 1 - dynamical, bind to date
    type SMALLINT DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stats (trades, users, markets) VALUES (0, 0, 0);

-- Create function and trigger for trades count update
DROP FUNCTION IF EXISTS tradesCountUpdate;

CREATE FUNCTION tradesCountUpdate() RETURNS trigger AS $$
DECLARE
BEGIN
    UPDATE stats SET trades = (SELECT count(*)::integer FROM trades) WHERE type = 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tradesCountUpdateTrigger AFTER INSERT OR UPDATE ON trades
    FOR EACH ROW EXECUTE PROCEDURE tradesCountUpdate();

-- Create function and trigger for users count update
DROP FUNCTION IF EXISTS usersCountUpdate;

CREATE FUNCTION usersCountUpdate() RETURNS trigger AS $$
DECLARE
BEGIN
    UPDATE stats SET users = (SELECT count(*)::integer FROM users) WHERE type = 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usersCountUpdateTrigger AFTER INSERT OR DELETE ON users
    FOR EACH ROW EXECUTE PROCEDURE usersCountUpdate();

-- Create function and trigger for markets count update
DROP FUNCTION IF EXISTS marketsCountUpdate;

CREATE FUNCTION marketsCountUpdate() RETURNS trigger AS $$
DECLARE
BEGIN
    UPDATE stats SET markets = (SELECT count(*)::integer FROM markets) WHERE type = 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketsCountUpdateTrigger AFTER INSERT ON markets
    FOR EACH ROW EXECUTE PROCEDURE marketsCountUpdate();
