import React, { Component } from 'react';
import Swiper from 'swiper';
import Page1 from './page1';
import Page2 from './page2';
import Page3 from './page3';
import Page4 from './page4';
import { withRouter } from 'react-router-dom';
import Api from './api';
import $ from 'jquery';
import Music from './music';
import style from './style.css';

require('./style.css');

class YearlyReport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      reportData: '',
      loadLoading: false,
      imgLoad: false,
      swiperActiveIndex: 0, // 初始为0，表示第一页激活
      pageAnimDone: false, // 当前页入场动画是否完成（完成后才允许滑到下一页/显示next）
    };
    this.swiper = null;
  }

  componentDidMount() {
    document.title = '快乐人才大学·2025年度学习报告';
    this.getStudyReport();
    this.getWxConfig();
    // 监听页面首次交互，用于触发音频播放
    this.handleFirstInteraction = this.handleFirstInteraction.bind(this);
    document.addEventListener('click', this.handleFirstInteraction, {
      once: true,
    });
    document.addEventListener('touchstart', this.handleFirstInteraction, {
      once: true,
    });
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleFirstInteraction);
    document.removeEventListener('touchstart', this.handleFirstInteraction);
  }

  handleFirstInteraction = () => {
    // 用户首次交互后尝试播放音乐
    setTimeout(() => {
      let audio = $('#h5-music-yearly');
      if (audio && audio[0] && audio[0].paused) {
        audio[0]
          .play()
          .then(() => {
            $('.music-img-yearly').addClass(`${style['music-an']}`);
          })
          .catch(() => {
            // 播放失败，静默处理
          });
      }
    }, 100);
  };

  setTextAni = (swiper) => {
    let sIndex = swiper.activeIndex;
    $('.s-top p,.all-page').css('display', 'none');
    let cName = '.s' + sIndex + '-top p';
    $(cName).css('display', 'block');
    $('.page' + sIndex).css('display', 'block');
    let sTime = 0.5;
    let nextTime = $(cName).length * sTime + 's';
    $(`#page${sIndex}-next`).css({
      'animation-delay': nextTime,
      display: 'block',
    });
    for (let i = 0; i < $(cName).length; i++) {
      let time = sTime * (i + 0.5) + 's';
      let pNum = i + 1;
      $(cName + ':nth-child(' + pNum + ')').css('animation-delay', time);
    }
  };

  getPageFromUrl() {
    const searchParams = new URLSearchParams(
      this.props.location.search || window.location.search
    );
    const page = searchParams.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      // 页面索引从0开始，所以page=1对应索引0，page=2对应索引1，以此类推
      // 但用户可能期望page=1就是第一页（索引0），page=2是第二页（索引1）
      // 根据需求，page参数应该是页面编号（1,2,3,4），需要转换为索引（0,1,2,3）
      return pageNum >= 1 && pageNum <= 4 ? pageNum - 1 : 0;
    }
    return 0;
  }

  initSwiper() {
    let that = this;
    const initialPage = this.getPageFromUrl();
    this.swiper = new Swiper(`#h5-swiper-yearly`, {
      initialSlide: initialPage,
      direction: 'vertical',
      on: {
        init: function () {
          // 初始化时：锁定“下一页滑动”，等当前页动画结束再解锁
          that.lockSlideNext(this.activeIndex);
          that.setState({
            swiperActiveIndex: this.activeIndex,
            pageAnimDone: false,
          });

          that.setTextAni(this);
          setTimeout(() => {
            that.setState({
              loadLoading: true,
            });
          }, 3000);
        },
        slideChange: function () {
          // 切页时：锁定“下一页滑动”，并隐藏 next，等待新页面动画结束
          that.lockSlideNext(this.activeIndex);
          // 更新激活的页面索引，触发子组件动画
          that.setState({
            swiperActiveIndex: this.activeIndex,
            pageAnimDone: false,
          });

          if (this.activeIndex === 0) {
            that.setState({
              loadLoading: false,
            });
          }
          that.setTextAni(this);
          if (this.activeIndex === 0 || this.activeIndex === 3) {
            setTimeout(() => {
              that.setState({
                loadLoading: true,
              });
            }, 3000);
          }
        },
      },
    });
  }

  lockSlideNext = (activeIndex) => {
    if (!this.swiper) return;
    // 允许向上回看，但禁止向下到下一页（直到动画结束）
    this.swiper.allowSlidePrev = true;
    this.swiper.allowSlideNext = false;
    // 最后一页也不需要允许 next
    if (activeIndex === 3) {
      this.swiper.allowSlideNext = false;
    }
  };

  unlockSlideNext = (activeIndex) => {
    if (!this.swiper) return;
    // 最后一页不需要解锁 next
    this.swiper.allowSlideNext = activeIndex < 3;
  };

  handlePageAnimDone = (pageIndex) => {
    // 防止旧页面回调误触（用户快速滑动）
    if (pageIndex !== this.state.swiperActiveIndex) return;

    this.setState({ pageAnimDone: true });
    this.unlockSlideNext(pageIndex);
  };

  getWxConfig() {
    let url = encodeURIComponent(window.location.href.split('#')[0]);
    let shareUrl = window.location.origin + '/#/yearly-report';
    Api.getWxConfig(url)
      .then((res) => {
        if (res) {
          window.wx.config({
            beta: true,
            debug: false,
            appId: res.corpId,
            timestamp: res.timestamp,
            nonceStr: res.nonceStr,
            signature: res.corpSignature,
            jsApiList: ['shareAppMessage', 'onMenuShareAppMessage'],
          });
          window.wx.agentConfig({
            corpid: res.corpId,
            debug: false,
            agentid: res.agentId,
            timestamp: res.timestamp,
            nonceStr: res.nonceStr,
            signature: res.signature,
            jsApiList: ['shareAppMessage', 'onMenuShareAppMessage'],
            success: function (res) {
              // 回调
            },
            fail: function (res) {
              if (res.errMsg.indexOf('function not exist') > -1) {
                alert('版本过低请升级');
              }
            },
          });
          window.wx.ready(function () {
            const shareData = {
              title: '2025，点击查看专属你的学习报告',
              desc: '亲爱的小伙伴，这一年的成长印记都在这里。不确定的时代，学习让我们获得内...',
              link: shareUrl,
              imgUrl:
                'https://a.cdn.entstudy.com/histudy/tc/staff_mobile/img/h5-share.png',
              success: function () {
                console.log('分享成功!');
              },
            };
            window.wx.onMenuShareAppMessage(shareData);
          });
        }
      })
      .catch((err) => {});
  }

  getStudyReport() {
    Api.getStudyReport({ year: '2025' }).then((res) => {
      this.setState({ reportData: res, imgLoad: true }, () => {
        this.initSwiper();
      });
    });
  }

  goTop() {
    if (this.swiper) {
      this.swiper.slideTo(0, 1, false);
    }
  }

  goPage = (page) => {
    if (this.swiper) {
      this.swiper.slideTo(page, 1000, false);
    } else {
      setTimeout(() => {
        if (this.swiper) {
          this.swiper.slideTo(page, 1000, false);
        }
      }, 100);
    }
  };

  render() {
    const { reportData } = this.state;
    const {
      courseNum,
      learningHour,
      bookNum,
      learningHourDefeatPercent,
      dayNum,
      staffName,
      maxReadingProgress,
      maxProgressBookName,
      keyWord,
    } = reportData || {};

    const { swiperActiveIndex, pageAnimDone } = this.state;
    const showNext = pageAnimDone; // 当前页动画完成才显示 next

    return (
      <React.Fragment>
        <div
          id='h5-swiper-yearly'
          className={`swiper-container ${style['swiper-container']} `}
        >
          <div className='swiper-wrapper'>
            <Page1 
              staffName={staffName} 
              goPage={this.goPage}
              isActive={swiperActiveIndex === 0}
              showNext={showNext && swiperActiveIndex === 0}
              onAnimDone={() => this.handlePageAnimDone(0)}
            />
            <Page2
              dayNum={dayNum}
              courseNum={courseNum}
              learningHour={learningHour}
              learningHourDefeatPercent={learningHourDefeatPercent}
              goPage={this.goPage}
              isActive={swiperActiveIndex === 1}
              showNext={showNext && swiperActiveIndex === 1}
              onAnimDone={() => this.handlePageAnimDone(1)}
            />
            <Page3
              bookNum={bookNum}
              maxReadingProgress={maxReadingProgress}
              maxProgressBookName={maxProgressBookName}
              goPage={this.goPage}
              isActive={swiperActiveIndex === 2}
              showNext={showNext && swiperActiveIndex === 2}
              onAnimDone={() => this.handlePageAnimDone(2)}
            />
            <Page4
              courseNum={courseNum}
              learningHour={learningHour}
              bookNum={bookNum}
              keyWord={keyWord}
              staffName={staffName}
              goPage={this.goPage}
              isActive={swiperActiveIndex === 3}
              onAnimDone={() => this.handlePageAnimDone(3)}
            />
          </div>
        </div>
        {!this.state.loadLoading && (
          <div className={style['swiper-shade']}></div>
        )}
        {/* 只在首页上显示音乐 */}
        <Music />
      </React.Fragment>
    );
  }
}
export default withRouter(YearlyReport);
