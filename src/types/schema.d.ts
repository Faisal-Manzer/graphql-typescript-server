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
    }

    interface IMutation {
        __typename: 'Mutation';
        logout: boolean | null;
        testRegister: IUser | null;
        testLogin: IUser | null;
        registerWithPassword: UserOrExceptions | null;
        loginWithPassword: UserOrExceptions | null;
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
    }

    interface ITestLoginOnMutationArguments {
        email: string;
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
}

// tslint:enable
