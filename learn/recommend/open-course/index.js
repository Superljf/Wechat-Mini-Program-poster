import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

import CourseModuleHeader from '../course-moudle-header';
import CoursePanel from './course-panel';
import CourseRecordItem from '../../../../components/course-record-item';
import SwiperCourse from '../../../../components/swiper-course';
import openCourseApi from '../../../../api/open-course';
import {imgFilter} from "../../../../utils";
import style from './style.css';

const htmlFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
const pxPerRem = Math.round(htmlFontSize);

// const swiperOptions = {
//   slidesPerColumn: 4,
//   spaceBetween: 0.3 * pxPerRem,
// };
const slideStyle = {
  width: '6.9rem',
};
const containerStyle = {
  paddingBottom: '0.6rem',
};

class OpenCourse extends Component {

  constructor(props) {
    super(props);
    this.skipToCourseDetail = this.skipToCourseDetail.bind(this);
    this.getHotOpenCourseType = this.getHotOpenCourseType.bind(this);
    this.getNewestOpenCourseType = this.getNewestOpenCourseType.bind(this);
    this.state = {
      openRecordCourses: [],
      openCourseType: 'NEWEST',
      isNewest: true,
      swiperOptions: {
        slidesPerColumn: 4,
        spaceBetween: 0.3 * pxPerRem,
        on: {
          slideChangeTransitionStart: ()=> {
            let swiper = this.refs.record.refs.record.swiper
            if (swiper.activeIndex === 1){
              this.getHotOpenCourseType()
            } else {
              this.getNewestOpenCourseType()
            }
          }
        }
      }
    }
  }

  componentDidMount() {
    this.getOpenRecordCourses()
  }

  async getOpenRecordCourses () {
    // openCourseApi.getOpenRecordCourses({pageNum: 1, pageSize: 8, openCourseType: this.state.openCourseType}).then(res => {
    //   this.setState({
    //     openRecordCourses: res.list || []
    //   })
    // })
    let NewestRes = await openCourseApi.getOpenRecordCourses({pageNum: 1, pageSize: 4, openCourseType: 'NEWEST'})
    let HotRes = await openCourseApi.getOpenRecordCourses({pageNum: 1, pageSize: 4, openCourseType: 'HOT'})
    let res = []
    if (NewestRes && HotRes) {
      res = NewestRes.list.concat(HotRes.list)
    }
    this.setState({
      openRecordCourses: res
    })
  }
  getNewestOpenCourseType () {
    let swiper = this.refs.record.refs.record.swiper
    this.setState({
      openCourseType: 'NEWEST',
      isNewest: true
    }, ()=> {
      swiper.slideTo(0)
    })
  }
  getHotOpenCourseType () {
    let swiper = this.refs.record.refs.record.swiper
    this.setState({
      openCourseType: 'HOT',
      isNewest: false
    }, ()=> {
      swiper.slideTo(1)
    })
  }
  skipToCourseDetail (courseId) {
    this.props.history.push(`/course/record/${courseId}`)
  }
  render() {
    const { openRecordCourses } = this.state;
    let showOpenCourse = openRecordCourses.length > 0;
    return (
      showOpenCourse && <div>
        <CourseModuleHeader  text='公开课' id="open-course"/>
        {
          openRecordCourses.length > 0 && (
            <CoursePanel title='公开课课程' moreTo={{pathname:'/open-course/record', query:{openCourseType: this.state.openCourseType}}}>
              <div className={style['open-course-type']}>
                <span 
                  onClick={this.getNewestOpenCourseType.bind(this)} 
                  className={this.state.isNewest ? style['open-course-type-active'] : null}>最新</span>
                <span 
                  onClick={this.getHotOpenCourseType.bind(this)} 
                  className={this.state.isNewest ? null : style['open-course-type-active']}>最热</span>
              </div>
              <SwiperCourse ref="record" type='record' containerStyle={containerStyle} slideStyle={slideStyle} swiperOptions={this.state.swiperOptions} >
                {
                  openRecordCourses.map(course => {
                    return (
                      <CourseRecordItem
                        handleClick={this.skipToCourseDetail}
                        key={course.courseId}
                        courseId = {course.courseId}
                        courseName={course.courseName}
                        charge={course.charge}
                        lecturerName={course.keynoteTeacherName}
                        imgSrc={imgFilter(course.coverImagePath)}
                        studentCount={course.studentCount}
                        averageScore={course.averageScore}
                      />
                    )
                  })
                }
              </SwiperCourse>
            </CoursePanel>
          )
        }
      </div>
    );
  }
}

export default withRouter(OpenCourse);