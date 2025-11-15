<template>
  <el-drawer
    :title="drawerTitle"
    :visible.sync="drawerVisible"
    direction="rtl"
    size="800px"
    :close-on-press-escape="false"
    :wrapperClosable="false"
    @close="handleClose"
    custom-class="makeup-attendance-drawer"
  >
    <div class="drawer-container" v-loading="loading">
      <div class="content-wrapper">
        <!-- 课次信息 -->
        <div class="class-info-section">
          <div class="section-title">课次信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">上课日期</span>
              <span class="value">{{ classInfo.classDate || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">上课时间</span>
              <span class="value">{{ classInfo.classTime || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">班级名称</span>
              <span class="value">{{ classInfo.className || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">班主任</span>
              <span class="value">{{ classInfo.courseManagerName || '-' }}</span>
            </div>
          </div>

          <!-- 老师信息 - 根据是否为佳音展示不同内容 -->
          <div v-if="!isJiayin" class="teacher-simple">
            <div class="info-item">
              <span class="label">老师</span>
              <span class="value">{{ classInfo.teacherName || '-' }}</span>
            </div>
          </div>

          <!-- 佳音老师列表 -->
          <div v-else class="teacher-list">
            <el-table :data="teacherList" border style="width: 100%; margin-top: 12px;" header-cell-class-name="table-header-cell">
              <el-table-column prop="type" label="类型" width="70" align="center" />
              <el-table-column label="老师" width="210" align="center">
                <template slot-scope="scope">
                  <HiAsyncSelector
                    v-model="scope.row.teacherId"
                    dict-key="teacher"
                    :defaultWord="scope.row.teacherName"
                    :param="{ buId: userBaseInfo.buId, size: 100 }"
                    placeholder="请输入老师姓名/编码"
                    size="small"
                    clearable
                    @change="(value, option) => handleTeacherChange(scope.$index, value, option)"
                    style="width: 100%"
                  >
                    <template v-slot="slotProps">
                      <span>{{ slotProps.label }}</span>
                      <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                    </template>
                  </HiAsyncSelector>
                </template>
              </el-table-column>
              <el-table-column label="正课" align="center">
                <template slot-scope="scope">
                  <div class="time-input-wrapper">
                    <el-input-number
                      :disabled="scope.row.type === '中教'"
                      v-model="scope.row.regularMinutes"
                      :min="0"
                      :max="classDuration"
                      size="small"
                      class="time-input"
                      @change="handleRegularTimeChange(scope.$index)"
                      style="width: 120px"
                    />
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="口语" align="center">
                <template slot-scope="scope">
                  <div v-if="scope.row.type === '外教'" class="time-input-wrapper">
                    <el-input-number v-model="scope.row.oralMinutes" :min="0" :max="180" size="small" class="time-input" style="width: 120px" />
                    <span class="time-unit">分钟</span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 补课信息 -->
        <div class="makeup-info">
          <div class="section-title">补课信息</div>

          <!-- 实际补课时间 -->
          <div class="makeup-time-section">
            <el-form :model="makeupForm" ref="makeupForm" label-width="110px" class="makeup-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="实际补课日期" prop="makeupDate" :rules="makeupDateRules">
                    <el-date-picker
                      size="small"
                      v-model="makeupForm.makeupDate"
                      type="date"
                      placeholder="请选择补课日期"
                      value-format="yyyy-MM-dd"
                      style="width: 180px"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="实际补课时间" prop="makeupStartTime" :rules="[{ required: true, message: '请选择补课时间', trigger: 'blur' }]">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <el-time-picker
                        size="small"
                        v-model="makeupForm.makeupStartTime"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="开始时间"
                        @change="handleMakeupTimeChange"
                        @focus="handleMakeupTimeFocus"
                        style="width: 120px"
                      />
                      <span class="separator">-</span>
                      <el-time-picker
                        size="small"
                        v-model="makeupForm.makeupEndTime"
                        format="HH:mm"
                        value-format="HH:mm"
                        placeholder="结束时间"
                        disabled
                        style="width: 120px"
                      />
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="补课类型" prop="makeupType" :rules="[{ required: true, message: '请选择补课类型', trigger: 'blur' }]">
                <el-select v-model="makeupForm.makeupType" placeholder="请选择补课类型" size="small" style="width: 180px">
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
            </el-form>
          </div>
        </div>

        <!-- 本次考勤学员 -->
        <div class="attendance-section">
          <div class="section-title">本次考勤学员</div>
          <el-table :data="localSelectedRows" style="width: 100%" max-height="300" border size="small" header-cell-class-name="table-header-cell">
            <el-table-column type="index" label="序号" width="50" align="center"></el-table-column>
            <el-table-column prop="studentName" label="学生" width="130" align="center">
              <template slot-scope="scope">
                {{ scope.row.studentName }}
                <div v-if="scope.row.englishName">({{ scope.row.englishName }})</div>
              </template>
            </el-table-column>
            <el-table-column label="考勤备注" min-width="160">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.attendanceRemark"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注信息"
                  maxlength="300"
                  show-word-limit
                  size="small"
                ></el-input>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <el-button type="primary" @click="handleConfirm" size="small" :loading="isSubmitting">
          确定考勤
        </el-button>
        <el-button @click="handleClose" size="small">取消</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import { mapState } from 'vuex'
import One2ManyAttendanceApi from '@/services/tacenter/one2manyAttendance'

export default {
  name: 'BatchMakeupAttendanceDrawer',
  components: {},
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    selectedRows: {
      type: Array,
      default: () => []
    },
    classData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      isSubmitting: false,
      localSelectedRows: [],
      classDuration: 120, // 课次时长（分钟）

      // 详情数据
      detailData: {},

      // 课次信息
      classInfo: {
        classDate: '',
        classTime: '',
        className: '',
        courseManagerName: '',
        teacherName: ''
      },

      makeupForm: {
        makeupDate: '',
        makeupStartTime: '',
        makeupEndTime: '',
        makeupType: ''
      },

      // 补课日期校验规则
      makeupDateRules: [
        { required: true, message: '请选择补课日期', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (value) {
              const selectedDate = new Date(value)
              const today = new Date()
              today.setHours(23, 59, 59, 999) // 设置为今天的最后一刻

              if (selectedDate.getTime() > today.getTime()) {
                callback(new Error('实际补课日期不可以选择未来时间哦~'))
              } else {
                callback()
              }
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      teacherList: [
        {
          type: '中教',
          teacherId: '',
          teacherName: '',
          teacherOptions: [],
          regularMinutes: 0, // 默认为课次时长
          oralMinutes: 0
        },
        {
          type: '外教',
          teacherId: '',
          teacherName: '',
          teacherOptions: [],
          regularMinutes: 0, // 默认为0
          oralMinutes: 0
        }
      ]
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    drawerVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    drawerTitle() {
      return this.selectedRows.length === 1 ? '补课考勤' : '批量补课考勤'
    },
    // 判断是否为佳音
    isJiayin() {
      return this.userBaseInfo?.productLine === 11
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // 清除表单验证
        this.$nextTick(() => {
          if (this.$refs.makeupForm) {
            this.$refs.makeupForm.clearValidate()
          }
        })
        // 只有在抽屉打开且有选中数据时才加载详情
        if (this.selectedRows && this.selectedRows.length > 0) {
          this.loadMakeupAttendanceDetail()
        }
      }
    },
    selectedRows: {
      handler(newVal) {
        // 只有在抽屉已经打开的情况下，selectedRows 变化时才重新加载
        // 避免与 visible watcher 重复调用
        if (newVal && newVal.length > 0 && this.visible) {
          // 检查是否是真正的数据变化，而不是初始化
          if (this.localSelectedRows.length === 0) {
            this.loadMakeupAttendanceDetail()
          }
        }
      },
      deep: true,
      immediate: false // 改为 false，避免初始化时调用
    }
  },
  methods: {
    // 加载补课考勤详情
    async loadMakeupAttendanceDetail() {
      try {
        this.loading = true

        // 构建请求参数
        const makeupClassIds = this.selectedRows.map(row => row.makeupId || row.id).filter(id => id)
        const schedulingId = this.selectedRows[0]?.schedulingId

        if (!schedulingId || makeupClassIds.length === 0) {
          this.$message.error('缺少必要参数，无法加载详情')
          return
        }

        const params = {
          makeupClassIds,
          schedulingId
        }

        const response = await One2ManyAttendanceApi.getMakeupAttendanceDetail(params)

        if (response) {
          this.detailData = response
          this.initDataFromDetail()
        }
      } catch (error) {
        this.$message.error(error || '加载补课详情失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // 根据详情数据初始化表单
    initDataFromDetail() {
      if (!this.detailData) return

      // 初始化课次信息
      this.classInfo = {
        classDate: this.detailData.originalCourseDate || '',
        classTime:
          this.detailData.originalStartTime && this.detailData.originalEndTime ? `${this.detailData.originalStartTime}-${this.detailData.originalEndTime}` : '',
        className: this.detailData.courseName || this.detailData.courseShortName || '',
        courseManagerName: this.detailData.courseManageName || '',
        teacherName: this.detailData.teacherName || ''
      }

      // 设置课次时长 - 直接使用后端返回的 teacherMinutes
      this.classDuration = this.detailData.teacherMinutes

      // 判断是否为佳音（现在通过计算属性 isJiayin 自动判断）
      // this.isJiayin = !!(this.detailData.foreignTeacherId || this.detailData.foreignTeacherName)

      // 初始化老师信息 - 直接从后端数据取值
      // 中教信息
      const chineseTeacher = this.teacherList.find(t => t.type === '中教')
      if (chineseTeacher) {
        chineseTeacher.teacherId = this.detailData.teacherId || ''
        chineseTeacher.teacherName = this.detailData.teacherName || ''
        chineseTeacher.regularMinutes = 0 // 将由计算方法动态设置
        chineseTeacher.oralMinutes = 0 // 中教没有口语时长
      }

      // 外教信息
      const foreignTeacher = this.teacherList.find(t => t.type === '外教')
      if (foreignTeacher) {
        foreignTeacher.teacherId = this.detailData.foreignTeacherId || ''
        foreignTeacher.teacherName = this.detailData.foreignTeacherName || ''
        foreignTeacher.regularMinutes = this.detailData.foreignTeacherMinutes || 0
        foreignTeacher.oralMinutes = this.detailData.oralMinutes || 0
      }

      // 动态计算中教正课时长：总时长 - 外教正课时长
      this.calculateChineseTeacherTime()

      // 初始化学员列表
      if (this.detailData.students && Array.isArray(this.detailData.students)) {
        this.localSelectedRows = this.detailData.students.map(student => ({
          studentId: student.studentId,
          studentName: student.studentName,
          englishName: student.englishName || '',
          attendanceRemark: student.notes || '',
          attendanceId: student.attendanceId,
          orderNumber: student.orderNumber || 0
        }))
      }

      // 初始化补课表单（如果有已约课的信息）
      this.initMakeupTime()
    },

    initData() {
      // 深拷贝选中的行数据，避免直接修改原数据
      this.localSelectedRows = JSON.parse(JSON.stringify(this.selectedRows)).map(row => ({
        ...row,
        attendanceRemark: row.attendanceRemark || ''
      }))

      // 初始化补课时间
      this.initMakeupTime()

      // 初始化老师信息
      this.initTeachers()
    },

    initMakeupTime() {
      // 根据补课状态设置默认值
      const firstRow = this.selectedRows[0]
      if (firstRow) {
        if ((firstRow.makeupStatus === '已约课' || firstRow.makeupStatusName === '已约课') && this.selectedRows.length === 1) {
          // 已约课时，自动带出补课信息
          this.makeupForm.makeupDate = firstRow.expectedDate || firstRow.reservedMakeupDate || ''
          this.makeupForm.makeupStartTime = firstRow.expectedStartTime || firstRow.reservedMakeupStartTime || ''
          this.makeupForm.makeupEndTime = firstRow.expectedEndTime || firstRow.reservedMakeupEndTime || ''
          this.makeupForm.makeupType = firstRow.makeupType || ''
        } else {
          // 未约课时，清空表单
          this.makeupForm.makeupDate = ''
          this.makeupForm.makeupStartTime = ''
          this.makeupForm.makeupEndTime = ''
          this.makeupForm.makeupType = ''
        }
      }
    },

    initTeachers() {
      // 中教默认为班级老师
      if (this.classData.teacher) {
        this.teacherList[0].teacherId = this.classData.teacherId || ''
        this.teacherList[0].teacherName = this.classData.teacher || ''
        this.teacherList[0].teacherOptions = [
          {
            id: this.classData.teacherId || '1',
            name: this.classData.teacher,
            code: 'T001'
          }
        ]
      }
    },

    // 选择老师 - 兼容旧方法
    selectTeacher(index, data) {
      this.$set(this.teacherList[index], 'teacherId', data.id || '')
      this.$set(this.teacherList[index], 'teacherName', data.teacherName || '')
    },

    // HiAsyncSelector老师选择变化处理
    handleTeacherChange(index, value, option) {
      if (value && option) {
        this.$set(this.teacherList[index], 'teacherId', value)
        this.$set(this.teacherList[index], 'teacherName', option.label || '')
      } else {
        this.$set(this.teacherList[index], 'teacherId', '')
        this.$set(this.teacherList[index], 'teacherName', '')
      }
    },

    // 处理正课时长变化 - 参考 ClassAttendanceDrawer.vue
    handleRegularTimeChange(index) {
      // 如果是外教时长变化，需要重新计算中教时长
      if (this.teacherList[index].type === '外教') {
        this.calculateChineseTeacherTime()
      }
    },

    // 计算中教正课时长 - 参考 ClassAttendanceDrawer.vue
    calculateChineseTeacherTime() {
      const chineseTeacher = this.teacherList.find(t => t.type === '中教')
      const foreignTeacher = this.teacherList.find(t => t.type === '外教')

      if (chineseTeacher && foreignTeacher) {
        const totalDuration = this.classDuration
        const foreignTime = foreignTeacher.regularMinutes || 0
        chineseTeacher.regularMinutes = Math.max(0, totalDuration - foreignTime)
      }
    },

    // 处理补课开始时间变化
    handleMakeupTimeChange() {
      if (this.makeupForm.makeupStartTime && this.classDuration) {
        const [hours, minutes] = this.makeupForm.makeupStartTime.split(':')
        const startMinutes = parseInt(hours) * 60 + parseInt(minutes)
        const endMinutes = startMinutes + this.classDuration

        // 检查是否超过第二天
        if (endMinutes > 24 * 60) {
          this.$message.warning('下课时间不能超过第二天，请重新选择补课时间')
          this.makeupForm.makeupStartTime = ''
          this.makeupForm.makeupEndTime = ''
          return
        }

        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        this.makeupForm.makeupEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }
    },

    // 处理补课时间聚焦事件
    handleMakeupTimeFocus() {
      // 如果还没有设置开始时间，则设置为当前时间的整点
      if (!this.makeupForm.makeupStartTime) {
        const now = new Date()
        const currentHour = now.getHours()
        this.makeupForm.makeupStartTime = `${currentHour.toString().padStart(2, '0')}:00`
        // 设置开始时间后，自动计算结束时间
        this.handleMakeupTimeChange()
      }
    },

    handleClose() {
      this.drawerVisible = false
    },

    async handleConfirm() {
      try {
        this.isSubmitting = true

        // 表单验证
        const isValid = await new Promise(resolve => {
          this.$refs.makeupForm.validate(valid => {
            resolve(valid)
          })
        })

        if (!isValid) {
          this.isSubmitting = false
          return
        }

        // 构建提交参数
        const params = {
          actualDate: this.makeupForm.makeupDate,
          actualStartTime: this.makeupForm.makeupStartTime,
          actualEndTime: this.makeupForm.makeupEndTime,
          makeupType: this.makeupForm.makeupType,
          students: this.localSelectedRows.map(row => ({
            attendanceId: row.attendanceId,
            studentId: row.studentId,
            remarks: row.attendanceRemark || ''
          }))
        }

        // 添加老师信息
        const chineseTeacher = this.teacherList.find(t => t.type === '中教')
        const foreignTeacher = this.teacherList.find(t => t.type === '外教')

        if (chineseTeacher && chineseTeacher.teacherId) {
          params.teacherId = chineseTeacher.teacherId
          params.teacherMinutes = chineseTeacher.regularMinutes || 0
        }

        if (foreignTeacher && foreignTeacher.teacherId) {
          params.foreignTeacherId = foreignTeacher.teacherId
          params.foreignTeacherMinutes = foreignTeacher.regularMinutes || 0
          params.oralMinutes = foreignTeacher.oralMinutes || 0
        }

        // 调用补课考勤接口
        await One2ManyAttendanceApi.recordMakeupAttendance(params)

        this.$message.success(`成功考勤 ${this.localSelectedRows.length} 条记录`)
        this.$emit('refresh')
        this.drawerVisible = false
      } catch (error) {
        this.$message.error(error || '补课考勤失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .el-drawer__header {
    padding: 16px;
    color: rgba(51, 51, 51, 1);
    font-size: 14px;
    font-family: PingFangSC-bold;
    background-color: rgba(241, 244, 247, 1);
    font-weight: 600;
    margin-bottom: 0px;
  }

  // 表格标题行背景色
  .table-header-cell {
    background-color: rgba(250, 250, 250, 1) !important;
  }

  // 数字输入框文字居中
  .time-input .el-input__inner {
    text-align: center;
  }
}

.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .content-wrapper {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
    color: #303133;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      width: 3px;
      height: 14px;
      background: #409eff;
      margin-right: 8px;
      border-radius: 2px;
    }
  }

  .class-info-section {
    margin-bottom: 24px;

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 16px;

      .label {
        color: #666;
        width: 80px;
        text-align: right;
        display: inline-block;
      }

      .value {
        color: #333;
      }
    }

    .teacher-simple {
      .info-item {
        margin-top: 16px;
      }
    }

    .teacher-list {
      margin-top: 16px;

      .time-input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .time-input {
          width: 80px;
        }

        .time-unit {
          color: #666;
          font-size: 12px;
        }
      }
    }
  }

  .makeup-info {
    margin-bottom: 24px;

    .makeup-time-section {
      margin-bottom: 20px;

      .makeup-form {
        .el-form-item {
          margin-bottom: 16px;
        }
      }
    }

    .separator {
      margin: 0px;
      color: #606266;
    }
  }

  .attendance-section {
    margin-bottom: 24px;
  }

  .drawer-footer {
    padding: 16px;
    text-align: center;
    background: #fff;
  }
}

// 数字输入框居中显示
::v-deep .el-input-number .el-input__inner {
  text-align: center;
}
</style>
