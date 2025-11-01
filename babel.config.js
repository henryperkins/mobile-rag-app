const transformImportMeta = require("./babel-plugin-transform-import-meta");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      transformImportMeta,
      "nativewind/babel",
    ],
  };
};
