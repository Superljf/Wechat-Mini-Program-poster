/**
 * 职级定位逻辑
 * @param {string} level - 职级代码，如 'P3', 'M1'
 * @param {string} type - 'P' 或 'M'
 * @returns {string} 定位的职级，如果为空则返回默认值
 */
export function getLevelPosition(level, type = 'P') {
  if (!level || level === '') {
    return type === 'P' ? 'P0' : 'M0';
  }
  return level;
}

/**
 * 提取职级数字
 * @param {string} level - 职级代码，如 'P3', 'M1'
 * @returns {number} 职级数字
 */
export function extractLevelNumber(level) {
  if (!level) return 0;
  const match = level.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 能力大类排序
 * @param {Array} abilityTypes - 能力大类数组
 * @returns {Array} 排序后的数组
 */
export function sortAbilityTypes(abilityTypes) {
  const orderMap = {
    '专业能力': 1,
    '通用能力': 2,
    '核心能力': 3,
    '领导力': 4
  };
  
  return abilityTypes.sort((a, b) => {
    const orderA = orderMap[a.name] || 999;
    const orderB = orderMap[b.name] || 999;
    return orderA - orderB;
  });
}

/**
 * 学习形式排序
 * @param {Array} studyForms - 学习形式数组
 * @returns {Array} 排序后的数组
 */
export function sortStudyForms(studyForms) {
  const orderMap = {
    '线上课程': 1,
    '阅读/自学': 2,
    '行动学习': 3,
    '接受辅导': 4,
    '参加会议': 5,
    '撰写总结': 6,
    '考试': 7,
    '观察他人': 8,
    '成单职责': 9,
    '辅导他人': 10,
    '标杆参考': 11,
    '担任讲师': 12,
    '岗位轮换': 13
  };
  
  return studyForms.sort((a, b) => {
    const orderA = orderMap[a.name] || 999;
    const orderB = orderMap[b.name] || 999;
    return orderA - orderB;
  });
}

/**
 * 线上课程排序（学习中 > 未开始 > 已通过）
 * @param {Array} courses - 课程数组
 * @returns {Array} 排序后的数组
 */
export function sortOnlineCourses(courses) {
  const statusOrder = {
    'learning': 1,
    'not_started': 2,
    'completed': 3
  };
  
  return courses.sort((a, b) => {
    const orderA = statusOrder[a.status] || 999;
    const orderB = statusOrder[b.status] || 999;
    return orderA - orderB;
  });
}

/**
 * 文本溢出处理
 * @param {string} text - 文本内容
 * @param {number} maxLength - 最大长度
 * @returns {Object} { displayText, isOverflow, fullText }
 */
export function handleTextOverflow(text, maxLength = 20) {
  if (!text) return { displayText: '', isOverflow: false, fullText: '' };
  
  const fullText = String(text);
  const isOverflow = fullText.length > maxLength;
  const displayText = isOverflow ? fullText.substring(0, maxLength) + '...' : fullText;
  
  return { displayText, isOverflow, fullText };
}

/**
 * 根据用户科目学段过滤课程
 * @param {Array} courses - 课程数组
 * @param {string} userSubjectStage - 用户科目学段，如 '小学-数学'
 * @returns {Array} 过滤后的课程数组
 */
export function filterCoursesBySubjectStage(courses, userSubjectStage) {
  if (!userSubjectStage || !courses || courses.length === 0) {
    return courses || [];
  }
  
  // 如果课程没有科目学段限制，则显示
  // 如果有科目学段，则根据用户科目学段过滤
  return courses.filter(course => {
    if (!course.subjectStage) {
      return true; // 没有科目学段限制的课程，所有用户都可以看到
    }
    return course.subjectStage === userSubjectStage;
  });
}

/**
 * 检查学习形式是否有数据
 * @param {Object} studyForm - 学习形式对象
 * @returns {boolean} 是否有数据
 */
export function hasStudyFormData(studyForm) {
  if (!studyForm) return false;
  
  // 如果是数组，检查是否为空
  if (Array.isArray(studyForm)) {
    return studyForm.length > 0;
  }
  
  // 如果是对象，检查是否有有效数据
  if (typeof studyForm === 'object') {
    return Object.keys(studyForm).length > 0;
  }
  
  return false;
}

/**
 * 计算内容行数（估算）
 * @param {string|Array} content - 内容
 * @param {number} lineHeight - 行高（px）
 * @returns {number} 估算的行数
 */
export function estimateLineCount(content, lineHeight = 20) {
  if (!content) return 0;
  
  let text = '';
  if (Array.isArray(content)) {
    text = content.join(' ');
  } else {
    text = String(content);
  }
  
  // 简单估算：每行约30个字符（移动端）
  const charsPerLine = 30;
  return Math.ceil(text.length / charsPerLine);
}

