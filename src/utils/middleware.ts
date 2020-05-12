const combineMiddlewares = (...middlewares: any[]) => async (
    resolve: Function,
    parent: any,
    args: any,
    context: any,
    info: any,
): Promise<any> => {
    if (middlewares.length === 0) return resolve(parent, args, context, info);
    const mCopy = [...middlewares];
    const middleware = mCopy.pop();
    const next = (mResolve = resolve, mParent = parent, mArgs = args, mContext = context, mInfo = info): any =>
        combineMiddlewares(...mCopy)(mResolve, mParent, mArgs, mContext, mInfo);
    return await middleware(next, parent, args, context, info);
};
