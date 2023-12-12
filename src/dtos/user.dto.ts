import { IUser } from '../classes/Interfaces.js';

export default class UserDto {

    public userId:number;
    public email:string;
    public active:boolean;
    public activationLink:string;

    constructor(user:IUser) {
        this.userId = user.userId;
        this.email = user.email;
        this.active = user.active;
        this.activationLink = user.activationLink;
    }

}
