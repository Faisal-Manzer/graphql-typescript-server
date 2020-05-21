import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToMany, JoinColumn } from 'typeorm';
import { Permission, Role } from './Permissions';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string; // Full Name

    @Column({ default: false })
    verified: boolean;

    @Column({ default: false })
    locked: boolean;

    @Column('int', { default: 0 })
    failedAttempts: number;

    @JoinColumn()
    @ManyToMany(() => Role)
    roles: Role[];

    @JoinColumn()
    @ManyToMany(() => Permission)
    permissions: Permission[];
}
