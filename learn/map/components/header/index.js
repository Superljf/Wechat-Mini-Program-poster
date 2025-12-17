import React, { Component } from 'react';
import style from './style.css';

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropdown: false,
    };
    this.dropdownRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = (e) => {
    if (
      this.dropdownRef.current &&
      !this.dropdownRef.current.contains(e.target)
    ) {
      this.setState({ showDropdown: false });
    }
  };

  toggleDropdown = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({ showDropdown: !prevState.showDropdown }));
  };

  handlePostSelect = (id) => {
    this.setState({ showDropdown: false });
    if (this.props.onPostChange) {
      this.props.onPostChange(id);
    }
  };

  render() {
    const {
      userHRMData,
      currentPostId,
      currentProfessionalLevel,
      currentManagementLevel,
      onViewCompetenceModel,
    } = this.props;
    const { showDropdown } = this.state;

    if (!userHRMData) return null;

    const mainPost = userHRMData.mainPost || null;
    const partTimePosts = userHRMData.partTimePosts || [];
    const hasPartTimePosts = partTimePosts && partTimePosts.length > 0;
    const allPosts = mainPost ? [mainPost, ...partTimePosts] : partTimePosts;
    // 使用id字段匹配当前岗位
    const currentPost =
      allPosts.find((p) => p && p.id === currentPostId) ||
      allPosts.find((p) => p && p.postId === currentPostId) ||
      mainPost;

    const postName =
      (currentPost && currentPost.postName) || userHRMData.postName || '岗位';
    const levelText = `${currentProfessionalLevel || 'P0'}/${
      currentManagementLevel || 'M0'
    }`;

    return (
      <div className={style['header-container']}>
        <div className={style['header-title']}>
          <span className={style['header-title-text']}>{postName}学习地图</span>
        </div>
        <div className={style['header-row']}>
          {/* 左侧：岗位选择 */}
          <div className={style['post-selector']} ref={this.dropdownRef}>
            {hasPartTimePosts ? (
              <div className={style['dropdown-wrapper']}>
                <div
                  className={style['dropdown-trigger']}
                  onClick={this.toggleDropdown}
                >
                  <span className={style['post-name']}>{postName}</span>
                  <i
                    className={`iconfont icon-xia ${style['dropdown-icon']}`}
                  />
                </div>
                {showDropdown && (
                  <div className={style['dropdown-menu']}>
                    {allPosts.map((post, index) => {
                      const isMainPost = mainPost && post.id === mainPost.id;
                      const isSelected =
                        post.id === currentPostId ||
                        post.postId === currentPostId;
                      return (
                        <div
                          key={post.id || post.postId}
                          className={`${style['dropdown-item']} ${
                            isSelected ? style['dropdown-item-selected'] : ''
                          }`}
                          onClick={() => this.handlePostSelect(post.id)}
                        >
                          <span className={style['post-type']}>
                            {isMainPost ? '主岗' : '兼岗'}
                          </span>
                          <span className={style['post-divider']}>|</span>
                          <span className={style['post-name-text']}>
                            {post.postName}
                          </span>
                          {isSelected && (
                            <i
                              className={`iconfont icon-gou ${style['check-icon']}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className={style['post-name-static']}>{postName}</div>
            )}
          </div>

          {/* 中间：职级信息 */}
          <div className={style['level-info']}>{levelText}</div>

          {/* 右侧：查看胜任力模型按钮 */}
          <div className={style['model-btn']} onClick={onViewCompetenceModel}>
            查看胜任力模型
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
