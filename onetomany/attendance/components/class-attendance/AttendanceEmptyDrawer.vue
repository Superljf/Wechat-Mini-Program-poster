<template>
  <el-drawer
    title="课次考勤置空"
    :wrapperClosable="false"
    :visible.sync="visible"
    direction="rtl"
    size="800px"
    :before-close="handleClose"
    custom-class="attendance-empty-drawer"
  >
    <div class="drawer-container" v-loading="loading">
      <div class="content-wrapper">
        <!-- 课次信息 -->
        <div class="class-info-section">
          <div class="section-title">课次信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">上课日期</span>
              <span class="value">{{ classInfo.classDate }}{{ classInfo.weekday ? `（${classInfo.weekday}）` : '' }}</span>
            </div>
            <div class="info-item">
              <span class="label">上课时间</span>
              <span class="value">{{ classInfo.classTime }}</span>
            </div>
            <div class="info-item">
              <span class="label">班级名称</span>
              <span class="value">{{ classInfo.className }}</span>
            </div>
            <div class="info-item">
              <span class="label">班主任</span>
              <span class="value">{{ classInfo.courseManagerName || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 本次考勤学员 -->
        <div class="attendance-section">
          <div class="section-title">本次考勤学员</div>
          <el-table :data="studentList" border style="width: 100%" :key="tableKey" header-cell-class-name="table-header-cell" :max-height="tableMaxHeight">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="studentName" label="学员" min-width="80" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.isTemp" type="info" size="mini" class="temp-tag">临</el-tag>
                {{ scope.row.studentName }}
                <div v-if="scope.row.englishName">({{ scope.row.englishName }})</div>
              </template>
            </el-table-column>

            <!-- 考勤置空/暂不考勤操作列 -->
            <el-table-column label="操作" width="200" align="center" class-name="empty-status-column">
              <template slot="header">
                <div class="empty-header">
                  <div class="header-item">
                    <span>考勤置空</span>
                    <el-checkbox :checked="emptyCheckAll" :indeterminate="emptyIndeterminate" @change="handleEmptyCheckAllChange" />
                  </div>
                  <div class="header-item">
                    <span>暂不置空</span>
                    <el-checkbox :checked="skipCheckAll" :indeterminate="skipIndeterminate" @change="handleSkipCheckAllChange" />
                  </div>
                </div>
              </template>
              <template slot-scope="{ row }">
                <div class="empty-actions">
                  <div class="action-btn empty" :class="{ active: row.emptyStatus === 'empty' }" @click="handleRowEmptyStatusChange(row, 'empty')">
                    考勤置空
                  </div>
                  <div class="action-btn skip" :class="{ active: row.emptyStatus === 'skip' }" @click="handleRowEmptyStatusChange(row, 'skip')">
                    暂不置空
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="currentAttendanceStatus" label="考勤状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag :type="getAttendanceStatusType(scope.row.currentAttendanceStatus)" size="small">
                  {{ scope.row.currentAttendanceStatusText }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="teacherName" label="老师" width="80" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.teacherName }}</span>
                <div v-if="scope.row.chineseTeacherTime">({{ scope.row.chineseTeacherTime }}h)</div>
              </template>
            </el-table-column>

            <el-table-column v-if="classInfo.isJiayin" prop="foreignTeacherName" label="外教" width="80" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.foreignTeacherName }}</span>
                <div v-if="scope.row.foreignTeacherTime">({{ scope.row.foreignTeacherTime }}h)</div>
              </template>
            </el-table-column>

            <!-- 考勤备注列 -->
            <el-table-column label="考勤备注" min-width="180">
              <template slot-scope="{ row }">
                <el-input v-model="row.remark" type="textarea" :rows="2" placeholder="请输入备注信息" maxlength="300" show-word-limit size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <!-- 汇总数据 -->
        <div class="summary-data">
          考勤置空 <span class="normal-count">{{ emptyCount }}</span>
          <span class="separator">|</span>
          暂不置空 <span class="skip-count">{{ skipCount }}</span>
        </div>
        <el-button size="small" type="primary" @click="handleConfirm" :loading="isSubmitting">
          确定置空
        </el-button>
        <el-button size="small" @click="handleClose" plain>取消</el-button>
      </div>
    </div>

    <!-- 确认置空弹窗 -->
    <el-dialog title="确定置空结果" :visible.sync="confirmDialogVisible" width="400px" append-to-body custom-class="confirm-empty-dialog">
      <div class="confirm-content">
        <p>
          本次考勤置空共计
          <strong>
            <span style="color: #409eff;">{{ emptyCount }}</span></strong
          >
          名学员。
        </p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleFinalConfirm" :loading="isSubmitting" size="small">确定</el-button>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script>
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'
import { mapState } from 'vuex'

