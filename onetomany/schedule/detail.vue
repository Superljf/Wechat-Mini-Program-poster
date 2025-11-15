<template>
  <div class="schedule-detail">
    <el-card>
      <!-- 班级信息区域 -->
      <ClassInfoSection
        :class-data="classDetail"
        :class-list="classList"
        @modify-class="handleModifyClassInfo"
        @adjust-schedule="handleAdjustSchedule"
        @finish-class="handleFinishClass"
        @sync-classin="handleSyncClassIn"
        @print-roster="handlePrintRoster"
        :classId="classId"
      />

      <!-- Tab切换：课次列表/学员列表 -->
      <el-tabs v-model="activeTab" class="detail-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="课次列表" name="classes">
          <!-- 课次列表表格组件 -->
          <ClassListTable
            ref="classListTable"
            :data="classList"
            :loading="loading"
            :total="classTotal"
            :pagination="{ currentPage: classFilter.currentPage, pageSize: classFilter.pageSize }"
            :joy-english-textbook-list="joyEnglishTextbookList"
            :class-data="classDetail"
            :class-id="classId"
            @periodic-schedule="handlePeriodicSchedule"
            @batch-command="handleBatchCommand"
            @filter-change="handleFilterChange"
            @update-pagination="handleClassPaginationUpdate"
            @selection-change="handleSelectionChange"
            @class-detail="handleClassDetail"
            @attendance="handleAttendance"
            @class-command="handleClassCommand"
            @refresh="loadClassList"
          />
        </el-tab-pane>

        <el-tab-pane label="学员列表" name="students">
          <!-- 学员列表表格组件 -->
          <StudentListTable
            ref="studentListTable"
            :data="studentList"
            :loading="studentLoading"
            :total="studentTotal"
            :class-data="classDetail"
            :pagination="{ currentPage: studentFilter.currentPage, pageSize: studentFilter.pageSize }"
            @add-student="handleAddStudent"
            @batch-command="handleStudentBatchCommand"
            @filter-change="handleStudentFilterChange"
            @update-pagination="handleStudentPaginationUpdate"
            @selection-change="handleStudentSelectionChange"
            @student-detail="handleStudentDetail"
            @student-command="handleStudentCommand"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 修改班级信息弹窗 -->
    <ModifyClassDialog :visible.sync="showModifyDialog" :class-data="classDetail" @confirm="handleModifyConfirm" />

    <!-- 结课确认弹窗 -->
    <FinishClassDialog :visible.sync="showFinishDialog" :class-name="classDetail.courseName" :classId="classId" @confirm="handleFinishConfirm" />

    <!-- 周期排课弹窗 -->
    <PeriodicScheduleDialog
      :visible.sync="showPeriodicScheduleDialog"
      :joy-english-textbook-list="joyEnglishTextbookList"
      :class-data="classDetail"
      :has-schedule-period="hasSchedulePeriod"
      @update:hasSchedulePeriod="hasSchedulePeriod = $event"
      @confirm="handlePeriodicScheduleConfirm"
      @schedule-confirm="handleScheduleConfirm"
    />

    <!-- 调整上课周期弹窗 -->
    <PeriodicScheduleDialog
      :visible.sync="showAdjustScheduleDialog"
      :is-adjust-mode="true"
      :class-data="classDetail"
      :joy-english-textbook-list="joyEnglishTextbookList"
      :has-schedule-period="hasSchedulePeriod"
      @update:hasSchedulePeriod="hasSchedulePeriod = $event"
      @confirm="handleAdjustScheduleConfirm"
    />

    <!-- 排课确认弹窗 -->
    <ScheduleConfirmDialog :visible.sync="showScheduleConfirmDialog" :scheduleData="scheduleConfirmData" @success="handleScheduleSuccess" />

    <!-- 删除课次确认弹窗 -->
    <el-dialog
      custom-class="delete-class-dialog"
      :title="isBatchDelete ? '批量删除课次' : '删除课次'"
      :visible.sync="showDeleteDialog"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="delete-content">
        <!-- 单个删除 -->
        <p v-if="!isBatchDelete && currentDeleteClass">
          请确认是否删除
          <span style="color: #4F8Bed">{{ currentDeleteClass.courseDateStr }} {{ currentDeleteClass.startTime }}~{{ currentDeleteClass.endTime }}</span> ？
        </p>
        <!-- 批量删除 -->
        <p v-if="isBatchDelete && selectedClasses.length > 0">
          请确认是否删除
          <span style="color: #4F8Bed">{{ selectedClasses[0].courseDateStr }} {{ selectedClasses[0].startTime }}~{{ selectedClasses[0].endTime }}</span>
          等 <span style="color: #4F8Bed">{{ selectedClasses.length }}</span> 课次？
        </p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showDeleteDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleDeleteConfirm" :loading="deleteLoading" size="small">确定删除</el-button>
      </div>
    </el-dialog>

    <!-- 调整上课时间弹窗 -->
    <el-dialog custom-class="adjust-time-dialog" title="调整上课时间" :visible.sync="showAdjustTimeDialog" width="450px" :close-on-click-modal="false">
      <el-form :model="adjustTimeForm" :rules="adjustTimeRules" ref="adjustTimeForm" label-width="80px" size="small">
        <el-form-item label="上课日期" prop="courseDate">
          <el-date-picker v-model="adjustTimeForm.courseDate" type="date" placeholder="请选择日期" value-format="yyyy-MM-dd" style="width: 320px" />
        </el-form-item>
        <el-form-item label="课次时长" prop="duration" v-if="canModifyDuration">
          <el-input-number
            v-model="adjustTimeForm.duration"
            :min="minClassDuration"
            :max="300"
            :step="minClassDuration || 30"
            controls-position="right"
            @change="handleAdjustDurationChange"
            style="width: 120px"
          />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="课次时长" v-else>
          <span style="color: #4F8Bed;">{{ adjustTimeForm.duration || adjustTimeForm.originalDuration }}</span> min
        </el-form-item>
        <el-form-item label="上课时间" prop="startTime">
          <el-time-picker
            v-model="adjustTimeForm.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="请选择开始时间"
            @change="handleAdjustStartTimeChange"
            @focus="handleAdjustStartTimeFocus"
            style="width: 125px"
          />
          <span class="time-separator">-</span>
          <el-time-picker v-model="adjustTimeForm.endTime" format="HH:mm" value-format="HH:mm" placeholder="结束时间" disabled style="width: 125px" />
        </el-form-item>
        <!-- 最小课次时长显示 -->
        <div v-if="canModifyDuration && minClassDuration > 0" style="margin-top: 10px; margin-left: 80px;">
          <span class="info-label">最小课次时长：</span>
          <span style="color: #4f8bed;">{{ minClassDuration }} </span>min
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAdjustTimeDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleAdjustTimeConfirm" :loading="adjustTimeLoading" size="small">确定</el-button>
      </div>
    </el-dialog>

    <!-- 调整老师弹窗 -->
    <el-dialog custom-class="adjust-teacher-dialog" title="调整老师" :visible.sync="showAdjustTeacherDialog" width="450px" :close-on-click-modal="false">
      <el-form :model="adjustTeacherForm" :rules="adjustTeacherRules" ref="adjustTeacherForm" label-width="60px" size="small">
        <el-form-item label="老师" prop="teacherId">
          <HiAsyncSelector
            v-model="adjustTeacherForm.teacherId"
            dict-key="teacher"
            :defaultWord="adjustTeacherForm.teacherName"
            :param="{ buId: userBaseInfo.buId, size: 100 }"
            placeholder="请选择老师"
            style="width: 100%"
            clearable
          >
            <template v-slot="slotProps">
              <span>{{ slotProps.label }}</span>
              <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
            </template>
          </HiAsyncSelector>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAdjustTeacherDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleAdjustTeacherConfirm" :loading="adjustTeacherLoading" size="small">确定</el-button>
      </div>
    </el-dialog>

    <!-- 调整班主任弹窗 -->
    <el-dialog custom-class="adjust-manager-dialog" title="调整班主任" :visible.sync="showAdjustManagerDialog" width="450px" :close-on-click-modal="false">
      <el-form :model="adjustManagerForm" :rules="adjustManagerRules" ref="adjustManagerForm" label-width="80px" size="small">
        <el-form-item label="班主任" prop="courseManagerId">
          <HiAsyncSelector
            v-model="adjustManagerForm.courseManagerId"
            dict-key="employee"
            :defaultWord="adjustManagerForm.courseManagerName"
            placeholder="请选择班主任"
            style="width: 100%"
            clearable
          >
            <template v-slot="slotProps">
              <span>{{ slotProps.label }}</span>
              <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
            </template>
          </HiAsyncSelector>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAdjustManagerDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleAdjustManagerConfirm" :loading="adjustManagerLoading" size="small">确定</el-button>
      </div>
    </el-dialog>

    <!-- 调整外教弹窗 -->
    <el-dialog
      custom-class="adjust-foreign-teacher-dialog"
      title="调整外教"
      :visible.sync="showAdjustForeignTeacherDialog"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form :model="adjustForeignTeacherForm" :rules="adjustForeignTeacherRules" ref="adjustForeignTeacherForm" label-width="60px" size="small">
        <el-form-item label="外教">
          <HiAsyncSelector
            v-model="adjustForeignTeacherForm.foreignTeacherId"
            dict-key="teacher"
            :defaultWord="adjustForeignTeacherForm.foreignTeacherName"
            :param="{ buId: userBaseInfo.buId, size: 100 }"
            placeholder="请选择外教"
            style="width: 100%"
            clearable
          >
            <template v-slot="slotProps">
              <span>{{ slotProps.label }}</span>
              <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
            </template>
          </HiAsyncSelector>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAdjustForeignTeacherDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleAdjustForeignTeacherConfirm" :loading="adjustForeignTeacherLoading" size="small">确定</el-button>
      </div>
    </el-dialog>

    <!-- 调整教材单元进度弹窗 -->
    <el-dialog
      custom-class="adjust-material-dialog"
      title="调整教材单元进度"
      :visible.sync="showAdjustMaterialDialog"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-form :model="adjustMaterialForm" :rules="adjustMaterialRules" ref="adjustMaterialForm" label-width="80px" size="small">
        <el-form-item label="当前教材" prop="currentMaterial">
          <el-select v-model="adjustMaterialForm.currentMaterial" placeholder="请选择教材" style="width: 100%" @change="handleMaterialChangeInAdjust">
            <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id"> </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="当前单元" prop="currentUnit">
          <el-select v-model="adjustMaterialForm.currentUnit" placeholder="请选择单元" style="width: 100%" multiple>
            <el-option v-for="unit in currentUnitOptions" :key="unit.value" :label="unit.label" :value="unit.value"> </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showAdjustMaterialDialog = false" size="small">取消</el-button>
        <el-button type="primary" @click="handleAdjustMaterialConfirm" :loading="adjustMaterialLoading" size="small">确定</el-button>
      </div>
    </el-dialog>

    <!-- 学员相关弹窗 -->
    <!-- 添加学员弹窗 -->
    <AddStudentDialog :visible.sync="showAddStudentDialog" :class-id="classId" @confirm="handleAddStudentConfirm" />

    <!-- 停课弹窗 -->
    <SuspendStudentDialog
      :visible.sync="showSuspendStudentDialog"
      :student-data="currentStudent"
      :selected-students="selectedStudents"
      :is-batch="isBatchStudentOperation"
      :is-modify="isModifySuspend"
      @confirm="handleSuspendStudentConfirm"
    />

    <!-- 转班弹窗 -->
    <TransferStudentDialog
      :visible.sync="showTransferStudentDialog"
      :student-data="currentStudent"
      :selected-students="selectedStudents"
      :is-batch="isBatchStudentOperation"
      @confirm="handleTransferStudentConfirm"
    />

    <!-- 修改首课可排日期弹窗 -->
    <ModifyFirstClassDateDialog :visible.sync="showModifyFirstClassDateDialog" :student-data="currentStudent" @confirm="handleModifyFirstClassDateConfirm" />

    <!-- 通用确认弹窗 -->
    <ConfirmDialog
      :visible.sync="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      :confirm-text="confirmDialogConfig.confirmText"
      :data="confirmDialogConfig.data"
      @confirm="handleConfirmDialogConfirm"
    />

    <!-- 选择排课订单弹窗 -->
    <SelectOrdersDialog :visible.sync="showSelectOrdersDialog" :student-data="currentStudent" @confirm="handleSelectOrdersConfirm" :course-id="classId" />

    <!-- 复课弹窗 -->
    <ResumeStudentDialog :visible.sync="showResumeStudentDialog" :student-data="currentStudent" @confirm="handleResumeStudentConfirm" />

    <!-- 流失确认弹窗 -->
    <LossStudentDialog :visible.sync="showLossStudentDialog" :student-data="currentStudent" @confirm="handleLossStudentConfirm" />

    <!-- 批量复课弹窗 -->
    <BatchResumeStudentDialog :visible.sync="showBatchResumeStudentDialog" :selected-students="selectedStudents" @confirm="handleBatchResumeStudentConfirm" />

    <!-- 学员画像抽屉 -->
    <StudentProfileDrawer ref="studentProfileDrawer" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import One2ManyApi from '@/services/tacenter/one2many'
