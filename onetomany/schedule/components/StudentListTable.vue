<template>
  <div class="student-list-table">
    <!-- 操作按钮区域 -->
    <div class="operation-section">
      <div class="operation-left">
        <!-- 已结课禁用 -->
        <el-button type="primary" size="small" @click="$emit('add-student')" :disabled="classData.courseConditionName === '已结课'">添加学员</el-button>
        <el-dropdown :disabled="selectedStudents.length === 0 || classData.courseConditionName === '已结课'" trigger="hover" @command="handleBatchCommand">
          <el-button size="small" :disabled="selectedStudents.length === 0"> 更多批量操作<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="batchSuspend">批量停课</el-dropdown-item>
            <el-dropdown-item command="batchResume">批量复课</el-dropdown-item>
            <el-dropdown-item command="batchTransfer">批量转班</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-button style="margin-left: 10px;" size="small" type="primary" @click="handleCustomColumn">自定义列设置</el-button>
      </div>

      <!-- 筛选条件 -->
      <div class="operation-right">
        <el-form :model="filter" :inline="true" size="small" class="filter-form">
          <el-form-item>
            <AsyncRemoteInput
              clearable
              :inputValue="filter.searchInfo"
              placeholder="学员姓名/编码/手机号"
              :inputKey="'studentName'"
              dict="student"
              ref="studentSearchField"
              @handleSelect="selectStudent"
              style="width: 200px"
              size="small"
            />
          </el-form-item>
          <el-form-item>
            <RangeInput ref="rangeInput" v-model="filter.courseSurplusRange" placeholder="剩余可用小时数" @change="handleRangeChange" />
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="filter.studentStatus"
              placeholder="班级学员状态"
              style="width: 150px"
              clearable
              multiple
              collapse-tags
              @change="emitFilterChange"
            >
              <!-- 选项含：新生、在读、停课、转班、流失、结课、毕业； -->
              <el-option label="新生" :value="6"></el-option>
              <el-option label="在读" :value="1"></el-option>
              <el-option label="停课" :value="3"></el-option>
              <el-option label="转班" :value="4"></el-option>
              <el-option label="流失" :value="2"></el-option>
              <el-option label="结课" :value="7"></el-option>
              <el-option label="毕业" :value="5"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="emitFilterChange" size="small">查询</el-button>
            <el-button @click="handleReset" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 学员列表表格 -->
    <div class="table-container">
      <VxeTableCustom
        table-id="one2many-student-list-table"
        stripe
        :columns="columns"
        :data="data"
        v-loading="loading"
        :max-height="tableMaxHeight"
        ref="vxeTable"
        @selection-change="handleSelectionChange"
      />
    </div>

    <!-- 分页 -->
    <div class="g-mt g-tar" v-if="data.length > 0">
      <hi-pagination :total="total" :current-page.sync="currentPage" :page-size.sync="pageSize" />
    </div>

    <!-- 学员画像抽屉 -->
    <StudentProfileDrawer ref="studentProfileDrawer" />
  </div>
</template>

<script>
import AsyncRemoteInput from '@/components/asyncRemoteInput'
import StudentProfileDrawer from '@/views/student-manage/search/components/StudentProfileDrawer.vue'
import { createTableHeightCalculator } from '@/utils'
import One2ManyApi from '@/services/tacenter/one2many'
import dayjs from 'dayjs'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import RangeInput from '@/components/rangeInput'

