module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // The 'plugins' array is now only needed for our path alias helper.
    // The 'expo-router/babel' plugin has been removed.
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            // This maps the '@' symbol to the root directory of your project
            '@': './',
          },
        },
      ],
    ],
  };
};