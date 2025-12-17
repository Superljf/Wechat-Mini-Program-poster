import React, { Component } from 'react';
import ReactEcharts from 'echarts-for-react';
import style from './style.css';

class RadarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeAbilityTypeId: null,
    };
  }

  componentDidMount() {
    const { competenceModel } = this.props;
    if (
      competenceModel &&
      competenceModel.abilityTypes &&
      competenceModel.abilityTypes.length > 0
    ) {
      const validAbilityTypes = competenceModel.abilityTypes.filter(
        (type) => type.knowledgeSkills && type.knowledgeSkills.length > 0
      );
      if (validAbilityTypes.length > 0) {
        this.setState({ activeAbilityTypeId: validAbilityTypes[0].id });
      }
    }
  }

  handleAbilityTypeClick = (id) => {
    this.setState({ activeAbilityTypeId: id });
  };

  // 雷达图颜色配置
  getRadarColors = (index) => {
    const colors = [
      {
        areaColor: 'rgba(208, 2, 27, 0.2)',
        lineColor: '#D0021B',
        itemColor: '#D0021B',
        tabColor: '#D0021B',
        tabBgColor: '#FEF4F6',
        headerGradient: 'linear-gradient(180deg, #FFFFFF 0%, #FEF4F6 100%)',
      },
      {
        areaColor: 'rgba(238, 161, 32, 0.2)',
        lineColor: '#EEA120',
        itemColor: '#EEA120',
        tabColor: '#EEA120',
        tabBgColor: '#FFF9F2',
        headerGradient:
          'linear-gradient(180deg, rgba(255,239,218,0) 0%, #FFF9F2 100%)',
      },
      {
        areaColor: 'rgba(23, 194, 128, 0.2)',
        lineColor: '#17C280',
        itemColor: '#17C280',
        tabColor: '#17C280',
        tabBgColor: '#EAFCF0',
        headerGradient: 'linear-gradient(180deg, #EAFCF0 0%, #FFFFFF 100%)',
      },
      {
        areaColor: 'rgba(63, 123, 248, 0.2)',
        lineColor: '#3F7BF8',
        itemColor: '#3F7BF8',
        tabColor: '#3F7BF8',
        tabBgColor: '#F4F7FF',
        headerGradient:
          'linear-gradient(180deg, rgba(244,247,255,0) 0%, #F4F7FF 100%)',
      },
    ];
    return colors[index % colors.length];
  };

  getRadarOption = (abilityType, index) => {
    if (
      !abilityType ||
      !abilityType.knowledgeSkills ||
      abilityType.knowledgeSkills.length === 0
    ) {
      return null;
    }

    const indicators = abilityType.knowledgeSkills.map((ks) => ({
      name: ks.name,
      max: 10,
    }));

    const data = abilityType.knowledgeSkills.map((ks) => ks.score || 0);
    const colors = this.getRadarColors(index);

    return {
      radar: {
        indicator: indicators,
        center: ['50%', '50%'],
        radius: '65%',
        name: {
          formatter: (name) => {
            const max = 5;
            if (name.length <= max) return name;
            return name.match(new RegExp(`.{1,${max}}`, 'g')).join('\n');
          },
          textStyle: {
            color: '#333',
            fontSize: 12,
          },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(250, 250, 250, 0.3)', 'rgba(200, 200, 200, 0.3)'],
          },
        },
        splitLine: {
          lineStyle: {
            color: '#e5e5e5',
          },
        },
        axisLine: {
          lineStyle: {
            color: '#e5e5e5',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: data,
              name: abilityType.name,
              areaStyle: {
                color: colors.areaColor,
              },
              // label: {
              //   show: true,
              //   formatter: ({ value, dimensionIndex }) => value[dimensionIndex],
              //   color: '#333',
              //   fontSize: 12,
              // },
              lineStyle: {
                color: colors.lineColor,
                width: 2,
              },
              itemStyle: {
                color: colors.itemColor,
              },
            },
          ],
        },
      ],
    };
  };

  render() {
    const { competenceModel } = this.props;
    const { activeAbilityTypeId } = this.state;

    if (!competenceModel || !competenceModel.abilityTypes) {
      return null;
    }

    // 过滤掉没有知识技能的能力类型
    const validAbilityTypes = competenceModel.abilityTypes.filter(
      (type) => type.knowledgeSkills && type.knowledgeSkills.length > 0
    );

    if (validAbilityTypes.length === 0) {
      return null;
    }

    // 获取当前激活的能力类型
    let activeIndex = validAbilityTypes.findIndex(
      (type) => type.id === activeAbilityTypeId
    );
    // 如果找不到，默认使用第一个
    if (activeIndex === -1) {
      activeIndex = 0;
    }
    const activeAbilityType = validAbilityTypes[activeIndex];
    const option = this.getRadarOption(activeAbilityType, activeIndex);

    return (
      <div className={style['radar-chart-container']}>
        <div className={style['radar-chart-title']}>
          <span className={style['title-bar']}></span>
          岗位胜任力模型
        </div>

        {/* Tab切换 */}
        <div className={style['ability-types-tabs']}>
          {validAbilityTypes.map((type, idx) => {
            const colors = this.getRadarColors(idx);
            const isActive = activeAbilityTypeId === type.id;
            return (
              <div
                key={type.id}
                className={`${style['tab-item']} ${
                  isActive ? style['tab-item-active'] : ''
                } ${isActive ? style[`tab-color-${idx % 5}`] : ''}`}
                style={
                  isActive
                    ? {
                        color: colors.tabColor,
                        backgroundColor: colors.tabBgColor,
                      }
                    : {}
                }
                onClick={() => this.handleAbilityTypeClick(type.id)}
              >
                {type.name}
              </div>
            );
          })}
        </div>

        {/* 雷达图展示 */}
        {option && (
          <div className={style['radar-chart-item']}>
            <div
              className={style['radar-chart-header']}
              style={{
                background: this.getRadarColors(activeIndex).headerGradient,
              }}
            >
              <span
                className={style['chart-title-icon']}
                style={{
                  borderColor: this.getRadarColors(activeIndex).lineColor,
                  '--dot-color': this.getRadarColors(activeIndex).lineColor,
                }}
              ></span>
              <span className={style['chart-title-text']}>
                {activeAbilityType.name}
              </span>
            </div>
            <div className={style['radar-chart-content']}>
              <ReactEcharts
                option={option}
                style={{ height: '300px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default RadarChart;
