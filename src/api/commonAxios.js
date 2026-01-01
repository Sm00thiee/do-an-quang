import axios from "axios";
// import queryString from 'query-string';

const commonAxios = axios.create({
  baseURL: 'http://localhost:3001/api',
  // paramsSerializer: params => queryString.stringify(params),
});

commonAxios.interceptors.request.use(
  (config) => {    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

commonAxios.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    console.log('>>Error:', error);
    return Promise.reject(error);
  }
);

export default commonAxios;
