<template>
  <div class="class-list-table">
    <!-- 操作按钮区域 -->
    <div class="operation-section">
      <div class="operation-left">
        <!-- 已结课的时候禁用 -->
        <el-button type="primary" size="small" @click="$emit('periodic-schedule')" :disabled="classData.courseConditionName === '已结课'">周期排课</el-button>
        <el-button size="small" @click="handleCalendarSchedule" :disabled="classData.courseConditionName === '已结课'">日历排课</el-button>
        <el-dropdown :disabled="selectedClasses.length === 0 || classData.courseConditionName === '已结课'" trigger="hover" @command="handleBatchCommand">
          <el-button size="small" :disabled="selectedClasses.length === 0 || classData.courseConditionName === '已结课'">
            更多批量操作<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="batchDelete">批量删除课次</el-dropdown-item>
            <el-dropdown-item v-if="hasApplicableTextbooks" command="batchMaterial">批量调整教材单元进度</el-dropdown-item>
            <el-dropdown-item command="batchManager">批量调整班主任</el-dropdown-item>
            <el-dropdown-item command="batchTeacher">批量调整老师</el-dropdown-item>
            <!-- <el-dropdown-item command="batchForeignTeacher">批量调整外教</el-dropdown-item> -->
          </el-dropdown-menu>
        </el-dropdown>
        <el-button style="margin-left: 10px;" size="small" type="primary" @click="handleCustomColumn">自定义列设置</el-button>
      </div>

      <!-- 筛选条件 -->
      <div class="operation-right">
        <el-form :model="filter" :inline="true" size="small" class="filter-form">
          <el-form-item>
            <el-date-picker
              v-model="filter.timeRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="上课开始"
              end-placeholder="结束时间"
              value-format="yyyy-MM-dd HH:mm"
              format="yyyy-MM-dd HH:mm"
              style="width: 330px"
              :default-time="['00:00:00', '23:59:59']"
              @change="handleTimeRangeChange"
            />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="filter.attendType"
              placeholder="请选择课次考勤状态"
              style="width: 150px"
              clearable
              multiple
              collapse-tags
              @change="handleAttendTypeChange"
            >
              <el-option label="已考勤" :value="4"></el-option>
              <el-option label="部分考勤" :value="3"></el-option>
              <el-option label="未考勤" :value="2"></el-option>
              <el-option label="未开始" :value="1"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="joyEnglishTextbookList && joyEnglishTextbookList.length > 0">
            <el-select v-model="filter.textbook" placeholder="请选择教材进度" style="width: 150px" clearable @change="$emit('filter-change', filter)">
              <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id"> </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 课次列表表格 -->
    <VxeTableCustom
      table-id="one2many-class-list-table"
      stripe
      :columns="columns"
      :data="data"
      v-loading="loading"
      :max-height="tableMaxHeight"
      ref="vxeTable"
      @selection-change="handleSelectionChange"
    />

    <!-- 分页 -->
    <div class="g-mt g-tar" v-if="data.length > 0">
      <hi-pagination :total="total" :current-page.sync="currentPage" :page-size.sync="pageSize" />
    </div>

    <!-- 日历排课抽屉 -->
    <CalendarScheduleDrawer
      :visible.sync="calendarScheduleVisible"
      :class-data="currentClassData"
      :joy-english-textbook-list="joyEnglishTextbookList"
      @schedule-confirm="handleScheduleConfirm"
    />

    <!-- 排课确认弹窗 -->
    <ScheduleConfirmDialog :visible.sync="scheduleConfirmVisible" :scheduleData="scheduleConfirmData" @success="handleScheduleSuccess" />

    <!-- 课次详情抽屉 -->
    <ClassDetailDrawer
      :visible.sync="classDetailVisible"
      :schedulingId="currentClassData.id"
      :classData="currentClassData"
      :disabled="classData.courseConditionName === '已结课'"
      @refresh="handleRefresh"
    />

    <!-- 课次考勤抽屉 -->
    <ClassAttendanceDrawer :visible.sync="attendanceDrawerVisible" :class-data="currentAttendanceData" source="class" @refresh="handleRefresh" />
  </div>
</template>

<script>
import { createTableHeightCalculator } from '@/utils'
import One2ManyApi from '@/services/tacenter/one2many'
import CalendarScheduleDrawer from './CalendarScheduleDrawer.vue'
import ScheduleConfirmDialog from './ScheduleConfirmDialog.vue'
import ClassDetailDrawer from './ClassDetailDrawer.vue'
import ClassAttendanceDrawer from '../../attendance/components/class-attendance/ClassAttendanceDrawer.vue'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import dayjs from 'dayjs'

