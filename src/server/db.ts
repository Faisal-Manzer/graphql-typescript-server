import { getConnectionOptions, createConnection, Connection } from 'typeorm';

export const dbConnect = async (config = {}, name = process.env.NODE_ENV): Promise<Connection> => {
    const dbDefaultOptions = await getConnectionOptions(name);
    const dbName = process.env.NODE_ENV === 'test' ? process.env.TEST_DB_NAME : process.env.DB_NAME;
    const options: any = {
        ...dbDefaultOptions,
        host: process.env.DB_HOST as string,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER as string,
        password: process.env.DB_PASS as string,
        database: dbName as string,
        name: 'default',
        ...config,
    };

    try {
        return createConnection({ ...options, name: 'default' });
    } catch (e) {
        console.log(e);
        if (e.code === 'ConnectionNotFoundError') return createConnection({ ...options, name });
        throw new Error('Cannot create database connection');
    }
};
