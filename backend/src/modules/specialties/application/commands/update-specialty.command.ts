export class UpdateSpecialtyCommand {
    constructor(
        public readonly id: string,
        public readonly name?: string,
        public readonly slug?: string,
        public readonly description?: string,
        public readonly icon?: string,
        public readonly image?: string,
        public readonly isActive?: boolean,
    ) {}
}