export default {
  name: 'ClassListTable',
  components: {
    CalendarScheduleDrawer,
    ScheduleConfirmDialog,
    ClassDetailDrawer,
    ClassAttendanceDrawer,
    VxeTableCustom
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    total: {
      type: Number,
      default: 0
    },
    pagination: {
      type: Object,
      default: () => ({
        currentPage: 1,
        pageSize: 50
      })
    },
    // 佳音教材列表
    joyEnglishTextbookList: {
      type: Array,
      default: () => []
    },
    // 班级数据
    classData: {
      type: Object,
      default: () => ({})
    },
    // 班级ID
    classId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      selectedClasses: [],
      filter: {
        timeRange: this.getDefaultTimeRange(),
        startDate: this.getDefaultStartDate(),
        endDate: this.getDefaultEndDate(),
        attendType: [], // 课次考勤状态(多选)
        textbook: '' // 教材
      },
      tableMaxHeight: 500, // 默认表格最大高度
      tableHeightCalculator: null, // 表格高度计算器
      attendTypeDebounceTimer: null, // 课次考勤状态防抖定时器
      // 日历排课相关
      calendarScheduleVisible: false,
      scheduleConfirmVisible: false,
      scheduleConfirmData: {},
      // 课次详情相关
      classDetailVisible: false,
      currentClassData: {},
      // 课次考勤相关
      attendanceDrawerVisible: false,
      currentAttendanceData: {},
      // 表格列配置
      columns: [
        {
          type: 'selection',
          width: 55,
          fixed: 'left'
        },
        {
          type: 'index',
          label: '序号',
          width: 50,
          fixed: 'left'
        },
        {
          prop: 'courseDateStr',
          label: '上课日期',
          width: 130
        },
        {
          prop: 'courseTime',
          label: '上课时间',
          width: 140,
          // startTime endTime
          render: (h, { row }) => {
            if (!row.startTime || !row.endTime) {
              return h('span', '-')
            }
            return h('span', row.startTime + '~' + row.endTime)
          }
        },
        {
          prop: 'teacherName',
          label: '教师',
          width: 150
        },
        {
          prop: 'courseManagerName',
          label: '班主任',
          width: 120
        },
        {
          prop: 'foreignTeacherName',
          label: '外教',
          width: 120
        },
        {
          prop: 'textbookName',
          label: '教材单元',
          width: 120,
          // 显示 TJ4-U1、U2、U3
          // unit
          // :
          // "1,2"
          render: (h, { row }) => {
            if (!row.textbookName) {
              return h('span', '-')
            }

            if (row.textbookName && !row.unit) {
              return h('span', row.textbookName)
            }

            return h(
              'span',
              row.textbookName +
                '-' +
                row.unit
                  ?.split(',')
                  .map(item => `U${item}`)
                  .join('、')
            )
          }
        },
        {
          prop: 'scheduleNum',
          label: '已排课',
          width: 90,
          align: 'center',
          titleSuffix: {
            content: '当前课次已排课学员数量，班级学员如有适用订单，系统将自动排近40天的数据',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'listenNum',
          label: '试听',
          width: 80,
          align: 'center',
          titleSuffix: {
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999',
            content: '当前课次试听学员数，不计入已排课学员数'
          }
        },
        // {
        //   prop: 'noAttendNum',
        //   label: '待补课',
        //   width: 90,
        //   align: 'center',
        //   titleSuffix: {
        //     content: '当前课次请假还未补课的学员数',
        //     icon: 'vxe-icon-warning-circle',
        //     iconSize: '12px',
        //     iconStatus: 'info',
        //     iconColor: '#999'
        //   }
        // },
        {
          prop: 'attendRate',
          label: '当天出勤率',
          width: 110,
          align: 'center',
          titleSuffix: {
            content: '（正常上课（不含已补课）学员/已排课学员数）*100%',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          },
          render: (h, { row }) => {
            return h('span', row.attendRate ? `${(row.attendRate * 100).toFixed(2)}%` : row.attendStatus === 1 || row.attendStatus === 0 ? '-' : '0%')
          }
        },
        {
          prop: 'makeupAttendRate',
          label: '补课出勤率',
          width: 110,
          align: 'center',
          titleSuffix: {
            content: '（正常上课（含已补课）学员/已排课学员数）*100%',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          },
          render: (h, { row }) => {
            return h(
              'span',
              {
                style: {
                  color: row.makeupAttendRate ? (parseFloat(row.makeupAttendRate * 100) >= 100 ? '#333' : '#FFB816') : '#333'
                }
              },
              row.makeupAttendRate ? `${(row.makeupAttendRate * 100).toFixed(2)}%` : row.attendStatus === 1 || row.attendStatus === 0 ? '-' : '0%'
            )
          }
        },
        {
          prop: 'attendStatus',
          label: '课次考勤状态',
          width: 100,
          fixed: 'right',
          render: (h, { row }) => {
            // 课次考勤状态映射：4-已考勤、3-部分考勤、2-未考勤、1-未开始、0-空状态
            const statusMap = {
              4: { text: '已考勤', type: 'success' },
              3: { text: '部分考勤', type: 'warning' },
              2: { text: '未考勤', type: 'danger' },
              1: { text: '未开始', type: 'info' }
            }
            const status = statusMap[row.attendStatus]

            // 状态为0时直接显示"-"，不使用tag
            if (!status || row.attendStatus === 0) {
              return h('span', '-')
            }

            return h(
              'el-tag',
              {
                props: {
                  type: status.type,
                  size: 'small'
                }
              },
              status.text
            )
          }
        },
        {
          label: '操作',
          minWidth: 150,
          fixed: 'right',
          render: (h, { row }) => {
            const buttons = [
              h(
                'el-button',
                {
                  props: { type: 'text', size: 'small' },
                  on: { click: () => this.handleClassDetail(row) }
                },
                '详情'
              )
            ]

            // 考勤按钮 - 仅当考勤状态不为空且不为未开始时显示
            if (row.attendStatus && row.attendStatus !== 1 && row.attendStatus !== 0 && row.attendStatus !== 4) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: { type: 'text', size: 'small' },
                    style: { marginLeft: '0px' },
                    on: { click: () => this.handleAttendance(row) }
                  },
                  '考勤'
                )
              )
            }

            // 只有在非已结课状态下才显示更多按钮
            if (this.classData.courseConditionName !== '已结课') {
              buttons.push(
                h(
                  'el-dropdown',
                  {
                    props: { trigger: 'click' },
                    on: { command: command => this.$emit('class-command', command, row) }
                  },
                  [
                    h(
                      'el-button',
                      {
                        props: { type: 'text', size: 'small' }
                      },
                      ['更多', h('i', { class: 'el-icon-arrow-down el-icon--right' })]
                    ),
                    h(
                      'el-dropdown-menu',
                      { slot: 'dropdown' },
                      [
                        h('el-dropdown-item', { props: { command: 'adjustTime' } }, '调整上课时间'),
                        h('el-dropdown-item', { props: { command: 'deleteClass' } }, '删除课次'),
                        // 只有当班型有适用教材时才显示调整教材单元进度选项
                        this.hasApplicableTextbooks ? h('el-dropdown-item', { props: { command: 'adjustMaterial' } }, '调整教材单元进度') : null,
                        h('el-dropdown-item', { props: { command: 'adjustManager' } }, '调整班主任'),
                        h('el-dropdown-item', { props: { command: 'adjustTeacher' } }, '调整老师'),
                        h('el-dropdown-item', { props: { command: 'adjustForeignTeacher' } }, '调整外教')
                      ].filter(Boolean)
                    )
                  ]
                )
              )
            }

            return h('div', buttons)
          }
        }
      ]
    }
  },
  computed: {
    currentPage: {
      get() {
        return this.pagination.currentPage
      },
      set(val) {
        // 避免重复触发
        if (val !== this.pagination.currentPage) {
          this.$emit('update-pagination', { currentPage: val, pageSize: this.pagination.pageSize })
        }
      }
    },
    pageSize: {
      get() {
        return this.pagination.pageSize
      },
      set(val) {
        // 避免重复触发
        if (val !== this.pagination.pageSize) {
          this.$emit('update-pagination', { currentPage: 1, pageSize: val }) // 改变每页条数时重置到第一页
        }
      }
    },
    // 判断当前班型是否有适用教材
    hasApplicableTextbooks() {
      if (!this.classData?.classTypeCodeName || !this.joyEnglishTextbookList || this.joyEnglishTextbookList.length === 0) {
        return false
      }

      const classTypeName = this.classData.classTypeCodeName

      // 检查是否有教材的subCourseKindList中包含当前班型
      return this.joyEnglishTextbookList.some(textbook => {
        if (!textbook.subCourseKindList || !Array.isArray(textbook.subCourseKindList)) {
          return false
        }

        return textbook.subCourseKindList.some(courseKind => {
          return courseKind.subCourseKindName === classTypeName
        })
      })
    }
  },
  mounted() {
    // 组件挂载后触发默认筛选条件
    this.$emit('filter-change', this.filter)
  },
  beforeDestroy() {
    // 停止监听并清理资源
    this.destroyTableHeightCalculator()

    // 清理防抖定时器
    if (this.attendTypeDebounceTimer) {
      clearTimeout(this.attendTypeDebounceTimer)
      this.attendTypeDebounceTimer = null
    }
  },
  methods: {
    // 获取默认开始日期（30天前）
    getDefaultStartDate() {
      return dayjs()
        .subtract(30, 'day')
        .startOf('day')
        .format('YYYY-MM-DD HH:mm')
    },

    // 获取默认结束日期（30天后）
    getDefaultEndDate() {
      return dayjs()
        .add(30, 'day')
        .endOf('day')
        .format('YYYY-MM-DD HH:mm')
    },

    // 获取默认时间范围
    getDefaultTimeRange() {
      return [this.getDefaultStartDate(), this.getDefaultEndDate()]
    },

    // 初始化表格高度计算器
    initTableHeightCalculator() {
      if (!this.tableHeightCalculator) {
        // 创建表格高度计算器
        this.tableHeightCalculator = createTableHeightCalculator({
          reservedHeight: 300, // 预留高度
          minHeight: 400, // 最小高度
          maxHeight: 800, // 最大高度
          debounceDelay: 150 // 防抖延迟
        })

        // 添加高度变化回调
        this.tableHeightCalculator.addCallback(height => {
          this.tableMaxHeight = height
        })

        // 开始监听窗口大小变化
        this.tableHeightCalculator.startListening()
      }
    },

    // 销毁表格高度计算器
    destroyTableHeightCalculator() {
      if (this.tableHeightCalculator) {
        this.tableHeightCalculator.stopListening()
        this.tableHeightCalculator = null
      }
    },

    // 表格选择变化
    handleSelectionChange() {
      const rows = this.$refs.vxeTable.getCheckboxRecords()
      this.selectedClasses = rows
      this.$emit('selection-change', rows)
    },

    // 批量操作命令
    handleBatchCommand(command) {
      this.$emit('batch-command', command, this.selectedClasses)
    },

    // 处理日历排课
    handleCalendarSchedule() {
      // 使用从父组件传入的班级数据
      this.currentClassData = this.classData
      this.calendarScheduleVisible = true
    },

    // 处理课次详情
    handleClassDetail(row) {
      this.currentClassData = row
      this.classDetailVisible = true
    },

    // 处理考勤
    handleAttendance(row) {
      // 构建课次考勤数据，与 ClassAttendanceList.vue 保持一致
      this.currentAttendanceData = {
        schedulingId: row.id, // 课次ID
        classDate: row.courseDate,
        classTime: row.startTime && row.endTime ? `${row.startTime}-${row.endTime}` : '',
        className: this.classData.className || '',
        courseManagerName: row.courseManagerName || '',
        teacherName: row.teacherName || '',
        ...row
      }
      this.attendanceDrawerVisible = true
    },

    // 处理排课确认
    handleScheduleConfirm(scheduleData) {
      this.scheduleConfirmData = scheduleData
      this.calendarScheduleVisible = false
      this.scheduleConfirmVisible = true
    },

    // 处理排课成功
    handleScheduleSuccess() {
      this.scheduleConfirmVisible = false
      this.$emit('refresh') // 通知父组件刷新数据
    },

    // 处理时间范围变化
    handleTimeRangeChange(timeRange) {
      this.filter.timeRange = timeRange
      if (timeRange && timeRange.length === 2) {
        this.filter.startDate = timeRange[0]
        this.filter.endDate = timeRange[1]
      } else {
        this.filter.startDate = ''
        this.filter.endDate = ''
      }
      this.$emit('filter-change', this.filter)
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

    // 处理课次考勤状态变化（防抖）
    handleAttendTypeChange(value) {
      // 清除之前的定时器
      if (this.attendTypeDebounceTimer) {
        clearTimeout(this.attendTypeDebounceTimer)
      }

      // 设置新的防抖定时器
      this.attendTypeDebounceTimer = setTimeout(() => {
        this.$emit('filter-change', this.filter)
      }, 300)
    },

    // 处理课次详情抽屉关闭时的刷新事件
    handleRefresh() {
      // 通知父组件刷新课次列表数据
      this.$emit('refresh')
    }
  }
}
</script>

<style lang="scss" scoped>
.class-list-table {
  // 操作区域
  .operation-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .operation-left {
      .el-button {
        margin-right: 10px;

        &:last-child {
          margin-right: 0;
        }
      }
    }

    .filter-form {
      .el-form-item {
        margin-bottom: 0;
        margin-right: 15px;

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }

  // 通用样式
  .g-mt {
    margin-top: 20px;
  }

  .g-tar {
    text-align: right;
  }
}
</style>
