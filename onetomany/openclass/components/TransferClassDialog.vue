<template>
  <el-dialog
    custom-class="transfer-class-dialog"
    :title="computedTitle"
    :visible.sync="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-content">
      <!-- 提示语：仅转班时显示 -->
      <div class="tip-section" v-if="!dialogTitle">
        <span v-if="isBatch">
          请确认是否将 <span class="count-number">{{ students.length }}</span> 名学员转入新班？
        </span>
        <span v-else>
          请确认是否将 <span class="student-name">{{ students[0]?.studentName }}</span> 转入新班？
        </span>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-section" :class="{ 'no-margin-top': dialogTitle }">
        <div class="filter-section-title">
          <div class="line"></div>
          <h4>{{ dialogTitle ? '入班班级' : '转入班级' }}</h4>
        </div>

        <el-form :model="searchForm" :inline="true" class="search-form">
          <el-form-item>
            <el-input v-model="searchForm.classKeyword" placeholder="请输入班级名称/简称/编码" size="small" style="width: 200px" clearable />
          </el-form-item>

          <el-form-item>
            <HiAsyncSelector
              v-model="searchForm.teacherId"
              dict-key="teacher"
              :param="{ buId: userBaseInfo.buId, size: 100 }"
              placeholder="请输入老师姓名/编码"
              size="small"
              style="width: 180px"
              clearable
            >
              <template v-slot="slotProps">
                <span>{{ slotProps.label }}</span>
                <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
              </template>
            </HiAsyncSelector>
          </el-form-item>

          <el-form-item>
            <el-select
              v-model="searchForm.textbook"
              v-if="joyEnglishTextbookList && joyEnglishTextbookList.length > 0"
              placeholder="请选择教材"
              size="small"
              style="width: 150px"
              clearable
            >
              <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id"> </el-option>
            </el-select>
          </el-form-item>
          <!-- 开班状态（1-等班中，2-建议开班，3-已开班） -->
          <el-form-item>
            <el-select multiple v-model="searchForm.openCourseStatus" placeholder="请选择开班状态" size="small" style="width: 150px" clearable collapse-tags>
              <el-option label="等班中" :value="1"></el-option>
              <el-option label="建议开班" :value="2"></el-option>
              <el-option label="已开班" :value="3"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-select v-model="searchForm.branchId" placeholder="请选择校区" size="small" style="width: 150px" @change="handleBranchChange">
              <el-option label="全部" value="all"></el-option>
              <el-option v-for="item in teamBranchList" :key="item.id" :label="item.orgName" :value="item.id" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch" size="small">查询</el-button>
            <el-button @click="handleResetSearch" size="small">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 班级列表 -->
      <div class="class-list-section">
        <HiTable
          ref="classTable"
          refName="ref"
          :columns="classColumns"
          :data="classList"
          v-loading="loading"
          stripe
          @row-click="handleRowClick"
          row-key="classId"
          max-height="300"
        />

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="classList.length > 0">
          <hi-pagination :total="classTotal" :current-page.sync="searchForm.currentPage" :page-size.sync="searchForm.pageSize" @change="handlePageChange" />
        </div>
      </div>

      <!-- 首课日期选择 -->
      <div class="first-class-section" v-if="showFirstClassDate">
        <div class="filter-section-title">
          <div class="line"></div>
          <h4>首课可排日期</h4>
        </div>
        <el-form :model="dateForm" :rules="dateFormRules" ref="dateForm" :inline="true" class="date-form">
          <el-form-item label="选择日期：" prop="firstClassDate">
            <el-date-picker
              v-model="dateForm.firstClassDate"
              type="date"
              placeholder="请选择"
              size="small"
              style="width: 200px"
              :picker-options="pickerOptions"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
          <span class="tip-text">之后可排首课</span>
        </el-form>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="confirmLoading" size="small" :disabled="!selectedClass">
        {{ dialogTitle ? '确定入班' : '确定转班' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { CommonApi } from '@api'
import One2ManyApi from '@/services/tacenter/one2many'
import { systemApi } from '@/services'
import dayjs from 'dayjs'

export default {
  name: 'TransferClassDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    students: {
      type: Array,
      default: () => []
    },
    isBatch: {
      type: Boolean,
      default: false
    },
    dialogTitle: {
      type: String,
      default: '' // 自定义标题，为空时使用默认标题
    },
    isEnrollMode: {
      type: Boolean,
      default: false // 是否为入班模式（true: 入班，false: 转班）
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo']),
    computedTitle() {
      // 如果传入了自定义标题，则使用自定义标题
      if (this.dialogTitle) {
        return this.dialogTitle
      }
      // 否则使用默认标题（转班）
      return this.isBatch ? '批量转班' : '转班'
    },
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    classColumns() {
      return [
        {
          prop: 'radio',
          label: '',
          width: 55,
          align: 'center',
          showLabel: false,
          render: (h, { row }) => {
            return h('el-radio', {
              props: {
                value: this.selectedClassId,
                label: row.id
              },
              on: {
                input: () => this.handleRadioChange(row)
              }
            })
          }
        },
        {
          prop: 'courseName',
          label: '班级名称',
          minWidth: 150
        },
        {
          prop: 'shortName',
          label: '班级简称',
          width: 120
        },
        {
          prop: 'classTypeCodeName',
          label: '班型',
          width: 100
        },
        {
          prop: 'stuNum',
          label: '学员数',
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
          prop: 'textbookName',
          label: '当前教材',
          width: 120
        },
        {
          prop: 'branchName',
          label: '校区',
          width: 100
        },
        {
          prop: 'openCourseStatus',
          label: '开班状态',
          width: 120,
          fixed: 'right',
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
        }
      ]
    },
    showFirstClassDate() {
      return this.selectedClass && this.selectedClass.openCourseStatus === 3 // 已开班状态需要选择首课日期
    }
  },
  data() {
    return {
      loading: false,
      confirmLoading: false,
      searchForm: {
        classKeyword: '',
        teacherId: '',
        textbook: '', // 替换subjectId为textbook
        openCourseStatus: [], // 默认选中等班中、建议开班
        branchId: '',
        branchIds: [], // 实际传给后端的校区ID数组
        currentPage: 1,
        pageSize: 10
      },
      classList: [],
      classTotal: 0,
      selectedClass: null,
      selectedClassId: '',
      dateForm: {
        firstClassDate: dayjs().format('YYYY-MM-DD') // 默认为当天 并且格式化为yyyy-MM-dd
      },
      dateFormRules: {
        firstClassDate: [{ required: true, message: '请选择首课日期', trigger: 'change' }]
      },
      pickerOptions: {
        // disabledDate(time) {
        //   return time.getTime() < Date.now() - 8.64e7
        // }
      },
      // 校区列表
      teamBranchList: [],
      // 佳音教材列表
      joyEnglishTextbookList: []
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initializeDefaultValues()
        this.getOrganizationBranchList()
        this.getJoyEnglishTextbookList()
        this.loadClassList()
      }
    }
  },
  methods: {
    // 初始化默认值（参考index.vue）
    initializeDefaultValues() {
      // 设置默认校区为当前用户的校区
      this.searchForm.branchId = this.userBaseInfo?.branchId
      // 初始化校区ID数组
      this.updateBranchIds()
    },

    // 获取校区列表
    async getOrganizationBranchList() {
      try {
        let res = await CommonApi.getTeamBranchList({
          buId: this.userBaseInfo.buId
        })
        this.teamBranchList = res.data || []
        // 获取校区列表后更新校区ID数组
        this.updateBranchIds()
      } catch (e) {
        console.error('获取校区列表失败:', e)
      }
    },

    // 处理校区选择变化
    handleBranchChange() {
      this.updateBranchIds()
      this.loadClassList()
    },

    // 更新校区ID数组（参考开班管理的处理方式）
    updateBranchIds() {
      if (this.searchForm.branchId === 'all') {
        // 选择全部时，传递所有校区的ID
        this.searchForm.branchIds = this.teamBranchList.map(item => item.id)
      } else if (this.searchForm.branchId) {
        // 选择单个校区时，传递该校区ID
        this.searchForm.branchIds = [this.searchForm.branchId]
      } else {
        // 清空或未选择时，传递空数组
        this.searchForm.branchIds = []
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
        // 在转班对话框中，显示所有启用的教材供筛选
        this.joyEnglishTextbookList = enabledTextbooks || []
      } catch (error) {
        console.error('获取教材列表失败:', error)
      }
    },

    async loadClassList() {
      this.loading = true
      try {
        const params = {
          branchId: this.searchForm.branchId === 'all' ? null : this.searchForm.branchId,
          buId: this.userBaseInfo?.buId,
          courseSearch: this.searchForm.classKeyword,
          teacherId: this.searchForm.teacherId,
          courseManagerId: null, // 可根据需要添加班主任搜索
          textbook: this.searchForm.textbook, // 替换subjectId为textbook
          classTypeCodes: [], // 可根据需要添加班型搜索
          openCourseStatus: this.searchForm.openCourseStatus, // 直接传递开班状态
          currentPage: this.searchForm.currentPage,
          pageSize: this.searchForm.pageSize
        }

        const res = await One2ManyApi.getTransferClassList(params)

        let classList = res.list || []

        // 如果是入班模式且学员有 classType，则根据 classType 过滤班级列表
        if (this.isEnrollMode && this.students.length > 0 && this.students[0].classType) {
          const classType = this.students[0].classType
          if (Array.isArray(classType) && classType.length > 0) {
            classList = classList.filter(classItem => {
              // classTypeCode 需要转换为数字进行比较
              const classTypeCode = parseInt(classItem.classTypeCode)
              return classType.includes(classTypeCode)
            })
          }
        }

        this.classList = classList
        this.classTotal = classList.length // 过滤后重新计算总数
      } catch (error) {
        this.$message.error('获取班级列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.searchForm.currentPage = 1
      this.loadClassList()
    },

    handleResetSearch() {
      this.searchForm = {
        classKeyword: '',
        teacherId: '',
        textbook: '', // 替换subjectId为textbook
        openCourseStatus: [], // 重置时也设置默认选中等班中、建议开班
        branchId: this.userBaseInfo?.branchId,
        branchIds: [],
        currentPage: 1,
        pageSize: 10
      }
      this.updateBranchIds()
      this.loadClassList()
    },

    handlePageChange() {
      this.loadClassList()
    },

    handleRadioChange(row) {
      this.selectedClass = row
      this.selectedClassId = row.id
      // 重置首课日期为当天
      this.dateForm.firstClassDate = dayjs().format('YYYY-MM-DD')
    },

    handleRowClick(row) {
      this.handleRadioChange(row)
    },

    async handleConfirm() {
      if (!this.selectedClass) {
        this.$message.warning('请选择目标班级')
        return
      }

      // 如果是已开班状态，需要验证首课日期
      if (this.selectedClass.openCourseStatus === 3) {
        try {
          await this.$refs.dateForm.validate()
        } catch (error) {
          return
        }
      }

      this.confirmLoading = true
      try {
        if (this.isEnrollMode) {
          // 单个入班
          const student = this.students[0]
          if (student) {
            const params = {
              courseId: this.selectedClass.id,
              studentId: student.studentId,
              firstCanUseDate: this.dateForm.firstClassDate
            }
            await One2ManyApi.addScheduleStudent(params)
            this.$message.success('入班成功')
          }
        } else {
          // 转班模式：使用原有的 transferOpenCourseStudent API
          if (this.isBatch) {
            // 批量转班
            const params = {
              courseId: this.selectedClass.id,
              firstCanUseDate: this.dateForm.firstClassDate,
              idList: this.students.map(student => student.id)
            }

            const res = await One2ManyApi.batchTransferOpenCourseStudent(params)
            this.$message.success('批量转班成功')
          } else {
            // 单个转班
            const studentId = this.students[0]?.id
            if (studentId) {
              const params = {
                courseId: this.selectedClass.id,
                firstCanUseDate: this.dateForm.firstClassDate
              }
              const res = await One2ManyApi.transferOpenCourseStudent(studentId, params)
              this.$message.success('转班成功')
            }
          }
        }

        this.$emit('confirm', {
          targetClass: this.selectedClass,
          students: this.students,
          firstClassDate: this.dateForm.firstClassDate
        })
        this.handleClose()
      } catch (error) {
        const operation = this.isEnrollMode ? '入班' : '转班'
        this.$message.error(error || `${operation}失败，请稍后重试`)
      } finally {
        this.confirmLoading = false
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.selectedClass = null
      this.selectedClassId = ''
      this.dateForm.firstClassDate = dayjs().format('YYYY-MM-DD') // 重置为当天
      // 重置表单验证状态
      this.$nextTick(() => {
        this.$refs.dateForm && this.$refs.dateForm.resetFields()
      })
      this.searchForm = {
        classKeyword: '',
        teacherId: '',
        textbook: '', // 替换subjectId为textbook
        openCourseStatus: [], // 关闭时也设置默认选中等班中、建议开班
        branchId: '',
        branchIds: [],
        currentPage: 1,
        pageSize: 10
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .tip-section {
    border-radius: 4px;
    margin-bottom: 16px;
    line-height: 1.5;
    color: #333;

    .count-number {
      color: #4f8bed;
      font-weight: bold;
    }

    .student-name {
      color: #4f8bed;
      font-weight: bold;
    }
  }

  .filter-section,
  .class-list-section,
  .first-class-section {
    margin-bottom: 20px;

    .line {
      width: 4px;
      height: 16px;
      border-radius: 5px;
      background-color: #4f8bed;
      margin-right: 10px;
    }
    .filter-section-title {
      display: flex;
      align-items: center;
    }
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }

  // 入班时移除顶部边距
  .filter-section.no-margin-top {
    margin-top: 0;
  }

  .search-form,
  .date-form {
    .el-form-item {
      margin-bottom: 10px;
    }
  }

  .date-form {
    display: flex;

    .tip-text {
      color: #333;
      line-height: 43px; // 与日期选择器高度保持一致
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.transfer-class-dialog {
  border-radius: 8px;
  margin-top: 8vh !important;
}

::v-deep .el-dialog.transfer-class-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.transfer-class-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.transfer-class-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.transfer-class-dialog .el-radio__label {
  visibility: hidden;
}

::v-deep .el-dialog.transfer-class-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 12px 20px;
  gap: 12px;
}
</style>
