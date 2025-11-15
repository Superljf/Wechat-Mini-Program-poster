<template>
  <el-dialog custom-class="add-student-dialog" title="添加学员" :visible.sync="dialogVisible" width="500px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="form" label-width="60px" size="small">
      <el-form-item label="学员" prop="studentId">
        <AsyncRemoteInput
          clearable
          :inputValue="form.studentName"
          placeholder="请输入学员姓名/编码/手机号搜索"
          :inputKey="'studentName'"
          dict="student"
          ref="studentField"
          @handleSelect="selectStudent"
          class="input-common-width"
          style="width: 100%"
        />
      </el-form-item>

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
      return this.form.studentId
    }
  },
  data() {
    return {
      loading: false,
      form: {
        courseId: '', // API文档字段
        studentId: '',
        studentName: '',
        remark: ''
      },
      rules: {
        studentId: [{ required: true, message: '请选择学员', trigger: 'change' }]
      }
    }
  },
  methods: {
    selectStudent(data) {
      this.form.studentId = data.id || ''
      this.form.studentName = data.studentName || ''
    },

    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        const params = {
          courseId: typeof this.classId === 'number' ? this.classId : parseInt(this.classId),
          studentId: this.form.studentId,
          remark: this.form.remark
        }

        const res = await One2ManyApi.addOpenCourseStudent(params)
        this.$message.success('添加学员成功')
        this.$emit('confirm', this.form)
        this.handleClose()
      } catch (error) {
        this.$message.error(error || '添加学员失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.$refs.form.resetFields()
      this.form = {
        courseId: '',
        studentId: '',
        studentName: '',
        remark: ''
      }
      this.$refs.studentField.clear()
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

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
  padding: 12px 20px;
  gap: 12px;
}
</style>
