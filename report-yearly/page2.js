import React, { Component } from 'react';
import { gsap } from 'gsap';
import style from './style.css';
import Next from './next';

export default class Page2 extends Component {
  birdTimeline = null; // 保存鸟的持续动画
  spanTimelines = []; // 保存所有 span 的动画

  componentDidMount() {
    // 初始加载时，如果是激活状态就播放
    if (this.props.isActive) {
      setTimeout(() => {
        this.playAnimation();
      }, 200);
    }
  }

  componentDidUpdate(prevProps) {
    // 当页面从不激活变为激活时，重新播放动画
    if (!prevProps.isActive && this.props.isActive) {
      setTimeout(() => {
        this.playAnimation();
      }, 120);
    }
  }

  componentWillUnmount() {
    // 清理动画
    this.killAllAnimations();
  }

  killAllAnimations = () => {
    // 清除鸟的持续动画
    if (this.birdTimeline) {
      this.birdTimeline.kill();
      this.birdTimeline = null;
    }
    // 清除所有 span 的动画
    this.spanTimelines.forEach((tl) => tl.kill());
    this.spanTimelines = [];
    // 清除其他所有动画
    gsap.killTweensOf(`.${style['page2-text-item']}`);
    gsap.killTweensOf(`.${style['page2-bird']}`);
    gsap.killTweensOf(`.${style['page2-text']} span`);
  };

  playAnimation = () => {
    // 清除之前的动画
    this.killAllAnimations();

    // 确保 DOM 已经渲染，增加延迟确保所有元素都已挂载
    setTimeout(() => {
      // 重置所有元素到初始状态
      const topTextElements = document.querySelectorAll(
        `.${style['page2-top-text-item']}`
      );
      const textElements = document.querySelectorAll(
        `.${style['page2-text-item']}:not(.${style['page2-top-text-item']})`
      );
      const birdElement = document.querySelector(`.${style['page2-bird']}`);

      // 顶部固定文本的初始状态（类似 page1 的掉落效果）
      topTextElements.forEach((el) => {
        gsap.set(el, { y: -120, opacity: 0, scale: 0.85, rotation: -5 });
      });

      // 其他文本的初始状态
      textElements.forEach((el) => {
        gsap.set(el, { y: -40, opacity: 0, scale: 0.95 });
      });

      if (birdElement) {
        gsap.set(birdElement, {
          x: 150,
          y: -50,
          opacity: 0,
          rotation: -30,
          scale: 0.5,
        });
      }

      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // 1. 先播放顶部固定文本的掉落动画（依次执行，不重叠）
      topTextElements.forEach((element, index) => {
        timeline.fromTo(
          element,
          {
            y: -120,
            opacity: 0,
            scale: 0.85,
            rotation: -5,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.6)', // 使用弹性效果，区别于 page1 的 bounce
          },
          index === 0 ? 0 : '+=0.2' // 顺序执行，每个间隔0.2秒
        );
      });

      // 2. 鸟从右侧飞入（更早开始，别等很久）
      timeline.addLabel('birdInStart');
      timeline.to({}, { duration: 0.15 });
      timeline.fromTo(
        `.${style['page2-bird']}`,
        {
          x: 150,
          y: -50,
          opacity: 0,
          rotation: -30,
          scale: 0.5,
        },
        {
          x: 0,
          y: 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
          duration: 1.0, // 缩短到1.0秒
          ease: 'back.out(1.5)',
        },
        '+=0.1' // 顶部文本结束后很快开始
      );
      timeline.addLabel('birdInEnd');

      // 3. 鸟的持续动画：在“飞入结束后立刻开始”，不等文字全部出现
      timeline.add(() => {
        const birdElement = document.querySelector(`.${style['page2-bird']}`);
        if (!birdElement) return;

        this.birdTimeline = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.2,
        });

        // 每轮开始：从左侧稍微外面出现
        this.birdTimeline.set(birdElement, {
          x: -90,
          y: 0,
          rotation: -10,
          scale: 0.95,
          opacity: 0,
        });

        // 进入视野
        this.birdTimeline.to(birdElement, {
          x: 0,
          y: -6,
          rotation: 6,
          scale: 1.02,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        });

        // 向右上
        this.birdTimeline.to(birdElement, {
          x: 70,
          y: -26,
          rotation: 10,
          scale: 1.08,
          duration: 1.4,
          ease: 'sine.inOut',
        });

        // 向右下
        this.birdTimeline.to(birdElement, {
          x: 140,
          y: 10,
          rotation: -6,
          scale: 1.02,
          duration: 1.5,
          ease: 'sine.inOut',
        });

        // 飞出右侧并淡出
        this.birdTimeline.to(birdElement, {
          x: 220,
          y: -10,
          rotation: 4,
          scale: 0.98,
          opacity: 0,
          duration: 1.4,
          ease: 'sine.in',
        });
      }, 'birdInEnd+=0.05');

