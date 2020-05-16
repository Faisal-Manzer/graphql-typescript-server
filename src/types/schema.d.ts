// tslint:disable
// graphql typescript definitions

declare namespace GQL {
    interface IGraphQLResponseRoot {
        data?: IQuery | IMutation;
        errors?: Array<IGraphQLResponseError>;
    }

    interface IGraphQLResponseError {
        /** Required for all errors */
        message: string;
        locations?: Array<IGraphQLResponseErrorLocation>;
        /** 7.2.2 says 'GraphQL servers may provide additional entries to error' */
        [propName: string]: any;
    }

    interface IGraphQLResponseErrorLocation {
        line: number;
        column: number;
    }

    interface IQuery {
        __typename: 'Query';
        me: IUser | null;

        /**
         * Use ping to test server uptime
         */
        ping: string;
    }

    interface IUser {
        __typename: 'User';
        id: string | null;
        email: string | null;
        name: string | null;
        verified: boolean | null;
    }

    interface IMutation {
        __typename: 'Mutation';
        changePassword: DoneOrExceptions | null;
        sendForgotPasswordMail: IDone | null;
        forgotPassword: UserOrExceptions | null;
        login: LoginOrExceptions | null;
        register: UserOrExceptions | null;
        logout: boolean | null;
        updateName: DoneOrExceptions | null;
        sendVerificationEmail: boolean | null;
    }

    interface IChangePasswordOnMutationArguments {
        oldPassword?: string | null;
        newPassword: string;
    }

    interface ISendForgotPasswordMailOnMutationArguments {
        email: string;
    }

    interface IForgotPasswordOnMutationArguments {
        email: string;
        otp: number;
        password: string;
    }

    interface ILoginOnMutationArguments {
        email: string;
        password: string;
    }

    interface IRegisterOnMutationArguments {
        email: string;
        password: string;
        name: string;
        captcha?: string | null;
    }

    interface ILogoutOnMutationArguments {
        /**
         * @default false
         */
        fromAll?: boolean | null;
    }

    interface IUpdateNameOnMutationArguments {
        name: string;
    }

    interface ISendVerificationEmailOnMutationArguments {
        email: string;
        redirect: string;
    }

    type DoneOrExceptions = IDone | IExceptions;

    interface IDone {
        __typename: 'Done';
        done: boolean | null;
    }

    interface IExceptions {
        __typename: 'Exceptions';
        exceptions: Array<IException>;
    }

    interface IException {
        __typename: 'Exception';
        path: string | null;
        message: string | null;
        code: string;
        data: any | null;
    }

    type UserOrExceptions = IUser | IExceptions;

    type LoginOrExceptions = ILogin | IExceptions;

    interface ILogin {
        __typename: 'Login';
        user: IUser | null;
        token: string | null;
    }

    interface IFile {
        __typename: 'File';
        id: string;
        path: string;
        filename: string;
        mimetype: string;
        encoding: string;
    }
}

// tslint:enable
