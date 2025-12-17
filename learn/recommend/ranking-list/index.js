import React, {Component} from 'react';

import {withRouter} from 'react-router-dom';
import CourseModuleHeader from '../course-moudle-header';
import CoursePanel from '../open-course/course-panel';
import SwiperCourse from '../../../../components/swiper-course';
import RankingTopList from './ranking-top'
import RankingBotList from './ranking-bot'
import rankingApi from '@/api/ranking-list'
import style from './style.css';

const htmlFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
const pxPerRem = Math.round(htmlFontSize);
const slideStyle = {
  width: '6.9rem',
};
const containerStyle = {
  paddingBottom: '0.6rem',
};
class RankingList extends Component{
  constructor (props) {
    super(props)
    this.getRankingList = this.getRankingList.bind(this)
    this.getAllGroupRankingList = this.getAllGroupRankingList.bind(this)
    this.getDeptRankingList = this.getDeptRankingList.bind(this)
    this.getAllRankingList = this.getAllRankingList.bind(this)
    this.state = {
      rankingList: [],
      rankingTopList: [],
      rankingBotList: [],
      isAllGroup: true,
      rangeType: 'GROUP',
      swiperOptions: {
        slidesPerView: 1,
        slidesPerColumn: 1,
        slidesPerGroup: 1,
        slidesPerColumnFill: 'row',
        spaceBetween: 0.3 * pxPerRem,
        autoHeight: true,
        observer:true,//修改swiper自己或子元素时，自动初始化swiper
	      observeParents:true,//修改swiper的父元素时，自动初始化swiper
        on: {
          slideChangeTransitionStart: ()=> {
            let swiper = this.refs.ranking.refs.ranking.swiper
            if (swiper.activeIndex === 1){
              this.getDeptRankingList()
            } else {
              this.getAllGroupRankingList()
            }
          }
        }
      }
    }
  }
  
  componentWillMount() {
    // this.getRankingList()
    this.getAllRankingList()
  }
  async getAllRankingList () {
    let groupRes = await rankingApi.getRankingList({pageNum: 1, pageSize: 10, rangeType: 'GROUP'})
    let deptRanRes = await rankingApi.getRankingList({pageNum: 1, pageSize: 10, rangeType: 'DEPT'})
    let res = []
    if (groupRes && deptRanRes) {
       res = [groupRes.list || [], deptRanRes.list || []]
    }
    this.setState({
      rankingList: res
    })
  }
  getRankingList () {
    let req = {
      pageNum: 1,
      pageSize: 10,
      rangeType: this.state.rangeType
    }
    rankingApi.getRankingList(req).then(res => {
      if (res && res.list){
        this.setState({
          rankingList: res.list || []
        }, ()=> {
          if (this.state.rankingList.length > 3) {
            this.setState({
              rankingTopList: this.state.rankingList.slice(0, 3),
              rankingBotList: this.state.rankingList.slice(3)
            })
          }
        })
      }
    }).catch(err => {
      console.log(err.message)
    })
  }
  getAllGroupRankingList () {
    this.setState({
      isAllGroup: true,
      rangeType: 'GROUP'
    }, ()=>{
      let swiper = this.refs.ranking.refs.ranking.swiper
      swiper.slideTo(0)
    })
  }
  getDeptRankingList () {
    this.setState({
      isAllGroup: false,
      rangeType: 'DEPT'
    }, ()=>{
      let swiper = this.refs.ranking.refs.ranking.swiper
      swiper.slideTo(1)
    })
  }
  render () {
    let { rankingList } = this.state
    return (
     <div>
      <CourseModuleHeader  text='排行榜' id="ranking-list"/>
      {
        rankingList.length > 0 && 
        <CoursePanel title='排行榜'>
          <div className={style['open-course-type']}>
            <span 
              onClick={this.getAllGroupRankingList.bind(this)} 
              className={this.state.isAllGroup ? style['open-course-type-active'] : null}>全集团</span>
            <span 
              onClick={this.getDeptRankingList.bind(this)} 
              className={this.state.isAllGroup ? null : style['open-course-type-active']}>本部门</span>
          </div>
          <SwiperCourse ref="ranking" type='ranking' containerStyle={containerStyle} slideStyle={slideStyle} swiperOptions={this.state.swiperOptions} >
            {
              
              rankingList.map((item, index)=>{
                let isShowRankingTopList = false
                let isShowRankingBotList = false
                let rankingTopList = []
                let rankingBotList = []
                if ( item.length > 0 ) {
                  isShowRankingTopList = true
                  // 前三 列表
                  rankingTopList.push(item[1])
                  rankingTopList.push(item[0])
                  rankingTopList.push(item[2])
                  if ( item.length > 3 ) {
                    isShowRankingBotList = true
                     // 前十 列表
                    rankingBotList = item.slice(3)
                  }
                }
                return (
                  <React.Fragment key={index}>
                    { isShowRankingTopList ? 
                      <RankingTopList  rankingTopList={rankingTopList}></RankingTopList> :
                      <div className={style["no-ranking-list"]}>
                        {index === 0? "集团" : "本部门"}暂无排行~~
                      </div>
                    }
                    { isShowRankingBotList && <RankingBotList  rankingBotList={rankingBotList}></RankingBotList> }
                  </React.Fragment>
                )
                
              })
            }

          </SwiperCourse>
          
        </CoursePanel>
        
      }
      </div>
    )
  }
}
export default withRouter(RankingList);