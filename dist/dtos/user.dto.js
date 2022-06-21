export default class UserDto {
    userId;
    email;
    active;
    activationLink;
    constructor(user) {
        this.userId = user.userId;
        this.email = user.email;
        this.active = user.active;
    }
}
//# sourceMappingURL=user.dto.js.map