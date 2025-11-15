<template>
  <el-dialog
    custom-class="batch-resume-student-dialog"
    title="批量复课"
    :visible.sync="dialogVisible"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-resume-content">
      <!-- 提示语 -->
      <div class="tip-text">
        请确认 <span class="highlight">{{ selectedStudents.length }}</span> 名学员是否复课？确认复课后，系统将自动调整班级学员状态为在读状态。
      </div>

      <el-form :model="form" :rules="formRules" ref="form" label-width="110px" size="small" class="batch-resume-form">
        <el-form-item prop="resumeDate">
          <template slot="label">
            <el-tooltip content="复课日期当天开始将正常排课哦～" placement="top">
              <i class="el-icon-info tip-icon" style="color: #c3c7cf"></i>
            </el-tooltip>
            复课日期
          </template>
          <el-date-picker v-model="form.recoverCourseDate" type="date" placeholder="请选择复课日期" value-format="yyyy-MM-dd" style="width: 60%" />
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">
        确定复课
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'BatchResumeStudentDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedStudents: {
      type: Array,
      default: () => []
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
      return this.form.recoverCourseDate
    }
  },
  data() {
    return {
      loading: false,
      form: {
        recoverCourseDate: '' // API字段：恢复课程日期
      },
      formRules: {
        recoverCourseDate: [{ required: true, message: '请选择复课日期', trigger: 'change' }]
      }
    }
  },
  methods: {
    // 确认操作
    async handleConfirm() {
      try {
        await this.$refs.form.validate()

        // 检查复课日期是否早于停课日期
        const invalidStudents = this.selectedStudents.filter(student => {
          const stopCourseDate = student.stopCourseDate
          if (stopCourseDate && this.form.recoverCourseDate) {
            return new Date(this.form.recoverCourseDate) < new Date(stopCourseDate)
          }
          return false
        })

        if (invalidStudents.length > 0) {
          this.$message.warning('部分学员复课日期早于停课日期，无法复课哦~')
          return
        }

        this.loading = true

        // 调用批量复课API
        const params = {
          idList: this.selectedStudents.map(s => s.id),
          recoverCourseDate: this.form.recoverCourseDate
        }

        await One2ManyApi.batchRecoverScheduleStudent(params)
        this.$message.success('批量复课成功')

        this.$emit('confirm', {
          recoverCourseDate: this.form.recoverCourseDate,
          selectedStudents: this.selectedStudents
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '批量复课操作失败，请稍后重试')
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
        recoverCourseDate: ''
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.batch-resume-content {
  .tip-text {
    margin-bottom: 20px;
    font-size: 14px;
    color: #333;
    line-height: 1.5;

    .highlight {
      color: #4f8bed;
      font-weight: 500;
    }
  }

  .batch-resume-form {
    .el-form-item {
      .tip-icon {
        color: #409eff;
        cursor: pointer;
        font-size: 16px;
        margin-right: 4px;

        &:hover {
          color: #66b1ff;
        }
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.batch-resume-student-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.batch-resume-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.batch-resume-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.batch-resume-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.batch-resume-student-dialog .el-dialog__footer {
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
