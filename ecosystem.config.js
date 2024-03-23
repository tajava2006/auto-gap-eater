module.exports = {
  apps: [
    {
      name: 'ssm',
      script: './src/main.ts',
      watch: '.',
      env: {
        NODE_ENV: 'ssm',
      },
    },
    {
      name: 'sso',
      script: './src/main.ts',
      // watch: '.',
      env: {
        NODE_ENV: 'sso',
      },
    },
  ],
};
