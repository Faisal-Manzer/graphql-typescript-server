import { ResolverMap } from 'types/graphql-utils';

import { sendMailTask } from 'apps/tasks';

import { createVerificationLink } from 'apps/auth/utils';
import { sendConfMailParmValidator } from 'apps/auth/validators';

const Resolvers: ResolverMap = {
    Mutation: {
        sendVerificationEmail: async (
            _,
            args: GQL.ISendVerificationEmailOnMutationArguments,
            { host },
        ): Promise<boolean> => {
            const { redirect } = args;
            let email = '';

            try {
                const data = await sendConfMailParmValidator.validate(args);
                email = data.email;
            } catch (e) {
                return false;
            }

            const link = await createVerificationLink(host, email, redirect);
            await sendMailTask.add({ email, body: link });
            return true;
        },
    },
};

export default Resolvers;