import { systemApi } from '@/services'
import ClassInfoSection from './components/ClassInfoSection.vue'
import ClassListTable from './components/ClassListTable.vue'
import StudentListTable from './components/StudentListTable.vue'
import ModifyClassDialog from './components/ModifyClassDialog.vue'
import FinishClassDialog from './components/FinishClassDialog.vue'
import PeriodicScheduleDialog from './components/PeriodicScheduleDialog.vue'
import ScheduleConfirmDialog from './components/ScheduleConfirmDialog.vue'
import AddStudentDialog from './components/student-dialogs/AddStudentDialog.vue'
import SuspendStudentDialog from './components/student-dialogs/SuspendStudentDialog.vue'
import TransferStudentDialog from './components/student-dialogs/TransferStudentDialog.vue'
import ModifyFirstClassDateDialog from './components/student-dialogs/ModifyFirstClassDateDialog.vue'
import ConfirmDialog from './components/student-dialogs/ConfirmDialog.vue'
import SelectOrdersDialog from './components/student-dialogs/SelectOrdersDialog.vue'
import ResumeStudentDialog from './components/student-dialogs/ResumeStudentDialog.vue'
import LossStudentDialog from './components/student-dialogs/LossStudentDialog.vue'
import BatchResumeStudentDialog from './components/student-dialogs/BatchResumeStudentDialog.vue'
import StudentProfileDrawer from '@/views/student-manage/search/components/StudentProfileDrawer.vue'