      // 4. 其他文本严格按顺序出现（小重叠会让你感觉“乱”）
      textElements.forEach((element, index) => {
        timeline.fromTo(
          element,
          {
            y: -40,
            opacity: 0,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8, // 缩短到0.8秒，加快节奏
            ease: 'power3.out',
          },
          index === 0 ? '+=0.1' : '+=0.12' // 严格顺序（每条间隔0.12s）
        );
      });

      // 入场动画完成：允许显示 next / 解锁滑到下一页
      timeline.call(() => {
        if (this.props.onAnimDone) this.props.onAnimDone();
      });

      // 5. 数字和特殊文字的持续跳动动画（更早开始，别等很久）
      // const highlightSpans = document.querySelectorAll(
      //   `.${style['page2-text']} .${style['page2-text-span']}, .${style['page2-text']} span`
      // );

      // highlightSpans.forEach((span, index) => {
      //   // 重置 span 状态
      //   gsap.set(span, { y: 0, scale: 1, rotation: 0 });

      //   // 每个 span 有不同的延迟和动画效果，更活泼
      //   const spanTimeline = gsap.timeline({
      //     repeat: -1,
      //     delay: 1.8 + index * 0.15,
      //   });

      //   // 跳起
      //   spanTimeline.to(span, {
      //     y: -12,
      //     scale: 1.2,
      //     rotation: 3,
      //     duration: 0.5,
      //     ease: 'power2.out',
      //   });

      //   // 落下（带弹性）
      //   spanTimeline.to(span, {
      //     y: 0,
      //     scale: 1,
      //     rotation: 0,
      //     duration: 0.5,
      //     ease: 'bounce.out',
      //   });

      //   // 停顿
      //   spanTimeline.to(span, {
      //     duration: 1.5,
      //   });

