import { loginRequired } from '../mws';

export default {
    Query: {
        me: loginRequired({ checkVerified: false, exception: false }),
    },
    Mutation: {
        updateName: loginRequired({ query: true }),
    },
};
