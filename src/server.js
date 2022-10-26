import * as ws from 'ws';
import pg from 'pg';

const config = {
    user: 'madcoins',
    password: '0500794',
    host: '192.168.88.88',
    port: 5432,
    database: 'madcoins'
};

try {
    const wsPort = 3037;
    const socket = new ws.WebSocketServer({port:wsPort});

    const pgConnectionString = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
    const client = new pg.Client(pgConnectionString);
    client.connect(err => {
        if(err) throw err;
    });

    socket.on('connection', (ws, req) => {

        console.log('New client connected!');
        console.log(req);

        const insertTradeNotification = 'insertTradeNotification';
        client.query(`LISTEN "${insertTradeNotification}"`);

        const updateTradeNotification = '';

        client.on('notification', async data => {
            console.log(data.payload);
            ws.send(data.payload);
        });

        ws.on('close', () => {
            console.log('Client has disconnected!');
            client.end();
        });

    });

    console.log('The Websocket server is running on port', wsPort);

} catch(e) {
    console.log(e);
}
