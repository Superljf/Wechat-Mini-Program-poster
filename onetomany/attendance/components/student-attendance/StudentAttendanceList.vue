<template>
  <div class="student-attendance-list">
    <!-- 搜索表单 -->
    <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
      <el-form-item>
        <el-select v-model="searchForm.belongBranchId" :filterable="true" :remote="false" placeholder="请选择校区" size="small" style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="item in teamBranchList" :key="item.id" :label="item.orgName" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          :default-time="['00:00:00', '23:59:59']"
          :picker-options="pickerOptions"
          size="small"
          class="input-common-width"
          :clearable="true"
          :unlink-panels="true"
          @change="onRangeChange"
        ></el-date-picker>
      </el-form-item>

      <el-form-item>
        <el-input v-model="searchForm.className" placeholder="请输入班级名称/简称/编码" size="small" style="width: 200px" clearable></el-input>
      </el-form-item>

      <el-form-item>
        <HiAsyncSelector
          v-model="searchForm.teacherId"
          dict-key="teacher"
          :defaultWord="searchForm.teacherName"
          :param="{ buId: userBaseInfo.buId, size: 100 }"
          placeholder="请输入老师姓名/编码"
          size="small"
          clearable
        >
          <template v-slot="slotProps">
            <span>{{ slotProps.label }}</span>
            <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
          </template>
        </HiAsyncSelector>
      </el-form-item>

      <el-form-item>
        <HiAsyncSelector
          v-model="searchForm.courseManagerId"
          dict-key="employee"
          :defaultWord="searchForm.courseManagerName"
          placeholder="请输入班主任姓名/编码"
          size="small"
          clearable
        >
          <template v-slot="slotProps">
            <span>{{ slotProps.label }}</span>
            <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
          </template>
        </HiAsyncSelector>
      </el-form-item>

      <el-form-item>
        <HiDict v-model="searchForm.subjectId" collapse-tags dict-key="subject" placeholder="请输入科目" size="small" multiple clearable />
      </el-form-item>

      <el-form-item>
        <el-select v-model="searchForm.attendanceStatus" placeholder="请选择考勤状态" size="small" multiple clearable collapse-tags>
          <el-option label="未考勤" :value="28"></el-option>
          <el-option label="正常上课" :value="21"></el-option>
          <el-option label="请假" :value="25"></el-option>
          <el-option label="置空" :value="20"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-input v-model="searchForm.orderNo" placeholder="请输入报班单号" size="small" style="width: 200px" clearable></el-input>
      </el-form-item>

      <div style="display: inline-flex; align-items: flex-start;">
        <span class="required-star">*</span>
        <el-form-item prop="studentName" :rules="[{ required: true, message: '请选择学员', trigger: 'blur' }]" class="required">
          <AsyncRemoteInput
            clearable
            :inputValue="searchForm.studentName"
            placeholder="学员姓名/编码/手机号"
            :inputKey="'studentName'"
            dict="student"
            ref="studentSearchField"
            @handleSelect="selectStudent"
            @input="handleStudentNameInput"
            style="width: 200px"
            size="small"
          />
        </el-form-item>
      </div>

      <el-form-item>
        <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
        <el-button @click="handleReset" size="small">重置</el-button>

        <!-- 批量操作 -->
        <el-dropdown
          v-if="hasButtonRight('one2many-BatchNull') || hasButtonRight('one2many-BatchSchedule')"
          @command="handleBatchCommand"
          trigger="hover"
          :disabled="selectedRows.length === 0"
          style="margin-left: 10px;"
        >
          <el-button size="small" :disabled="selectedRows.length === 0"> 批量操作<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item v-if="hasButtonRight('one2many-BatchNull')" command="batchEmpty">批量置空</el-dropdown-item>
            <!-- <el-dropdown-item command="batchAttendance">批量考勤</el-dropdown-item> -->
            <el-dropdown-item command="batchCancel" v-if="hasButtonRight('one2many-BatchSchedule')">批量取消排课</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <!-- <span class="selected-count" v-if="selectedRows.length > 0" style="margin-left: 10px; color: #666; font-size: 14px;">
          已选择 {{ selectedRows.length }} 条记录
        </span> -->

        <el-button size="small" type="primary" @click="handleCustomColumn" style="margin-left: 10px;">自定义列设置</el-button>
      </el-form-item>
    </el-form>
    <!-- 数据表格 -->
    <VxeTableCustom
      table-id="one2many-student-attendance-table"
      stripe
      :columns="columns"
      :data="tableData"
      v-loading="loading"
      :max-height="tableMaxHeight"
      ref="vxeTable"
      @selection-change="handleSelectionChange"
    />

    <!-- 分页 -->
    <div class="g-mt g-tar" v-if="tableData.length > 0">
      <hi-pagination :total="total" :current-page.sync="searchForm.currentPage" :page-size.sync="searchForm.pageSize" @change="handlePageChange" />
    </div>

    <!-- 批量考勤抽屉 -->
    <ClassAttendanceDrawer :visible.sync="showBatchAttendanceDrawer" :class-data="batchClassData" source="student" @refresh="handleBatchAttendanceConfirm" />

    <!-- 考勤置空弹窗（支持批量和单独操作） -->
    <AttendanceEmptyDialog
      :visible.sync="showEmptyDialog"
      :student-data="currentStudentData"
      :selected-count="batchEmptyCount"
      :is-batch="isBatchEmpty"
      @confirm="handleEmptyConfirm"
    />

    <!-- 取消排课弹窗（支持批量和单独操作） -->
    <CancelScheduleDialog
      :visible.sync="showCancelDialog"
      :student-data="currentStudentData"
      :selected-count="batchCancelCount"
      :is-batch="isBatchCancel"
      @confirm="handleCancelConfirm"
    />

    <!-- 课次学员考勤详情抽屉 -->
    <StudentAttendanceDetailDrawer :visible.sync="showDetailDrawer" :student-data="currentStudentData" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { createTableHeightCalculator } from '@/utils'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import ClassAttendanceDrawer from '../class-attendance/ClassAttendanceDrawer.vue'
