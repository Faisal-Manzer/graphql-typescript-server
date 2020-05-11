import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique } from 'typeorm';

@Entity('users')
@Unique(['email'])
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
}
