import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';

import style from './style.css';

class CoursePanel extends Component {
  render() {
    const { title, moreTo, children} = this.props;
    return (
      <div className={style["course-panel"]}>
        {children}
        {
          moreTo &&
          <div className={style["course-panel-header"]}>
            <Link to={moreTo} className={style["course-panel-header__more"]}>
              <span>更多{title}</span>
              <i className="iconfont icon-you"/>
            </Link>
           </div>
        }
        
        
      </div>
    );
  }
}

export default CoursePanel;

CoursePanel.propTypes = {
  // moreTo: PropTypes.oneOfType([PropTypes.string.isRequired, PropTypes.object.isRequired]),
  title: PropTypes.string.isRequired
};
