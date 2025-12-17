import React, {Component} from 'react';

import SwiperBanner from '../../../components/swiper-banner';
import CultureCourse from './culture-course';
import OpenCourse from './open-course';
import CeoColumn from './ceo-column'
import NavPosition from './nav-position'
import MyAbilityType from './ability-type'
import RankingList from './ranking-list'
import {AppUserContext} from '../../../app-context';
import ActivityNav from './activity-nav'
class Recommend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showCultureCourse: false,
      showCeoColumn: false,
      showAbilityType: false
    }
  }
  setShowCultureCourse = (status) => {
    this.setState({
      showCultureCourse: status
    })
  }
  setShowCeoColumn = (status) => {
    this.setState({
      showCeoColumn: status
    })
  }
  setAbilityType = (status) => {
    this.setState({
      showAbilityType: status
    })
  }
  goYearsActivity = () => {
    this.props.history.push({pathname: '/years/activity'})
  }
  render() {
    let { showCultureCourse, showCeoColumn, showAbilityType } = this.state
    let isGroupWorker = false
    // 非集团员工不显示 ceo 专栏 和 排行榜
    if (this.props.user.deptNames && this.props.user.deptNames.indexOf("集团") !== -1) {
      isGroupWorker = true 
    } 
    return (
      <div>
        {
          <React.Fragment>
            <SwiperBanner />
            <NavPosition isGroupWorker={isGroupWorker} showCultureCourse={showCultureCourse} showCeoColumn={showCeoColumn} showAbilityType={showAbilityType}/>
            <CultureCourse setShowCultureCourse={this.setShowCultureCourse}/>
            <MyAbilityType setAbilityType={this.setAbilityType}/>
            <OpenCourse />
            <CeoColumn setShowCeoColumn={this.setShowCeoColumn}/> 
            { isGroupWorker && <RankingList/> }
            <ActivityNav goYearsActivity={this.goYearsActivity}/>
          </React.Fragment>
        }
      </div>
    );
  }
}
export default props => (
  <AppUserContext.Consumer>
    {
      ({user}) => <Recommend {...props} user={user}/>
    }
  </AppUserContext.Consumer>
);