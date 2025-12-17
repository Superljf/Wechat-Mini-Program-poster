import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

import SwiperCourse from '../../../../components/swiper-course';
import CourseModuleHeader from '../course-moudle-header';
import {imgFilter} from '../../../../utils';
import style from './style.css';
import api from "../api";

const htmlFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
const pxPerRem = Math.round(htmlFontSize);

const containerStyle = {
  padding: '0 0.3rem 0.6rem',
};

class MyAbilityType extends Component {

  constructor(props) {
    super(props);
    this.state = {
      abilityTypeList: [],
      swiperOptions : {
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 0.05 * pxPerRem,
      }
    }
  }

  componentDidMount() {
    this.getAbilityTypeList()
  }

  skipToCourseDetail (abilityTypeId, activeIndex) {
    // this.props.history.push(`/course/record/${typeId}`)
    this.props.history.push({ pathname : '/courses', query : { abilityTypeId: abilityTypeId, activeIndex: activeIndex} })
  }
  getAbilityTypeList () {
    let {setAbilityType} = this.props
    return api.getDictList({dictCode: 'ABILITY-TYPE'}).then(res => {
      if (res.list && res.list.length > 0) {
        this.setState({
          abilityTypeList: res.list.slice(0, 4) || [],
        }, () => {
          if (this.state.abilityTypeList && this.state.abilityTypeList.length > 0) {
            setAbilityType && setAbilityType(true)
          } 
        })
      }
    })
  }
  render() {
    const {abilityTypeList} = this.state;
    return (
      abilityTypeList.length > 0 && (
        <div className={style["culture-course"]}>
          <CourseModuleHeader  text='我的专属' id="my-ability"/>
          <SwiperCourse type='ability' containerStyle={containerStyle} swiperOptions={this.state.swiperOptions}>
            {
              abilityTypeList.map((item, index) => {
                return (
                  <div key={item.id}>
                    <div 
                    className={style["ability-type-item"]} 
                    style={{backgroundImage: `url("${imgFilter(item.coverImagePath, 330, 200)}")`}}
                    onClick={() => this.skipToCourseDetail(item.id, index)}>
                      <p className={style["ability-type-item__text"]}>{item.abilityType}</p>
                    </div>
                  </div>
                )
              })
            }
          </SwiperCourse>
        </div>
      )
    );
  }
}

export default withRouter(MyAbilityType);