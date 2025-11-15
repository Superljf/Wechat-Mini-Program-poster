<template>
  <el-dialog
    custom-class="remark-dialog"
    title="修改班级学员备注"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-content">
      <el-form :model="form" ref="form" label-width="60px" size="small">
        <el-form-item label="备注">
          <el-input
            type="textarea"
            :rows="3"
            v-model="form.remark"
            placeholder="请输入备注信息，例如学员可接受调整上课时间、上课老师等…"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">修改备注</el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'RemarkDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    student: {
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
      loading: false,
      form: {
        remark: ''
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.form.remark = this.student.remark || ''
      }
    }
  },
  methods: {
    async handleConfirm() {
      this.loading = true
      try {
        const params = {
          remark: this.form.remark
        }

        const res = await One2ManyApi.updateOpenCourseStudentRemark(this.student.id, params)
        this.$message.success('修改备注成功')
        this.$emit('confirm', {
          studentId: this.student.studentId,
          remark: this.form.remark
        })
        this.handleClose()
      } catch (error) {
        this.$message.error('保存备注失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.form.remark = ''
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .student-info {
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 20px;

    .label {
      color: #999;
      font-size: 14px;
    }

    .student-name {
      color: #333;
      font-size: 14px;
      font-weight: bold;
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.remark-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.remark-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.remark-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.remark-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.remark-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 12px 20px;
  gap: 12px;
}
</style>
