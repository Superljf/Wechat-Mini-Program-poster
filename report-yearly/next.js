import React, {Component} from 'react';
import style from './style.css';

export default class Next extends Component {

    render() {
        const { show = true, onClick } = this.props;
        if (!show) return null;
        return (
            <div className={`${style["next"]} next` } id={this.props.id} onClick={onClick}>
                <span>
                    <label className="button" href="#"><img src={require('@/assets/h5/next.png')} alt=""/></label>
                </span>
            </div>
        );
    }
}

