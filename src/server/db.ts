import { getConnectionOptions, createConnection, Connection } from 'typeorm';

export const dbConnect = async (config = {}, name = process.env.NODE_ENV): Promise<Connection> => {
    const db = await getConnectionOptions(name);

    try {
        return createConnection({ ...config, ...db, name: 'default' });
    } catch (e) {
        if (e.code === 'ConnectionNotFoundError') return createConnection({ ...config, ...db, name });
        throw new Error('Cannot create database connection');
    }
};
