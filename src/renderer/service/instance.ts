import { AxiosInstance } from 'axios';

const instance: AxiosInstance = (window as any).jianguoyunInstance;

instance.interceptors.request.use((config) => {
  const { url, headers } = config;
  let qs: URLSearchParams;
  if (url?.includes('?')) {
    qs = new URLSearchParams(url.substr(url.indexOf('?')));
  } else {
    qs = new URLSearchParams();
  }
  qs.set('_', Date.now().toString());
  let cookie = '';
  const lCookie = localStorage.getItem('cookie');
  if (lCookie) {
    const c = JSON.parse(lCookie) as Record<string, string>;
    cookie = Object.entries(c)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
  return {
    ...config,
    headers: {
      ...headers,
      origin: 'https://www.jianguoyun.com',
      referer: 'https://www.jianguoyun.com',
      cookie,
    },
    url: `${
      url?.includes('?') ? url.substr(0, url.indexOf('?')) : url
    }?${qs.toString()}`,
  };
});

export default instance;
