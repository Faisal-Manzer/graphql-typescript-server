import { rolesLoader } from '../src/server/loaders';
import { dbConnect } from '../src/server/db';

const load = async () => {
    const conn = await dbConnect();
    await rolesLoader().then();
    await conn.close();
};

load().then();
