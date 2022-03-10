const axios = require('axios');
const https = require('https')

axios.default.defaults.adapter = require('axios/lib/adapters/http');

window.jianguoyunInstance = axios.default.create({
  baseURL: `https://www.jianguoyun.com/d/ajax`,
  timeout: 10000,
  httpsAgent: new https.Agent({ keepAlive: true }),
});
