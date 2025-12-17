import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

import CourseModuleHeader from '../course-moudle-header';
import CoursePanel from '../open-course/course-panel';
import CourseRecordItem from '../../../../components/course-record-item';
import ceoCourseApi from '../../../../api/ceo-course';
import {imgFilter} from "../../../../utils";

class CeoColumn extends Component {

  constructor(props) {
    super(props);
    this.skipToCourseDetail = this.skipToCourseDetail.bind(this);
    this.state = {
      ceoColumnCourses: []
    }
  }

  componentDidMount() {
    this.getCeoColumnCourses()
  }

  getCeoColumnCourses () {
    let {setShowCeoColumn} = this.props
    ceoCourseApi.getCeoCourses({pageNum: 1, pageSize: 8}).then(res => {
      this.setState({
        ceoColumnCourses: res.list || []
      }, () => {
        if (this.state.ceoColumnCourses && this.state.ceoColumnCourses.length > 0) {
          setShowCeoColumn && setShowCeoColumn(true)
        }
      })
    })
  }

  skipToCourseDetail (courseId) {
    this.props.history.push(`/course/record/${courseId}`)
  }

  render() {
    let { ceoColumnCourses } = this.state;
    let showCeoCourse = ceoColumnCourses.length > 0;
    if (ceoColumnCourses.length > 4) {
      ceoColumnCourses = ceoColumnCourses.slice(0,4)
    }
    return (
      showCeoCourse && <div>
        <CourseModuleHeader text='CEO专栏' id="ceo-column" />
        {
          ceoColumnCourses.length > 0 && (
            <CoursePanel title="CEO专栏课程" moreTo='/ceo-column' >
              {/* <SwiperCourse type='record' containerStyle={containerStyle} slideStyle={slideStyle} swiperOptions={swiperOptions}> */}
                {
                  ceoColumnCourses.map(course => {
                    return (
                      <CourseRecordItem
                        className='course-record-padding-bottom'
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
              {/* </SwiperCourse> */}
            </CoursePanel>
          )
        }
      </div>
    );
  }
}

export default withRouter(CeoColumn);