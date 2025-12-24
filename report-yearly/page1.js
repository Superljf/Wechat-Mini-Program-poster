import React, { Component } from 'react';
import { gsap } from 'gsap';
import style from './style.css';
// import Next from './next';

export default class Page1 extends Component {
  topTextLoopTimeline = null; // 保存标题的持续动画

  componentDidMount() {
    // 初始加载时，如果是激活状态就播放
    if (this.props.isActive) {
      setTimeout(() => {
        this.playAnimation();
      }, 500);
    }
  }

  componentDidUpdate(prevProps) {
    // 当页面从不激活变为激活时，重新播放动画
    if (!prevProps.isActive && this.props.isActive) {
      setTimeout(() => {
        this.playAnimation();
      }, 100);
    }
  }

  componentWillUnmount() {
    // 清理持续动画
    if (this.topTextLoopTimeline) {
      this.topTextLoopTimeline.kill();
    }
  }

  playAnimation = () => {
    // 清理之前的持续动画
    if (this.topTextLoopTimeline) {
      this.topTextLoopTimeline.kill();
      this.topTextLoopTimeline = null;
    }
    // 清除之前的动画，重置状态
    gsap.killTweensOf(`.${style['page1-top-text']}`);
    gsap.killTweensOf(`.${style['page1-text']} > div`);
    gsap.killTweensOf(`.${style['page1-btn-see-container']}`);

    // 重置所有元素到初始状态
    gsap.set(`.${style['page1-top-text']}`, {
      y: -150,
      opacity: 0,
      scale: 0.8,
    });
    gsap.set(`.${style['page1-text']} > div`, { y: 30, opacity: 0 });
    gsap.set(`.${style['page1-btn-see-container']}`, {
      y: 50,
      opacity: 0,
      scale: 0.5,
    });

    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // 1. 顶部标题图片从上方掉落下来，带弹性效果（延长时间）
    timeline.fromTo(
      `.${style['page1-top-text']}`,
      {
        y: -150,
        opacity: 0,
        scale: 0.8,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.2, // 从0.8s延长到1.2s
        ease: 'bounce.out',
      }
    );

    // 2. 第一行文字淡入并向上移动（延长时间）
    timeline.fromTo(
      `.${style['page1-text']} > div:nth-child(1)`,
      {
        y: 30,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.9, // 从0.6s延长到0.9s
      },
      '-=0.3' // 调整重叠时间
    );

    // 3. 第二行文字淡入并向上移动（延长时间）
    timeline.fromTo(
      `.${style['page1-text']} > div:nth-child(2)`,
      {
        y: 30,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.9, // 从0.6s延长到0.9s
      },
      '-=0.5' // 调整重叠时间
    );

    // 4. 按钮容器从下方弹出，带缩放效果（延长时间）
    timeline.fromTo(
      `.${style['page1-btn-see-container']}`,
      {
        y: 50,
        opacity: 0,
        scale: 0.5,
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1.0, // 从0.7s延长到1.0s
        ease: 'back.out(1.7)', // 回弹效果
      },
      '-=0.3' // 调整重叠时间
    );

    // 5. 标题图片的持续动画 - 轻微浮动 + 呼吸光效
    timeline.add(() => {
      const topTextElement = document.querySelector(
        `.${style['page1-top-text']}`
      );
      if (!topTextElement) return;

      // 创建循环动画
      this.topTextLoopTimeline = gsap.timeline({ repeat: -1 });

      // 向上浮动 + 轻微放大
      this.topTextLoopTimeline.to(topTextElement, {
        y: -8,
        scale: 1.03,
        duration: 2.0,
        ease: 'sine.inOut',
      });

      // 向下浮动 + 轻微缩小
      this.topTextLoopTimeline.to(topTextElement, {
        y: 0,
        scale: 1,
        duration: 2.0,
        ease: 'sine.inOut',
      });
    });

    // 入场动画完成：允许显示 next / 解锁滑到下一页
    timeline.call(() => {
      if (this.props.onAnimDone) this.props.onAnimDone();
    });

    // // 5. 左箭头向右移动的引导动画
    // gsap.to(`.${style['page1-arrow-1']}`, {
    //   x: 8,
    //   duration: 0.5,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: 'power1.inOut',
    //   delay: 1.5,
    // });

    // // 6. 右箭头向右移动的引导动画（延迟一点，形成波浪效果）
    // gsap.to(`.${style['page1-arrow-2']}`, {
    //   x: 8,
    //   duration: 0.5,
    //   yoyo: true,
    //   repeat: -1,
    //   ease: 'power1.inOut',
    //   delay: 1.65, // 比左箭头晚0.15秒
    // });
  };

  handleSeeClick = () => {
    const { goPage } = this.props;
    if (goPage) {
      goPage(1);
    }
  };

  render() {
    return (
      <div className={`swiper-slide ${style['page']} ${style['page-1']}`}>
        <img
          className={style['page1-bg']}
          src={require('@/assets/imgs/report/page1_bg.png')}
          alt=''
        />
        <div className={style['page1-top-text-container']}>
          <img
            className={style['page1-top-text']}
            src={require('@/assets/imgs/report/page1_top_text.png')}
            alt=''
            style={{ opacity: 0 }}
          />
          <div
            className={`${style['s0-top']} s-top s0-top ${style['page1-text']}`}
          >
            <div style={{ opacity: 0 }}>2025进度条已经拉满，家人们谁懂啊！</div>
            <div style={{ opacity: 0 }}>看看这一年的你，到底有多"杀疯了"！</div>
            <div
              onClick={this.handleSeeClick}
              className={style['page1-btn-see-container']}
              style={{ opacity: 0 }}
            >
              <img
                className={style['page1-arrow-1']}
                src={require('@/assets/imgs/report/arrow1.png')}
                alt=''
                style={{ marginRight: 1 }}
              />
              <img
                className={style['page1-arrow-2']}
                src={require('@/assets/imgs/report/arrow2.png')}
                alt=''
              />
              <div className={style['page1-btn-see-text']}>去看看</div>
            </div>
          </div>
        </div>

        {/* <Next
          id='page0-next'
          show={this.props.showNext}
          onClick={() => this.props.goPage && this.props.goPage(1)}
        /> */}
      </div>
    );
  }
}
