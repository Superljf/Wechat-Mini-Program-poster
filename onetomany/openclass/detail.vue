<template>
  <div class="class-detail">
    <!-- 班级基本信息卡片 -->
    <el-card shadow="never" :body-style="{ paddingTop: '16px', paddingBottom: '16px' }">
      <!-- 头部区域 -->
      <div class="header-section">
        <div class="header-left">
          <div class="class-title">
            {{ classDetail.courseName }}
          </div>
          <el-tag :type="getStatusClass(classDetail.openCourseStatus)" size="small" effect="light">
            {{ getStatusText(classDetail.openCourseStatus) }}
          </el-tag>
        </div>
        <!-- 开班按钮 -->
        <div class="header-right">
          <!-- open-class-btn -->
          <el-button v-if="classDetail.openCourseStatus !== 3 && hasButtonRight('open-class-btn')" type="primary" size="small" @click="handleOpenClass">
            开班
          </el-button>
          <!-- 编辑按钮 -->
          <el-button
            v-if="classDetail.openCourseStatus !== 3 && hasButtonRight('openclass-modify-class-btn')"
            size="small"
            @click="handleEditClass"
            style="margin-left: 8px"
          >
            修改班级信息
          </el-button>
        </div>
      </div>

      <!-- 详细信息区域 -->
      <div class="detail-info-section">
        <div class="info-grid">
          <div class="text-item">
            <span class="text-item__label">班级编码</span>
            <span class="text-item__content">{{ classDetail.courseNo }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">班级名称</span>
            <span class="text-item__content">{{ classDetail.courseName }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">班级简称</span>
            <span class="text-item__content">{{ classDetail.shortName || '-' }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">班级类型</span>
            <span class="text-item__content">{{ classDetail.subCourseKindName }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">科目</span>
            <span class="text-item__content">{{ classDetail.subjectName }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">教师</span>
            <span class="text-item__content">{{ classDetail.teacherName || '-' }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">班主任</span>
            <span class="text-item__content">{{ classDetail.courseManagerName || '-' }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">建议开班人数</span>
            <span class="text-item__content">{{ classDetail.openCourseNum }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">创建人</span>
            <span class="text-item__content">{{ classDetail.createUserName }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">创建时间</span>
            <span class="text-item__content">{{ classDetail.createTime }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">更新人</span>
            <span class="text-item__content">{{ classDetail.updateUserName }}</span>
          </div>
          <div class="text-item">
            <span class="text-item__label">更新时间</span>
            <span class="text-item__content">{{ classDetail.updateTime }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 学员列表区域 -->
    <el-card shadow="never" class="student-card" :body-style="{ paddingTop: '6px' }">
      <!-- 操作按钮区域 -->
      <div class="btns-wrap">
        <div class="btn-left">
          <el-button v-if="classDetail.openCourseStatus !== 3" type="primary" size="small" @click="handleAddStudent" style="margin-right: 10px"
            >添加学员</el-button
          >
          <el-dropdown v-if="classDetail.openCourseStatus !== 3" @command="handleBatchOperation" trigger="hover" :disabled="selectedStudents.length === 0">
            <el-button size="small" :disabled="selectedStudents.length === 0"> 批量操作<i class="el-icon-arrow-down el-icon--right"></i> </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="transfer">批量转班</el-dropdown-item>
              <el-dropdown-item command="remove">批量移除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <div class="btn-right">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item>
              <el-input
                v-model="searchForm.searchInfo"
                placeholder="请输入学员姓名/编码/手机号"
                @keyup.enter.native="handleSearch"
                clearable
                style="width: 250px"
                size="small"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
              <el-button @click="handleResetSearch" size="small">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 学员数据表格 -->
      <HiTable
        ref="studentTable"
        refName="ref"
        :columns="studentColumns"
        :data="studentList"
        v-loading="studentLoading"
        stripe
        @selection-change="handleSelectionChange"
        row-key="studentId"
        :max-height="tableMaxHeight"
      />

      <!-- 分页 -->
      <div class="g-mt g-tar" v-if="studentList.length > 0">
        <hi-pagination
          :total="studentTotal"
          :current-page.sync="searchForm.currentPage"
          :page-size.sync="searchForm.pageSize"
          @change="handleStudentPageChange"
        />
      </div>
    </el-card>

    <!-- 开班确认弹窗 -->
    <OpenClassDialog
      ref="openClassDialog"
      :visible.sync="showOpenDialog"
      :class-detail="classDetail"
      :student-count="studentTotal"
      :class-type-list="classTypeList"
      @confirm="handleOpenConfirm"
    />

    <!-- 添加学员弹窗 -->
    <AddStudentDialog ref="addStudentDialog" :visible.sync="showAddDialog" :class-id="classId" @confirm="handleAddStudentConfirm" />

    <!-- 转班弹窗 -->
    <TransferClassDialog
      ref="transferClassDialog"
      :visible.sync="showTransferDialog"
      :students="transferStudents"
      :is-batch="isBatchTransfer"
      @confirm="handleTransferConfirm"
    />

    <!-- 移除确认弹窗 -->
    <RemoveStudentDialog
      ref="removeStudentDialog"
      :visible.sync="showRemoveDialog"
      :students="removeStudents"
      :class-name="classDetail.courseName"
      :is-batch="isBatchRemove"
      @confirm="handleRemoveConfirm"
    />

    <!-- 备注弹窗 -->
    <RemarkDialog ref="remarkDialog" :visible.sync="showRemarkDialog" :student="currentStudent" @confirm="handleRemarkConfirm" />

    <!-- 学员画像抽屉 -->
    <StudentProfileDrawer ref="studentProfileDrawer" />

    <!-- 编辑班级弹窗 -->
    <ClassFormDialog :visible.sync="showEditDialog" :is-edit="true" :class-data="classDetail" :class-type-list="classTypeList" @success="handleEditSuccess" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import StudentProfileDrawer from '@/views/student-manage/search/components/StudentProfileDrawer.vue'
import { createTableHeightCalculator } from '@/utils'
import OpenClassDialog from './components/OpenClassDialog.vue'
import AddStudentDialog from './components/AddStudentDialog.vue'
import TransferClassDialog from './components/TransferClassDialog.vue'
import RemoveStudentDialog from './components/RemoveStudentDialog.vue'
import RemarkDialog from './components/RemarkDialog.vue'
import ClassFormDialog from './components/ClassFormDialog.vue'
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'ClassDetail',
  components: {
    StudentProfileDrawer,
    OpenClassDialog,
    AddStudentDialog,
    TransferClassDialog,
    RemoveStudentDialog,
    RemarkDialog,
    ClassFormDialog
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),
    studentColumns() {
      return [
        {
          type: 'selection',
          width: 55,
          align: 'center'
        },
        {
          prop: 'index',
          label: '序号',
          width: 60,
          render: (h, { $index }) => {
            return h('span', $index + 1 + (this.searchForm.currentPage - 1) * this.searchForm.pageSize)
          }
        },
        {
          prop: 'encoding',
          label: '学员编码',
          width: 180
        },
        {
          prop: 'student',
          label: '学员',
          width: 150,
          render: (h, { row }) => {
            return h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
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
          prop: 'counselor',
          label: '咨询师',
          width: 100
        },
        {
          prop: 'courseAdmin',
          label: '学管师',
          width: 100
        },
        {
          prop: 'courseSchedule',
          label: '剩余可排小时数',
          width: 120,
          render: (h, { row }) => {
            return h('span', `${row.courseSchedule || 0}h`)
          }
        },
        {
          prop: 'courseSurplus',
          label: '剩余可用小时数',
          width: 120,
          render: (h, { row }) => {
            const isLow = row.courseSurplus < 20
            return h(
              'span',
              {
                style: {
                  color: isLow ? '#f56c6c' : '#333'
                }
              },
              `${row.courseSurplus}h`
            )
          }
        },

        {
          prop: 'remark',
          label: '备注',
          minWidth: 150,
          showOverflowTooltip: true,
          render: (h, { row }) => {
            return h(
              'span',
              {
                style: {
                  //   cursor: 'pointer',
                  //   color: '#409eff'
                }
                // on: {
                //   click: () => this.handleRemark(row)
                // }
              },
              row.remark || '-'
            )
          }
        },
        {
          prop: 'createTime',
          label: '入班时间',
          width: 150
        },
        {
          prop: 'updateUserName',
          label: '更新人',
          width: 100
        },
        {
          prop: 'updateTime',
          label: '更新时间',
          width: 150
        },
        {
          label: '操作',
          width: this.classDetail.openCourseStatus !== 3 ? 240 : 120,
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
                    click: () => this.handleStudentDetail(row)
                  }
                },
                '详情'
              ),
              h(
                'el-button',
                {
                  props: {
                    type: 'text',
                    size: 'small'
                  },
                  on: {
                    click: () => this.handleStudentProfile(row)
                  }
                },
                '画像'
              )
            ]

            // 只有在非已开班状态下才显示这些按钮
            if (this.classDetail.openCourseStatus !== 3) {
              buttons.push(
                h(
                  'el-button',
                  {
                    props: {
                      type: 'text',
                      size: 'small'
                    },
                    on: {
                      click: () => this.handleRemark(row)
                    }
                  },
                  '备注'
                ),
                h(
                  'el-button',
                  {
                    props: {
                      type: 'text',
                      size: 'small'
                    },
                    on: {
                      click: () => this.handleTransfer(row)
                    }
                  },
                  '转班'
                ),
                h(
                  'el-button',
                  {
                    props: {
                      type: 'text',
                      size: 'small'
                    },
                    on: {
                      click: () => this.handleRemove(row)
                    }
                  },
                  '移除'
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
      classId: '',
      loading: false,
      studentLoading: false,
      // 班级详情数据
      classDetail: {
        courseNo: '',
        courseName: '',
        shortName: '',
        subCourseKindName: '',
        subjectName: '',
        teacherName: '',
        courseManagerName: '',
        openCourseNum: 0,
        openCourseStatus: '',
        createUserName: '',
        createTime: '',
        updateUserName: '',
        updateTime: ''
      },
      // 学员搜索表单
      searchForm: {
        courseId: '',
        searchInfo: '', // 搜索关键词
        keywordType: '', // 搜索类型：1-学员编码，2-学员姓名，3-手机号
        currentPage: 1,
        pageSize: 10
      },
      // 学员列表数据
      studentList: [],
      studentTotal: 0,
      selectedStudents: [],
      // 表格高度相关
      tableMaxHeight: 500,
      tableHeightCalculator: null,
      // 弹窗控制
      showOpenDialog: false,
      showAddDialog: false,
      showTransferDialog: false,
      showRemoveDialog: false,
      showRemarkDialog: false,
      showEditDialog: false,
      // 操作相关数据
      transferStudents: [],
      removeStudents: [],
      currentStudent: {},
      isBatchTransfer: false,
      isBatchRemove: false,
      // 班级类型列表
      classTypeList: []
    }
  },
  created() {
    this.classId = this.$route.query.id || ''
    if (this.classId) {
      this.searchForm.courseId = parseInt(this.classId)
      this.loadClassDetail()
      this.loadStudentList()
    }
  },
  mounted() {
    this.getClassSetListFun()
  },
  beforeDestroy() {
    // 停止监听并清理资源
    if (this.tableHeightCalculator) {
      this.tableHeightCalculator.stopListening()
      this.tableHeightCalculator = null
    }
  },
  methods: {
    // 初始化表格高度计算器
    initTableHeightCalculator() {
      this.tableHeightCalculator = createTableHeightCalculator({
        reservedHeight: 300,
        minHeight: 400,
        maxHeight: 800,
        debounceDelay: 150
      })

      this.tableHeightCalculator.addCallback(height => {
        this.tableMaxHeight = height
      })

      this.tableHeightCalculator.startListening()
    },

    // 获取班级类型列表
    getClassSetListFun() {
      One2ManyApi.getClassSetList().then(res => {
        this.classTypeList = res || []
      })
    },

    // 加载班级详情
    async loadClassDetail() {
      this.loading = true
      try {
        const res = await One2ManyApi.getOpenCourseDetail(this.classId)
        this.classDetail = res || {}
      } catch (error) {
        console.error('获取班级详情失败:', error)
        this.$message.error(error || '获取班级详情失败')
      } finally {
        this.loading = false
      }
    },

    // 加载学员列表
    async loadStudentList() {
      this.studentLoading = true
      try {
        const params = {
          courseId: parseInt(this.classId),
          searchInfo: this.searchForm.searchInfo,
          keywordType: this.searchForm.keywordType,
          currentPage: this.searchForm.currentPage,
          pageSize: this.searchForm.pageSize
        }

        const res = await One2ManyApi.getOpenCourseStudentList(params)
        this.studentList = res.list || []
        this.studentTotal = res.total || 0
        this.$nextTick(() => {
          if (!this.tableHeightCalculator) {
            this.initTableHeightCalculator()
          }
        })
      } catch (error) {
        console.error('获取学员列表失败:', error)
        this.$message.error('获取学员列表失败')
      } finally {
        this.studentLoading = false
      }
    },

    // 格式化开班状态文本
    getStatusText(status) {
      const statusMap = {
        1: '等班中',
        2: '建议开班',
        3: '已开班'
      }
      return statusMap[status] || status
    },

    // 获取状态样式类
    getStatusClass(status) {
      const statusMap = {
        1: '',
        2: 'success',
        3: 'info'
      }
      return statusMap[status]
    },

    handleSearch() {
      // 参考 SearchParams.vue 的搜索逻辑
      this.searchForm.searchInfo = this.searchForm.searchInfo.trim()
      const { searchInfo } = this.searchForm

      if (searchInfo) {
        // 根据输入内容判断搜索类型
        if (/^\d+$/g.test(searchInfo)) {
          // 纯数字：手机号
          this.searchForm.keywordType = '3'
        } else if (/(?=.*[a-zA-Z])(?=.*\d)(?=.*[-_+—*#&/])*/g.test(searchInfo)) {
          // 包含字母、数字和特殊字符：学员编码
          this.searchForm.keywordType = '1'
        } else {
          // 其他情况：学员姓名
          this.searchForm.keywordType = '2'
        }
      } else {
        this.searchForm.keywordType = ''
      }

      this.searchForm.currentPage = 1
      this.loadStudentList()
    },

    handleResetSearch() {
      this.searchForm = {
        courseId: this.classId,
        searchInfo: '',
        keywordType: '',
        currentPage: 1,
        pageSize: 10
      }
      this.$nextTick(() => {
        this.loadStudentList()
      })
    },

    // 分页变化
    handleStudentPageChange() {
      this.loadStudentList()
    },

    // 表格多选
    handleSelectionChange(rows) {
      this.selectedStudents = rows
    },

    // 开班操作
    handleOpenClass() {
      this.showOpenDialog = true
    },

    async handleOpenConfirm(formData) {
      try {
        // 调用开班接口，使用子组件传递的表单数据
        const params = {
          courseManagerId: formData.courseManagerId || 0,
          courseName: formData.courseName,
          shortName: formData.shortName,
          subCourseKind: formData.subCourseKind,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId || 0
        }

        await One2ManyApi.openClass(this.classId, params)
        this.$message.success('开班成功')
        this.showOpenDialog = false

        // 重新加载班级详情以更新状态
        await this.loadClassDetail()

        // 跳转到1对多排课-班级详情
        this.$router.push({
          name: 'one2many-schedule-detail',
          query: { id: this.classId }
        })
      } catch (error) {
        console.error('开班失败:', error)
        this.$message.error(error || '开班失败，请稍后重试')
      }
    },

    // 添加学员
    handleAddStudent() {
      this.showAddDialog = true
    },

    handleAddStudentConfirm() {
      this.showAddDialog = false
      this.loadStudentList()
      this.loadClassDetail()
    },

    // 批量操作
    handleBatchOperation(command) {
      if (this.selectedStudents.length === 0) {
        this.$message.warning('请选择需要操作的学员')
        return
      }

      if (command === 'transfer') {
        this.transferStudents = [...this.selectedStudents]
        this.isBatchTransfer = true
        this.showTransferDialog = true
      } else if (command === 'remove') {
        this.removeStudents = [...this.selectedStudents]
        this.isBatchRemove = true
        this.showRemoveDialog = true
      }
    },

    // 学员详情
    handleStudentDetail(row) {
      window.open(`${process.env.VUE_APP_ERP_URL}?studentId=${row.studentId}#/studentMgr/studentIndex`, '_blank')
    },

    // 学员画像
    handleStudentProfile(row) {
      this.$refs.studentProfileDrawer.show({
        ...row,
        id: row.studentId,
        buId: this.userBaseInfo?.buId
      })
    },

    // 备注
    handleRemark(row) {
      this.currentStudent = row
      this.showRemarkDialog = true
    },

    handleRemarkConfirm() {
      this.showRemarkDialog = false
      this.loadStudentList()
    },

    // 转班
    handleTransfer(row) {
      this.transferStudents = [row]
      this.isBatchTransfer = false
      this.showTransferDialog = true
    },

    handleTransferConfirm() {
      this.showTransferDialog = false
      this.loadStudentList()
    },

    // 移除
    handleRemove(row) {
      this.removeStudents = [row]
      this.isBatchRemove = false
      this.showRemoveDialog = true
    },

    handleRemoveConfirm() {
      this.showRemoveDialog = false
      this.loadStudentList()
      this.loadClassDetail()
    },

    // 编辑班级
    handleEditClass() {
      this.showEditDialog = true
    },

    // 编辑班级成功
    handleEditSuccess() {
      this.loadClassDetail()
    }
  }
}
</script>

<style lang="scss" scoped>
.class-detail {
  padding: 0;
}

/* 头部区域样式 */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eeeeee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.class-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

/* 详细信息区域样式 */
.detail-info-section {
  background-color: #f8f8f8;
  padding: 16px 20px;
  border-radius: 4px;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.text-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 0 0 calc(20% - 13px);
  min-width: 180px;
}

.text-item__label {
  font-size: 13px;
  color: #999;
  margin-right: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}

.text-item__content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}

/* 学员列表区域样式 */
.student-card {
  margin-top: 16px;
}

.student-search-section {
  padding: 16px 0;
  border-bottom: 1px solid #eeeeee;
}

.search-form {
  margin: 0;
  .el-form-item {
    margin-bottom: 0;
  }
}

.btns-wrap {
  display: flex;
  height: 32px;
  margin: 16px 0;
  align-items: center;

  .btn-left {
    font-size: 16px;
    color: #111;
    font-weight: bold;
  }

  .btn-right {
    margin-left: auto;
    display: flex;
    gap: 12px;
  }
}

.g-mt {
  margin-top: 20px;
}

.g-tar {
  text-align: right;
}

/* 响应式布局 */
@media screen and (max-width: 1600px) {
  .text-item {
    flex: 0 0 calc(25% - 12px);
  }
}

@media screen and (max-width: 1200px) {
  .text-item {
    flex: 0 0 calc(33.33% - 11px);
  }
}

@media screen and (max-width: 900px) {
  .text-item {
    flex: 0 0 calc(50% - 8px);
  }
}

@media screen and (max-width: 600px) {
  .text-item {
    flex: 0 0 100%;
  }
}
</style>
