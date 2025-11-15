<template>
  <el-dialog custom-class="add-student-dialog" title="添加学员" :visible.sync="dialogVisible" width="450px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" :rules="formRules" ref="form" label-width="110px" size="small">
      <el-form-item label="选择学员" prop="studentId">
        <AsyncRemoteInput
          clearable
          :inputValue="form.studentName"
          placeholder="学员姓名/编码/手机号"
          :inputKey="'studentName'"
          dict="student"
          ref="studentSearchField"
          @handleSelect="selectStudent"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="首课可排日期" prop="firstCanUseDate">
        <div style="display: flex; align-items: center">
          <el-date-picker v-model="form.firstCanUseDate" type="date" placeholder="请选择" value-format="yyyy-MM-dd" style="flex:1" />
          <div style="margin-left: 10px">
            之后可排首课
          </div>
        </div>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">确定添加</el-button>
    </div>
  </el-dialog>
</template>

<script>
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'AddStudentDialog',
  components: {
    AsyncRemoteInput
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classId: {
      type: [String, Number],
      default: ''
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
      return this.form.studentId && this.form.firstCanUseDate
    }
  },
  data() {
    return {
      loading: false,
      form: {
        courseId: '', // API字段：课程Id
        studentId: '', // API字段：学生ID
        studentName: '',
        firstCanUseDate: '' // API字段：首次课可排日期
      },
      formRules: {
        studentId: [{ required: true, message: '请选择学员', trigger: 'change' }],
        firstCanUseDate: [{ required: true, message: '请选择首课可排日期', trigger: 'change' }]
      }
    }
  },
  methods: {
    // 选择学员
    selectStudent(data) {
      this.form.studentId = data.id || ''
      this.form.studentName = data.studentName || ''
      this.$refs.form.validateField('studentId')
    },

    // 确认添加
    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        // 设置课程ID
        const params = {
          courseId: parseInt(this.classId),
          studentId: parseInt(this.form.studentId),
          firstCanUseDate: this.form.firstCanUseDate
        }

        // 调用真实API
        const res = await One2ManyApi.addScheduleStudent(params)

        this.$message.success('添加学员成功')
        this.$emit('confirm', params)
        this.handleClose()
      } catch (error) {
        this.$message.error(error || '添加学员失败，请稍后重试')
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
        courseId: '',
        studentId: '',
        studentName: '',
        firstCanUseDate: ''
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
      if (this.$refs.studentSearchField) {
        this.$refs.studentSearchField.clear()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// 弹窗样式
::v-deep .el-dialog.add-student-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.add-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.add-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.add-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.add-student-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

.dialog-footer {
  text-align: right;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
