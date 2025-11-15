<template>
  <el-dialog
    title="取消约课"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
    custom-class="cancel-reservation-dialog"
  >
    <div class="dialog-content">
      <!-- 课次信息 -->
      <!-- <div class="class-info">
        <div class="section-title">课次信息</div>
        <div class="info-item">
          <span class="label">班级名称</span>
          <span class="value">{{ studentData.className || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">学员姓名</span>
          <span class="value">{{ studentData.studentName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">上课日期</span>
          <span class="value">{{ studentData.classDate || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">补课时间</span>
          <span class="value">{{ studentData.makeupTime || '-' }}</span>
        </div>
      </div> -->

      <div class="confirm-text">
        请确认是否取消学员
        <span class="highlight">{{ studentData.studentName }} {{ studentData.expectedDate || '-' }} {{ studentData.makeupTime || '-' }}</span> 的约课？
      </div>

      <el-form :model="form" ref="form" label-width="80px" class="dialog-form">
        <el-form-item label="约课备注" prop="remark" :rules="[{ required: true, message: '请输入备注信息', trigger: 'blur' }]">
          <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注信息" maxlength="300" show-word-limit></el-input>
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" size="small" :disabled="!form.remark.trim()">
        确定取消约课
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'CancelReservationDialog',
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
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  },
  methods: {
    resetForm() {
      this.form = {
        remark: ''
      }
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },

    handleCancel() {
      this.dialogVisible = false
    },

    handleConfirm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.$emit('confirm', this.form.remark)
          this.dialogVisible = false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .highlight {
    color: #4f8bed;
    font-weight: 500;
  }
  .class-info {
    margin-bottom: 20px;

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

  .confirm-text {
    font-size: 14px;
    color: #333;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .dialog-form {
    .el-form-item {
      margin-bottom: 0;
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

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.cancel-reservation-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.cancel-reservation-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.cancel-reservation-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.cancel-reservation-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.cancel-reservation-dialog .el-dialog__footer {
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
