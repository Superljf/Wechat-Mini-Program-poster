<template>
  <el-dialog title="排课确认" :visible.sync="visible" width="700px" :before-close="handleClose" custom-class="schedule-confirm-dialog">
    <div class="schedule-confirm">
      <!-- 本次排课部分 -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">本次排课</div>
          <div class="header-right">
            <div class="schedule-stats">
              <span class="success-count">预计成功：{{ successCount }}次</span>
              <span v-if="hasConflict" class="conflict-count">冲突：{{ conflictCount }}次</span>
            </div>
            <div v-if="hasConflict" class="conflict-filter">
              <el-checkbox v-model="onlyShowConflict">仅看冲突</el-checkbox>
            </div>
          </div>
        </div>

        <!-- 本次排课列表 -->
        <el-table :data="filteredScheduleList" style="width: 100%;" border>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="classDate" label="上课日期" min-width="120" align="center" />
          <el-table-column prop="classTime" label="上课时间" min-width="140" align="center" />
          <el-table-column prop="material" label="上课教材" min-width="100" align="center" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template slot-scope="scope">
              <span :class="['status', { conflict: scope.row.status === '冲突' }]">
                {{ scope.row.status }}
              </span>
            </template>
          </el-table-column>
          <!-- <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <span 
                class="remove-schedule" 
                style="font-size: 13px; color: #4f8bed; cursor: pointer;" 
                @click="removeSchedule(scope.$index)"
              >
                移除
              </span>
            </template>
          </el-table-column> -->
        </el-table>
      </div>

      <!-- 冲突列表部分 -->
      <div v-if="hasConflict" class="section conflict-section">
        <div class="section-header">
          <div class="section-title">冲突列表</div>
        </div>
        <el-table :data="conflictList" style="width: 100%" border>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="classDate" label="上课日期" min-width="120" align="center" />
          <el-table-column prop="classTime" label="上课时间" min-width="140" align="center" />
          <el-table-column prop="material" label="上课教材" min-width="100" align="center" />
        </el-table>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <template v-if="hasConflict">
        <el-button type="primary" @click="handleDeleteConflictAndSchedule" :loading="isSubmitting" :disabled="isSubmitDisabled">
          删除冲突课次并排课
        </el-button>
      </template>
      <template v-else>
        <el-button type="primary" @click="handleConfirmSchedule" :loading="isSubmitting" :disabled="isSubmitDisabled">
          确定
        </el-button>
      </template>
      <el-button @click="handleClose">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'ScheduleConfirmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scheduleData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      onlyShowConflict: false,
      conflictList: [], // 冲突列表数据
      currentScheduleList: [], // 当前排课列表数据
      isSubmitting: false // 提交中状态
    }
  },
  computed: {
    // 是否存在冲突
    hasConflict() {
      return this.conflictList.length > 0
    },

    // 成功课次数
    successCount() {
      return this.currentScheduleList.filter(item => item.status === '可排').length
    },

    // 冲突课次数
    conflictCount() {
      return this.currentScheduleList.filter(item => item.status === '冲突').length
    },

    // 根据筛选条件过滤后的排课列表
    filteredScheduleList() {
      if (this.onlyShowConflict) {
        return this.currentScheduleList.filter(item => item.status === '冲突')
      }
      return this.currentScheduleList
    },

    // 判断是否应该禁用提交按钮
    isSubmitDisabled() {
      if (this.currentScheduleList.length === 0) {
        return true
      }
      if (this.hasConflict) {
        return this.currentScheduleList.filter(item => item.status === '可排').length === 0
      }
      return false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.scheduleData) {
        this.initData()
      }
    },
    scheduleData: {
      handler(newVal) {
        if (this.visible && newVal) {
          this.initData()
        }
      },
      deep: true
    }
  },
  methods: {
    // 初始化数据
    async initData() {
      try {
        // 直接使用接口返回的 currentScheduleList 和 conflictList
        this.initScheduleListFromAPI()
      } catch (error) {
        this.$message.error('初始化排课数据失败')
      }
    },

    // 直接使用接口返回的数据初始化
    initScheduleListFromAPI() {
      // 直接使用接口返回的 currentScheduleList
      const currentList = this.scheduleData.checkResult.currentScheduleList || []
      this.currentScheduleList = currentList.map((item, index) => ({
        id: `schedule_${index}`,
        classDate: item.courseDateStr || item.courseDate,
        classTime: `${item.startTime}-${item.endTime}`,
        material: item.textbookName || '',
        status: item.conflict === 1 ? '冲突' : '可排',
        originalData: item // 保存原始数据用于后续处理
      }))

      // 直接使用接口返回的 conflictList
      const conflictData = this.scheduleData.checkResult.conflictList || []
      this.conflictList = conflictData.map((item, index) => ({
        id: `conflict_${index}`,
        classDate: item.courseDateStr || item.courseDate,
        classTime: `${item.startTime}-${item.endTime}`,
        material: item.textbookName || '',
        originalData: item
      }))
    },

    // 删除冲突课次并排课
    async handleDeleteConflictAndSchedule() {
      if (this.isSubmitting) return

      this.isSubmitting = true
      try {
        const validScheduleList = this.currentScheduleList.filter(item => item.status === '可排')

        if (validScheduleList.length === 0) {
          this.$message.warning('没有可排课的课次')
          return
        }

        // 构建最终的排课数据，只包含非冲突的课次
        const validScheduleItems = this.currentScheduleList.filter(item => item.status === '可排').map(item => item.originalData)

        const finalScheduleData = {
          courseId: this.scheduleData.courseId,
          textbooks: this.scheduleData.textbooks,
          yddAddSchedulingListBoList: validScheduleItems,
          // 添加周期排课参数
          startDate: this.scheduleData.startDate,
          coursePeriodDtoList: this.scheduleData.coursePeriodDtoList || []
        }

        // 调用排课API
        await One2ManyApi.addScheduleCourse(finalScheduleData)

        this.$message.success(`本次已成功排课 ${validScheduleList.length} 节！`)
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        this.$message.error(error || '排课失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    },

    // 确认排课（无冲突时）
    async handleConfirmSchedule() {
      if (this.isSubmitting) return

      this.isSubmitting = true
      try {
        if (this.currentScheduleList.length === 0) {
          this.$message.warning('没有可排课的课次')
          return
        }

        // 直接使用传入的完整排课数据
        const finalScheduleData = {
          courseId: this.scheduleData.courseId,
          textbooks: this.scheduleData.textbooks,
          yddAddSchedulingListBoList: this.scheduleData.yddAddSchedulingListBoList,
          // 添加周期排课参数
          startDate: this.scheduleData.startDate,
          coursePeriodDtoList: this.scheduleData.coursePeriodDtoList || []
        }

        // 调用排课API
        await One2ManyApi.addScheduleCourse(finalScheduleData)

        this.$message.success(`本次已成功排课 ${this.currentScheduleList.length} 节！`)
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        this.$message.error(error || '排课失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    },

    // 移除课次
    removeSchedule(index) {
      this.currentScheduleList.splice(index, 1)
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      this.onlyShowConflict = false
      this.currentScheduleList = []
      this.conflictList = []
      this.isSubmitting = false
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog.schedule-confirm-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;

  .el-dialog__header {
    border: none !important;
    border-radius: 8px 8px 0px 0px;
    background-color: rgba(241, 244, 247, 1);
    display: flex;
    align-items: center;
    padding: 16px 20px;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }

  .el-dialog__body {
    padding: 20px !important;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    max-height: 50vh;
    overflow-y: auto;
  }
}

::v-deep .el-dialog.schedule-confirm-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
  padding-bottom: 30px;
}

.schedule-confirm-dialog {
  .schedule-confirm {
    .section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          display: flex;
          align-items: center;

          &::before {
            content: '';
            width: 3px;
            height: 14px;
            background: #409eff;
            margin-right: 8px;
            border-radius: 2px;
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 24px;

          .schedule-stats {
            font-size: 13px;

            .success-count {
              color: #67c23a;
              margin-right: 16px;
            }

            .conflict-count {
              color: #f56c6c;
            }
          }

          .conflict-filter {
            .el-checkbox {
              font-size: 13px;
            }
          }
        }
      }

      &.conflict-section {
        margin-top: 32px;
      }
    }
  }

  .status {
    &.conflict {
      color: #f56c6c;
    }
  }

  .dialog-footer {
    text-align: center;

    .el-button {
      padding: 9px 20px;

      & + .el-button {
        margin-left: 12px;
      }
    }
  }
}

.remove-schedule {
  font-size: 13px;
  color: #4f8bed;
  cursor: pointer;
  &:hover {
    color: #409eff;
    opacity: 0.8;
  }
}

::v-deep {
  .el-checkbox__label {
    font-size: 13px;
  }
  .el-dialog__body {
    padding: 20px;
  }

  .el-table {
    th {
      background-color: #f5f7fa;
      color: #606266;
      font-weight: 500;
      font-size: 13px;
    }

    td {
      font-size: 13px;
    }
  }

  .el-checkbox {
    font-size: 13px;
  }
}
</style>
