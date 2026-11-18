// Stop the single in-memory MongoDB started in globalSetup.
module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
