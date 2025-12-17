import React, { Component } from 'react'

import championImg from '../../../../assets/imgs/champion.png'
import secondPlaceImg from '@/assets/imgs/second-place.png'
import thirdPlaceImg from '@/assets/imgs/third-place.png'
import defaultImg from '@/assets/imgs/ranking-default.png'
import style from './style.css';

class RankingTopItem extends Component{
  constructor (props) {
    super(props)
    this.rankingHeadImg = this.rankingHeadImg.bind(this)
    this.state = {
      rankingHeadImg: '',
      ItemColor: ''
    }
  }
  componentWillMount () {
    this.rankingHeadImg()
  }
  rankingHeadImg () {
    let {ranking} = this.props.rankingTopItem
    let rankingHeadImg = ''
    let ItemColor = ''
    switch (ranking) {
      case 1:
        rankingHeadImg = championImg
        ItemColor = '#FEAE30'
        break
      case 2:
        rankingHeadImg = secondPlaceImg
        ItemColor = '#C6C6C6'
        break
      case 3:
        rankingHeadImg = thirdPlaceImg
        ItemColor = '#AA733D'
        break
      default:
        rankingHeadImg = ''
        ItemColor = ''
        break
    }
    this.setState({
      rankingHeadImg: rankingHeadImg,
      ItemColor: ItemColor
    })
  }
  render () {
    let { employeeName, learningTime, ranking, rankingTrend, staffHead } = this.props.rankingTopItem
    let { rankingHeadImg, ItemColor } = this.state
    staffHead = staffHead ? staffHead : defaultImg
    let icon = null
    if (rankingTrend > 0) {
      icon =  (
        <i className={`${style['ranking-list-item-icon']} iconfont icon-up`} ></i>
      )
    } else if (rankingTrend < 0) {
      icon = (
        <i className={`${style['ranking-list-item-icon']} iconfont icon-up ${style['i-reserve']}`} ></i>
      )
    } else {
      icon = null
    }
    return (
      <div className={style['ranking-top-list-item']} style={{marginTop: ranking === 1 ? "0" : "20px"}}>
        <div className={style["ranking-list-item-text_align"]} style={{zIndex: 2}}>
            <img src={rankingHeadImg} className={style["ranking-list-item-HeadImg"]} alt="图片加载失败"/>
        </div>
        <div className={`${style["ranking-list-item-text_align "]} ${style['ranking-list-item-img_container']}`} 
          style={{border:`2px solid ${ItemColor}`,background: `url(${staffHead}) no-repeat center center `,backgroundSize: 'contain'}}>
          {/* <img src={staffHead} className={style["ranking-list-item-PersonImg"]} alt="图片加载失败" /> */}
        </div>
        <div className={style["ranking-list-item-text_align"]}>
          <span className={style["ranking-list-item-index"]} style={{border: `1px solid ${ItemColor}`,color: ItemColor}}>{ranking}</span>
        </div>
        <div className={style["ranking-list-item-text_align"]}>
          {icon}
          <div className={style["ranking-list-item-name"]} >{employeeName}</div>
          <div className={style["ranking-list-item-time"]}>{learningTime}小时</div>
          
        </div>
      </div>
    )
  }
}
export default RankingTopItem