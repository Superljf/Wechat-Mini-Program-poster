import React, { Component } from 'react';
import { gsap } from 'gsap';
import style from './style.css';
import Next from './next';

export default class Page3 extends Component {
  balloonTimeline = null; // 保存气球的持续动画
  spanTimelines = []; // 保存所有 span 的动画

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
      }, 520);
    }
  }

  componentWillUnmount() {
    // 清理动画
    this.killAllAnimations();
  }

  killAllAnimations = () => {
    // 清除气球的持续动画
    if (this.balloonTimeline) {
      this.balloonTimeline.kill();
      this.balloonTimeline = null;
    }
    // 清除所有 span 的动画
    this.spanTimelines.forEach((tl) => tl.kill());
    this.spanTimelines = [];
    // 清除其他所有动画
    gsap.killTweensOf(`.${style['page3-text-item']}`);
    gsap.killTweensOf(`.${style['page3-top-text-item']}`);
    gsap.killTweensOf(`.${style['page3-balloon']}`);
    gsap.killTweensOf(`.${style['page3-text']} span`);
  };

  playAnimation = () => {
    // 清除之前的动画
    this.killAllAnimations();

    // ✅ 抛弃之前的 CSS 顺序动画和 setTimeout 链条，统一由 GSAP timeLine 控制（顺序更稳定）
    setTimeout(() => {
      const topTextElement = document.querySelector(
        `.${style['page3-top-text-item']}`
      );
      const balloonElement = document.querySelector(
        `.${style['page3-balloon']}`
      );
      const textElements = document.querySelectorAll(
        `.${style['page3-text-item']}:not(.${style['page3-top-text-item']})`
      );

      // 统一重置初始状态
      if (topTextElement) {
        gsap.set(topTextElement, {
          y: -120,
          opacity: 0,
          scale: 0.86,
          rotation: 6,
        });
      }
      textElements.forEach((el) => {
        gsap.set(el, { y: -32, opacity: 0, scale: 0.98, rotation: -2 });
      });
      if (balloonElement) {
        gsap.set(balloonElement, {
          x: 120,
          y: 140,
          opacity: 0,
          rotation: 12,
          scale: 0.65,
        });
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // 1) 顶部“2025，”掉落（与 page1/page2 区分：更“俏皮”的回弹）
      if (topTextElement) {
        tl.fromTo(
          topTextElement,
          { y: -120, opacity: 0, scale: 0.86, rotation: 6 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.15,
            ease: 'back.out(1.9)',
          }
        );
      }

      // 2) 文案舒缓一点：第一行先出 → 停顿更久 → 后面逐行出
      if (textElements && textElements.length) {
        const firstLine = textElements[0];
        const secondLine = textElements[1];
        const thirdLine = textElements[2];
        const restLines = Array.prototype.slice.call(textElements, 2);

        // 第一行
        tl.to(
          firstLine,
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.75,
            ease: 'power3.out',
          },
          '+=0.25'
        );

        // 第一行 → 第二行 停顿
        tl.to({}, { duration: 0.15 });

        // 第二行
        if (secondLine) {
          tl.to(secondLine, {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
            ease: 'power3.out',
          });
        }

        // ✅ 拉长第二行 → 第三行的间隔
        tl.to({}, { duration: 0.35 });
        if (thirdLine) {
          tl.to(
            thirdLine,
            {
              y: 0,
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 0.9,
              ease: 'power3.out',
            },
            '<+0.35'
          );
        }
        tl.to({}, { duration: 0.15 });
        // 第三行及以后
        if (restLines.length) {
          tl.to(restLines, {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.4,
            ease: 'power3.out',
            stagger: 0.32,
          });
        }
      }

      // 3) 气球进场稍微放慢，且不抢第一行文字的注意力
      if (balloonElement) {
        tl.addLabel('balloonInStart');
        tl.fromTo(
          balloonElement,
          { x: 120, y: 140, opacity: 0, rotation: 12, scale: 0.65 },
          {
            x: 0,
            y: 0,
            opacity: 1,
            rotation: 0,
            scale: 1,
            duration: 1.55,
            ease: 'back.out(1.4)',
          },
          '<+0.35'
        );
        tl.addLabel('balloonInEnd');
      }

      // 4) 气球持续飘动：在“气球出现后”就开始（不等文字全部结束）
      tl.add(() => {
        const el = document.querySelector(`.${style['page3-balloon']}`);
        if (!el) return;
        this.balloonTimeline = gsap.timeline({ repeat: -1, yoyo: false });
        this.balloonTimeline
          .to(el, {
            x: 10,
            y: -18,
            rotation: 6,
            duration: 2.2,
            ease: 'sine.inOut',
          })
          .to(el, {
            x: -12,
            y: -32,
            rotation: -6,
            duration: 2.4,
            ease: 'sine.inOut',
          })
          .to(el, {
            x: 6,
            y: -12,
            rotation: 4,
            duration: 2.0,
            ease: 'sine.inOut',
          })
          .to(el, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 1.8,
            ease: 'sine.inOut',
          });
      }, balloonElement ? 'balloonInEnd+=0.05' : '+=0');

      // 5) 高亮数字/词持续跳动：跟着整体节奏延后一点
      //    这里也改成“气球入场后就开始”，不再等所有文字播完
      tl.add(() => {
        const highlightSpans = document.querySelectorAll(
          `.${style['page3-text']} .${style['page3-text-span']}, .${style['page3-text']} span`
        );
        highlightSpans.forEach((span, index) => {
          gsap.set(span, { y: 0, scale: 1, rotation: 0 });
          const spanTimeline = gsap.timeline({
            repeat: -1,
            delay: 0.6 + index * 0.12,
          });
          spanTimeline
            .to(span, {
              y: -10,
              scale: 1.18,
              rotation: 2,
              duration: 0.45,
              ease: 'power2.out',
            })
            .to(span, {
              y: 0,
              scale: 1,
              rotation: 0,
              duration: 0.55,
              ease: 'bounce.out',
            })
            .to(span, { duration: 1.4 });
          this.spanTimelines.push(spanTimeline);
        });
      }, balloonElement ? 'balloonInEnd+=0.2' : '+=0');

      // 入场动画完成：允许显示 next / 解锁滑到下一页
      tl.call(() => {
        if (this.props.onAnimDone) this.props.onAnimDone();
      });
    }, 80);
  };

  getText = () => {
    const { bookNum, maxReadingProgress, maxProgressBookName } = this.props;

    if (!bookNum || bookNum === 0) {
      return (
        <React.Fragment>
          <p className={style['page3-text-item']}>你还没推开文库的宝藏大门，</p>
          <p className={style['page3-text-item']}>没关系！现在出发也不晚，</p>
          <p className={style['page3-text-item']} style={{ marginTop: 16 }}>
            开始寻找属于你的{' '}
            <span className={style['page3-text-span']}>"觉醒秘籍"</span>
          </p>
          <p className={style['page3-text-item']}>下一个人间清醒就是你！</p>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <p className={style['page3-text-item']}>
            你已狂刷了
            <span className={style['page3-text-span']}>{bookNum}</span>本书，
          </p>
          {maxProgressBookName && maxReadingProgress ? (
            <p className={style['page3-text-item']}>
              《{maxProgressBookName}》已看到
              <span className={style['page3-text-span']}>
                {maxReadingProgress}%
              </span>
              ，妥妥的年度"精神食粮"，
            </p>
          ) : (
            <p className={style['page3-text-item']}>妥妥的年度"精神食粮"，</p>
          )}
          <p className={style['page3-text-item']}>
            <span className={style['page3-text-span']}>"持续阅读"</span>
            让认知扩容、心灵充电，
          </p>
          <p className={style['page3-text-item']}>
            这波精神富足真的泰裤辣，不愧是你！
          </p>
        </React.Fragment>
      );
    }
  };

  render() {
    let text = this.getText();
    return (
      <div className={`swiper-slide ${style['page']} ${style['page-3']}`}>
        <img
          className={style['page3-bg']}
          src={require('@/assets/imgs/report/page3_bg.png')}
          alt=''
        />
        <img
          className={style['page3-balloon']}
          src={require('@/assets/imgs/report/balloon.png')}
          alt=''
          style={{ opacity: 0 }}
        />

        <div
          className={`${style['s2-top']} s-top s2-top ${style['page3-text']}`}
        >
          <div
            className={`${style['yearly-text_3']} ${style['page3-text-item']} ${style['page3-top-text-item']}`}
          >
            2025，
          </div>
          {text}
        </div>
        <Next
          id='page2-next'
          show={this.props.showNext}
          onClick={() => this.props.goPage && this.props.goPage(3)}
        />
      </div>
    );
  }
}
