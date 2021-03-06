import { join as pathJoin } from 'path';
import { createConnection, Connection } from 'typeorm';

const getConnectionOptions = (): any => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ormConfig = require(pathJoin(process.cwd(), 'ormconfig'));
    return ormConfig[0];
};

export const dbConnect = async (config = {}): Promise<Connection> => {
    const options: any = { ...getConnectionOptions(), ...config };
    return createConnection(options);
};
