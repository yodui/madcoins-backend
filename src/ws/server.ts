import path from 'path';
import * as ws from 'ws';
import pg from 'pg';
import * as crypto from 'crypto';

import { env } from './utils/Environment.js';
import { Client, EConnectionState } from './../classes/ws/Client.js';
import { TokenService } from '../services/token.service.js';

import { notifications, subscribes } from '../ws/subscribes/subscribes.js';

let clients: Array<Client> = [];

const server = new ws.WebSocketServer({ port: env.ws.port });

server.getUniqueID = () => crypto.randomUUID();

const pgConnectionString = `postgresql://${env.db.user}:${env.db.password}@${env.db.host}:${env.db.port}/${env.db.database}`;
const db = new pg.Client(pgConnectionString);

db.connect(err => {
    if(err) throw err;
});

try {
    console.log('The Websocket server is running on port', env.ws.port);

    for(let key in notifications) {
        await db.query(`LISTEN "${notifications[key]}"`);
    }

    server.on('connection', async (ws, req) => {

        const client = new Client(ws, server.getUniqueID());

        const cIndex = clients.push(client) - 1;

        console.log('New client connected! Index:', cIndex);
        console.log('Total clients connected:', clients.length);

        client.setState(EConnectionState.needAuth);
        showClients();

        ws.onmessage = async (e) => {

            const response = JSON.parse(e.data);
            if(typeof response !== 'object' && !response.hasOwnProperty('state')) {
                console.log('Wrong message format!');
                return;
            }

            const state = response.state;

            switch(state) {
                case EConnectionState.auth:
                    // need to aunthenticate
                    if(response.hasOwnProperty('accessToken')) {
                        const userData = await TokenService.validateAccessToken(response.accessToken);
                        if(!userData) {
                            // wrong token
                            console.log('Wrong access token');
                            client.setState(EConnectionState.wrongAccessToken);
                        } else {
                            // connection is active
                            client.setState(EConnectionState.active);
                            showClients();
                        }
                    }
                    break;
                case EConnectionState.subs:
                    console.log('Subs...');
                    // subscription to data sets
                    if(response.hasOwnProperty('subs')) {
                        const subs = response.subs;
                        client.setSubs(subs);
                        client.setState(EConnectionState.active);
                        // set active state again
                        showClients();
                    }
                    break;
            }
        };

        ws.on('close', async () => {
            console.log('Client ', cIndex, ' (ID: ) has disconnected!');
            clients.splice(cIndex, 1);
            // show current clients
            showClients();
            ws.close();
        });

    });

    db.on('notification', async data => {
        clients.forEach((c) => sendNotify(c, data.channel, data.payload))
    });

} catch(e) {
    for(let key in notifications) {
        await db.query(`UNLISTEN "${notifications[key]}"`);
    }
    db.end();
    console.log(e);
}

const sendNotify = (client, channel, payload) => {
    const group = groupByChannel(channel);
    if(!group) return;
    if(client.subs !== null && client.subs.length && client.subs.includes(group)) {
        console.log('trigger:', group, 'payload:', payload);

        client.send(group, payload);
    }
}

const groupByChannel = (channel) => {
    for(const group of Object.keys(subscribes)) {
        if(subscribes[group].includes(channel)) {
            return group;
        }
    }
    return false;
}

const showClients = () => {
    clients.forEach((client, index) => {
        console.log(`\t${index}: ${client.printf()}`);
    })
}
