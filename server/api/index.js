// Vercel Serverless Entry Point (api/index.js alias)
const appModule = require('../dist/server.js');
const handler = appModule.default || appModule;

module.exports = handler;
module.exports.default = handler;
