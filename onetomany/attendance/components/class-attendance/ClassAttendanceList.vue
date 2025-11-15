<template>
  <div class="class-attendance-list">
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
          :clearable="false"
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
          @change="handleTeacherChange"
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
          @change="handleCourseManagerChange"
        >
          <template v-slot="slotProps">
            <span>{{ slotProps.label }}</span>
            <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
          </template>
        </HiAsyncSelector>
      </el-form-item>

      <el-form-item>
        <HiDict collapse-tags v-model="searchForm.subjectId" dict-key="subject" placeholder="请输入科目" size="small" multiple clearable />
      </el-form-item>

      <el-form-item>
        <el-select v-model="searchForm.attendanceStatus" placeholder="请选择考勤状态" size="small" multiple clearable collapse-tags>
          <el-option label="已考勤" value="COMPLETED"></el-option>
          <el-option label="未考勤" value="NOT_ATTENDED"></el-option>
          <el-option label="部分考勤" value="PARTIAL"></el-option>
          <el-option label="未开始" value="NOT_STARTED"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <RangeInput
          ref="totalAttendanceRateInput"
          :start-value="searchForm.minTotalAttendanceRate"
          :end-value="searchForm.maxTotalAttendanceRate"
          placeholder="当天出勤率"
          :min="0"
          :max="100"
          @change="handleTotalAttendanceRateChange"
          :format-text="formatAttendanceRateText"
        />
      </el-form-item>

      <el-form-item>
        <RangeInput
          ref="makeupAttendanceRateInput"
          :start-value="searchForm.minMakeupAttendanceRate"
          :end-value="searchForm.maxMakeupAttendanceRate"
          placeholder="补课出勤率"
          :min="0"
          :max="100"
          @change="handleMakeupAttendanceRateChange"
          :format-text="formatAttendanceRateText"
        />
      </el-form-item>

      <el-form-item style="margin-left: 30px;">
        <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
        <el-button @click="handleReset" size="small">重置</el-button>
        <el-button size="small" type="primary" @click="handleCustomColumn">自定义列设置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <VxeTableCustom
      table-id="one2many-class-attendance-table"
      stripe
      :columns="columns"
      :data="tableData"
      v-loading="loading"
      :max-height="tableMaxHeight"
      ref="vxeTable"
    />

    <!-- 分页 -->
    <div class="g-mt g-tar" v-if="tableData.length > 0">
      <hi-pagination :total="total" :current-page.sync="searchForm.currentPage" :page-size.sync="searchForm.pageSize" @change="handlePageChange" />
    </div>

    <!-- 课次考勤抽屉 -->
    <ClassAttendanceDrawer
      ref="classAttendanceDrawer"
      :visible.sync="showAttendanceDrawer"
      :class-data="currentClassData"
      source="class"
      @refresh="handleSearch"
    />

    <!-- 课次考勤置空抽屉 -->
    <AttendanceEmptyDrawer ref="attendanceEmptyDrawer" :visible.sync="showAttendanceEmptyDrawer" :class-data="currentClassData" @refresh="handleSearch" />

    <!-- 课次详情抽屉 -->
    <ClassDetailDrawer
      ref="classDetailDrawer"
      :visible.sync="showDetailDrawer"
      :class-data="currentClassData"
      :scheduling-id="currentClassData.schedulingId"
      :hide-attendance-button="true"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { createTableHeightCalculator } from '@/utils'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import ClassAttendanceDrawer from './ClassAttendanceDrawer.vue'
import AttendanceEmptyDrawer from './AttendanceEmptyDrawer.vue'
import ClassDetailDrawer from '../../../schedule/components/ClassDetailDrawer.vue'
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'
import RangeInput from '@/components/rangeInput'

