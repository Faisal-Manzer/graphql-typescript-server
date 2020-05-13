import fetch from 'node-fetch';
import { allowedHost } from 'server/cors';
import { isProduction } from 'server/constants';

export const googleRecaptchaValidator = async (captcha: string | undefined | null, ip: string): Promise<boolean> => {
    if (isProduction) {
        if (!captcha) return false;
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: process.env.GOOGLE_RECAPTCHA_SECRET as string,
                response: captcha,
                remoteip: ip,
            }),
        });
        const data = await response.json();
        const success = data.success;
        if (success) return allowedHost(data.host);
        return false;
    }
    return true;
};
