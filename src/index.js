import BitfinexAPI from './gates/bitfinex/BitfinexApi.js';


let bitfinex = new BitfinexAPI();
const pairs = await bitfinex.getPairs();


bitfinex.trades('ETHUSD', msg => {
    let data = JSON.parse(msg)

})


/*
const BITFINEX_WS = 'wss://api-pub.bitfinex.com/ws/2';



const ws = require('ws')

const w1 = new ws(BITFINEX_WS)
const w2 = new ws(BITFINEX_WS)

w2.on('message', (msg) => {
    let response = JSON.parse(msg)
    console.log('2: ', response)
})

w1.on('message', (msg) => {
    let response = JSON.parse(msg)
    console.log('1: ', response)
}
)

const msgBtcUsd = JSON.stringify({
    event: 'subscribe',
    channel: 'trades',
    symbol: 'tBTCUSD'
})

const msgEthUsd = JSON.stringify({
    event: 'subscribe',
    channel: 'trades',
    symbol: 'tETHUSD'
})

w1.on('open', () => w1.send(msgBtcUsd))
w2.on('open', () => w2.send(msgEthUsd))
*/
