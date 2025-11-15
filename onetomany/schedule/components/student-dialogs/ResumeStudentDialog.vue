<template>
  <el-dialog custom-class="resume-student-dialog" title="复课" :visible.sync="dialogVisible" width="550px" :close-on-click-modal="false" @close="handleClose">
    <div class="resume-content">
      <!-- 提示语 -->
      <div class="tip-text">
        请确认 <span class="highlight">{{ (studentData && studentData.studentName) || '' }}</span> 是否复课？确认复课后，系统将自动调整班级学员状态为在读状态。
      </div>

      <el-form :model="form" :rules="formRules" ref="form" label-width="110px" size="small" class="resume-form">
        <el-form-item label="停课日期">
          <el-input :value="(studentData && studentData.stopCourseDate) || ''" disabled />
        </el-form-item>
        <el-form-item prop="recoverCourseDate">
          <template slot="label">
            <el-tooltip content="复课日期当天开始将正常排课哦～" placement="top">
              <i class="el-icon-info tip-icon" style="color: #c3c7cf"></i>
            </el-tooltip>
            复课日期
          </template>
          <el-date-picker
            v-model="form.recoverCourseDate"
            type="date"
            placeholder="请选择复课日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            :picker-options="resumeDateOptions"
          />
        </el-form-item>
        <el-form-item label="停课原因">
          <el-input :value="(studentData && studentData.stopCourseRemark) || ''" disabled type="textarea" :rows="2" />
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
  name: 'ResumeStudentDialog',
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
      return this.form.recoverCourseDate
    },
    resumeDateOptions() {
      return {
        disabledDate: time => {
          if (!this.studentData.stopCourseDate) return false
          return time.getTime() < new Date(this.studentData.stopCourseDate).getTime()
        }
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initFormData()
      }
    },
    studentData: {
      handler() {
        if (this.visible) {
          this.initFormData()
        }
      },
      deep: true
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
    // 初始化表单数据
    initFormData() {
      if (this.studentData && this.studentData.recoverCourseDate) {
        // 如果停课时已设置复课日期，则自动回填
        this.form.recoverCourseDate = this.studentData.recoverCourseDate
      } else {
        // 如果没有预设复课日期，则清空
        this.form.recoverCourseDate = ''
      }
    },

    // 确认操作
    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        // 调用复课API
        const params = {
          recoverCourseDate: this.form.recoverCourseDate
        }

        await One2ManyApi.recoverScheduleStudent(this.studentData.id, params)
        this.$message.success('复课成功')

        this.$emit('confirm', {
          recoverCourseDate: this.form.recoverCourseDate,
          studentData: this.studentData
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '复课操作失败，请稍后重试')
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
.resume-content {
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

  .resume-form {
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
::v-deep .el-dialog.resume-student-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.resume-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.resume-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.resume-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.resume-student-dialog .el-dialog__footer {
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
