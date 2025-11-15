<template>
  <el-drawer title="课次详情" :visible.sync="visible" direction="rtl" size="600px" :before-close="handleClose" custom-class="class-detail-drawer">
    <div class="drawer-content" v-loading="loading">
      <!-- 课次信息 -->
      <div class="detail-section">
        <div class="section-title" style="margin-bottom: 16px;">课次信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">上课日期</span>
            <span class="value">{{ classDetail.classDate }}</span>
          </div>
          <div class="info-item">
            <span class="label">上课时间</span>
            <span class="value">{{ classDetail.classTime }}</span>
          </div>
          <div class="info-item">
            <span class="label">班级名称</span>
            <span class="value">{{ classDetail.className }}</span>
          </div>
          <div class="info-item">
            <span class="label">班主任</span>
            <span class="value">{{ classDetail.courseManagerName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">教师</span>
            <span class="value">{{ classDetail.teacherName }}</span>
          </div>
          <div class="info-item">
            <span class="label">外教</span>
            <span class="value">{{ classDetail.foreignTeacher || '-' }}</span>
          </div>
          <!-- <div class="info-item">
            <span class="label">外教时长</span>
            <span class="value">{{ classDetail.foreignTeacherDuration || '-' }}</span>
          </div> -->

          <!-- <div class="info-item">
              <span class="label">班级编码</span>
              <span class="value">{{ classDetail.classCode }}</span>
            </div> -->
          <!-- <div class="info-item">
            <span class="label">补课类型</span>
            <span class="value">{{ classDetail.makeupType || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">补课日期</span>
            <span class="value">{{ classDetail.makeupDate || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">备注</span>
            <span class="value">{{ classDetail.remark || '-' }}</span>
          </div> -->
        </div>
      </div>

      <!-- 课次学员 -->
      <div class="detail-section">
        <div class="section-header">
          <div class="section-title">课次学员</div>
          <!-- 只有在已排学员时才显示按钮 -->
        </div>

        <!-- 学员列表切换按钮组 -->
        <div class="student-type-selector">
          <div>
            <el-radio-group v-model="activeTab" size="small">
              <el-radio-button :label="'formal'">已排学员({{ formalStudents.length }})</el-radio-button>
              <el-radio-button :label="'trial'">试听学员({{ trialStudents.length }})</el-radio-button>
              <el-radio-button :label="'unscheduled'">未排学员({{ unscheduledStudents.length }})</el-radio-button>
            </el-radio-group>
          </div>
          <div class="section-actions" v-if="activeTab === 'formal'">
            <el-button size="small" v-if="hasButtonRight('one2many-add-temporary-student')" @click="handleAddTempStudent" :disabled="disabled">
              添加临时学员
            </el-button>
            <!-- <el-button size="small" v-if="!hideAttendanceButton" @click="handleCheckAttendance">查看考勤</el-button> -->
          </div>
        </div>

        <!-- 学员列表内容 -->
        <div class="student-content">
          <!-- 已排学员 -->
          <div v-if="activeTab === 'formal'" class="student-table">
            <el-table :data="formalStudents" style="width: 100%" border :max-height="tableMaxHeight">
              <el-table-column label="序号" width="50" align="center">
                <template slot-scope="scope">
                  {{ scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column prop="studentName" label="学生" min-width="130" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.temp === 1" type="info" size="mini" class="temp-student-tag">临</el-tag>
                  <span>{{ scope.row.studentName }}</span>
                  <div v-if="scope.row.studentEnglishName">({{ scope.row.studentEnglishName }})</div>
                </template>
              </el-table-column>

              <el-table-column prop="attendanceStatus" label="考勤状态" min-width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getAttendanceStatusType(scope.row.attendanceStatus)" size="small">
                    {{ scope.row.attendTypeName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="120" align="center" show-overflow-tooltip />

              <el-table-column prop="makeupType" label="补课类型" min-width="80" align="center" />
              <el-table-column prop="makeupDate" label="补课日期" min-width="100" />
              <el-table-column prop="attendanceDate" label="考勤日期" min-width="100" align="center" />
            </el-table>
          </div>

          <!-- 试听学员 -->
          <div v-if="activeTab === 'trial'" class="student-table">
            <el-table :data="trialStudents" style="width: 100%" border :max-height="tableMaxHeight">
              <el-table-column label="序号" width="50" align="center">
                <template slot-scope="scope">
                  {{ scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column prop="studentName" label="学生" min-width="130" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.studentName }}</span>
                  <div v-if="scope.row.studentEnglishName">({{ scope.row.studentEnglishName }})</div>
                </template>
              </el-table-column>
              <el-table-column prop="attendanceStatus" label="考勤状态" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.attendTypeName === '正常上课' ? 'success' : 'info'" size="small">
                    {{ scope.row.attendTypeName }}
                  </el-tag>
                </template>
              </el-table-column>
              <!-- <el-table-column prop="attendanceDate" label="考勤日期" width="120" align="center" /> -->
              <el-table-column prop="counselorName" label="咨询师" />
            </el-table>
          </div>

          <!-- 未排学员 -->
          <div v-if="activeTab === 'unscheduled'" class="student-table">
            <el-table :data="unscheduledStudents" style="width: 100%" border :max-height="tableMaxHeight">
              <el-table-column label="序号" width="50" align="center">
                <template slot-scope="scope">
                  {{ scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column prop="studentName" label="学生" min-width="130" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.studentName }}</span>
                  <div v-if="scope.row.studentEnglishName">({{ scope.row.studentEnglishName }})</div>
                </template>
              </el-table-column>
              <el-table-column prop="classStudentStatus" label="学员状态" width="80" align="center">
                <template slot-scope="scope">
                  <el-tag :type="getClassStudentStatusType(scope.row.classStudentStatus)" size="small">
                    {{ getClassStudentStatusText(scope.row.classStudentStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="courseSchedule" label="剩余可排小时数" width="120" align="center" />

              <el-table-column prop="remainingHours" label="剩余可用小时数" width="120" align="center" />
              <el-table-column label="操作" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="small"
                    v-if="hasButtonRight('one2many-scheduled-schedule')"
                    @click="handleScheduleStudent(scope.row)"
                    :disabled="disabled"
                  >
                    排课
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加临时学员弹窗 -->
    <el-dialog title="添加临时学员" :visible.sync="tempStudentDialogVisible" width="500px" append-to-body custom-class="temp-student-dialog">
      <div class="temp-student-form">
        <el-form :model="tempStudentForm" label-width="70px">
          <el-form-item label="选择学员">
            <AsyncRemoteInput
              clearable
              :inputValue="tempStudentForm.studentName"
              placeholder="学员姓名/编码/手机号"
              :inputKey="'studentName'"
              dict="student"
              @handleSelect="selectTempStudent"
              style="width: 80%"
              size="small"
            />
          </el-form-item>
        </el-form>
        <div class="tip-text">
          <i class="el-icon-info"></i>
          此处为添加临时学员，如为正式跟班学员，请添加至班级学员列表
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="tempStudentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAddTempStudent">确定添加</el-button>
      </div>
    </el-dialog>

    <!-- 排课确认弹窗 -->
    <el-dialog title="未排学员排课" :visible.sync="scheduleConfirmDialogVisible" width="400px" append-to-body custom-class="schedule-confirm-dialog">
      <div class="confirm-content">
        <p>
          请确认是否为 <span style="color: #4f8bed;">{{ currentScheduleStudent.studentName }}</span> 添加排课？
        </p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="scheduleConfirmDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="handleConfirmSchedule" :loading="scheduleConfirmLoading">确定排课</el-button>
      </div>
    </el-dialog>
  </el-drawer>
</template>

<script>
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import One2ManyApi from '@/services/tacenter/one2many'
import dayjs from 'dayjs'

export default {
  name: 'ClassDetailDrawer',
  components: {
    AsyncRemoteInput
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
    },
    // 课次ID，用于获取课次详情
    schedulingId: {
      type: [String, Number],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // 是否隐藏查看考勤按钮（考勤模块使用时隐藏）
    hideAttendanceButton: {
      type: Boolean,
      default: false
    }
  },
  computed: {},
  data() {
    return {
      loading: false,
      activeTab: 'formal',
      tempStudentDialogVisible: false,
      tempStudentForm: {
        studentId: '',
        studentName: ''
      },
      classDetail: {},
      formalStudents: [],
      trialStudents: [],
      unscheduledStudents: [],

      // 排课确认弹窗
      scheduleConfirmDialogVisible: false,
      currentScheduleStudent: {},
      scheduleConfirmLoading: false,

      // 表格高度相关
      tableMaxHeight: 400,
      resizeTimer: null
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.checkAndLoadDetail()
        // 抽屉打开后计算表格高度
        this.$nextTick(() => {
          this.setTableHeight()
        })
      }
    },
    schedulingId: {
      handler(newVal) {
        if (newVal) {
          this.checkAndLoadDetail()
        }
      },
      immediate: false
    },
    activeTab() {
      // 切换标签时重新计算表格高度
      this.$nextTick(() => {
        this.setTableHeight()
      })
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

    // 计算表格高度（保持原方法名兼容性）
    calculateTableHeight() {
      this.setTableHeight()
    },

    // 处理窗口大小变化
    handleResize() {
      // 使用防抖避免频繁计算
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.setTableHeight()
      }, 150)
    },
    // 检查条件并加载详情（避免重复调用）
    checkAndLoadDetail() {
      if (this.visible && this.schedulingId && !this.loading) {
        this.loadClassDetail()
      }
    },

    // 加载课次详情
    async loadClassDetail() {
      if (!this.schedulingId) {
        return
      }

      this.loading = true
      try {
        const response = await One2ManyApi.getScheduleClassDetail(this.schedulingId)
        this.processClassDetail(response)
        // 数据加载完成后重新计算表格高度
        this.$nextTick(() => {
          this.setTableHeight()
        })
      } catch (error) {
        const errorMessage = error?.message || error?.data?.message || error || '加载课次详情失败'
        this.$message.error(errorMessage)
      } finally {
        this.loading = false
      }
    },

    // 处理课次详情数据
    processClassDetail(response) {
      const data = response || {}

      // 处理基本课次信息
      this.classDetail = {
        classDate: data.courseDateStr || '',
        classTime: data.startTime && data.endTime ? `${data.startTime}-${data.endTime}` : '',
        teacherName: data.teacherName || '',
        courseManagerName: data.courseManagerName || '',
        foreignTeacher: data.foreignTeacherName || '',
        foreignTeacherDuration: data.foreignTeacherDuration || '', // 接口中没有这个字段，可能需要计算
        className: data.courseName || '',
        classCode: data.courseNo || '',
        courseDate: data.courseDate || ''
      }

      // 处理已排学员（正式学员）
      this.formalStudents = (data.yddStudentAttendanceVoList || []).map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        studentCode: student.studentCode,
        attendanceStatus: this.mapAttendanceStatus(student.attendType),
        attendanceDate: student.attendDateStr || '',
        makeupType: student.makeupAttendTypeName || '',
        makeupDate: student.makeupDate || '',
        remark: student.remark || '',
        // 原始数据保存，用于后续操作
        originalData: student,
        attendTypeName: student.attendTypeName || '',
        temp: student.temp,
        studentEnglishName: student.studentEnglishName || ''
      }))

      // 处理试听学员
      this.trialStudents = (data.yddListeningStudentVoList || []).map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        englishName: student.englishName || '', // 英文名
        studentEnglishName: student.studentEnglishName || student.englishName || '', // 英文名（与已排学员保持一致）
        studentCode: student.studentEncodeing,
        attendanceStatus: this.mapTrialAttendanceStatus(student.listenType),
        attendanceDate: student.attendDate || '', // 试听学员的考勤日期字段不明确
        counselorName: student.counselorName || '', // 接口中没有咨询师字段
        // 原始数据保存
        originalData: student,
        attendTypeName: student.listenedName || ''
      }))

      // 处理未排学员
      this.unscheduledStudents = (data.yddStudentNoAttendanceVoList || []).map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        englishName: student.englishName || '', // 英文名
        studentEnglishName: student.studentEnglishName || student.englishName || '', // 英文名（与已排学员保持一致）
        studentCode: student.studentCode,
        classStudentStatus: student.studentStatusName || '',
        remainingHours: student.courseSurplus || 0,
        // 原始数据保存
        originalData: student,
        attendTypeName: student.attendTypeName || '',
        courseSchedule: student.courseSchedule || 0
      }))
    },

    // 映射考勤状态到前端显示
    mapAttendanceStatus(attendType) {
      const statusMap = {
        YDY_ZCSK: 'attended', // 正常上课
        YDY_WKQ: 'absent', // 未考勤
        YDY_QJ: 'pending', // 请假
        YDY_QX: 'cancelled' // 取消
      }
      return statusMap[attendType] || 'unknown'
    },

    // 映射试听学员考勤状态
    mapTrialAttendanceStatus(attendType) {
      // 试听学员的状态映射可能不同，根据实际情况调整
      return this.mapAttendanceStatus(attendType)
    },

    // 获取考勤状态类型
    getAttendanceStatusType(status) {
      const statusMap = {
        attended: 'success',
        pending: 'warning',
        absent: 'danger',
        cancelled: 'info',
        unknown: 'info'
      }
      return statusMap[status] || 'info'
    },

    // 获取学员状态类型
    getStudentStatusType(status) {
      const statusMap = {
        active: 'primary',
        new: 'success',
        suspended: 'warning'
      }
      return statusMap[status] || ''
    },

    // 获取学员状态文本
    getStudentStatusText(status) {
      const statusMap = {
        active: '在班',
        new: '新生',
        suspended: '停课'
      }
      return statusMap[status] || status
    },

    // 获取班级学员状态类型
    getClassStudentStatusType(status) {
      const statusMap = {
        新生: 'primary',
        在读: 'success',
        停课: 'warning'
      }
      return statusMap[status] || 'info'
    },

    // 获取班级学员状态文本
    getClassStudentStatusText(status) {
      return status || '-'
    },

    // 查看考勤
    handleCheckAttendance() {
      // 跳转到v5-1对多考勤对应班级详情，并定位对应上课日期
      const classId = this.$route.query.id || ''
      const attendanceUrl = `${process.env.VUE_APP_ERP_URL}#/orders/attendanceMgr/attendanceMgrYddStudents/${classId}?date=${this.classDetail.courseDate}`
      window.open(attendanceUrl, '_blank')
    },

    // 添加临时学员
    handleAddTempStudent() {
      this.tempStudentDialogVisible = true
      this.tempStudentForm = {
        studentId: '',
        studentName: ''
      }
    },

    // 选择临时学员
    selectTempStudent(data) {
      this.tempStudentForm.studentId = data.id || ''
      this.tempStudentForm.studentName = data.studentName || ''
    },

    // 确认添加临时学员
    async handleConfirmAddTempStudent() {
      if (!this.tempStudentForm.studentId) {
        this.$message.warning('请选择学员')
        return
      }

      try {
        // 调用排课接口添加学员到当前课次
        const params = {
          schedulingId: this.schedulingId,
          studentId: this.tempStudentForm.studentId
        }

        await One2ManyApi.addScheduleCourseStudent(params)
        this.$message.success('添加临时学员成功')
        this.tempStudentDialogVisible = false

        // 刷新课次详情
        await this.loadClassDetail()
      } catch (error) {
        this.$message.error(error || '添加临时学员失败')
      }
    },

    // 检查学员是否已在当前课次
    checkStudentInClass(studentId) {
      // 检查已排学员
      const existsInFormal = this.formalStudents.some(student => student.studentId == studentId)
      // 检查试听学员
      const existsInTrial = this.trialStudents.some(student => student.studentId == studentId)
      return existsInFormal || existsInTrial
    },

    // 排课学员
    handleScheduleStudent(row) {
      this.currentScheduleStudent = row
      this.scheduleConfirmDialogVisible = true
    },

    // 确认排课
    async handleConfirmSchedule() {
      this.scheduleConfirmLoading = true
      try {
        const params = {
          schedulingId: this.schedulingId,
          studentId: this.currentScheduleStudent.studentId
        }

        await One2ManyApi.addScheduleCourseStudent(params)
        this.$message.success('排课成功')
        this.scheduleConfirmDialogVisible = false
        // 刷新课次详情
        await this.loadClassDetail()
      } catch (error) {
        this.$message.error(error || '排课失败')
        console.error(error)
      } finally {
        this.scheduleConfirmLoading = false
      }
    },

    // 关闭抽屉
    handleClose() {
      this.$emit('update:visible', false)
      this.activeTab = 'formal'
      this.classDetail = {}
      this.formalStudents = []
      this.trialStudents = []
      this.unscheduledStudents = []
      // 通知父组件刷新课次列表数据
      this.$emit('refresh')
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

  .el-drawer__body {
    overflow-y: auto !important;
  }
}

.class-detail-drawer {
  .drawer-content {
    padding: 20px;
    padding-bottom: 0px;
  }

  .detail-section {
    margin-bottom: 24px;

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

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .section-actions {
        .el-button {
          margin-left: 8px;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 16px;

      .label {
        color: #666;
        width: 70px;
        text-align: right;
        display: inline-block;
      }

      .value {
        color: #333;
      }
    }
  }

  .student-type-selector {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
  }

  .student-content {
    .student-table {
      width: 100%;
    }
  }

  .confirm-content {
    text-align: center;
    padding: 20px 0;

    p {
      margin: 0;
      font-size: 14px;
      color: #666;

      strong {
        color: #409eff;
        font-weight: 500;
      }
    }
  }
}

// 排课确认弹窗样式
::v-deep .el-dialog.schedule-confirm-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.schedule-confirm-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.schedule-confirm-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.schedule-confirm-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

::v-deep .el-dialog.schedule-confirm-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
}

.temp-student-form {
  .tip-text {
    margin-top: 16px;
    padding: 8px;
    border-radius: 4px;
    background-color: #fdf6ec;
    color: #e6a23c;
    font-size: 13px;

    .el-icon-info {
      margin-right: 4px;
    }
  }
}

::v-deep {
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

  // 临时学员标签样式
  .temp-student-tag {
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
}

// 添加临时学员弹窗样式，参考detail.vue的弹窗样式
::v-deep .el-dialog.temp-student-dialog {
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
    color: #666;
    line-height: 1.5;
  }

  .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
    border-top: none !important;
    padding: 16px 20px;
    gap: 12px;

    .el-button {
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 4px;
    }
  }
}
</style>
