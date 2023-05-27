module.exports = {
  reactStrictMode: true,
  transpilePackages: [],
  output: "export",
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
    };
    return config;
  },
};
