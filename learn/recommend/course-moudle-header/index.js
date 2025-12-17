import React, {Component} from 'react';
import PropTypes from 'prop-types';
import style from './style.css';

class CourseModuleHeader extends Component {
  render() {
    const {icon, text, src, imgClassName} = this.props;
    let imgOrIcon = null;
    if (icon) {
      imgOrIcon = <i className={`${style["course-module-header__icon"]} iconfont ${icon}`} />
    } else if (!icon && !src) {
      imgOrIcon = null
    } else {
      imgOrIcon = <img src={src} className={`${imgClassName} ${style["course-module-header__img"]}`} alt={text}/>
    } 
    return (
      <div className={style["course-module-header"]} id={this.props.id ? this.props.id : ''}>
        { imgOrIcon }
        <div className={style["course-module-header__text"]}>{text}</div>
        <div className={style['course-module-header__text__border']}></div>
      </div>
      
    );
  }
}

export default CourseModuleHeader;

CourseModuleHeader.propTypes = {
  src: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string.isRequired
};
