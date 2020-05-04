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

    firstName(): string {
        return this.name.split(' ')[0];
    }
}
