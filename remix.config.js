/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/*.css"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  publicPath: process.env.NODE_ENV === 'production'
    ? "https://sayandcode-remix-test-public.s3.ap-south-1.amazonaws.com/build/"
    : "/build/",
  // serverBuildPath: "build/index.js",
};
