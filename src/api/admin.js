import adminAxios from "./adminAxios";

const prefix = '/admin';
const adminApi = {
      getAllCandidates: () => {
        return adminAxios.get(`${prefix}/candidates`);
      },
      createCandidate: (data) => {
        return adminAxios.post(`${prefix}/candidates/create`, data);
      },
      updateCandidate: (id, data) =>{
        return adminAxios.post(`${prefix}/candidates/update/${id}`, data);
      },
      deleteCandidate: (id)=>{
        return adminAxios.post(`${prefix}/candidates/delete/${id}`);
      },
      getAllEmployers: () => {
        return adminAxios.get(`${prefix}/employers`);
      },
      createEmployer: (data) => {
        return adminAxios.post(`${prefix}/employers/create`, data);
      },
      updateEmployer: (id, data) =>{
        return adminAxios.post(`${prefix}/employers/update/${id}`, data);
      },
      deleteEmployer: (id)=>{
        return adminAxios.post(`${prefix}/employers/delete/${id}`);
      },
      getContact: () => {
        return adminAxios.get(`${prefix}/contact`);
      },
};

export default adminApi;
