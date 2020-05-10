import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedUserLocking1589116702032 implements MigrationInterface {
    name = 'AddedUserLocking1589116702032';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "locked" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "locked"`, undefined);
    }
}
