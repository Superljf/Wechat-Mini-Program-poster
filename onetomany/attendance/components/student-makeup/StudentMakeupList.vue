<template>
  <div class="student-makeup-list">
    <!-- 搜索表单 -->
    <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
      <el-form-item label="">
        <el-select v-model="searchForm.belongBranchId" :filterable="true" :remote="false" placeholder="请选择校区" size="small" style="width: 200px">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="item in teamBranchList" :key="item.id" :label="item.orgName" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="">
        <el-date-picker
          v-model="searchForm.classTimeRange"
          type="daterange"
          range-separator="-"
          start-placeholder="上课开始日期"
          end-placeholder="上课结束日期"
          value-format="yyyy-MM-dd"
          :default-time="['00:00:00', '23:59:59']"
          :picker-options="pickerOptions"
          size="small"
          class="input-common-width"
          clearable
        ></el-date-picker>
      </el-form-item>

      <el-form-item label="">
        <el-date-picker
          v-model="searchForm.makeupTimeRange"
          type="daterange"
          range-separator="-"
          start-placeholder="补课开始日期"
          end-placeholder="补课结束日期"
          value-format="yyyy-MM-dd"
          :default-time="['00:00:00', '23:59:59']"
          :picker-options="pickerOptions"
          size="small"
          class="input-common-width"
          clearable
        ></el-date-picker>
      </el-form-item>

      <el-form-item label="">
        <AsyncRemoteInput
          clearable
          :inputValue="searchForm.studentName"
          placeholder="学员姓名/编码/手机号"
          :inputKey="'studentName'"
          dict="student"
          ref="studentSearchField"
          @handleSelect="selectStudent"
          style="width: 200px"
          size="small"
        />
      </el-form-item>

      <el-form-item label="">
        <el-select v-model="searchForm.makeupStatus" placeholder="请选择补课状态" size="small" multiple clearable collapse-tags>
          <el-option label="已补课" :value="30"></el-option>
          <el-option label="已约课" :value="20"></el-option>
          <el-option label="未约课" :value="10"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="">
        <el-select v-model="searchForm.makeupType" placeholder="全部补课类型" size="small" multiple clearable collapse-tags>
          <el-option label="线下补课" :value="1"></el-option>
          <template v-if="isJiayin">
            <el-option label="佳音APP" :value="2"></el-option>
            <el-option label="ClassIn直播" :value="3"></el-option>
            <el-option label="ClassIn回看" :value="4"></el-option>
          </template>
          <template v-else>
            <el-option label="线上补课" :value="2"></el-option>
          </template>
        </el-select>
      </el-form-item>

      <el-form-item label="">
        <el-input v-model="searchForm.className" placeholder="请输入班级名称/简称/编码" size="small" style="width: 200px" clearable></el-input>
      </el-form-item>

      <el-form-item label="">
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

      <el-form-item label="">
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

      <el-form-item label="">
        <HiDict v-model="searchForm.subjectId" collapse-tags dict-key="subject" placeholder="请输入科目" size="small" multiple clearable />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
        <el-button @click="handleReset" size="small">重置</el-button>

        <!-- 批量操作 -->
        <el-dropdown @command="handleBatchCommand" trigger="hover" :disabled="selectedRows.length === 0" style="margin-left: 10px;">
          <el-button size="small" :disabled="selectedRows.length === 0"> 批量操作<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="batchAttendance">批量考勤</el-dropdown-item>
            <el-dropdown-item command="batchCancel">批量取消预约</el-dropdown-item>
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
      table-id="one2many-student-makeup-table"
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

    <!-- 批量补课点名抽屉 -->
    <BatchMakeupAttendanceDrawer :visible.sync="showBatchAttendanceDrawer" :selected-rows="selectedRows" :class-data="classData" @refresh="handleSearch" />

    <!-- 批量取消约课弹窗 -->
    <BatchCancelReservationDialog :visible.sync="showBatchCancelDialog" :selected-count="selectedRows.length" @confirm="handleBatchCancelConfirm" />

    <!-- 预约补课弹窗 -->
    <ReserveMakeupDialog :visible.sync="showReserveDialog" :student-data="currentStudentData" @confirm="handleReserveConfirm" />

    <!-- 修改约课时间弹窗 -->
    <ModifyReservationDialog :visible.sync="showModifyDialog" :student-data="currentStudentData" @confirm="handleModifyConfirm" />

    <!-- 取消约课弹窗 -->
    <CancelReservationDialog :visible.sync="showCancelReservationDialog" :student-data="currentStudentData" @confirm="handleCancelReservationConfirm" />

    <!-- 课次学员考勤详情抽屉 -->
    <StudentAttendanceDetailDrawer :visible.sync="showDetailDrawer" :student-data="currentStudentData" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { createTableHeightCalculator } from '@/utils'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import BatchMakeupAttendanceDrawer from './BatchMakeupAttendanceDrawer.vue'
