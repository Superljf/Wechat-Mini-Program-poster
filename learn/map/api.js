import axiosIns from '../../../utils/axios-instance';

export default {
  /**
   * 获取我的岗位选择信息
   * @returns {Promise}
   */
  getMySelect() {
    return axiosIns.get('/hrm-core/tc/employee/post-information/my-select');
  },

  /**
   * 切换岗位选择
   * @param {string|number} id - 岗位信息ID
   * @returns {Promise}
   */
  switchMySelect(id) {
    return axiosIns.put(`/hrm-core/tc/employee/post-information/my-select/${id}`, null);
  },

  /**
   * 获取学习地图数据
   * @param {Object} params - 参数对象
   * @param {string|number} params.deptId - 部门ID
   * @param {string|number} params.postDutyId - 岗位职责ID
   * @param {string|number} params.postLevelMId - 岗位级别M ID
   * @param {string|number} params.postLevelPId - 岗位级别P ID
   * @returns {Promise}
   */
  getStudyMap(params) {
    return axiosIns.post('/tc-core/index/map/study-map', params);
  }
};

