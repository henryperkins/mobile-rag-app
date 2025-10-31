module.exports = function(api) {
  const isTest = api.caller((caller) => caller?.name === "babel-jest");
  api.cache(() => (isTest ? "test" : "default"));
  return {
    presets: ["babel-preset-expo"],
    plugins: isTest ? [] : ["nativewind/babel"],
  };
};
