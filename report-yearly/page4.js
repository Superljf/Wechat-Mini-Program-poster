import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import html2canvas from 'html2canvas';
import axiosIns from '@/utils/axios-instance';
import style from './style.css';
import { gsap } from 'gsap';

class Page4 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isGenerating: false,
      saveImgSrc: '',
      loadingImage: false,
      isShow: false,
    };
    this.rootRef = React.createRef();
    this.posterCardRef = React.createRef(); // 展示用
    this.screenshotCardRef = React.createRef(); // 截图用

    this.mainTimeline = null;
    this.keywordLoopTimeline = null;
    this.buttonLoopTimeline = null;
    this.numberLoopTimeline = null;
  }

  componentDidMount() {
    // 初始加载时，如果是激活状态就播放动画
    if (this.props.isActive) {
      this.setState({
        saveImgSrc: '',
      });
      this.ensureShowAndPlay();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // 当页面从不激活变为激活时，重新播放动画
    if (!prevProps.isActive && this.props.isActive) {
      this.ensureShowAndPlay();
    }

    // 页面从激活变为不激活：停止动画，避免后台一直跑
    if (prevProps.isActive && !this.props.isActive) {
      this.killAnimations();
      if (this.state.isShow) {
        this.setState({ isShow: false });
      }
      this.setState({
        saveImgSrc: '',
      });
    }

    // 切到预览图时，页面元素会消失，清理循环动画避免报错/占用
    if (!prevState.saveImgSrc && this.state.saveImgSrc) {
      this.killAnimations();
    }
  }

  componentWillUnmount() {
    this.killAnimations();
  }

  killAnimations = () => {
    if (this.mainTimeline) {
      this.mainTimeline.kill();
      this.mainTimeline = null;
    }
    if (this.keywordLoopTimeline) {
      this.keywordLoopTimeline.kill();
      this.keywordLoopTimeline = null;
    }
    if (this.buttonLoopTimeline) {
      this.buttonLoopTimeline.kill();
      this.buttonLoopTimeline = null;
    }
    if (this.numberLoopTimeline) {
      this.numberLoopTimeline.kill();
      this.numberLoopTimeline = null;
    }

    const root = this.rootRef.current;
    if (!root) return;
    // 兜底清理：避免重复进入页面叠加动画
    gsap.killTweensOf(root.querySelectorAll('*'));
  };

  ensureShowAndPlay = () => {
    // 只在“展示海报卡片”状态才播放
    if (this.state.saveImgSrc) return;

    // 关键：先把 DOM 渲染出来（isShow=true），再同步 playAnimation，
    // 让 gsap.set 在首帧渲染前就把元素置为初始状态，避免“先闪一下完整DOM”
    if (!this.state.isShow) {
      this.setState({ isShow: true }, () => {
        this.playAnimation();
      });
      return;
    }

    this.playAnimation();
  };

  playAnimation = () => {
    // 只在“展示海报卡片”状态才播放
    if (this.state.saveImgSrc) return;

    this.killAnimations();

    const root = this.rootRef.current;
    const card = this.posterCardRef.current;
    if (!root || !card) return;

    const bg = root.querySelector(`.${style['page4-bg']}`);
    const header = root.querySelector(`.${style['page4-header']}`);
    const title = root.querySelector(`.${style['page4-header-title']}`);
    const keywordWrap = card.querySelector(`.${style['page4-keyword-image']}`);
    const keywordImg = card.querySelector(`.${style['page4-keyword']}`);
    const statItems = card.querySelectorAll(`.${style['page4-stat-item']}`);
    const statNumbers = card.querySelectorAll(`.${style['page4-stat-number']}`);
    const btn = root.querySelector(`.${style['page4-btn-save']}`);

    // 初始状态（舒缓，不夸张）
    if (bg) gsap.set(bg, { opacity: 0, scale: 1.03 });
    if (header) gsap.set(header, { opacity: 0, y: -16 });
    if (title) gsap.set(title, { opacity: 0.001 }); // 保留 CSS 发光，但先淡入
    gsap.set(card, { opacity: 0, y: 24, scale: 0.985 });
    if (keywordWrap) gsap.set(keywordWrap, { opacity: 0, y: 10 });
    if (statItems && statItems.length)
      gsap.set(statItems, { opacity: 0, y: 14 });
    if (btn) gsap.set(btn, { opacity: 0, y: 18, scale: 0.96 });

    this.mainTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // 1) 背景淡入 + 轻微回到原尺寸
    if (bg) {
      this.mainTimeline.to(bg, { opacity: 1, scale: 1, duration: 1.25 });
    }

    // 2) 标题容器下落淡入（更舒缓）
    if (header) {
      this.mainTimeline.to(
        header,
        { opacity: 1, y: 0, duration: 0.95 },
        '-=0.9'
      );
    }
    if (title) {
      this.mainTimeline.to(title, { opacity: 1, duration: 0.65 }, '-=0.75');
    }

    // 3) 卡片上浮出现
    this.mainTimeline.to(
      card,
      { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: 'power2.out' },
      '-=0.55'
    );

    // 4) 关键词区域淡入
    if (keywordWrap) {
      this.mainTimeline.to(
        keywordWrap,
        { opacity: 1, y: 0, duration: 0.85 },
        '-=0.55'
      );
    }

    // 5) 数据块依次出现
    if (statItems && statItems.length) {
      this.mainTimeline.to(
        statItems,
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.22, ease: 'power2.out' },
        '-=0.35'
      );
    }

    // 6) 保存按钮出现（轻回弹）
    if (btn) {
      this.mainTimeline.to(
        btn,
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.35)' },
        '-=0.25'
      );
    }

    // 7) 持续动效（轻、慢）
    this.mainTimeline.add(() => {
      if (keywordImg) {
        // 更明显、更活泼：浮动 + 轻摆 + 呼吸缩放（循环）
        gsap.set(keywordImg, { y: 0, scale: 1, rotation: 0 });
        this.keywordLoopTimeline = gsap.timeline({ repeat: -1 });
        this.keywordLoopTimeline
          .to(keywordImg, {
            y: -14,
            scale: 1.08,
            rotation: 3,
            duration: 0.65,
            ease: 'power2.out',
          })
          .to(keywordImg, {
            y: 6,
            scale: 0.98,
            rotation: -2,
            duration: 0.75,
            ease: 'sine.inOut',
          })
          .to(keywordImg, {
            y: 0,
            scale: 1,
            rotation: 0,
            duration: 0.55,
            ease: 'back.out(1.6)',
          })
          .to({}, { duration: 0.35 }); // 小停顿，呼吸感更明显
      }

      if (statNumbers && statNumbers.length) {
        // 更明显：数字“依次弹一下”的波浪效果（循环）
        statNumbers.forEach((el) => gsap.set(el, { y: 0, scale: 1 }));
        this.numberLoopTimeline = gsap.timeline({ repeat: -1 });
        statNumbers.forEach((el, idx) => {
          this.numberLoopTimeline
            .to(
              el,
              {
                y: -8,
                scale: 1.16,
                duration: 0.28,
                ease: 'power2.out',
              },
              idx === 0 ? 0 : '-=0.12'
            )
            .to(
              el,
              {
                y: 0,
                scale: 1,
                duration: 0.46,
                ease: 'bounce.out',
              },
              '-=0.04'
            );
        });
        this.numberLoopTimeline.to({}, { duration: 0.5 }); // 每轮结束停一下
      }

      if (btn) {
        this.buttonLoopTimeline = gsap.timeline({ repeat: -1, yoyo: true });
        this.buttonLoopTimeline.to(btn, {
          scale: 1.045,
          duration: 0.75,
          ease: 'sine.inOut',
        });
      }

      // 入场动画完成：通知父组件（用于解锁下一页/显示 next）
      if (this.props.onAnimDone) this.props.onAnimDone();
    }, '+=0.1');
  };

  /* ===================== 工具函数 ===================== */

  getKeywordImage = () => {
    const { keyWord, learningHour } = this.props;

    if (keyWord !== null && keyWord !== undefined) {
      const map = {
        0: 'page4_0.png',
        1: 'page4_up.png',
        2: 'page4_pro.png',
        3: 'page4_value.png',
        4: 'page4_power.png',
        5: 'page4_power.png',
      };
      return require(`@/assets/imgs/report/${map[keyWord] || 'page4_0.png'}`);
    }

    const h = Number(learningHour || 0);
    if (h === 0) return require('@/assets/imgs/report/page4_0.png');
    if (h <= 1) return require('@/assets/imgs/report/page4_power.png');
    if (h <= 5) return require('@/assets/imgs/report/page4_up.png');
    if (h <= 10) return require('@/assets/imgs/report/page4_value.png');
    if (h <= 20) return require('@/assets/imgs/report/page4_pro.png');
    return require('@/assets/imgs/report/page4_learn.png');
  };

  waitForImages = (el) => {
    return new Promise((resolve) => {
      const imgs = el.querySelectorAll('img');
      if (!imgs.length) return resolve();

      let loaded = 0;
      const done = () => ++loaded === imgs.length && resolve();

      imgs.forEach((img) => {
        if (img.complete) return done();
        img.onload = done;
        img.onerror = done;
      });
    });
  };

  /* ===================== 核心保存逻辑 ===================== */

  handleSave = async () => {
    if (this.state.isGenerating) return;

    const screenshotEl = this.screenshotCardRef.current;
    if (!screenshotEl) return alert('海报区域不存在');

    this.setState({ isGenerating: true });

    try {
      await this.waitForImages(screenshotEl);

      const rect = screenshotEl.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        throw new Error('DOM 尺寸为 0，无法截图');
      }

      // ✅ 优化后的配置
      const canvas = await html2canvas(screenshotEl, {
        useCORS: true,
        allowTaint: false,
        scale: 2.5, // 降低 scale，避免过度放大
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        foreignObjectRendering: false,
      });

      if (!canvas || !canvas.width) {
        throw new Error('canvas 生成失败');
      }

      // ✅ 直接使用，不做二次缩放
      canvas.toBlob(
        async (blob) => {
          if (!blob) throw new Error('图片生成失败');

          const formData = new FormData();
          const filename = `poster_${Date.now()}.png`;
          formData.append('file', blob, filename);

          const res = await axiosIns.post('/common/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const imgUrl = res;
          if (!imgUrl) throw new Error('未获取到图片地址');

          const img = new Image();
          img.onload = () => {
            this.setState({
              saveImgSrc: imgUrl,
              isGenerating: false,
            });
          };
          img.onerror = () => {
            throw new Error('图片加载失败');
          };
          img.src = imgUrl;
        },
        'image/png',
        1.0 // 最高质量
      );
    } catch (e) {
      console.error('生成海报失败:', e);
      alert(e.message || '生成失败，请重试');
      this.setState({ isGenerating: false });
    }
  };

  cancelShare = () => {
    this.setState({ saveImgSrc: '' });
  };

  /* ===================== render ===================== */

  render() {
    const { courseNum, learningHour, bookNum } = this.props;
    const { saveImgSrc, isGenerating, isShow } = this.state;
    console.log(saveImgSrc);
    const keywordImg = this.getKeywordImage();

    return (
      <div
        ref={this.rootRef}
        className={`swiper-slide ${style.page} ${style['page-4']} ${style['page4-gsap']}`}
      >
        <img
          className={style['page4-bg']}
          src={require('@/assets/imgs/report/page4_bg.png')}
          alt=''
          style={isShow ? undefined : { opacity: 0 }}
        />

        {isShow && (
          <React.Fragment>
            <div className={style['page4-wrapper']}>
              <div className={style['page4-header']}>
                <h2 className={style['page4-header-title']}>
                  2025专属成长战报关键词
                </h2>
              </div>
              {!saveImgSrc && isShow && (
                <div>
                  {/* 展示用 - 带动画 */}
                  <div
                    className={style['page4-poster-card']}
                    ref={this.posterCardRef}
                  >
                    <img
                      className={style['page4-poster-bg']}
                      src={require('@/assets/imgs/report/poster_bg.png')}
                      alt=''
                    />

                    <div className={style['page4-poster-content']}>
                      <div className={style['page4-keyword-image']}>
                        <img
                          className={style['page4-keyword']}
                          src={keywordImg}
                          alt=''
                        />
                      </div>

                      <div className={style['page4-stats-section']}>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {courseNum || 0}
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计学习课程数
                          </div>
                        </div>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {parseInt(learningHour || 0, 10)}
                            <span className={style['page4-stat-unit']}>
                              (小时)
                            </span>
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计学习时长
                          </div>
                        </div>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {bookNum || 0}
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计阅读数
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 截图用 - 无动画，隐藏 */}
                  <div
                    className={style['page4-poster-card-screenshot']}
                    ref={this.screenshotCardRef}
                  >
                    <img
                      className={style['page4-poster-bg_shot']}
                      src={require('@/assets/imgs/report/poster_bg_shot.png')}
                      alt=''
                    />

                    <div
                      className={style['page4-poster-content']}
                      style={{ height: '93%' }}
                    >
                      <div className={style['page4-keyword-image']}>
                        <img
                          className={style['page4-keyword']}
                          src={keywordImg}
                          alt=''
                        />
                      </div>

                      <div className={style['page4-stats-section']}>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {courseNum || 0}
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计学习课程数
                          </div>
                        </div>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {parseInt(learningHour || 0, 10)}
                            <span className={style['page4-stat-unit']}>
                              (小时)
                            </span>
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计学习时长
                          </div>
                        </div>
                        <div className={style['page4-stat-item']}>
                          <div className={style['page4-stat-number']}>
                            {bookNum || 0}
                          </div>
                          <div className={style['page4-stat-label']}>
                            累计阅读数
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!isGenerating && (
                    <React.Fragment>
                      <img
                        className={style['page4-btn-save']}
                        src={require('@/assets/imgs/report/page4_save.png')}
                        alt=''
                        onClick={this.handleSave}
                      />
                    </React.Fragment>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        )}

        {/* 图片预览遮罩层（参考 Poster.vue） */}
        {saveImgSrc && (
          <div className={style['poster-overlay']} onClick={this.cancelShare}>
            <div className={style['poster-image-wrapper']}>
              <img
                src={saveImgSrc}
                alt='海报'
                onClick={(e) => e.stopPropagation()}
              />
              <div className={style['poster-tip']}>
                长按图片可以保存/转发噢~
              </div>
            </div>
          </div>
        )}

        {/* Loading 提示 - 呱呱加载动效 */}
        {isGenerating && !saveImgSrc && (
          <div className={style['poster-loading']}>
            <div className={style['guagua-loading-container']}>
              <img
                className={style['guagua-loading-image']}
                src={require('@/assets/imgs/report/guagua.png')}
                alt='呱呱'
              />
              <div className={style['guagua-loading-dots']}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div className={style['loading-text']}>生成年度报告中...</div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Page4);
