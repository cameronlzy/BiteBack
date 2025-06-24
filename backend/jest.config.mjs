export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
};
