import commonAxios from "./commonAxios";
import employerAxios from "./employerAxios";
import queryString from "query-string";

const prefix = "/companies";
const employerApi = {
  getList: (params) => {
    return commonAxios.get(
      `${prefix}?${queryString.stringify(params, { arrayFormat: "index" })}`
    );
  },
  getById: (id) => {
    return commonAxios.get(`${prefix}/${id}/getByID`);
  },
  getHotList: () => {
    return commonAxios.get(`${prefix}/getHotList`);
  },
  // destroy: (id) => {
  //   return commonAxios.delete(`${prefix}/${id}/destroy`);
  // },
  search: (keyword) => {
    return commonAxios.get(`${prefix}?keyword=${keyword}`);
  },
  getComJobs: (id) => {
    return commonAxios.get(`${prefix}/${id}/getComJobs`);
  },
  getJobList: (id, keyword) => {
    return commonAxios.get(`${prefix}/${id}/getJobList?keyword=${keyword}`);
  },
  getCandidateList: (keyword, status) => {
    let url = `${prefix}/getCandidateList?keyword=${keyword}&status=${status}`;
    return employerAxios.get(url);
  },
  processApplying: (data) => {
    return employerAxios.post(`${prefix}/processApplying`, data);
  },
  changeJobStatus: (job_id, data) => {
    return employerAxios.post(`${prefix}/${job_id}/changeJobStatus`, data);
  },
};
export default employerApi;
