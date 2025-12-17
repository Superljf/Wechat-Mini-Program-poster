import React, { Component } from 'react';
import style from './style.css';

class Certificates extends Component {
  render() {
    const { certificates } = this.props;

    if (!certificates || certificates.length === 0) {
      return null;
    }

    return (
      <div className={style['certificates-container']}>
        <div className={style['certificates-title']}>
          <span className={style['title-bar']}></span>
          已获得证书
        </div>
        <div className={style['certificates-list']}>
          {certificates.map((cert, index) => (
            <div key={index} className={style['certificate-item']}>
              <div className={style['certificate-type']}>{cert.type}</div>
              <div className={style['certificate-info']}>
                {cert.category && (
                  <div className={style['info-row']}>
                    <span className={style['info-value']}>{cert.category}</span>
                  </div>
                )}
                {cert.subject && (
                  <div className={style['info-row']}>
                    <span className={style['info-label']}>学科：</span>
                    <span className={style['info-value']}>{cert.subject}</span>
                  </div>
                )}
                {cert.level && (
                  <div className={style['info-row']}>
                    <span className={style['info-label']}>等级：</span>
                    <span className={style['info-value']}>{cert.level}</span>
                  </div>
                )}
                {cert.number && (
                  <div className={style['info-row']}>
                    <span className={style['info-value']}>{cert.number}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Certificates;
