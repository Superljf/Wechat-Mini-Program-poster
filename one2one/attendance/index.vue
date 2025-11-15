<template>
  <div class="one2one-attendance">
    <el-card>
      <div class="page-title">1对1考勤</div>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
        <el-form-item label="学管师" v-if="hasButtonRight('one2one.attendance.counselor')">
          <AsyncRemoteInput
            placeholder="请输入学管师姓名"
            dict="employee"
            :inputKey="'employeeName'"
            @handleSelect="selectGovern"
            class="input-common-width"
            size="small"
            :inputValue="searchForm.governName"
            v-model="searchForm.governId"
            ref="governInput"
            clearable
          ></AsyncRemoteInput>
        </el-form-item>
        <el-form-item label="校区" style="margin-left: 10px">
          <HiAsyncSelector
            :addAllItem="true"
            :filterable="false"
            :param="{ buId: userBaseInfo.buId, orgKind: userBaseInfo.orgKind, userId: userInfo.id }"
            placeholder="校区"
            v-model="searchForm.belongBranchId"
            dict-key="campuse"
            pageSize="100"
            size="small"
            clearable
          />
        </el-form-item>
        <el-form-item label="上课日期" style="margin-left: 10px">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            :default-time="['00:00:00', '23:59:59']"
            :picker-options="pickerOptions"
            size="small"
            class="input-common-width"
            :clearable="false"
            :unlink-panels="true"
            @change="onRangeChange"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="考勤状态" style="margin-left: 10px">
          <el-select
            clearable
            multiple
            v-model="searchForm.attendType"
            placeholder="请选择考勤状态"
            class="input-common-width"
            style="width:180px"
            size="small"
            collapse-tags
          >
            <el-option label="未考勤" value="28"></el-option>
            <el-option label="正常上课" value="21"></el-option>
            <el-option label="排课取消" value="23"></el-option>
            <el-option label="考勤作废" value="29"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="学员" style="margin-left: 10px">
          <el-input
            v-model="searchForm.studentName"
            placeholder="请输入学员姓名"
            class="input-common-width"
            size="small"
            style="width: 230px"
            clearable
          ></el-input>
        </el-form-item>

        <el-form-item label="老师" style="margin-left: 10px">
          <HiAsyncSelector
            v-model="searchForm.teacherId"
            dict-key="teacher"
            :defaultWord="searchForm.teacherName"
            :param="{ buId: userBaseInfo.buId, size: 100 }"
            style="margin-right: 8px"
            placeholder="请输入老师姓名"
            size="small"
            clearable
            @change="handleTeacherChange"
          >
            <template v-slot="slotProps">
              <span>{{ slotProps.label }}</span>
              <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
            </template>
          </HiAsyncSelector>
        </el-form-item>

        <el-form-item label="科目" style="margin-left: 10px">
          <HiDict collapse-tags placeholder="请选择科目" multiple clearable size="small" v-model="searchForm.subjectId" dict-key="subject" />
        </el-form-item>
        <el-form-item label="年级" style="margin-left: 10px">
          <HiDict
            size="small"
            clearable
            v-model="searchForm.gradeId"
            dict-key="grade_all"
            placeholder="请选择年级"
            class="input-common-width"
            style="width: 190px"
            multiple
            collapse-tags
          />
        </el-form-item>
        <el-form-item label="考勤单号" style="margin-left: 10px">
          <el-input
            clearable
            v-model.trim="searchForm.attendanceNo"
            placeholder="请输入考勤单号"
            class="input-common-width"
            style="width:180px"
            size="small"
          ></el-input>
        </el-form-item>
        <el-form-item label="报班单号" style="margin-left: 10px">
          <el-input
            clearable
            v-model.trim="searchForm.orderNo"
            placeholder="请输入报班单号"
            class="input-common-width"
            style="width:180px"
            size="small"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
          <el-button @click="handleReset" size="small">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="btns-wrap">
        <div class="btn-left">1对1考勤</div>
        <div class="btn-right" style="display: flex;align-items: center;gap:10px">
          <el-button type="primary" size="small" @click="handleBatchAttendance" :disabled="selectedRows.length === 0">批量考勤</el-button>
          <el-dropdown @command="handleBatchReschedule" trigger="click">
            <el-button type="primary" size="small" :disabled="selectedRows.length === 0"> 批量调课<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="period">按周期调课</el-dropdown-item>
              <el-dropdown-item command="calendar">按日历调课</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button type="danger" size="small" @click="handleBatchCancel" :disabled="selectedRows.length === 0">批量取消</el-button>
          <el-button
            style="margin-left: 0px"
            v-if="hasButtonRight('one2one.attendance.export')"
            type="primary"
            size="small"
            @click="handleExportDetail"
            :loading="exportLoading"
            >导出明细</el-button
          >
        </div>
      </div>

      <!-- 数据表格 -->
      <HiTable
        ref="multipleTable"
        refName="ref"
        :columns="columns"
        :data="tableData"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        row-key="encoding"
      />

      <!-- 分页 -->
      <div class="g-mt g-tar" v-if="tableData.length > 0">
        <hi-pagination :total="total" :current-page.sync="searchForm.currentPage" :page-size.sync="searchForm.pageSize" @change="handlePageChange">
        </hi-pagination>
      </div>

      <!-- 批量考勤抽屉 -->
      <BatchAttendance ref="batchAttendance" :visible.sync="showBatchAttendance" :selectedRows="selectedRows" @confirm="handleBatchAttendanceConfirm" />

      <!-- 考勤详情抽屉 -->
      <AttendanceDetail @refresh-data="getList" :visible.sync="showAttendanceDetail" :row-data="currentRowData" />

      <!-- 取消排课弹窗 -->
      <CancelSchedule
        :visible.sync="showCancelDialog"
        :is-batch="isBatchCancel"
        :count="selectedRows.length"
        :loading="cancelLoading"
        @confirm-cancel="handleCancelConfirm"
      />

      <!-- 调课抽屉 -->
      <SwitchScheduling
        :visible.sync="showSwitchScheduling"
        :is-calendar-schedule="switchSchedulingType === 'calendar'"
        :is-single-schedule="switchSchedulingType === 'single'"
        :student-id="
          (switchSchedulingType === 'single' && currentScheduleData && currentScheduleData.studentId) || (selectedRows[0] && selectedRows[0].studentId) || ''
        "
        :student-info="(switchSchedulingType === 'single' ? currentScheduleData : selectedRows[0]) || {}"
        :current-schedule-data="currentScheduleData || []"
        :selected-rows="selectedRows"
        :switch-scheduling-type="switchSchedulingType"
        @submit-success="handleScheduleSuccess"
      />
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import BatchAttendance from './BatchAttendance.vue'
import AttendanceDetail from './AttendanceDetail.vue'
import CancelSchedule from '../schedule/CancelSchedule.vue'
import studentManApi from '@/services/student-manage'
import columns from './index-columns'
import SwitchScheduling from './SwitchScheduling.vue'
import { saveBlobAsFile } from '@/utils'

