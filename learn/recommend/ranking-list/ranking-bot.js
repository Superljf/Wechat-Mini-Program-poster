import React, { Component } from 'react'
import style from './style.css';
import defaultImg from '@/assets/imgs/ranking-default.png'

class RankingBotList extends Component{
  render () {
    let {rankingBotList} = this.props
    let isShow = rankingBotList.length > 0
    return (
      isShow && 
      <div className={style["ranking-bot-list"]}>
        {
          rankingBotList.map((item) => {
            return (
              <div className={style["ranking-bot-list-item"]} key={item.id}>
                <div className={style["ranking-bot-list-left"]}>
                  <span className={style["ranking-bot-list-index"]}>{item.ranking}</span>
                  <div className={style['ranking-bot-list-img_container']}
                    style={{background: `url(${item.staffHead? item.staffHead : defaultImg}) no-repeat center center `,backgroundSize: 'contain'}}>
                    {/* <img className={style["ranking-bot-list-img"]} src={item.staffHead? item.staffHead : defaultImg} alt="图片加载失败"/> */}
                  </div>
                  <span className={style["ranking-bot-list-name"]}>{item.employeeName}</span>
                </div>
                <div className={style["ranking-bot-list-right"]}>
                  {
                     item.rankingTrend > 0 && (<i className={`iconfont icon-up ${style['ranking-bot-list-icon']}`} ></i>)
                  }
                  {
                    item.rankingTrend < 0 && (<i className={`iconfont icon-up ${style['ranking-bot-list-icon']} ${style['ranking-bot-list-icon-reserve']}`} ></i>)
                  }
                  <span className={style["ranking-bot-list-time"]}>{item.learningTime}小时</span>
                </div>
              </div>
            )
          })
        }
        <div className={style["ranking-bot-list-footer"]}>
          <span>每周榜单</span>
        </div>
      </div>
    )
  }
}
export default RankingBotList