export default {
  name: 'StudentListTable',
  components: {
    AsyncRemoteInput,
    StudentProfileDrawer,
    VxeTableCustom,
    RangeInput
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
        pageSize: 10
      })
    },
    // 班级数据
    classData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      selectedStudents: [],
      filter: {
        searchInfo: '', // 学员姓名/编码/手机号搜索
        courseSurplusRange: null, // 剩余课时范围
        courseSurplusStart: null, // 剩余课时最小值
        courseSurplusEnd: null, // 剩余课时最大值
        studentStatus: [6, 1, 3] // 默认选中新生、在读、停课
      },
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      // 表格列配置
      columns: [
        {
          type: 'selection',
          width: 55,
          fixed: 'left'
        },

        {
          prop: 'student',
          label: '学员',
          width: 120,
          fixed: 'left',
          showOverflowTooltip: true,
          render: (h, { row }) => {
            return h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                },
                on: {
                  click: () => this.handleStudentDetail(row)
                }
              },
              [
                h('img', {
                  attrs: {
                    src: row.headPic || require('@/assets/images/defalutavatar.png'),
                    alt: '头像'
                  },
                  style: {
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }
                }),
                h(
                  'div',
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }
                  },
                  [
                    h(
                      'div',
                      {
                        style: {
                          fontSize: '14px',
                          color: '#333',
                          lineHeight: '18px'
                        }
                      },
                      row.studentName
                    ),
                    row.englishName
                      ? h(
                          'div',
                          {
                            style: {
                              fontSize: '12px',
                              color: '#999',
                              lineHeight: '16px'
                            }
                          },
                          row.englishName
                        )
                      : null
                  ]
                )
              ]
            )
          }
        },

        {
          prop: 'courseAttend',
          label: '已耗时数',
          width: 100,
          align: 'center',
          titleSuffix: {
            content: '学员在当前班级已经考勤课次的小时数之和',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'courseAttendCount',
          label: '已耗次数',
          width: 100,
          align: 'center',
          titleSuffix: {
            content: '学员在当前班级已经考勤的课次数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'courseSchedule',
          label: '剩余可排小时数',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            const isLow = row.courseSchedule < 20
            return h(
              'span',
              {
                style: {
                  color: isLow ? '#f56c6c' : '#333'
                }
              },
              `${row.courseSchedule || 0}h`
            )
          }
        },
        {
          prop: 'courseSurplus',
          label: '剩余可用小时数',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            return h('span', `${row.courseSurplus || 0}h`)
          }
        },
        {
          prop: 'stopCourse',
          label: '停课时数',
          width: 100,
          align: 'center',
          titleSuffix: {
            content: '学员在当前班级已经停课课次的小时数之和，不含当次停课数据',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'stopCourseCount',
          label: '停课次数',
          width: 100,
          align: 'center',
          titleSuffix: {
            content: '学员在当前班级已经停课的课次数，不含当次停课数据',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          }
        },
        {
          prop: 'createTime',
          label: '入班日期',
          width: 140,
          // 格式化时间
          render: (h, { row }) => {
            return h('span', row.createTime ? dayjs(row.createTime).format('YYYY-MM-DD HH:mm') : '-')
          }
        },
        {
          prop: 'firstCanUseDate',
          label: '首课可排日期',
          width: 140
        },
        {
          prop: 'firstCourseDate',
          label: '首课日期',
          width: 120,
          render: (h, { row }) => {
            // if (row.studentStatus === 6) {
            //   // 新生
            //   return h('span', '-')
            // }
            return h('span', row.firstCourseDate || '-')
          }
        },
        {
          prop: 'textbook',
          label: '首课教材',
          width: 120,
          render: (h, { row }) => {
            // if (row.studentStatus === 6) {
            //   // 新生
            //   return h('span', { style: { color: '#999' } }, '')
            // }
            return h('span', row.textbook || '-')
          }
        },
        {
          prop: 'studentStatus',
          label: '班级学员状态',
          width: 120,
          fixed: 'right',
          render: (h, { row }) => {
            const statusMap = {
              6: { text: '新生', type: 'success' },
              1: { text: '在读', type: 'primary' },
              3: { text: '停课', type: 'warning' },
              4: { text: '转班', type: 'info' },
              2: { text: '流失', type: 'danger' },
              7: { text: '结课', type: 'info' },
              5: { text: '毕业', type: 'success' }
            }
            const status = statusMap[row.studentStatus] || { text: row.studentStatus, type: '' }

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
          prop: 'stopCourseDate',
          label: '停课日期',
          width: 120
        },
        {
          prop: 'recoverCourseDate',
          label: '复课日期',
          width: 120
        },
        {
          prop: 'stopCourseRemark',
          label: '停课原因',
          width: 150,
          showOverflowTooltip: true
        },
        {
          prop: 'courseAdmin',
          label: '学管师',
          width: 100
        },
        {
          prop: 'encoding',
          label: '学员编码',
          width: 180
        },
        {
          label: '操作',
          width: 170,
          fixed: 'right',
          render: (h, { row }) => {
            // 获取下拉菜单项，避免重复调用
            const dropdownItems = this.getDropdownItems(row)

            return h('div', [
              h(
                'el-button',
                {
                  props: { type: 'text', size: 'small' },
                  on: { click: () => this.handleStudentDetail(row) }
                },
                '详情'
              ),
              h(
                'el-button',
                {
                  props: { type: 'text', size: 'small' },
                  style: {
                    marginLeft: '0px'
                  },
                  on: { click: () => this.handleStudentPortrait(row) }
                },
                '画像'
              ),
              // 只有当有下拉菜单项时才显示更多按钮
              dropdownItems.length > 0 && this.classData.courseConditionName !== '已结课'
                ? h(
                    'el-dropdown',
                    {
                      props: { trigger: 'click' },
                      on: { command: command => this.handleStudentCommand(command, row) }
                    },
                    [
                      h(
                        'el-button',
                        {
                          props: { type: 'text', size: 'small' }
                        },
                        ['更多', h('i', { class: 'el-icon-arrow-down el-icon--right' })]
                      ),
                      h('el-dropdown-menu', { slot: 'dropdown' }, dropdownItems)
                    ]
                  )
                : null
            ])
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
    }
  },
  mounted() {
    // 表格高度计算器将由父组件控制初始化时机
  },
  beforeDestroy() {
    // 停止监听并清理资源
    this.destroyTableHeightCalculator()
  },
  methods: {
    // 初始化表格高度计算器
    initTableHeightCalculator() {
      if (this.tableHeightCalculator) {
        return // 避免重复初始化
      }

      this.tableHeightCalculator = createTableHeightCalculator({
        reservedHeight: 350, // 预留高度
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
    },

    // 销毁表格高度计算器
    destroyTableHeightCalculator() {
      if (this.tableHeightCalculator) {
        this.tableHeightCalculator.stopListening()
        this.tableHeightCalculator = null
      }
    },

    // 根据学员状态生成下拉菜单项
    getDropdownItems(row) {
      const items = []

      // 修改首课可排日期 - 仅新生显示
      if (row.studentStatus === 6) {
        // 新生
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'modifyFirstClassDate' } }, '修改首课可排日期'))
      }

      // 停课 - 仅在读显示
      if (row.studentStatus === 1) {
        // 在读
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'suspend' } }, '停课'))
      }

      // 修改停课信息、取消停课 - 仅停课状态显示
      if (row.studentStatus === 3) {
        // 停课
        items.push(
          this.$createElement('el-dropdown-item', { props: { command: 'modifySuspend' } }, '修改停课信息'),
          this.$createElement('el-dropdown-item', { props: { command: 'cancelSuspend' } }, '取消停课')
        )
      }

      // 复课 - 仅停课状态显示
      if (row.studentStatus === 3) {
        // 停课
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'resume' } }, '复课'))
      }

      // 移除 - 仅新生显示
      if (row.studentStatus === 6) {
        // 新生
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'remove' } }, '移除'))
      }

      // 转班 - 仅在读显示
      if (row.studentStatus === 1 || row.studentStatus === 6) {
        // 在读
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'transfer' } }, '转班'))
      }

      // 流失 - 仅在读、停课状态显示
      if (row.studentStatus === 1 || row.studentStatus === 3) {
        // 在读、停课
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'loss' } }, '流失'))
      }

      // 选择排课订单 -  新生 在读 停课显示
      if (row.studentStatus === 6 || row.studentStatus === 1 || row.studentStatus === 3) {
        items.push(this.$createElement('el-dropdown-item', { props: { command: 'selectOrders' } }, '排课订单'))
      }

      // 查看考勤 - 在读、停课状态显示
      items.push(this.$createElement('el-dropdown-item', { props: { command: 'viewAttendance' } }, '查看考勤'))

      return items
    },

    // 学员搜索
    selectStudent(data) {
      this.filter.searchInfo = data.studentName || ''
      // this.emitFilterChange()
    },

    // 重置筛选
    handleReset() {
      this.filter = {
        searchInfo: '',
        courseSurplusRange: null,
        courseSurplusStart: null,
        courseSurplusEnd: null,
        studentStatus: [6, 1, 3] // 新生、在读、停课
      }
      this.$refs.studentSearchField.clear()
      this.$refs.rangeInput.reset() // Call reset on RangeInput component
      this.emitFilterChange()
    },

    // 发送筛选变化事件
    emitFilterChange() {
      // 处理剩余课时筛选条件，确保空值传null而不是0
      const filterData = { ...this.filter }

      // 如果开始值为0或空，设为null
      if (filterData.courseSurplusStart === null || filterData.courseSurplusStart === '') {
        filterData.courseSurplusStart = null
      }

      // 如果结束值为0或空，设为null
      if (filterData.courseSurplusEnd === null || filterData.courseSurplusEnd === '') {
        filterData.courseSurplusEnd = null
      }

      this.$emit('filter-change', filterData)
    },

    // 处理弹出框显示
    handlePopoverShow() {
      // 当弹出框显示时，确保输入框有值
      if (this.filter.courseSurplusStart === null) {
        this.filter.courseSurplusStart = ''
      }
      if (this.filter.courseSurplusEnd === null) {
        this.filter.courseSurplusEnd = ''
      }
    },

    // 清空剩余课时范围
    handleClearRange() {
      this.filter.courseSurplusStart = null
      this.filter.courseSurplusEnd = null
    },

    // 处理RangeInput组件的change事件
    handleRangeChange(range) {
      this.filter.courseSurplusStart = range.startValue
      this.filter.courseSurplusEnd = range.endValue
    },

    // 表格选择变化
    handleSelectionChange() {
      const rows = this.$refs.vxeTable.getCheckboxRecords()
      this.selectedStudents = rows
      this.$emit('selection-change', rows)
    },

    // 批量操作命令
    handleBatchCommand(command) {
      this.$emit('batch-command', command, this.selectedStudents)
    },

    // 学员画像（参考detail.vue的实现）
    handleStudentPortrait(row) {
      this.$refs.studentProfileDrawer.show({
        ...row,
        id: row.studentId
      })
    },

    // 学员详情跳转（参考index.vue的实现）
    handleStudentDetail(row) {
      // 跳转v5学员主页
      window.open(`${process.env.VUE_APP_ERP_URL}?studentId=${row.studentId}#/studentMgr/studentIndex`, '_blank')
    },

    // 处理学员命令
    handleStudentCommand(command, row) {
      if (command === 'viewAttendance') {
        sessionStorage.removeItem('one2many_student_attendance_search_form')
        // 查看考勤：跳转到1对多考勤管理页面的"课次学员考勤"Tab，并传递学员和班级信息
        this.$router.push({
          name: 'one2many-attendance',
          query: {
            tab: 'studentAttendance', // 指定跳转到课次学员考勤Tab
            studentId: row.studentId,
            studentName: row.studentName,
            classId: this.classData.id, // 班级ID
            className: this.classData.courseName // 班级名称
          }
        })
      } else {
        // 其他命令传递给父组件处理
        this.$emit('student-command', command, row)
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
    }
  }
}
</script>

<style lang="scss" scoped>
.student-list-table {
  // 操作区域
  .operation-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;

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

  // 表格容器 - 确保横向滚动条显示
  .table-container {
    width: 100%;
    overflow-x: auto;

    ::v-deep .el-table {
      min-width: 100%;
    }

    ::v-deep .el-table__body-wrapper {
      overflow-x: auto;
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
