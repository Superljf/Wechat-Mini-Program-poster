<template>
  <el-dialog
    title="修改约课时间"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
    custom-class="modify-reservation-dialog"
  >
    <div class="dialog-content">
      <!-- 课次信息 -->
      <div class="class-info">
        <div class="section-title">课次信息</div>
        <div class="info-item">
          <span class="label">班级名称</span>
          <span class="value">{{ studentData.className || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">上课时间</span>
          <span class="value"
            >{{ studentData.classDate || '-' }}{{ studentData.weekday ? `（${studentData.weekday}）` : '' }} {{ studentData.startTime || '-' }}-{{
              studentData.endTime || '-'
            }}</span
          >
        </div>
        <div class="info-item">
          <span class="label">老师</span>
          <span class="value">{{ studentData.teacherName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">班主任</span>
          <span class="value">{{ studentData.courseManagerName || '-' }}</span>
        </div>
      </div>

      <!-- 补课信息 -->
      <div class="makeup-info">
        <div class="section-title">补课信息</div>
        <el-form :model="form" ref="form" label-width="110px" class="dialog-form">
          <el-form-item label="预计补课日期" prop="makeupDate" :rules="[{ required: true, message: '请选择补课日期', trigger: 'change' }]">
            <el-date-picker
              size="small"
              v-model="form.makeupDate"
              type="date"
              placeholder="请选择补课日期"
              value-format="yyyy-MM-dd"
              format="yyyy-MM-dd"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="预计补课时间" prop="makeupStartTime" :rules="[{ required: true, message: '请选择开始时间', trigger: 'change' }]">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-time-picker
                size="small"
                v-model="form.makeupStartTime"
                placeholder="开始时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 120px"
              ></el-time-picker>
              <span style="color: #999;">-</span>
              <el-time-picker
                size="small"
                v-model="form.makeupEndTime"
                placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 120px"
                :disabled="true"
              ></el-time-picker>
            </div>
          </el-form-item>

          <el-form-item label="约课备注" prop="remark">
            <el-input size="small" v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" maxlength="300" show-word-limit></el-input>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" size="small">确定修改</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ModifyReservationDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        makeupDate: '',
        makeupStartTime: '',
        makeupEndTime: '',
        remark: ''
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    // 根据行数据计算课次时长（分钟）
    classDuration() {
      if (!this.studentData.startTime || !this.studentData.endTime) {
        return 120 // 默认120分钟
      }
      
      const [startHour, startMin] = this.studentData.startTime.split(':').map(Number)
      const [endHour, endMin] = this.studentData.endTime.split(':').map(Number)
      
      return endHour * 60 + endMin - (startHour * 60 + startMin)
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm()
      }
    },
    'form.makeupStartTime'(newVal) {
      if (newVal) {
        this.calculateEndTime()
      }
    }
  },
  methods: {
    resetForm() {
      // 根据行数据回显补课信息
      let makeupDate = ''
      let makeupStartTime = ''
      let makeupEndTime = ''

      // expectedDate: '2025-10-25'
      // expectedEndTime: '17:30'
      // expectedStartTime: '15:30'

      this.form = {
        makeupDate: this.studentData.expectedDate,
        makeupStartTime: this.studentData.expectedStartTime,
        makeupEndTime: this.studentData.expectedEndTime,
        remark: this.studentData.makeupRemark || this.studentData.remark || ''
      }
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },

    handleCancel() {
      this.dialogVisible = false
    },

    // 计算结束时间（根据课次时长）
    calculateEndTime() {
      if (!this.form.makeupStartTime) return

      const [hours, minutes] = this.form.makeupStartTime.split(':').map(Number)
      const startTime = new Date()
      startTime.setHours(hours, minutes, 0, 0)

      // 添加计算出的课次时长
      const endTime = new Date(startTime.getTime() + this.classDuration * 60 * 1000)

      // 检查是否跨天
      if (endTime.getDate() !== startTime.getDate()) {
        this.$message.warning('补课时间不能跨天，请重新选择')
        this.form.makeupEndTime = ''
        return
      }

      const endHours = String(endTime.getHours()).padStart(2, '0')
      const endMinutes = String(endTime.getMinutes()).padStart(2, '0')
      this.form.makeupEndTime = `${endHours}:${endMinutes}`
    },

    handleConfirm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          // 验证开始时间和结束时间
          if (!this.form.makeupStartTime) {
            this.$message.warning('请选择开始时间')
            return
          }
          if (!this.form.makeupEndTime) {
            this.$message.warning('请选择结束时间')
            return
          }

          const submitData = {
            makeupDate: this.form.makeupDate,
            makeupStartTime: this.form.makeupStartTime,
            makeupEndTime: this.form.makeupEndTime,
            remark: this.form.remark
          }

          // 传递回调函数给父组件，让父组件控制弹窗关闭
          const handleClose = success => {
            if (success) {
              this.dialogVisible = false
            }
            // 如果失败，不关闭弹窗
          }

          this.$emit('confirm', submitData, handleClose)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .class-info {
    margin-bottom: 20px;

    .info-item {
      display: flex;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #666;
        width: 60px;
        flex-shrink: 0;
        text-align: right;
      }

      .value {
        color: #333;
        margin-left: 16px;
      }
    }
  }
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
  .makeup-info {
    .dialog-form {
      .el-form-item {
        margin-bottom: 20px;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.modify-reservation-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.modify-reservation-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.modify-reservation-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.modify-reservation-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.modify-reservation-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
