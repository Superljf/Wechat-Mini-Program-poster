<template>
  <el-dialog custom-class="confirm-dialog" :title="title" :visible.sync="dialogVisible" width="400px" :close-on-click-modal="false" @close="handleClose">
    <div class="confirm-content">
      <div class="confirm-message" v-html="message"></div>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">{{ confirmText }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '确认'
    },
    message: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    data: {
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
      loading: false
    }
  },
  methods: {
    // 确认操作
    async handleConfirm() {
      this.loading = true
      try {
        // Mock操作
        await new Promise(resolve => setTimeout(resolve, 1000))

        this.$emit('confirm', this.data)
        this.handleClose()
      } catch (error) {
        console.error('操作失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.confirm-content {
  .confirm-message {
    padding: 20px 0;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.confirm-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.confirm-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.confirm-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.confirm-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.confirm-dialog .el-dialog__footer {
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
