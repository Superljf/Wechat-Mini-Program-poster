import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

import SwiperCourse from '../../../../components/swiper-course';
import CourseModuleHeader from '../course-moudle-header';
import {imgFilter} from '../../../../utils';
import style from './style.css';
import api from "../api";

const htmlFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
const pxPerRem = Math.round(htmlFontSize);

// const swiperOptions = {
//   slidesPerView: 2,
//   slidesPerColumn: 2,
//   slidesPerGroup: 2,
//   spaceBetween: 0.3 * pxPerRem,
// };
const slideStyle = {
};
const containerStyle = {
  padding: '0 0.3rem 0.6rem',
};

class CultureCourse extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cultureCourses: [],
      swiperOptions : {
        slidesPerView: 2,
        slidesPerColumn: 1,
        slidesPerGroup: 2,
        spaceBetween: 0.05 * pxPerRem,
      }
    }
  }

  componentDidMount() {
    this.getCultureCourses()
  }

  getCultureCourses () {
    let {setShowCultureCourse} = this.props
    api.getCultrueCourses({pageNum: 1, pageSize: 8}).then(res => {
      this.setState({
        cultureCourses: res.list || []
      }, () => {
        if (this.state.cultureCourses && this.state.cultureCourses.length > 0) {
          setShowCultureCourse && setShowCultureCourse(true)
        }
      })
    })
  }

  skipToCourseDetail (courseId) {
    this.props.history.push(`/course/record/${courseId}`)
  }

  render() {
    const {cultureCourses} = this.state;
    return (
      cultureCourses.length > 0 && (
        <div className={style["culture-course"]}>
          <CourseModuleHeader text='企业文化' id="culture-course"/>
          <SwiperCourse type='culture' containerStyle={containerStyle} slideStyle={slideStyle} swiperOptions={this.state.swiperOptions}>
            {
              cultureCourses.map(course => {
                return (
                  <img
                    onClick={() => this.skipToCourseDetail(course.courseId)}
                    key={course.courseId}
                    className={style["culture-course__img"]}
                    src={imgFilter(course.coverImagePath, 330, 200)}
                    alt={course.courseName} />
                )
              })
            }
          </SwiperCourse>
        </div>
      )
    );
  }
}

export default withRouter(CultureCourse);