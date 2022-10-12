interface ITradingPair extends Array<string|undefined> {
    0: ECoin|undefined, // from
    1: ECoin|undefined // to
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
    SOL = 'SOL', // Solana
    ADA = 'ADA', // Cardano
    DOGE = 'DOGE', // Dogecoin
    DOT = 'DOT', // Polkadot
    USDTEST = 'USDTEST' // Reserved for testing
}


interface IExchange {
    exId?: number|undefined, // exchange id
    name: string,
    descr: string
}

interface ITrade {
    tradeId?: number|undefined, // platform trade id
    exTicker: string, // exchange ticker
    pair: ITradingPair, // trading pair
    exTradeId?: number|undefined, // exchange trade id
    mts: number, // milliseconds time stamp (from exchange)
    amount: number, // Amount bought (positive) or sold (negative)
    price: number, // Price at which the trade was executed
    rate: number // Funding rate of the trade
}

interface IJsonError {
    error: string,
    code?: number
}

interface IUser {
    userId?: number|undefined, // user ID
    email: string, // user email and login
    password?: string, // user password
    active?: boolean, // active state of user
    tsDateReg?: bigint|undefined, // registration date, timestamp
    tsDateLastVisit?: bigint|undefined, // last visit, timestamp
    activationLink?: string // activation secret string
}

interface IToken {

}

export { ITradingPair, ITrade, IExchange, IUser, ECoin, IJsonError };

