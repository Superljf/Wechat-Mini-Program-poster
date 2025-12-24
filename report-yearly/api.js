import axiosIns from '../../utils/axios-instance';

export default {
    getWxConfig (url) {
        return axiosIns.get(`/study-report/wx-config?url=${url}`)
    },
    //获取学员年度报告
    getStudyReport ({year = "2025"}) {
        return axiosIns.get(`/study-report/detail/${year}`)
    },
}

