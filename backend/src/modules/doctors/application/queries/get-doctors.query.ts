export class GetDoctorsQuery {
    constructor(
        public readonly specialtyId?: string,
        public readonly page: number = 1,
        public readonly perPage: number = 10,
    ) {}
}
