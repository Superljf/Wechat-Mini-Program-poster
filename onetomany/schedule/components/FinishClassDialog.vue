<template>
  <el-dialog custom-class="finish-class-dialog" title="结课" :visible.sync="dialogVisible" width="400px" :close-on-click-modal="false" @close="handleClose">
    <div class="finish-content">
      <div class="finish-text">
        <p>
          请确认是否将
          <span class="class-name">{{ className }}</span>
          结课？结课后将无法操作班级信息哦~
        </p>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">
        确定结课
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'
import { mapState } from 'vuex'

export default {
  name: 'FinishClassDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    },
    classId: {
      type: [String, Number],
      default: ''
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),
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
        // 调用结课API
        const params = {
          courseId: parseInt(this.classId),
          courseStatus: 2, // 已结课状态
          updateTime: new Date().toISOString(),
          userId: this.userInfo?.userId || 0
        }

        const res = await One2ManyApi.changeScheduleCourseStatus(params)

        this.$message.success('结课成功')
        this.$emit('confirm')
        this.handleCancel()
      } catch (error) {
        this.$message.error(error || '结课失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleCancel() {
      this.$emit('update:visible', false)
    },

    handleClose() {
      this.handleCancel()
    }
  }
}
</script>

<style lang="scss" scoped>
.finish-content {
  padding: 20px 0;

  .finish-text {
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    .class-name {
      color: #4f8bed;
      font-weight: 500;
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style>