      //   // 保存到数组中以便后续清理
      //   this.spanTimelines.push(spanTimeline);
      // });
    }, 100);
  };
  getText = () => {
    const {
      learningHour,
      courseNum,
      learningHourDefeatPercent = 0,
      dayNum,
    } = this.props;

    const ht = learningHour;

    // 固定文案
    const fixedText = (
      <React.Fragment>
        <div
          className={`${style['page2-text-item']} ${style['page2-top-text-item']}`}
        >
          距离你第一次与「人才大学」相遇
        </div>
        <div
          className={`${style['page2-text-item']} ${style['page2-top-text-item']}`}
          style={{ marginTop: 12 }}
        >
          转眼已经过去了
          <span className={style['page2-text-span']}>{dayNum || 0}</span>天
        </div>
        <div
          className={`${style['yearly-text']} ${style['page2-text-item']} ${style['page2-top-text-item']}`}
        >
          2025，
        </div>
      </React.Fragment>
    );

    // 根据学习时长显示不同文案
    let dynamicText = '';
    if (!learningHour || learningHour === 0) {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            你学习了<span>{courseNum || 0}</span>门课程，累计
            <span>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            一切「<span style={{ color: 'rgba(204,0,0,1)' }}>从0开始</span>
            」，系统已捕捉到你爆棚的学习欲，
          </p>
          <p className={style['page2-text-item']}>
            2026 年指定不会让你继续在知识岸边 "优雅躺平"。
          </p>
        </React.Fragment>
      );
    } else if (learningHour > 0 && learningHour <= 1) {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            你学习了<span>{courseNum || 0}</span>门课程，累计
            <span>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            超越了<span>{learningHourDefeatPercent || 0}%</span>
            的伙伴，这开局也太「
            <span style={{ color: 'rgba(204,0,0,1)' }}>有力</span>」了吧！
          </p>
          <p className={style['page2-text-item']}>
            每一秒的投入都没白费，毕竟你一直在「成为更好的自己，更好地成为自己」呀~
          </p>
        </React.Fragment>
      );
    } else if (learningHour > 1 && learningHour <= 5) {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            你学习了
            <span className={style['page2-text-span']}>{courseNum || 0}</span>
            门课程，累计
            <span className={style['page2-text-span']}>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            超越了
            <span className={style['page2-text-span']}>
              {learningHourDefeatPercent || 0}%
            </span>
            的伙伴，
          </p>
          <p className={style['page2-text-item']}>
            "因上努力"是你的成长加速器，
          </p>
          <p className={style['page2-text-item']}>做时间的朋友，</p>
          <p className={style['page2-text-item']}>
            你就是自己人生剧本的"大女主/男主"。
          </p>
        </React.Fragment>
      );
    } else if (learningHour > 5 && learningHour <= 10) {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            2025年，你学习了
            <span className={style['page2-text-span']}>{courseNum || 0}</span>
            门课程，累计
            <span className={style['page2-text-span']}>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            超越了
            <span className={style['page2-text-span']}>
              {learningHourDefeatPercent || 0}%
            </span>
            的伙伴，厚积薄发「
            <span className={style['page2-text-span']}>为客户创造价值</span>」！
          </p>
          <p className={style['page2-text-item']}>
            那些悄悄努力的日子，终将让你惊艳所有人，这波成长真是绝绝子。
          </p>
        </React.Fragment>
      );
    } else if (learningHour > 10 && learningHour <= 20) {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            2025年，你学习了
            <span className={style['page2-text-span']}>{courseNum || 0}</span>
            门课程，累计
            <span>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            超越了<span>{learningHourDefeatPercent || 0}%</span>的伙伴，「
            <span className={style['page2-text-span']}>专业主义者</span>
            」非你莫属！
          </p>
          <p className={style['page2-text-item']}>
            "天选学习者"的进度条正在狂飙加载，下一个大佬就是你！
          </p>
        </React.Fragment>
      );
    } else {
      dynamicText = (
        <React.Fragment>
          <p className={style['page2-text-item']}>
            2025年，你学习了<span>{courseNum || 0}</span>门课程，累计
            <span className={style['page2-text-span']}>{ht}</span>小时，
          </p>
          <p className={style['page2-text-item']}>
            超越了<span>{learningHourDefeatPercent || 0}%</span>的伙伴，「
            <span style={{ color: 'rgba(204,0,0,1)' }}>学神卷王天花板</span>
            」你比烟花闪！
          </p>
          <p className={style['page2-text-item']}>
            「追求杰作」，永无止境，这波稳了！
          </p>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {fixedText}
        {dynamicText}
      </React.Fragment>
    );
  };

  render() {
    let text = this.getText();
    return (
      <div className={`swiper-slide ${style['page']} ${style['page-2']}`}>
        <img
          className={style['page2-bg']}
          src={require('@/assets/imgs/report/page2_bg.png')}
          alt=''
        />
        <div
          className={`${style['s1-top']} s-top s1-top ${style['page2-text']}`}
        >
          {text}
          <img
            className={style['page2-bird']}
            src={require('@/assets/imgs/report/bird.png')}
            alt=''
            style={{ opacity: 0 }}
          />
        </div>

        <Next
          id='page1-next'
          show={this.props.showNext}
          onClick={() => this.props.goPage && this.props.goPage(2)}
        />
      </div>
    );
  }
}
