<template>
  <el-dialog custom-class="loss-student-dialog" title="流失" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false" @close="handleClose">
    <div class="loss-content">
      <!-- 提示语 -->
      <div class="tip-text">
        请确认 <span class="highlight">{{ (studentData && studentData.studentName) || '' }}</span> 是否流失？流失后学员所有未考勤课次将自动取消。
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">
        确定流失
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'LossStudentDialog',
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
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    // 确认操作
    async handleConfirm() {
      try {
        this.loading = true

        await One2ManyApi.leaveScheduleStudent(this.studentData.id)
        this.$message.success('学员流失确认成功')

        this.$emit('confirm', {
          studentData: this.studentData
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '流失操作失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.loss-content {
  .tip-text {
    font-size: 14px;
    color: #333;
    line-height: 1.5;

    .highlight {
      color: #4f8bed;
      font-weight: 500;
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.loss-student-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.loss-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.loss-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.loss-student-dialog .el-dialog__body {
  padding: 30px 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.loss-student-dialog .el-dialog__footer {
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
