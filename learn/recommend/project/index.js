import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';

import CourseModuleHeader from '../course-moudle-header';
import ProjectCard from '../../../../components/project-card';
import projectApi from '../../../project/api';
import style from './style.css';
import CoursePanel from '../open-course/course-panel';
class Project extends Component {

  constructor(props) {
    super(props);
    this.getProjectList = this.getProjectList.bind(this);
    this.skipToProjectDetail = this.skipToProjectDetail.bind(this);
    this.state = {
      projectList: []
    }
  }

  componentDidMount() {
    this.getProjectList()
  }

  getProjectList () {
    projectApi.getProjectList({pageNum: 1, pageSize: 3}).then(res => {
      let projectList = (res && res.data && res.data.list) || [];
      this.setState({
        projectList
      })
    })
  }

  skipToProjectDetail (id) {
    this.props.history.push(`/project/${id}`)
  }

  render() {
    const { projectList } = this.state;
    return (
      (projectList && projectList.length > 0)
      && <div className={style["project-module"]}>
        <CourseModuleHeader key='projectModuleHeader' imgClassName={style["project-img__logo"]} text='培养项目' id="project"/>
        <CoursePanel title='培养项目' moreTo='/project'>
          {
            projectList.map(project => {
              return (
                <ProjectCard onClick={() => this.skipToProjectDetail(project.id)} key={project.id} projectInfo={project}/>
              )
            })
          }
        </CoursePanel>
        {/* <div className={style["project-panel"]}>
          <Link to='/project' className={style["project-panel__more"]}>
            <span>更多</span>
            <i className="iconfont icon-you"/>
          </Link>
        </div> */}
       
      </div>
    );
  }
}

export default withRouter(Project);