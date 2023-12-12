import UserDto from '../../dtos/user.dto';
import { subscribes } from '../../ws/subscribes/subscribes';

enum EConnectionState {
    disconnected,
    needAuth, // authenticate request [ <- server ]
    auth, // authenticate response [ client -> ]
    wrongAccessToken, // wrong access token [ <- server ]
    active, // connected, active [ <- server ]
    subs, // subscribe [ client -> ]
    pause,// connected, on pause [ client -> ]
    data // subscription data [ <- server ]
};


class Client {
    // DB user ID
    private userId: number | null = null;

    // Client WebSocket connection
    private ws: any = false;

    // Unique connection ID
    private connectionId: string | null = null;

    // Connection current state
    private connectionState: EConnectionState | null = null;

    // Authorisation flag
    // true - authorized, false - unauthorized, null - unknown
    private isAuth: boolean | null = null;

    // User active
    // true - active, false - unactive, null - unknown
    private isActive: boolean | null = null;

    // User DTO
    private userDto: UserDto | null = null;

    // Subscriptions
    private subs: Array<string> = null;

    constructor(ws, connectionId?: string) {
        this.ws = ws;
        this.connectionId = connectionId ? connectionId : null;
        this.connectionState = EConnectionState.disconnected;
    }

    public setState = (state: EConnectionState) => {
        this.connectionState = state;
        this.ws.send(JSON.stringify( { connectionId: this.getConnectionId(), state: this.connectionState } ));
    }

    public setSubs = (subs: Array<string>) => {
        console.log(subs);
        this.subs = subs;
    }

    public send = (subscribe: string, payload) => {
        this.ws.send(JSON.stringify( {
            connectionId: this.getConnectionId(),
            state: EConnectionState.data,
            subscribe: subscribe,
            payload: payload
        } ));
    }

    public getSubs = () => this.subs;

    public getConnectionId = () => this.connectionId;

    public getConnectionState = () => this.connectionState;

    public printf = () => `ConnectionID: ${this.connectionId} State: ${this.connectionState} Subs: ${this.subs}`;

}

export { Client, EConnectionState };
