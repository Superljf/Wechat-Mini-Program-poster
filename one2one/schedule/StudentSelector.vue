<template>
  <el-dialog
    title="选择学员"
    :visible.sync="dialogVisible"
    width="320px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    custom-class="student-selector-dialog"
    @close="handleClose"
  >
    <div class="selector-content">
      <AsyncRemoteInput
        v-model="searchQuery"
        placeholder="请输入学员姓名搜索"
        dict="student"
        inputKey="studentName"
        @handleSelect="handleStudentSelect"
        class="student-input"
        :outParams="params"
      />

      <el-button type="primary" :disabled="!selectedStudent" @click="handleConfirm" class="confirm-btn">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import AsyncRemoteInput from '@/components/asyncRemoteInput'

export default {
  components: {
    AsyncRemoteInput
  },
  name: 'StudentSelector',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    studentId: {
      type: [String, Number],
      default: null
    }
  },

  data() {
    return {
      searchQuery: '',
      selectedStudent: null, // 添加选中学员的状态
      params: {
        studentStatus: 1,
        dataRange: 2
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

  methods: {
    // 选择学员时只保存数据,不直接关闭
    handleStudentSelect(student) {
      // 当清除选项时,student 为 null 或 undefined
      if (!student.studentId && !student.id) {
        this.selectedStudent = null
        return
      }

      this.selectedStudent = {
        id: student.id || student.studentId,
        name: student.name || student.studentName,
        gender: student.gender,
        grade: student.grade,
        school: student.school,
        avatar: student.avatar
      }
    },

    // 点击确定按钮时才触发切换并关闭
    handleConfirm() {
      if (!this.selectedStudent) return
      this.$emit('student-selected', this.selectedStudent)
      this.dialogVisible = false
      // 重置状态
      this.selectedStudent = null
      this.searchQuery = ''
    },

    handleClose() {
      this.dialogVisible = false
      // 重置状态

      if (!this.studentId) {
        this.selectedStudent = null
        this.searchQuery = ''
        //返回上一个路径
        this.$router.back()
      }
    }
  },

  // 监听弹窗关闭,重置状态
  watch: {
    visible(val) {
      if (!val) {
        this.selectedStudent = null
        this.searchQuery = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog.student-selector-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.student-selector-dialog .el-dialog__header {
  border: none !important;
}

::v-deep .el-dialog.student-selector-dialog .el-dialog__body {
  padding: 20px;
}

.selector-content {
  .student-input {
    margin-bottom: 24px;
    width: 100%;

    ::v-deep .el-input__inner {
      height: 34px;
      border-radius: 4px;
      font-size: 14px;

      &::placeholder {
        color: #999;
      }
    }
  }

  .confirm-btn {
    width: 100%;
    height: 34px;
    border-radius: 22px;
    font-size: 16px;
    font-weight: 500;
    border: none;
    background: #1890ff;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background: #40a9ff;
    }

    &:disabled {
      background: #d9d9d9;
      color: #fff;
      cursor: not-allowed;
    }
  }
}
</style>
