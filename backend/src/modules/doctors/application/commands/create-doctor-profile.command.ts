export class CreateDoctorProfileCommand {
    constructor(
        public readonly userId: string,
        public readonly licenseNumber: string,
        public readonly bio?: string,
        public readonly consultationFee?: number,
        public readonly specialtyIds?: string[],
        public readonly avatar?: string,
    ) {}
}
