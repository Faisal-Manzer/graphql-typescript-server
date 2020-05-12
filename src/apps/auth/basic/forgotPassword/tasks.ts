import * as Task from 'bull';

import { REDIS_URL } from 'server/constants';
import { getBasicAuthUsingEmail } from '../utils';

export const RESET_OTP_RESET_MAX_LIMIT_TASK = 'resetOtpMaxLimitTask';
export const resetOtpMaxLimitTask = new Task(RESET_OTP_RESET_MAX_LIMIT_TASK, REDIS_URL);
resetOtpMaxLimitTask.process(async (job) => {
    const email = job.data.email;
    const auth = await getBasicAuthUsingEmail(email);
    if (auth) {
        auth.forgotPasswordFailed = 0;
        await auth.save();
    }
});
