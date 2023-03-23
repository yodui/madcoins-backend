import { UserService } from '../../services/user.service.js';
import { ApiError } from '../../exceptions/api-error.js';

const inviteSyntax = /^[a-fx][\d]{3,7}$/i;

export default class Invite {

    public inviteCode: string = null;

    public isInvalid: boolean = false;

    public activated: boolean | null = null;
    public activatedDate: bigint | string;
    public inviteId: number = null;

    public userId: number = null;
    public isUserActive: boolean | null = null;

    constructor(inviteCode: string) {
        // check syntax
        if(!inviteSyntax.test(inviteCode)) {
            this.isInvalid = true;
        } else {
            // to uppercase
            this.setCode(inviteCode.toUpperCase());
        }
    }

    public async findInviteByCode() {
        const data = await UserService.findInviteByCode(this.inviteCode);
        if(data) {
            this.inviteId = parseInt(data['inviteid']);
            this.activated = data['activated'] ? true : false;
            this.activatedDate = data['activateddate'];
            this.userId = data['userid'];
        }
        return false;
    }

    public async isBindedUserActive() {
        if(this.inviteId === null) {
            await this.findInviteByCode();
            if(!this.inviteId) {
                return false;
            }
        }
        this.isUserActive = false;
        if(await UserService.findActiveUserById(this.userId) !== false) {
            this.isUserActive = true;
        }
        return this.isUserActive;
    }

    async bind(userId: number): Promise<boolean> {
        if(this.inviteId === null) {
            await this.findInviteByCode();
            if(!this.inviteId) {
                return false;
            }
        }
        console.log('Bind inviteId:', this.inviteId, ' to userId:', userId, ' isUserActive:', this.isUserActive);
        return await UserService.bindInvite(this.inviteId, userId);
    }

    async isExists(): Promise<boolean> {
        if(this.inviteId === null) {
            await this.findInviteByCode();
        }
        return !(this.inviteId === null);
    }

    async isAvailable(): Promise<null | boolean> {
        if(this.inviteId === null) {
            // load data
            await this.findInviteByCode();
        }
        if(this.activated === null) return null;
        return !this.activated;
    }

    private setCode(inviteCode: string): void {
        this.inviteCode = inviteCode;
    }

}
