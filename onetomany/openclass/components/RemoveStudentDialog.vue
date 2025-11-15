<template>
  <el-dialog
    custom-class="remove-student-dialog"
    :title="isBatch ? '批量移除' : '移除'"
    :visible.sync="dialogVisible"
    width="400px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-content">
      <p v-if="isBatch">
        请确认是否将 <span class="count-number">{{ students.length }}</span> 名学员从 <span class="class-name">{{ className }}</span> 里移除？
      </p>
      <p v-else>
        请确认是否将 <span class="student-name">{{ students[0]?.studentName }}</span> 从 <span class="class-name">{{ className }}</span> 里移除？
      </p>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">确定移除</el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'RemoveStudentDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    students: {
      type: Array,
      default: () => []
    },
    className: {
      type: String,
      default: ''
    },
    isBatch: {
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
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    async handleConfirm() {
      this.loading = true
      try {
        if (this.isBatch) {
          // 批量移除
          const ids = this.students.map(student => student.id)
          const res = await One2ManyApi.batchRemoveOpenCourseStudent(ids)
          this.$message.success('批量移除成功')
          this.$emit('confirm', { students: this.students })
          this.handleClose()
        } else {
          // 单个移除
          const studentId = this.students[0]?.id
          if (studentId) {
            const res = await One2ManyApi.removeOpenCourseStudent(studentId)
            this.$message.success('移除成功')
            this.$emit('confirm', { students: this.students })
            this.handleClose()
          }
        }
      } catch (error) {
        this.$message.error('移除失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  padding: 10px 0;

  p {
    margin: 0;
    line-height: 1.5;
    color: #333;
  }

  .count-number {
    color: #4f8bed;
  }

  .student-name {
    color: #4f8bed;
  }

  .class-name {
    color: #4f8bed;
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.remove-student-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.remove-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.remove-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.remove-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.remove-student-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 12px 20px;
  gap: 12px;
}
</style>
