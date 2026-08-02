export class CreateSpecialtyCommand {
    constructor(
        public readonly name: string,
        public readonly slug?: string,
        public readonly description?: string,
        public readonly icon?: string,
        public readonly image?: string,
    ) {}
}
