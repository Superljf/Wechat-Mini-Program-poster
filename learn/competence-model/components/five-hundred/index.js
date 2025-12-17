import React, { Component } from 'react';
import style from './style.css';
import guaImage from '@/assets/imgs/home/gua.png';

class FiveHundred extends Component {
  handleSubmit = () => {
    const { fiveHundred } = this.props;
    if (fiveHundred && fiveHundred.submitUrl) {
      window.open(fiveHundred.submitUrl, '_blank');
    }
  };

  render() {
    const { fiveHundred } = this.props;

    if (!fiveHundred) {
      return null;
    }

    const { totalProgress = 0, items = [] } = fiveHundred;

    return (
      <div className={style['five-hundred-container']}>
        <div className={style['five-hundred-title']}>
          <span className={style['title-bar']}></span>
          5个100
        </div>

        <div className={style['total-progress']}>
          <div className={style['progress-header']}>
            <img
              style={{
                width: '26px',
                height: '33px',
                scale: '1.4',
                marginRight: '16px',
              }}
              src={guaImage}
              alt='gua'
            />
            <div style={{ width: '100%' }}>
              <div className={style['progress-label']}>
                总进度：{totalProgress}%
              </div>
              <div className={style['progress-bar-wrapper']}>
                <div className={style['progress-bar']}>
                  <div
                    className={style['progress-fill']}
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={style['submit-section']}>
            <button className={style['submit-btn']} onClick={this.handleSubmit}>
              <span className={style['submit-icon']}></span>
              提交
            </button>
          </div>
        </div>

        <div className={style['items-list']}>
          {items.map((item, index) => (
            <div key={item.id || index} className={style['item-card']}>
              <div
                className={style['item-progress-circle']}
                style={{
                  background: `conic-gradient(${item.color || '#0A68F8'} ${
                    item.progress * 3.6
                  }deg, ${item.backgroundColor || '#CFE1FE'} 0deg)`,
                }}
              >
                <div className={style['circle-inner']}>
                  <div className={style['circle-text']}>
                    {item.progress || 0}%
                  </div>
                </div>
              </div>
              <div className={style['item-name']}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default FiveHundred;
