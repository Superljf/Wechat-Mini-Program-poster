<template>
  <el-dialog :title="`${actionText}确认`" :visible.sync="visible" width="900px" :before-close="handleClose" custom-class="conflict-list-dialog">
    <div class="conflict-list">
      <!-- 本次调课部分 -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">本次{{ actionText }}</div>
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

        <!-- 本次调课列表 -->
        <el-table :data="filteredScheduleList" style="width: 100%;" border>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="courseDateStr" label="上课日期" width="150" align="center" />
          <el-table-column prop="startTime" label="上课时间" width="150" align="center">
            <template slot-scope="scope"> {{ scope.row.startTime }}-{{ scope.row.endTime }} </template>
          </el-table-column>
          <el-table-column prop="studentName" label="学生" align="center" />
          <el-table-column prop="counselorName" label="学管师" align="center" />
          <el-table-column prop="teacherName" label="老师" align="center" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template slot-scope="scope">
              <span :class="['status', { conflict: scope.row.scheduleStatus === '冲突' }]">
                {{ scope.row.scheduleStatus }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <span class="remove-schedule" style="font-size: 13px; color: #4f8bed; cursor: pointer;" @click="removeSchedule(scope.$index)">移除</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 冲突列表部分 -->
      <div v-if="hasConflict" class="section conflict-section">
        <div class="section-header">
          <div class="section-title">冲突列表</div>
        </div>
        <el-table :data="conflictList" style="width: 100%" border>
          <el-table-column prop="encoding" label="考勤单号" width="180" align="center" />
          <el-table-column prop="courseDateStr" label="上课日期" width="150" align="center" />
          <el-table-column prop="startTime" label="上课时间" width="150" align="center">
            <template slot-scope="scope"> {{ scope.row.startTime }}-{{ scope.row.endTime }} </template>
          </el-table-column>
          <el-table-column prop="attendBranchName" label="上课校区" align="center" />
          <el-table-column prop="studentName" label="学生" align="center" />
          <el-table-column prop="counselorName" label="学管师" align="center" />
          <el-table-column prop="teacherName" label="老师" align="center" />
        </el-table>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <template v-if="hasConflict">
        <el-button type="primary" @click="handleDeleteConflictAndSchedule" :loading="isSubmitting" :disabled="isSubmitDisabled"
          >删除冲突课次并{{ actionText }}</el-button
        >
      </template>
      <template v-else>
        <el-button type="primary" @click="handleConfirmSchedule" :loading="isSubmitting" :disabled="isSubmitDisabled">确定</el-button>
      </template>
      <el-button @click="handleClose">取消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { studentManApi } from '@/services'

export default {
  name: 'ConflictList',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scheduleList: {
      type: Object,
      default: () => {}
    },
    // 新增属性：是否是调课场景，默认为排课场景
    isSwitch: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      onlyShowConflict: false,
      conflictList: [], // 冲突列表数据
      currentScheduleList: [], // 当前排课列表数据
      isSubmitting: false // 新增提交中状态用于按钮loading
    }
  },

  computed: {
    // 是否存在冲突
    hasConflict() {
      return this.conflictList.length > 0
    },

    // 成功课次数
    successCount() {
      return this.currentScheduleList.filter(item => item.scheduleStatus === '可排').length
    },

    // 冲突课次数
    conflictCount() {
      return this.currentScheduleList.filter(item => item.scheduleStatus === '冲突').length
    },

    // 根据筛选条件过滤后的排课列表
    filteredScheduleList() {
      if (this.onlyShowConflict) {
        return this.currentScheduleList.filter(item => item.scheduleStatus === '冲突')
      }
      return this.currentScheduleList
    },

    // 根据场景返回对应的文案
    actionText() {
      return this.isSwitch ? '调课' : '排课'
    },

    // 判断是否应该禁用提交按钮
    isSubmitDisabled() {
      // 如果当前排课列表为空，则禁用按钮
      if (this.currentScheduleList.length === 0) {
        return true
      }
      // 如果有冲突，则只检查可排课的数量
      if (this.hasConflict) {
        return this.currentScheduleList.filter(item => item.scheduleStatus === '可排').length === 0
      }

      return false
    }
  },

  watch: {
    visible(newVal) {
      if (newVal && this.scheduleList) {
        this.initData()
      }
    },
    scheduleList: {
      handler(newVal) {
        if (this.visible && newVal.length > 0) {
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
        // 调用排课确认接口获取冲突信息
        this.currentScheduleList = this.scheduleList.currentScheduleList
        this.conflictList = this.scheduleList.conflictList
      } catch (error) {
        console.error('获取排课冲突信息失败:', error)
        this.$message.error('获取排课冲突信息失败')
      }
    },

    // 删除冲突课次并排课/调课
    async handleDeleteConflictAndSchedule() {
      if (this.isSubmitting) return

      this.isSubmitting = true
      try {
        const validScheduleList = this.currentScheduleList.filter(item => item.scheduleStatus === '可排')

        if (validScheduleList.length === 0) {
          this.$message.warning(`没有可${this.actionText}的课次`)
          return
        }
        await studentManApi[this.isSwitch ? 'updateYdyScheduling' : 'addYdySchedulingList'](validScheduleList)
        this.$message.success(`本次已成功${this.actionText} ${validScheduleList.length} 节！`)
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        console.error(`${this.actionText}失败:`, error)
        this.$message.error(`${this.actionText}失败，${error}`)
      } finally {
        this.isSubmitting = false
      }
    },

    // 确认排课/调课（无冲突时）
    async handleConfirmSchedule() {
      if (this.isSubmitting) return

      this.isSubmitting = true
      try {
        if (this.currentScheduleList.length === 0) {
          this.$message.warning(`没有可${this.actionText}的课次`)
          return
        }
        await studentManApi[this.isSwitch ? 'updateYdyScheduling' : 'addYdySchedulingList'](this.currentScheduleList)
        this.$message.success(`本次已成功${this.actionText} ${this.currentScheduleList?.length} 节！`)
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        console.error(`${this.actionText}失败:`, error)
        if (error.includes('Classin')) {
          this.$message.warning(`${error}`)
          this.$emit('success')
          this.handleClose()
        } else {
          this.$message.error(`${this.actionText}失败，${error}`)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.$emit('update:visible', false)
      this.onlyShowConflict = false
      this.currentScheduleList = []
      this.conflictList = []
      this.isSubmitting = false // 重置提交状态
    },

    removeSchedule(index) {
      this.currentScheduleList.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-dialog.conflict-list-dialog {
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
  }
}

::v-deep .el-dialog.conflict-list-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
  padding-bottom: 30px;
}

.conflict-list-dialog {
  .conflict-list {
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
