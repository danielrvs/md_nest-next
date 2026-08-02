import { randomUUID } from 'crypto';

export class Specialty {
    constructor(
        public readonly id: string,
        public name: string,
        public slug: string,
        public description?: string | null,
        public icon?: string | null,
        public image?: string | null,
        public isActive: boolean = true,
        public readonly createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
    ) {}

    static create(data: {
        name: string;
        slug?: string;
        description?: string | null;
        icon?: string | null;
        image?: string | null;
        id?: string;
    }): Specialty {
        const now = new Date();
        const slug = data.slug ?? Specialty.slugify(data.name);
        return new Specialty(
            data.id ?? randomUUID(),
            data.name,
            slug,
            data.description ?? null,
            data.icon ?? null,
            data.image ?? null,
            true,
            now,
            now,
        );
    }

    public update(data: {
        name?: string;
        slug?: string;
        description?: string | null;
        icon?: string | null;
        image?: string | null;
    }): void {
        if (data.name !== undefined) {
            this.name = data.name;
            if (data.slug === undefined) {
                this.slug = Specialty.slugify(data.name);
            }
        }
        if (data.slug !== undefined) this.slug = data.slug;
        if (data.description !== undefined) this.description = data.description;
        if (data.icon !== undefined) this.icon = data.icon;
        if (data.image !== undefined) this.image = data.image;
        this.updatedAt = new Date();
    }

    public activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    public deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    public static slugify(text: string): string {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
