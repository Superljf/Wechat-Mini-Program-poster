<template>
  <el-dialog
    custom-class="modify-first-class-date-dialog"
    title="修改首课可排日期"
    :visible.sync="dialogVisible"
    width="400px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="formRules" ref="form" label-width="80px" size="small">
      <el-form-item label="选择日期" prop="firstCanUseDate">
        <div style="display: flex; align-items: center;gap:10px">
          <el-date-picker v-model="form.firstCanUseDate" type="date" placeholder="请选择日期" value-format="yyyy-MM-dd" style="flex: 1;" />
          <div class="tip-text">之后可排首课</div>
        </div>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">确定修改</el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'ModifyFirstClassDateDialog',
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
    },
    isFormValid() {
      return this.form.firstCanUseDate
    }
  },
  data() {
    return {
      loading: false,
      form: {
        firstCanUseDate: '' // API字段：首次课可排日期
      },
      formRules: {
        firstCanUseDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.studentData) {
        this.form.firstCanUseDate = this.studentData.firstCanUseDate || ''
      }
    }
  },
  methods: {
    // 确认修改
    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        // 调用修改首课日期API
        const params = {
          firstScheduleDate: this.form.firstCanUseDate
        }

        await One2ManyApi.updateFirstScheduleDate(this.studentData.id, params)
        this.$message.success('修改首课可排日期成功')

        this.$emit('confirm', {
          studentData: this.studentData,
          firstCanUseDate: this.form.firstCanUseDate
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '修改失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },

    // 重置表单
    resetForm() {
      this.form = {
        firstCanUseDate: ''
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.modify-first-class-date-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.modify-first-class-date-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.modify-first-class-date-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.modify-first-class-date-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.modify-first-class-date-dialog .el-dialog__footer {
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
