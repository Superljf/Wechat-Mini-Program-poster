<template>
  <el-drawer title="课次考勤" :visible.sync="visible" direction="rtl" size="900px" :before-close="handleClose" custom-class="batch-attendance-drawer">
    <div class="drawer-container">
      <div class="content-wrapper">
        <!-- 课次列表 -->
        <div class="schedule-list">
          <div class="section-title">课次列表</div>
          <el-table :data="scheduleList" border style="width: 100%" :key="tableKey" header-cell-class-name="table-header-cell">
            <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
            <el-table-column prop="courseDate" label="上课日期" width="100"></el-table-column>
            <el-table-column prop="weekDay" label="星期" width="80"></el-table-column>

            <el-table-column label="上课时间" width="120">
              <template slot-scope="scope"> {{ scope.row.startTime }} - {{ scope.row.endTime }} </template>
            </el-table-column>

            <el-table-column prop="studentName" label="学生"></el-table-column>
            <el-table-column prop="counselorName" label="学管师"></el-table-column>
            <el-table-column prop="attTeacherName" label="老师">
              <template slot-scope="scope"> {{ scope.row.attTeacherName || scope.row.teacherName }} </template>
            </el-table-column>
            <el-table-column prop="status" key="this.normalCount" label="操作" width="200" class-name="attendance-status-column">
              <template slot="header">
                <div class="attendance-header">
                  <div class="header-item">
                    <span>正常上课</span>
                    <el-checkbox :checked="normalCheckAll" :indeterminate="normalIndeterminate" @change="handleNormalCheckAllChange"></el-checkbox>
                  </div>
                  <div class="header-item">
                    <span>学生旷课</span>
                    <el-checkbox :checked="absentCheckAll" :indeterminate="absentIndeterminate" @change="handleAbsentCheckAllChange"></el-checkbox>
                  </div>
                </div>
              </template>
              <template slot-scope="{ row }">
                <div class="attendance-actions">
                  <div class="action-btn normal" :class="{ active: row.status === 'normal' }" @click="handleRowStatusChange(row, 'normal')">
                    正常上课
                  </div>
                  <div class="action-btn absent" :class="{ active: row.status === 'absent' }" @click="handleRowStatusChange(row, 'absent')">
                    学生旷课
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <!-- 汇总数据 -->
        <div class="summary-data">
          正常上课 <span class="normal-count">{{ normalCount }}</span
          ><span class="separator" style="margin: 0 8px">|</span>学生旷课
          <span class="absent-count">{{ absentCount }}</span>
        </div>
        <el-button size="small" type="primary" @click="handleConfirm" :loading="isSubmitting" :disabled="!isAllSelected">确认考勤</el-button>
        <el-button size="small" @click="handleClose">取消</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: 'BatchAttendance',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedRows: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      scheduleList: [],
      normalCheckAll: false,
      absentCheckAll: false,
      normalIndeterminate: false,
      absentIndeterminate: false,
      tableKey: 0,
      isSubmitting: false
    }
  },
  computed: {
    normalCount() {
      return this.scheduleList.filter(item => item.status === 'normal').length
    },
    absentCount() {
      return this.scheduleList.filter(item => item.status === 'absent').length
    },
    isAllSelected() {
      return this.scheduleList.length > 0 && this.scheduleList.every(item => item.status === 'normal' || item.status === 'absent')
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initData()
      }
    }
  },

  //正常上课 attendType:'YDY_ZCSK'
  //学生旷课 attendType:'YDY_XSKK'
  methods: {
    initData() {
      // 初始化课次列表数据
      this.scheduleList = this.selectedRows.map(row => {
        const newRow = {
          ...row,
          status: '', // normal: 正常上课, absent: 学生旷课
          weekDay: this.getWeekDay(row.courseDate)
        }
        return newRow
      })
      // 重置复选框状态
      this.updateCheckboxStatus()
      this.tableKey++
    },
    getWeekDay(date) {
      const weekMap = ['日', '一', '二', '三', '四', '五', '六']
      
      // 处理yyyyMMdd格式的日期
      let dateObj
      if (typeof date === 'string' || typeof date === 'number') {
        // 将yyyyMMdd格式转换为yyyy-MM-dd格式
        const dateStr = String(date)
        if (dateStr.length === 8) {
          const year = dateStr.substring(0, 4)
          const month = dateStr.substring(4, 6)
          const day = dateStr.substring(6, 8)
          dateObj = new Date(`${year}-${month}-${day}`)
        } else {
          dateObj = new Date(date)
        }
      } else {
        dateObj = new Date(date)
      }
      
      const day = dateObj.getDay()
      return '周' + weekMap[day]
    },
    // 正常上课全选/取消全选
    handleNormalCheckAllChange(val) {
      // 清除不确定状态
      this.normalIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为正常上课
        const newList = [...this.scheduleList]
        newList.forEach(item => {
          this.$set(item, 'status', 'normal')
        })
        this.scheduleList = newList
        this.normalCheckAll = true
        // 同时取消学生旷课的选中和不确定状态
        this.absentCheckAll = false
        this.absentIndeterminate = false
      } else {
        // 如果取消选中，将所有正常上课的行清空
        const newList = [...this.scheduleList]
        newList.forEach(item => {
          if (item.status === 'normal') {
            this.$set(item, 'status', '')
          }
        })
        this.scheduleList = newList
        this.normalCheckAll = false
      }
      // 手动调用更新状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },
    // 学生旷课全选/取消全选
    handleAbsentCheckAllChange(val) {
      // 清除不确定状态
      this.absentIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为学生旷课
        const newList = [...this.scheduleList]
        newList.forEach(item => {
          this.$set(item, 'status', 'absent')
        })
        this.scheduleList = newList
        this.absentCheckAll = true
        // 同时取消正常上课的选中和不确定状态
        this.normalCheckAll = false
        this.normalIndeterminate = false
      } else {
        // 如果取消选中，将所有学生旷课的行清空
        const newList = [...this.scheduleList]
        newList.forEach(item => {
          if (item.status === 'absent') {
            this.$set(item, 'status', '')
          }
        })
        this.scheduleList = newList
        this.absentCheckAll = false
      }
      // 手动调用更新状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },
    // 处理行状态变更
    handleRowStatusChange(row, type) {
      // 克隆列表以确保响应式更新
      const newList = [...this.scheduleList]
      const index = newList.findIndex(item => item === row)

      if (index !== -1) {
        // 切换状态
        if (newList[index].status === type) {
          this.$set(newList[index], 'status', '')
        } else {
          this.$set(newList[index], 'status', type)
        }
        // 更新整个列表
        this.scheduleList = newList
      }

      // 更新复选框状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },
    // 更新复选框状态
    updateCheckboxStatus() {
      const totalCount = this.scheduleList.length
      const normalCount = this.normalCount
      const absentCount = this.absentCount

      // 更新正常上课复选框状态
      if (normalCount === 0) {
        // 没有选中任何正常上课
        this.normalCheckAll = false
        this.normalIndeterminate = false
      } else if (normalCount === totalCount) {
        // 全部选中正常上课
        this.normalCheckAll = true
        this.normalIndeterminate = false
      } else {
        // 部分选中正常上课
        this.normalCheckAll = false
        this.normalIndeterminate = true
      }

      // 更新学生旷课复选框状态
      if (absentCount === 0) {
        // 没有选中任何学生旷课
        this.absentCheckAll = false
        this.absentIndeterminate = false
      } else if (absentCount === totalCount) {
        // 全部选中学生旷课
        this.absentCheckAll = true
        this.absentIndeterminate = false
      } else {
        // 部分选中学生旷课
        this.absentCheckAll = false
        this.absentIndeterminate = true
      }

      // 移除tableKey更新，避免表格重新渲染导致的抖动和滚动条跳转
      // this.tableKey += 1
    },
    handleConfirm() {
      if (!this.isAllSelected || this.isSubmitting) {
        return
      }

      this.isSubmitting = true
      this.$emit('confirm', this.scheduleList)
      // Don't close the drawer here - it will be closed after the parent component
      // successfully processes the attendance
    },
    handleClose() {
      if (this.isSubmitting) {
        return // Prevent closing while submitting
      }
      this.$emit('update:visible', false)
      this.isSubmitting = false // Reset submitting state
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-drawer__header {
    padding: 16px;
    color: rgba(51, 51, 51, 1);
    font-size: 14px;
    font-family: PingFangSC-bold;
    background-color: rgba(241, 244, 247, 1);
    font-weight: 600;
    margin-bottom: 0px;
  }

  // 表格标题行背景色
  .table-header-cell {
    background-color: rgba(250, 250, 250, 1) !important;
  }

  // 考勤状态列固定样式，防止宽度抖动
  .attendance-status-column {
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
  }
}
.batch-attendance-drawer {
  .drawer-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content-wrapper {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .attendance-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;

    .header-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .el-checkbox {
        margin-right: 0;
      }
    }
  }

  .attendance-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    min-height: 32px; // 固定最小高度

    .action-btn {
      padding: 2px 8px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      white-space: nowrap; // 防止文字换行
      min-width: 70px; // 固定最小宽度
      text-align: center; // 文字居中

      &:hover {
        color: #157cff;
        border-color: #157cff;
      }

      &.normal.active {
        color: #157cff;
        border-color: #157cff;
        background-color: rgba(239, 247, 255, 1);
      }

      &.absent:hover {
        color: #e6a23c;
        border-color: #f29d36;
      }

      &.absent.active {
        color: #e6a23c;
        border-color: #f29d36;
        background-color: rgba(254, 245, 230, 1);
      }
    }
  }

  .summary-data {
    margin-top: 20px;
    margin-bottom: 20px;

    .normal-count {
      color: #409eff;
      font-weight: bold;
    }

    .absent-count {
      color: #e6a23c;
      font-weight: bold;
    }
  }

  .drawer-footer {
    padding: 16px;
    text-align: center;
  }
}
</style>
