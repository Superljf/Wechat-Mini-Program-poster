<template>
  <div>
    <el-drawer title="考勤详情" :before-close="handleClose" :visible.sync="visible" size="600" :destroy-on-close="true" class="attendance-detail-drawer">
      <div class="drawer-content" v-loading="loading">
        <!-- 考勤信息 -->
        <div class="detail-section">
          <div class="section-title">考勤信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">考勤单号</span>
              <span class="value">{{ localRowData.encoding }}</span>
            </div>
            <div key="localRowData.attendTypeName" class="info-item">
              <span class="label">考勤状态</span>
              <span class="value">{{ localRowData.attendTypeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">考勤类型</span>
              <span class="value">
                <span
                  >{{ localRowData.attendTypeTeacherName }}
                  <span v-if="!!localRowData.attendTypeTeacherName" class="cursor" style="color: #117ff6;" @click="openAttendTypeDialog">
                    <i style="font-size: 15px;" class="hifont hi-bianji cursor"></i> </span
                ></span>
              </span>
            </div>

            <div class="info-item" v-if="localRowData.attendancePic">
              <span class="label">考勤图片</span>
              <span class="value">
                <el-button type="text" size="small" @click="showImagePreview(localRowData.attendancePic)">查看</el-button>
              </span>
            </div>
            <div class="info-item">
              <span class="label">考勤人</span>
              <span class="value">{{ localRowData.attendEmployeeName || '--' }}</span>
            </div>
            <div class="info-item">
              <span class="label">考勤时间</span>
              <span class="value">{{ localRowData.attendTime }}</span>
            </div>
            <div class="info-item">
              <span class="label">排课人</span>
              <span class="value">{{ localRowData.createEmployeeName }}</span>
            </div>
            <div class="info-item">
              <span class="label">排课时间</span>
              <span class="value">{{ localRowData.createTime }}</span>
            </div>
          </div>
        </div>

        <!-- 排课信息 -->
        <div class="detail-section">
          <div class="section-title">排课信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">科目</span>
              <span class="value">{{ localRowData.subjectName }}</span>
            </div>
            <div class="info-item">
              <span class="label">课次时长</span>
              <span class="value">{{ courseDuration }} 分钟</span>
            </div>
            <div class="info-item">
              <span class="label">上课日期</span>
              <span class="value">{{ localRowData.courseDateStr }}</span>
            </div>
            <div class="info-item">
              <span class="label">上课时间</span>
              <span class="value">{{ localRowData.startTime }} - {{ localRowData.endTime }}</span>
            </div>

            <div class="info-item">
              <span class="label">教师</span>
              <span class="value">{{ localRowData.attTeacherName }}</span>
            </div>
            <div class="info-item">
              <span class="label">学管师</span>
              <span class="value">{{ localRowData.counselorName }}</span>
            </div>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="detail-section">
          <div class="section-title">订单信息</div>
          <div :class="['order-item']">
            <div class="order-header">
              <span class="order-no">报班单号: {{ localRowData.orderNo }}</span>
              <span class="course-type">{{ localRowData.courseKindName }}</span>
            </div>
            <div style="padding: 8px 16px;padding-bottom: 16px;">
              <div class="order-content">
                <div class="course-name">{{ localRowData.courseName }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 图片预览弹窗 -->
    <el-dialog title="考勤图片" :visible.sync="imageVisible" width="400px" center append-to-body custom-class="image-preview-dialog">
      <div class="image-container">
        <el-image :src="previewImageUrl" fit="contain" style="width: 100%; max-height: 500px;" />
      </div>
    </el-dialog>

    <!-- 考勤类型修改弹窗 -->
    <el-dialog title="修改考勤类型" :visible.sync="attendTypeDialogVisible" width="500px" append-to-body custom-class="attend-type-dialog">
      <div class="attend-type-container">
        <div class="attend-type-options">
          <div v-for="option in attendTypeOptions" :key="option.value" class="attend-type-option">
            <el-radio v-model="selectedAttendType" :label="option.value">{{ option.label }}</el-radio>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="confirmAttendTypeChange">确定修改</el-button>
        <el-button size="small" @click="attendTypeDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import studentManageService from '@/services/student-manage'

export default {
  name: 'AttendanceDetail',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    rowData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      imageVisible: false,
      previewImageUrl: '',
      attendTypeDialogVisible: false,
      selectedAttendType: '',
      // 内部可修改的数据副本
      localRowData: {},
      // 排课取消类型选项
      cancelAttendTypeOptions: [
        { label: '教学事故', value: 'YDY_WGSK' },
        { label: '排课取消', value: 'YDY_QX' },
        { label: '学生请假', value: 'YDY_XSQJ' },
        { label: '教师请假', value: 'YDY_SG_LSWD' }
      ],
      // 正常上课类型选项
      normalAttendTypeOptions: [
        { label: '正常上课', value: 'YDY_ZCSK' },
        { label: '学生旷课', value: 'YDY_XSKK' }
      ],
      allList: {
        排课取消: ['YDY_QX'],
        正常上课: ['YDY_ZCSK'],
        学生请假: ['YDY_XSQJ'],
        教师请假: ['YDY_SG_LSWD'],
        教学事故: ['YDY_WGSK'],
        学生旷课: ['YDY_XSKK']
      },
      allListReverse: {
        YDY_QX: '排课取消',
        YDY_ZCSK: '正常上课',
        YDY_XSQJ: '学生请假',
        YDY_SG_LSWD: '教师请假',
        YDY_WGSK: '教学事故',
        YDY_XSKK: '学生旷课'
      }
    }
  },
  watch: {
    // 监听rowData变化，更新本地数据
    rowData: {
      handler(newVal) {
        if (newVal) {
          this.localRowData = JSON.parse(JSON.stringify(newVal))
        }
      },
      immediate: true
    }
  },
  computed: {
    courseDuration() {
      if (!this.localRowData.startTime || !this.localRowData.endTime) {
        return 0
      }
      // 将时间字符串转换为分钟数
      const getMinutes = timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
      }

      const startMinutes = getMinutes(this.localRowData.startTime)
      const endMinutes = getMinutes(this.localRowData.endTime)

      return endMinutes - startMinutes
    },
    // 根据当前考勤状态返回对应的选项列表
    attendTypeOptions() {
      // 根据考勤状态返回相应的选项
      if (this.localRowData.attendType === 'YDY_ZCSK' || this.localRowData.attendType === 'YDY_XSKK') {
        return this.normalAttendTypeOptions
      } else {
        return this.cancelAttendTypeOptions
      }
    }
  },
  methods: {
    // 获取状态类型
    getStatusType(status) {
      const statusMap = {
        YDY_WKQ: 'warning', // 未考勤
        YDY_ZCSK: 'success', // 正常上课
        YDY_PKQX: 'info', // 排课取消
        YDY_KQZF: 'danger' // 考勤作废
      }
      return statusMap[status] || ''
    },
    handleClose() {
      this.$emit('update:visible', false)
    },
    showImagePreview(url) {
      this.previewImageUrl = url
      this.imageVisible = true
    },
    // 打开考勤类型修改弹窗
    openAttendTypeDialog() {
      // 设置当前选中的考勤类型
      this.selectedAttendType = this.allList[this.localRowData.attendTypeTeacherName]?.[0]

      this.attendTypeDialogVisible = true
    },
    // 确认修改考勤类型
    async confirmAttendTypeChange() {
      if (!this.selectedAttendType) {
        this.$message.warning('请选择考勤类型')
        return
      }

      // 如果选择的类型与当前类型相同，直接关闭弹窗
      if (this.selectedAttendType === this.allList[this.localRowData.attendTypeTeacherName]?.[0]) {
        this.attendTypeDialogVisible = false
        return
      }

      this.loading = true
      try {
        // 调用接口更新考勤类型
        const params = {
          attendId: this.localRowData.attendId,
          subAttendType: this.selectedAttendType
        }

        await studentManageService.updateAttend(params)

        // 更新本地数据的考勤类型名称（使用Vue的方式确保响应式更新）
        const newAttendTypeName = this.allListReverse[this.selectedAttendType]

        // 使用Vue.set确保响应式

        // 同时更新考勤类型显示值
        this.$set(this.localRowData, 'attendTypeTeacherName', newAttendTypeName)

        // 强制组件重新渲染
        this.$forceUpdate()

        this.$message.success('考勤类型修改成功')
        this.attendTypeDialogVisible = false

        // 通知父组件刷新数据
        this.$emit('refresh-data')
      } catch (error) {
        this.$message.error('修改考勤类型失败')
      } finally {
        this.loading = false
      }
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
}

.order-item {
  position: relative;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
  border-radius: 7px;
  background: #fff;
  margin-bottom: 16px;
  // padding: 12px 16px;

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

    .course-info {
      display: flex;
      align-items: center;
      gap: 16px;
      color: #606266;
      font-size: 13px;

      span {
        position: relative;

        &:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 12px;
          background: #dcdfe6;
        }
      }
    }
  }

  .course-subjects {
    color: #909399;
    font-size: 13px;
    line-height: 1.4;
    margin-top: 16px;
  }

  .disabled-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    .disabled-text {
      color: #909399;
      font-size: 13px;
      background: rgba(144, 147, 153, 0.1);
      padding: 4px 8px;
      border-radius: 2px;
    }
  }
}
.attendance-detail-drawer {
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

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 16px;
      .label {
        color: #666;
        width: 72px;
        text-align: right;
        display: inline-block;
      }

      .value {
        color: #333;
      }
    }

    .remark {
      color: #666;
      line-height: 1.5;
      padding: 12px;
      background-color: #f8f8f8;
      border-radius: 4px;
    }
  }
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

::v-deep .image-preview-dialog {
  .el-dialog__header {
    padding: 15px;
    border-bottom: 1px solid #eee;
    background-color: #f8f8f8;
  }

  .el-dialog__body {
    padding: 20px;
    text-align: center;
  }
}

.cursor {
  cursor: pointer;
  margin-left: 2px;
  &:hover {
    color: #117ff6;
    opacity: 0.9;
  }
}

.attend-type-container {
  padding: 10px 20px;

  .attend-type-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .attend-type-option {
    margin-right: 20px;
    margin-bottom: 15px;
  }
}
</style>