import AttendanceEmptyDialog from './AttendanceEmptyDialog.vue'
import CancelScheduleDialog from './CancelScheduleDialog.vue'
import StudentAttendanceDetailDrawer from './StudentAttendanceDetailDrawer.vue'
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'
import { CommonApi } from '@api'
import dayjs from 'dayjs'

export default {
  name: 'StudentAttendanceList',
  components: {
    VxeTableCustom,
    AsyncRemoteInput,
    ClassAttendanceDrawer,
    AttendanceEmptyDialog,
    CancelScheduleDialog,
    StudentAttendanceDetailDrawer
  },
  props: {
    teamBranchList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo'])
  },

  watch: {
    // 监听用户信息首次加载，设置默认校区
    userBaseInfo: {
      handler(newVal) {
        if (newVal && newVal.branchId && !this.searchForm.belongBranchId) {
          this.searchForm.belongBranchId = newVal.branchId
        }
      },
      immediate: true
    }
  },
  data() {
    return {
      // 缓存键名
      searchForm: {
        belongBranchId: '',
        timeRange: '',
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        attendanceStatus: [], // 默认选中未考勤、置空
        orderNo: '', // 报班单号
        studentName: '',
        studentId: '', // 学员ID
        currentPage: 1,
        pageSize: 50
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
              const now = new Date()
              const currentDay = now.getDay()
              const firstDayOfWeek = new Date(now)
              firstDayOfWeek.setDate(now.getDate() - currentDay + 1)
              const lastDayOfWeek = new Date(now)
              lastDayOfWeek.setDate(now.getDate() + (7 - currentDay))
              picker.$emit('pick', [firstDayOfWeek, lastDayOfWeek])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const now = new Date()
              const currentYear = now.getFullYear()
              const currentMonth = now.getMonth()
              const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
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
        // 暂时禁用未来日期选择
        // disabledDate: time => {
        //   if (this.selectData) {
        //     const curDate = this.selectData
        //     const six = 183 * 24 * 3600 * 1000 // 6个月（约183天）
        //     const sixMonthsAfter = curDate + six // 开始时间+6个月
        //     return time.getTime() > sixMonthsAfter
        //   }
        //   return false
        // }
      },
      loading: false,
      tableData: [],
      total: 0,
      selectedRows: [],
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      showBatchAttendanceDrawer: false,
      showEmptyDialog: false,
      showCancelDialog: false,
      showDetailDrawer: false,
      currentStudentData: {},
      // 批量操作相关
      isBatchEmpty: false,
      isBatchCancel: false,
      batchEmptyCount: 0,
      batchCancelCount: 0,
      batchClassData: {},
      // 表格列配置
      columns: [
        {
          type: 'selection',
          width: 55,
          fixed: 'left'
        },
        {
          prop: 'className',
          label: '班级名称',
          width: 180,
          fixed: 'left',
          render: (h, { row }) => {
            return h(
              'el-button',
              {
                props: { type: 'text', size: 'small' },
                on: { click: () => this.handleClassNameClick(row) }
              },
              row.className
            )
          }
        },
        {
          prop: 'classCode',
          label: '班级编码',
          width: 160
        },

        {
          prop: 'classShortName',
          label: '班级简称',
          width: 80
        },
        {
          prop: 'classDate',
          label: '上课日期',
          render: (h, { row }) => {
            return h('span', row.classDate + (row.weekday ? '(' + row.weekday + ')' : ''))
          },
          width: 120
        },
        {
          prop: 'classTime',
          label: '上课时间',
          width: 120
        },
        {
          prop: 'studentName',
          label: '学员',
          width: 120,
          render: (h, { row }) => {
            return h(
              'el-button',
              {
                props: { type: 'text', size: 'small' },
                on: { click: () => this.handleStudentNameClick(row) }
              },
              row.studentName
            )
          }
        },
        {
          prop: 'subjectName',
          label: '科目',
          width: 80
        },
        {
          prop: 'teacherName',
          label: '老师',
          width: 80
        },
        {
          prop: 'courseManagerName',
          label: '班主任',
          width: 80
        },
        {
          prop: 'branchName',
          label: '校区',
          width: 100
        },
        {
          prop: 'attendDate',
          label: '考勤日期',
          width: 100,
          render: (h, { row }) => {
            return h('span', row.attendDate ? dayjs(row.attendDate).format('YYYY-MM-DD') : '')
          }
        },
        {
          prop: 'attendanceRemark',
          label: '考勤备注',
          width: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'orderNo',
          label: '报班单号',
          width: 120,
          showOverflowTooltip: true
        },
        {
          prop: 'attendanceStatus',
          label: '考勤状态',
          width: 90,
          align: 'center',
          fixed: 'right',
          render: (h, { row }) => {
            const statusMap = {
              28: { text: '未考勤', type: 'warning' },
              21: { text: '正常上课', type: 'success' },
              25: { text: '请假', type: 'info' },
              20: { text: '置空', type: 'danger' }
            }
            const status = statusMap[row.attendanceStatus] || { text: row.attendanceStatus, type: '' }

            return h(
              'el-tag',
              {
                props: {
                  type: status.type,
                  size: 'small'
                }
              },
              row.attendTypeName
            )
          }
        },
        {
          label: '操作',
          width: 160,
          fixed: 'right',
          render: (h, { row }) => {
            const buttons = []

            // 详情按钮
            buttons.push(
              h(
                'el-button',
                {
                  props: { type: 'text', size: 'small' },
                  on: { click: () => this.handleDetail(row) }
                },
                '详情'
              )
            )

            // 置空按钮 - 仅正常上课、请假状态显示
            if ((row.attendanceStatus === 21 || row.attendanceStatus === 25) && this.hasButtonRight('one2many-BatchNull')) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleEmpty(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '置空'
                )
              )
            }

            // 考勤按钮 - 仅未考勤、置空状态显示
            if (row.attendanceStatus === 28 || row.attendanceStatus === 20) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleAttendance(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '考勤'
                )
              )
            }

            // 取消排课按钮 - 仅非正常上课状态显示
            if (row.attendanceStatus !== 21 && this.hasButtonRight('one2many-BatchSchedule')) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleCancel(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '取消排课'
                )
              )
            }

            return h('div', buttons)
          }
        }
      ]
    }
  },
  created() {
    // 获取校区列表
    // this.getTeamBranchList()

    // 从 sessionStorage 中获取搜索条件，如果有则使用缓存的条件
    try {
      const cachedForm = JSON.parse(sessionStorage.getItem('one2many_student_attendance_search_form'))
      if (cachedForm) {
        // 合并默认值和缓存的搜索条件
        this.searchForm = {
          ...this.searchForm,
          ...cachedForm,
          className: ''
        }
      } else {
        // 如果没有缓存，使用默认值
        this.initializeDefaultValues()
      }
    } catch (error) {
      // 如果解析缓存失败，使用默认值
      this.initializeDefaultValues()
    }
  },
  mounted() {
    this.initComponent()
    // 添加页面刷新事件监听
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  activated() {
    // 组件激活时重新加载缓存（适用于 keep-alive）
    // this.loadStudentFromCache()
  },
  beforeDestroy() {
    if (this.tableHeightCalculator) {
      this.tableHeightCalculator.stopListening()
      this.tableHeightCalculator = null
    }
    // 移除页面刷新监听
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  methods: {
    // 获取校区列表
    async getTeamBranchList() {
      try {
        const res = await CommonApi.getTeamBranchList({
          buId: this.userBaseInfo.buId
        })
        this.teamBranchList = res.data || []
      } catch (error) {
        console.error('获取校区列表失败:', error)
      }
    },

    // 页面刷新或关闭时的处理函数
    handleBeforeUnload() {
      // 在页面刷新或关闭时清除缓存的筛选条件（但保留学员缓存）
      sessionStorage.removeItem('one2many_student_attendance_search_form')
    },

    // 初始化默认值
    initializeDefaultValues() {
      this.searchForm.belongBranchId = this.userBaseInfo?.branchId || ''
    },

    // 组件初始化
    initComponent() {
      this.initTableHeightCalculator()
      // this.loadStudentFromCache() // 从缓存加载学员信息
      // 不自动加载数据，因为学员是必填的
    },

    // 保存学员信息到缓存
    // saveStudentToCache() {
    //   if (this.searchForm.studentId && this.searchForm.studentName) {
    //     const studentData = {
    //       studentId: this.searchForm.studentId,
    //       studentName: this.searchForm.studentName
    //     }
    //     try {
    //       sessionStorage.setItem(this.STUDENT_CACHE_KEY, JSON.stringify(studentData))
    //     } catch (error) {
    //       console.warn('保存学员缓存失败:', error)
    //     }
    //   }
    // },

    // 从缓存加载学员信息
    loadStudentFromCache() {
      try {
        const cachedData = sessionStorage.getItem(this.STUDENT_CACHE_KEY)
        if (cachedData) {
          const studentData = JSON.parse(cachedData)
          // 检查缓存是否过期（24小时）
          if (studentData.studentId && studentData.studentName) {
            this.searchForm.studentId = studentData.studentId
            this.searchForm.studentName = studentData.studentName
            this.loadData()

            // 清除验证错误
            this.$nextTick(() => {
              this.$refs.searchForm && this.$refs.searchForm.clearValidate('studentName')
            })
          }
        }
      } catch (error) {
        this.clearStudentCache()
      }
    },

    // 清除学员缓存
    clearStudentCache() {
      try {
        sessionStorage.removeItem(this.STUDENT_CACHE_KEY)
      } catch (error) {
        console.warn('清除学员缓存失败:', error)
      }
    },

    getCurrentDate() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // 初始化表格高度计算器
    initTableHeightCalculator() {
      // 避免重复初始化
      if (this.tableHeightCalculator) {
        return
      }

      this.tableHeightCalculator = createTableHeightCalculator({
        reservedHeight: 400,
        minHeight: 400,
        maxHeight: 800,
        debounceDelay: 150
      })

      this.tableHeightCalculator.addCallback(height => {
        this.tableMaxHeight = height
      })

      this.tableHeightCalculator.startListening()
    },

    // 格式化日期为后端要求的格式 (yyyyMMdd)
    formatDate(dateStr) {
      if (!dateStr) return ''
      return dateStr.replace(/-/g, '')
    },

    // 学员搜索
    selectStudent(data) {
      this.searchForm.studentName = data.studentName || ''
      this.searchForm.studentId = data.studentId || data.id || '' // 保存学员ID

      // 保存到缓存
      // this.saveStudentToCache()

      // 清除学员字段的验证错误
      this.$nextTick(() => {
        this.$refs.searchForm.clearValidate('studentName')
      })
    },

    // 处理学员姓名输入
    handleStudentNameInput(value) {
      this.searchForm.studentName = value
      // 当用户清空输入时，触发验证
      if (!value.trim()) {
        this.$nextTick(() => {
          this.$refs.searchForm.validateField('studentName')
        })
      } else {
        // 有输入时清除验证错误
        this.$nextTick(() => {
          this.$refs.searchForm.clearValidate('studentName')
        })
      }
    },

    // 查询
    handleSearch() {
      // 使用表单验证
      this.$refs.searchForm.validateField('studentName', errorMessage => {
        if (!errorMessage) {
          // 验证通过，执行查询
          this.searchForm.currentPage = 1
          // 保存查询条件到 sessionStorage（排除学员缓存字段）
          const searchFormToCache = { ...this.searchForm }
          delete searchFormToCache.studentId
          delete searchFormToCache.studentName
          sessionStorage.setItem('one2many_student_attendance_search_form', JSON.stringify(searchFormToCache))
          this.loadData()
        }
      })
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        belongBranchId: this.userBaseInfo?.branchId || '',
        timeRange: '',
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        attendanceStatus: [],
        orderNo: '', // 报班单号
        studentName: '',
        studentId: '', // 学员ID
        currentPage: 1,
        pageSize: 50
      }

      // 清除学员缓存
      this.clearStudentCache()

      // 重置日期选择状态
      this.selectData = ''

      this.initializeDefaultValues()

      // 清除缓存的查询条件
      sessionStorage.removeItem('one2many_student_attendance_search_form')

      this.$refs.studentSearchField.clear()
      this.$nextTick(() => {
        this.handleSearch()
      })
    },

    // 分页变化
    handlePageChange() {
      // 保存查询条件到 sessionStorage（排除学员缓存字段）
      const searchFormToCache = { ...this.searchForm }
      delete searchFormToCache.studentId
      delete searchFormToCache.studentName
      sessionStorage.setItem('one2many_student_attendance_search_form', JSON.stringify(searchFormToCache))
      this.loadData()
    },

    // 表格选择变化
    handleSelectionChange() {
      const rows = this.$refs.vxeTable.getCheckboxRecords()
      this.selectedRows = rows
    },

    // 批量操作
    handleBatchCommand(command) {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择需要操作的记录')
        return
      }

      switch (command) {
        case 'batchEmpty':
          this.handleBatchEmpty()
          break
        case 'batchAttendance':
          this.handleBatchAttendance()
          break
        case 'batchCancel':
          this.handleBatchCancel()
          break
      }
    },

    // 批量置空
    handleBatchEmpty() {
      // 校验是否都为正常上课、请假状态
      const invalidRows = this.selectedRows.filter(row => row.attendanceStatus !== 21 && row.attendanceStatus !== 25)

      if (invalidRows.length > 0) {
        this.$message.warning('仅正常上课、请假状态数据允许置空哦~')
        return
      }

      // 设置批量操作标识
      this.isBatchEmpty = true
      this.batchEmptyCount = this.selectedRows.length
      this.currentStudentData = {} // 批量操作时清空单个学员数据
      this.showEmptyDialog = true
    },

    // 批量考勤
    handleBatchAttendance() {
      // 校验是否都为同一个班级课次
      const firstRow = this.selectedRows[0]
      const differentClass = this.selectedRows.some(row => row.classCode !== firstRow.classCode || row.classDate !== firstRow.classDate)

      if (differentClass) {
        this.$message.warning('仅支持同一个班级课次进行批量考勤操作哦~')
        return
      }

      // 校验是否都为未考勤、置空状态
      const invalidRows = this.selectedRows.filter(row => row.attendanceStatus !== 28 && row.attendanceStatus !== 20)

      if (invalidRows.length > 0) {
        this.$message.warning('仅未考勤、置空状态数据允许考勤哦~')
        return
      }

      // 设置批量考勤的班级数据
      this.batchClassData = {
        classDate: firstRow.classDate,
        classTime: firstRow.classTime,
        className: firstRow.className,
        courseManagerName: firstRow.courseManagerName,
        teacherName: firstRow.teacherName
      }

      this.showBatchAttendanceDrawer = true
    },

    // 批量取消排课
    handleBatchCancel() {
      // 校验是否都为非正常上课状态
      const invalidRows = this.selectedRows.filter(row => row.attendanceStatus === 21)

      if (invalidRows.length > 0) {
        this.$message.warning('仅未考勤、请假、置空状态数据允许取消排课哦~')
        return
      }

      // 设置批量操作标识
      this.isBatchCancel = true
      this.batchCancelCount = this.selectedRows.length
      this.currentStudentData = {} // 批量操作时清空单个学员数据
      this.showCancelDialog = true
    },

    // 班级名称点击 - 跳转1对多排课班级详情
    handleClassNameClick(row) {
      // 构建详情页面的路由信息
      const detailRoute = {
        name: 'one2many-schedule-detail',
        query: { id: row.classId || row.id }
      }

      // 直接跳转到详情页面，TagView会自动处理标签页的添加和更新
      this.$router.push(detailRoute)
    },

    // 学员姓名点击 - 跳转v5学员主页
    handleStudentNameClick(row) {
      window.open(`${process.env.VUE_APP_ERP_URL}?studentId=${row.studentId}#/studentMgr/studentIndex`, '_blank')
    },

    // 详情操作
    handleDetail(row) {
      this.currentStudentData = row
      this.showDetailDrawer = true
    },

    // 打开自定义列设置
    handleCustomColumn() {
      const vxeTable = this.$refs.vxeTable
      if (vxeTable && vxeTable.openCustom) {
        vxeTable.openCustom()
      } else {
        this.$message.warning('自定义列设置功能暂不可用')
      }
    },

    // 置空操作
    handleEmpty(row) {
      // 重置批量操作标识
      this.isBatchEmpty = false
      this.batchEmptyCount = 0
      this.currentStudentData = row
      this.showEmptyDialog = true
    },

    // 考勤操作
    handleAttendance(row) {
      // 校验是否已到上课日期
      const classDate = new Date(row.classDate.replace(/\(.*\)/, ''))
      const today = new Date()

      if (classDate > today) {
        this.$message.warning('还未到上课日期，无法考勤哦~')
        return
      }

      // 设置考勤的班级数据（学员考勤场景）
      this.batchClassData = {
        classDate: row.classDate,
        classTime: row.classTime,
        className: row.className,
        courseManagerName: row.courseManagerName,
        teacherName: row.teacherName,
        schedulingId: row.schedulingId,
        attendanceId: row.attendanceId, // 学员考勤场景需要的考勤ID
        ...row
      }

      this.showBatchAttendanceDrawer = true
    },

    // 取消排课操作
    handleCancel(row) {
      if (row.attendanceStatus === 21) {
        this.$message.warning('学员为正常上课状态，无法取消排课哦~')
        return
      }

      // 重置批量操作标识
      this.isBatchCancel = false
      this.batchCancelCount = 0
      this.currentStudentData = row
      this.showCancelDialog = true
    },

    // 置空确认（支持批量和单独操作）
    async handleEmptyConfirm(remark, callback) {
      try {
        if (this.isBatchEmpty) {
          // 批量置空
          const attendanceIds = this.selectedRows.map(row => row.attendanceId).filter(id => id)
          const success = await this.handleBatchEmptyAPI(attendanceIds, remark)

          if (success) {
            this.$message.success(`成功置空 ${this.selectedRows.length} 条记录`)
            this.selectedRows = []
            // 重置批量操作标识
            this.isBatchEmpty = false
            this.batchEmptyCount = 0
            this.handleSearch()
            // 调用回调通知对话框操作成功
            callback && callback(true)
          } else {
            // 操作失败，不关闭对话框
            callback && callback(false)
          }
        } else {
          // 单个置空 - 复用批量接口
          const attendanceIds = [this.currentStudentData.attendanceId].filter(id => id)
          const success = await this.handleBatchEmptyAPI(attendanceIds, remark)

          if (success) {
            this.$message.success('置空考勤成功')
            this.handleSearch()
            // 调用回调通知对话框操作成功
            callback && callback(true)
          } else {
            // 操作失败，不关闭对话框
            callback && callback(false)
          }
        }
      } catch (error) {
        this.$message.error(error || '操作失败，请稍后重试')
        // 异常情况下，不关闭对话框
        callback && callback(false)
      }
    },

    // 取消排课确认（支持批量和单独操作）
    async handleCancelConfirm(remark, callback) {
      try {
        if (this.isBatchCancel) {
          // 批量取消排课
          const attendanceIds = this.selectedRows.map(row => row.attendanceId).filter(id => id)
          const success = await this.handleBatchCancelAPI(attendanceIds, remark)

          if (success) {
            this.$message.success(`成功取消排课 ${this.selectedRows.length} 条记录`)
            this.selectedRows = []
            // 重置批量操作标识
            this.isBatchCancel = false
            this.batchCancelCount = 0
            this.handleSearch()
            // 调用回调通知对话框操作成功
            callback && callback(true)
          } else {
            // 操作失败，不关闭对话框
            callback && callback(false)
          }
        } else {
          // 单个取消排课
          const attendanceIds = [this.currentStudentData.attendanceId].filter(id => id)
          const success = await this.handleBatchCancelAPI(attendanceIds, remark)

          if (success) {
            this.$message.success('取消排课成功')
            this.handleSearch()
            // 调用回调通知对话框操作成功
            callback && callback(true)
          } else {
            // 操作失败，不关闭对话框
            callback && callback(false)
          }
        }
      } catch (error) {
        this.$message.error(error || '操作失败，请稍后重试')
        // 异常情况下，不关闭对话框
        callback && callback(false)
      }
    },

    // 批量考勤确认
    handleBatchAttendanceConfirm() {
      this.selectedRows = []
      this.handleSearch()
    },

    // 加载数据
    async loadData() {
      try {
        this.loading = true

        // 构建查询参数（参数名以后端API文档为准）
        const params = {
          buId: this.userBaseInfo.buId || null,
          // 必填参数
          studentId: this.searchForm.studentId, // 学员ID必填

          // 基础查询参数
          branchId: this.searchForm.belongBranchId,
          currentPage: this.searchForm.currentPage,
          pageSize: this.searchForm.pageSize,

          // 时间范围 - 后端字段名
          courseStartDate: this.searchForm.timeRange && this.searchForm.timeRange[0] ? this.searchForm.timeRange[0] : '',
          courseEndDate: this.searchForm.timeRange && this.searchForm.timeRange[1] ? this.searchForm.timeRange[1] : '',

          // 筛选条件 - 后端字段名
          classId: null, // 班级ID（如需要可添加到搜索表单）
          teacherId: this.searchForm.teacherId || null,
          courseManagerId: this.searchForm.courseManagerId || null, // 班主任ID
          subjectIds: this.searchForm.subjectId && this.searchForm.subjectId.length > 0 ? this.searchForm.subjectId : null,
          attendTypes: this.searchForm.attendanceStatus && this.searchForm.attendanceStatus.length > 0 ? this.searchForm.attendanceStatus : [],
          className: this.searchForm.className || null,
          orderNo: this.searchForm.orderNo || null // 报班单号
        }

        // 调用接口
        const response = await One2ManyAttendanceApi.getStudentAttendanceList(params)

        if (response && response) {
          // 处理返回数据，字段映射以后端API文档为准
          this.tableData = (response.list || []).map(item => ({
            // 基础信息
            attendanceId: item.attendanceId, // 考勤记录ID
            studentId: item.studentId,
            studentName: item.studentName,
            studentCode: item.studentCode, // 学员编码
            englishName: item.englishName,

            // 班级信息
            classId: item.classId,
            className: item.className,
            classCode: item.classCode, // 班级编码
            classShortName: item.classShortName, // 班级简称

            // 课程信息
            classDate: item.courseDate, // 上课日期
            weekday: item.weekday, // 星期几
            startTime: item.startTime,
            endTime: item.endTime,
            classTime: item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '',
            subjectName: item.subjectName,

            // 教师信息
            teacherName: item.teacherName,
            courseManagerName: item.courseManagerName, // 班主任姓名

            // 校区信息
            branchName: item.branchName, // 校区名称
            attendDate: item.attendDate ? dayjs(item.attendDate).format('YYYY-MM-DD') : '', // 考勤校区（使用同一个校区）

            // 考勤信息
            attendanceStatus: item.attendType, // 考勤状态代码（21-正常上课, 25-请假, 20-置空, 28-未考勤）
            attendanceStatusText: item.attendTypeName, // 考勤状态名称
            attendanceRemark: item.remark || '', // 考勤备注
            orderNo: item.orderNo || '', // 报班单号

            // 时间信息
            createTime: item.createTime, // 创建时间
            updateTime: item.updateTime, // 更新时间

            // 其他信息
            encoding: item.encoding, // 编码
            schedulingId: item.schedulingId, // 排课ID

            // 保留原始数据
            ...item
          }))

          this.total = response.total || 0
        } else {
          this.tableData = []
          this.total = 0
        }
      } catch (error) {
        this.$message.error(error || '获取数据失败，请稍后重试')
        this.tableData = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    // 批量置空考勤（参数以后端API文档为准）
    async handleBatchEmptyAPI(attendanceIds, notes) {
      try {
        const params = {
          attendanceIds, // 考勤ID列表
          remark: notes, // 备注（必填）
          operatorId: this.userInfo?.id || '', // 操作人ID
          operatorName: this.userInfo?.name || '' // 操作人姓名
        }

        await One2ManyAttendanceApi.batchClearAttendance(params)
        return true
      } catch (error) {
        this.$message.error(error || '置空失败，请稍后重试')
        return false
      }
    },

    // 批量取消排课（参数以后端API文档为准）
    async handleBatchCancelAPI(attendanceIds, notes) {
      try {
        const params = {
          attendanceIds, // 考勤ID列表
          remark: notes, // 备注（必填）
          operatorId: this.userInfo?.id || '', // 操作人ID
          operatorName: this.userInfo?.name || '' // 操作人姓名
        }

        await One2ManyAttendanceApi.batchCancelEnrollment(params)
        return true
      } catch (error) {
        this.$message.error(error || '取消排课失败，请稍后重试')
        return false
      }
    },

    // 外部调用：设置学员搜索条件（供父组件调用）
    setStudentSearch(studentId, studentName) {
      this.searchForm.studentId = studentId
      this.searchForm.studentName = studentName

      // 保存到缓存
      // this.saveStudentToCache()

      // 清除验证错误
      this.$nextTick(() => {
        this.$refs.searchForm && this.$refs.searchForm.clearValidate('studentName')
      })
    },

    // 外部调用：设置班级搜索条件（供父组件调用）
    setClassSearch(className) {
      this.searchForm.className = className
    },
    setOrderNoSearch(orderNo) {
      this.searchForm.orderNo = orderNo
    },

    // 当 range 改变时触发
    onRangeChange(value) {
      // 当选择完成时，清空 selectData 状态
      if (value && value.length === 2 && value[0] && value[1]) {
        this.selectData = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.student-attendance-list {
  .search-form {
    margin-bottom: 20px;
    .el-form-item {
      margin-bottom: 10px;
    }

    .required {
      ::v-deep .el-form-item__label::before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }
    }
  }

  .required-star {
    color: #f56c6c;
    margin-right: 4px;
    font-weight: bold;
    margin-top: 4px;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    h3 {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
    }
  }

  .g-mt {
    margin-top: 20px;
  }

  .g-tar {
    text-align: right;
  }

  .input-common-width {
    width: 240px;
  }
}
</style>
