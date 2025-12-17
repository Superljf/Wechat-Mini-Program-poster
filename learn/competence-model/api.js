import axiosIns from '../../../utils/axios-instance';

export default {
  /**
   * 获取岗位胜任力模型数据
   * @param {Object} params - 参数对象
   * @param {string|number} params.deptId - 部门ID
   * @param {string|number} params.postDutyId - 岗位职责ID
   * @param {string|number} params.postLevelMId - 岗位级别M ID
   * @param {string|number} params.postLevelPId - 岗位级别P ID
   * @returns {Promise}
   */
  getPostDutyModel(params) {
    return axiosIns.post('/tc-core/index/map/post-duty-model', params);
  },

  /**
   * 获取已获得证书列表
   * @returns {Promise}
   */
  getMyCertificateList() {
    return axiosIns.get('/hrm-core/tc/employee/certificate/my-certificate');
  },

  /**
   * 获取5个100区域的数据
   * @returns {Promise}
   */
  getFiveHundred() {
    return axiosIns.get('/hrm-core/tc/employee/teacher/five-hundred');
  }
};

