<template>
  <div class="schedule-management">
    <el-card>
      <div class="page-title">1对多排课</div>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
        <!-- 校区 -->
        <el-form-item style="margin-right: 10px;" prop="branchId">
          <el-select v-model="searchForm.branchId" :filterable="true" :remote="false" placeholder="请选择校区" size="small" style="width: 200px">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="item in teamBranchList" :key="item.id" :label="item.orgName" :value="item.id" />
          </el-select>
        </el-form-item>

        <!-- 授课状态 -->
        <el-form-item style="margin-right: 10px;">
          <el-select v-model="searchForm.courseCondition" placeholder="请选择授课状态" style="width:240px" size="small" multiple clearable>
            <el-option label="未开课" :value="0"></el-option>
            <el-option label="进行中" :value="1"></el-option>
            <el-option label="已结课" :value="2"></el-option>
          </el-select>
        </el-form-item>

        <!-- 班级 -->
        <el-form-item style="margin-right: 10px;">
          <el-input v-model="searchForm.courseSearch" placeholder="请输入班级名称/简称/编码" size="small" style="width: 200px" clearable></el-input>
        </el-form-item>

        <!-- 老师 -->
        <el-form-item style="margin-right: 10px;">
          <HiAsyncSelector
            v-model="searchForm.teacherId"
            dict-key="teacher"
            :defaultWord="searchForm.teacherName"
            :param="{ buId: userBaseInfo.buId, size: 100 }"
            style="width: 200px"
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

        <!-- 班主任 -->
        <el-form-item style="margin-right: 10px;">
          <HiAsyncSelector
            v-model="searchForm.courseManagerId"
            dict-key="employee"
            :defaultWord="searchForm.courseManagerName"
            placeholder="请输入班主任姓名/编码"
            style="width: 200px"
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

        <!-- 科目 -->
        <el-form-item style="margin-right: 10px;">
          <HiDict v-model="searchForm.subjectId" dict-key="subject" placeholder="请选择科目" size="small" style="width: 150px" clearable />
        </el-form-item>

        <!-- 班型 -->
        <el-form-item style="margin-right: 10px;">
          <el-select clearable multiple v-model="searchForm.classTypeCodes" placeholder="请选择班型" style="width: 180px" size="small" collapse-tags>
            <el-option v-for="item in classTypeList" :key="item.subCourseKind" :label="item.subCourseKindName" :value="item.subCourseKind"></el-option>
          </el-select>
        </el-form-item>

        <!-- 教材进度 -->
        <el-form-item style="margin-right: 10px;" v-if="joyEnglishTextbookList && joyEnglishTextbookList.length > 0">
          <el-select v-model="searchForm.textbook" placeholder="请选择教材进度" size="small" style="width: 200px" clearable>
            <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
          <el-button @click="handleReset" size="small">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 标题和导出按钮 -->
      <div class="header">
        <h2 class="title">班级列表</h2>
        <div class="operation-btns">
          <el-button size="small" @click="handleExportStudentStatus" v-if="hasButtonRight('one2many-export-student-status')">导出学员状态报表</el-button>
          <el-button size="small" @click="handleExportClassDetail" v-if="hasButtonRight('one2many-export-class-detail')">导出班级明细报表</el-button>
          <el-button size="small" type="primary" @click="handleCustomColumn">自定义列设置</el-button>
        </div>
      </div>

      <!-- 班级列表表格 -->
      <VxeTableCustom
        table-id="one2many-schedule-class-table"
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
    </el-card>
  </div>
</template>

<script>
import { CommonApi } from '@api'
import { mapState, mapActions } from 'vuex'
import { createTableHeightCalculator } from '@/utils'
import One2ManyApi from '@/services/tacenter/one2many'
import { systemApi } from '@/services'
import VxeTableCustom from '@/components/table/vxe-table.vue'

