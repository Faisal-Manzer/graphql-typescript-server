import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME;

const options = [
    {
        name: 'default',
        host: process.env.DB_HOST as string,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER as string,
        password: process.env.DB_PASS as string,
        database: dbName as string,
        type: 'postgres',
        dropSchema: isTest,
        synchronize: isTest,
        logging: process.env.NODE_ENV === 'development',
        entities: ['src/**/entity/**/*.ts'],
        migrations: ['src/**/migration/**/*.ts'],
        subscribers: ['src/**/subscriber/**/*.ts'],
        cli: {
            entitiesDir: 'src/entity',
            migrationsDir: 'src/migration',
            subscribersDir: 'src/subscriber',
        },
    },
];

module.exports = options;
