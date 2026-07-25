export class UserRegisteredEvent {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly email: string,
        public readonly name: string,
        public readonly role: string,
    ) { }
}