export default {
  name: 'ClassAttendanceList',
  components: {
    VxeTableCustom,
    ClassAttendanceDrawer,
    AttendanceEmptyDrawer,
    ClassDetailDrawer,
    RangeInput
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
      searchForm: {
        belongBranchId: this.userBaseInfo?.branchId || '',
        timeRange: [this.getCurrentDate(), this.getCurrentDate()],
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        attendanceStatus: ['NOT_ATTENDED', 'PARTIAL'], // 默认选中未考勤、部分考勤
        minFirstAttendanceRate: null,
        maxFirstAttendanceRate: null,
        minTotalAttendanceRate: null,
        maxTotalAttendanceRate: null,
        minMakeupAttendanceRate: null,
        maxMakeupAttendanceRate: null,
        currentPage: 1,
        pageSize: 10
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
        ],
        disabledDate: time => {
          if (this.selectData) {
            const curDate = new Date(this.selectData).getTime() // 转时间戳
            const limit = 30 * 24 * 3600 * 1000 // 限制30天内
            const maxDate = curDate + limit // 最晚可选日期 = 开始 + 30天  -30天
            const minDate = curDate - limit // 最早可选日期 = 开始 - 30天
            // 禁止选择大于30天后的日期和小于30天前的日期
            return time.getTime() > maxDate || time.getTime() < minDate
          }
          // 没有选开始时间时，不禁用任何日期
          return false
        }
      },
      loading: false,
      tableData: [],
      total: 0,
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      showAttendanceDrawer: false,
      showDetailDrawer: false,
      showAttendanceEmptyDrawer: false,
      currentClassData: {},
      // 表格列配置
      columns: [
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
          prop: 'classType',
          label: '班型',
          width: 100
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
          width: 120
        },
        {
          prop: 'shouldAttend',
          label: '排课',
          width: 80,
          align: 'center',
          titleSuffix: {
            content: '当前课次已排课的学员数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'actualAttend',
          label: '正常上课',
          width: 100,
          align: 'center',
          titleSuffix: {
            content: '当前课次考勤状态为“正常上课”的学员数，含补课考勤、跨天考勤学员',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'makeupCount',
          label: '待补课',
          width: 80,
          align: 'center',
          titleSuffix: {
            content: '当前课次请假还未补课的学员数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'firstAttendanceRate',
          label: '当天出勤率',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            return h('span', `${row.firstAttendanceRate || 0}%`)
          }
        },
        {
          prop: 'totalAttendanceRate',
          label: '补课出勤率',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            return h('span', `${row.totalAttendanceRate || 0}%`)
          }
        },
        {
          prop: 'attendanceStatus',
          label: '考勤状态',
          width: 90,
          align: 'center',
          fixed: 'right',
          render: (h, { row }) => {
            const statusMap = {
              COMPLETED: { text: '已考勤', type: 'success' },
              NOT_ATTENDED: { text: '未考勤', type: 'warning' },
              PARTIAL: { text: '部分考勤', type: 'primary' },
              NOT_STARTED: { text: '未开始', type: 'info' }
            }
            const status = statusMap[row.attendanceStatusCode] || { text: row.attendanceStatus, type: '' }

            return h(
              'el-tag',
              {
                props: {
                  type: status.type,
                  size: 'small'
                }
              },
              row.attendanceStatus
            )
          }
        },
        {
          label: '操作',
          width: 160,
          fixed: 'right',
          render: (h, { row }) => {
            const buttons = []
            buttons.push(
              h(
                'el-button',
                {
                  props: { type: 'text', size: 'small' },
                  on: { click: () => this.handleDetail(row) },
                  style: { marginLeft: '0px' }
                },
                '详情'
              )
            )
            // 考勤按钮 - 未考勤、部分考勤时显示
            if (row.attendanceStatusCode === 'NOT_ATTENDED' || row.attendanceStatusCode === 'PARTIAL') {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleAttendance(row) },
                    style: { marginLeft: '0px' }
                  },
                  '考勤'
                )
              )
            }

            // 考勤置空按钮 - 除了未开始  未考勤都显示
            if (row.attendanceStatusCode !== 'NOT_STARTED' && this.hasButtonRight('one2many-classNull')) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleAttendanceEmpty(row) },
                    style: { marginLeft: '0px' }
                  },
                  '考勤置空'
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
    // 从 sessionStorage 中获取搜索条件，如果有则使用缓存的条件
    try {
      const cachedForm = JSON.parse(sessionStorage.getItem('one2many_class_attendance_search_form'))
      if (cachedForm) {
        // 合并默认值和缓存的搜索条件
        this.searchForm = {
          ...this.searchForm,
          ...cachedForm
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
    // Tab页切换时重新初始化数据
    this.initComponent()
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
    // 页面刷新或关闭时的处理函数
    handleBeforeUnload() {
      // 在页面刷新或关闭时清除缓存的筛选条件
      sessionStorage.removeItem('one2many_class_attendance_search_form')
    },
    onRangeChange(value) {
      // 当选择完成时，清空 selectData 状态
      if (value && value.length === 2 && value[0] && value[1]) {
        this.selectData = ''
      }
    },

    // 初始化默认值
    initializeDefaultValues() {
      this.searchForm.belongBranchId = this.userBaseInfo?.branchId || ''
    },

    // 组件初始化
    initComponent() {
      // 初始化表格高度计算器
      this.initTableHeightCalculator()

      // 确保用户信息已加载后再设置默认校区并加载数据
      this.$nextTick(() => {
        if (this.userBaseInfo?.branchId && !this.searchForm.belongBranchId) {
          this.searchForm.belongBranchId = this.userBaseInfo.branchId
        }
        this.loadData()
      })
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
        reservedHeight: 350,
        minHeight: 400,
        maxHeight: 800,
        debounceDelay: 150
      })

      this.tableHeightCalculator.addCallback(height => {
        this.tableMaxHeight = height
      })

      this.tableHeightCalculator.startListening()
    },

    // 查询
    handleSearch() {
      this.searchForm.currentPage = 1
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_class_attendance_search_form', JSON.stringify(this.searchForm))
      this.loadData()
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        belongBranchId: this.userBaseInfo?.branchId || '',
        timeRange: [this.getCurrentDate(), this.getCurrentDate()],
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        attendanceStatus: ['NOT_ATTENDED', 'PARTIAL'],
        minFirstAttendanceRate: null,
        maxFirstAttendanceRate: null,
        minTotalAttendanceRate: null,
        maxTotalAttendanceRate: null,
        minMakeupAttendanceRate: null,
        maxMakeupAttendanceRate: null,
        currentPage: 1,
        pageSize: 10
      }

      // 重置日期选择状态
      this.selectData = ''

      // 重置 RangeInput 组件
      if (this.$refs.totalAttendanceRateInput) {
        this.$refs.totalAttendanceRateInput.reset()
      }
      if (this.$refs.makeupAttendanceRateInput) {
        this.$refs.makeupAttendanceRateInput.reset()
      }

      this.initializeDefaultValues()

      // 清除缓存的查询条件
      sessionStorage.removeItem('one2many_class_attendance_search_form')

      this.$nextTick(() => {
        this.handleSearch()
      })
    },

    // 处理当天出勤率变化
    handleTotalAttendanceRateChange(range) {
      this.searchForm.minTotalAttendanceRate = range.startValue
      this.searchForm.maxTotalAttendanceRate = range.endValue
    },

    // 处理补课出勤率变化
    handleMakeupAttendanceRateChange(range) {
      this.searchForm.minMakeupAttendanceRate = range.startValue
      this.searchForm.maxMakeupAttendanceRate = range.endValue
    },

    // 格式化出勤率显示文本
    formatAttendanceRateText(start, end) {
      return `${start}% - ${end}%`
    },

    // 分页变化
    handlePageChange() {
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_class_attendance_search_form', JSON.stringify(this.searchForm))
      this.loadData()
    },

    // 班级名称点击 - 跳转1对多排课班级详情
    handleClassNameClick(row) {
      // 跳转到1对多排课班级详情页面
      const detailRoute = {
        name: 'one2many-schedule-detail',
        query: { id: row.classId || row.id }
      }
      this.$router.push(detailRoute)
    },

    // 考勤操作
    handleAttendance(row) {
      this.currentClassData = row
      this.showAttendanceDrawer = true
    },

    // 详情操作
    handleDetail(row) {
      this.currentClassData = row
      this.showDetailDrawer = true
    },

    // 考勤置空操作
    handleAttendanceEmpty(row) {
      this.currentClassData = row
      this.showAttendanceEmptyDrawer = true
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

    // 处理班主任选择变化
    handleCourseManagerChange(value, option) {
      if (value && option) {
        // 当选择班主任时，缓存班主任名称
        this.searchForm.courseManagerName = option.label || ''
      } else {
        // 当清空班主任时，清空班主任名称
        this.searchForm.courseManagerName = ''
      }
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

    // 格式化日期为后端要求的格式 (yyyyMMdd)
    formatDate(dateStr) {
      if (!dateStr) return ''
      return dateStr.replace(/-/g, '')
    },

    // 加载数据
    async loadData() {
      try {
        this.loading = true

        // 构建查询参数（参数名以后端API文档为准）
        const params = {
          // 基础查询参数
          branchId: this.searchForm.belongBranchId,
          currentPage: this.searchForm.currentPage,
          pageSize: this.searchForm.pageSize,

          // 时间范围 - 后端字段名
          startDate: this.searchForm.timeRange && this.searchForm.timeRange[0] ? this.searchForm.timeRange[0] : '',
          endDate: this.searchForm.timeRange && this.searchForm.timeRange[1] ? this.searchForm.timeRange[1] : '',

          // 筛选条件 - 后端字段名
          classId: this.searchForm.classId || null, // 班级ID
          teacherId: this.searchForm.teacherId || null,
          courseManagerId: this.searchForm.courseManagerId || null, // 班主任ID
          subjectIds: this.searchForm.subjectId && this.searchForm.subjectId.length > 0 ? this.searchForm.subjectId : [], // 科目ID数组（后端实际支持多选）
          attendanceStatuses: this.searchForm.attendanceStatus && this.searchForm.attendanceStatus.length > 0 ? this.searchForm.attendanceStatus : [],

          minFirstAttendanceRate:
            this.searchForm.minFirstAttendanceRate !== null && this.searchForm.minFirstAttendanceRate !== '' ? this.searchForm.minFirstAttendanceRate : null, // 首课出勤率-最小值
          maxFirstAttendanceRate:
            this.searchForm.maxFirstAttendanceRate !== null && this.searchForm.maxFirstAttendanceRate !== '' ? this.searchForm.maxFirstAttendanceRate : null, // 首课出勤率-最大值
          minTotalAttendanceRate:
            this.searchForm.minTotalAttendanceRate !== null && this.searchForm.minTotalAttendanceRate !== '' ? this.searchForm.minTotalAttendanceRate : null, // 当天出勤率/总出勤率-最小值
          maxTotalAttendanceRate:
            this.searchForm.maxTotalAttendanceRate !== null && this.searchForm.maxTotalAttendanceRate !== '' ? this.searchForm.maxTotalAttendanceRate : null, // 当天出勤率/总出勤率-最大值
          minMakeupAttendanceRate:
            this.searchForm.minMakeupAttendanceRate !== null && this.searchForm.minMakeupAttendanceRate !== '' ? this.searchForm.minMakeupAttendanceRate : null, // 补课出勤率-最小值
          maxMakeupAttendanceRate:
            this.searchForm.maxMakeupAttendanceRate !== null && this.searchForm.maxMakeupAttendanceRate !== '' ? this.searchForm.maxMakeupAttendanceRate : null, // 补课出勤率-最大值
          className: this.searchForm.className || null,
          buId: this.userBaseInfo.buId || null
        }

        // 调用接口
        const response = await One2ManyAttendanceApi.getSchedulingAttendanceList(params)

        if (response) {
          // 处理返回数据，字段映射以后端API文档为准
          this.tableData = (response.list || []).map(item => ({
            // 基础信息
            schedulingId: item.schedulingId, // 课次ID
            classId: item.classId,
            className: item.className,
            classCode: item.classCode, // 班级编码
            classShortName: item.classShortName, // 班级简称
            classDate: item.courseDate, // 上课日期
            weekday: item.weekday, // 星期几
            startTime: item.startTime, // 开始时间
            endTime: item.endTime, // 结束时间
            classTime: item.timeSlot || `${item.startTime}-${item.endTime}`, // 优先使用timeSlot，否则拼接
            classType: item.courseType, // 班型

            // 教师信息
            teacherName: item.teacherName, // 教师姓名
            courseManagerName: item.courseManagerName, // 班主任姓名

            // 校区信息
            branchName: item.branchName, // 校区名称

            // 科目信息
            subjectName: item.subjectName, // 科目名称

            // 考勤统计
            shouldAttend: item.expectedCount, // 应到人数
            actualAttend: item.actualCount, // 实到人数
            makeupCount: item.pendingMakeupCount, // 待补课人数
            firstAttendanceRate: parseFloat(item.attendRate) || 0, // 当天出勤率
            totalAttendanceRate: parseFloat(item.makeupAttendRate) || 0, // 补课出勤率

            // 考勤状态
            attendanceStatus: item.attendanceStatus, // 考勤状态名称
            attendanceStatusCode: item.attendanceStatusCode, // 考勤状态代码

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
    }
  }
}
</script>

<style lang="scss" scoped>
.class-attendance-list {
  .search-form {
    margin-bottom: 20px;
    .el-form-item {
      margin-bottom: 10px;
    }
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
