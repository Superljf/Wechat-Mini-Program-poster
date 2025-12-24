import React, { Component } from 'react';
import style from './style.css';
import $ from 'jquery';

export default class Music extends Component {
  musicPlay() {
    let audio = $('#h5-music-yearly');
    if (audio && audio[0]) {
      // 和 report-2025 保持同一套逻辑：依赖 audio autoPlay，点击切换播放/暂停
      if (audio[0].paused) {
        audio[0].play();
        $('.music-img-yearly').addClass(`${style['music-an']}`);
      } else {
        audio[0].pause();
        $('.music-img-yearly').removeClass(`${style['music-an']}`);
      }
    }
  }

  render() {
    return (
      <div
        className={`${style['music']}`}
        onClick={() => {
          this.musicPlay();
        }}
      >
        <img
          src={require('@/assets/imgs/report/musicIcon.png')}
          alt=''
          style={{ scale: '0.8' }}
          className={`${style['music-img1']} ${style['music-an']} music-img-yearly`}
        />
        <audio autoPlay loop id='h5-music-yearly'>
          <source
            src={require('@/assets/imgs/report/2025music.mp3')}
            type='audio/mp3'
          />
        </audio>
      </div>
    );
  }
}
