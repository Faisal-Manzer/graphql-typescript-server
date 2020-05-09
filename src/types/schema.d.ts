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
        ping: string;
    }

    interface IUser {
        __typename: 'User';
        id: any;
        email: string | null;
        name: string | null;
        verified: boolean | null;
    }

    interface IMutation {
        __typename: 'Mutation';
        registerWithPassword: UserOrExceptions | null;
        loginWithPassword: UserOrExceptions | null;
        resetPassword: UserOrExceptions | null;
        changePassword: DoneOrExceptions | null;
        logout: boolean | null;
        testRegister: IUser | null;
        testLogin: IUser | null;
        testVerify: boolean | null;
        updateName: DoneOrExceptions | null;
        sendConfMail: boolean | null;
    }

    interface IRegisterWithPasswordOnMutationArguments {
        email: string;
        password: string;
        name: string;
    }

    interface ILoginWithPasswordOnMutationArguments {
        email: string;
        password: string;
    }

    interface IResetPasswordOnMutationArguments {
        email: string;
        otp: number;
        password: string;
    }

    interface IChangePasswordOnMutationArguments {
        oldPassword: string;
        newPassword: string;
    }

    interface ILogoutOnMutationArguments {
        /**
         * @default false
         */
        fromAll?: boolean | null;
    }

    interface ITestRegisterOnMutationArguments {
        email: string;
        name: string;
        verify?: boolean | null;
    }

    interface ITestLoginOnMutationArguments {
        email: string;
    }

    interface ITestVerifyOnMutationArguments {
        email: string;
    }

    interface IUpdateNameOnMutationArguments {
        name: string;
    }

    interface ISendConfMailOnMutationArguments {
        email: string;
        redirect: string;
    }

    type UserOrExceptions = IUser | IExceptions;

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

    type DoneOrExceptions = IDone | IExceptions;

    interface IDone {
        __typename: 'Done';
        done: boolean | null;
    }
}

// tslint:enable
