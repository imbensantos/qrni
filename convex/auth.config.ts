// Note: CONVEX_SITE_URL is a built-in Convex environment variable that is
// always set in deployed environments. If it were missing, the auth provider
// would fail to initialize with a clear error from the Convex runtime.
// No manual validation is needed here.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
