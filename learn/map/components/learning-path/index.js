import React, { Component } from 'react';
import { getLevelPosition, extractLevelNumber } from '../../utils';
import style from './style.css';
import bgImage from '@/assets/imgs/home/bg.png';
import guaImage from '@/assets/imgs/home/gua.png';
import PActiveImage from '@/assets/imgs/home/P_active.png';
import MActiveImage from '@/assets/imgs/home/M_active.png';
import grayImage from '@/assets/imgs/home/gray.png';
import pCardImage from '@/assets/imgs/home/p_card.png';
import mCardImage from '@/assets/imgs/home/m_card.png';
import professionSvg from '@/assets/imgs/home/profession.svg';
import manageSvg from '@/assets/imgs/home/manage.svg';

class LearningPath extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pGuaguaAnimating: false,
      pGuaguaPosition: { x: 0, y: 0 },
      mGuaguaAnimating: false,
      mGuaguaPosition: { x: 0, y: 0 },
      debugMode: false, // 调试模式开关
      clickedPoint: null, // 点击的坐标点
    };
    this.pAnimationTimer = null;
    this.mAnimationTimer = null;
    this.svgRef = React.createRef(); // SVG引用
  }

  componentDidMount() {
    this.initGuaguaPosition();
  }

  componentDidUpdate(prevProps) {
    // 只在props真正变化时才移动对应的呱呱，从当前位置移动
    const {
      plist = [],
      mlist = [],
      currentProfessionalLevel,
      currentManagementLevel,
    } = this.props;

    // 检查P序列变化
    if (
      prevProps.currentProfessionalLevel !== currentProfessionalLevel ||
      prevProps.plist !== plist
    ) {
      const { initialPostLevelPId } = this.props;
      const pPoints = this.getProfessionalPathPoints();
      let currentPIndex = -1;

      if (initialPostLevelPId && plist.length > 0) {
        const selectedPListIndex = plist.findIndex(
          (item) =>
            (item.postLevelPId || item.postLevelId) === initialPostLevelPId
        );
        if (selectedPListIndex >= 0) {
          currentPIndex = this.getPointIndexByListIndex(
            selectedPListIndex,
            plist.length,
            pPoints
          );
        }
      }

      if (currentPIndex >= 0 && currentPIndex < pPoints.length) {
        this.animateGuagua('P', currentPIndex, pPoints, false);
      }
    }

    // 检查M序列变化
    if (
      prevProps.currentManagementLevel !== currentManagementLevel ||
      prevProps.mlist !== mlist
    ) {
      const { initialPostLevelMId } = this.props;
      const pPoints = this.getProfessionalPathPoints();
      const mPoints = this.getManagementPathPoints();
      // 当只有管理序列时，使用专业序列的坐标
      const effectiveMPoints =
        mlist.length > 0 && plist.length === 0 ? pPoints : mPoints;
      let currentMIndex = -1;

      if (initialPostLevelMId && mlist.length > 0) {
        const selectedMListIndex = mlist.findIndex(
          (item) =>
            (item.postLevelMId || item.postLevelId) === initialPostLevelMId
        );
        if (selectedMListIndex >= 0) {
          currentMIndex = this.getPointIndexByListIndex(
            selectedMListIndex,
            mlist.length,
            effectiveMPoints
          );
        }
      }

      if (currentMIndex >= 0 && currentMIndex < effectiveMPoints.length) {
        this.animateGuagua('M', currentMIndex, effectiveMPoints, false);
      }
    }
  }

  componentWillUnmount() {
    if (this.pAnimationTimer) {
      clearInterval(this.pAnimationTimer);
    }
    if (this.mAnimationTimer) {
      clearInterval(this.mAnimationTimer);
    }
  }

  initGuaguaPosition = () => {
    const {
      plist = [],
      mlist = [],
      initialPostLevelPId,
      initialPostLevelMId,
    } = this.props;

    const pPoints = this.getProfessionalPathPoints();
    const mPoints = this.getManagementPathPoints();
    // 当只有管理序列时，使用专业序列的坐标
    const effectiveMPoints =
      mlist.length > 0 && plist.length === 0 ? pPoints : mPoints;

    // 找到当前选中级别在列表中的索引位置
    let selectedPListIndex = -1;
    if (initialPostLevelPId && plist.length > 0) {
      const foundIndex = plist.findIndex(
        (item) =>
          (item.postLevelPId || item.postLevelId) === initialPostLevelPId
      );
      if (foundIndex >= 0) {
        selectedPListIndex = foundIndex;
      }
    }

    let selectedMListIndex = -1;
    if (initialPostLevelMId && mlist.length > 0) {
      const foundIndex = mlist.findIndex(
        (item) =>
          (item.postLevelMId || item.postLevelId) === initialPostLevelMId
      );
      if (foundIndex >= 0) {
        selectedMListIndex = foundIndex;
      }
    }

    // 根据列表索引计算对应的坐标索引（只从isPosition坐标中选择）
    let currentPIndex = -1;
    if (selectedPListIndex >= 0) {
      currentPIndex = this.getPointIndexByListIndex(
        selectedPListIndex,
        plist.length,
        pPoints
      );
    }

    let currentMIndex = -1;
    if (selectedMListIndex >= 0) {
      currentMIndex = this.getPointIndexByListIndex(
        selectedMListIndex,
        mlist.length,
        effectiveMPoints
      );
    }

    // 初始化时从起点开始移动（只移动到isPosition坐标）
    if (currentPIndex >= 0 && currentPIndex < pPoints.length) {
      this.animateGuagua('P', currentPIndex, pPoints, true);
    }

    if (currentMIndex >= 0 && currentMIndex < effectiveMPoints.length) {
      this.animateGuagua('M', currentMIndex, effectiveMPoints, true);
    }
  };

  animateGuaguaAlongPath = () => {
    const { currentProfessionalLevel, currentManagementLevel } = this.props;
    const currentPIndex = extractLevelNumber(
      getLevelPosition(currentProfessionalLevel, 'P')
    );
    const currentMIndex = extractLevelNumber(
      getLevelPosition(currentManagementLevel, 'M')
    );

    const pPoints = this.getProfessionalPathPoints();
    const mPoints = this.getManagementPathPoints();

    if (currentPIndex > 0) {
      this.animateGuagua('P', currentPIndex, pPoints);
    }

    if (currentMIndex > 0) {
      this.animateGuagua('M', currentMIndex, mPoints);
    }
  };

  animateGuagua = (type, targetIndex, points, isInitial = false) => {
    const isP = type === 'P';
    const timer = isP ? this.pAnimationTimer : this.mAnimationTimer;
    const animatingKey = isP ? 'pGuaguaAnimating' : 'mGuaguaAnimating';

    // 如果正在动画中，先清除之前的定时器并重置状态
    if (timer) {
      clearInterval(timer);
      if (isP) {
        this.pAnimationTimer = null;
      } else {
        this.mAnimationTimer = null;
      }
    }

    const positionKey = isP ? 'pGuaguaPosition' : 'mGuaguaPosition';

    // 获取当前位置
    const currentPosition = this.state[positionKey];

    // 找到当前所在的点位索引
    let startIndex = 0;
    if (!isInitial && currentPosition.x > 0) {
      // 找到最接近当前位置的点位
      let minDist = Infinity;
      points.forEach((point, index) => {
        const dist = Math.sqrt(
          Math.pow(point.x - currentPosition.x, 2) +
            Math.pow(point.y - currentPosition.y, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          startIndex = index;
        }
      });
    }

    // 如果目标位置和当前位置相同，不需要移动
    if (!isInitial && startIndex === targetIndex) {
      this.setState({ [animatingKey]: false });
      return;
    }

    // 如果是初始化或者当前位置无效，从起点开始
    if (isInitial || currentPosition.x === 0) {
      startIndex = 0;
      this.setState({
        [positionKey]: points[0],
        [animatingKey]: true,
      });
    } else {
      // 立即设置为动画状态
      this.setState({ [animatingKey]: true });
    }

    // 判断移动方向：往前走还是往后退
    const isForward = targetIndex >= startIndex;
    let currentIndex = isForward ? startIndex + 1 : startIndex - 1;

    // 如果起点就是终点，直接设置位置
    if (startIndex === targetIndex) {
      this.setState({
        [positionKey]: points[targetIndex],
        [animatingKey]: false,
      });
      return;
    }

    const newTimer = setInterval(() => {
      if (isForward) {
        // 往前走
        if (currentIndex <= targetIndex) {
          this.setState({
            [positionKey]: points[currentIndex],
          });
          currentIndex++;
        } else {
          clearInterval(newTimer);
          this.setState({ [animatingKey]: false });
          // 清除定时器引用
          if (isP) {
            this.pAnimationTimer = null;
          } else {
            this.mAnimationTimer = null;
          }
        }
      } else {
        // 往后退
        if (currentIndex >= targetIndex) {
          this.setState({
            [positionKey]: points[currentIndex],
          });
          currentIndex--;
        } else {
          clearInterval(newTimer);
          this.setState({ [animatingKey]: false });
          // 清除定时器引用
          if (isP) {
            this.pAnimationTimer = null;
          } else {
            this.mAnimationTimer = null;
          }
        }
      }
    }, 100);

    if (isP) {
      this.pAnimationTimer = newTimer;
    } else {
      this.mAnimationTimer = newTimer;
    }
  };

  // 获取所有带有isPosition标志的坐标索引
  getPositionIndexes = (points) => {
    const indexes = [];
    points.forEach((point, index) => {
      if (point.isPosition === true) {
        indexes.push(index);
      }
    });
    return indexes;
  };

  // 根据节点在列表中的索引，计算对应的坐标索引（只从isPosition坐标中选择）
  getPointIndexByListIndex = (listIndex, listLength, points) => {
    if (listLength === 0 || !points) return -1;

    // 获取所有isPosition坐标的索引
    const positionIndexes = this.getPositionIndexes(points);
    if (positionIndexes.length === 0) return -1;

    if (listLength === 1) {
      // 只有1个节点时，使用第一个isPosition坐标
      return positionIndexes[0];
    }

    // 多个节点时，均匀分布到isPosition坐标中
    const positionIndex = Math.round(
      (listIndex * (positionIndexes.length - 1)) / (listLength - 1)
    );
    return positionIndexes[positionIndex];
  };

  handleLevelClick = (type, level, targetIndex, postLevelId) => {
    const isP = type === 'P';
    const animatingKey = isP ? 'pGuaguaAnimating' : 'mGuaguaAnimating';

    // 如果正在动画中，忽略点击（防止快速点击导致状态混乱）
    if (this.state[animatingKey]) {
      return;
    }

    const { plist = [], mlist = [] } = this.props;
    const pPoints = this.getProfessionalPathPoints();
    const mPoints = this.getManagementPathPoints();
    // 当只有管理序列时，使用专业序列的坐标
    const effectiveMPoints =
      mlist.length > 0 && plist.length === 0 ? pPoints : mPoints;

    const targetPoints = type === 'P' ? pPoints : effectiveMPoints;

    setTimeout(() => {
      // 从当前位置移动到目标位置
      this.animateGuagua(type, targetIndex, targetPoints, false);
    }, 100);
    // 调用父组件的onLevelChange，传递参数用于更新表格数据
    if (this.props.onLevelChange) {
      this.props.onLevelChange({
        type: type,
        level: level,
        index: targetIndex,
        postLevelId: postLevelId,
      });
    }
  };

  // 处理SVG点击，获取坐标
  handleSvgClick = (event) => {
    if (!this.state.debugMode) return;

    const svg = this.svgRef.current;
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;

    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    this.setState({
      clickedPoint: {
        x: Math.round(svgP.x),
        y: Math.round(svgP.y),
      },
    });

    console.log(`点击坐标: x: ${Math.round(svgP.x)}, y: ${Math.round(svgP.y)}`);
  };

  // ============================================================================
  // 坐标生成工具方法（可根据需要重新生成坐标）
  // ============================================================================

  /**
   * 解析SVG路径命令
   * @param {string} pathStr - SVG路径字符串
   * @returns {Array} 命令数组
   */
  parseSVGPath = (pathStr) => {
    const commands = [];
    const pattern = /([MLCQZ])\s*([-\d.,\s]+)/gi;
    let match;

    while ((match = pattern.exec(pathStr)) !== null) {
      const cmd = match[1].toUpperCase();
      const params = match[2].match(/-?\d+\.?\d*/g).map(Number);
      commands.push({ cmd, params });
    }

    return commands;
  };

  /**
   * 计算三次贝塞尔曲线上的点
   * @param {Array} p0 - 起点 [x, y]
   * @param {Array} p1 - 控制点1 [x, y]
   * @param {Array} p2 - 控制点2 [x, y]
   * @param {Array} p3 - 终点 [x, y]
   * @param {number} t - 参数 (0-1)
   * @returns {Array} 坐标 [x, y]
   */
  cubicBezier = (p0, p1, p2, p3, t) => {
    const x =
      Math.pow(1 - t, 3) * p0[0] +
      3 * Math.pow(1 - t, 2) * t * p1[0] +
      3 * (1 - t) * Math.pow(t, 2) * p2[0] +
      Math.pow(t, 3) * p3[0];
    const y =
      Math.pow(1 - t, 3) * p0[1] +
      3 * Math.pow(1 - t, 2) * t * p1[1] +
      3 * (1 - t) * Math.pow(t, 2) * p2[1] +
      Math.pow(t, 3) * p3[1];
    return [x, y];
  };

  /**
   * 从SVG路径采样坐标点
   * @param {string} pathStr - SVG路径字符串
   * @param {number} numSamples - 采样点数量
   * @returns {Array} 坐标点数组
   */
  samplePathCoordinates = (pathStr, numSamples = 11) => {
    const commands = this.parseSVGPath(pathStr);
    const densePoints = [];
    let currentPos = [0, 0];

    commands.forEach((cmdData) => {
      const { cmd, params } = cmdData;

      if (cmd === 'M') {
        currentPos = [params[0], params[1]];
        if (densePoints.length === 0) {
          densePoints.push(currentPos);
        }
      } else if (cmd === 'C') {
        const p0 = currentPos;
        const p1 = [params[0], params[1]];
        const p2 = [params[2], params[3]];
        const p3 = [params[4], params[5]];

        for (let i = 0; i < 100; i++) {
          const t = i / 99;
          densePoints.push(this.cubicBezier(p0, p1, p2, p3, t));
        }
        currentPos = p3;
      }
    });

    // 均匀采样
    const samples = [];
    const step = (densePoints.length - 1) / (numSamples - 1);
    for (let i = 0; i < numSamples; i++) {
      const index = Math.round(i * step);
      samples.push(densePoints[index]);
    }

    return samples;
  };

  /**
   * 生成完整的路径坐标（包含起点、标牌、点位、结束点）
   * @param {Array} sampledPoints - 采样点数组
   * @param {number} yOffset - Y轴偏移量
   * @returns {Array} 完整坐标数组
   */
  generateFullPathPoints = (sampledPoints, yOffset = 0) => {
    const points = [];

    // 起点（隐藏）
    points.push({
      x: Math.round(sampledPoints[0][0]) - 60,
      y: Math.round(sampledPoints[0][1]) + yOffset,
    });

    // 标牌位置（第1个采样点）
    points.push({
      x: Math.round(sampledPoints[0][0]),
      y: Math.round(sampledPoints[0][1]) + yOffset,
    });

    // 10个标注点位（第2-11个采样点）
    for (let i = 1; i < 11; i++) {
      points.push({
        x: Math.round(sampledPoints[i][0]),
        y: Math.round(sampledPoints[i][1]) + yOffset,
        isPosition: true,
      });
    }

    // 结束点
    points.push({
      x: Math.round(sampledPoints[10][0]) + 46,
      y: Math.round(sampledPoints[10][1]) + yOffset,
    });

    return points;
  };

  // ============================================================================
  // 专业路径坐标（容器500px×300px，SVG背景top=20px）
  // 标牌位置已确认：x: 30, y: 120（在路径上）
  // Y偏移计算：120 - 67 = 53（SVG原始Y + top 20 + 额外偏移33）
  // X缩放比例：500/375 = 1.333，但标牌X=30作为基准
  // viewBox: 0 0 500 300
  // ============================================================================
  getProfessionalPathPoints = () => {
    return [
      { x: -50, y: 120 }, // 索引0: 起点（隐藏，Y与标牌一致）
      { x: 30, y: 120 }, // 索引1: 标牌位置（已确认）
      { x: 80, y: 120, isPosition: true }, // 索引2: 点位1（Y=77+53）
      { x: 120, y: 120, isPosition: true }, // 索引3: 点位2（Y=74+53）
      { x: 160, y: 115, isPosition: true }, // 索引4: 点位3（Y=62+53）
      { x: 169, y: 59, isPosition: true }, // 索引5: 点位4（Y=48+53）
      { x: 215, y: 57, isPosition: true }, // 索引6: 点位5（Y=33+53）
      { x: 258, y: 69, isPosition: true }, // 索引7: 点位6（Y=29+53）
      { x: 300, y: 80, isPosition: true }, // 索引8: 点位7（Y=48+53）
      { x: 350, y: 84, isPosition: true }, // 索引9: 点位8（Y=42+53）
      { x: 402, y: 76, isPosition: true }, // 索引10: 点位9（Y=27+53）
      { x: 460, y: 57, isPosition: true }, // 索引11: 点位10（Y=7+53）
      { x: 490, y: 60 }, // 索引12: 结束点
    ];
  };

  // ============================================================================
  // 管理路径坐标（容器500px×300px，SVG背景top=150px）
  // 标牌位置已确认：x: 30, y: 245（在路径上）
  // Y偏移计算：245 - 63 = 182（SVG原始Y + top 150 + 额外偏移32）
  // X缩放比例：500/375 = 1.333，但标牌X=30作为基准
  // viewBox: 0 0 500 300
  // ============================================================================
  getManagementPathPoints = () => {
    return [
      { x: -50, y: 245 }, // 索引0: 起点（隐藏，Y与标牌一致）
      { x: 30, y: 242 }, // 索引1: 标牌位置（已确认）
      { x: 75, y: 240, isPosition: true }, // 索引2: 点位1（Y=71+182）
      { x: 116, y: 242, isPosition: true }, // 索引3: 点位2（Y=67+182）
      { x: 166, y: 242, isPosition: true }, // 索引4: 点位3（Y=55+182）
      { x: 213, y: 235, isPosition: true }, // 索引5: 点位4（Y=40+182）
      { x: 217, y: 180, isPosition: true }, // 索引6: 点位5（Y=25+182）
      { x: 269, y: 169, isPosition: true }, // 索引7: 点位6（Y=16+182）
      { x: 311, y: 176, isPosition: true }, // 索引8: 点位7（Y=28+182）
      { x: 357, y: 183, isPosition: true }, // 索引9: 点位8（Y=22+182）
      { x: 409, y: 186, isPosition: true }, // 索引10: 点位9（Y=15+182）
      { x: 462, y: 176, isPosition: true }, // 索引11: 点位10（Y=11+182）
      { x: 490, y: 193 }, // 索引12: 结束点
    ];
  };

  render() {
    const {
      postAbilityMap,
      leadershipModel,
      currentProfessionalLevel,
      currentManagementLevel,
      plist = [],
      mlist = [],
      initialPostLevelPId,
      initialPostLevelMId,
    } = this.props;
    const {
      pGuaguaAnimating,
      pGuaguaPosition,
      mGuaguaAnimating,
      mGuaguaPosition,
    } = this.state;

    if (!postAbilityMap || !leadershipModel) return null;

    const currentPLevel = getLevelPosition(currentProfessionalLevel, 'P');
    const currentMLevel = getLevelPosition(currentManagementLevel, 'M');

    const currentPLevelNumber = extractLevelNumber(currentPLevel);
    const currentMLevelNumber = extractLevelNumber(currentMLevel);

    const pPoints = this.getProfessionalPathPoints();
    const mPoints = this.getManagementPathPoints();

    // 根据plist和mlist动态渲染点位
    const pListLength = Array.isArray(plist) ? plist.length : 0;
    const mListLength = Array.isArray(mlist) ? mlist.length : 0;

    // 调试信息：打印mlist数据
    if (mListLength > 0) {
    }

    // 找到当前选中级别在列表中的索引位置（用于判断高亮）
    let selectedPIndex = -1;
    if (initialPostLevelPId && pListLength > 0) {
      const foundIndex = plist.findIndex(
        (item) =>
          (item.postLevelPId || item.postLevelId) === initialPostLevelPId
      );
      if (foundIndex >= 0) {
        selectedPIndex = foundIndex;
      }
    }

    let selectedMIndex = -1;
    if (initialPostLevelMId && mListLength > 0) {
      const foundIndex = mlist.findIndex(
        (item) =>
          (item.postLevelMId || item.postLevelId) === initialPostLevelMId
      );
      if (foundIndex >= 0) {
        selectedMIndex = foundIndex;
      }
    }

    const showPGuagua = currentPLevelNumber > 0 && pGuaguaPosition.x > 0;
    const showMGuagua = currentMLevelNumber > 0 && mGuaguaPosition.x > 0;

    // 判断是否只有一条序列
    const hasOnlyMList = mListLength > 0 && pListLength === 0;
    const hasBothLists = pListLength > 0 && mListLength > 0;

    // 当只有管理序列时，使用专业序列的路径坐标
    const effectiveMPoints = hasOnlyMList ? pPoints : mPoints;

    // 动态高度：一条序列200px，两条序列300px
    const containerHeight = hasBothLists ? 300 : 200;
    const viewBoxHeight = hasBothLists ? 300 : 200;

    return (
      <div className={style['learning-path-container']}>
        {/* 调试控制面板 */}
        {this.state.debugMode && (
          <div
            style={{
              position: 'fixed',
              right: '10px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              zIndex: 9999,
              fontSize: '12px',
              minWidth: '200px',
              bottom: '0px',
            }}
          >
            <div
              style={{
                marginBottom: '10px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              调试工具
            </div>
            <div style={{ marginBottom: '5px' }}>
              <button
                onClick={() => this.setState({ debugMode: false })}
                style={{
                  padding: '5px 10px',
                  background: '#E60027',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                关闭调试模式
              </button>
            </div>
            {this.state.clickedPoint && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  点击坐标：
                </div>
                <div>X: {this.state.clickedPoint.x}</div>
                <div>Y: {this.state.clickedPoint.y}</div>
                <div
                  style={{ marginTop: '5px', fontSize: '10px', color: '#aaa' }}
                >
                  点击SVG获取坐标
                </div>
              </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
              <div>• 红色点：专业路径</div>
              <div>• 橙色点：管理路径</div>
              <div>• 灰色点：起点/终点</div>
              <div>• 网格：50px间距</div>
            </div>
          </div>
        )}

        <div
          className={style['path-background']}
          style={{
            backgroundImage: `url(${bgImage})`,
            height: `${containerHeight}px`,
          }}
        >
          {/* 专业序列SVG背景 - 当有专业序列或只有管理序列时都显示 */}
          {(pListLength > 0 || hasOnlyMList) && (
            <img
              src={professionSvg}
              alt='专业路径'
              style={{
                position: 'absolute',
                top: '20px',
                left: '0',
                width: '500px',
                height: 'auto',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* 管理序列SVG背景 - 只在有两条序列时显示 */}
          {hasBothLists && (
            <img
              src={manageSvg}
              alt='管理路径'
              style={{
                position: 'absolute',
                top: '150px',
                left: '0',
                width: '500px',
                height: 'auto',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          <svg
            ref={this.svgRef}
            className={style['path-svg']}
            viewBox={`0 0 500 ${viewBoxHeight}`}
            preserveAspectRatio='xMinYMin meet'
            style={{
              position: 'relative',
              zIndex: 2,
              cursor: this.state.debugMode ? 'crosshair' : 'default',
            }}
            onClick={this.handleSvgClick}
          >
            {/* ========== 调试工具：坐标系统 ========== */}
            {this.state.debugMode && (
              <g id='debug-grid'>
                {/* 背景 */}
                <rect
                  x='0'
                  y='0'
                  width='500'
                  height={viewBoxHeight}
                  fill='rgba(255,255,255,0.3)'
                />

                {/* 网格线 - 每50px一条 */}
                {Array.from({ length: 11 }, (_, i) => i * 50).map((x) => (
                  <line
                    key={`vline-${x}`}
                    x1={x}
                    y1='0'
                    x2={x}
                    y2={viewBoxHeight}
                    stroke='#ddd'
                    strokeWidth='1'
                    strokeDasharray='2,2'
                  />
                ))}
                {Array.from(
                  { length: Math.ceil(viewBoxHeight / 50) + 1 },
                  (_, i) => i * 50
                ).map((y) => (
                  <line
                    key={`hline-${y}`}
                    x1='0'
                    y1={y}
                    x2='500'
                    y2={y}
                    stroke='#ddd'
                    strokeWidth='1'
                    strokeDasharray='2,2'
                  />
                ))}

                {/* X轴 */}
                <line
                  x1='0'
                  y1='0'
                  x2='500'
                  y2='0'
                  stroke='#666'
                  strokeWidth='2'
                />
                <text
                  x='490'
                  y='-5'
                  fontSize='12'
                  fill='#666'
                  fontWeight='bold'
                >
                  X
                </text>

                {/* Y轴 */}
                <line
                  x1='0'
                  y1='0'
                  x2='0'
                  y2={viewBoxHeight}
                  stroke='#666'
                  strokeWidth='2'
                />
                <text x='5' y='15' fontSize='12' fill='#666' fontWeight='bold'>
                  Y
                </text>

                {/* X轴刻度 */}
                {Array.from({ length: 11 }, (_, i) => i * 50).map((x) => (
                  <g key={`xlabel-${x}`}>
                    <line
                      x1={x}
                      y1='0'
                      x2={x}
                      y2='5'
                      stroke='#666'
                      strokeWidth='1'
                    />
                    <text
                      x={x}
                      y='18'
                      fontSize='10'
                      fill='#666'
                      textAnchor='middle'
                    >
                      {x}
                    </text>
                  </g>
                ))}

                {/* Y轴刻度 */}
                {Array.from(
                  { length: Math.ceil(viewBoxHeight / 50) + 1 },
                  (_, i) => i * 50
                ).map((y) => (
                  <g key={`ylabel-${y}`}>
                    <line
                      x1='0'
                      y1={y}
                      x2='5'
                      y2={y}
                      stroke='#666'
                      strokeWidth='1'
                    />
                    <text x='8' y={y + 4} fontSize='10' fill='#666'>
                      {y}
                    </text>
                  </g>
                ))}

                {/* 点击坐标显示 */}
                {this.state.clickedPoint && (
                  <g>
                    <circle
                      cx={this.state.clickedPoint.x}
                      cy={this.state.clickedPoint.y}
                      r='8'
                      fill='red'
                      opacity='0.6'
                    />
                    <text
                      x={this.state.clickedPoint.x + 15}
                      y={this.state.clickedPoint.y - 10}
                      fontSize='14'
                      fill='red'
                      fontWeight='bold'
                      style={{ textShadow: '0 0 3px white' }}
                    >
                      {`(${this.state.clickedPoint.x}, ${this.state.clickedPoint.y})`}
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* 专业路径 - 只在plist不为空时渲染 */}
            {pListLength > 0 && (
              <g>
                {/* 专业序列标牌 - 占据索引1 */}
                <image
                  href={pCardImage}
                  x={pPoints[1].x - 20}
                  y={pPoints[1].y - 55}
                  width='68'
                  height='53'
                />
              </g>
            )}

            {/* 管理路径 - 只在mlist不为空时渲染 */}
            {mListLength > 0 && (
              <g>
                {/* 管理序列标牌 - 当只有管理序列时使用专业序列坐标 */}
                <image
                  href={mCardImage}
                  x={effectiveMPoints[1].x - 20}
                  y={effectiveMPoints[1].y - 55}
                  width='68'
                  height='53'
                />
              </g>
            )}

            {/* 专业路径点位 - 根据plist动态渲染，只使用isPosition坐标 */}
            {pListLength > 0 &&
              plist.map((plistItem, index) => {
                // 计算当前节点应该映射到哪个坐标索引（只从isPosition坐标中选择）
                const pointIndex = this.getPointIndexByListIndex(
                  index,
                  pListLength,
                  pPoints
                );

                if (pointIndex < 0 || pointIndex >= pPoints.length) {
                  return null;
                }

                const point = pPoints[pointIndex];
                if (!point || !point.isPosition) {
                  return null;
                }

                const levelName =
                  (plistItem &&
                    (plistItem.postLevelPName ||
                      plistItem.postLevelMName ||
                      plistItem.postLevelName)) ||
                  `P${index + 1}`;
                const postLevelId =
                  plistItem &&
                  (plistItem.postLevelId || plistItem.postLevelPId);
                // 判断是否高亮：小于等于当前选中级别的点位都高亮（只根据首次数据判断）
                const isAchieved =
                  selectedPIndex >= 0 && index <= selectedPIndex;
                const iconImage = isAchieved ? PActiveImage : grayImage;
                return (
                  <g
                    key={`p-${index}-${postLevelId || index}`}
                    onClick={() =>
                      this.handleLevelClick(
                        'P',
                        levelName,
                        pointIndex,
                        postLevelId
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    {/* 扩大点击区域的透明矩形 */}
                    <rect
                      x={point.x - 25}
                      y={point.y - 45}
                      width='50'
                      height='60'
                      fill='transparent'
                      style={{ cursor: 'pointer' }}
                    />
                    <image
                      href={iconImage}
                      x={point.x - 15}
                      y={point.y - 35}
                      width='26'
                      height='38'
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={point.x - 1}
                      y={point.y - 18}
                      textAnchor='middle'
                      fontSize='12'
                      fill={isAchieved ? '#E60027' : '#999'}
                      fontWeight='bold'
                      style={{ pointerEvents: 'none' }}
                    >
                      {levelName}
                    </text>
                  </g>
                );
              })}

            {/* 管理路径点位 - 根据mlist动态渲染，只使用isPosition坐标 */}
            {mListLength > 0 &&
              mlist.map((mlistItem, index) => {
                // 计算当前节点应该映射到哪个坐标索引（只从isPosition坐标中选择）
                // 当只有管理序列时，使用专业序列的坐标
                const pointIndex = this.getPointIndexByListIndex(
                  index,
                  mListLength,
                  effectiveMPoints
                );

                if (pointIndex < 0 || pointIndex >= effectiveMPoints.length) {
                  return null;
                }

                const point = effectiveMPoints[pointIndex];
                if (!point || !point.isPosition) {
                  return null;
                }

                const levelName =
                  (mlistItem &&
                    (mlistItem.postLevelMName || mlistItem.postLevelName)) ||
                  `M${index + 1}`;
                const postLevelId =
                  mlistItem &&
                  (mlistItem.postLevelId || mlistItem.postLevelMId);
                // 判断是否高亮：小于等于当前选中级别的点位都高亮（只根据首次数据判断）
                const isAchieved =
                  selectedMIndex >= 0 && index <= selectedMIndex;
                const iconImage = isAchieved ? MActiveImage : grayImage;
                return (
                  <g
                    key={`m-${index}-${postLevelId || index}`}
                    onClick={() =>
                      this.handleLevelClick(
                        'M',
                        levelName,
                        pointIndex,
                        postLevelId
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    {/* 扩大点击区域的透明矩形 */}
                    <rect
                      x={point.x - 25}
                      y={point.y - 45}
                      width='50'
                      height='60'
                      fill='transparent'
                      style={{ cursor: 'pointer' }}
                    />
                    <image
                      href={iconImage}
                      x={point.x - 15}
                      y={point.y - 35}
                      width='26'
                      height='38'
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={point.x - 1}
                      y={point.y - 18}
                      textAnchor='middle'
                      fontSize='12'
                      fill={isAchieved ? '#FF8C00' : '#999'}
                      fontWeight='bold'
                      style={{ pointerEvents: 'none' }}
                    >
                      {levelName}
                    </text>
                  </g>
                );
              })}

            {/* 专业路径呱呱 - 只在plist不为空且满足显示条件时渲染 */}
            {pListLength > 0 && showPGuagua && (
              <image
                href={guaImage}
                x={pGuaguaPosition.x - 0}
                y={pGuaguaPosition.y - 35}
                width='40'
                height='40'
                className={
                  pGuaguaAnimating ? style['guagua-moving'] : style['guagua']
                }
              />
            )}

            {/* 管理路径呱呱 - 只在mlist不为空且满足显示条件时渲染 */}
            {mListLength > 0 && showMGuagua && (
              <image
                href={guaImage}
                x={mGuaguaPosition.x - 0}
                y={mGuaguaPosition.y - 35}
                width='40'
                height='40'
                className={
                  mGuaguaAnimating ? style['guagua-moving'] : style['guagua']
                }
              />
            )}
          </svg>
        </div>
      </div>
    );
  }
}

export default LearningPath;
