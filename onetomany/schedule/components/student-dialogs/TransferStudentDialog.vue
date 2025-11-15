<template>
  <el-dialog custom-class="transfer-student-dialog" title="转班" :visible.sync="dialogVisible" width="900px" :close-on-click-modal="false" @close="handleClose">
    <div class="dialog-content">
      <!-- 提示语 -->
      <div class="tip-section">
        <span v-if="!isBatch">
          请确认是否将 <span class="student-name">{{ (studentData && studentData.studentName) || '' }}</span> 转入新班？
        </span>
        <span v-else>
          请确认是否将 <span class="count-number">{{ selectedStudents.length }}</span> 名学员转入新班？
        </span>
      </div>

      <!-- 转班日期 -->
      <div class="transfer-date-section">
        <div class="filter-section-title">
          <div class="line"></div>
          <div class="filter-section-title-text">转班日期</div>
        </div>
        <el-form :model="form" :rules="formRules" ref="form" :inline="true" class="date-form">
          <el-form-item prop="transferDate">
            <template slot="label">
              <el-tooltip content="转班日期当天及以后的课次将自动取消哦～" placement="top">
                <i class="el-icon-info tip-icon" style="color: #c3c7cf"></i>
              </el-tooltip>
              选择日期：
            </template>
            <el-date-picker
              v-model="form.transferDate"
              type="date"
              placeholder="请选择转班日期"
              value-format="yyyy-MM-dd"
              size="small"
              style="width: 200px"
              disabled
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <div class="filter-section-title">
          <div class="line"></div>
          <div class="filter-section-title-text">转入班级</div>
        </div>

        <el-form :model="classFilter" :inline="true" class="search-form">
          <el-form-item>
            <el-input v-model="classFilter.classKeyword" placeholder="请输入班级名称/简称/编码" size="small" style="width: 200px" clearable />
          </el-form-item>
          <el-form-item>
            <HiAsyncSelector
              v-model="classFilter.teacherId"
              dict-key="teacher"
              :defaultWord="classFilter.teacherName"
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
              v-model="classFilter.textbook"
              v-if="joyEnglishTextbookList && joyEnglishTextbookList.length > 0"
              placeholder="请选择教材"
              size="small"
              style="width: 150px"
              clearable
            >
              <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id"> </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select multiple v-model="classFilter.openCourseStatus" placeholder="请选择开班状态" size="small" style="width: 150px" clearable collapse-tags>
              <el-option label="等班中" :value="1"></el-option>
              <el-option label="建议开班" :value="2"></el-option>
              <el-option label="已开班" :value="3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="classFilter.branchId" placeholder="请选择校区" size="small" style="width: 150px" @change="handleBranchChange">
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
          :columns="classColumns"
          :data="classList"
          :loading="classLoading"
          stripe
          row-key="classCode"
          @row-click="handleRowClick"
          :max-height="300"
        />

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="classList.length > 0">
          <hi-pagination
            :total="classTotal"
            :current-page.sync="classPagination.currentPage"
            :page-size.sync="classPagination.pageSize"
            @change="loadClassList"
          />
        </div>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">确定转班</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import dayjs from 'dayjs'
import One2ManyApi from '@/services/tacenter/one2many'
import { CommonApi } from '@api'
import { systemApi } from '@/services'

