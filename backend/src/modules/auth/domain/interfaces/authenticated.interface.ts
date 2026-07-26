import { UserRole } from "@/modules/users/domain/entities/enums/user-role.enum";

export interface Authenticated {
    userId: string;
    name: string;
    email: string;
    role: UserRole;
    isMfaPending: boolean;
}