export default {
  name: 'ScheduleDetail',
  components: {
    ClassInfoSection,
    ClassListTable,
    StudentListTable,
    ModifyClassDialog,
    FinishClassDialog,
    PeriodicScheduleDialog,
    ScheduleConfirmDialog,
    AddStudentDialog,
    SuspendStudentDialog,
    TransferStudentDialog,
    ModifyFirstClassDateDialog,
    ConfirmDialog,
    SelectOrdersDialog,
    ResumeStudentDialog,
    LossStudentDialog,
    BatchResumeStudentDialog,
    StudentProfileDrawer
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    // 最小课次时长（去除小数，保留整数）
    minClassDuration() {
      const hourLen = this.classDetail?.hourLen
      if (!hourLen || hourLen <= 0) {
        return 30 // 默认最小30分钟
      }
      // hourLen 本身就是分钟数，去除小数保留整数
      return Math.floor(hourLen)
    },

    // 是否可以修改课次时长（只有attendStatus为0时才能修改）
    canModifyDuration() {
      return this.currentOperateClass?.attendStatus === 0
    }
  },
  data() {
    return {
      classId: '',
      activeTab: 'classes',
      loading: false,

      // 班级详情信息（API字段）
      classDetail: {
        id: '',
        courseNo: '', // 课程编号
        courseName: '', // 课程名称
        shortName: '', // 简称
        classTypeCode: '', // 班型Id
        classTypeCodeName: '', // 班型
        subjectId: '', // 科目
        subjectName: '', // 科目名称
        teacherId: '', // 教师ID
        teacherName: '', // 教师名称
        courseManagerId: '', // 班主任
        courseManagerName: '', // 班主任名称
        branchId: '', // 校区
        branchName: '', // 校区名称
        textbook: '', // 当前教材ID
        textbookName: '', // 当前进度
        attendClassPeriod: '', // 上课周期
        startDate: '', // 开课日期
        endDate: '', // 结课日期
        times: 0, // 已上次数
        readNum: 0, // 在读人数
        stopNum: 0, // 停课人数
        courseConditionName: '', // 授课状态名称
        createTime: '',
        createUserName: '',
        updateTime: '',
        updateUserName: ''
      },

      // 课次列表
      classList: [],
      classTotal: 0,
      selectedClasses: [],

      // 筛选条件（API字段）
      classFilter: {
        id: '', // 班级Id
        startDate: '', // 开始日期
        endDate: '', // 结束日期
        attendType: [], // 考勤状态
        textbook: '', // 教材
        currentPage: 1,
        pageSize: 50
      },

      // 学员列表
      studentList: [],
      studentTotal: 0,
      selectedStudents: [],
      studentLoading: false,

      // 学员筛选条件（API字段）
      studentFilter: {
        courseId: '', // 课程Id
        searchInfo: '', // 搜索条件（姓名、编码、手机号）
        courseSurplusStart: null, // 剩余课时（开始）
        courseSurplusEnd: null, // 剩余课时（结束）
        studentStatus: [6, 1, 3], // 学生状态
        currentPage: 1,
        pageSize: 10
      },

      // 弹窗状态
      showModifyDialog: false,
      showFinishDialog: false,
      showPeriodicScheduleDialog: false,
      showAdjustScheduleDialog: false,
      showScheduleConfirmDialog: false,
      scheduleConfirmData: {},

      // 是否已有上课周期
      hasSchedulePeriod: false,
      showDeleteDialog: false,
      showAdjustTimeDialog: false,
      showAdjustTeacherDialog: false,
      showAdjustManagerDialog: false,
      showAdjustForeignTeacherDialog: false,
      showAdjustMaterialDialog: false,

      // 学员相关弹窗状态
      showAddStudentDialog: false,
      showSuspendStudentDialog: false,
      showTransferStudentDialog: false,
      showModifyFirstClassDateDialog: false,
      showConfirmDialog: false,
      showSelectOrdersDialog: false,
      showResumeStudentDialog: false,
      showLossStudentDialog: false,
      showBatchResumeStudentDialog: false,

      // 当前操作的学员
      currentStudent: null,
      confirmDialogConfig: {
        title: '',
        message: '',
        confirmText: '',
        data: {}
      },

      // 学员操作标识
      isBatchStudentOperation: false,

      // 佳音教材列表
      joyEnglishTextbookList: [],
      isModifySuspend: false,

      // 删除类型标识
      isBatchDelete: false,

      // 加载状态
      deleteLoading: false,
      adjustTimeLoading: false,
      adjustTeacherLoading: false,
      adjustManagerLoading: false,
      adjustForeignTeacherLoading: false,
      adjustMaterialLoading: false,

      adjustTimeForm: {
        courseDate: '',
        startTime: '',
        endTime: '',
        duration: 0, // 当前课次时长（分钟）
        originalDuration: 0, // 原课次时长（分钟）
        previousValidDuration: 0 // 上一次的合理时长（分钟）
      },
      adjustTeacherForm: {
        teacherId: '',
        teacherName: ''
      },
      adjustManagerForm: {
        courseManagerId: '',
        courseManagerName: ''
      },
      adjustForeignTeacherForm: {
        foreignTeacherId: '',
        foreignTeacherName: ''
      },
      adjustMaterialForm: {
        currentMaterial: '',
        currentUnit: []
      },
      // 当前选中教材的单元选项
      currentUnitOptions: [],

      // 当前操作的课次
      currentDeleteClass: null,
      currentOperateClass: null,

      // 防抖定时器
      paginationTimer: null,
      studentPaginationTimer: null,

      adjustTimeRules: {
        courseDate: [{ required: true, message: '请选择上课日期', trigger: 'change' }],
        startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
        duration: [{ required: true, message: '请输入课次时长', trigger: 'blur' }]
      },
      adjustTeacherRules: {
        teacherId: [{ required: true, message: '请选择老师', trigger: 'change' }]
      },
      adjustManagerRules: {
        courseManagerId: [{ required: true, message: '请选择班主任', trigger: 'change' }]
      },
      adjustForeignTeacherRules: {
        // 外教为非必填项，可以为空
      },
      adjustMaterialRules: {
        currentMaterial: [{ required: true, message: '请选择教材', trigger: 'change' }]
      }
    }
  },
  async created() {
    this.classId = this.$route.query.id || ''
    if (!this.classId) {
      this.$message.error('班级ID参数缺失')
      return
    }

    // 设置筛选条件中的班级ID
    this.classFilter.id = parseInt(this.classId)
    this.studentFilter.courseId = parseInt(this.classId)

    // 先加载班级详情，再根据班级信息加载其他数据
    await this.loadClassDetail()
    await Promise.all([this.loadClassList(), this.loadStudentList(), this.getJoyEnglishTextbookList()])

    // 加载完数据后，校验是否设置了上课周期
    this.checkAndShowPeriodicScheduleDialog()
  },
  beforeDestroy() {
    // 确保清理表格的高度计算器
    if (this.$refs.studentListTable) {
      this.$refs.studentListTable.destroyTableHeightCalculator()
    }
    if (this.$refs.classListTable) {
      this.$refs.classListTable.destroyTableHeightCalculator()
    }

    // 清理防抖定时器
    if (this.paginationTimer) {
      clearTimeout(this.paginationTimer)
      this.paginationTimer = null
    }
    if (this.studentPaginationTimer) {
      clearTimeout(this.studentPaginationTimer)
      this.studentPaginationTimer = null
    }
  },
  methods: {
    // Tab切换处理
    handleTabClick(tab) {
      if (tab.name === 'students') {
        // 切换到学员列表时，延迟初始化表格高度计算器
        this.$nextTick(() => {
          if (this.$refs.studentListTable) {
            this.$refs.studentListTable.initTableHeightCalculator()
          }
        })
      } else if (tab.name === 'classes') {
        // 切换到课次列表时，延迟初始化表格高度计算器
        this.$nextTick(() => {
          if (this.$refs.classListTable) {
            this.$refs.classListTable.initTableHeightCalculator()
          }
        })
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

        // 如果有班级信息，根据班型筛选适用教材
        if (this.classDetail && this.classDetail.classTypeCodeName) {
          this.joyEnglishTextbookList = this.filterTextbooksByClassType(enabledTextbooks, this.classDetail.classTypeCodeName)
        } else {
          // 没有班级信息时，返回所有启用的教材
          this.joyEnglishTextbookList = enabledTextbooks
        }
      } catch (error) {
        this.$message.error('获取教材列表失败')
      }
    },

    // 根据班型筛选适用教材
    filterTextbooksByClassType(textbooks, classTypeName) {
      if (!textbooks || !Array.isArray(textbooks) || !classTypeName) {
        return []
      }

      return textbooks.filter(textbook => {
        // 检查教材的subCourseKindList是否包含当前班型
        if (!textbook.subCourseKindList || !Array.isArray(textbook.subCourseKindList)) {
          return false
        }

        // 查找是否有匹配的班型
        return textbook.subCourseKindList.some(courseKind => {
          return courseKind.subCourseKindName === classTypeName
        })
      })
    },

    // 校验并显示周期排课弹窗
    async checkAndShowPeriodicScheduleDialog() {
      try {
        const hasSchedulePeriod = await this.checkSchedulePeriod()
        // 设置是否已有上课周期的状态
        this.hasSchedulePeriod = hasSchedulePeriod

        if (!hasSchedulePeriod) {
          // 未设置上课周期，弹出设置弹窗
          this.$nextTick(() => {
            this.showPeriodicScheduleDialog = true
          })
        }
      } catch (error) {
        // 校验失败时不弹窗，让用户正常使用详情页
        this.hasSchedulePeriod = false
      }
    },

    // 校验是否设置了上课周期
    async checkSchedulePeriod() {
      try {
        // 方法1: 通过attendClassPeriod字段判断
        if (this.classDetail.attendClassPeriod && this.classDetail.attendClassPeriod.trim() !== '') {
          return true
        }
      } catch (error) {
        // 校验失败时默认认为已设置，避免误弹窗
        return true
      }
    },

    // 加载班级详情
    async loadClassDetail() {
      try {
        // 调用真实API
        const res = await One2ManyApi.getScheduleCourseDetail(this.classId)
        this.classDetail = res || {}
      } catch (error) {
        this.$message.error(error || '获取班级详情失败')
      }
    },

    // 加载课次列表
    async loadClassList() {
      this.loading = true
      try {
        // 调用真实API
        const res = await One2ManyApi.getScheduleCourseTimesList(this.classFilter)

        // 为每个课次添加索引属性
        this.classList = (res.list || []).map((item, index) => ({
          ...item,
          indexSeq: index + 1 // 添加索引序号，从1开始
        }))

        this.classTotal = res.total || 0

        // 在数据加载完成后初始化表格高度计算器（仅当课次tab激活时）
        if (this.activeTab === 'classes') {
          this.$nextTick(() => {
            if (this.$refs.classListTable) {
              this.$refs.classListTable.initTableHeightCalculator()
            }
          })
        }
      } catch (error) {
        this.$message.error(error?.message || error || '获取课次列表失败')
      } finally {
        this.loading = false
      }
    },

    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedClasses = selection
    },

    // 修改班级信息
    handleModifyClassInfo() {
      this.showModifyDialog = true
    },

    // 确认修改班级信息
    handleModifyConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新班级详情
      this.loadClassDetail()
      this.loadClassList()
    },

    // 调整上课周期
    handleAdjustSchedule() {
      this.showAdjustScheduleDialog = true
    },

    // 确认调整上课周期
    async handleAdjustScheduleConfirm(formData) {
      this.loadClassDetail()
      this.loadClassList()
    },

    // 结课
    handleFinishClass() {
      this.showFinishDialog = true
    },

    // 确认结课
    async handleFinishConfirm() {
      this.classDetail.teachingStatus = 'finished'
      this.loadClassDetail()
    },

    // 其他操作按钮
    handleSyncClassIn() {
      this.$confirm('确认同步到ClassIn平台？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          const loading = this.$loading({
            lock: true,
            text: '操作中，请稍候...',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })

          try {
            const params = {
              courseId: Number(this.classId)
            }
            await One2ManyApi.addClassinCourse(params)
            loading.close()
            this.$message.success('同步ClassIn成功！')
          } catch (error) {
            loading.close()
            this.$message.error(error)
          }
        })
        .catch(() => {
          // 用户取消操作
        })
    },

    handlePrintRoster() {
      window.open(`${process.env.VUE_APP_ERP_URL}printhtml/print_classroll_ydd.html?courseId=${this.classId}`, '_blank')
    },

    // 周期排课
    async handlePeriodicSchedule() {
      try {
        // 点击周期排课按钮时，检查当前是否已有上课周期
        const hasSchedulePeriod = await this.checkSchedulePeriod()
        this.hasSchedulePeriod = hasSchedulePeriod
      } catch (error) {
        this.hasSchedulePeriod = false
      }
      this.showPeriodicScheduleDialog = true
    },

    // 确认周期排课
    async handlePeriodicScheduleConfirm(formData) {
      // 刷新班级详情和课次列表
      await Promise.all([this.loadClassDetail(), this.loadClassList()])
    },

    // 处理排课确认
    handleScheduleConfirm(scheduleData) {
      this.scheduleConfirmData = scheduleData
      this.showScheduleConfirmDialog = true
    },

    // 处理排课成功
    handleScheduleSuccess() {
      this.showScheduleConfirmDialog = false
      this.showPeriodicScheduleDialog = false // 同时关闭周期排课弹窗
      // 刷新课次列表
      this.loadClassList()
      this.loadClassDetail()
    },

    // 筛选变化
    handleFilterChange(filter) {
      Object.assign(this.classFilter, filter)
      this.classFilter.currentPage = 1 // 重置到第一页
      this.loadClassList()
    },

    // 课次列表分页更新
    handleClassPaginationUpdate({ currentPage, pageSize }) {
      this.classFilter.currentPage = currentPage
      this.classFilter.pageSize = pageSize

      // 使用防抖避免短时间内多次调用
      if (this.paginationTimer) {
        clearTimeout(this.paginationTimer)
      }
      this.paginationTimer = setTimeout(() => {
        this.loadClassList()
        this.paginationTimer = null
      }, 100) // 100ms 防抖延迟
    },

    // 批量操作命令
    handleBatchCommand(command) {
      switch (command) {
        case 'batchDelete':
          this.handleBatchDelete()
          break
        case 'batchMaterial':
          this.handleBatchMaterial()
          break
        case 'batchManager':
          this.handleBatchManager()
          break
        case 'batchTeacher':
          this.handleBatchTeacher()
          break
        case 'batchForeignTeacher':
          this.handleBatchForeignTeacher()
          break
      }
    },

    // 批量删除课次
    handleBatchDelete() {
      if (this.selectedClasses?.some(item => item.attendStatus === 3 || item.attendStatus === 4)) {
        this.$message.warning('所选课次中包含已考勤的课次，无法删除哦~')
        return
      }
      if (this.selectedClasses.length === 0) {
        this.$message.warning('请先选择要删除的课次')
        return
      }
      this.isBatchDelete = true
      this.currentDeleteClass = null
      this.showDeleteDialog = true
    },

    // 批量调整教材单元进度
    handleBatchMaterial() {
      this.adjustMaterialForm = {
        currentMaterial: '',
        currentUnit: []
      }
      this.currentUnitOptions = []
      this.showAdjustMaterialDialog = true
    },

    // 批量调整班主任
    handleBatchManager() {
      this.adjustManagerForm = {
        courseManagerId: '', // 批量操作不回显，保持为空
        courseManagerName: ''
      }
      this.showAdjustManagerDialog = true
    },

    // 批量调整老师
    handleBatchTeacher() {
      this.adjustTeacherForm = {
        teacherId: '', // 批量操作不回显，保持为空
        teacherName: ''
      }
      this.showAdjustTeacherDialog = true
    },

    // 批量调整外教
    handleBatchForeignTeacher() {
      this.adjustForeignTeacherForm = {
        foreignTeacherId: '', // 批量操作不回显，保持为空
        foreignTeacherName: ''
      }
      this.showAdjustForeignTeacherDialog = true
    },

    // 课次详情
    handleClassDetail(row) {
      this.$message.info('课次详情功能开发中...')
    },

    // 考勤
    handleAttendance(row) {
      this.$message.info('跳转到考勤页面功能开发中...')
    },

    // 课次操作命令
    handleClassCommand(command, row) {
      this.currentOperateClass = row

      switch (command) {
        case 'adjustTime':
          this.handleAdjustTime(row)
          break
        case 'deleteClass':
          this.handleDeleteClass(row)
          break
        case 'adjustMaterial':
          this.handleAdjustMaterialSingle(row)
          break
        case 'adjustManager':
          this.handleAdjustManagerSingle(row)
          break
        case 'adjustTeacher':
          this.handleAdjustTeacherSingle(row)
          break
        case 'adjustForeignTeacher':
          this.handleAdjustForeignTeacherSingle(row)
          break
      }
    },

    // 调整上课时间
    handleAdjustTime(row) {
      if (row.attendStatus === 3 || row.attendStatus === 4) {
        this.$message.warning('当前课次已有考勤记录，无法调整哦~')
        return
      }

      // 计算原课次时长
      const originalDuration = this.calculateDuration(row.startTime, row.endTime)

      this.adjustTimeForm = {
        courseDate: row.courseDate,
        startTime: row.startTime || '',
        endTime: row.endTime || '',
        duration: originalDuration, // 初始化为原时长
        originalDuration: originalDuration,
        previousValidDuration: originalDuration // 初始化为原时长
      }
      this.showAdjustTimeDialog = true
    },

    // 计算时长（分钟）
    calculateDuration(startTime, endTime) {
      if (!startTime || !endTime) {
        return 0
      }

      const [startHour, startMinute] = startTime?.split(':').map(Number)
      const [endHour, endMinute] = endTime?.split(':').map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      return endMinutes - startMinutes
    },

    // 处理开始时间变化
    handleAdjustStartTimeChange() {
      if (this.adjustTimeForm.startTime && this.adjustTimeForm.duration) {
        this.calculateAdjustEndTime()
      }
    },

    // 处理开始时间聚焦事件
    handleAdjustStartTimeFocus() {
      // 如果还没有设置开始时间，则设置为当前时间的整点
      if (!this.adjustTimeForm.startTime) {
        const now = new Date()
        const currentHour = now.getHours()
        this.adjustTimeForm.startTime = `${currentHour.toString().padStart(2, '0')}:00`
        // 设置开始时间后，自动计算结束时间
        this.calculateAdjustEndTime()
      }
    },

    // 处理课次时长变化
    handleAdjustDurationChange(val) {
      // 校验课次时长是否满足最小时长和整数倍要求
      if (val && this.minClassDuration > 0) {
        // 校验1：时长不能小于最小课次时长
        if (val < this.minClassDuration) {
          this.$message.warning(`课次时长不能小于最小课次时长${this.minClassDuration}分钟，请调整`)
          this.$nextTick(() => {
            this.$set(this.adjustTimeForm, 'duration', this.adjustTimeForm.previousValidDuration)
          })
          return
        }

        // 校验2：时长必须是最小课次时长的整数倍
        if (val % this.minClassDuration !== 0) {
          this.$message.warning(`课次时长必须为最小课次时长${this.minClassDuration}分钟的整数倍，请调整`)
          // 恢复到上一次的合理值
          this.$nextTick(() => {
            this.$set(this.adjustTimeForm, 'duration', this.adjustTimeForm.previousValidDuration)
          })
          return
        }
      }

      // 如果校验通过，保存这个值作为上一次的合理值
      if (val && val > 0) {
        this.adjustTimeForm.previousValidDuration = val
      }

      if (this.adjustTimeForm.startTime) {
        this.calculateAdjustEndTime()
      }
    },

    // 计算调整时间的结束时间
    calculateAdjustEndTime() {
      if (!this.adjustTimeForm.startTime || !this.adjustTimeForm.duration) {
        this.adjustTimeForm.endTime = ''
        return
      }

      const [hours, minutes] = this.adjustTimeForm.startTime.split(':')
      const startMinutes = parseInt(hours) * 60 + parseInt(minutes)
      const endMinutes = startMinutes + this.adjustTimeForm.duration

      // 检查是否超过第二天
      if (endMinutes > 24 * 60) {
        this.$message.warning('下课时间不能超过第二天，请重新选择上课时间')
        this.adjustTimeForm.startTime = ''
        this.adjustTimeForm.endTime = ''
        return
      }

      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      this.adjustTimeForm.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    },

    // 确认调整时间
    async handleAdjustTimeConfirm() {
      try {
        const valid = await this.$refs.adjustTimeForm.validate().catch(() => false)
        if (!valid) {
          return
        }

        // 验证结束时间是否已计算
        if (!this.adjustTimeForm.endTime) {
          this.$message.warning('请选择开始时间')
          return
        }

        this.adjustTimeLoading = true

        // 构建API参数
        const params = [
          {
            counselorId: this.currentOperateClass.counselorId || '',
            courseDate: this.adjustTimeForm.courseDate,
            courseManagerId: this.currentOperateClass.courseManagerId || 0,
            enCounselorId: this.currentOperateClass.enCounselorId || '',
            foreignTeacherId: this.currentOperateClass.foreignTeacherId || 0,
            endTime: this.adjustTimeForm.endTime,
            id: this.currentOperateClass.id,
            seq: this.currentOperateClass.indexSeq,
            startTime: this.adjustTimeForm.startTime,
            teacherId: this.currentOperateClass.teacherId || 0,
            textbook: this.currentOperateClass.textbook || 0,
            textbookName: this.currentOperateClass.textbookName || ''
          }
        ]

        // 调用修改课次API
        await One2ManyApi.editScheduleCourse(this.currentOperateClass.id, params)

        this.$message.success('调整上课时间成功')
        this.showAdjustTimeDialog = false
        this.loadClassList()
      } catch (error) {
        this.$message.error(error || '调整上课时间失败')
      } finally {
        this.adjustTimeLoading = false
      }
    },

    // 删除课次
    handleDeleteClass(row) {
      // 部分点名和已点名不允许删除
      if (row.attendStatus === 3 || row.attendStatus === 4) {
        this.$message.warning('当前课次已有考勤记录，无法删除哦~')
        return
      }
      this.isBatchDelete = false
      this.currentDeleteClass = row
      this.showDeleteDialog = true
    },

    // 确认删除课次
    async handleDeleteConfirm() {
      this.deleteLoading = true
      try {
        let delQos = []

        if (this.isBatchDelete) {
          // 批量删除：构建多个课次的删除参数
          delQos = this.selectedClasses.map(classItem => ({
            id: classItem.id,
            seq: classItem.indexSeq // 使用原始列表中的索引序号
          }))
        } else {
          // 单个删除：构建单个课次的删除参数
          delQos = [
            {
              id: this.currentDeleteClass.id,
              seq: this.currentDeleteClass.indexSeq // 使用原始列表中的索引序号
            }
          ]
        }

        const params = {
          delQos: delQos,
          userId: this.userInfo.id || 0
        }

        // 调用删除课次API
        await One2ManyApi.batchDeleteSchedule(params)

        if (this.isBatchDelete) {
          this.$message.success(`成功删除${this.selectedClasses.length}个课次`)
          this.selectedClasses = []
        } else {
          this.$message.success('删除课次成功')
        }

        this.showDeleteDialog = false
        this.loadClassList()
        this.loadClassDetail()
      } catch (error) {
        this.$message.error(error || (this.isBatchDelete ? '批量删除课次失败' : '删除课次失败'))
      } finally {
        this.deleteLoading = false
      }
    },

    // 单个调整教材单元进度
    handleAdjustMaterialSingle(row) {
      // 解析 unit 字符串为数组（如 "1,2" -> [1, 2]）
      let currentUnit = []
      if (row.unit && typeof row.unit === 'string') {
        currentUnit = row.unit
          .split(',')
          .map(item => parseInt(item.trim()))
          .filter(item => !isNaN(item))
      }

      this.adjustMaterialForm = {
        currentMaterial: row.textbook || '',
        currentUnit: currentUnit
      }
      this.currentUnitOptions = []
      // 如果有选中的教材，生成对应的单元选项
      if (row.textbook) {
        this.generateUnitOptions(row.textbook)
      }
      this.showAdjustMaterialDialog = true
    },

    // 教材变化处理（调整弹窗中）
    handleMaterialChangeInAdjust(materialId) {
      this.adjustMaterialForm.currentUnit = [] // 清空已选单元
      this.generateUnitOptions(materialId)
    },

    // 根据教材ID生成单元选项
    generateUnitOptions(materialId) {
      const textbook = this.joyEnglishTextbookList.find(item => item.id === materialId)
      if (textbook && textbook.unitNum) {
        this.currentUnitOptions = []
        for (let i = 1; i <= textbook.unitNum; i++) {
          this.currentUnitOptions.push({
            label: `Unit${i}`,
            value: i
          })
        }
      } else {
        this.currentUnitOptions = []
      }
    },

    // 确认调整教材
    async handleAdjustMaterialConfirm() {
      try {
        const valid = await this.$refs.adjustMaterialForm.validate().catch(() => false)
        if (!valid) {
          return
        }
        this.adjustMaterialLoading = true

        let params = []

        // 获取选中教材的名称
        const selectedTextbook = this.joyEnglishTextbookList.find(item => item.id === this.adjustMaterialForm.currentMaterial)
        const textbookName = selectedTextbook ? selectedTextbook.textbookName : ''

        if (this.selectedClasses.length > 0) {
          // 批量调整教材单元进度
          params = this.selectedClasses.map(classItem => ({
            id: classItem.id,
            textbook: this.adjustMaterialForm.currentMaterial,
            textbookName: textbookName,
            unit: Array.isArray(this.adjustMaterialForm.currentUnit)
              ? [...this.adjustMaterialForm.currentUnit].sort((a, b) => a - b)
              : this.adjustMaterialForm.currentUnit
              ? [this.adjustMaterialForm.currentUnit]
              : []
          }))
        } else {
          // 单个调整教材单元进度
          params = [
            {
              id: this.currentOperateClass.id,
              textbook: this.adjustMaterialForm.currentMaterial,
              textbookName: textbookName,
              unit: Array.isArray(this.adjustMaterialForm.currentUnit)
                ? [...this.adjustMaterialForm.currentUnit].sort((a, b) => a - b)
                : this.adjustMaterialForm.currentUnit
                ? [this.adjustMaterialForm.currentUnit]
                : []
            }
          ]
        }

        // 调用专门的调整教材单元进度API
        await One2ManyApi.changeScheduleCourseTextbook(params)

        const isIsBatch = this.selectedClasses.length > 0
        this.$message.success(isIsBatch ? `成功调整${params.length}个课次的教材单元进度` : '调整教材单元进度成功')
        this.showAdjustMaterialDialog = false
        this.selectedClasses = []
        this.loadClassList()
      } catch (error) {
        this.$message.error(error || '调整教材单元进度失败')
      } finally {
        this.adjustMaterialLoading = false
      }
    },

    // 单个调整班主任
    handleAdjustManagerSingle(row) {
      this.adjustManagerForm = {
        courseManagerId: row.courseManagerId || '',
        courseManagerName: row.courseManagerName || ''
      }
      this.showAdjustManagerDialog = true
    },

    // 确认调整班主任
    async handleAdjustManagerConfirm() {
      try {
        const valid = await this.$refs.adjustManagerForm.validate().catch(() => false)
        if (!valid) {
          return
        }

        this.adjustManagerLoading = true

        let params = []

        if (this.selectedClasses.length > 0) {
          // 批量调整班主任
          params = this.selectedClasses.map(classItem => ({
            counselorId: classItem.counselorId || '',
            courseDate: classItem.courseDate,
            courseManagerId: this.adjustManagerForm.courseManagerId,
            enCounselorId: classItem.enCounselorId || '',
            foreignTeacherId: classItem.foreignTeacherId || 0,
            endTime: classItem.endTime || '',
            id: classItem.id,
            seq: classItem.indexSeq,
            startTime: classItem.startTime || '',
            teacherId: classItem.teacherId || 0,
            textbook: classItem.textbook || 0,
            textbookName: classItem.textbookName || ''
          }))
        } else {
          // 单个调整班主任
          params = [
            {
              counselorId: this.currentOperateClass.counselorId || '',
              courseDate: this.currentOperateClass.courseDate,
              courseManagerId: this.adjustManagerForm.courseManagerId,
              enCounselorId: this.currentOperateClass.enCounselorId || '',
              foreignTeacherId: this.currentOperateClass.foreignTeacherId || 0,
              endTime: this.currentOperateClass.endTime || '',
              id: this.currentOperateClass.id,
              seq: this.currentOperateClass.indexSeq,
              startTime: this.currentOperateClass.startTime || '',
              teacherId: this.currentOperateClass.teacherId || 0,
              textbook: this.currentOperateClass.textbook || 0,
              textbookName: this.currentOperateClass.textbookName || ''
            }
          ]
        }

        // 调用修改课次API
        const firstId = params[0].id
        await One2ManyApi.editScheduleCourse(firstId, params)

        const isIsBatch = this.selectedClasses.length > 0
        this.$message.success(isIsBatch ? `成功调整${params.length}个课次的班主任` : '调整班主任成功')
        this.showAdjustManagerDialog = false
        this.selectedClasses = []
        this.loadClassList()
      } catch (error) {
        this.$message.error(error || '调整班主任失败')
      } finally {
        this.adjustManagerLoading = false
      }
    },

    // 单个调整老师
    handleAdjustTeacherSingle(row) {
      this.adjustTeacherForm = {
        teacherId: row.teacherId || '',
        teacherName: row.teacherName || ''
      }
      this.showAdjustTeacherDialog = true
    },

    // 单个调整外教
    handleAdjustForeignTeacherSingle(row) {
      this.adjustForeignTeacherForm = {
        foreignTeacherId: row.foreignTeacherId || '',
        foreignTeacherName: row.foreignTeacherName || ''
      }
      this.showAdjustForeignTeacherDialog = true
    },

    // 确认调整老师
    async handleAdjustTeacherConfirm() {
      try {
        const valid = await this.$refs.adjustTeacherForm.validate().catch(() => false)
        if (!valid) {
          return
        }
        this.adjustTeacherLoading = true

        let params = []

        if (this.selectedClasses.length > 0) {
          // 批量调整老师
          params = this.selectedClasses.map(classItem => ({
            counselorId: classItem.counselorId || '',
            courseDate: classItem.courseDate,
            courseManagerId: classItem.courseManagerId || 0,
            enCounselorId: classItem.enCounselorId || '',
            foreignTeacherId: classItem.foreignTeacherId || 0,
            endTime: classItem.endTime || '',
            id: classItem.id,
            seq: classItem.indexSeq,
            startTime: classItem.startTime || '',
            teacherId: this.adjustTeacherForm.teacherId,
            textbook: classItem.textbook || 0,
            textbookName: classItem.textbookName || ''
          }))
        } else {
          // 单个调整老师
          params = [
            {
              counselorId: this.currentOperateClass.counselorId || '',
              courseDate: this.currentOperateClass.courseDate,
              courseManagerId: this.currentOperateClass.courseManagerId || 0,
              enCounselorId: this.currentOperateClass.enCounselorId || '',
              foreignTeacherId: this.currentOperateClass.foreignTeacherId || 0,
              endTime: this.currentOperateClass.endTime || '',
              id: this.currentOperateClass.id,
              seq: this.currentOperateClass.indexSeq,
              startTime: this.currentOperateClass.startTime || '',
              teacherId: this.adjustTeacherForm.teacherId,
              textbook: this.currentOperateClass.textbook || 0,
              textbookName: this.currentOperateClass.textbookName || ''
            }
          ]
        }

        // 调用修改课次API
        const firstId = params[0].id
        await One2ManyApi.editScheduleCourse(firstId, params)

        const isIsBatch = this.selectedClasses.length > 0
        this.$message.success(isIsBatch ? `成功调整${params.length}个课次的老师` : '调整老师成功')
        this.showAdjustTeacherDialog = false
        this.selectedClasses = []
        this.loadClassList()
      } catch (error) {
        this.$message.error(error || '调整老师失败')
      } finally {
        this.adjustTeacherLoading = false
      }
    },

    // 确认调整外教
    async handleAdjustForeignTeacherConfirm() {
      try {
        // 外教为非必填，不需要严格验证
        this.adjustForeignTeacherLoading = true
        // 如果外教为空，则不调整

        let params = []

        if (this.selectedClasses.length > 0) {
          // 批量调整外教
          params = this.selectedClasses.map(classItem => ({
            counselorId: classItem.counselorId || '',
            courseDate: classItem.courseDate,
            courseManagerId: classItem.courseManagerId || 0,
            enCounselorId: this.adjustForeignTeacherForm.foreignTeacherId || '',
            foreignTeacherId: this.adjustForeignTeacherForm.foreignTeacherId || 0,
            endTime: classItem.endTime || '',
            id: classItem.id,
            seq: classItem.indexSeq,
            startTime: classItem.startTime || '',
            teacherId: classItem.teacherId || 0,
            textbook: classItem.textbook || 0,
            textbookName: classItem.textbookName || ''
          }))
        } else {
          // 单个调整外教
          params = [
            {
              counselorId: this.currentOperateClass.counselorId || '',
              courseDate: this.currentOperateClass.courseDate,
              courseManagerId: this.currentOperateClass.courseManagerId || '',
              enCounselorId: this.adjustForeignTeacherForm.foreignTeacherId || '',
              foreignTeacherId: this.adjustForeignTeacherForm.foreignTeacherId || '',
              endTime: this.currentOperateClass.endTime || '',
              id: this.currentOperateClass.id,
              seq: this.currentOperateClass.indexSeq,
              startTime: this.currentOperateClass.startTime || '',
              teacherId: this.currentOperateClass.teacherId || 0,
              textbook: this.currentOperateClass.textbook || 0,
              textbookName: this.currentOperateClass.textbookName || ''
            }
          ]
        }

        // 调用修改课次API
        const firstId = params[0].id
        await One2ManyApi.editScheduleCourse(firstId, params)

        const isIsBatch = this.selectedClasses.length > 0
        this.$message.success(isIsBatch ? `成功调整${params.length}个课次的外教` : '调整外教成功')
        this.showAdjustForeignTeacherDialog = false
        this.selectedClasses = []
        this.loadClassList()
      } catch (error) {
        this.$message.error(error || '调整外教失败')
      } finally {
        this.adjustForeignTeacherLoading = false
      }
    },

    // ===================学员管理相关方法===================

    // 加载学员列表
    async loadStudentList() {
      this.studentLoading = true
      try {
        // 调用真实API
        const res = await One2ManyApi.getScheduleStudentList(this.studentFilter)

        this.studentList = res?.list || []
        this.studentTotal = res?.total || 0
      } catch (error) {
        this.$message.error(error || '获取学员列表失败')
      } finally {
        this.studentLoading = false
      }
    },

    // 学员筛选变化
    handleStudentFilterChange(filter) {
      Object.assign(this.studentFilter, filter)
      this.studentFilter.currentPage = 1
      this.loadStudentList()
    },

    // 学员列表分页更新
    handleStudentPaginationUpdate({ currentPage, pageSize }) {
      this.studentFilter.currentPage = currentPage
      this.studentFilter.pageSize = pageSize

      // 使用防抖避免短时间内多次调用
      if (this.studentPaginationTimer) {
        clearTimeout(this.studentPaginationTimer)
      }
      this.studentPaginationTimer = setTimeout(() => {
        this.loadStudentList()
        this.studentPaginationTimer = null
      }, 100) // 100ms 防抖延迟
    },

    // 学员选择变化
    handleStudentSelectionChange(selection) {
      this.selectedStudents = selection
    },

    // 学员详情
    handleStudentDetail(row) {
      // 预留学员详情功能
      this.$message.info('学员详情功能开发中...')
    },

    // 添加学员
    handleAddStudent() {
      this.showAddStudentDialog = true
    },

    // 添加学员确认
    handleAddStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 学员批量操作
    handleStudentBatchCommand(command, selectedStudents) {
      if (selectedStudents.length === 0) {
        this.$message.warning('请先选择学员')
        return
      }

      this.selectedStudents = selectedStudents
      this.isBatchStudentOperation = true

      switch (command) {
        case 'batchSuspend':
          this.handleBatchSuspend()
          break
        case 'batchResume':
          this.handleBatchResume()
          break
        case 'batchTransfer':
          this.handleBatchTransfer()
          break
      }
    },

    // 批量停课
    handleBatchSuspend() {
      // 检查是否都是在读状态（studentStatus === 1）
      const allActive = this.selectedStudents.every(student => student.studentStatus === 1)
      if (!allActive) {
        // todo ?
        this.$message.warning('所选学员中存在非在读状态学员，无法批量停课哦~')
        return
      }

      this.currentStudent = null
      this.isModifySuspend = false
      this.showSuspendStudentDialog = true
    },

    // 批量复课
    handleBatchResume() {
      // 检查是否都是停课状态（studentStatus === 3）
      const allSuspended = this.selectedStudents.every(student => student.studentStatus === 3)
      if (!allSuspended) {
        // ? todo
        this.$message.warning('所选学员中存在非停课状态学员，无法批量复课哦~')
        return
      }

      this.currentStudent = null
      this.showBatchResumeStudentDialog = true
    },

    // 批量转班
    handleBatchTransfer() {
      // 检查是否都是在读或新生状态（studentStatus === 1 或 6）
      const allValid = this.selectedStudents.every(student => [1, 6].includes(student.studentStatus))
      if (!allValid) {
        this.$message.warning('所选学员中存在非在读、新生状态学员，无法批量转班哦~')
        return
      }

      this.currentStudent = null
      this.showTransferStudentDialog = true
    },

    // 学员操作命令
    handleStudentCommand(command, row) {
      this.currentStudent = row
      this.isBatchStudentOperation = false

      switch (command) {
        case 'modifyFirstClassDate':
          this.showModifyFirstClassDateDialog = true
          break
        case 'suspend':
          this.isModifySuspend = false
          this.showSuspendStudentDialog = true
          break
        case 'modifySuspend':
          this.isModifySuspend = true
          this.showSuspendStudentDialog = true
          break
        case 'cancelSuspend':
          this.handleCancelSuspend(row)
          break
        case 'resume':
          this.showResumeStudentDialog = true
          break
        case 'loss':
          this.showLossStudentDialog = true
          break
        case 'remove':
          this.handleRemoveStudent(row)
          break
        case 'transfer':
          this.showTransferStudentDialog = true
          break
        case 'selectOrders':
          this.showSelectOrdersDialog = true
          break
      }
    },

    // 取消停课
    handleCancelSuspend(row) {
      this.confirmDialogConfig = {
        title: '取消停课',
        message: `请确认是否将 <span style="color: #4F8Bed">${row.studentName}</span> 取消停课？取消后，停课期间内课次将恢复正常排课。`,
        confirmText: '确定取消停课',
        data: { type: 'cancelSuspend', student: row }
      }
      this.showConfirmDialog = true
    },

    // 移除学员
    handleRemoveStudent(row) {
      this.confirmDialogConfig = {
        title: '移除',
        message: `请确认是否将 <span style="color: #4F8Bed">${row.studentName}</span> 从 <span style="color: #4F8Bed">${this.classDetail.courseName}</span> 里移除？`,
        confirmText: '确定移除',
        data: { type: 'removeStudent', student: row }
      }
      this.showConfirmDialog = true
    },

    // 停课确认
    handleSuspendStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 转班确认
    handleTransferStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 修改首课可排日期确认
    handleModifyFirstClassDateConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 选择排课订单确认
    handleSelectOrdersConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 复课确认
    handleResumeStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 流失确认
    handleLossStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 批量复课确认
    handleBatchResumeStudentConfirm(formData) {
      // 弹窗内部已经处理了API调用，这里只需要刷新列表
      this.loadStudentList()
    },

    // 通用确认弹窗确认
    async handleConfirmDialogConfirm(data) {
      try {
        switch (data.type) {
          case 'cancelSuspend':
            await this.handleCancelSuspendConfirm(data.student)
            break
          case 'removeStudent':
            await this.handleRemoveStudentConfirm(data.student)
            break
        }
      } catch (error) {
        this.$message.error(error || '操作失败')
      }
    },

    // 确认取消停课
    async handleCancelSuspendConfirm(student) {
      try {
        // 调用取消停课API
        await One2ManyApi.cancelStopScheduleStudent(student.id)
        this.$message.success('取消停课成功')
        this.loadStudentList()
      } catch (error) {
        this.$message.error(error || '取消停课失败')
      }
    },

    // 确认移除学员
    async handleRemoveStudentConfirm(student) {
      try {
        // 调用移除学员API
        await One2ManyApi.removeScheduleStudent(student.id)
        this.$message.success('移除学员成功')
        this.loadStudentList()
      } catch (error) {
        this.$message.error(error || '移除学员失败')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.schedule-detail {
  // Tab区域
  .detail-tabs {
    ::v-deep .el-tabs__header {
      margin: 0 0 20px 0;
    }
  }

  // 通用样式
  .g-mt {
    margin-top: 20px;
  }

  .g-tar {
    text-align: right;
  }

  .dialog-footer {
    text-align: right;
  }

  .delete-content {
    padding: 10px 0;
  }

  .time-separator {
    margin: 0 8px;
    color: #606266;
  }

  .unit {
    margin-left: 8px;
    color: #606266;
    font-size: 13px;
  }

  .info-label {
    color: #909399;
    font-size: 12px;
  }
}

// 弹窗样式，参考之前的样式
::v-deep .el-dialog.modify-class-dialog,
::v-deep .el-dialog.finish-class-dialog,
::v-deep .el-dialog.delete-class-dialog,
::v-deep .el-dialog.adjust-time-dialog,
::v-deep .el-dialog.adjust-teacher-dialog,
::v-deep .el-dialog.adjust-manager-dialog,
::v-deep .el-dialog.adjust-foreign-teacher-dialog,
::v-deep .el-dialog.adjust-material-dialog,
::v-deep .el-dialog.periodic-schedule-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.modify-class-dialog .el-dialog__header,
::v-deep .el-dialog.finish-class-dialog .el-dialog__header,
::v-deep .el-dialog.delete-class-dialog .el-dialog__header,
::v-deep .el-dialog.adjust-time-dialog .el-dialog__header,
::v-deep .el-dialog.adjust-teacher-dialog .el-dialog__header,
::v-deep .el-dialog.adjust-manager-dialog .el-dialog__header,
::v-deep .el-dialog.adjust-foreign-teacher-dialog .el-dialog__header,
::v-deep .el-dialog.adjust-material-dialog .el-dialog__header,
::v-deep .el-dialog.periodic-schedule-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.modify-class-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.finish-class-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.delete-class-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.adjust-time-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.adjust-teacher-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.adjust-manager-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.adjust-foreign-teacher-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.adjust-material-dialog .el-dialog__header .el-dialog__title,
::v-deep .el-dialog.periodic-schedule-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.modify-class-dialog .el-dialog__body,
::v-deep .el-dialog.finish-class-dialog .el-dialog__body,
::v-deep .el-dialog.delete-class-dialog .el-dialog__body,
::v-deep .el-dialog.adjust-time-dialog .el-dialog__body,
::v-deep .el-dialog.adjust-teacher-dialog .el-dialog__body,
::v-deep .el-dialog.adjust-manager-dialog .el-dialog__body,
::v-deep .el-dialog.adjust-foreign-teacher-dialog .el-dialog__body,
::v-deep .el-dialog.adjust-material-dialog .el-dialog__body,
::v-deep .el-dialog.periodic-schedule-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.modify-class-dialog .el-dialog__footer,
::v-deep .el-dialog.finish-class-dialog .el-dialog__footer,
::v-deep .el-dialog.delete-class-dialog .el-dialog__footer,
::v-deep .el-dialog.adjust-time-dialog .el-dialog__footer,
::v-deep .el-dialog.adjust-teacher-dialog .el-dialog__footer,
::v-deep .el-dialog.adjust-manager-dialog .el-dialog__footer,
::v-deep .el-dialog.adjust-foreign-teacher-dialog .el-dialog__footer,
::v-deep .el-dialog.adjust-material-dialog .el-dialog__footer,
::v-deep .el-dialog.periodic-schedule-dialog .el-dialog__footer {
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