export default {
  name: 'TransferStudentDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    },
    selectedStudents: {
      type: Array,
      default: () => []
    },
    isBatch: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo']),
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    isFormValid() {
      return this.selectedClass // 只需要选择班级即可，日期已经固定为当天
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
    }
  },
  data() {
    return {
      loading: false,
      classLoading: false,
      form: {
        transferDate: this.getCurrentDate() // API字段：转班日期，默认为当天
      },
      formRules: {
        // 由于转班日期现在是固定的当天日期，不需要验证规则
      },
      // 班级筛选条件
      classFilter: {
        classKeyword: '',
        teacherId: '',
        teacherName: '',
        textbook: '', // 替换currentMaterial为textbook
        openCourseStatus: [], // 替换openStatus并设置默认值
        branchId: '',
        branchIds: [] // 实际传给后端的校区ID数组
      },
      // 班级列表
      classList: [],
      classTotal: 0,
      classPagination: {
        currentPage: 1,
        pageSize: 10
      },
      // 选中的班级
      selectedClass: null,
      selectedClassId: '',
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
    // 获取当前日期
    getCurrentDate() {
      return dayjs().format('YYYY-MM-DD')
    },

    // 初始化默认值（参考index.vue）
    initializeDefaultValues() {
      // 设置默认校区为当前用户的校区
      this.classFilter.branchId = this.userBaseInfo?.branchId
      // 初始化校区ID数组
      this.updateBranchIds()
      // 设置转班日期为当天
      this.form.transferDate = this.getCurrentDate()
    },

    // 单选班级
    handleRadioChange(row) {
      this.selectedClass = row
      this.selectedClassId = row.id
    },

    // 行点击选择
    handleRowClick(row) {
      this.handleRadioChange(row)
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
      if (this.classFilter.branchId === 'all') {
        // 选择全部时，传递所有校区的ID
        this.classFilter.branchIds = this.teamBranchList.map(item => item.id)
      } else if (this.classFilter.branchId) {
        // 选择单个校区时，传递该校区ID
        this.classFilter.branchIds = [this.classFilter.branchId]
      } else {
        // 清空或未选择时，传递空数组
        this.classFilter.branchIds = []
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
        this.joyEnglishTextbookList = enabledTextbooks
      } catch (error) {
        console.error('获取教材列表失败:', error)
      }
    },

    // 查询
    handleSearch() {
      this.classPagination.currentPage = 1
      this.loadClassList()
    },

    // 重置搜索
    handleResetSearch() {
      this.classFilter = {
        classKeyword: '',
        teacherId: '',
        teacherName: '',
        textbook: '', // 替换currentMaterial为textbook
        openCourseStatus: [], // 替换openStatus并设置默认值
        branchId: this.userBaseInfo?.branchId,
        branchIds: []
      }
      this.updateBranchIds()
      this.loadClassList()
    },

    // 加载班级列表
    async loadClassList() {
      this.classLoading = true
      try {
        const params = {
          branchId: this.classFilter.branchId === 'all' ? null : this.classFilter.branchId,
          buId: this.userBaseInfo?.buId,
          courseSearch: this.classFilter.classKeyword,
          teacherId: this.classFilter.teacherId,
          courseManagerId: null, // 可根据需要添加班主任搜索
          textbook: this.classFilter.textbook,
          classTypeCodes: [], // 可根据需要添加班型搜索
          openCourseStatus: this.classFilter.openCourseStatus, // 直接传递开班状态
          currentPage: this.classPagination.currentPage,
          pageSize: this.classPagination.pageSize
        }

        const res = await One2ManyApi.getTransferClassList(params)

        this.classList = res.list || []
        this.classTotal = res.total || 0
      } catch (error) {
        this.$message.error('获取班级列表失败')
      } finally {
        this.classLoading = false
      }
    },

    // 确认转班
    async handleConfirm() {
      try {
        if (!this.selectedClass) {
          this.$message.warning('请选择要转入的班级')
          return
        }

        this.loading = true

        if (this.isBatch) {
          // 批量转班
          const params = {
            changeClassDate: this.form.transferDate,
            courseId: this.selectedClass.id,
            idList: this.selectedStudents.map(s => s.id)
          }
          await One2ManyApi.batchChangeScheduleStudentClass(params)
          this.$message.success('批量转班成功')
        } else {
          // 单个转班
          const params = {
            changeClassDate: this.form.transferDate,
            courseId: this.selectedClass.id
          }
          await One2ManyApi.changeScheduleStudentClass(this.studentData.id, params)
          this.$message.success('转班成功')
        }

        this.$emit('confirm', {
          transferDate: this.form.transferDate,
          targetClass: this.selectedClass,
          isBatch: this.isBatch,
          studentData: this.studentData,
          selectedStudents: this.selectedStudents
        })

        this.handleClose()
      } catch (error) {
        this.$message.error(error || '转班失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },

    // 重置表单
    resetForm() {
      this.form = {
        transferDate: this.getCurrentDate()
      }
      this.classFilter = {
        classKeyword: '',
        teacherId: '',
        teacherName: '',
        textbook: '', // 替换currentMaterial为textbook
        openCourseStatus: [], // 替换openStatus并设置默认值
        branchId: '',
        branchIds: []
      }
      this.selectedClass = null
      this.selectedClassId = ''
      this.classList = []
      this.classPagination = {
        currentPage: 1,
        pageSize: 10
      }
      if (this.$refs.form) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .tip-section {
    border-radius: 4px;
    line-height: 1.5;
    color: #333;
    margin-bottom: 16px;

    .count-number {
      color: #f56c6c;
      font-weight: bold;
    }

    .student-name {
      color: #409eff;
      font-weight: bold;
    }
  }

  .transfer-date-section,
  .filter-section,
  .class-list-section {
    margin-bottom: 20px;

    .line {
      width: 4px;
      height: 16px;
      border-radius: 5px;
      background-color: rgba(21, 124, 255, 1);
      margin-right: 10px;
    }
    .filter-section-title {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }

  .search-form,
  .date-form {
    .el-form-item {
      margin-bottom: 10px;
    }
  }

  .filter-section-title-text {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .date-form {
    .el-form-item {
      .tip-icon {
        color: #409eff;
        cursor: pointer;
        font-size: 16px;
        margin-right: 4px;

        &:hover {
          color: #66b1ff;
        }
      }
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
::v-deep .el-dialog.transfer-student-dialog {
  border-radius: 8px;
  margin-top: 8vh !important;
}

::v-deep .el-dialog.transfer-student-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.transfer-student-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.transfer-student-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  overflow-y: auto;
}

::v-deep .el-dialog.transfer-student-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .el-dialog.transfer-student-dialog .el-radio__label {
  visibility: hidden;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
