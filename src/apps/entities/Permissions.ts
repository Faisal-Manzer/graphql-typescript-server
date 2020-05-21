import { Entity, Column, BaseEntity, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm';

interface IPartialPermission {
    __typename: string;
    code: string;
    message?: string;
    load: Function;
}

@Entity()
export class Permission extends BaseEntity {
    @PrimaryColumn()
    code: string;

    @Column('text', { nullable: true })
    message: string | undefined;

    static load(code: string, message: string | undefined = undefined): Function {
        return async function (): Promise<Permission> {
            let perm = await Permission.preload({ code, message });
            if (!perm) perm = await Permission.create({ code, message });
            await perm.save();
            return perm;
        };
    }

    static new(code: string, message = undefined): IPartialPermission {
        return { code, message, __typename: 'permission', load: Permission.load(code, message) };
    }
}

interface IPartialRole {
    __typename: string;
    code: string;
    message: undefined | string;
    permissions: IPartialPermission[] | string[];
    load: Function;
}

@Entity()
export class Role extends BaseEntity {
    @PrimaryColumn()
    code: string;

    @Column('text', { nullable: true })
    message: string | undefined;

    @JoinTable()
    @ManyToMany(() => Permission, { cascade: false })
    permissions: Permission[];

    static load(code: string, message: string | undefined = undefined) {
        return async function (permissions: Permission[]): Promise<Role> {
            let role = await Role.preload({ code, message });
            if (!role) role = await Role.create({ code, message });
            role.permissions = permissions;
            console.log(`Added ${permissions.length} to role ${role.code} =>`, ...permissions.map((perm) => perm.code));
            await role.save();
            return role;
        };
    }

    static new(
        code: string,
        permissions: string[] | IPartialPermission[] = [],
        message: string | undefined = undefined,
    ): IPartialRole {
        return { code, message, permissions, __typename: 'role', load: Role.load(code, message) };
    }
}
