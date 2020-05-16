import { TestClient } from 'utils/testClient';

export const loginException = TestClient.checkError('login');
export const loginQuery = (email: string, password: string): string => `
    mutation {
        login(email: "${email}", password: "${password}") {
            __typename
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
            
            ... on Login {
                user {
                    id
                    email
                }
                token
            }
        }
    }
`;

export const registerException = TestClient.checkError('register');
export const registerQuery = (email: string, password: string, name: string): string => `
    mutation {
        register(email: "${email}", password: "${password}", name: "${name}") {
            __typename
            
            ... on Exceptions {
                exceptions {
                    code
                    path
                }
            }
            
            ... on User {
                id
                email
            }
        }
    }
`;
