<template>
  <div>
    <el-drawer
      title="课次学员考勤详情"
      :visible.sync="drawerVisible"
      direction="rtl"
      size="600px"
      :close-on-press-escape="false"
      :wrapperClosable="true"
      @close="handleClose"
      class="student-attendance-detail-drawer"
    >
      <div class="drawer-content" v-loading="loading">
        <!-- 课次学员信息 -->
        <div class="detail-section">
          <div class="section-title">课次学员信息</div>
          <div class="makeup-info-grid">
            <div class="info-item">
              <span class="label">学员姓名</span>
              <span class="value"
                >{{ detailData.studentName || '-' }} <span v-if="detailData.englishName">（{{ detailData.englishName }}）</span></span
              >
            </div>

            <div class="info-item">
              <span class="label">考勤状态</span>
              <span class="value">
                <el-tag :type="getStatusType(detailData.attendType)" size="small">
                  {{ detailData.attendTypeDesc || '-' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">上课日期</span>
              <span class="value">{{ detailData.courseDate || '-' }} {{ detailData.weekday ? `（${detailData.weekday}）` : '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">上课时间</span>
              <span class="value">{{ detailData.startTime && detailData.endTime ? `${detailData.startTime}-${detailData.endTime}` : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">班级名称</span>
              <span class="value">{{ detailData.courseName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">班主任</span>
              <span class="value">{{ detailData.courseManagerName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">老师</span>
              <span class="value">{{ detailData.teacherName || '-' }}</span>
            </div>
            <!-- 外教 - 仅佳音显示 -->
            <div class="info-item" v-if="isJiayin">
              <span class="label">外教</span>
              <span class="value">{{ detailData.foreignTeacherName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">考勤单号</span>
              <span class="value">{{ detailData.encoding || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 补课信息 - 仅有补课状态且非置空状态时显示 -->
        <div class="detail-section" v-if="hasMakeupInfo && !isEmptyStatus">
          <div class="section-title">补课信息</div>

          <!-- 补课状态 -->
          <div class="makeup-status-row">
            <span class="status-label">补课状态</span>
            <span class="status-dot" :class="getMakeupStatusClass(detailData.makeupStatus)"></span>
            <span class="status-text">{{ detailData.makeupStatusDesc || '-' }}</span>
          </div>

          <!-- 补课基本信息 -->
          <div class="makeup-info-grid">
            <!-- 根据补课状态显示不同的时间标签 -->
            <div class="info-item">
              <span class="label">{{ makeupTimeLabel }}</span>
              <span class="value">
                <!-- 已补课：显示实际补课时间 -->
                <template v-if="detailData.makeupStatus === 30">
                  {{ detailData.actualMakeupDate || '-' }}
                  <span v-if="detailData.actualStartTime && detailData.actualEndTime">
                    （{{ `${detailData.actualStartTime}-${detailData.actualEndTime}` }}）
                  </span>
                </template>
                <!-- 已约课、未约课：显示预计补课时间 -->
                <template v-else>
                  {{ detailData.expectedMakeupDate || '-' }}
                  <span v-if="detailData.expectedStartTime && detailData.expectedEndTime">
                    （{{ `${detailData.expectedStartTime}-${detailData.expectedEndTime}` }}）
                  </span>
                </template>
              </span>
            </div>
            <div class="info-item">
              <span class="label" style="width: 85px;">补课类型</span>
              <span class="value">{{ detailData.makeupTypeDesc || '-' }}</span>
            </div>
          </div>

          <!-- 约课备注独占一行 -->
          <div class="makeup-remark-row">
            <span class="label" style="width: 85px;">约课备注</span>
            <!-- 约课备注单独处理，超出时显示省略号 -->
            <el-tooltip :content="detailData.makeupRemark || ''" placement="top">
              <span class="value makeup-remark-value">{{ detailData.makeupRemark || '-' }}</span>
            </el-tooltip>
          </div>

          <!-- 老师列表表格 - 仅佳音显示 -->
          <div class="teacher-list-section" v-if="isJiayin && hasMakeupTeachers">
            <el-table :data="makeupTeacherList" border size="small" class="teacher-table" header-cell-class-name="table-header-cell">
              <el-table-column prop="teacherType" label="类型" width="70" align="center" />
              <el-table-column prop="teacherName" label="老师" width="210" align="center" />
              <el-table-column label="正课" align="center">
                <template slot-scope="scope">
                  <div class="time-display-wrapper">
                    <span class="time-value">{{ scope.row.regularMinutes || 0 }}</span>
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="口语" align="center">
                <template slot-scope="scope">
                  <div v-if="scope.row.teacherType === '外教'" class="time-display-wrapper">
                    <span class="time-value">{{ scope.row.oralMinutes || 0 }}</span>
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="detail-section">
          <div class="section-title">订单信息</div>
          <div v-if="detailData.orderItemVos && detailData.orderItemVos.length > 0">
            <div class="order-item" v-for="(order, index) in detailData.orderItemVos" :key="index">
              <div class="order-header">
                <span class="order-no">报班单号: {{ order.orderNo || '-' }}</span>
                <span class="course-type">{{ order.courseSubTypeName || '-' }}</span>
              </div>
              <div style="padding: 8px 16px; padding-bottom: 16px;">
                <div class="order-content">
                  <div class="course-name">{{ order.orderName || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="detailData.orderNo">
            <!-- 兼容旧格式 -->
            <div class="order-item">
              <div class="order-header">
                <span class="order-no">报班单号: {{ detailData.orderNo || '-' }}</span>
                <span class="course-type">{{ detailData.courseSubTypeName || '-' }}</span>
              </div>
              <div style="padding: 8px 16px; padding-bottom: 16px;">
                <div class="order-content">
                  <div class="course-name">{{ detailData.orderCourseName || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-order">
            暂无订单信息
          </div>
        </div>

        <!-- 考勤记录 -->
        <div v-if="attendanceRecords.length > 0" class="detail-section" style="padding-bottom: 30px;">
          <div class="section-title">考勤记录</div>
          <div class="attendance-records">
            <div v-if="attendanceRecords.length === 0" class="no-records">
              暂无考勤记录
            </div>
            <div v-else>
              <div class="record-header">
                <span class="col-time">操作时间</span>
                <span class="col-operator">操作人</span>
                <span class="col-status">操作考勤状态</span>
                <span class="col-remark">备注</span>
              </div>
              <div class="record-item" v-for="record in attendanceRecords" :key="record.id">
                <span class="col-time">{{ record.operateTime }}</span>
                <span class="col-operator">{{ record.operatorName }}</span>
                <span class="col-status">{{ record.attendanceStatusText }}</span>
                <span class="col-remark">{{ record.remark || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <el-button v-if="showAttendanceButton" type="primary" @click="handleAttendance" size="small">
          立即考勤
        </el-button>
      </div>
    </el-drawer>

    <!-- 课次考勤抽屉 - 移到外部避免层级问题 -->
    <ClassAttendanceDrawer :visible.sync="showAttendanceDrawer" :class-data="classData" source="student" @refresh="handleAttendanceSuccess" />
  </div>
</template>

<script>
import ClassAttendanceDrawer from '../class-attendance/ClassAttendanceDrawer.vue'
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'

export default {
  name: 'StudentAttendanceDetailDrawer',
  components: {
    ClassAttendanceDrawer
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    },
    // 课次ID，用于获取详情
    attendanceId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      showAttendanceDrawer: false,
      // 是否为佳音（根据后端数据判断）
      isJiayin: false,
      // 考勤详情数据
      detailData: {},
      // 考勤记录历史
      attendanceRecords: []
    }
  },
  computed: {
    drawerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    // 是否有补课信息
    hasMakeupInfo() {
      return this.detailData.makeupStatus && this.detailData.makeupStatus !== null
    },
    // 是否为置空状态
    isEmptyStatus() {
      return this.detailData.attendType === 20 // 置空状态
    },
    // 补课时间标签
    makeupTimeLabel() {
      const status = this.detailData.makeupStatus
      // 根据补课状态显示不同文案
      if (status === 30) {
        // 已补课：显示实际补课时间
        return '实际补课时间'
      } else if (status === 20 || status === 10) {
        // 已约课(20)、未约课(10)：显示预计补课时间
        return '预计补课时间'
      }
      // 兼容旧格式
      if (status === 'COMPLETED') {
        return '实际补课时间'
      } else if (status === 'BOOKED' || status === 'SCHEDULED') {
        return '预计补课时间'
      }
      return '补课时间'
    },
    // 是否显示立即考勤按钮
    showAttendanceButton() {
      return this.detailData.attendType === 28 || this.detailData.attendType === 20
    },
    // 是否有补课老师信息（仅佳音显示）
    hasMakeupTeachers() {
      return this.isJiayin
    },
    // 补课老师列表数据
    makeupTeacherList() {
      if (!this.hasMakeupTeachers) return []
      const teachers = []

      teachers.push({
        teacherType: '中教',
        teacherName: this.detailData.makeupTeacherName || '-',
        regularMinutes: this.detailData.teacherMinutes || 0,
        oralMinutes: 0
      })

      teachers.push({
        teacherType: '外教',
        teacherName: this.detailData.makeupForeignTeacherName || '-',
        regularMinutes: this.detailData.foreignTeacherMinutes || 0,
        oralMinutes: this.detailData.oralMinutes || 0
      })

      return teachers
    },
    // 课次数据（用于考勤抽屉）
    classData() {
      return {
        schedulingId: this.detailData.schedulingId,
        classDate: this.detailData.courseDate,
        classTime: this.detailData.startTime && this.detailData.endTime ? `${this.detailData.startTime}-${this.detailData.endTime}` : '',
        className: this.detailData.courseName,
        courseManagerName: this.detailData.courseMangerName,
        teacherName: this.detailData.teacherName,
        studentId: this.detailData.studentId,
        attendanceId: this.detailData.attendanceId
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.studentData.attendanceId) {
        this.loadAttendanceDetail()
      }
    },
    attendanceId(newVal) {
      if (newVal && this.visible) {
        this.loadAttendanceDetail()
      }
    }
  },
  methods: {
    getStatusType(status) {
      const statusMap = {
        28: 'warning', // 未考勤
        21: 'success', // 正常上课
        56: 'danger', // 置空
        25: 'info' // 请假
      }
      return statusMap[status] || ''
    },

    getStatusText(status) {
      const statusMap = {
        28: '未考勤',
        21: '正常上课',
        56: '置空',
        25: '请假'
      }
      return statusMap[status] || status
    },

    getMakeupStatusType(status) {
      const statusMap = {
        COMPLETED: 'success',
        BOOKED: 'primary',
        SCHEDULED: 'warning'
      }
      return statusMap[status] || ''
    },

    getMakeupStatusClass(status) {
      const statusMap = {
        // 补课状态：10-未约课, 20-已约课, 30-已补课
        30: 'status-completed', // 已补课 - 成功（绿）
        20: 'status-scheduled', // 已约课 - 主要（蓝）
        10: 'status-unscheduled', // 未约课 - 警告（黄）
        // 兼容旧映射
        COMPLETED: 'status-completed',
        BOOKED: 'status-scheduled',
        SCHEDULED: 'status-unscheduled'
      }
      return statusMap[status] || 'status-default'
    },

    // 立即考勤
    handleAttendance() {
      const classDate = new Date(this.detailData.courseDate)
      const today = new Date()

      if (classDate > today) {
        this.$message.warning('还未到上课日期，无法考勤哦~')
        return
      }

      this.showAttendanceDrawer = true
    },

    // 考勤成功回调
    handleAttendanceSuccess() {
      this.$emit('refresh')
      this.loadAttendanceDetail()
    },

    // 加载考勤详情
    async loadAttendanceDetail() {
      const attendanceId = this.attendanceId || this.studentData.attendanceId
      if (!attendanceId) {
        return
      }

      try {
        this.loading = true

        // 调用接口获取学员考勤详情
        const response = await One2ManyAttendanceApi.getStudentAttendanceDetail(attendanceId)

        if (response) {
          // 保存完整的详情数据
          this.detailData = response

          // 根据后端数据判断是否为佳音
          this.isJiayin = response.isJiayin || false

          // 处理考勤记录历史 - 根据实际后端字段
          this.attendanceRecords = (response.historyList || []).map(record => ({
            id: record.operationTime || record.operatorName || new Date().getTime(),
            operateTime: record.operationTime || '-',
            operatorName: record.operatorName || '-',
            attendanceStatusText: record.attendTypeDesc || '-',
            remark: record.remark || '-'
          }))
        }
      } catch (error) {
        this.$message.error(error.msg || '获取详情失败，请稍后重试')
        this.attendanceRecords = []
        this.detailData = {}
      } finally {
        this.loading = false
      }
    },

    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-drawer__header {
    padding: 16px;
    color: rgba(51, 51, 51, 1);
    font-size: 14px;
    font-family: PingFangSC-bold;
    background-color: rgba(241, 244, 247, 1);
    font-weight: 600;
    margin-bottom: 0px;
  }

  .el-drawer__body {
    padding: 0;
  }

  // 表格标题行背景色
  .table-header-cell {
    background-color: rgba(250, 250, 250, 1) !important;
  }
}

/* 确保课次考勤抽屉显示在详情抽屉之上 */
::v-deep .class-attendance-drawer {
  z-index: 2001 !important;
}

::v-deep .class-attendance-drawer .el-drawer {
  z-index: 2001 !important;
}

.student-attendance-detail-drawer {
  .drawer-content {
    padding: 20px;
  }

  .detail-section {
    margin-bottom: 24px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #303133;
      display: flex;
      align-items: center;

      &::before {
        content: '';
        width: 3px;
        height: 14px;
        background: #409eff;
        margin-right: 8px;
        border-radius: 2px;
      }
    }

    // 补课状态行样式
    .makeup-status-row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      // padding: 12px 16px;
      // background-color: #f8f9fa;
      // border-radius: 6px;

      .status-label {
        color: #666;
        font-size: 14px;
        margin-right: 16px;
        width: 85px;
        text-align: right;
        display: inline-block;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;

        &.status-completed {
          background-color: #67c23a;
        }

        &.status-scheduled {
          background-color: #409eff;
        }

        &.status-unscheduled {
          background-color: #e6a23c;
        }

        &.status-default {
          background-color: #909399;
        }
      }

      .status-text {
        color: #333;
        font-size: 14px;
        font-weight: 500;
      }
    }

    // 补课信息网格
    .makeup-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 16px;

        .label {
          color: #666;
          width: 85px;
          text-align: right;
          display: inline-block;
        }

        .value {
          color: #333;
          white-space: nowrap;
        }
      }

      // 约课备注单独样式处理
      .makeup-remark-item {
        .makeup-remark-value {
          color: #333;
          max-width: 200px; // 限制最大宽度
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          cursor: pointer; // 鼠标悬停时显示手型，提示可以查看完整内容
        }
      }
    }

    // 约课备注独占一行的样式
    .makeup-remark-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      margin-bottom: 16px;

      .label {
        color: #666;
        width: 85px;
        text-align: right;
        display: inline-block;
        flex-shrink: 0; // 防止标签被压缩
      }

      .makeup-remark-value {
        color: #333;
        max-width: 450px; // 独占一行时可以更宽
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
        cursor: pointer; // 鼠标悬停时显示手型，提示可以查看完整内容
      }
    }

    // 老师列表样式
    .teacher-list-section {
      .teacher-list-title {
        color: #666;
        font-size: 14px;
        margin-bottom: 8px;
      }

      .teacher-table {
        ::v-deep .el-table th {
          background-color: #f5f7fa;
          color: #606266;
          font-weight: 500;
        }

        ::v-deep .el-table td {
          padding: 8px 0;
        }

        ::v-deep .el-table--border {
          border: 1px solid #ebeef5;
        }

        ::v-deep .el-table--border th {
          border-right: 1px solid #ebeef5;
        }

        ::v-deep .el-table--border td {
          border-right: 1px solid #ebeef5;
        }

        .time-display-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          .time-value {
            color: #333;
            font-weight: 500;
          }

          .time-unit {
            color: #666;
            font-size: 12px;
          }
        }
      }
    }
  }

  .order-item {
    position: relative;
    transition: all 0.3s;
    border: 1px solid #ebeef5;
    border-radius: 7px;
    background: #fff;
    margin-bottom: 16px;

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      background-color: rgba(250, 250, 250, 1);
      color: rgba(16, 16, 16, 1);
      width: 100%;
      height: 40px;
      line-height: 20px;
      border-radius: 7px 7px 0px 0px;
      padding: 0px 16px;

      .order-no {
        color: rgba(102, 102, 102, 1);
        font-size: 13px;
      }

      .course-type {
        padding: 2px 8px;
        color: rgba(102, 102, 102, 1);
        border-radius: 2px;
        font-size: 13px;
      }
    }

    .order-content {
      .course-name {
        font-size: 14px;
        color: #303133;
        margin-bottom: 8px;
        font-weight: 600;
      }
      .order-detail {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .no-order {
    text-align: center;
    color: #909399;
    font-size: 14px;
    padding: 20px;
  }

  .attendance-records {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    overflow: hidden;

    .no-records {
      text-align: center;
      color: #909399;
      font-size: 14px;
      padding: 20px;
    }

    .record-header {
      display: grid;
      grid-template-columns: 150px 80px 120px 1fr;
      gap: 0;
      background-color: #f5f7fa;
      font-weight: 600;
      color: #606266;
      font-size: 13px;
      border-bottom: 1px solid #ebeef5;

      span {
        padding: 12px 10px;
        border-right: 1px solid #ebeef5;

        &:last-child {
          border-right: none;
        }
      }
    }

    .record-item {
      display: grid;
      grid-template-columns: 150px 80px 120px 1fr;
      gap: 0;
      border-bottom: 1px solid #ebeef5;
      font-size: 13px;
      color: #606266;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f5f7fa;
      }

      span {
        padding: 12px 10px;
        border-right: 1px solid #ebeef5;

        &:last-child {
          border-right: none;
        }
      }
    }

    .col-time {
      color: #303133;
    }

    .col-operator {
      color: #303133;
    }

    .col-status {
      color: #303133;
    }

    .col-remark {
      color: #303133;
      word-break: break-all;
    }
  }

  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 15px 20px;
    background: #fff;
    text-align: center;
  }
}
</style>