import BatchCancelReservationDialog from './BatchCancelReservationDialog.vue'
import ReserveMakeupDialog from './ReserveMakeupDialog.vue'
import ModifyReservationDialog from './ModifyReservationDialog.vue'
import CancelReservationDialog from './CancelReservationDialog.vue'
import StudentAttendanceDetailDrawer from '../student-attendance/StudentAttendanceDetailDrawer.vue'
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'

export default {
  name: 'StudentMakeupList',
  components: {
    VxeTableCustom,
    AsyncRemoteInput,
    BatchMakeupAttendanceDrawer,
    BatchCancelReservationDialog,
    ReserveMakeupDialog,
    ModifyReservationDialog,
    CancelReservationDialog,
    StudentAttendanceDetailDrawer
  },
  props: {
    teamBranchList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    // 判断是否为佳音
    isJiayin() {
      return this.userBaseInfo?.productLine === 11
    }
  },

  watch: {
    // 监听用户信息变化，重新初始化校区组件
    userBaseInfo: {
      handler(newVal) {
        if (newVal && newVal.branchId) {
          this.$nextTick(() => {
            // 设置默认校区
            if (!this.searchForm.belongBranchId) {
              this.searchForm.belongBranchId = newVal.branchId
            }
          })
        }
      },
      immediate: true
    }
  },
  data() {
    return {
      searchForm: {
        belongBranchId: this.userBaseInfo?.branchId || '',
        classTimeRange: [],
        makeupTimeRange: [],
        studentName: '',
        studentId: '', // 学员ID
        makeupStatus: [10, 20], // 默认选中未约课、已约课
        makeupType: [],
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        currentPage: 1,
        pageSize: 50
      },
      pickerOptions: {
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
      },
      loading: false,
      tableData: [],
      total: 0,
      selectedRows: [],
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      showBatchAttendanceDrawer: false,
      showBatchCancelDialog: false,
      classData: {
        classDate: '2025.07.07 (周二)',
        classTime: '08:00~10:00',
        className: '2025秋季Y年级d班',
        teacher: '丁七七',
        teacherId: '1',
        classTeacher: '丁七七'
      },
      showReserveDialog: false,
      showModifyDialog: false,
      showCancelReservationDialog: false,
      showDetailDrawer: false,
      currentStudentData: {},
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
          prop: 'classShortName',
          label: '班级简称',
          width: 80
        },
        {
          prop: 'studentName',
          label: '学员姓名',
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
          prop: 'makeupDate',
          label: '补课日期',
          width: 100
        },
        {
          prop: 'makeupTime',
          label: '补课时间',
          width: 100
        },
        {
          prop: 'makeupType',
          label: '补课类型',
          width: 150,
          render: (h, { row }) => {
            // 根据是否为佳音显示不同的补课类型
            const jiayinTypeMap = {
              1: '线下补课',
              2: '佳音APP',
              3: 'ClassIn直播',
              4: 'ClassIn回看'
            }
            const otherTypeMap = {
              1: '线下补课',
              2: '线上补课'
            }
            const typeMap = this.isJiayin ? jiayinTypeMap : otherTypeMap
            const typeText = typeMap[row.makeupType] || row.makeupTypeName || '-'
            return h('span', typeText)
          }
        },
        {
          prop: 'updateTime',
          label: '更新时间',
          width: 150
        },
        {
          prop: 'updateUserName',
          label: '更新人',
          width: 120
        },
        {
          prop: 'makeupStatus',
          label: '补课状态',
          width: 90,
          align: 'center',
          fixed: 'right',
          render: (h, { row }) => {
            const statusMap = {
              30: { text: '已补课', type: 'success' },
              20: { text: '已约课', type: 'primary' },
              10: { text: '未约课', type: 'warning' }
            }
            const status = statusMap[row.makeupStatus] || { text: row.makeupStatus, type: '' }

            return h(
              'el-tag',
              {
                props: {
                  type: status.type,
                  size: 'small'
                }
              },
              row.makeupStatusName
            )
          }
        },
        {
          label: '操作',
          width: 210,
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

            // 考勤按钮 - 仅补课状态为已约课、未约课时显示
            if (row.makeupStatus === 20 || row.makeupStatus === 10) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleMakeupAttendance(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '考勤'
                )
              )
            }

            // 约课按钮 - 仅补课状态为未约课时显示
            if (row.makeupStatus === 10) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleReserve(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '约课'
                )
              )
            }

            // 修改时间按钮 - 仅补课状态为已约课时显示
            if (row.makeupStatus === 20) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleModify(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '修改时间'
                )
              )
            }

            // 取消约课按钮 - 仅补课状态为已预约时显示
            if (row.makeupStatus === 20) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    on: { click: () => this.handleCancelReservation(row) },
                    style: {
                      marginLeft: '0px'
                    }
                  },
                  '取消约课'
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
      const cachedForm = JSON.parse(sessionStorage.getItem('one2many_student_makeup_search_form'))
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
      sessionStorage.removeItem('one2many_student_makeup_search_form')
    },

    // 初始化默认值
    initializeDefaultValues() {
      this.searchForm.belongBranchId = this.userBaseInfo?.branchId || ''
    },

    // 组件初始化
    initComponent() {
      this.initTableHeightCalculator()

      // 确保用户信息已加载后再设置默认校区并加载数据
      this.$nextTick(() => {
        if (this.userBaseInfo?.branchId && !this.searchForm.belongBranchId) {
          this.searchForm.belongBranchId = this.userBaseInfo.branchId
        }
        this.loadData()
      })
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
      this.searchForm.studentId = data.studentId || data.id || '' // 保存学员ID，优先使用studentId
    },

    // 查询
    handleSearch() {
      this.searchForm.currentPage = 1
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_student_makeup_search_form', JSON.stringify(this.searchForm))
      this.loadData()
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        belongBranchId: this.userBaseInfo?.branchId || '',
        classTimeRange: [],
        makeupTimeRange: [],
        studentName: '',
        studentId: '', // 学员ID
        makeupStatus: [10, 20],
        makeupType: [],
        className: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: [],
        currentPage: 1,
        pageSize: 50
      }

      this.initializeDefaultValues()

      // 清除缓存的查询条件
      sessionStorage.removeItem('one2many_student_makeup_search_form')

      this.$refs.studentSearchField.clear()
      this.$nextTick(() => {
        this.handleSearch()
      })
    },

    // 分页变化
    handlePageChange() {
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_student_makeup_search_form', JSON.stringify(this.searchForm))
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
        case 'batchAttendance':
          this.handleBatchAttendance()
          break
        case 'batchCancel':
          this.handleBatchCancel()
          break
      }
    },

    // 批量考勤
    handleBatchAttendance() {
      // 校验选中数据补课状态是否都为已约课、未约课状态
      const invalidRows = this.selectedRows.filter(row => row.makeupStatus !== 20 && row.makeupStatus !== 10)

      if (invalidRows.length > 0) {
        this.$message.warning('仅已约课、未约课状态支持批量考勤哦~')
        return
      }

      // 校验是否同一班级课次数据
      const firstRow = this.selectedRows[0]
      const sameClassAndScheduling = this.selectedRows.every(row => row.schedulingId === firstRow.schedulingId)

      if (!sameClassAndScheduling) {
        this.$message.warning('仅同一班级课次数据支持批量考勤哦~')
        return
      }

      // 设置课次数据（从第一条数据中提取）
      this.classData = {
        classDate: firstRow.classDate || '',
        classTime: firstRow.classTime || '',
        className: firstRow.className || '',
        teacher: firstRow.teacherName || '',
        teacherId: firstRow.teacherId || '',
        classTeacher: firstRow.courseManagerName || ''
      }

      this.showBatchAttendanceDrawer = true
    },

    // 批量取消预约
    handleBatchCancel() {
      // 校验选中数据补课状态是否都为已约课
      const invalidRows = this.selectedRows.filter(row => row.makeupStatus !== 20)

      if (invalidRows.length > 0) {
        this.$message.warning('仅已约课状态支持批量取消约课哦~')
        return
      }

      this.showBatchCancelDialog = true
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

    // 学员姓名点击 - 跳转v5学员主页
    handleStudentNameClick(row) {
      window.open(`${process.env.VUE_APP_ERP_URL}?studentId=${row.studentId}#/studentMgr/studentIndex`, '_blank')
    },

    // 详情操作
    handleDetail(row) {
      this.currentStudentData = row
      this.showDetailDrawer = true
    },

    // 补课考勤操作
    handleMakeupAttendance(row) {
      // 将单个学员包装成数组，以便复用批量考勤抽屉
      this.selectedRows = [row]
      this.currentStudentData = row

      // 设置课次数据（从当前行数据中提取）
      this.classData = {
        classDate: row.classDate || '',
        classTime: row.classTime || '',
        className: row.className || '',
        teacher: row.teacherName || '',
        teacherId: row.teacherId || '',
        classTeacher: row.courseManagerName || ''
      }

      this.showBatchAttendanceDrawer = true
    },

    // 约课操作
    handleReserve(row) {
      this.currentStudentData = row
      this.showReserveDialog = true
    },

    // 修改时间操作
    handleModify(row) {
      this.currentStudentData = row
      this.showModifyDialog = true
    },

    // 取消约课操作
    handleCancelReservation(row) {
      this.currentStudentData = row
      this.showCancelReservationDialog = true
    },

    // 批量取消约课确认
    async handleBatchCancelConfirm(remark) {
      // 校验课次学员考勤状态
      const hasNormalOrEmpty = this.selectedRows.some(row => row.attendanceStatus === 'present' || row.attendanceStatus === 'empty')

      if (hasNormalOrEmpty) {
        this.$message.warning('选中课次学员状态已变，无法取消约课，请刷新列表哦~')
        return
      }

      // 批量取消补课安排
      const makeupIds = this.selectedRows.map(row => row.makeupId).filter(id => id)
      const success = await this.handleBatchCancelMakeupAPI(makeupIds, remark)

      if (success) {
        this.$message.success(`成功取消约课 ${this.selectedRows.length} 条记录`)
        this.selectedRows = []
        this.handleSearch()
      }
    },

    // 预约补课确认
    async handleReserveConfirm(formData, handleClose) {
      // 校验课次学员考勤状态
      if (this.currentStudentData.attendanceStatus === 'present' || this.currentStudentData.attendanceStatus === 'empty') {
        this.$message.warning('当前课次学员状态已变，无法预约补课，请刷新列表哦~')
        if (handleClose) handleClose(false)
        return
      }

      // 构建参数
      const params = {
        attendanceId: this.currentStudentData.attendanceId,
        expectedDate: formData.makeupDate,
        expectedStartTime: formData.makeupStartTime,
        expectedEndTime: formData.makeupEndTime,
        makeupType: formData.makeupType,
        notes: formData.remark,
        originalSchedulingId: this.currentStudentData.classId, // 原课次ID
        studentId: this.currentStudentData.studentId,
        teacherId: this.currentStudentData.teacherId,
        foreignTeacherId: formData.foreignTeacherId
      }

      const success = await this.handleScheduleMakeupAPI(params)

      if (success) {
        this.$message.success('预约补课成功')
        if (handleClose) handleClose(true)
        this.handleSearch()
      } else {
        if (handleClose) handleClose(false)
      }
    },

    // 修改约课确认
    async handleModifyConfirm(formData, handleClose) {
      try {
        // 校验课次学员考勤状态
        if (this.currentStudentData.attendanceStatus === 'present' || this.currentStudentData.attendanceStatus === 'empty') {
          this.$message.warning('当前课次学员状态已变，无法修改约课时间，请刷新列表哦~')
          if (handleClose) handleClose(false)
          return
        }

        // 构建参数
        const params = {
          expectedDate: formData.makeupDate,
          expectedStartTime: formData.makeupStartTime,
          expectedEndTime: formData.makeupEndTime,
          notes: formData.remark
        }

        const success = await this.handleUpdateMakeupScheduleAPI(this.currentStudentData.makeupId, params)

        if (success) {
          this.$message.success('修改约课时间成功')
          this.handleSearch()
          // 调用回调通知对话框操作成功
          if (handleClose) handleClose(true)
        } else {
          // 操作失败，不关闭对话框
          if (handleClose) handleClose(false)
        }
      } catch (error) {
        this.$message.error(error || '修改约课时间失败，请稍后重试')
        // 异常情况下，不关闭对话框
        if (handleClose) handleClose(false)
      }
    },

    // 取消约课确认
    async handleCancelReservationConfirm(remark) {
      // 校验课次学员考勤状态
      if (this.currentStudentData.attendanceStatus === 'present' || this.currentStudentData.attendanceStatus === 'empty') {
        this.$message.warning('当前课次学员状态已变，无法取消约课，请刷新列表哦~')
        return
      }

      // 单个取消约课 - 复用批量接口
      const makeupIds = [this.currentStudentData.makeupId].filter(id => id)

      const success = await this.handleBatchCancelMakeupAPI(makeupIds, remark)

      if (success) {
        this.$message.success('取消约课成功')
        this.handleSearch()
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

    // 加载数据
    async loadData() {
      try {
        this.loading = true

        // 构建查询参数（参数名以后端API文档为准）
        const params = {
          buId: this.userBaseInfo.buId || null,
          // 基础查询参数
          branchId: this.searchForm.belongBranchId || '',
          currentPage: this.searchForm.currentPage,
          pageSize: this.searchForm.pageSize,

          // 时间范围 - 后端字段名
          originalCourseStartDate: this.searchForm.classTimeRange && this.searchForm.classTimeRange[0] ? this.searchForm.classTimeRange[0] : '', // 原课次开始日期
          originalCourseEndDate: this.searchForm.classTimeRange && this.searchForm.classTimeRange[1] ? this.searchForm.classTimeRange[1] : '', // 原课次结束日期
          markupStartDate: this.searchForm.makeupTimeRange && this.searchForm.makeupTimeRange[0] ? this.searchForm.makeupTimeRange[0] : '', // 预计补课开始日期
          markupEndDate: this.searchForm.makeupTimeRange && this.searchForm.makeupTimeRange[1] ? this.searchForm.makeupTimeRange[1] : '', // 预计补课结束日期

          // 筛选条件 - 后端字段名
          studentId: this.searchForm.studentId || null,
          studentName: this.searchForm.studentName || '', // 模糊查询
          className: this.searchForm.className || '', // 模糊查询
          classId: null, // 班级ID（如需要可添加到搜索表单）
          teacherId: this.searchForm.teacherId || null,
          courseManagerId: this.searchForm.courseManagerId || null, // 班主任ID
          subjectIds: this.searchForm.subjectId && this.searchForm.subjectId.length > 0 ? this.searchForm.subjectId : null, // 后端只支持单选
          gradeId: null, // 年级ID（如需要可添加到搜索表单）
          makeupStatuses: this.searchForm.makeupStatus && this.searchForm.makeupStatus.length > 0 ? this.searchForm.makeupStatus : [], // 补课状态列表
          makeupTypes: this.searchForm.makeupType && this.searchForm.makeupType.length > 0 ? this.searchForm.makeupType : [] // 补课类型列表
        }

        // 调用接口
        const response = await One2ManyAttendanceApi.getMakeupList(params)

        if (response && response) {
          // 处理返回数据，字段映射以后端API文档为准
          this.tableData = (response.list || []).map(item => ({
            // 基础信息
            makeupId: item.makeupId, // 补课ID
            attendanceId: item.attendanceId, // 原考勤记录ID
            studentId: item.studentId,
            studentName: item.studentName,
            schedulingId: item.schedulingId,

            // 班级信息
            classId: item.courseId,
            className: item.courseName,
            classShortName: item.courseShortName,
            classCode: item.courseCode,

            // 原课次信息
            classDate: item.courseDate, // 原课次日期
            weekday: item.weekday, // 星期几
            startTime: item.startTime, // 原课次开始时间
            endTime: item.endTime, // 原课次结束时间
            classTime: item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '', // 拼接时间

            // 教师信息
            teacherName: item.teacherName || '-',
            teacherId: item.teacherId,
            courseManagerName: item.courseManagerName || '-',
            courseManagerId: item.courseManagerId,

            // 科目信息
            subjectName: item.subjectName,
            gradeName: item.gradeName, // 年级名称

            // 补课状态
            makeupStatus: item.makeupStatus, // 补课状态代码（10-未约课, 20-已约课, 30-已补课）
            makeupStatusName: item.makeupStatusName, // 补课状态名称

            // 预计补课信息
            expectedDate: item.expectedDate, // 预计补课日期
            expectedStartTime: item.expectedStartTime, // 预计开始时间
            expectedEndTime: item.expectedEndTime, // 预计结束时间
            // 已补课取实际补课日期信息，已约课取预计补课日期信息，未约课为空
            makeupDate: item.makeupStatus === 30 ? item.actualDate : item.expectedDate || '-', // 补课日期（优先显示预计，其次实际）
            makeupTime:
              item.makeupStatus === 30
                ? item.actualStartTime && item.actualEndTime
                  ? `${item.actualStartTime}-${item.actualEndTime}`
                  : '-'
                : item.expectedStartTime && item.expectedEndTime
                ? `${item.expectedStartTime}-${item.expectedEndTime}`
                : '-',

            // 实际补课信息
            actualDate: item.actualDate, // 实际补课日期
            actualStartTime: item.actualStartTime, // 实际开始时间
            actualEndTime: item.actualEndTime, // 实际结束时间

            // 补课类型
            makeupType: item.makeupType, // 补课类型代码
            makeupTypeName: item.makeupTypeName || '未知', // 补课类型名称

            // 课程类型
            courseTypeName: item.courseTypeName, // 课程类型名称

            // 时间信息
            createTime: item.createTime, // 创建时间
            updateTime: item.updateTime, // 更新时间

            // 其他信息
            branchName: item.branchName || '-',
            remark: item.remark,
            updateUser: item.updateUser,

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

    // 补课考勤API
    async handleMakeupAttendanceAPI(makeupId, params) {
      try {
        const data = {
          actualDate: params.actualDate,
          actualStartTime: params.actualStartTime,
          actualEndTime: params.actualEndTime,
          makeupId: makeupId,
          studentId: params.studentId,
          notes: params.notes,
          operatorId: this.userInfo?.id || '',
          operatorName: this.userInfo?.name || '',
          // 佳音业务线字段
          foreignTeacherId: params.foreignTeacherId,
          foreignTeacherMinutes: params.foreignTeacherMinutes,
          oralMinutes: params.oralMinutes,
          teacherId: params.teacherId
        }

        await One2ManyAttendanceApi.recordMakeupAttendance(makeupId, data)
        return true
      } catch (error) {
        this.$message.error(error || '补课考勤失败，请稍后重试')
        return false
      }
    },

    // 安排补课（约课）API
    async handleScheduleMakeupAPI(params) {
      try {
        const data = {
          attendanceId: params.attendanceId,
          expectedDate: params.expectedDate,
          expectedStartTime: params.expectedStartTime,
          expectedEndTime: params.expectedEndTime,
          makeupType: params.makeupType,
          notes: params.notes,
          operatorId: this.userInfo?.id || '',
          operatorName: this.userInfo?.name || '',
          originalSchedulingId: params.originalSchedulingId,
          studentId: params.studentId,
          teacherId: params.teacherId,
          foreignTeacherId: params.foreignTeacherId
        }

        await One2ManyAttendanceApi.scheduleMakeup(data)
        return true
      } catch (error) {
        this.$message.error(error || '安排补课失败，请稍后重试')
        return false
      }
    },

    // 修改约课时间API
    async handleUpdateMakeupScheduleAPI(makeupId, params) {
      try {
        const data = {
          expectedDate: params.expectedDate,
          expectedStartTime: params.expectedStartTime,
          expectedEndTime: params.expectedEndTime,
          notes: params.notes,
          operatorId: this.userInfo?.id || '',
          operatorName: this.userInfo?.name || ''
        }

        await One2ManyAttendanceApi.updateMakeupSchedule(makeupId, data)
        return true
      } catch (error) {
        this.$message.error(error || '修改约课时间失败，请稍后重试')
        return false
      }
    },

    // 批量取消补课安排API
    async handleBatchCancelMakeupAPI(makeupIds, notes) {
      try {
        const params = {
          makeupIds: makeupIds,
          notes: notes
        }
        await One2ManyAttendanceApi.batchCancelMakeupSchedule(params)
        return true
      } catch (error) {
        this.$message.error(error || '批量取消补课安排失败，请稍后重试')
        return false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.student-makeup-list {
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
