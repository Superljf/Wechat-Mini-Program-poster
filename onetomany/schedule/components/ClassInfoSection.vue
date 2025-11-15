<template>
  <div class="class-info-section">
    <!-- 页面标题和班级状态 -->
    <div class="header-section">
      <div class="header-left">
        <h2 class="class-title">{{ classData.courseName || '班级详情' }}</h2>
        <el-tag v-if="classData.courseConditionName" :type="getStatusType(classData.courseConditionName)" size="medium" class="status-tag">
          {{ classData.courseConditionName }}
        </el-tag>
      </div>
      <div class="header-right">
        <!-- 已结课不显示 -->
        <el-button v-if="classData.courseConditionName !== '已结课'" size="small" type="primary" @click="$emit('modify-class')">修改班级信息</el-button>
        <!-- 「未开课」「进行中」时显示-->
        <!-- 没有课次列表禁用 -->
        <el-button
          :disabled="!classData.attendClassPeriod"
          v-if="classData.courseConditionName === '进行中' || classData.courseConditionName === '未开课'"
          size="small"
          type="primary"
          plain
          @click="handleAdjustSchedule"
          >调整上课周期</el-button
        >
        <el-button v-if="classData.courseConditionName === '进行中'" size="small" type="primary" plain @click="handleFinishClass">
          结课
        </el-button>
        <el-button size="small" @click="$emit('sync-classin')" type="primary" plain>同步ClassIn</el-button>
        <el-button size="small" @click="$emit('print-roster')" type="primary" plain>打印点名表</el-button>
      </div>
    </div>

    <!-- 班级详细信息 -->
    <div class="info-detail-section">
      <div class="info-grid">
        <div class="text-item">
          <span class="text-item__label">班级编码</span>
          <el-tooltip :content="classData.courseNo" placement="top" :disabled="!classData.courseNo">
            <span class="text-item__content">{{ classData.courseNo }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">班级名称</span>
          <el-tooltip :content="classData.courseName" placement="top" :disabled="!classData.courseName">
            <span class="text-item__content">{{ classData.courseName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">班级简称</span>
          <el-tooltip :content="classData.shortName" placement="top" :disabled="!classData.shortName || classData.shortName.length <= 20">
            <span class="text-item__content">{{ classData.shortName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">班级类型</span>
          <el-tooltip
            :content="classData.classTypeCodeName"
            placement="top"
            :disabled="!classData.classTypeCodeName || classData.classTypeCodeName.length <= 20"
          >
            <span class="text-item__content">{{ classData.classTypeCodeName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">科目</span>
          <el-tooltip :content="classData.subjectName" placement="top" :disabled="!classData.subjectName || classData.subjectName.length <= 20">
            <span class="text-item__content">{{ classData.subjectName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">教师</span>
          <el-tooltip :content="classData.teacherName" placement="top" :disabled="!classData.teacherName || classData.teacherName.length <= 20">
            <span class="text-item__content">{{ classData.teacherName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">班主任</span>
          <el-tooltip
            :content="classData.courseManagerName"
            placement="top"
            :disabled="!classData.courseManagerName || classData.courseManagerName.length <= 20"
          >
            <span class="text-item__content">{{ classData.courseManagerName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">当前教材</span>
          <el-tooltip :content="classData.textbookName" placement="top" :disabled="!classData.textbookName || classData.textbookName.length <= 20">
            <span class="text-item__content">{{ classData.textbookName }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">排课周期</span>
          <el-tooltip :content="formatSchedulePeriod" placement="top" :disabled="!formatSchedulePeriod">
            <span class="text-item__content">{{ formatSchedulePeriod }}</span>
          </el-tooltip>
        </div>
        <div class="text-item">
          <span class="text-item__label">开课日期</span>
          <span class="text-item__content">{{ classData.startDate }}</span>
        </div>
        <div class="text-item">
          <span class="text-item__label">结课日期</span>
          <span class="text-item__content">{{ classData.endDate || '-' }}</span>
        </div>
        <div class="text-item">
          <span class="text-item__label">已上课次</span>
          <span class="text-item__content">{{ classData.times || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClassInfoSection',
  props: {
    classData: {
      type: Object,
      default: () => ({})
    },
    classList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    // 格式化排课周期
    formatSchedulePeriod() {
      const coursePeriodDtoList = this.classData.coursePeriodDtoList

      if (!coursePeriodDtoList || !Array.isArray(coursePeriodDtoList) || coursePeriodDtoList.length === 0) {
        return this.classData.attendClassPeriod || '-'
      }

      // 星期几的映射
      const weekMap = {
        1: '一',
        2: '二',
        3: '三',
        4: '四',
        5: '五',
        6: '六',
        7: '日'
      }

      // 格式化每个排课周期
      const periodTexts = coursePeriodDtoList
        .map(period => {
          if (!period.weekNum || !Array.isArray(period.weekNum) || period.weekNum.length === 0) {
            return ''
          }

          // 处理多个星期几
          const weekTexts = period.weekNum
            .map(weekNumber => {
              const weekText = weekMap[weekNumber]
              return weekText ? `周${weekText}` : ''
            })
            .filter(text => text)

          // 格式化时间，将-替换为~
          const courseTime = period.courseTime ? period.courseTime.replace('-', '~') : ''

          if (weekTexts.length > 0 && courseTime) {
            return `${weekTexts.join('、')}${courseTime}`
          }

          return ''
        })
        .filter(text => text)

      // 用、连接所有排课周期，最后加上"每"前缀
      return periodTexts.length > 0 ? `每${periodTexts.join('、')}` : this.classData.attendClassPeriod || '-'
    }
  },
  methods: {
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        未开课: '',
        进行中: 'success',
        已结课: 'info'
      }
      return typeMap[status] || 'info'
    },

    // 获取状态文本（后端直接返回中文，无需转换）
    getStatusText(status) {
      return status || '-'
    },

    // 调整上课周期
    handleAdjustSchedule() {
      this.$emit('adjust-schedule')
    },

    // 结课
    handleFinishClass() {
      // 校验班级下课次是否都已点名 或者为0
      const unattendedClasses = this.classList.filter(classItem => classItem.attendStatus !== 4 && classItem.attendStatus !== 0)

      if (unattendedClasses.length > 0) {
        this.$message.warning('班级下有课次未点名无法结课哦~')
        return
      }

      // 所有课次都已考勤，可以结课
      this.$emit('finish-class')
    }
  }
}
</script>

<style lang="scss" scoped>
.class-info-section {
  // 页面标题区域
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;

      .class-title {
        font-size: 20px;
        font-weight: bold;
        margin: 0;
      }

      .status-tag {
        font-size: 12px;
      }
    }

    .header-right {
      .el-button {
        margin-left: 10px;

        &:first-child {
          margin-left: 0;
        }
      }
    }
  }

  // 班级信息区域
  .info-detail-section {
    background-color: #f8f8f8;
    padding: 16px 20px;
    border-radius: 4px;
    margin-bottom: 24px;

    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      width: 100%;
      justify-content: space-between;
    }

    .text-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      flex: 0 0 calc(22% - 13px);
      min-width: 200px;
    }

    .text-item__label {
      font-size: 13px;
      color: #999;
      margin-right: 8px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .text-item__content {
      font-size: 13px;
      color: #333;
      line-height: 1.5;
      flex: 1;
      min-width: 0;
      // 超出省略号
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 响应式布局
  @media screen and (max-width: 1600px) {
    .text-item {
      flex: 0 0 calc(25% - 12px);
    }
  }

  @media screen and (max-width: 1200px) {
    .text-item {
      flex: 0 0 calc(33.33% - 11px);
    }
  }

  @media screen and (max-width: 900px) {
    .text-item {
      flex: 0 0 calc(50% - 8px);
    }
  }

  @media screen and (max-width: 600px) {
    .text-item {
      flex: 0 0 100%;
    }
  }
}
</style>
