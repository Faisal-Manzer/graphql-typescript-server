import { MigrationInterface, QueryRunner } from 'typeorm';

export class VerifiedUser1588898086224 implements MigrationInterface {
    name = 'VerifiedUser1588898086224';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "verified" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verified"`, undefined);
    }
}
