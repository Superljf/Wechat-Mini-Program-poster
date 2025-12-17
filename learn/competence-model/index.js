import React, { Component } from 'react';
import { AppUserContext } from '../../../app-context';
import HeaderBack from '../../../components/header-back';
import RadarChart from './components/radar-chart';
import Certificates from './components/certificates';
import FiveHundred from './components/five-hundred';
import api from './api';
import mapApi from '../map/api';
import style from './style.css';
import LearningMapLoading from '../../../components/learning-map-loading';

class CompetenceModel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      competenceModel: null,
      certificates: null,
      fiveHundred: null,
      userPostName: '',
    };
  }

  componentDidMount() {
    this.loadData();
  }

  /**
   * 获取当前选中的岗位
   */
  getCurrentSelectedPost = (mySelectData) => {
    if (!mySelectData || !mySelectData.postInformationList) {
      return mySelectData;
    }

    const currentPost = mySelectData.postInformationList.find(
      (item) => item.isCurrent === true || item.isCurrent === 'true'
    );

    if (currentPost) {
      return currentPost;
    }

    if (mySelectData.postDutyId) {
      const matchedPost = mySelectData.postInformationList.find(
        (item) => item.postDutyId === mySelectData.postDutyId
      );
      if (matchedPost) {
        return matchedPost;
      }
    }

    return mySelectData.postInformationList[0] || mySelectData;
  };

  /**
   * 转换雷达图数据格式
   */
  convertRadarData = (data) => {
    if (!data) return null;

    let dataList = [];
    if (Array.isArray(data)) {
      dataList = data;
    } else if (data.list && Array.isArray(data.list)) {
      dataList = data.list;
    } else if (data.data && Array.isArray(data.data)) {
      dataList = data.data;
    }

    return {
      abilityTypes: dataList.map((item, index) => {
        const abilityList = item.abilityList || [];
        return {
          id: `ability-${index}`,
          name: item.abilityTypeName || '',
          standardScore: 10, // 默认最大值
          knowledgeSkills: abilityList.map((ability, abilityIndex) => ({
            id: `ks-${index}-${abilityIndex}`,
            name: ability.ability || '',
            score: ability.standardScore || 0,
          })),
        };
      }),
    };
  };

  /**
   * 转换证书数据格式
   */
  convertCertificatesData = (data) => {
    if (!data) return { certificates: [] };

    let certificates = [];
    if (Array.isArray(data)) {
      certificates = data;
    } else if (data.list && Array.isArray(data.list)) {
      certificates = data.list;
    } else if (data.certificates && Array.isArray(data.certificates)) {
      certificates = data.certificates;
    }

    return {
      certificates: certificates.map((item) => ({
        type: item.certificateTypeName || '',
        category: item.certificateCategory || '',
        subject: item.certificateSubject || '',
        number: item.certificateCode || '',
      })),
    };
  };

  /**
   * 转换5个100数据格式
   */
  convertFiveHundredData = (data) => {
    if (!data) return null;

    return {
      totalProgress: data.totalFinishNum || 0,
      isShow: data.isShow !== undefined ? data.isShow : true,
      submitUrl: data.url || '',
      items: [
        {
          id: '1',
          name: '交100个家长朋友',
          progress: data.beFriendFinishNum || 0,
          color: '#0A68F8',
          backgroundColor: '#CFE1FE',
        },
        {
          id: '2',
          name: '听100堂优秀老师的课',
          progress: data.classRecordFinishNum || 0,
          color: '#02BF8B',
          backgroundColor: '#CCF2E7',
        },
        {
          id: '3',
          name: '读100本专业书籍',
          progress: data.readProfessionalBooksFinishNum || 0,
          color: '#F5A623',
          backgroundColor: '#FDEDD3',
        },
        {
          id: '4',
          name: '刷100套试卷',
          progress: data.refreshPaperFinishNum || 0,
          color: '#35C4D2',
          backgroundColor: '#D6F3F6',
        },
        {
          id: '5',
          name: '写100份教学反思',
          progress: data.teachReflectionFinishNum || 0,
          color: '#8B572A',
          backgroundColor: '#E8DED5',
        },
      ],
    };
  };

  loadData = async () => {
    try {
      this.setState({ loading: true });

      // 1. 获取岗位信息
      const mySelectData = await mapApi.getMySelect();
      const currentSelectedPost = this.getCurrentSelectedPost(mySelectData);
      const userPostName =
        (currentSelectedPost && currentSelectedPost.postDutyName) ||
        mySelectData.postDutyName ||
        '';

      if (!currentSelectedPost) {
        throw new Error('获取岗位信息失败');
      }

      // 2. 准备接口参数
      const postDutyModelParams = {
        deptId: currentSelectedPost.deptId || mySelectData.deptId,
        postDutyId: currentSelectedPost.postDutyId || mySelectData.postDutyId,
        postLevelMId:
          currentSelectedPost.postLevelMId || mySelectData.postLevelMId,
        postLevelPId:
          currentSelectedPost.postLevelPId || mySelectData.postLevelPId,
      };

      // 3. 并行获取数据
      const [radarData, certificatesData, fiveHundredData] = await Promise.all([
        api.getPostDutyModel(postDutyModelParams).catch((err) => {
          console.error('获取胜任力模型数据失败:', err);
          return null;
        }),
        api.getMyCertificateList().catch((err) => {
          console.error('获取证书列表失败:', err);
          return { certificates: [] };
        }),
        api.getFiveHundred().catch((err) => {
          console.error('获取5个100数据失败:', err);
          return null;
        }),
      ]);

      // 4. 转换数据格式
      const competenceModel = this.convertRadarData(radarData);
      const certificates = this.convertCertificatesData(certificatesData);
      const fiveHundred = this.convertFiveHundredData(fiveHundredData);

      this.setState({
        competenceModel,
        certificates,
        fiveHundred,
        userPostName,
        loading: false,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setState({ loading: false });
    }
  };

  render() {
    const {
      loading,
      competenceModel,
      certificates,
      fiveHundred,
      userPostName,
    } = this.state;

    if (loading) {
      return (
        <LearningMapLoading
          text='正在加载岗位胜任力模型...'
          subtext='呱呱正在为你规划岗位胜任力模型'
        />
      );
    }

    const shouldShowFiveHundred =
      fiveHundred &&
      fiveHundred.isShow &&
      userPostName &&
      (userPostName.includes('教师') || userPostName.includes('教研'));

    return (
      <div className={style['competence-model-container']}>
        <HeaderBack
          styles={{ position: 'fixed', zIndex: 999, width: `100%` }}
          className='competence-model-header'
          showBackIcon
        >
          岗位胜任力模型
        </HeaderBack>
        <div className={style['competence-model-content']}>
          {competenceModel && <RadarChart competenceModel={competenceModel} />}

          {certificates &&
            certificates.certificates &&
            certificates.certificates.length > 0 && (
              <Certificates certificates={certificates.certificates} />
            )}

          {shouldShowFiveHundred && fiveHundred && (
            <FiveHundred fiveHundred={fiveHundred} />
          )}
        </div>
      </div>
    );
  }
}

export default (props) => (
  <AppUserContext.Consumer>
    {({ user }) => <CompetenceModel {...props} user={user} />}
  </AppUserContext.Consumer>
);
