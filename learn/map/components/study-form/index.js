import React, { Component } from 'react';
import style from './style.css';
import YES_ICON from '@/assets/imgs/home/yes.png';
import NO_ICON from '@/assets/imgs/home/no.png';

// 是否达成图标

class StudyForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeAbilityTypeId: null,
      expandedCells: [], // 存储展开的单元格，格式为 'rowIndex-colIndex'
      cellNeedsExpandMap: {}, // 存储每个单元格是否需要展开按钮
      isScrolling: false, // 是否正在滚动
    };
    this.fixedBodyRef = React.createRef();
    this.scrollBodyRef = React.createRef();
    this.fixedColumnRef = React.createRef();
    this.scrollableRef = React.createRef();
  }

  componentDidMount() {
    this.setDefaultActiveAbilityType();
    this.$nextTick(() => {
      setTimeout(() => {
        this.checkRowHeight();
        this.syncRowHeights();
      }, 200);
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.knowledgeSkills !== this.props.knowledgeSkills) {
      this.setDefaultActiveAbilityType();
      this.$nextTick(() => {
        setTimeout(() => {
          this.checkRowHeight();
          this.syncRowHeights();
        }, 200);
      });
    }
  }

  $nextTick = (callback) => {
    setTimeout(callback, 0);
  };

  setDefaultActiveAbilityType = () => {
    const { knowledgeSkills } = this.props;
    if (
      knowledgeSkills &&
      knowledgeSkills.abilityTypes &&
      knowledgeSkills.abilityTypes.length > 0
    ) {
      const sortedTypes = [...knowledgeSkills.abilityTypes];

      // 检查当前选中的能力类型是否还存在
      const currentTypeExists = sortedTypes.some(
        (type) => type.id === this.state.activeAbilityTypeId
      );

      // 如果当前没有选中，或者选中的类型不存在，则选中第一个
      if (!this.state.activeAbilityTypeId || !currentTypeExists) {
        if (sortedTypes[0]) {
          this.setState({ activeAbilityTypeId: sortedTypes[0].id });
        }
      }
    }
  };

  handleAbilityTypeClick = (abilityTypeId) => {
    this.setState({ activeAbilityTypeId: abilityTypeId, expandedCells: [] });
    this.$nextTick(() => {
      setTimeout(() => {
        this.checkRowHeight();
        this.syncRowHeights();
      }, 200);
    });
  };

  // 表格表头
  tableHeaders = [
    '线上课程',
    '阅读/自学',
    '行动学习',
    '接受辅导',
    '参加会议',
    '撰写总结',
    '考试',
    '观察他人',
    '承担职责',
    '辅导他人',
    '标杆参考',
    '担任讲师',
    '岗位轮换',
  ];

  // 表头与字段的映射关系
  headerFieldMap = {
    线上课程: 'onlineCourse',
    '阅读/自学': 'reading',
    行动学习: 'actionLearning',
    接受辅导: 'coaching',
    参加会议: 'meeting',
    撰写总结: 'summary',
    考试: 'exam',
    观察他人: 'observation',
    承担职责: 'responsibility',
    辅导他人: 'mentoring',
    标杆参考: 'benchmark',
    担任讲师: 'lecturer',
    岗位轮换: 'rotation',
  };

  /**
   * 获取当前显示的数据
   */
  getTableData = () => {
    const { knowledgeSkills } = this.props;
    const { activeAbilityTypeId } = this.state;

    if (!knowledgeSkills || !knowledgeSkills.abilityTypes) {
      return [];
    }

    const activeAbilityType = knowledgeSkills.abilityTypes.find(
      (type) => type.id === activeAbilityTypeId
    );

    if (!activeAbilityType || !activeAbilityType.knowledgeSkills) {
      return [];
    }

    // 构建表格数据
    const tableData = activeAbilityType.knowledgeSkills.map(
      (knowledgeSkill) => {
        const cells = this.tableHeaders.map((header) => {
          const fieldName = this.headerFieldMap[header];
          if (!fieldName) return null;

          const formData =
            knowledgeSkill.studyForms && knowledgeSkill.studyForms[fieldName];
          if (!formData) return null;

          // 检查是否有有效数据
          if (Array.isArray(formData)) {
            if (formData.length === 0) return null;
            // 检查数组元素是否有有效内容
            const hasValidItem = formData.some((item) => {
              if (item === null || item === undefined) return false;
              if (typeof item === 'string') {
                return item.trim() !== '';
              }
              if (typeof item === 'object') {
                const keys = Object.keys(item);
                return keys.some((key) => {
                  const value = item[key];
                  if (value === null || value === undefined) return false;
                  if (typeof value === 'string') {
                    return value.trim() !== '';
                  }
                  return true;
                });
              }
              return true;
            });
            return hasValidItem ? formData : null;
          }

          if (typeof formData === 'string') {
            const trimmed = formData.trim();
            if (
              trimmed === '' ||
              trimmed === 'null' ||
              trimmed === 'undefined' ||
              trimmed === '[]' ||
              trimmed === '{}'
            ) {
              return null;
            }
            return trimmed;
          }

          return formData;
        });

        return {
          type: knowledgeSkill.name || '',
          cells: cells,
        };
      }
    );

    return tableData;
  };

  /**
   * 计算可见列（有数据的列）
   */
  getVisibleColumns = () => {
    const tableData = this.getTableData();
    if (!tableData || tableData.length === 0) {
      return [];
    }

    const visibleCols = [];
    for (let colIndex = 0; colIndex < this.tableHeaders.length; colIndex++) {
      let hasData = false;
      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];
        if (!row || !row.cells) continue;
        const cell = row.cells[colIndex];
        if (cell === undefined || cell === null) {
          continue;
        }
        if (Array.isArray(cell)) {
          if (cell.length === 0) continue;
          const hasValidItem = cell.some((item) => {
            if (item === null || item === undefined) return false;
            if (typeof item === 'string') {
              return item.trim() !== '';
            }
            if (typeof item === 'object') {
              const keys = Object.keys(item);
              return keys.some((key) => {
                const value = item[key];
                if (value === null || value === undefined) return false;
                if (typeof value === 'string') {
                  return value.trim() !== '';
                }
                return true;
              });
            }
            return true;
          });
          if (hasValidItem) {
            hasData = true;
            break;
          }
        } else if (typeof cell === 'string') {
          const trimmed = cell.trim();
          if (
            trimmed !== '' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined' &&
            trimmed !== '[]' &&
            trimmed !== '{}'
          ) {
            hasData = true;
            break;
          }
        } else {
          hasData = true;
          break;
        }
      }
      if (hasData) {
        visibleCols.push(colIndex);
      }
    }
    return visibleCols;
  };

  /**
   * 判断项是否被选中（根据isLearned字段）
   */
  isItemSelected = (listItem) => {
    if (!listItem || typeof listItem !== 'object') {
      return false;
    }
    return listItem.isLearned === true || listItem.isLearned === 'true';
  };

  /**
   * 获取列表项的显示文本
   */
  getListItemText = (listItem, colIndex) => {
    const header = this.tableHeaders[colIndex];
    if (header === '线上课程') {
      return listItem.name || listItem.courseName || '';
    } else if (header === '阅读/自学') {
      return listItem.name || listItem.title || listItem.articleName || '';
    }
    return listItem ? String(listItem) : '';
  };

  /**
   * 处理单元格点击跳转
   */
  handleItemClick = (headerType, listItem) => {
    if (!listItem || typeof listItem !== 'object') {
      return;
    }
    if (headerType === '线上课程') {
      const courseId = listItem.courseId || listItem.id;
      if (courseId && this.props.onCourseClick) {
        this.props.onCourseClick(courseId);
      }
    } else if (headerType === '阅读/自学') {
      const itemId =
        listItem.id ||
        listItem.bookId ||
        listItem.articleId ||
        listItem.libraryId;
      if (itemId && this.props.onBookClick) {
        this.props.onBookClick(itemId);
      }
    }
  };

  /**
   * 检查单元格是否需要展开按钮
   */
  isCellNeedsExpand = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    return this.state.cellNeedsExpandMap[cellKey] === true;
  };

  /**
   * 检查单元格是否已展开
   */
  isCellExpanded = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    return this.state.expandedCells.includes(cellKey);
  };

  /**
   * 切换单元格的展开/收起状态
   */
  toggleCell = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const expandedCells = [...this.state.expandedCells];
    const index = expandedCells.indexOf(cellKey);
    if (index > -1) {
      expandedCells.splice(index, 1);
    } else {
      expandedCells.push(cellKey);
    }
    this.setState({ expandedCells });
    this.$nextTick(() => {
      setTimeout(() => {
        this.syncRowHeights();
      }, 50);
    });
  };

  /**
   * 检查行高，判断是否需要展开按钮
   */
  checkRowHeight = () => {
    this.$nextTick(() => {
      const cellNeedsExpandMap = {};
      const scrollBody = this.scrollBodyRef.current;

      if (!scrollBody) return;

      const scrollRows = scrollBody.querySelectorAll(
        `.${style['data-row-scroll']}`
      );

      scrollRows.forEach((rowElement, rowIndex) => {
        const cellElements = rowElement.querySelectorAll(
          `.${style['cell-content']}`
        );
        cellElements.forEach((cell, colIndex) => {
          const computedStyle = window.getComputedStyle(cell);
          const fontSize = parseFloat(computedStyle.fontSize) || 13; // 手机端字体较小
          const maxHeight = fontSize * 1.6 * 6; // 6行高度
          const contentHeight = cell.scrollHeight;
          const cellKey = `${rowIndex}-${colIndex}`;
          if (contentHeight > maxHeight + 1) {
            cellNeedsExpandMap[cellKey] = true;
          } else {
            cellNeedsExpandMap[cellKey] = false;
          }
        });
      });

      this.setState({ cellNeedsExpandMap });
    });
  };

  /**
   * 同步左右两侧行的高度
   */
  syncRowHeights = () => {
    this.$nextTick(() => {
      const scrollBody = this.scrollBodyRef.current;
      const fixedBody = this.fixedBodyRef.current;
      if (!scrollBody || !fixedBody) return;

      const scrollRows = scrollBody.querySelectorAll(
        `.${style['data-row-scroll']}`
      );
      const fixedRows = fixedBody.querySelectorAll(
        `.${style['data-row-fixed']}`
      );

      if (scrollRows && fixedRows && scrollRows.length === fixedRows.length) {
        scrollRows.forEach((scrollRow, rowIndex) => {
          const fixedRow = fixedRows[rowIndex];
          if (scrollRow && fixedRow) {
            const scrollCells = scrollRow.querySelectorAll(
              `.${style['data-cell-scroll']}`
            );
            let maxCellHeight = 0;

            scrollCells.forEach((cell, colIndex) => {
              const cellKey = `${rowIndex}-${colIndex}`;
              const isExpanded = this.state.expandedCells.includes(cellKey);
              const cellContent = cell.querySelector(
                `.${style['cell-content']}`
              );
              let cellHeight;

              if (isExpanded && cellContent) {
                const originalHeight = cellContent.style.height;
                const originalMaxHeight = cellContent.style.maxHeight;
                cellContent.style.height = 'auto';
                cellContent.style.maxHeight = 'none';
                cellHeight = cell.scrollHeight;
                cellContent.style.height = originalHeight;
                cellContent.style.maxHeight = originalMaxHeight;
              } else {
                const computedStyle = window.getComputedStyle(cell);
                const fontSize = parseFloat(computedStyle.fontSize) || 16;
                const paddingTop = parseFloat(computedStyle.paddingTop) || 20;
                const paddingBottom =
                  parseFloat(computedStyle.paddingBottom) || 20;
                const contentHeight = fontSize * 1.6 * 6;
                const expandButton = cell.querySelector(
                  `.${style['expand-button']}`
                );
                const buttonHeight = expandButton
                  ? expandButton.getBoundingClientRect().height + 8
                  : 0;
                cellHeight =
                  contentHeight + paddingTop + paddingBottom + buttonHeight;
              }

              if (cellHeight > maxCellHeight) {
                maxCellHeight = cellHeight;
              }
            });

            const targetHeight = maxCellHeight;
            if (targetHeight > 0) {
              fixedRow.style.height = targetHeight + 'px';
              fixedRow.style.minHeight = targetHeight + 'px';
              fixedRow.style.maxHeight = targetHeight + 'px';
              const fixedCell = fixedRow.querySelector(
                `.${style['data-cell-fixed']}`
              );
              if (fixedCell) {
                fixedCell.style.height = targetHeight + 'px';
                fixedCell.style.minHeight = targetHeight + 'px';
                fixedCell.style.maxHeight = targetHeight + 'px';
              }

              scrollCells.forEach((cell, colIndex) => {
                const cellKey = `${rowIndex}-${colIndex}`;
                const isExpanded = this.state.expandedCells.includes(cellKey);
                if (isExpanded) {
                  cell.style.height = targetHeight + 'px';
                  cell.style.minHeight = targetHeight + 'px';
                  cell.style.maxHeight = 'none';
                } else {
                  cell.style.height = targetHeight + 'px';
                  cell.style.minHeight = targetHeight + 'px';
                  cell.style.maxHeight = targetHeight + 'px';
                }
              });
            }
          }
        });
      }
    });
  };

  /**
   * 同步滚动
   */
  syncScrollBody = (e) => {
    if (this.fixedBodyRef.current) {
      this.fixedBodyRef.current.scrollTop = e.target.scrollTop;
    }
    this.syncRowHeights();
  };

  syncFixedScroll = (e) => {
    if (this.scrollBodyRef.current) {
      this.scrollBodyRef.current.scrollTop = e.target.scrollTop;
    }
    this.syncRowHeights();
  };

  /**
   * 处理横向滚动，显示/隐藏阴影
   */
  handleHorizontalScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    if (this.fixedColumnRef.current) {
      if (scrollLeft > 0) {
        this.fixedColumnRef.current.classList.add(style['scrolling']);
      } else {
        this.fixedColumnRef.current.classList.remove(style['scrolling']);
      }
    }
  };

  render() {
    const { knowledgeSkills } = this.props;
    const { activeAbilityTypeId } = this.state;

    if (!knowledgeSkills || !knowledgeSkills.abilityTypes) {
      return null;
    }

    const sortedAbilityTypes = knowledgeSkills.abilityTypes;
    const tableData = this.getTableData();
    const visibleColumns = this.getVisibleColumns();

    return (
      <div className={style['study-form-container']}>
        {/* 能力类型按钮区域 */}
        <div className={style['ability-types-tabs']}>
          {sortedAbilityTypes.map((type) => (
            <div
              key={type.id}
              className={`${style['tab-item']} ${
                activeAbilityTypeId === type.id ? style['tab-item-active'] : ''
              }`}
              onClick={() => this.handleAbilityTypeClick(type.id)}
            >
              {type.name}
            </div>
          ))}
        </div>

        {/* 表格区域 */}
        {tableData.length > 0 && (
          <div
            className={style['data-section']}
            onScroll={this.handleHorizontalScroll}
          >
            <div className={style['data-wrapper']}>
              {/* 固定第一列 */}
              <div
                className={style['data-fixed-column']}
                ref={this.fixedColumnRef}
              >
                <div className={style['data-header-fixed']}>
                  <div
                    style={{ whiteSpace: 'nowrap' }}
                    className={`${style['data-cell-fixed']} ${style['header-first-row']}`}
                  >
                    类型/能力项
                  </div>
                </div>
                <div
                  className={style['data-body-fixed']}
                  ref={this.fixedBodyRef}
                  onScroll={this.syncFixedScroll}
                >
                  {tableData.map((row, rowIndex) => (
                    <div
                      key={`fixed-row-${rowIndex}`}
                      className={`${style['data-row-fixed']} ${
                        rowIndex === 0 ? style['first-data-row'] : ''
                      }`}
                    >
                      <div className={style['data-cell-fixed']}>{row.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 可滚动区域 */}
              <div
                className={style['data-scrollable']}
                ref={this.scrollableRef}
              >
                <div className={style['data-header-scroll']}>
                  {this.tableHeaders.map((header, colIndex) => {
                    if (!visibleColumns.includes(colIndex)) return null;
                    return (
                      <div
                        key={`header-${colIndex}`}
                        className={`${style['data-cell-scroll']} ${
                          style['header-first-row']
                        } ${style[`header-col-${colIndex + 2}`]}`}
                      >
                        {header}
                      </div>
                    );
                  })}
                </div>
                <div
                  className={style['data-body-scroll']}
                  ref={this.scrollBodyRef}
                  onScroll={this.syncScrollBody}
                >
                  {tableData.map((row, rowIndex) => (
                    <div
                      key={`row-${rowIndex}`}
                      className={`${style['data-row-scroll']} ${
                        rowIndex === 0 ? style['first-data-row'] : ''
                      }`}
                    >
                      {row.cells.map((cell, colIndex) => {
                        if (!visibleColumns.includes(colIndex)) return null;
                        const header = this.tableHeaders[colIndex];
                        const isListContent =
                          Array.isArray(cell) && cell.length > 0;
                        const isExpanded = this.isCellExpanded(
                          rowIndex,
                          colIndex
                        );
                        const needsExpand = this.isCellNeedsExpand(
                          rowIndex,
                          colIndex
                        );

                        return (
                          <div
                            key={`cell-${rowIndex}-${colIndex}`}
                            className={`${style['data-cell-scroll']} ${
                              isListContent ? style['has-list-content'] : ''
                            }`}
                          >
                            <div
                              className={`${style['cell-content']} ${
                                isExpanded ? style['expanded'] : ''
                              } ${isListContent ? style['has-list'] : ''}`}
                            >
                              {/* 如果是数组（courseList 或 articleList），渲染为列表 */}
                              {isListContent && (
                                <div className={style['cell-list']}>
                                  {cell.map((listItem, listIndex) => {
                                    const isCheckable =
                                      header === '线上课程' ||
                                      header === '阅读/自学';
                                    const isSelected =
                                      this.isItemSelected(listItem);
                                    const itemText = this.getListItemText(
                                      listItem,
                                      colIndex
                                    );

                                    return (
                                      <div
                                        key={`list-${rowIndex}-${colIndex}-${listIndex}`}
                                        className={`${
                                          style['cell-list-item']
                                        } ${
                                          isCheckable
                                            ? style['is-checkable']
                                            : ''
                                        } ${
                                          isCheckable
                                            ? style['is-clickable']
                                            : ''
                                        }`}
                                        onClick={() =>
                                          isCheckable &&
                                          this.handleItemClick(header, listItem)
                                        }
                                        title={itemText}
                                      >
                                        {isCheckable && (
                                          <React.Fragment>
                                            <div
                                              className={
                                                style['checkbox-wrapper']
                                              }
                                            >
                                              <img
                                                src={
                                                  isSelected
                                                    ? YES_ICON
                                                    : NO_ICON
                                                }
                                                alt={
                                                  isSelected
                                                    ? '已达成'
                                                    : '未达成'
                                                }
                                                className={
                                                  style['checkbox-icon']
                                                }
                                              />
                                            </div>
                                            <div className={style['item-text']}>
                                              {itemText}
                                            </div>
                                          </React.Fragment>
                                        )}
                                        {!isCheckable && <div>{itemText}</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* 如果是字符串，直接显示 */}
                              {!isListContent && cell && (
                                <div
                                  className={style['cell-text']}
                                  title={cell}
                                >
                                  {cell}
                                </div>
                              )}
                            </div>

                            {/* 展开/收起按钮 */}
                            {needsExpand && (
                              <div
                                className={`${style['expand-button']} ${
                                  isExpanded ? style['expanded'] : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.toggleCell(rowIndex, colIndex);
                                }}
                              >
                                <span className={style['expand-text']}>
                                  {isExpanded ? '收起' : '展开'}
                                </span>
                                <span className={style['expand-arrow']}></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default StudyForm;
