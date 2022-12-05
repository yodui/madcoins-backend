DROP TABLE IF EXISTS trades;
DROP TABLE IF EXISTS coins;
DROP TABLE IF EXISTS exchanges;
DROP TABLE IF EXISTS markets;
-- Authorization tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS invites;
-- Global stats of project
DROP TABLE IF EXISTS stats;

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

-- Create function and trigger for trades insert notification
DROP FUNCTION IF EXISTS tradesInsertTrigger;

CREATE or REPLACE FUNCTION tradesInsertNotify() RETURNS trigger AS $$
DECLARE
BEGIN
    PERFORM pg_notify('insertTradeNotification', row_to_json(NEW)::text );
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tradesInsertTrigger AFTER INSERT ON trades
    FOR EACH ROW EXECUTE PROCEDURE tradesInsertNotify();


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

CREATE TABLE invites (
    inviteId SERIAL,
    code VARCHAR(32) NULL,
    userId INT NULL,
    activated SMALLINT DEFAULT 0,
    activatedDate TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Primary key for invites
ALTER TABLE invites ADD CONSTRAINT pkInviteId PRIMARY KEY (inviteId);

-- Invites foreign key for userId
ALTER TABLE invites ADD CONSTRAINT fkUserId FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE;


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

-- Create function and trigger for trades count update notification
DROP FUNCTION IF EXISTS globalTradesCountNotify;

CREATE or REPLACE FUNCTION globalTradesCountNotify() RETURNS trigger AS $$
DECLARE
BEGIN
    PERFORM pg_notify('updateTradesGlobalCountNotification', row_to_json(NEW)::text );
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tradesGlobalCountTrigger AFTER UPDATE ON stats
    FOR EACH ROW
    WHEN (OLD.type = 0 AND OLD.trades IS DISTINCT FROM NEW.trades)
    EXECUTE PROCEDURE globalTradesCountNotify();


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