export default {
  name: 'AttendanceEmptyDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isSubmitting: false,
      confirmDialogVisible: false,
      tableKey: 0,
      loading: false,

      // 课次信息
      classInfo: {},

      // 学员列表 - 只显示正常上课和请假的学员
      studentList: [],

      // 复选框状态
      emptyCheckAll: false,
      skipCheckAll: false,
      emptyIndeterminate: false,
      skipIndeterminate: false,
      tableMaxHeight: 400
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    skipCount() {
      return this.studentList.filter(item => item.emptyStatus === 'skip').length
    },
    emptyCount() {
      return this.studentList.filter(item => item.emptyStatus === 'empty').length
    },
    totalStudents() {
      return this.studentList.length
    }
  },
  watch: {
    visible(val) {
      if (val && this.classData && this.classData.schedulingId) {
        this.loadSchedulingDetail()
      }
    }
  },
  mounted() {
    // 页面创建时执行一次setTableHeight进行赋值，顺道绑定resize事件
    this.$nextTick(() => {
      this.setTableHeight()
    })
    // 页面创建完成后添加监听
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    // 清理事件监听和定时器
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = null
    }
  },
  methods: {
    // 设置表格高度
    setTableHeight() {
      const windowHeight = window.innerHeight
      const reservedHeight = 350

      this.tableMaxHeight = windowHeight - reservedHeight
    },

    // 处理窗口大小变化
    handleResize() {
      // 使用防抖避免频繁计算
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.setTableHeight()
      }, 150)
    },
    // 获取考勤状态类型
    getAttendanceStatusType(status) {
      const statusMap = {
        21: 'success', // 正常上课
        25: 'warning' // 请假
      }
      return statusMap[status] || ''
    },

    // 加载课次考勤详情
    async loadSchedulingDetail() {
      try {
        this.loading = true

        const schedulingId = this.classData.schedulingId
        if (!schedulingId) {
          throw new Error('缺少课次ID，无法加载详情')
        }

        // 使用课次考勤详情接口
        const response = await One2ManyAttendanceApi.getSchedulingAttendanceDetailZk(schedulingId)

        if (response) {
          const data = response
          this.classInfo = {
            classDate: data.courseDate ? `${data.courseDate}` : '',
            classTime: `${data.startTime || ''}-${data.endTime || ''}`,
            className: data.courseName || data.className,
            courseManagerName: data.courseMangerName || data.administratorName,
            weekday: data.weekDay || '',
            isJiayin: data.isJiayin || false
          }

          // 只显示正常上课和请假的学员数据
          if (data.students && Array.isArray(data.students)) {
            this.studentList = data.students
              .filter(student => student.attendType === 21 || student.attendType === 25) // 只要正常上课和请假的
              .map(student => ({
                id: student.studentId,
                studentId: student.studentId,
                studentName: student.studentName,
                englishName: student.englishName || '',
                currentAttendanceStatus: student.attendType, // 当前考勤状态
                currentAttendanceStatusText: student.attendType === 21 ? '正常上课' : '请假',
                teacherName: student.courseTeacherCnName || '',
                chineseTeacherTime: student.courseTeacherCnHour || 0,
                foreignTeacherName: student.courseTeacherEnName || '',
                foreignTeacherTime: student.courseTeacherEnHour || 0,
                attendanceId: student.attendanceId,
                remark: student.notes || '',
                emptyStatus: '', // 默认不选择任何状态
                isTemp: false,
                ...student
              }))
          }

          this.initData()
        }
      } catch (error) {
        this.$message.error(error || '加载课次详情失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    initData() {
      // 初始化数据
      this.studentList.forEach(student => {
        if (!student.emptyStatus) {
          this.$set(student, 'emptyStatus', '') // 默认不选择任何状态
        }
        if (!student.remark) {
          this.$set(student, 'remark', '')
        }
      })

      this.updateCheckboxStatus()
      this.tableKey++
    },

    // 考勤置空全选/取消全选
    handleEmptyCheckAllChange(val) {
      this.emptyIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为考勤置空
        this.studentList.forEach(item => {
          this.$set(item, 'emptyStatus', 'empty')
        })
        this.emptyCheckAll = true
        // 同时取消其他状态的选中和不确定状态
        this.skipCheckAll = false
        this.skipIndeterminate = false
      } else {
        // 如果取消选中，将所有考勤置空的行清空状态
        this.studentList.forEach(item => {
          if (item.emptyStatus === 'empty') {
            this.$set(item, 'emptyStatus', '')
          }
        })
        this.emptyCheckAll = false
      }

      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 暂不置空全选/取消全选
    handleSkipCheckAllChange(val) {
      this.skipIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为暂不置空
        this.studentList.forEach(item => {
          this.$set(item, 'emptyStatus', 'skip')
        })
        this.skipCheckAll = true
        // 同时取消其他状态的选中和不确定状态
        this.emptyCheckAll = false
        this.emptyIndeterminate = false
      } else {
        // 如果取消选中，将所有暂不置空的行清空状态
        this.studentList.forEach(item => {
          if (item.emptyStatus === 'skip') {
            this.$set(item, 'emptyStatus', '')
          }
        })
        this.skipCheckAll = false
      }

      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 处理行置空状态变更
    handleRowEmptyStatusChange(row, type) {
      const index = this.studentList.findIndex(item => item.id === row.id)

      if (index !== -1) {
        // 切换状态
        if (this.studentList[index].emptyStatus === type) {
          this.$set(this.studentList[index], 'emptyStatus', '') // 取消选择，回到未选择状态
        } else {
          this.$set(this.studentList[index], 'emptyStatus', type)
        }
      }

      // 更新复选框状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 更新复选框状态
    updateCheckboxStatus() {
      const totalCount = this.studentList.length
      const emptyCount = this.emptyCount
      const skipCount = this.skipCount

      // 更新考勤置空复选框状态
      if (emptyCount === 0) {
        this.emptyCheckAll = false
        this.emptyIndeterminate = false
      } else if (emptyCount === totalCount) {
        this.emptyCheckAll = true
        this.emptyIndeterminate = false
      } else {
        this.emptyCheckAll = false
        this.emptyIndeterminate = true
      }

      // 更新暂不置空复选框状态
      if (skipCount === 0) {
        this.skipCheckAll = false
        this.skipIndeterminate = false
      } else if (skipCount === totalCount) {
        this.skipCheckAll = true
        this.skipIndeterminate = false
      } else {
        this.skipCheckAll = false
        this.skipIndeterminate = true
      }
    },

    // 确定置空
    handleConfirm() {
      // 校验考勤状态是否维护完整
      const unselectedStudents = this.studentList.filter(item => !item.emptyStatus)
      if (unselectedStudents.length > 0) {
        this.$message.warning('请先选择考勤状态~')
        return
      }

      // 校验考勤置空学员的备注信息是否填写
      const emptyStudentsWithoutRemark = this.studentList.filter(item => item.emptyStatus === 'empty' && !item.remark.trim())
      if (emptyStudentsWithoutRemark.length > 0) {
        this.$message.warning('考勤置空学员需填写备注信息哦~')
        return
      }

      // 校验是否所有学员都是暂不置空状态
      const needEmptyStudents = this.studentList.filter(item => item.emptyStatus === 'empty')
      if (needEmptyStudents.length === 0) {
        this.$message.warning('请选择需要置空的学员')
        return
      }

      // 显示确认弹窗
      this.confirmDialogVisible = true
    },

    // 最终确认
    handleFinalConfirm() {
      this.isSubmitting = true
      this.submitEmpty()
    },

    // 提交置空
    async submitEmpty() {
      try {
        // 构建学员考勤列表 - 只提交"考勤置空"状态的学员，状态改为20（置空）
        const studentAttendances = this.studentList
          .filter(student => student.emptyStatus === 'empty') // 只要考勤置空的学员
          .map(student => ({
            studentId: student.studentId,
            studentName: student.studentName,
            attendType: 20, // 置空状态
            attendanceId: student.attendanceId || undefined,
            notes: student.remark || ''
          }))

        // 构建请求参数 - 使用和课次考勤相同的接口
        const params = {
          schedulingId: this.classData.schedulingId,
          studentAttendances
        }

        // 调用提交接口
        const response = await One2ManyAttendanceApi.recordSchedulingAttendance(params)

        this.$message.success('考勤置空成功')
        this.confirmDialogVisible = false
        this.$emit('update:visible', false)
        this.$emit('refresh')
      } catch (error) {
        this.$message.error(error || '考勤置空失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    },

    // 关闭抽屉
    handleClose() {
      if (this.isSubmitting) {
        return
      }
      this.$emit('update:visible', false)
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

  // 置空状态列固定样式，防止宽度抖动
  .empty-status-column {
    width: 200px !important;
    min-width: 200px !important;
    max-width: 200px !important;
  }
}

.attendance-empty-drawer {
  .drawer-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content-wrapper {
    flex: 1;
    padding: 20px;
    overflow: hidden;
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
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

  .class-info-section {
    margin-bottom: 24px;

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 16px;

      .label {
        color: #666;
        width: 80px;
        text-align: right;
        display: inline-block;
      }

      .value {
        color: #333;
      }
    }
  }

  .attendance-section {
    margin-bottom: 24px;
  }

  .empty-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;

    .header-item {
      display: flex;
      align-items: center;
      gap: 4px;

      .el-checkbox {
        margin-right: 0;
      }
    }
  }

  .empty-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 32px;

    .action-btn {
      padding: 3px 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
      white-space: nowrap;
      text-align: center;

      &:hover {
        color: #157cff;
        border-color: #157cff;
      }

      &.empty.active {
        color: #f56c6c;
        border-color: #f56c6c;
        background-color: rgba(254, 240, 240, 1);
      }

      &.skip:hover {
        color: #909399;
        border-color: #c0c4cc;
      }

      &.skip.active {
        color: #909399;
        border-color: #c0c4cc;
        background-color: rgba(245, 247, 250, 1);
      }
    }
  }

  .temp-tag {
    margin-right: 6px;
    font-size: 12px !important;
    padding: 2px 4px !important;
    height: 20px !important;
    line-height: 14px !important;
    border-radius: 2px !important;
    background-color: #eff7ff !important;
    color: #157cff !important;
    border-color: #157cff;
  }

  .summary-data {
    margin-bottom: 16px;
    font-size: 14px;

    .normal-count {
      color: #409eff;
      font-weight: bold;
    }

    .leave-count {
      color: #e6a23c;
      font-weight: bold;
    }

    .skip-count {
      color: #909399;
      font-weight: bold;
    }

    .separator {
      margin: 0 8px;
      color: #ddd;
    }
  }

  .drawer-footer {
    padding: 16px;
    text-align: center;
  }
}

// 确认弹窗样式
::v-deep .confirm-empty-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;

  .el-dialog__header {
    border: none !important;
    border-radius: 8px 8px 0px 0px;
    background-color: rgba(241, 244, 247, 1);
    display: flex;
    align-items: center;
    padding: 12px 20px;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
  }

  .el-dialog__body {
    padding: 20px !important;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }

  .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
    border-top: none !important;
    padding: 16px 20px;
  }
}

.confirm-content {
  padding: 16px 0;
  line-height: 26px;

  p {
    margin: 0;
    font-size: 14px;
    color: #333;

    strong {
      font-weight: 500;
      color: #f56c6c;
    }
  }
}
</style>
