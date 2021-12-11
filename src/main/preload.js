const axios = require('axios');

axios.default.defaults.adapter = require('axios/lib/adapters/http');

window.jianguoyunInstance = axios.default.create({
  baseURL: `https://www.jianguoyun.com/d/ajax`,
  timeout: 2000,
});
