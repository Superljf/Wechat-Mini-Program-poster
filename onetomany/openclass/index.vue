<template>
  <div class="open-class-management">
    <el-card>
      <div class="page-title">1对多开班管理</div>

      <!-- 搜索表单 -->
      <el-form :model="searchForm" ref="searchForm" :inline="true" class="search-form">
        <el-form-item style="margin-right: 10px;" prop="branchId">
          <el-select v-model="searchForm.branchId" :filterable="true" :remote="false" placeholder="请选择校区" size="small" style="width: 200px">
            <el-option label="全部" value="all"></el-option>
            <el-option v-for="item in teamBranchList" :key="item.id" :label="item.orgName" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item style="margin-right: 10px;">
          <el-select
            clearable
            multiple
            v-model="searchForm.openCourseStatus"
            placeholder="请选择开班状态"
            class="input-common-width"
            style="width:200px"
            size="small"
            collapse-tags
          >
            <el-option label="等班中" :value="1"></el-option>
            <el-option label="建议开班" :value="2"></el-option>
            <el-option label="已开班" :value="3"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item style="margin-right: 10px;">
          <el-input
            v-model="searchForm.courseSearch"
            placeholder="请输入班级名称/简称/编码"
            class="input-common-width"
            size="small"
            style="width: 200px"
            clearable
          ></el-input>
        </el-form-item>

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

        <el-form-item style="margin-right: 10px;">
          <HiDict v-model="searchForm.subjectId" dict-key="subject" placeholder="请选择科目" size="small" style="width: 150px" clearable />
        </el-form-item>

        <el-form-item style="margin-right: 10px;">
          <el-select clearable multiple v-model="searchForm.classTypeCodes" placeholder="请选择班型" style="width:180px" size="small" collapse-tags>
            <el-option v-for="item in classTypeList" :key="item.subCourseKind" :label="item.subCourseKindName" :value="item.subCourseKind"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
          <el-button @click="handleReset" size="small">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="btns-wrap">
        <div class="btn-left">班级列表</div>
        <div class="btn-right">
          <el-button v-if="hasButtonRight('OpenClass.add.btn')" type="primary" size="small" @click="handleAddClass">新增班级</el-button>
          <el-button size="small" type="primary" @click="handleCustomColumn">自定义列设置</el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <VxeTableCustom
        table-id="one2many-open-class-table"
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

      <!-- 新增班级弹窗 -->
      <ClassFormDialog :visible.sync="showAddDialog" :is-edit="false" :class-type-list="classTypeList" @success="handleAddSuccess" />

      <!-- 删除确认弹窗 -->
      <el-dialog custom-class="delete-confirm-dialog" title="删除确认" :visible.sync="showDeleteDialog" width="400px" :close-on-click-modal="false">
        <div>
          <p>
            请确认是否删除 <span style="color: #4F8Bed">{{ currentDeleteClass.courseName }}</span> ？
          </p>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="showDeleteDialog = false" size="small">取消</el-button>
          <el-button type="primary" @click="handleDeleteConfirm" :loading="deleteLoading" size="small">确定删除</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { CommonApi } from '@api'
import { createTableHeightCalculator } from '@/utils'
import One2ManyApi from '@/services/tacenter/one2many'
import VxeTableCustom from '@/components/table/vxe-table.vue'
import ClassFormDialog from './components/ClassFormDialog.vue'

