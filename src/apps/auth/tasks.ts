import * as Task from 'bull';

import { REDIS_URL } from 'server/constants';
import { findUserByEmail } from '../utils';

export const UNLOCK_ACCOUNT_TYPE = 'unLockAccountTask';

export const unLockAccountTask = new Task(UNLOCK_ACCOUNT_TYPE, REDIS_URL);
unLockAccountTask.process(async (job) => {
    console.log('...UNLOCKING ACCOUNT');

    const email = job.data.email;
    const user = await findUserByEmail(email);
    if (user) {
        user.locked = false;
        await user.save();
    }
});
