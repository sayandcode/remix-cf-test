/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/*.css"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.ASSET_STORE_BASE_URL
    : "/build/",
  // serverBuildPath: "build/index.js",
};
