import React, {Component} from 'react';
import style from './style.css';

class NavPosition extends Component {
  constructor (props) {
    super(props)
    this.sliderNav = this.sliderNav.bind(this)
    this.jumpModule = this.jumpModule.bind(this)
    this.state = {
      isSliderNav: false
    }
  }
  sliderNav () {
    this.setState({
      isSliderNav: !this.state.isSliderNav
    })
  }
  jumpModule (id){
    if (id) {
      let element = document.getElementById(id);
      if (element) { 
        element.scrollIntoView({behavior: "smooth"}); 
      }
    }
  }
  render () {
    let {isGroupWorker, showCultureCourse, showCeoColumn, showAbilityType} = this.props
    return (
      <div className={style['nav-position']}>
          <div className={[style['nav-position-content'], style['nav-position-down']].join(' ')}>
            <button onClick={this.sliderNav.bind(this)} className={style['nav-position-button']}>导航</button>
          </div>
          <div className={`${style['nav-position-up']} `}>
            <div className={`${style['nav-position-content']} ${style['nav-position-container-static']} ${this.state.isSliderNav ? style['nav-position-container-slider'] : null}`}>
              <div className={style['nav-icon-item']} onClick={this.sliderNav.bind(this)}>
                <i className={`iconfont icon-shouqi `} style={{fontSize:"0.14rem"}}></i>
              </div>
              { isGroupWorker &&
              <div className={style['nav-icon-item']} onClick={this.jumpModule.bind(this, 'ranking-list')}>
                <i className={`iconfont icon-culture }`} style={{fontSize:"0.35rem"}}></i>
                <div className={style['nav-icon-item_text']}>排行榜</div>
              </div>
              }
              { showCeoColumn &&
              <div className={style['nav-icon-item']} onClick={this.jumpModule.bind(this, 'ceo-column')}>
                <i className={`iconfont icon-ceo `} style={{fontSize:"0.35rem"}}></i>
                <div className={style['nav-icon-item_text']}>CEO</div>
              </div>
              }
              <div className={style['nav-icon-item']} onClick={this.jumpModule.bind(this, 'open-course')}>
                <i className={`iconfont icon-open_class `} style={{fontSize:"0.35rem"}}></i>
                <div className={style['nav-icon-item_text']}>公开课</div>
              </div>
              {showAbilityType && 
              <div className={style['nav-icon-item']} onClick={this.jumpModule.bind(this, 'my-ability')}>
                <i className={`iconfont icon-ability `} style={{fontSize:"0.35rem"}}></i>
                <div className={style['nav-icon-item_text']}>专属</div>
              </div>
              }
              { showCultureCourse &&
              <div className={style['nav-icon-item']} onClick={this.jumpModule.bind(this, 'culture-course')}>
                <i className={`iconfont icon-qiyewenhua `} style={{fontSize:"0.3rem"}}></i>
                <div className={style['nav-icon-item_text']} style={{marginBottom:"0px"}}>企业</div>
                <div className={style['nav-icon-item_text']} style={{marginTop:"0"}}>文化</div>
              </div>
              }
            </div>
            
          </div>
        
      </div>
    )
  }
}
export default NavPosition