export default {
  name: 'ScheduleManagement',
  components: {
    VxeTableCustom
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo'])
  },
  data() {
    return {
      // 搜索表单
      searchForm: {
        branchId: '', // API文档字段名
        courseCondition: [0, 1], // 授课状态：0：未开课,1：进行中,2：已结课，默认选中未开课和进行中
        courseSearch: '', // 班级搜索（班级名称/简称/编码）
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: '',
        classTypeCodes: [], // 班型筛选
        textbook: '', // 教材进度
        currentPage: 1,
        pageSize: 10
      },
      loading: false,
      // 校区列表
      teamBranchList: [],
      // 班型列表
      classTypeList: [],
      // 佳音教材列表
      joyEnglishTextbookList: [],
      // 表格数据
      tableData: [],
      total: 0,
      // 表格高度相关
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      // 表格列配置
      columns: [
        {
          prop: 'courseName',
          label: '班级名称',
          width: 200,
          fixed: 'left'
        },
        {
          prop: 'shortName',
          label: '班级简称',
          width: 100
        },
        {
          prop: 'classTypeCodeName',
          label: '班型',
          width: 100
        },
        {
          prop: 'textbookName',
          label: '当前进度',
          width: 100
        },
        {
          prop: 'teacherName',
          label: '老师',
          width: 120
        },
        {
          prop: 'courseManagerName',
          label: '班主任',
          width: 120
        },
        {
          prop: 'branchName',
          label: '校区',
          width: 100
        },
        {
          prop: 'readNum',
          label: '在读',
          width: 80,
          align: 'center',
          titleSuffix: {
            content: '当前班级学员状态为"在读"的学员数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          },
          render: (h, { row }) => {
            return h('span', row.readNum || 0)
          }
        },
        {
          prop: 'newNum',
          label: '新生',
          width: 80,
          align: 'center',
          titleSuffix: {
            content: '当前班级学员状态为"新生"的学员数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          },
          render: (h, { row }) => {
            return h('span', row.newNum || 0)
          }
        },
        {
          prop: 'stopNum',
          label: '停课',
          width: 80,
          align: 'center',
          titleSuffix: {
            content: '当前班级学员状态为"停课"的学员数',
            icon: 'vxe-icon-warning-circle',
            iconSize: '12px',
            iconStatus: 'info',
            iconColor: '#999'
          },
          render: (h, { row }) => {
            return h(
              'span',
              {
                style: { color: row.stopNum > 0 ? '#f56c6c' : '#333' }
              },
              row.stopNum || 0
            )
          }
        },
        {
          prop: 'attendClassPeriod',
          label: '上课周期',
          width: 240,
          showOverflowTooltip: true,
          render: (h, { row }) => {
            const formatSchedulePeriod = this.formatSchedulePeriod(row)
            return h('span', formatSchedulePeriod)
          }
        },
        {
          prop: 'startDate',
          label: '开课日期',
          width: 120
        },
        {
          prop: 'endDate',
          label: '结课日期',
          width: 120
        },

        {
          prop: 'courseConditionName',
          label: '授课状态',
          fixed: 'right',
          width: 100,
          render: (h, { row }) => {
            const statusMap = {
              未开课: 'info',
              进行中: 'success',
              已结课: 'danger'
            }
            const type = statusMap[row.courseConditionName] || 'info'

            return h(
              'el-tag',
              {
                props: {
                  size: 'small',
                  type: type
                }
              },
              row.courseConditionName || '-'
            )
          }
        },
        {
          prop: 'courseNo',
          label: '班级编码',
          width: 180
        },
        {
          prop: 'subjectName',
          label: '科目',
          width: 100
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
          label: '操作',
          width: 100,
          fixed: 'right',
          render: (h, { row }) => {
            return h(
              'el-button',
              {
                props: {
                  type: 'text',
                  size: 'small'
                },
                on: {
                  click: event => {
                    event.stopPropagation()
                    this.handleDetail(row)
                  }
                }
              },
              '详情'
            )
          }
        }
      ]
    }
  },
  created() {
    // 从 sessionStorage 中获取搜索条件，如果有则使用缓存的条件
    try {
      const cachedForm = JSON.parse(sessionStorage.getItem('one2many_schedule_search_form'))
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
    this.getOrganizationBranchList()
    this.getClassSetList()
    this.getJoyEnglishTextbookList()
    this.loadClassList()
    // 添加页面刷新事件监听
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  beforeDestroy() {
    // 停止监听并清理资源
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
      sessionStorage.removeItem('one2many_schedule_search_form')
    },

    // 初始化表格高度计算器
    initTableHeightCalculator() {
      this.tableHeightCalculator = createTableHeightCalculator({
        reservedHeight: 200,
        minHeight: 400,
        maxHeight: 800,
        debounceDelay: 150
      })

      this.tableHeightCalculator.addCallback(height => {
        this.tableMaxHeight = height
      })

      this.tableHeightCalculator.startListening()
    },

    // 初始化默认值
    initializeDefaultValues() {
      this.searchForm.branchId = this.userBaseInfo?.branchId || ''
    },

    // 获取校区列表
    async getOrganizationBranchList() {
      this.loading = true
      try {
        let res = await CommonApi.getOrganizationBranchList()
        this.loading = false
        this.teamBranchList = res.data || []
      } catch (e) {
        this.loading = false
        e && this.$message.error(e)
      }
    },

    // 获取班型列表
    async getClassSetList() {
      try {
        const res = await One2ManyApi.getClassSetList()
        this.classTypeList = res || []
      } catch (error) {
        this.$message.error('获取班型列表失败')
      }
    },

    // 获取佳音教材列表
    async getJoyEnglishTextbookList() {
      try {
        const res = await systemApi.basedata.getJoyEnglishTextbook({
          buId: this.userBaseInfo.buId,
          pageSize: 99999, // 获取所有教材
          currentPage: 1
        })

        // 筛选状态为ENABLED的教材
        const enabledTextbooks = (res || []).filter(textbook => textbook.status === 'ENABLED')

        // 在列表页面，显示所有启用的教材供筛选
        this.joyEnglishTextbookList = enabledTextbooks
      } catch (error) {
        this.$message.error('获取教材列表失败')
      }
    },

    // 搜索
    handleSearch() {
      this.searchForm.currentPage = 1
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_schedule_search_form', JSON.stringify(this.searchForm))
      this.loadClassList()
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        branchId: '',
        courseCondition: [0, 1], // 重置时也默认选中未开课和进行中
        courseSearch: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: '',
        classTypeCodes: [],
        textbook: '',
        currentPage: 1,
        pageSize: 10
      }
      this.initializeDefaultValues()

      // 清除缓存的查询条件
      sessionStorage.removeItem('one2many_schedule_search_form')

      this.$nextTick(() => {
        this.handleSearch()
      })
    },

    // 分页变化处理函数
    handlePageChange() {
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_schedule_search_form', JSON.stringify(this.searchForm))
      this.loadClassList()
    },

    // 加载班级列表
    async loadClassList() {
      this.loading = true
      try {
        // 调用真实API接口
        const res = await One2ManyApi.getScheduleCourseList(this.searchForm)

        this.tableData = res?.list || []
        this.total = res?.total || 0

        // 在数据加载完成后初始化表格高度计算器
        this.$nextTick(() => {
          if (!this.tableHeightCalculator) {
            this.initTableHeightCalculator()
          }
        })
      } catch (error) {
        this.$message.error('获取班级列表失败')
      } finally {
        this.loading = false
      }
    },

    // 表格行点击
    handleRowClick(row) {},

    // 详情按钮
    handleDetail(row) {
      // 构建详情页面的路由信息
      const detailRoute = {
        name: 'one2many-schedule-detail',
        query: { id: row.id }
      }

      // 直接跳转到详情页面，TagView会自动处理标签页的添加和更新
      this.$router.push(detailRoute)
    },

    // 导出学员状态报表
    async handleExportStudentStatus() {
      try {
        const params = {
          ...this.searchForm,
          buId: this.userBaseInfo.buId
        }

        const res = await One2ManyApi.getStudentStatusReport(params)

        if (res) {
          // 构建下载URL
          const downloadUrl = `${window.location.origin}/api/franchiser/report/download/tempFile?fileName=${res}`
          window.location.href = downloadUrl
          this.$message.success('导出成功')
        }
      } catch (error) {
        this.$message.error(error || '导出失败，请稍后重试')
      }
    },

    // 导出班级明细报表
    async handleExportClassDetail() {
      try {
        const params = {
          ...this.searchForm,
          buId: this.userBaseInfo.buId
        }

        const res = await One2ManyApi.getClassDetailReport(params)

        if (res) {
          // 构建下载URL
          const downloadUrl = `${window.location.origin}/api/franchiser/report/download/tempFile?fileName=${res}`
          window.location.href = downloadUrl
          this.$message.success('导出成功')
        }
      } catch (error) {
        this.$message.error(error || '导出失败，请稍后重试')
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

    // 格式化排课周期
    formatSchedulePeriod(classData) {
      const coursePeriodDtoList = classData.coursePeriodDtoList

      if (!coursePeriodDtoList || !Array.isArray(coursePeriodDtoList) || coursePeriodDtoList.length === 0) {
        return classData.attendClassPeriod || '-'
      }

      // 星期几的映射
      const weekMap = {
        1: '一',
        2: '二',
        3: '三',
        4: '四',
        5: '五',
        6: '六',
        7: '日'
      }

      // 格式化每个排课周期
      const periodTexts = coursePeriodDtoList
        .map(period => {
          if (!period.weekNum || !Array.isArray(period.weekNum) || period.weekNum.length === 0) {
            return ''
          }

          // 处理多个星期几
          const weekTexts = period.weekNum
            .map(weekNumber => {
              const weekText = weekMap[weekNumber]
              return weekText ? `周${weekText}` : ''
            })
            .filter(text => text)

          // 格式化时间，将-替换为~
          const courseTime = period.courseTime ? period.courseTime.replace('-', '~') : ''

          if (weekTexts.length > 0 && courseTime) {
            return `${weekTexts.join('、')}${courseTime}`
          }

          return ''
        })
        .filter(text => text)

      // 用、连接所有排课周期，最后加上"每"前缀
      return periodTexts.length > 0 ? `每${periodTexts.join('、')}` : classData.attendClassPeriod || '-'
    }
  }
}
</script>

<style lang="scss" scoped>
.schedule-management {
  .page-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .search-form {
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
    margin-bottom: 20px;

    .el-form-item {
      margin-bottom: 10px;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .title {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
    }

    .operation-btns {
      .el-button {
        margin-left: 10px;

        &:first-child {
          margin-left: 0;
        }
      }
    }
  }

  .g-mt {
    margin-top: 20px;
  }

  .g-tar {
    text-align: right;
  }
}

// 表格相关样式
::v-deep .el-table {
  .el-table__header {
    th {
      background-color: #f8f9fa;
      color: #333;
      font-weight: 600;
    }
  }

  .el-table__body {
    tr:hover {
      background-color: #f5f7fa;
    }
  }
}

// 筛选表单样式优化
::v-deep .search-form {
  .el-form-item__label {
    font-weight: 500;
    color: #333;
  }

  .el-select .el-input__inner,
  .el-input__inner {
    border-radius: 4px;
  }
}
</style>