// <!<AsyncRemoteInput
//             placeholder="请输入学员姓名/编码/手机号"
//             dict="student"
//             :inputKey="'studentName'"
//             @handleSelect="selectStudent"
//             class="input-common-width"
//             :inputValue="searchForm.studentName"
//             size="small"
//             style="width: 230px"
//             clearable
//             ref="studentInput"
//  ></AsyncRemoteInput>

export default {
  name: 'One2OneAttendance',
  components: {
    AsyncRemoteInput,
    BatchAttendance,
    AttendanceDetail,
    CancelSchedule,
    SwitchScheduling
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo', 'employeeInfo']),
    ...mapState('crm', ['gradeList']),
    columns() {
      return columns(this)
    }
  },
  data() {
    return {
      searchForm: {
        belongBranchId: this.userBaseInfo?.branchId,
        timeRange: [this.getCurrentDate(), this.getCurrentDate()],
        buId: this.userBaseInfo?.buId || 0,
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        studentId: '',
        studentInfo: '',
        counselorId: '',
        subjectId: [],
        attendType: ['28'],
        attendTypeTeacher: '',
        currentPage: 1,
        pageSize: 50,
        gradeId: [],
        governName: this.employeeInfo?.employeeName || '',
        studentInfoName: '',
        strStudent: '',
        orderNo: '' // 报班单号
      },
      // 用于跟踪日期选择状态
      selectData: '',
      pickerOptions: {
        onPick: ({ maxDate, minDate }) => {
          this.selectData = maxDate ? maxDate.getTime() : minDate ? minDate.getTime() : ''
          if (!maxDate || !minDate) {
            this.searchForm.timeRange = '' // 只选一个的时候，日期置空
          }
        },
        shortcuts: [
          {
            text: '今天',
            onClick(picker) {
              const today = new Date()
              picker.$emit('pick', [today, today])
            }
          },
          {
            text: '昨天',
            onClick(picker) {
              const yesterday = new Date()
              yesterday.setTime(yesterday.getTime() - 3600 * 1000 * 24)
              picker.$emit('pick', [yesterday, yesterday])
            }
          },
          {
            text: '本周',
            onClick(picker) {
              // 计算本周的完整日期范围（周日到周六）
              const now = new Date()
              const currentDay = now.getDay() // 0是周日，6是周六

              // 计算本周的第一天（周一）
              const firstDayOfWeek = new Date(now)
              firstDayOfWeek.setDate(now.getDate() - currentDay + 1)

              // 计算本周的最后一天（周日）
              const lastDayOfWeek = new Date(now)
              lastDayOfWeek.setDate(now.getDate() + (7 - currentDay))

              picker.$emit('pick', [firstDayOfWeek, lastDayOfWeek])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              // 计算本月的完整日期范围（1号到月底）
              const now = new Date()
              const currentYear = now.getFullYear()
              const currentMonth = now.getMonth()

              // 本月第一天
              const firstDayOfMonth = new Date(currentYear, currentMonth, 1)

              // 本月最后一天（下月第0天就是本月最后一天）
              const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)

              picker.$emit('pick', [firstDayOfMonth, lastDayOfMonth])
            }
          },
          {
            text: '上月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 1)
              start.setDate(1)
              end.setDate(0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近30天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
              picker.$emit('pick', [start, end])
            }
          }
        ]
        // disabledDate: time => {
        //   // 有选中学员或报班单号时，上课日期选项不限；学员或报班单号都为空时，上课日期限制半年
        //   const hasStudentOrOrderNo = this.searchForm.studentName || this.searchForm.orderNo

        //   if (!hasStudentOrOrderNo) {
        //     // 没有学员或报班单号时，限制半年
        //     if (this.selectData) {
        //       // 有选择状态时，限制为选中日期前后半年
        //       const curDate = new Date(this.selectData).getTime() // 转时间戳
        //       const limit = 183 * 24 * 3600 * 1000 // 限制半年（约183天）
        //       const maxDate = curDate + limit // 最晚可选日期 = 开始 + 半年
        //       const minDate = curDate - limit // 最早可选日期 = 开始 - 半年
        //       // 禁止选择大于半年后的日期和小于半年前的日期
        //       return time.getTime() > maxDate || time.getTime() < minDate
        //     } else {
        //       // 没有选开始时间时，限制为当前时间前后半年
        //       const now = new Date()
        //       const sixMonthsAgo = new Date()
        //       sixMonthsAgo.setMonth(now.getMonth() - 6)
        //       const sixMonthsAfter = new Date()
        //       sixMonthsAfter.setMonth(now.getMonth() + 6)
        //       return time.getTime() < sixMonthsAgo.getTime() || time.getTime() > sixMonthsAfter.getTime()
        //     }
        //   }

        //   // 有学员或报班单号时，不限制日期
        //   return false
        // }
      },
      loading: false,
      exportLoading: false,
      tableData: [],
      total: 0,
      selectedRows: [],
      showBatchAttendance: false,
      showAttendanceDetail: false,
      currentRowData: {},
      showCancelDialog: false,
      isBatchCancel: false,
      currentCancelRow: null,
      showSwitchScheduling: false,
      switchSchedulingType: '',
      currentScheduleData: null,
      cancelLoading: false
    }
  },
  watch: {
    // 监听学员姓名变化，强制更新日期选择器
    // 'searchForm.studentName'() {
    //   this.forceUpdateDatePicker()
    // },
    // // 监听报班单号变化，强制更新日期选择器
    // 'searchForm.orderNo'() {
    //   this.forceUpdateDatePicker()
    // }
  },
  mounted() {
    this.getList()
    // 添加页面刷新事件监听
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    // 移除页面刷新监听
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  created() {
    // 处理外部链接跳转时的参数初始化
    this.handleExternalLinkParams()

    // 从 sessionStorage 中获取搜索条件，如果有则使用缓存的条件
    // 但如果有外部链接参数，优先使用外部参数
    const hasExternalParams = this.$route.query.studentId && this.$route.query.studentName

    try {
      const cachedForm = JSON.parse(sessionStorage.getItem('one2one_attendance_search_form'))
      if (cachedForm && !hasExternalParams) {
        // 合并默认值和缓存的搜索条件
        this.searchForm = {
          ...this.searchForm,
          ...cachedForm
        }

        // 确保日期范围正确设置
        if (cachedForm.startDate && cachedForm.endDate) {
          this.searchForm.timeRange = cachedForm.timeRange
        }

        // 在nextTick中设置学生输入框的值，确保组件已经挂载
        // this.$nextTick(() => {
        //   if (this.$refs.studentInput) {
        //     this.$refs.studentInput.state = cachedForm.studentInfoName || ''
        //     // 如果有缓存的学生信息，设置选中状态
        //     if (cachedForm.studentInfoName) {
        //       this.$refs.studentInput.isSelected = true
        //     }
        //   }
        // })
      } else {
        this.searchForm.belongBranchId = this.userBaseInfo?.branchId
        this.searchForm.governName = this.employeeInfo?.employeeName || ''
        this.searchForm.governId = this.employeeInfo?.id || ''
        this.searchForm.counselorId = this.employeeInfo?.id || ''
      }
    } catch (error) {
      this.searchForm.belongBranchId = this.userBaseInfo?.branchId
      this.searchForm.governName = this.employeeInfo?.employeeName || ''
      this.searchForm.governId = this.employeeInfo?.id || ''
      this.searchForm.counselorId = this.employeeInfo?.id || ''
    }
  },
  methods: {
    // 处理外部链接跳转时的参数初始化
    handleExternalLinkParams() {
      const query = this.$route.query

      // 如果URL中包含studentId和studentName参数，则初始化学员搜索条件
      if (query.studentId && query.studentName) {
        this.searchForm.studentId = query.studentId
        this.searchForm.studentName = decodeURIComponent(query.studentName)
        this.searchForm.studentInfo = decodeURIComponent(query.studentName)
        this.searchForm.studentInfoName = decodeURIComponent(query.studentName)
        this.searchForm.strStudent = decodeURIComponent(query.studentName)
        // 如果有参数的话上课日期和考勤状态置空
        this.searchForm.timeRange = []
        this.searchForm.startDate = ''
        this.searchForm.endDate = ''
        this.searchForm.attendType = null
      }

      // 如果URL中包含orderNo参数，则初始化报班单号
      if (query.orderNo) {
        this.searchForm.orderNo = decodeURIComponent(query.orderNo)
      }
    },

    // 页面刷新或关闭时的处理函数
    handleBeforeUnload() {
      // 在页面刷新或关闭时清除缓存的筛选条件
      sessionStorage.removeItem('one2one_attendance_search_form')
    },
    getCurrentDate() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    // 获取列表数据
    async getList() {
      this.loading = true
      try {
        // 处理日期和时间范围
        if (this.searchForm.timeRange && this.searchForm.timeRange.length === 2) {
          this.searchForm.startDate = this.searchForm.timeRange[0]
          this.searchForm.endDate = this.searchForm.timeRange[1]
        }
        // 处理学员姓名
        this.searchForm.strStudent = this.searchForm.studentName || ''

        const params = {
          ...this.searchForm,
          buId: this.userBaseInfo?.buId || 0,
          orderNo: this.searchForm.orderNo || null // 添加报班单号参数
        }
        // 当没有学员或者报班单号时，限制半年区间 超出的时候进行提示
        if (!this.searchForm.studentName && !this.searchForm.orderNo) {
          const { startDate, endDate } = this.searchForm
          if (!startDate || !endDate) return

          const start = new Date(startDate)
          const end = new Date(endDate)

          // 在开始日期上加 6 个月
          const sixMonthsLater = new Date(start)
          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

          if (end > sixMonthsLater) {
            this.$message.warning('在没有选择任何学员或报班单号时，上课日期区间不能超过半年哦~')
            return
          }
        }

        const res = await studentManApi.getYdyAttendPage(params)
        this.tableData = res.list || []
        this.total = res.total || 0
      } catch (error) {
        this.$message.error('获取列表数据失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },
    // 查询
    handleSearch() {
      this.searchForm.currentPage = 1
      this.searchForm.strStudent = this.searchForm.studentName
      // this.searchForm.studentInfo = this.searchForm.studentName
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2one_attendance_search_form', JSON.stringify(this.searchForm))
      this.getList()
    },
    // 清空学管师
    // handleClear() {
    //   this.searchForm.governId = ''
    //   this.searchForm.counselorId = ''
    //   this.searchForm.governName = ''
    // },
    // 重置
    handleReset() {
      // 先手动清空学管师输入框
      if (this.$refs.governInput) {
        this.$refs.governInput.state = this.employeeInfo?.employeeName || ''
      }
      if (this.$refs.studentInput) {
        this.$refs.studentInput.state = ''
      }
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        ...this.searchForm,
        buId: this.userBaseInfo?.buId || 0,
        timeRange: [this.getCurrentDate(), this.getCurrentDate()],
        startDate: this.getCurrentDate(),
        endDate: this.getCurrentDate(),
        startTime: '',
        endTime: '',
        studentId: '',
        studentInfo: '',
        counselorId: this.employeeInfo?.id || '',
        attendType: ['28'],
        attendTypeTeacher: '',
        currentPage: 1,
        pageSize: 50,
        studentName: '',
        teacherId: '',
        teacherName: '',
        governId: this.employeeInfo?.id || '',
        subjectId: [],
        gradeId: [],
        attendanceNo: '',
        orderNo: '', // 报班单号
        governName: this.employeeInfo?.employeeName || '',
        belongBranchId: this.userBaseInfo?.branchId,
        studentInfoName: ''
      }

      // 重置日期选择状态
      this.selectData = ''

      // 清除缓存的查询条件
      sessionStorage.removeItem('one2one_attendance_search_form')

      this.$nextTick(() => {
        this.handleSearch()
      })
    },
    // 选择学员
    selectStudent(data) {
      this.searchForm.studentId = data.id || ''
      this.searchForm.studentInfo = data.name || ''
      this.searchForm.studentInfoName = data.studentName || ''
    },
    // 选择学管师
    selectGovern(data) {
      this.searchForm.governId = data.id || ''
      this.searchForm.counselorId = data.id || ''
      this.searchForm.governName = data.employeeName || ''
    },
    // 处理表格多选
    handleSelectionChange(rows) {
      this.selectedRows = rows
    },
    // 获取状态类型
    getStatusType(status) {
      const statusMap = {
        YDY_WKQ: 'warning', // 未考勤
        YDY_ZCSK: 'success', // 正常上课
        YDY_PKQX: 'info', // 排课取消
        YDY_KQZF: 'danger' // 考勤作废
      }
      return statusMap[status] || ''
    },
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        YDY_WKQ: '未考勤',
        YDY_ZCSK: '正常上课',
        YDY_PKQX: '排课取消',
        YDY_KQZF: '考勤作废'
      }
      return statusMap[status] || status
    },
    // 批量考勤
    handleBatchAttendance() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择需要考勤的记录')
        return
      }

      // 批量考勤仅能操作已过上课时间的未考勤课次
      const now = new Date().getTime()

      // 筛选未开始上课的课程
      const notStartedClasses = this.selectedRows.filter(row => {
        const classTime = new Date(`${row.courseDateStr} ${row.startTime}`).getTime()
        // 判断课程是否未开始（当前时间小于上课时间）
        return now < classTime
      })

      if (notStartedClasses.length > 0) {
        this.$message.warning('批量考勤仅能操作已过上课时间的未考勤课次哦~')
        return
      }

      // 所有选中的课程都已开始，可以进行批量考勤
      this.showBatchAttendance = true
    },
    // 验证是否同一学生、老师、科目和时长
    validateSameAttributes() {
      // 当选择行数小于1时返回true，允许继续操作
      if (this.selectedRows.length <= 1) return true

      const firstRow = this.selectedRows[0]

      // 验证所有选中行是否具有相同属性
      const isValid = this.selectedRows.every(
        row =>
          row.studentId === firstRow.studentId &&
          row.teacherId === firstRow.teacherId &&
          row.subjectId === firstRow.subjectId &&
          row.duration === firstRow.duration
      )

      // 如果验证不通过，显示提示信息
      if (!isValid) {
        this.$message.warning('批量调课仅能调整同一学生、同一老师、同一科目、同一上课时长课次哦~')
      }

      return isValid
    },

    // 验证课程时间
    validateCourseTime() {
      const now = new Date().getTime()
      const oneHour = 60 * 60 * 1000

      return !this.selectedRows.some(row => {
        const courseTime = new Date(`${row.courseDate} ${row.startTime}`).getTime()
        return courseTime <= now || courseTime - now < oneHour
      })
    },

    // 处理批量调课
    async handleBatchReschedule(command) {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择需要调课的记录')
        return
      }
      // 检查是否同一学生、老师、科目和时长
      if (!this.validateSameAttributes()) {
        return
      }

      // 检查是否未考勤
      const cannotRescheduleRows = this.selectedRows.filter(row => row.attendType !== 'YDY_WKQ')
      if (cannotRescheduleRows.length > 0) {
        this.$message.warning('选中的记录中包含已考勤的课程，无法进行调课操作')
        return
      }

      // 验证课程时间
      const now = new Date().getTime()
      const oneHour = 60 * 60 * 1000
      const invalidTimeRows = this.selectedRows.filter(row => {
        const courseDate = row.courseDate.toString()
        const formattedDate = `${courseDate.substring(0, 4)}-${courseDate.substring(4, 6)}-${courseDate.substring(6, 8)}`
        const courseTime = new Date(`${formattedDate} ${row.startTime}`).getTime()
        return courseTime <= now + oneHour
      })

      if (invalidTimeRows.length > 0) {
        this.$message.warning('包含已过上课时间或距上课时间不到1小时的课次，无法调课，请检查～')
        return
      }

      // 查询排课订单信息
      try {
        this.switchSchedulingType = command
        this.showSwitchScheduling = true
        this.currentScheduleData = this.selectedRows
      } catch (error) {
        this.$message.error('获取学生订单信息失败，请稍后重试')
      }
    },

    // 单个调课
    handleReschedule(row) {
      // 检查是否未考勤
      if (row.attendType !== 'YDY_WKQ') {
        this.$message.warning('该课程已考勤，无法进行调课操作')
        return
      }

      // 验证课程时间
      const now = new Date().getTime()
      const oneHour = 60 * 60 * 1000
      const courseDate = row.courseDate.toString()
      const formattedDate = `${courseDate.substring(0, 4)}-${courseDate.substring(4, 6)}-${courseDate.substring(6, 8)}`
      const courseTime = new Date(`${formattedDate} ${row.startTime}`).getTime()

      if (courseTime <= now + oneHour) {
        this.$message.warning('上课时间距当前时间小于一小时，无法调课哦~')
        return
      }

      // 查询排课订单信息
      try {
        this.currentScheduleData = [row]
        this.switchSchedulingType = 'single'
        this.showSwitchScheduling = true
      } catch (error) {
        this.$message.error('获取学生订单信息失败，请稍后重试')
      }
    },

    // 调课成功回调
    handleScheduleSuccess() {
      this.showSwitchScheduling = false
      this.currentScheduleData = null
      this.getList()
    },
    // 批量取消
    handleBatchCancel() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择需要取消的记录')
        return
      }

      // 检查是否所有选中的行都可以取消
      const cannotCancelRows = this.selectedRows.filter(row => row.attendType !== 'YDY_WKQ')
      if (cannotCancelRows.length > 0) {
        this.$message.warning('选中的记录中包含已考勤的课程，无法进行取消操作')
        return
      }

      this.isBatchCancel = true
      this.showCancelDialog = true
    },
    // 单个考勤
    handleAttendance(row) {
      this.selectedRows = [row]
      this.showBatchAttendance = true
      //点击单个考勤后将表格勾选数据清空
      this.$nextTick(() => {
        if (this.$refs.multipleTable) {
          this.$refs.multipleTable.$refs.ref.clearSelection()
        }
      })
    },
    // 单个取消
    handleCancel(row) {
      if (row.attendType !== 'YDY_WKQ') {
        this.$message.warning('该课程已考勤，无法进行取消操作')
        return
      }

      this.currentCancelRow = row
      this.isBatchCancel = false
      this.showCancelDialog = true
    },
    // 查看详情
    handleDetail(row) {
      this.currentRowData = row
      this.showAttendanceDetail = true
    },
    // 处理批量考勤确认
    async handleBatchAttendanceConfirm(scheduleList) {
      try {
        //正常上课 attendType:'YDY_ZCSK'
        //学生旷课 attendType:'YDY_XSKK'
        const newScheduleList = scheduleList.map(item => ({
          ...item,
          attendType: 'YDY_ZCSK',
          subAttendType: item.status === 'normal' ? 'YDY_ZCSK' : item.status === 'absent' ? 'YDY_XSKK' : ''
        }))
        await studentManApi.ydyBatchAttend(newScheduleList)
        this.$message.success('考勤成功')
        this.showBatchAttendance = false
        this.getList()
      } catch (error) {
        this.$message.error('考勤失败，请稍后重试')
      } finally {
        if (this.$refs.batchAttendance) {
          this.$refs.batchAttendance.isSubmitting = false
        }
      }
    },

    // 取消排课
    async handleCancelConfirm(reason) {
      this.cancelLoading = true
      try {
        if (this.isBatchCancel) {
          // 批量取消
          const params = this.selectedRows.map(row => ({
            ...row,
            attendanceNo: row.encoding,
            attendType: 'YDY_QX', // 排课取消状态
            subAttendType: reason, // 取消原因
            remark: '', // 备注可选
            buId: this.userBaseInfo?.buId,
            attendId: row.attendId
          }))
          await studentManApi.ydyBatchAttend(params)
          this.$message.success(`成功取消 ${this.selectedRows.length} 节课程`)
          this.selectedRows = [] // 清空选中
        } else {
          // 单个取消
          const params = [
            {
              ...this.currentCancelRow,
              attendanceNo: this.currentCancelRow.encoding,
              attendType: 'YDY_QX',
              subAttendType: reason,
              remark: '',
              buId: this.userBaseInfo?.buId,
              attendId: this.currentCancelRow.attendId
            }
          ]
          await studentManApi.ydyBatchAttend(params)

          this.$message.success('取消排课成功~')
        }
        // 关闭弹窗并刷新列表
        this.showCancelDialog = false
        this.currentCancelRow = null
        await this.getList()
      } catch (error) {
        if (error.includes('Classin')) {
          this.$message.success(`取消排课成功~`)
          this.showCancelDialog = false
          this.currentCancelRow = null
          await this.getList()
          setTimeout(() => {
            this.$message.warning(`${error}`)
          }, 1000)
        } else {
          this.$message.error('取消失败，请稍后重试')
        }
      } finally {
        this.cancelLoading = false
      }
    },
    // 处理老师选择变化
    handleTeacherChange(value, option) {
      if (value && option) {
        // 当选择老师时，缓存老师名称
        this.searchForm.teacherName = option.label || ''
      } else {
        // 当清空老师时，清空老师名称
        this.searchForm.teacherName = ''
      }
    },

    // 分页变化处理函数
    handlePageChange() {
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2one_attendance_search_form', JSON.stringify(this.searchForm))
      this.getList()
    },

    // 导出明细
    async handleExportDetail() {
      // 校验是否有选中学员或报班单号
      const hasStudentOrOrderNo = this.searchForm.studentName || this.searchForm.orderNo

      if (!hasStudentOrOrderNo) {
        this.$message.warning('仅支持选择学员或报班单号时导出明细哦~')
        return
      }

      try {
        this.exportLoading = true

        // 构建导出参数，使用当前搜索条件
        const params = {
          ...this.searchForm,
          buId: this.userBaseInfo?.buId || 0,
          orderNo: this.searchForm.orderNo || null,
          pageSize: this.total, // 导出全部数据
          strStudent: this.searchForm.studentName || '',
          currentPage: 1
        }

        // 调用导出接口
        const res = await studentManApi.exportYdyAttendDetail(params)

        saveBlobAsFile(res)

        this.$message.success('导出成功')
      } catch (error) {
        this.$message.error(error || '导出失败，请稍后重试')
      } finally {
        this.exportLoading = false
      }
    },

    // 当 range 改变时触发
    onRangeChange(value) {
      // 当选择完成时，清空 selectData 状态
      if (value && value.length === 2 && value[0] && value[1]) {
        this.selectData = ''
      }
    },

    // 强制更新日期选择器
    forceUpdateDatePicker() {
      // 通过重新设置 pickerOptions 来强制日期选择器重新计算 disabledDate
      this.$nextTick(() => {
        // 触发日期选择器重新渲染
        this.$forceUpdate()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-range-editor--small .el-range-separator) {
  width: 26px;
}

.one2one-attendance {
  .page-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .search-form {
    margin-bottom: 20px;
    .el-form-item {
      margin-bottom: 10px;
    }
  }

  .btns-wrap {
    display: flex;
    height: 32px;
    margin: 10px 0;
    align-items: center;

    .btn-left {
      font-size: 16px;
      color: #111;
      font-weight: bold;
    }

    .btn-right {
      margin-left: auto;
    }
  }

  .g-mt {
    margin-top: 20px;
  }

  .g-tar {
    text-align: right;
  }
}
</style>
