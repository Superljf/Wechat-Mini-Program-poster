import React, { Component } from 'react'
import style from './style.module.css'
import activityNavPng from '@/assets/imgs/2020-years-activity/activity-nav.png'
import moment from 'moment'

export class ActivityNav extends Component {
  goYearsActivity = () => {
    const { goYearsActivity } = this.props
    goYearsActivity && goYearsActivity()
  }
  render() {
    let startTime = moment('2019-12-31 00:00:00', "YYYY-MM-DD HH:mm:ss").valueOf();
    let endTime = moment('2021-01-07 00:00:00', "YYYY-MM-DD HH:mm:ss").valueOf();
    let nowTime = new Date().valueOf()
    let isDuration = nowTime >= startTime && nowTime <= endTime
    console.log(startTime, endTime)
    return (
      isDuration ? <div className={style['activity-nav-warp']} onClick={this.goYearsActivity}>
        <img className={style['nav-img']} src={activityNavPng} alt=""></img>
      </div> : null
    )
  }
}

export default ActivityNav
