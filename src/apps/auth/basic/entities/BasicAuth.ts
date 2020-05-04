import { Entity, Column, BaseEntity, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from 'apps/entities/User';

@Entity()
export class BasicAuth extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Column('text')
    password: string;

    @Column('text', { array: true })
    oldPasswords: string[];

    async setPassword(password: string): Promise<void> {
        const oldPassword = this.password;
        if (this.oldPasswords) this.oldPasswords.push(oldPassword);
        else this.oldPasswords = [];
        this.password = await bcrypt.hash(password, 10);
    }

    async compare(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    async isOld(password: string): Promise<boolean> {
        const comparisons = this.oldPasswords.map((oldPassword) => bcrypt.compare(password, oldPassword));
        const is = await Promise.all(comparisons);
        return is.some((old: boolean): boolean => old);
    }
}
