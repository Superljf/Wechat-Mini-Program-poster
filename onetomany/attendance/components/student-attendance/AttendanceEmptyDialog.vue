<template>
  <el-dialog
    custom-class="attendance-empty-dialog"
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="attendance-empty-content">
      <div class="confirm-text" v-html="confirmText"></div>

      <el-form :model="form" :rules="rules" ref="form" label-width="80px" class="form-content" size="small">
        <el-form-item label="考勤备注" prop="remark" class="required">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="300" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" size="small" :disabled="!form.remark.trim()">
        确定置空考勤
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'AttendanceEmptyDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    },
    selectedCount: {
      type: Number,
      default: 0
    },
    isBatch: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        remark: ''
      },
      rules: {
        remark: [
          { required: true, message: '请输入备注信息', trigger: 'blur' },
          { max: 300, message: '备注信息不能超过300个字符', trigger: 'blur' }
        ]
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
    dialogTitle() {
      return this.isBatch ? '批量考勤置空' : '考勤置空'
    },
    confirmText() {
      if (this.isBatch) {
        return `请确认是否将选中 <span class="highlight">${this.selectedCount}</span> 条考勤置空？`
      } else {
        return '请确认是否考勤置空？'
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // 弹窗打开时，如果是单独操作且有预设备注，可以在这里设置
        // 批量操作时不回填备注，保持空白
        if (!this.isBatch && this.studentData.attendanceRemark) {
          this.form.remark = this.studentData.attendanceRemark
        } else {
          // 批量操作或无预设备注时，清空备注
          this.form.remark = ''
        }
      }
    }
  },
  methods: {
    handleConfirm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.$emit('confirm', this.form.remark, success => {
            // 只有当父组件通过回调表示成功时，才关闭弹窗
            if (success !== false) {
              this.handleClose()
            }
          })
        }
      })
    },

    handleCancel() {
      this.handleClose()
    },

    handleClose() {
      this.form.remark = ''
      this.$refs.form && this.$refs.form.resetFields()
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
.attendance-empty-content {
  .confirm-text {
    font-size: 14px;
    color: #333;
    margin-bottom: 20px;
    line-height: 1.5;

    ::v-deep .highlight {
      color: #4f8bed;
      font-weight: 500;
    }
  }

  .form-content {
    .required {
      ::v-deep .el-form-item__label::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.attendance-empty-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.attendance-empty-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.attendance-empty-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.attendance-empty-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.attendance-empty-dialog .el-dialog__footer {
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
