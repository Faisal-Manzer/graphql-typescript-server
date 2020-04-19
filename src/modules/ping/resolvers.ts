class Query {
    static ping(): string {
        return 'pong';
    }
}

export const Resolvers = {
    Query: {
        ping: Query.ping,
    },
};