export default {
  name: 'OpenClassManagement',
  components: {
    VxeTableCustom,
    ClassFormDialog
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),
    columns() {
      return [
        {
          prop: 'courseNo',
          label: '班级编码',
          width: 180
        },
        {
          prop: 'courseName',
          label: '班级名称',
          minWidth: 140
        },
        {
          prop: 'shortName',
          label: '班级简称',
          width: 120
        },
        {
          prop: 'subCourseKindName',
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
          width: 100
        },
        {
          prop: 'courseManagerName',
          label: '班主任',
          width: 100
        },
        {
          label: '校区',
          width: 100,
          prop: 'branchName'
        },
        {
          prop: 'waitNum',
          label: '等班人数',
          width: 100
        },
        {
          prop: 'openCourseNum',
          label: '建议开班人数',
          width: 120
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 150
        },
        {
          prop: 'createUserName',
          label: '创建人',
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
          width: 100
        },
        {
          prop: 'openCourseStatus',
          label: '开班状态',
          fixed: 'right',
          width: 120,
          render: (h, { row }) => {
            const statusMap = {
              1: { text: '等班中', type: '' },
              2: { text: '建议开班', type: 'success' },
              3: { text: '已开班', type: 'info' }
            }
            const status = statusMap[row.openCourseStatus] || { text: row.openCourseStatusName || '-', type: '' }
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
          width: 120,
          fixed: 'right',
          render: (h, { row }) => {
            const buttons = [
              h(
                'el-button',
                {
                  props: {
                    type: 'text',
                    size: 'small'
                  },
                  on: {
                    click: () => this.handleDetail(row)
                  }
                },
                '详情'
              )
            ]

            // 已开班班级不显示删除按钮
            if (row.openCourseStatus !== 3) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: {
                      type: 'text',
                      size: 'small'
                    },
                    on: {
                      click: () => this.handleDelete(row)
                    }
                  },
                  '删除'
                )
              )
            }

            return h('div', buttons)
          }
        }
      ]
    }
  },
  data() {
    return {
      searchForm: {
        branchId: '', // API文档字段
        buId: 0,
        openCourseStatus: [1, 2], // 开班状态 - 默认选中等班中、建议开班
        courseSearch: '', // 班级搜索（班级名称/简称/编码）
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: '',
        classTypeCodes: [], // 适用班型
        currentPage: 1,
        pageSize: 10
      },
      loading: false,
      tableData: [],
      total: 0,
      teamBranchList: [], // 校区列表
      // 表格高度相关
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      showAddDialog: false,
      showDeleteDialog: false,
      deleteLoading: false,
      currentDeleteClass: {},
      // 班级类型列表 - 从接口获取
      classTypeList: []
    }
  },
  created() {
    // 从 sessionStorage 中获取搜索条件，如果有则使用缓存的条件
    try {
      const cachedForm = JSON.parse(sessionStorage.getItem('one2many_openclass_search_form'))
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
    this.getClassSetListFun() // 先获取班级类型
    this.getList()
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
      sessionStorage.removeItem('one2many_openclass_search_form')
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

    getClassSetListFun() {
      One2ManyApi.getClassSetList().then(res => {
        this.classTypeList = res || []
      })
    },

    // 初始化默认值
    initializeDefaultValues() {
      // 设置默认校区为当前用户的校区
      if (this.userBaseInfo) {
        this.searchForm.branchId = this.userBaseInfo.branchId || ''
        this.searchForm.buId = this.userBaseInfo.buId || 0
      }
    },

    // 获取列表数据
    async getList() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          // 当选择"全部"时，传递null给后端
          branchId: this.searchForm.branchId === 'all' ? null : this.searchForm.branchId
        }
        const res = await One2ManyApi.getOpenCourseList(params)
        this.tableData = res.list || []
        this.total = res.total || 0

        // 在数据加载完成后初始化表格高度计算器
        this.$nextTick(() => {
          if (!this.tableHeightCalculator) {
            this.initTableHeightCalculator()
          }
        })
      } catch (error) {
        this.$message.error('获取列表数据失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 查询
    handleSearch() {
      this.searchForm.currentPage = 1
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_openclass_search_form', JSON.stringify(this.searchForm))
      this.getList()
    },

    // 重置
    handleReset() {
      this.$refs.searchForm.resetFields()
      this.searchForm = {
        branchId: this.userBaseInfo?.branchId || '',
        buId: this.userBaseInfo?.buId || 0,
        openCourseStatus: [1, 2], // 重置时也要设置默认选中等班中、建议开班
        courseSearch: '',
        teacherId: '',
        teacherName: '',
        courseManagerId: '',
        courseManagerName: '',
        subjectId: '',
        classTypeCodes: [],
        currentPage: 1,
        pageSize: 10
      }
      
      // 清除缓存的查询条件
      sessionStorage.removeItem('one2many_openclass_search_form')
      
      this.$nextTick(() => {
        this.handleSearch()
      })
    },

    // 分页变化处理函数
    handlePageChange() {
      // 保存查询条件到 sessionStorage
      sessionStorage.setItem('one2many_openclass_search_form', JSON.stringify(this.searchForm))
      this.getList()
    },

    // 新增班级
    handleAddClass() {
      this.showAddDialog = true
    },

    // 新增班级成功
    handleAddSuccess() {
      this.getList()
    },

    // 查看详情
    handleDetail(row) {
      if (row.openCourseStatus === 3) {
        // 已开班：跳转到1对多排课-班级详情
        this.$router.push({
          name: 'one2many-schedule-detail',
          query: { id: row.id }
        })
      } else {
        // 非已开班：跳转到开班管理-班级详情
        this.$router.push({
          name: 'open-class-management-detail',
          query: { id: row.id }
        })
      }
    },

    // 删除班级
    handleDelete(row) {
      // 检查是否有等班人数
      if (row.waitNum > 0) {
        this.$message.warning('当前班级下有等班学员，无法删除哦~')
        return
      }

      this.currentDeleteClass = row
      this.showDeleteDialog = true
    },

    // 删除确认
    async handleDeleteConfirm() {
      this.deleteLoading = true
      try {
        const res = await One2ManyApi.deleteOpenCourse(this.currentDeleteClass.id)
        this.$message.success('删除成功')
        this.showDeleteDialog = false
        this.getList()
      } catch (error) {
        this.$message.error('删除失败，请稍后重试')
      } finally {
        this.deleteLoading = false
      }
    },

    // Mock删除班级
    async mockDeleteClass() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    },

    // 获取有权限的校区（参考ImportRule.vue）
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
    }
  }
}
</script>

<style lang="scss" scoped>
.open-class-management {
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

  .dialog-footer {
    text-align: right;
  }
}

::v-deep .el-dialog.delete-confirm-dialog {
  border-radius: 8px;
  margin-top: 20vh !important;
}

::v-deep .el-dialog.delete-confirm-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.delete-confirm-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.delete-confirm-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.delete-confirm-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
