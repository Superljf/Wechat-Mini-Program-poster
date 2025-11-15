<template>
  <el-dialog
    custom-class="cancel-schedule-dialog"
    :title="isBatch ? '批量取消' : '排课取消'"
    :visible.sync="visible"
    width="450px"
    @close="handleClose"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
  >
    <div class="cancel-schedule-dialog-content">
      <template v-if="isBatch">
        请确认是否取消选中的 <span class="count">{{ count }}</span> 节课？取消后无法恢复，请谨慎操作并选择真实取消排课原因。
      </template>
      <template v-else>
        请确认是否取消本次排课？取消后无法恢复，请谨慎操作并选择真实取消排课原因。
      </template>
    </div>
    <el-radio-group v-model="selectedReason" @change="handleReasonChange">
      <el-radio v-for="reason in reasons" :key="reason.value" :label="reason.value">
        {{ reason.label }}
      </el-radio>
    </el-radio-group>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" type="primary" :disabled="!selectedReason || loading" @click="handleConfirm" :loading="loading">确认取消排课</el-button>
      <el-button size="small" @click="handleClose" :disabled="loading">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'CancelSchedule',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isBatch: {
      type: Boolean,
      default: false
    },
    count: {
      type: Number,
      default: 1
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedReason: '',
      reasons: [
        { label: '教学事故', value: 'YDY_WGSK' },
        { label: '排课取消', value: 'YDY_QX' },
        { label: '学生请假', value: 'YDY_XSQJ' },
        { label: '教师请假', value: 'YDY_SG_LSWD' }
      ]
    }
  },
  watch: {
    //清空上次选择的值
    visible(newVal) {
      if (newVal) {
        // 弹窗打开时，重置选中的原因
        this.selectedReason = ''
      }
    }
  },
  methods: {
    handleReasonChange() {
      // Enable the confirm button when a reason is selected
    },
    handleConfirm() {
      if (!this.selectedReason) {
        this.$message.error('请选择取消原因')
        return
      }
      // Emit an event with the selected reason
      this.$emit('confirm-cancel', this.selectedReason)
      // 注意：不再在这里关闭弹窗，而是由父组件在请求成功后关闭
    },
    handleClose() {
      if (this.loading) return // 如果正在加载中，不允许关闭
      this.$emit('update:visible', false)
      this.selectedReason = ''
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.cancel-schedule-dialog-content {
  line-height: 21px;
  color: rgba(51, 51, 51, 1);
  font-size: 14px;
  text-align: left;
  font-family: PingFangSC-regular;
}

.count {
  color: #f56c6c;
  font-weight: bold;
}

.el-radio-group {
  margin-top: 16px;
  display: flex;
  gap: 24px;
  justify-content: flex-start;
  flex-wrap: wrap;
}

::v-deep .el-dialog.cancel-schedule-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.cancel-schedule-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 16px 20px;
}

::v-deep .el-dialog.cancel-schedule-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.cancel-schedule-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.cancel-schedule-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .el-radio {
  margin-right: 0;
}

::v-deep .el-radio .el-radio__input .el-radio__inner {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
}

::v-deep .el-radio .el-radio__input .el-radio__inner::after {
  width: 8px;
  height: 8px;
  background-color: #fff;
}

::v-deep .el-radio .el-radio__input.is-checked .el-radio__inner {
  border-color: #157cff;
  background: #157cff;
}

::v-deep .el-radio .el-radio__label {
  font-size: 14px;
  color: #606266;
  padding-left: 8px;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}

::v-deep .dialog-footer .el-button.el-button--primary {
  background-color: #157cff;
  border-color: #157cff;
}

::v-deep .dialog-footer .el-button.el-button--primary:disabled {
  background-color: #a0cfff;
  border-color: #a0cfff;
  color: #fff;
}
</style>
