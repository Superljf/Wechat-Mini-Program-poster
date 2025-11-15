<template>
  <el-drawer
    title="课次考勤"
    :wrapperClosable="false"
    :visible.sync="visible"
    direction="rtl"
    size="800px"
    :before-close="handleClose"
    custom-class="class-attendance-drawer"
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

          <!-- 老师信息 - 根据是否为佳音展示不同内容 -->
          <div v-if="!isJiayin" class="teacher-simple">
            <div class="info-item">
              <span class="label">老师</span>
              <span class="value">{{ classInfo.teacherName }}</span>
            </div>
          </div>

          <!-- 佳音老师列表 -->
          <div v-else class="teacher-list">
            <el-table :data="teacherList" border style="width: 100%; margin-top: 12px;" header-cell-class-name="table-header-cell">
              <el-table-column prop="type" label="类型" width="70" align="center" />
              <el-table-column label="老师" width="210" align="center">
                <template slot-scope="scope">
                  <HiAsyncSelector
                    v-model="scope.row.teacherId"
                    dict-key="teacher"
                    :defaultWord="scope.row.teacherName"
                    :param="{ buId: userBaseInfo.buId, size: 100 }"
                    placeholder="请输入老师姓名/编码"
                    size="small"
                    clearable
                    @change="(value, option) => handleTeacherChange(scope.$index, value, option)"
                    style="width: 100%"
                  >
                    <template v-slot="slotProps">
                      <span>{{ slotProps.label }}</span>
                      <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                    </template>
                  </HiAsyncSelector>
                </template>
              </el-table-column>
              <el-table-column label="正课" align="center">
                <template slot-scope="scope">
                  <div class="time-input-wrapper">
                    <el-input-number
                      v-model="scope.row.regularTime"
                      :min="0"
                      :max="classInfo.totalDuration"
                      size="small"
                      class="time-input"
                      :disabled="scope.row.type === '中教'"
                      @change="handleRegularTimeChange(scope.$index)"
                      style="width: 120px"
                    />
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="口语" align="center">
                <template slot-scope="scope">
                  <div v-if="scope.row.type === '外教'" class="time-input-wrapper">
                    <el-input-number v-model="scope.row.oralTime" :min="0" :max="180" size="small" class="time-input" style="width: 120px" />
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 本次考勤学员 -->
        <div class="attendance-section">
          <div class="section-title">本次考勤学员</div>
          <el-table :data="studentList" border style="width: 100%" :key="tableKey" header-cell-class-name="table-header-cell" empty-text="本次没有可考勤的学员">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column prop="studentName" label="学生" min-width="60" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.isTemp" type="info" size="mini" class="temp-tag">临</el-tag>
                {{ scope.row.studentName }}
                <div v-if="scope.row.englishName">({{ scope.row.englishName }})</div>
              </template>
            </el-table-column>
            <!-- 考勤状态列 -->
            <el-table-column label="考勤状态" width="280" align="center" class-name="attendance-status-column">
              <template slot="header">
                <div class="attendance-header">
                  <div class="header-item">
                    <span>{{ normalAttendanceText }}</span>
                    <el-checkbox :checked="normalCheckAll" :indeterminate="normalIndeterminate" @change="handleNormalCheckAllChange" />
                  </div>
                  <div class="header-item">
                    <span>请假</span>
                    <el-checkbox :checked="leaveCheckAll" :indeterminate="leaveIndeterminate" @change="handleLeaveCheckAllChange" />
                  </div>
                  <div class="header-item">
                    <span>暂不考勤</span>
                    <el-checkbox :checked="skipCheckAll" :indeterminate="skipIndeterminate" @change="handleSkipCheckAllChange" />
                  </div>
                </div>
              </template>
              <template slot-scope="{ row }">
                <div class="attendance-actions">
                  <div class="action-btn normal" :class="{ active: row.attendanceStatus === 'normal' }" @click="handleRowStatusChange(row, 'normal')">
                    {{ normalAttendanceText }}
                  </div>
                  <div class="action-btn leave" :class="{ active: row.attendanceStatus === 'leave' }" @click="handleRowStatusChange(row, 'leave')">
                    请假
                  </div>
                  <div class="action-btn skip" :class="{ active: row.attendanceStatus === 'skip' }" @click="handleRowStatusChange(row, 'skip')">
                    暂不考勤
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 考勤备注列 -->
            <el-table-column label="考勤备注" min-width="160">
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
          {{ normalAttendanceText }} <span class="normal-count">{{ normalCount }}</span>
          <span class="separator">|</span>
          请假 <span class="leave-count">{{ leaveCount }}</span>
          <span class="separator">|</span>
          暂不考勤 <span class="skip-count">{{ skipCount }}</span>
        </div>
        <el-button size="small" type="primary" @click="handleConfirm" :loading="isSubmitting">
          确定考勤
        </el-button>
        <el-button size="small" @click="handleClose" plain>取消</el-button>
      </div>
    </div>

    <!-- 确认考勤弹窗 -->
    <el-dialog title="确定考勤结果" :visible.sync="confirmDialogVisible" width="400px" append-to-body custom-class="confirm-attendance-dialog">
      <div class="confirm-content">
        <p>
          本次点名共计
          <strong>
            <span style="color: #409eff;">{{ totalStudents }}</span></strong
          >
          名学员。其中：{{ normalAttendanceText }} <strong class="normal">{{ normalCount }}</strong> 名、请假
          <strong class="leave">{{ leaveCount }}</strong> 名、暂不考勤 <strong class="skip">{{ skipCount }}</strong> 名。
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
  name: 'ClassAttendanceDrawer',
  components: {},
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
    },
    // 调用来源：'class' - 课次考勤列表，'student' - 学员考勤列表
    source: {
      type: String,
      default: 'class',
      validator: value => ['class', 'student'].includes(value)
    }
  },
  data() {
    return {
      isSubmitting: false,
      confirmDialogVisible: false,
      tableKey: 0,
      loading: false,

      // 考勤类型映射：后端 attendType <-> 前端 attendanceStatus
      attendanceTypeMap: {
        21: 'normal', // 正常上课
        25: 'leave', // 请假
        28: 'skip' // 未考勤
      },

      // 是否为佳音（根据实际业务逻辑判断）
      isJiayin: true,

      // 课次信息
      classInfo: {},

      // 老师列表（佳音专用）- 始终显示中教和外教
      teacherList: [
        {
          type: '中教',
          teacherId: '',
          teacherName: '',
          regularTime: 0,
          oralTime: 0
        },
        {
          type: '外教',
          teacherId: '',
          teacherName: '',
          regularTime: 0,
          oralTime: 0
        }
      ],

      // 学员列表
      studentList: [],

      // 复选框状态
      normalCheckAll: false,
      leaveCheckAll: false,
      skipCheckAll: false,
      normalIndeterminate: false,
      leaveIndeterminate: false,
      skipIndeterminate: false
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    // 根据上课日期判断按钮文案
    normalAttendanceText() {
      if (!this.classInfo.classDate) {
        return '正常上课'
      }

      // 解析上课日期
      const classDate = new Date(this.classInfo.classDate)
      const today = new Date()

      // 重置时间部分，只比较日期
      classDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)

      // 如果上课日期是今天，显示"正常上课"
      if (classDate.getTime() === today.getTime()) {
        return '正常上课'
      }
      // 如果上课日期已过，显示"跨天考勤"
      else if (classDate.getTime() < today.getTime()) {
        return '跨天考勤'
      }
      // 如果上课日期未到，显示"正常上课"
      else {
        return '正常上课'
      }
    },

    normalCount() {
      return this.studentList.filter(item => item.attendanceStatus === 'normal').length
    },
    leaveCount() {
      return this.studentList.filter(item => item.attendanceStatus === 'leave').length
    },
    skipCount() {
      return this.studentList.filter(item => item.attendanceStatus === 'skip').length
    },
    totalStudents() {
      return this.studentList.length
    },
    isAllSelected() {
      return this.studentList.length > 0 && this.studentList.every(item => item.attendanceStatus)
    }
  },
  watch: {
    visible(val) {
      if (val && this.classData) {
        // 根据调用来源检查不同的必需参数
        const hasRequiredId = this.source === 'student' ? this.classData.attendanceId : this.classData.schedulingId

        if (hasRequiredId) {
          this.loadSchedulingDetail()
        }
      }
    }
  },
  methods: {
    // 获取考勤类型的反向映射
    getAttendTypeByStatus(status) {
      const reverseMap = {
        normal: 21,
        leave: 25,
        skip: 28
      }
      return reverseMap[status]
    },

    // 加载课次考勤详情
    async loadSchedulingDetail() {
      try {
        this.loading = true

        let response
        // 根据调用来源使用不同的接口
        if (this.source === 'student') {
          // 学员考勤列表调用：使用学员考勤详情接口
          const schedulingId = this.classData.schedulingId
          const studentId = this.classData.studentId
          response = await One2ManyAttendanceApi.getStudentSchedulingAttendanceDetail(schedulingId, studentId)
        } else {
          // 课次考勤列表调用：使用课次考勤详情接口
          const schedulingId = this.classData.schedulingId
          if (!schedulingId) {
            throw new Error('缺少课次ID，无法加载详情')
          }
          response = await One2ManyAttendanceApi.getSchedulingAttendanceDetail(schedulingId)
        }

        if (response) {
          const data = response
          this.classInfo = {
            classDate: data.courseDate ? `${data.courseDate}` : '',
            classTime: `${data.startTime || ''}-${data.endTime || ''}`,
            className: data.courseName || data.className,
            courseManagerName: data.courseMangerName || data.administratorName,
            teacherName: data.teacherName || '',
            totalDuration: data.duration,
            weekday: data.weekDay || ''
          }

          // 更新是否为佳音
          this.isJiayin = data.isJiayin || false

          // 更新老师列表（佳音）- 回显后端数据到固定的中教和外教行
          if (data.teachers && Array.isArray(data.teachers)) {
            data.teachers.forEach(teacher => {
              const teacherType = teacher.teacherType === 'CHINESE' ? '中教' : '外教'
              const targetTeacher = this.teacherList.find(t => t.type === teacherType)

              if (targetTeacher) {
                targetTeacher.teacherId = teacher.teacherId || ''
                targetTeacher.teacherName = teacher.teacherName || ''
                targetTeacher.regularTime = teacher.regularMinutes || 0
                targetTeacher.oralTime = teacher.oralMinutes || 0
              }
            })
          }

          // 课次考勤详情：包含多个学员数据，只显示未考勤的学员（attendType为28）
          if (data.students && Array.isArray(data.students)) {
            // 过滤出未考勤的学员

            this.studentList = data.students.map(student => ({
              id: student.studentId,
              studentId: student.studentId,
              studentName: student.studentName,
              englishName: student.englishName || '',
              attendanceStatus: '', // 默认为空，用户手动选择
              attendanceId: student.attendanceId,
              remark: student.notes || '',
              isTemp: false,
              orderNumber: student.orderNumber || 0
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

    // 重置老师列表数据
    resetTeacherList() {
      this.teacherList.forEach(teacher => {
        teacher.teacherId = ''
        teacher.teacherName = ''
        teacher.regularTime = 0
        teacher.oralTime = 0
      })
    },

    initData() {
      // 初始化数据
      this.studentList.forEach(student => {
        if (!student.attendanceStatus) {
          this.$set(student, 'attendanceStatus', '')
        }
        if (!student.remark) {
          this.$set(student, 'remark', '')
        }
      })

      // 初始化中教时长计算
      this.calculateChineseTeacherTime()

      this.updateCheckboxStatus()
      this.tableKey++
    },

    // 选择老师 - 兼容旧方法
    selectTeacher(index, data) {
      this.$set(this.teacherList[index], 'teacherId', data.id || '')
      this.$set(this.teacherList[index], 'teacherName', data.teacherName || '')
    },

    // HiAsyncSelector老师选择变化处理
    handleTeacherChange(index, value, option) {
      if (value && option) {
        this.$set(this.teacherList[index], 'teacherId', value)
        this.$set(this.teacherList[index], 'teacherName', option.label || '')
      } else {
        this.$set(this.teacherList[index], 'teacherId', '')
        this.$set(this.teacherList[index], 'teacherName', '')
      }
    },

    // 处理正课时长变化
    handleRegularTimeChange(index) {
      // 如果是外教时长变化，需要重新计算中教时长
      if (this.teacherList[index].type === '外教') {
        this.calculateChineseTeacherTime()
      }
    },

    // 计算中教正课时长
    calculateChineseTeacherTime() {
      const chineseTeacher = this.teacherList.find(t => t.type === '中教')
      const foreignTeacher = this.teacherList.find(t => t.type === '外教')

      if (chineseTeacher && foreignTeacher) {
        const totalDuration = this.classInfo.totalDuration
        const foreignTime = foreignTeacher.regularTime || 0
        chineseTeacher.regularTime = Math.max(0, totalDuration - foreignTime)
      }
    },

    // 正常上课全选/取消全选
    handleNormalCheckAllChange(val) {
      // 清除不确定状态
      this.normalIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为正常上课
        const newList = [...this.studentList]
        newList.forEach(item => {
          this.$set(item, 'attendanceStatus', 'normal')
        })
        this.studentList = newList
        this.normalCheckAll = true
        // 同时取消其他状态的选中和不确定状态
        this.leaveCheckAll = false
        this.skipCheckAll = false
        this.leaveIndeterminate = false
        this.skipIndeterminate = false
        
      } else {
        // 如果取消选中，将所有正常上课的行清空
        const newList = [...this.studentList]
        newList.forEach(item => {
          if (item.attendanceStatus === 'normal') {
            this.$set(item, 'attendanceStatus', '')
          }
        })
        this.studentList = newList
        this.normalCheckAll = false
      }
      // 手动调用更新状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 请假全选/取消全选
    handleLeaveCheckAllChange(val) {
      // 清除不确定状态
      this.leaveIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为请假
        const newList = [...this.studentList]
        newList.forEach(item => {
          this.$set(item, 'attendanceStatus', 'leave')
        })
        this.studentList = newList
        this.leaveCheckAll = true
        // 同时取消其他状态的选中和不确定状态
        this.normalCheckAll = false
        this.skipCheckAll = false
        this.normalIndeterminate = false
        this.skipIndeterminate = false
      } else {
        // 如果取消选中，将所有请假的行清空
        const newList = [...this.studentList]
        newList.forEach(item => {
          if (item.attendanceStatus === 'leave') {
            this.$set(item, 'attendanceStatus', '')
          }
        })
        this.studentList = newList
        this.leaveCheckAll = false
      }
      // 手动调用更新状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 暂不考勤全选/取消全选
    handleSkipCheckAllChange(val) {
      // 清除不确定状态
      this.skipIndeterminate = false

      if (val) {
        // 如果选中，将所有行设为暂不考勤
        const newList = [...this.studentList]
        newList.forEach(item => {
          this.$set(item, 'attendanceStatus', 'skip')
        })
        this.studentList = newList
        this.skipCheckAll = true
        // 同时取消其他状态的选中和不确定状态
        this.normalCheckAll = false
        this.leaveCheckAll = false
        this.normalIndeterminate = false
        this.leaveIndeterminate = false
      } else {
        // 如果取消选中，将所有暂不考勤的行清空
        const newList = [...this.studentList]
        newList.forEach(item => {
          if (item.attendanceStatus === 'skip') {
            this.$set(item, 'attendanceStatus', '')
          }
        })
        this.studentList = newList
        this.skipCheckAll = false
      }
      // 手动调用更新状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 处理行状态变更
    handleRowStatusChange(row, type) {
      // 克隆列表以确保响应式更新
      const newList = [...this.studentList]
      const index = newList.findIndex(item => item.id === row.id)

      if (index !== -1) {
        // 切换状态
        if (newList[index].attendanceStatus === type) {
          this.$set(newList[index], 'attendanceStatus', '')
        } else {
          this.$set(newList[index], 'attendanceStatus', type)
        }
        // 更新整个列表
        this.studentList = newList
      }

      // 更新复选框状态
      this.$nextTick(() => {
        this.updateCheckboxStatus()
      })
    },

    // 更新复选框状态
    updateCheckboxStatus() {
      const totalCount = this.studentList.length
      const normalCount = this.normalCount
      const leaveCount = this.leaveCount
      const skipCount = this.skipCount

      // 更新正常上课复选框状态
      if (normalCount === 0) {
        this.normalCheckAll = false
        this.normalIndeterminate = false
      } else if (normalCount === totalCount) {
        this.normalCheckAll = true
        this.normalIndeterminate = false
      } else {
        this.normalCheckAll = false
        this.normalIndeterminate = true
      }

      // 更新请假复选框状态
      if (leaveCount === 0) {
        this.leaveCheckAll = false
        this.leaveIndeterminate = false
      } else if (leaveCount === totalCount) {
        this.leaveCheckAll = true
        this.leaveIndeterminate = false
      } else {
        this.leaveCheckAll = false
        this.leaveIndeterminate = true
      }

      // 更新暂不考勤复选框状态
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

      // 移除tableKey更新，避免表格重新渲染导致的抖动和滚动条跳转
      // this.tableKey += 1
    },

    // 确定考勤
    handleConfirm() {
      // 校验考勤状态是否完整
      const unselectedStudents = this.studentList.filter(item => !item.attendanceStatus)
      if (unselectedStudents.length > 0) {
        this.$message.warning('请先选择考勤状态~')
        return
      }

      // 校验请假学员是否填写备注
      const leaveStudentsWithoutRemark = this.studentList.filter(item => item.attendanceStatus === 'leave' && !item.remark.trim())
      if (leaveStudentsWithoutRemark.length > 0) {
        this.$message.warning('请假学员需填写备注信息哦~')
        return
      }

      // 校验是否所有学员都是暂不考勤状态
      const needAttendanceStudents = this.studentList.filter(item => item.attendanceStatus !== 'skip')
      if (needAttendanceStudents.length === 0) {
        this.$message.warning('暂不考勤状态不需要考勤')
        return
      }

      // 显示确认弹窗
      this.confirmDialogVisible = true
    },

    // 最终确认
    handleFinalConfirm() {
      this.isSubmitting = true
      this.submitAttendance()
    },

    // 提交考勤
    async submitAttendance() {
      try {
        // 构建学员考勤列表 - 过滤掉"暂不考勤"状态的学员
        const studentAttendances = this.studentList
          .filter(student => student.attendanceStatus !== 'skip') // 过滤掉暂不考勤的学员
          .map(student => ({
            studentId: student.studentId,
            studentName: student.studentName,
            attendType: this.getAttendTypeByStatus(student.attendanceStatus),
            attendanceId: student.attendanceId || undefined,
            notes: student.remark || ''
          }))

        // 构建教师信息（仅佳音）
        let teacherInfo = null
        if (this.isJiayin && this.teacherList && this.teacherList.length > 0) {
          const chineseTeacher = this.teacherList.find(t => t.type === '中教')
          const foreignTeacher = this.teacherList.find(t => t.type === '外教')

          teacherInfo = {
            chineseTeacherId: chineseTeacher && chineseTeacher.teacherId ? chineseTeacher.teacherId : undefined,
            chineseTeacherMinutes: chineseTeacher && chineseTeacher.regularTime ? chineseTeacher.regularTime : 0,
            foreignTeacherId: foreignTeacher && foreignTeacher.teacherId ? foreignTeacher.teacherId : undefined,
            foreignTeacherMinutes: foreignTeacher && foreignTeacher.regularTime ? foreignTeacher.regularTime : 0,
            oralMinutes: foreignTeacher && foreignTeacher.oralTime ? foreignTeacher.oralTime : 0
          }
        }

        // 构建请求参数
        const params = {
          schedulingId: this.classData.schedulingId,
          studentAttendances,
          teacherInfo: teacherInfo || undefined
        }

        // 调用提交接口
        const response = await One2ManyAttendanceApi.recordSchedulingAttendance(params)

        this.$message.success('考勤成功')
        this.confirmDialogVisible = false
        this.$emit('update:visible', false)
        this.$emit('refresh')
      } catch (error) {
        this.$message.error(error || '考勤提交失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    },

    // 关闭抽屉
    handleClose() {
      if (this.isSubmitting) {
        return
      }
      // 重置老师列表数据
      this.resetTeacherList()
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

  // 考勤状态列固定样式，防止宽度抖动
  .attendance-status-column {
    width: 280px !important;
    min-width: 280px !important;
    max-width: 280px !important;
  }

  // 数字输入框文字居中
  .time-input .el-input__inner {
    text-align: center;
  }
}

.class-attendance-drawer {
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

    .teacher-simple {
      .info-item {
        margin-top: 16px;
      }
    }

    .teacher-list {
      margin-top: 16px;

      .teacher-header {
        font-size: 14px;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }

      .disabled-time {
        color: #999;
      }

      .time-input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .time-input {
          width: 80px;
        }

        .time-unit {
          color: #666;
          font-size: 12px;
        }

        // 置灰的输入框样式
        .disabled-input {
          .el-input__inner {
            background-color: #f5f7fa !important;
            color: #999 !important;
            cursor: not-allowed !important;
          }
        }
      }
    }
  }

  .attendance-section {
    margin-bottom: 24px;
  }

  .attendance-header {
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

  .attendance-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 32px; // 固定最小高度

    .action-btn {
      padding: 3px 10px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s;
      white-space: nowrap; // 防止文字换行
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

      &.leave:hover {
        color: #e6a23c;
        border-color: #f29d36;
      }

      &.leave.active {
        color: #e6a23c;
        border-color: #f29d36;
        background-color: rgba(254, 245, 230, 1);
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
      color: #ff5c5c;
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
::v-deep .confirm-attendance-dialog {
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

      &.normal {
        color: #409eff;
      }

      &.leave {
        color: #e6a23c;
      }

      &.skip {
        color: #ff5c5c;
      }
    }
  }
}
</style>
