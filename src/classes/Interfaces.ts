interface ITradingPair extends Array<string|undefined> {
    0: ECoin|undefined, // base coin ticker
    1: ECoin|undefined, // quote coin ticker
}

// all markets from exchanges
// if pair coins is exits on
interface IMarketsCache {
    exists: Array<ITradingPair>,
    unknown: Array<ITradingPair>
}

interface IMarket {
    marketId?: number, // market id
    baseCoinId: number, // base coin id
    quoteCoinId: number, // quote coin id
    tradingPair: ITradingPair, // trading pair (tickers)
    marketTicker?: string|undefined, // market ticker
    exId: number, // exchange id
    exTicker: string|undefined // exchange ticker
}


enum ECoin {
    BTC = 'BTC', // Bitcoin
    ETH = 'ETH', // Ethereum
    USDT = 'USDT', // Tether
    USDC = 'USDC', // USD Coin
    EOS = 'EOS', // EOS.IO
    EUR = 'EUR',
    LUNA = 'LUNA', // Luna
    BNB = 'BNB',
    XRP = 'XRP',
    LTC = 'LTC', // Litecoin
    ETC = 'ETC', // Ethereum Classic
    SOL = 'SOL', // Solana
    ADA = 'ADA', // Cardano
    DOGE = 'DOGE', // Dogecoin
    DOT = 'DOT', // Polkadot

    TRX = 'TRX', // Tron
    AVAX = 'AVAX', // Avalanche

    USDTEST = 'USDTEST' // Reserved for testing
}


interface IExchange {
    exId?: number|undefined, // exchange id
    ticker: string,
    name: string,
    descr: string
}

interface ITrade {
    tradeId?: number|undefined, // platform trade id
    exId: number|undefined, // exchange id
    exTicker: string, // exchange ticker
    pair: ITradingPair, // trading pair
    marketId?: number|undefined, // market Id
    marketTicker?: string|undefined, // market ticker
    exTradeId?: number|undefined, // exchange trade id
    mts: number, // milliseconds time stamp (from exchange)
    amount: number, // Amount bought (positive) or sold (negative)
    rate: number, // Funding rate of the trade
    price?: number, // Price at which the trade was executed
}

interface IJsonError {
    error: string,
    code?: number
}

interface IUser {
    userId?: number|undefined, // user ID
    email: string, // user email and login
    password?: string, // user password
    invite?: string, // invite code
    inviteId?: number, // invite record id
    active?: boolean, // active state of user
    tsDateReg?: bigint|undefined, // registration date, timestamp
    tsDateLastVisit?: bigint|undefined, // last visit, timestamp
    activationLink?: string // activation secret string
}

interface IToken {

}


export { ITradingPair, IMarket, IMarketsCache, ITrade, IExchange, IUser, ECoin, IJsonError };

