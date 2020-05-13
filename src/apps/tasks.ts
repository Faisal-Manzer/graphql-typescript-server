import * as Task from 'bull';

import { isDevelopment, REDIS_URL } from 'server/constants';

export const SEND_MAIL_TASK = 'sendMailTask';
export const sendMailTask = new Task(SEND_MAIL_TASK, REDIS_URL);
sendMailTask.process((job) => {
    return new Promise(async (resolve) => {
        if (isDevelopment) console.log(job.data);
        resolve();
    });
});
