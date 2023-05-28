module.exports = {
  reactStrictMode: true,
  transpilePackages: [],
  output: "export",
  trailingSlash: true,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
    };
    return config;
  },
};
