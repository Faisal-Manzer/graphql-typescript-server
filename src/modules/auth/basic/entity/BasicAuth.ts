import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import bcrypt from 'bcrypt';

@Entity()
export class BasicAuth extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    password: string;

    @Column('text', { array: true })
    oldPasswords: string[];

    async setPassword(password: string): Promise<void> {
        const oldPassword = this.password;
        this.oldPasswords.push(oldPassword);
        this.password = await bcrypt.hash(password, 10);
    }

    async compare(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }

    async isOld(password: string): Promise<boolean> {
        const comparions = this.oldPasswords.map((oldPassword) => bcrypt.compare(password, oldPassword));
        const is = await Promise.all(comparions);
        return is.some((old: boolean): boolean => old);
    }
}
