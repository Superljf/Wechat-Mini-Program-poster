<template>
  <el-dialog
    custom-class="suspend-student-dialog"
    :title="isModify ? '修改停课信息' : '停课'"
    :visible.sync="dialogVisible"
    width="550px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="suspend-content">
      <!-- 提示语 -->
      <div v-if="!isModify">
        <div class="tip-text" v-if="!isBatch">
          请确认是否将 <span class="highlight">{{ (studentData && studentData.studentName) || '' }}</span> {{ isModify ? '修改停课信息' : '调整为停课状态' }}？
        </div>
        <div class="tip-text" v-else>
          请确认是否将 <span class="highlight">{{ selectedStudents.length }}</span> 名学员调整为停课状态？
        </div>
      </div>

      <el-form :model="form" :rules="formRules" ref="form" label-width="100px" size="small" class="suspend-form">
        <el-form-item label="停课日期" prop="stopCourseDate">
          <el-date-picker
            v-model="form.stopCourseDate"
            type="date"
            placeholder="请选择停课日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
            @change="handleSuspendDateChange"
          />
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
        <el-form-item label="停课原因" prop="stopReason">
          <el-input v-model="form.stopReason" type="textarea" placeholder="请输入停课原因" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">
        {{ isModify ? '确定修改' : '确定停课' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'SuspendStudentDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    },
    selectedStudents: {
      type: Array,
      default: () => []
    },
    isBatch: {
      type: Boolean,
      default: false
    },
    isModify: {
      type: Boolean,
      default: false
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
      return this.form.stopCourseDate && this.form.stopReason
    },
    resumeDateOptions() {
      return {
        disabledDate: time => {
          if (!this.form.stopCourseDate) return false
          return time.getTime() < new Date(this.form.stopCourseDate).getTime()
        }
      }
    }
  },
  data() {
    return {
      loading: false,
      form: {
        stopCourseDate: '', // API字段：停课日期
        recoverCourseDate: '', // API字段：恢复课程日期
        stopReason: '' // API字段：停课原因
      },
      formRules: {
        stopCourseDate: [{ required: true, message: '请选择停课日期', trigger: 'change' }],
        stopReason: [{ required: true, message: '请输入停课原因', trigger: 'blur' }]
      }
    }
  },
  watch: {
    visible(val) {
      if (val && this.isModify && this.studentData) {
        // 修改模式下回显数据
        this.form = {
          stopCourseDate: this.studentData.stopCourseDate || '',
          recoverCourseDate: this.studentData.recoverCourseDate || '',
          stopReason: this.studentData.stopCourseRemark || ''
        }
      }
    }
  },
  methods: {
    // 停课日期变化
    handleSuspendDateChange() {
      // 如果复课日期早于停课日期，清空复课日期
      if (this.form.recoverCourseDate && this.form.stopCourseDate) {
        const suspendTime = new Date(this.form.stopCourseDate).getTime()
        const resumeTime = new Date(this.form.recoverCourseDate).getTime()
        if (resumeTime < suspendTime) {
          this.form.recoverCourseDate = ''
        }
      }
    },

    // 确认操作
    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        if (this.isBatch) {
          // 批量停课
          const params = {
            idList: this.selectedStudents.map(s => s.id),
            stopCourseDate: this.form.stopCourseDate,
            recoverCourseDate: this.form.recoverCourseDate,
            stopReason: this.form.stopReason
          }
          await One2ManyApi.batchStopScheduleStudent(params)
          this.$message.success('批量停课成功')
        } else if (this.isModify) {
          // 修改停课信息
          const params = {
            stopCourseDate: this.form.stopCourseDate,
            recoverCourseDate: this.form.recoverCourseDate,
            stopReason: this.form.stopReason
          }
          await One2ManyApi.editStopScheduleStudent(this.studentData.id, params)
          this.$message.success('修改停课信息成功')
        } else {
          // 单个停课
          const params = {
            stopCourseDate: this.form.stopCourseDate,
            recoverCourseDate: this.form.recoverCourseDate,
            stopReason: this.form.stopReason
          }
          await One2ManyApi.stopScheduleStudent(this.studentData.id, params)
          this.$message.success('停课成功')
        }

        this.$emit('confirm', {
          stopCourseDate: this.form.stopCourseDate,
          recoverCourseDate: this.form.recoverCourseDate,
          stopReason: this.form.stopReason,
          isBatch: this.isBatch,
          isModify: this.isModify,
          studentData: this.studentData,
          selectedStudents: this.selectedStudents
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '操作失败，请稍后重试')
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
        stopCourseDate: '',
        recoverCourseDate: '',
        stopReason: ''
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.suspend-content {
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

  .suspend-form {
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
::v-deep .el-dialog.suspend-student-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.suspend-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.suspend-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.suspend-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.suspend-student-dialog .el-dialog__footer {
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
