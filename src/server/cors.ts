export const corsOrigins = ['http://localhost:3000', 'http://localhost:5000'];

// @ts-ignore
export const allowedHost = (host: string): boolean => corsOrigins.indexOf(host) > -1;
