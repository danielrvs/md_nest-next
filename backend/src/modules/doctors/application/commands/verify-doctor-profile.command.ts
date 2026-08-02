export class VerifyDoctorProfileCommand {
    constructor(
        public readonly id: string,
        public readonly isVerified: boolean,
    ) {}
}
