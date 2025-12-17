import axiosIns from '../../../utils/axios-instance';

export default {
  getCultrueCourses ({pageNum, pageSize}) {
    return axiosIns.post('/homepage/corp-culture', {pageSize, pageNum})
  },
  getDictList ({dictCode}) {
    return axiosIns.get(`/dict/${dictCode}/list`)
  }
}