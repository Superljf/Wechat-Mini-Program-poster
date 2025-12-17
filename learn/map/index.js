import React, { Component } from 'react';
import { AppUserContext } from '../../../app-context';
import Header from './components/header';
import LearningPath from './components/learning-path';
import StudyForm from './components/study-form';
import LearningMapLoading from '../../../components/learning-map-loading';
import api from './api';
import style from './style.css';

class LearningMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      userHRMData: null,
      postAbilityMap: null,
      leadershipModel: null,
      knowledgeSkills: null,
      currentPostId: null,
      currentProfessionalLevel: null,
      currentManagementLevel: null,
      currentSelectedPost: null, // 当前选中的岗位信息
      plist: [], // P序列列表
      mlist: [], // M序列列表
      suppressRouteRecalc: false, // 点击点位获取表格数据时不重新计算路线点位
    };
  }

  componentDidMount() {
    this.loadData();
  }

  /**
   * 将getMySelect返回的数据转换为Header组件需要的格式
   */
  convertMySelectToUserHRMData = (mySelectData) => {
    if (!mySelectData) return null;

    // 获取当前选中的岗位
    const currentPost = this.getCurrentSelectedPost(mySelectData);

    // 分离主岗和兼岗
    const postInformationList = mySelectData.postInformationList || [];
    const mainPost = postInformationList.find(
      (item) => item.postTypeName && item.postTypeName.includes('主岗')
    );
    const partTimePosts = postInformationList.filter(
      (item) => item.postTypeName && item.postTypeName.includes('兼岗')
    );

    // 提取职级信息
    const professionalLevel =
      (currentPost && currentPost.postLevelPName) ||
      mySelectData.postLevelPName ||
      'P0';
    const managementLevel =
      (currentPost && currentPost.postLevelMName) ||
      mySelectData.postLevelMName ||
      'M0';

    return {
      postName:
        (currentPost && currentPost.postDutyName) ||
        mySelectData.postDutyName ||
        '岗位',
      mainPost: mainPost
        ? {
            id: mainPost.id,
            postId: mainPost.postDutyId || mainPost.id, // 保留postId用于兼容
            postName: mainPost.postDutyName,
          }
        : null,
      partTimePosts: partTimePosts.map((post) => ({
        id: post.id,
        postId: post.postDutyId || post.id, // 保留postId用于兼容
        postName: post.postDutyName,
      })),
      professionalLevel: this.extractLevelCode(professionalLevel, 'P'),
      managementLevel: this.extractLevelCode(managementLevel, 'M'),
      subjectStage: mySelectData.subjectStage || '', // 如果有科目学段字段
      currentPostId:
        (currentPost && currentPost.id) || (mainPost && mainPost.id) || null, // 当前选中岗位的id
    };
  };

  /**
   * 获取当前选中的岗位
   */
  getCurrentSelectedPost = (mySelectData) => {
    if (!mySelectData || !mySelectData.postInformationList) {
      return mySelectData;
    }

    // 优先查找isCurrent为true的岗位
    const currentPost = mySelectData.postInformationList.find(
      (item) => item.isCurrent === true || item.isCurrent === 'true'
    );

    if (currentPost) {
      return currentPost;
    }

    // 如果没有isCurrent字段，使用postDutyId匹配
    if (mySelectData.postDutyId) {
      const matchedPost = mySelectData.postInformationList.find(
        (item) => item.postDutyId === mySelectData.postDutyId
      );
      if (matchedPost) {
        return matchedPost;
      }
    }

    // 返回第一个岗位或mySelectData本身
    return mySelectData.postInformationList[0] || mySelectData;
  };

  /**
   * 提取职级代码（如"P3"、"M1"）
   */
  extractLevelCode = (levelName, type) => {
    if (!levelName) return type === 'P' ? 'P0' : 'M0';

    // 如果已经是代码格式（如"P3"），直接返回
    if (typeof levelName === 'string' && /^[PM]\d+$/.test(levelName)) {
      return levelName;
    }

    // 尝试从名称中提取（如"P3级" -> "P3"）
    const match = String(levelName).match(new RegExp(`(${type}\\d+)`, 'i'));
    return match ? match[1] : type === 'P' ? 'P0' : 'M0';
  };

  /**
   * 将getStudyMap返回的数据转换为LearningPath组件需要的格式
   */
  convertStudyMapToPathData = (studyMapData) => {
    if (!studyMapData) return { professionalPath: [], managementPath: [] };

    const plist = studyMapData.plist || [];
    const mlist = studyMapData.mlist || [];

    // 转换P序列
    const professionalPath = plist.map((item, index) => {
      // 根据数据结构，plist中的字段可能是postLevelPName或postLevelMName
      const levelName =
        item.postLevelPName ||
        item.postLevelMName ||
        item.postLevelName ||
        item.name ||
        `P${index + 1}`;
      return {
        level: this.extractLevelCode(levelName, 'P'),
        name: levelName,
        description: levelName,
      };
    });

    // 转换M序列
    const managementPath = mlist.map((item, index) => {
      const levelName =
        item.postLevelMName ||
        item.postLevelName ||
        item.name ||
        `M${index + 1}`;
      return {
        level: this.extractLevelCode(levelName, 'M'),
        name: levelName,
        description: levelName,
      };
    });

    return {
      professionalPath,
      managementPath,
    };
  };

  /**
   * 将getStudyMap返回的数据转换为StudyForm组件需要的格式
   */
  convertStudyMapToKnowledgeSkills = (studyMapData) => {
    if (!studyMapData || !studyMapData.abilityList) {
      return { abilityTypes: [] };
    }

    const abilityTypes = studyMapData.abilityList.map((abilityItem, index) => {
      const abilityItemList = abilityItem.abilityItemList || [];

      const knowledgeSkills = abilityItemList.map((item, itemIndex) => {
        // 转换学习形式数据
        const studyForms = {
          onlineCourse: (item.courseList || []).map((course) => ({
            id: course.courseId || course.id,
            courseId: course.courseId || course.id,
            name: course.courseName || course.name || '',
            isLearned: course.isLearned === true || course.isLearned === 'true',
          })),
          reading: (item.articleList || []).map((article) => ({
            id: article.id || article.articleId || article.libraryId,
            bookId: article.id || article.articleId || article.libraryId,
            name: article.title || article.articleName || article.name || '',
            isLearned:
              article.isLearned === true || article.isLearned === 'true',
          })),
          actionLearning: this.convertToStringArray(item.actionLearning),
          coaching: this.convertToStringArray(item.counselling),
          meeting: this.convertToStringArray(item.meeting),
          summary: this.convertToStringArray(item.summarize),
          exam: this.convertToStringArray(item.exam),
          observation: this.convertToStringArray(item.observe),
          responsibility: this.convertToStringArray(item.dutyResponsibility),
          mentoring: this.convertToStringArray(item.counsellingOther),
          benchmark: this.convertToStringArray(item.benchmark),
          lecturer: this.convertToStringArray(item.teacher),
          rotation: this.convertToStringArray(item.postRotation),
        };

        return {
          id: `ks-${index}-${itemIndex}`,
          name: item.ability || '',
          studyForms: studyForms,
        };
      });

      return {
        id: abilityItem.abilityTypeId || `ability-${index}`, // 使用后端返回的abilityTypeId
        name: abilityItem.abilityTypeName || '', // 使用后端返回的abilityTypeName
        knowledgeSkills: knowledgeSkills,
      };
    });

    return { abilityTypes };
  };

  /**
   * 将字符串或数组转换为字符串数组
   */
  convertToStringArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === 'string' ? item : String(item)
      );
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (
        trimmed === '' ||
        trimmed === 'null' ||
        trimmed === 'undefined' ||
        trimmed === '[]' ||
        trimmed === '{}'
      ) {
        return [];
      }
      return [trimmed];
    }
    return [];
  };

  /**
   * 加载数据
   */
  loadData = async () => {
    try {
      this.setState({ loading: true });

      // 1. 获取岗位信息
      const mySelectData = await api.getMySelect();
      const currentSelectedPost = this.getCurrentSelectedPost(mySelectData);
      const userHRMData = this.convertMySelectToUserHRMData(mySelectData);

      if (!userHRMData || !currentSelectedPost) {
        throw new Error('获取岗位信息失败');
      }

      // 使用id字段作为currentPostId
      const currentPostId =
        userHRMData.currentPostId ||
        (userHRMData.mainPost && userHRMData.mainPost.id) ||
        (userHRMData.partTimePosts &&
          userHRMData.partTimePosts[0] &&
          userHRMData.partTimePosts[0].id) ||
        (currentSelectedPost && currentSelectedPost.id);
      const currentProfessionalLevel = userHRMData.professionalLevel || 'P0';
      const currentManagementLevel = userHRMData.managementLevel || 'M0';

      // 2. 获取学习地图数据
      const studyMapParams = {
        deptId: currentSelectedPost.deptId || mySelectData.deptId,
        postDutyId: currentSelectedPost.postDutyId || mySelectData.postDutyId,
        postLevelMId:
          currentSelectedPost.postLevelMId || mySelectData.postLevelMId,
        postLevelPId:
          currentSelectedPost.postLevelPId || mySelectData.postLevelPId,
      };

      const studyMapData = await api.getStudyMap(studyMapParams);

      // 3. 转换数据格式
      const pathData = this.convertStudyMapToPathData(studyMapData);
      const knowledgeSkills =
        this.convertStudyMapToKnowledgeSkills(studyMapData);

      // 获取当前选中岗位的postLevelPId和postLevelMId（用于判断点位高亮）
      const initialPostLevelPId =
        currentSelectedPost.postLevelPId || mySelectData.postLevelPId;
      const initialPostLevelMId =
        currentSelectedPost.postLevelMId || mySelectData.postLevelMId;

      this.setState({
        userHRMData,
        postAbilityMap: {
          postId: currentPostId,
          postName: userHRMData.postName,
          ...pathData,
        },
        leadershipModel: {
          ...pathData,
        },
        knowledgeSkills,
        currentPostId,
        currentProfessionalLevel,
        currentManagementLevel,
        currentSelectedPost,
        plist: studyMapData.plist || [],
        mlist: studyMapData.mlist || [],
        initialPostLevelPId, // 首次加载时的postLevelPId，用于判断高亮
        initialPostLevelMId, // 首次加载时的postLevelMId，用于判断高亮
        loading: false,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      this.setState({ loading: false });
    }
  };

  /**
   * 切换岗位
   * @param {string} id - 岗位信息ID（postInformationList中的id字段）
   */
  handlePostChange = async (id) => {
    try {
      this.setState({ loading: true });

      // 调用切换岗位接口，传递id字段
      await api.switchMySelect(id);

      // 重新加载数据
      await this.loadData();
    } catch (error) {
      console.error('切换岗位失败:', error);
      this.setState({ loading: false });
    }
  };

  /**
   * 切换职级（点击路径点位时调用）
   * @param {Object} params - { type: 'P'|'M', level: string, index: number, postLevelId: string }
   */
  handleLevelChange = async ({ type, level, index, postLevelId }) => {
    try {
      this.setState({ loading: true, suppressRouteRecalc: true });

      const { currentSelectedPost } = this.state;
      if (!currentSelectedPost) {
        throw new Error('岗位信息不存在');
      }

      // 更新职级状态
      if (type === 'P') {
        this.setState({ currentProfessionalLevel: level });
      } else {
        this.setState({ currentManagementLevel: level });
      }

      // 构建请求参数，使用点击点位传递的postLevelId
      const studyMapParams = {
        deptId: currentSelectedPost.deptId,
        postDutyId: currentSelectedPost.postDutyId,
        postLevelMId:
          type === 'M' && postLevelId
            ? postLevelId
            : currentSelectedPost.postLevelMId,
        postLevelPId:
          type === 'P' && postLevelId
            ? postLevelId
            : currentSelectedPost.postLevelPId,
      };

      // 重新获取学习地图数据（只更新表格数据，不重新计算路径点位）
      const studyMapData = await api.getStudyMap(studyMapParams);
      const knowledgeSkills =
        this.convertStudyMapToKnowledgeSkills(studyMapData);

      // 更新表格数据，但不更新plist和mlist（保持路径点位不变）
      this.setState({
        knowledgeSkills,
        suppressRouteRecalc: false,
        loading: false,
      });
    } catch (error) {
      console.error('切换职级失败:', error);
      this.setState({ loading: false, suppressRouteRecalc: false });
    }
  };

  render() {
    const {
      userHRMData,
      postAbilityMap,
      leadershipModel,
      knowledgeSkills,
      currentPostId,
      currentProfessionalLevel,
      currentManagementLevel,
    } = this.state;

    if (
      !userHRMData ||
      !postAbilityMap ||
      !leadershipModel ||
      !knowledgeSkills
    ) {
      return <LearningMapLoading />;
    }

    return (
      <div className={style['learning-map-container']}>
        {/* <HeaderMainSearch /> */}
        <div className={style['learning-map-content']}>
          <Header
            userHRMData={userHRMData}
            currentPostId={currentPostId}
            currentProfessionalLevel={currentProfessionalLevel}
            currentManagementLevel={currentManagementLevel}
            onPostChange={this.handlePostChange}
            onViewCompetenceModel={() => {
              this.props.history.push('/learn/competence-model');
            }}
          />
          <LearningPath
            postAbilityMap={postAbilityMap}
            leadershipModel={leadershipModel}
            currentProfessionalLevel={currentProfessionalLevel}
            currentManagementLevel={currentManagementLevel}
            plist={this.state.plist || []}
            mlist={this.state.mlist || []}
            initialPostLevelPId={this.state.initialPostLevelPId}
            initialPostLevelMId={this.state.initialPostLevelMId}
            onLevelChange={this.handleLevelChange}
          />
          <StudyForm
            key={`${currentPostId}-${currentProfessionalLevel}-${currentManagementLevel}`}
            knowledgeSkills={knowledgeSkills}
            userSubjectStage={userHRMData.subjectStage}
            onCourseClick={(courseId) => {
              this.props.history.push(`/course/record/${courseId}`);
            }}
            onBookClick={(bookId) => {
              this.props.history.push(`/book-detail/${bookId}`);
            }}
          />
        </div>
      </div>
    );
  }
}

export default (props) => (
  <AppUserContext.Consumer>
    {({ user }) => <LearningMap {...props} user={user} />}
  </AppUserContext.Consumer>
);
