import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import Recommend from '../learn/recommend/index';
import LearningMap from '../learn/map/index';
import CompetenceModel from '../learn/competence-model/index';
// import LearnNav from '../../components/learn-nav/index';
import style from './style.css';
import moment from 'moment';
import { AppAdContext } from '../../app-context';
import AdContainer from '@/components/ad';
// import {LEARN_NAV_MENUS as LearnNavMenus} from '../../constants';

class Learn extends Component {
  render() {
    const { match } = this.props;
    let startTime = moment(
      '2019-12-31 00:00:00',
      'YYYY-MM-DD HH:mm:ss'
    ).valueOf();
    let endTime = moment(
      '2020-01-07 00:00:00',
      'YYYY-MM-DD HH:mm:ss'
    ).valueOf();
    let nowTime = new Date();
    let isDuration = nowTime >= startTime && nowTime <= endTime;
    let template = isDuration ? (
      <div
        className={style['activity-text']}
        onClick={() => {
          this.props.history.push('/years/activity/h5');
        }}
      >
        <span>戳我</span>
      </div>
    ) : null;
    return [
      <AppAdContext.Consumer key='learn-ad'>
        {({ showAd, setShowAd, adList }) => {
          return (
            showAd &&
            adList.length > 0 && (
              <AdContainer adList={adList} setShowAd={setShowAd}></AdContainer>
            )
          );
        }}
      </AppAdContext.Consumer>,
      // <HeaderMainSearch key='learnHeaderSearch' template={template} mainStyle={mainStyle}/>,
      <div
        key='learnMain'
        className={style['learn-scroll-container']}
        template={template}
      >
        {/*<LearnNav learnNavMenus={LearnNavMenus} />*/}
        <Switch>
          <Redirect exact from={match.url} to={`${match.url}/recommend`} />
          <Route path={`${match.url}/recommend`} component={Recommend} />
          <Route path={`${match.url}/map`} component={LearningMap} />
          <Route
            path={`${match.url}/competence-model`}
            component={CompetenceModel}
          />
        </Switch>
      </div>,
    ];
  }
}

export default Learn;
