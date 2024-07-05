
const strategies = {
  google: require('./cloudAPIs'),
  gitee: require('./CloudAPIs_gitee'),
  // 可以继续添加其他策略
};

class CloudSyncStrategyFactory {
  static getSyncStrategy(type) {
    const Strategy = strategies[type];
    if (!Strategy) {
      throw new Error(`Unsupported sync strategy: ${type}`);
    }
    return new Strategy();
  }
}

module.exports = CloudSyncStrategyFactory;