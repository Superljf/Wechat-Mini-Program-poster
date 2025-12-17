import React, { Component } from 'react'
import RankingTopItem from './ranking-top-item'
import style from './style.css';

class RankingTopList extends Component{
  render () {
    let { rankingTopList } = this.props
    let isShow = rankingTopList && rankingTopList.length > 0
    return (
      isShow && 
      <div className={style['ranking-top-list']}>
        {
          rankingTopList.map((item, index) => {
            return (
              item && <RankingTopItem key={item.id} rankingTopItem={item} index = {index}/>
            )
          })
        }
      </div>
    )
  }
}
export default RankingTopList