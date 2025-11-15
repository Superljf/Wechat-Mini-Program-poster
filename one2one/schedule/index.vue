<template>
  <div class="one2one-schedule">
    <!-- 添加学员选择器组件 -->
    <student-selector :student-id="studentId" :visible.sync="studentSelectorVisible" @student-selected="handleStudentSelected" />

    <div class="schedule-header">
      <div :key="studentInfo && studentInfo.headPic" class="student-info">
        <el-avatar :size="32" :src="studentInfo && studentInfo.headPic">
          {{ studentInfo && studentInfo.studentName && studentInfo.studentName[0] }}
        </el-avatar>
        <div class="info-detail">
          <div class="name">{{ (studentInfo && studentInfo.studentName) || '请先选择学员' }}</div>
          <div class="sub-info">
            {{ (studentInfo && studentInfo.sexDesc) || '--' }} / {{ (studentInfo && studentInfo.gradeName) || '--' }} /
            {{ (studentInfo && studentInfo.attendSchoolName) || '--' }} / {{ (studentInfo && studentInfo.phone) || '--' }}
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="action-buttons">
          <!-- 学员画像 -->
          <el-button type="text" @click="handleStudentProfile">
            <div style="display: flex; align-items: center; gap: 5px;padding: 5px;">
              <img style="width: 20px; height: 20px;margin-bottom: 3px;" src="@/assets/images/student/detail_blue.svg" />
              <div>学员画像</div>
            </div>
          </el-button>
          <el-button type="text" @click="handleStudentDetail">
            <div style="display: flex; align-items: center; gap: 5px;padding: 5px;">
              <img style="width: 20px; height: 20px;margin-bottom: 3px;" src="@/assets/images/student/userIcon.png" />
              <div>学员详情</div>
            </div>
          </el-button>
          <el-button type="text" @click="handleMatch">
            <div style="display: flex; align-items: center; gap: 5px;padding: 5px;">
              <img style="width: 20px; height: 20px;margin-bottom: 3px;" src="@/assets/images/student/match_blue.svg" />
              <div>师生匹配</div>
            </div>
          </el-button>
          <el-button type="text" @click="handleChangeStudent">
            <div style="display: flex; align-items: center; gap: 5px;padding: 5px;">
              <img style="width: 20px; height: 20px;margin-bottom: 3px;" src="@/assets/images/student/change_blue.svg" />
              <div>切换学员</div>
            </div>
          </el-button>
        </div>
      </div>
    </div>

    <el-card class="schedule-content" v-loading="loading" element-loading-text="加载中...">
      <div class="schedule-toolbar">
        <div class="nav-left" style="display: flex; align-items: center; gap: 10px">
          <div id="schedule-type-select" class="schedule-type-buttons">
            <el-button size="small" type="primary" class="periodic-btn" @click="handlePeriodicScheduling">周期排课</el-button>
            <el-button style="margin-left: 10px;" size="small" class="calendar-btn" @click="handleCalendarScheduling">日历排课</el-button>
          </div>

          <!-- 周选择器区域 -->
          <div class="week-picker">
            <el-button size="small" icon="el-icon-arrow-left" @click="handlePrevWeek" />
            <el-date-picker
              v-model="currentDate"
              type="week"
              :format="weekRangeText"
              value-format="yyyy-MM-dd"
              :picker-options="weekPickerOptions"
              @change="handleWeekChange"
              size="small"
              :placeholder="'选择周'"
              :clearable="false"
            />
            <el-button size="small" icon="el-icon-arrow-right" @click="handleNextWeek" />
            <el-button style="margin-left: 0px;" size="small" :disabled="isCurrentWeek" @click="backToCurrentWeek">
              回到本周
            </el-button>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="legend">
            <span class="legend-item"> <i class="dot dot-red" />未考勤 </span>
            <span class="legend-item"> <i class="dot dot-green" />已考勤 </span>
            <span class="legend-item"> <i class="dot dot-blue" />未开始 </span>
            <el-button size="small" id="schedule-setting-btn" @click="handleScheduleSetting">课表显示设置</el-button>
          </div>
        </div>
      </div>

      <div class="schedule-table">
        <div class="time-column">
          <div class="time-header">时间段</div>
          <div v-for="time in timeSlots" :key="time.value" class="time-slot">
            {{ time.label }}
          </div>
        </div>

        <div class="days-container">
          <div class="days-header">
            <div v-for="day in weekDays" :key="day.date" class="day-column">
              <div class="day-label">
                {{ day.label }}
                <span v-if="day.isToday" class="today-label">当天</span>
              </div>
              <div class="date-label">{{ day.date }}</div>
            </div>
          </div>

          <div class="schedule-grid">
            <div v-for="(day, dayIndex) in weekDays" :key="day.date" class="day-column">
              <div
                v-for="(time, timeIndex) in timeSlots"
                :key="time.value"
                class="grid-cell"
                :class="{ 'has-course': getCoursesAtTime(day.date, time.value).length > 0, 'can-add': hasAvailableTimeInSlot(day.date, time.value) }"
                @click="hasAvailableTimeInSlot(day.date, time.value) && handleAddCourse(day, time)"
              >
                <!-- 当存在课程时显示课程信息 -->
                <template v-if="getCoursesAtTime(day.date, time.value).length > 0">
                  <div class="course-container">
                    <div v-for="(course, courseIndex) in getCoursesAtTime(day.date, time.value)" :key="courseIndex" class="course-wrapper">
                      <el-popover placement="right" width="300" trigger="hover" popper-class="course-popover">
                        <div class="course-detail">
                          <div class="detail-header">
                            课次详情
                            <div class="detail-item">
                              <span v-if="course.attendType === 3" class="legend-item">
                                <i class="dot dot-red"></i>
                                {{ getAttendTypeText(course.attendType) }}
                              </span>
                              <span v-if="course.attendType === 1" class="legend-item">
                                <i class="dot dot-green"></i>
                                {{ getAttendTypeText(course.attendType) }}
                              </span>
                              <span v-if="course.attendType === 2" class="legend-item">
                                <i class="dot dot-blue"></i>
                                {{ getAttendTypeText(course.attendType) }}
                              </span>
                            </div>
                          </div>

                          <div class="detail-item">
                            <span class="label">上课日期</span>
                            <span
                              >{{ course.courseDate }}
                              {{
                                (() => {
                                  const courseDate = course.courseDate
                                  if (courseDate) {
                                    const date = new Date(courseDate)
                                    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                                    return '(' + days[date.getDay()] + ')'
                                  }
                                  return ''
                                })()
                              }}
                            </span>
                          </div>
                          <div class="detail-item">
                            <span class="label">上课时间</span>
                            <span>{{ course.startTime }} - {{ course.endTime }}</span>
                          </div>

                          <div class="detail-item">
                            <span class="label">课程类型</span>
                            <span>{{ course.courseKindName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="label">课程名称</span>
                            <span>{{ course.courseName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="label">科目</span>
                            <span>{{ course.subjectName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="label">老师</span>
                            <span>{{ course.teacherName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="label">学管师</span>
                            <span>{{ course.counselorName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="label">校区</span>
                            <span>{{ course.branchName }}</span>
                          </div>
                          <div v-if="course.businessType === 2 && userBaseInfo && userBaseInfo.branchName === course.branchName" class="detail-footer">
                            <div v-if="course.attendType === 3" class="detail-btn">
                              <span class="label" @click="handleAttendance(course)">
                                <i class="icon icon-attend"></i>
                                考勤
                              </span>
                            </div>
                            <div class="detail-btn">
                              <span class="label" @click="handleCopyCourse(course)">
                                <i class="icon icon-copy"></i>
                                复制
                              </span>
                            </div>
                            <div v-if="course.attendType !== 1" class="detail-btn">
                              <span class="label" @click="handleCancelClick(course)">
                                <i class="icon icon-cancel"></i>
                                取消
                              </span>
                            </div>
                            <div v-if="course.attendType === 2" class="detail-btn">
                              <span class="label" @click="handleReschedule(course)">
                                <i class="icon icon-change"></i>
                                调课
                              </span>
                            </div>
                          </div>
                        </div>
                        <div slot="reference" class="course-item" :class="getCourseClass(course)" :style="getCourseStyle(course, time.value)">
                          <div class="course-subject">
                            <span> {{ getCourseDisplayText(course) }} </span>
                            <!-- 班课标识 -->
                            <span
                              v-if="scheduleSettings.showClassLabel && course.businessType === 1"
                              class="class-label"
                              :class="{
                                'class-label-red': course.attendType === 3,
                                'class-label-green': course.attendType === 1,
                                'class-label-blue': course.attendType === 2
                              }"
                              >班</span
                            >
                          </div>
                        </div>
                      </el-popover>
                    </div>
                  </div>
                </template>
                <!-- 当没有课程或有可用时间时显示添加按钮 -->
                <template v-if="hasAvailableTimeInSlot(day.date, time.value)">
                  <div :id="`add-course-btn-${timeIndex}-${dayIndex}`" class="add-course-btn">
                    <div>{{ time.label }}</div>
                    <div>新增排课</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 排课弹窗 -->
    <el-dialog title="排课" :visible.sync="scheduleDialogVisible" width="500px">
      <el-form :model="scheduleForm" label-width="80px">
        <el-form-item label="上课时间">
          <span>{{ scheduleForm.date }} {{ scheduleForm.time }}</span>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="scheduleForm.subject" placeholder="请选择科目">
            <el-option label="数学" value="数学" />
            <el-option label="物理" value="物理" />
            <el-option label="化学" value="化学" />
          </el-select>
        </el-form-item>
        <el-form-item label="教师">
          <el-select v-model="scheduleForm.teacherId" placeholder="请选择教师">
            <el-option v-for="teacher in teachers" :key="teacher.id" :label="teacher.name" :value="teacher.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleScheduleSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 课表显示设置弹窗 -->
    <el-dialog title="课表显示设置" :visible.sync="scheduleSettingVisible" width="450px" class="schedule-setting-dialog" @close="handleSettingDialogClose">
      <div class="setting-content">
        <div class="setting-item">
          <div class="setting-label">班课标识：</div>
          <el-radio-group v-model="tempScheduleSettings.showClassLabel">
            <el-radio :label="true">显示</el-radio>
            <el-radio :label="false">隐藏</el-radio>
          </el-radio-group>
        </div>
        <div class="setting-item" style="margin-bottom: 0px;">
          <div style="display: flex;align-items: baseline; gap: 4px;">
            <div class="setting-label"><span class="required">*</span>课表显示信息：</div>
          </div>
          <el-select
            v-model="tempScheduleSettings.displayInfo"
            multiple
            size="small"
            placeholder="请选择显示信息"
            style="width: 300px"
            @change="handleDisplayInfoChange"
          >
            <el-option label="科目" value="subject"></el-option>
            <el-option label="校区" value="branch"></el-option>
            <el-option label="老师" value="teacher"></el-option>
            <el-option label="课程类型/子类型" value="courseType"></el-option>
          </el-select>
        </div>
        <!-- <div class="tip-text">最少选择1项，最多选择2项</div> -->
      </div>
      <div slot="footer">
        <el-button size="small" @click="scheduleSettingVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveScheduleSettings" :disabled="!isTempSettingsValid">确定</el-button>
      </div>
    </el-dialog>

    <CancelSchedule :visible.sync="cancelDialogVisible" @confirm-cancel="handleCancelConfirm" :loading="cancelLoading" />

    <PeriodicScheduling
      :isCalendarSchedule="isCalendarSchedule"
      :visible.sync="periodicSchedulingVisible"
      @submit-success="handleScheduleSuccess"
      :studentId="studentId"
      :studentInfo="studentInfo"
      :calendarScheduleData="calendarScheduleData"
      @update:calendarScheduleData="handleUpdateCalendarScheduleData"
      :isCopy="isCopy"
    />

    <BatchAttendance ref="batchAttendance" :visible.sync="batchAttendanceVisible" :selectedRows="selectedRows" @confirm="handleBatchAttendanceConfirm" />

    <!-- 添加调课组件 -->
    <SwitchScheduling
      :visible.sync="switchSchedulingVisible"
      :is-single-schedule="true"
      :student-id="studentId"
      :student-info="studentInfo"
      :current-schedule-data="currentScheduleData"
      :selected-rows="selectedRows"
      switch-scheduling-type="single"
      @submit-success="handleScheduleSuccess"
    />

    <!-- 学员画像抽屉 -->
    <StudentProfileDrawer ref="studentProfileDrawer" />
  </div>
</template>

<script>
import dayjs from 'dayjs'
import StudentSelector from './StudentSelector.vue'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import updateLocale from 'dayjs/plugin/updateLocale'
import 'dayjs/locale/zh-cn' // 导入中文语言包
import { studentManApi } from '@/services'
import { mapState } from 'vuex'
import CancelSchedule from './CancelSchedule.vue'
import PeriodicScheduling from './PeriodicScheduling.vue'
import BatchAttendance from '../attendance/BatchAttendance.vue'
import SwitchScheduling from '../attendance/SwitchScheduling.vue'
import StudentProfileDrawer from '@/views/student-manage/search/components/StudentProfileDrawer.vue'
import { driver } from 'driver.js'
import cancel from '@/assets/images/student/cancel.png'
import cancel_blue from '@/assets/images/student/cancel_blue.png'
import copy from '@/assets/images/student/copy.png'
import copy_blue from '@/assets/images/student/copy_blue.png'
import change from '@/assets/images/student/change.png'
import change_blue from '@/assets/images/student/change_blue.png'
import atten from '@/assets/images/student/atten.png'
import atten_blue from '@/assets/images/student/atten_blue.png'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(weekOfYear)
dayjs.extend(updateLocale)
dayjs.locale('zh-cn') // 设置语言为中文（中国时区）

// 明确配置周起始日为周一
dayjs.updateLocale('zh-cn', {
  weekStart: 1 // 设置周一为一周的第一天
})

export default {
  name: 'One2OneSchedule',

  components: {
    StudentSelector,
    CancelSchedule,
    PeriodicScheduling,
    BatchAttendance,
    SwitchScheduling,
    StudentProfileDrawer
  },

  // businessType = 1 是班课
  data() {
    return {
      pageKey: 'one2one_schedule', // 引导页面key
      guideStatus: false, // 引导状态
      isAttenHovered: false,
      isCopyHovered: false,
      isCancelHovered: false,
      isRescheduleHovered: false,
      cancel,
      cancel_blue,
      copy,
      copy_blue,
      change,
      change_blue,
      atten,
      atten_blue,
      hoverStates: {},
      studentId: '',
      selectedRows: [],
      studentInfo: {
        name: '',
        gender: '',
        grade: '',
        school: '',
        avatar: ''
      },
      currentDate: '',
      endDate: '',
      viewType: '本人',
      // 修改 timeSlots 数据结构，使用分钟数来计算
      timeSlots: [
        // 6：00-8：00
        { label: '06:00-08:00', value: '0600', minutes: 360 },
        { label: '08:00-10:00', value: '0800', minutes: 480 },
        { label: '10:00-12:00', value: '1000', minutes: 600 },
        { label: '12:00-14:00', value: '1200', minutes: 720 },
        { label: '14:00-16:00', value: '1400', minutes: 840 },
        { label: '16:00-18:00', value: '1600', minutes: 960 },
        { label: '18:00-20:00', value: '1800', minutes: 1080 },
        { label: '20:00-22:00', value: '2000', minutes: 1200 },
        { label: '22:00-24:00', value: '2200', minutes: 1320 }
      ],
      scheduleDialogVisible: false,
      scheduleForm: {
        date: '',
        time: '',
        subject: '',
        teacherId: ''
      },
      teachers: [
        { id: 1, name: '帝豪' },
        { id: 2, name: '王老师' },
        { id: 3, name: '李老师' }
      ],
      studentSelectorVisible: false,
      weekPickerOptions: {
        firstDayOfWeek: 1, // 确保周一为一周的第一天
        shortcuts: [
          {
            text: '本周',
            onClick(picker) {
              const start = dayjs().startOf('week') // 已通过 updateLocale 配置为周一
              picker.$emit('pick', start.format('YYYY-MM-DD'))
            }
          }
        ]
      },
      loading: false,
      cancelDialogVisible: false,
      cancelCourseInfo: {},
      periodicSchedulingVisible: false,
      isCalendarSchedule: false,
      calendarScheduleData: null,
      batchAttendanceVisible: false,
      selectedAttendanceList: [],
      selectedAttendanceCourses: [],
      // 调课相关
      switchSchedulingVisible: false,
      currentScheduleData: null,
      isCopy: false,
      cancelLoading: false,
      driverObj: null,
      driverSteps: [
        {
          element: '#schedule-type-select',
          popover: {
            title: 'Tips 1: 添加批量排课',
            description: `<div class="schedule-type-description">
              <div class="schedule-type-item">
                <div class="type-title" style="font-size: 15px; font-weight: bold;margin-bottom: 6px; margin-top: 10px;">周期排课</div>
                <div class="type-desc">适合 <span style="color: #2979ff;">固定周期</span> 上课的学生，例如每周六上午08:00～10:00。</div>
              </div>
              <div class="schedule-type-item">
                <div class="type-title" style="margin-top: 10px; font-size: 15px; font-weight: bold;margin-bottom: 6px;">日历排课</div>
                <div class="type-desc">适合 <span style="color: #2979ff;">非固定周期</span> 上课的学生，例如暑假或节假日连续排课。</div>
              </div>
            </div>`,
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#add-course-btn-3-3',
          popover: {
            title: 'Tips 2: 添加单次排课',
            description: `<div class="add-course-description" style="margin-top: 10px;">
              <div style="font-size: 14px;">在课表中，<span style="color: #2979ff;">将鼠标移入</span>在空闲时间格上时，会出现"新增排课"按钮。</div>
              <div style="margin-top: 8px; font-size: 14px;">点击此按钮可以在选定的时间段添加单次排课。</div>
            </div>`,
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#schedule-setting-btn',
          popover: {
            title: 'Tips 3: 课表显示设置',
            description: '点击此按钮可以根据个人习惯设置课表显示规则哦~'
          }
        }
      ],
      scheduleSettingVisible: false,
      scheduleSettings: {
        showClassLabel: true,
        displayInfo: ['subject', 'courseType']
      },
      // 添加临时保存修改的变量
      tempScheduleSettings: {
        showClassLabel: true,
        displayInfo: ['subject', 'courseType']
      }
    }
  },

  computed: {
    ...mapState('user', ['userBaseInfo']),
    weekDays() {
      if (!this.currentDate) return []

      // 获取当前选择日期所在周的周一
      const selectedDate = dayjs(this.currentDate)
      // 使用 startOf('week') 获取周开始日期（已通过 updateLocale 配置为周一）
      const startDate = selectedDate.startOf('week')

      return Array.from({ length: 7 }, (_, index) => {
        // 使用clone避免修改原对象
        const date = startDate.clone().add(index, 'day')
        return {
          date: date.format('YYYY-MM-DD'),
          label: this.getWeekDayLabel(date.day()),
          isToday: date.isSame(dayjs(), 'day')
        }
      })
    },

    isCurrentWeek() {
      if (!this.currentDate) return true

      // 获取当前日期所在周的周一
      const today = dayjs()
      const currentWeekStart = today.startOf('week') // 已通过 updateLocale 配置为周一

      // 获取选中日期所在周的周一
      const selectedDay = dayjs(this.currentDate)
      const selectedWeekStart = selectedDay.startOf('week') // 已通过 updateLocale 配置为周一

      // 判断选中的周是否是当前周（比较两周的周一日期是否相同）
      return currentWeekStart.format('YYYY-MM-DD') === selectedWeekStart.format('YYYY-MM-DD')
    },

    weekRangeText() {
      if (!this.currentDate) return ''
      const startDate = dayjs(this.currentDate).startOf('week')
      // 使用clone避免修改原对象
      const endDate = startDate.clone().add(6, 'day')
      return `${startDate.format('YYYY.MM.DD')} - ${endDate.format('YYYY.MM.DD')}`
    },

    isScheduleSettingsValid() {
      return this.scheduleSettings.displayInfo && this.scheduleSettings.displayInfo.length > 0 && this.scheduleSettings.displayInfo.length <= 2
    },
    isTempSettingsValid() {
      return this.tempScheduleSettings.displayInfo && this.tempScheduleSettings.displayInfo.length > 0 && this.tempScheduleSettings.displayInfo.length <= 2
    }
  },

  created() {
    // 初始化 scheduleList 为空数组
    this.scheduleList = []

    // 初始化显示本周
    this.backToCurrentWeek()
    // 获取路由参数
    this.studentId = this.$route.query.studentId || sessionStorage.getItem('ScheduleStudentId')
    // Update the URL without reloading the page
    // http://localhost:8080/#/tacenter/one2one/schedule?studentId=100710534

    // 如果没有 studentId,显示选择器
    if (!this.studentId) {
      this.studentSelectorVisible = true
    } else {
      // 有 studentId 时获取学生信息
      this.getStudentInfoAndSchedule()
      // const newUrl = `${window.location.pathname}?studentId=${this.studentId}`
      // window.history.replaceState(null, '', newUrl)
    }

    // Add event listener for page refresh
    window.addEventListener('beforeunload', this.handleBeforeUnload)

    // 读取本地存储的设置
    this.loadScheduleSettings()
    this.getGuideStatus()
  },

  methods: {
    async getGuideStatus() {
      const res = await studentManApi.getYdyQueryGuideConfig({ pageKey: this.pageKey })
      this.guideStatus = res
      return res
    },

    async switchGuideStatus() {
      const res = await studentManApi.switchYdyGuideConfig({ pageKey: this.pageKey })
      this.guideStatus = true
      return res
    },

    handleStudentDetail() {
      window.open(`${process.env.VUE_APP_ERP_URL}?studentId=${this.studentId}#/studentMgr/studentIndex`, '_blank')
    },
    handleStudentProfile() {
      // 打开学员画像抽屉
      if (!this.studentId) {
        this.$message.warning('请先选择学员')
        return
      }

      const studentData = {
        id: this.studentId,
        studentName: this.studentInfo.studentName,
        sex: this.studentInfo.sex,
        gradeName: this.studentInfo.gradeName,
        attendSchoolName: this.studentInfo.attendSchoolName,
        phone: this.studentInfo.phone,
        birthday: this.studentInfo.birthday,
        headPic: this.studentInfo.headPic,
        consultantName: this.studentInfo.counselorName,
        learningMgrName: this.studentInfo.learningMgrName
      }
      this.$refs.studentProfileDrawer.show(studentData)
    },
    handleMatch() {
      // https://erp-aliyun-rls.entstudy.com/?#/orders/classesSchedule/ydyApply
      // window.open(`${process.env.VUE_APP_ERP_URL}?#/orders/classesSchedule/ydyProcess/${this.studentId}/${this.studentInfo.studentName}`, '_blank')

      // 跳转 v5-1对1新增排课单，并选中以下信息：  学员 当前学员  日期 最近一年
      // "path": "/orders/classesSchedule/ydyApply/:studentId/:studentName",
      window.open(
        `${process.env.VUE_APP_ERP_URL}?#/orders/classesSchedule/ydyApply?studentId=${this.studentId}&studentName=${this.studentInfo.studentName}`,
        '_blank'
      )
    },

    checkOrderAndTeacher() {
      // 校验是否有订单、是否有学管师
      // 没有订单、没有订单且没有学管师：弹出toast提示，提示语：暂无订单，无法排课哦~
      // 没有学管师：弹出toast提示，提示语：当前学员暂无学管师，无法排课哦~
      let needCheck = false
      if (this.studentInfo?.orders === 0) {
        this.$message.warning('暂无订单，无法排课哦~')
        needCheck = true
        return needCheck
      }
      if (!this.studentInfo?.counselorId) {
        this.$message.warning('当前学员暂无学管师，无法排课哦~')
        needCheck = true
        return needCheck
      }
      return needCheck
    },

    handleUpdateCalendarScheduleData(data) {
      this.calendarScheduleData = null
    },

    handleChangeStudent() {
      this.studentSelectorVisible = true
    },

    // 处理学员选择
    async handleStudentSelected(student) {
      this.studentId = student.id

      // 更新路由参数
      this.$router.replace({
        query: { ...this.$route.query, studentId: student.id }
      })
      // 加载该学员的课程数据
      // await this.getStudentInfoAndSchedule(true)
    },

    // 获取学生信息和课程数据
    async getStudentInfoAndSchedule() {
      if (!this.studentId) return
      this.loading = true
      try {
        // 确保使用周一到周日的周计算方式
        const startDate = dayjs(this.currentDate).startOf('week')
        // 使用clone避免操作原对象
        const endDate = startDate.clone().add(6, 'day')
        const data = await studentManApi.getStudentScheduleList({
          studentId: this.studentId,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          buId: this.userBaseInfo.buId
        })

        sessionStorage.setItem('ScheduleStudentId', this.studentId)

        // 确保 scheduleList 始终是数组
        this.studentInfo = data?.studentInfo || {}
        this.scheduleList = data?.scheduleList || []

        // 数据加载完成后再检查引导状态并初始化引导
        this.$nextTick(() => {
          setTimeout(() => {
            if (!this.guideStatus) {
              this.initDriver()
              this.startGuide()
            }
          }, 300)
        })
      } catch (error) {
        this.$message.error('获取数据失败')
        // 确保发生错误时 scheduleList 也是空数组
        this.scheduleList = []
      } finally {
        this.loading = false
      }
    },

    // 加载课程数据 - 直接调用 getStudentInfoAndSchedule
    async loadScheduleData() {
      if (!this.studentId) return
      await this.getStudentInfoAndSchedule(false)
    },

    // 周变化处理
    async handleWeekChange(date) {
      if (!date) return
      this.currentDate = date
      if (this.studentId) {
        await this.loadScheduleData()
      }
    },

    // 上一周
    async handlePrevWeek() {
      this.currentDate = dayjs(this.currentDate)
        .subtract(1, 'week')
        .format('YYYY-MM-DD')
      await this.loadScheduleData()
    },

    // 下一周
    async handleNextWeek() {
      this.currentDate = dayjs(this.currentDate)
        .add(1, 'week')
        .format('YYYY-MM-DD')
      await this.loadScheduleData()
    },

    // 回到本周
    async backToCurrentWeek() {
      // 获取当前周的周一日期
      this.currentDate = dayjs()
        .startOf('week')
        .format('YYYY-MM-DD')
      if (this.studentId) {
        await this.loadScheduleData()
      }
    },

    getCourseByTime(date, timeSlot) {
      if (!this.scheduleList) return null

      // 获取时间段的起始和结束分钟数
      const slot = this.timeSlots.find(slot => slot.value === timeSlot)
      if (!slot) return null

      const slotStartMinutes = slot.minutes
      const slotEndMinutes = slot.minutes + 120 // 2小时时间段

      // 查找符合条件的课程
      const course = this.scheduleList.find(course => {
        // 检查日期是否匹配
        if (course.courseDate !== date) return false

        // 只在课程开始的时间段显示
        return course.startMinutes >= slotStartMinutes && course.startMinutes < slotEndMinutes
      })

      return course
    },

    // 获取指定时间段的所有课程（返回数组）
    getCoursesAtTime(date, timeSlot) {
      if (!this.scheduleList) return []

      // 获取时间段的起始和结束分钟数
      const slot = this.timeSlots.find(slot => slot.value === timeSlot)
      if (!slot) return []

      const slotStartMinutes = slot.minutes
      const slotEndMinutes = slot.minutes + 120 // 2小时时间段

      // 查找所有符合条件的课程
      const courses = this.scheduleList.filter(course => {
        // 检查日期是否匹配
        if (course.courseDate !== date) return false

        // 只在课程开始的时间段显示
        return course.startMinutes >= slotStartMinutes && course.startMinutes < slotEndMinutes
      })

      return courses
    },
    // ------------------------------------------
    getCoursesByDate(date) {
      if (!this.scheduleList) return []
      return this.scheduleList.filter(course => course.courseDate === date)
    },
    getCourseStyle(course, timeSlot) {
      if (!course) return {}

      const slot = this.timeSlots.find(slot => slot.value === timeSlot)
      if (!slot) return {}

      const slotStartMinutes = slot.minutes
      const duration = course.endMinutes - course.startMinutes // 课程总时长
      const top = Math.max(0, course.startMinutes - slotStartMinutes)

      // 获取当前时间段内的所有课程
      const coursesInSlot = this.getCoursesAtTime(course.courseDate, timeSlot)

      // 寻找时间上有重叠的课程（不是连续的）
      const overlapGroups = this.findOverlapGroups(coursesInSlot)

      // 找到当前课程所在的重叠组
      let currentGroup = null
      let groupIndex = -1

      for (let i = 0; i < overlapGroups.length; i++) {
        if (overlapGroups[i].includes(course)) {
          currentGroup = overlapGroups[i]
          groupIndex = i
          break
        }
      }

      // 如果课程不在任何重叠组中，则使用全宽
      if (!currentGroup) {
        return {
          position: 'absolute',
          top: `${(top / 120) * 100}%`,
          height: `${(duration / 120) * 100}%`,
          width: 'calc(100% - 8px)',
          zIndex: 1
        }
      }

      // 计算当前课程在组内的位置
      const courseIndex = currentGroup.indexOf(course)
      const widthPercentage = 100 / currentGroup.length
      const leftPosition = widthPercentage * courseIndex

      return {
        position: 'absolute',
        top: `${(top / 120) * 100}%`,
        height: `${(duration / 120) * 100}%`,
        width: `calc(${widthPercentage}% - 8px)`,
        left: `${leftPosition}%`,
        zIndex: 1
      }
    },

    // 辅助方法：找出所有重叠的课程组
    findOverlapGroups(courses) {
      if (!courses || courses.length <= 1) return courses.map(c => [c])

      // 创建时间轴，记录每个时间点哪些课程正在进行
      const timePoints = []

      courses.forEach(course => {
        // 添加课程开始时间点
        timePoints.push({
          time: course.startMinutes,
          course: course,
          isStart: true
        })

        // 添加课程结束时间点
        timePoints.push({
          time: course.endMinutes,
          course: course,
          isStart: false
        })
      })

      // 按时间点排序
      timePoints.sort((a, b) => {
        if (a.time !== b.time) return a.time - b.time
        // 结束点优先于开始点（处理边界情况）
        return a.isStart ? 1 : -1
      })

      // 跟踪当前活跃的课程
      const activeCourses = new Set()
      // 存储所有重叠组及其时间范围
      const groups = []

      for (let i = 0; i < timePoints.length; i++) {
        const point = timePoints[i]

        if (point.isStart) {
          // 课程开始
          activeCourses.add(point.course)
        } else {
          // 课程结束
          activeCourses.delete(point.course)
        }

        // 检查时间段变化
        if (i < timePoints.length - 1 && timePoints[i + 1].time > point.time) {
          if (activeCourses.size > 0) {
            // 创建当前时间段的组
            const currentGroup = [...activeCourses]

            // 检查是否需要合并到现有组
            let merged = false
            for (const group of groups) {
              // 如果新组和现有组有任何课程重叠，合并它们
              if (currentGroup.some(c => group.courses.includes(c))) {
                // 合并两个组的课程，确保没有重复
                currentGroup.forEach(c => {
                  if (!group.courses.includes(c)) {
                    group.courses.push(c)
                  }
                })
                merged = true
                break
              }
            }

            if (!merged) {
              // 如果没有合并到现有组，创建新组
              groups.push({
                courses: currentGroup,
                startTime: point.time,
                endTime: timePoints[i + 1].time
              })
            }
          }
        }
      }

      // 提取最终的组
      const finalGroups = []
      const processedCourses = new Set()

      // 首先处理多课程的组
      groups.forEach(group => {
        if (group.courses.length > 1) {
          const courseGroup = []
          group.courses.forEach(course => {
            if (!processedCourses.has(course)) {
              courseGroup.push(course)
              processedCourses.add(course)
            }
          })
          if (courseGroup.length > 0) {
            finalGroups.push(courseGroup)
          }
        }
      })

      // 然后处理剩余的单课程
      courses.forEach(course => {
        if (!processedCourses.has(course)) {
          finalGroups.push([course])
          processedCourses.add(course)
        }
      })

      return finalGroups
    },

    // -------------------------------------------
    getWeekDayLabel(day) {
      // 使用中文习惯的周几显示（周一到周日）
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekDays[day]
    },

    getCourseClass(course) {
      if (!course) return {}

      // 根据考勤状态返回对应的类名
      const attendTypeClass = {
        1: 'course-attended', // 已考勤
        2: 'course-scheduled', // 未开始
        3: 'course-absent' // 未考勤
      }

      return {
        [attendTypeClass[course.attendType]]: true
      }
    },

    // attendType：3--未考勤 ,2--未开始 , 1--已考勤
    getAttendTypeText(type) {
      const attendTypeMap = {
        1: '已考勤',
        2: '未开始',
        3: '未考勤'
      }
      return attendTypeMap[type] || '未知状态'
    },

    handleCellClick(day, time) {
      this.scheduleForm = {
        date: day.date,
        time: time.label,
        subject: '',
        teacherId: ''
      }
      this.scheduleDialogVisible = true
    },

    handleScheduleSubmit() {
      this.scheduleDialogVisible = false
    },

    handleAddCourse(day, time) {
      if (this.checkOrderAndTeacher()) return
      this.periodicSchedulingVisible = true
      this.isCalendarSchedule = true // Set to true for calendar scheduling
      this.isCopy = false // 确保不是复制模式

      // 获取时间段信息
      const slot = this.timeSlots.find(slot => slot.value === time.value)
      const slotStartMinutes = slot.minutes
      const slotEndMinutes = slotStartMinutes + 120

      // 如果已有课程，查找可用时间段
      if (this.getCoursesAtTime(day.date, time.value).length > 0) {
        // 获取该时间段内的所有课程
        const coursesInSlot = this.getCoursesAtTime(day.date, time.value)

        // 创建时间段占用数组
        const occupiedMinutes = Array(120).fill(false)

        // 标记每个课程占用的时间
        coursesInSlot.forEach(course => {
          const courseStartRelative = Math.max(0, course.startMinutes - slotStartMinutes)
          const courseEndRelative = Math.min(120, course.endMinutes - slotStartMinutes)

          for (let i = courseStartRelative; i < courseEndRelative; i++) {
            occupiedMinutes[i] = true
          }
        })

        // 查找最长的连续空闲时间
        let currentFreeStart = -1
        let longestFreeStart = -1
        let longestFreeDuration = 0
        let currentFreeDuration = 0

        for (let i = 0; i < occupiedMinutes.length; i++) {
          if (!occupiedMinutes[i]) {
            if (currentFreeStart === -1) {
              currentFreeStart = i
            }
            currentFreeDuration++
          } else {
            if (currentFreeStart !== -1) {
              // 发现一段空闲时间，检查是否是最长的
              if (currentFreeDuration > longestFreeDuration) {
                longestFreeStart = currentFreeStart
                longestFreeDuration = currentFreeDuration
              }
              // 重置当前空闲时间段
              currentFreeStart = -1
              currentFreeDuration = 0
            }
          }
        }

        // 检查最后一段空闲时间
        if (currentFreeStart !== -1 && currentFreeDuration > longestFreeDuration) {
          longestFreeStart = currentFreeStart
          longestFreeDuration = currentFreeDuration
        }

        // 如果找到了足够长的空闲时间（>=30分钟）
        if (longestFreeDuration >= 30) {
          // 计算空闲时间段的开始和结束时间
          const freeStartMinutes = slotStartMinutes + longestFreeStart
          const freeEndMinutes = freeStartMinutes + longestFreeDuration

          // 将分钟数转换为 HH:MM 格式
          const formatTimeFromMinutes = minutes => {
            const hours = Math.floor(minutes / 60)
            const mins = minutes % 60
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
          }

          const startTime = formatTimeFromMinutes(freeStartMinutes)
          const endTime = formatTimeFromMinutes(freeEndMinutes)

          // 设置日历排课数据，使用找到的可用时间段
          this.calendarScheduleData = {
            date: day.date,
            time: `${startTime}-${endTime}`,
            startTime: startTime,
            endTime: endTime,
            duration: longestFreeDuration
          }
        } else {
          // 没找到足够长的空闲时间，使用默认时间
          this.calendarScheduleData = {
            date: day.date,
            time: time.label,
            startTime: time.label.split('-')[0],
            endTime: time.label.split('-')[1],
            duration: 120
          }
        }
      } else {
        // 没有课程，使用整个时间段
        this.calendarScheduleData = {
          date: day.date,
          time: time.label,
          startTime: time.label.split('-')[0],
          endTime: time.label.split('-')[1],
          duration: 120
        }
      }
    },

    handleCopyCourse(course) {
      if (this.checkOrderAndTeacher()) return
      this.periodicSchedulingVisible = true
      this.isCopy = true
      this.isCalendarSchedule = true // 设置为日历排课
      this.calendarScheduleData = {
        subjectId: course.subjectId, // 复制的课程科目
        teacherId: course.teacherId, // 复制的教师ID
        // date: course.courseDate, // 复制的课程日期
        startTime: course.startTime, // 复制的课程开始时间
        endTime: course.endTime, // 复制的课程结束时间
        duration: course.endMinutes - course.startMinutes, // 复制的课程时长
        time: `${course.startTime} - ${course.endTime}`,
        teacherName: course.teacherName
      }
    },

    handleCancelClick(info) {
      this.cancelCourseInfo = info
      this.cancelDialogVisible = true
    },

    async handleCancelConfirm(reason) {
      this.cancelLoading = true
      try {
        const formattedCourseDate = this.cancelCourseInfo.courseDate.replace(/-/g, '')
        await studentManApi.ydyBatchAttend([
          {
            ...this.cancelCourseInfo,
            attendType: 'YDY_QX',
            courseDate: formattedCourseDate,
            subAttendType: reason
          }
        ])
        this.$message.success('取消排课成功~')
        this.cancelDialogVisible = false
        await this.loadScheduleData()
      } catch (error) {
        if (error.includes('Classin')) {
          this.$message.success(`取消排课成功~`)
          this.cancelDialogVisible = false
          await this.loadScheduleData()
          setTimeout(() => {
            this.$message.warning(`${error}`)
          }, 1000)
        } else {
          this.$message.error('取消失败，请稍后重试')
        }
      } finally {
        this.cancelLoading = false
      }
    },

    // 处理考勤
    handleAttendance(course) {
      if (!course) return

      // 检查课程状态是否为未考勤
      if (course.attendType !== 3) {
        this.$message.warning('该课程已考勤或未开始，无法进行考勤操作')
        return
      }

      // 设置选中的课程用于考勤
      this.selectedRows = [
        {
          studentName: this.studentInfo?.studentName && this.studentInfo?.studentName,
          ...course
        }
      ]
      // 打开考勤抽屉
      this.batchAttendanceVisible = true
    },

    // 处理批量考勤确认
    async handleBatchAttendanceConfirm(scheduleList) {
      try {
        // 格式化考勤数据
        const newScheduleList = scheduleList.map(item => ({
          ...item,
          attendType: 'YDY_ZCSK',
          subAttendType: item.status === 'normal' ? 'YDY_ZCSK' : item.status === 'absent' ? 'YDY_XSKK' : ''
        }))

        // 调用考勤接口
        await studentManApi.ydyBatchAttend(newScheduleList)
        this.$message.success('考勤成功')
        // 刷新课程数据
        await this.loadScheduleData()
        // 关闭考勤抽屉
        this.batchAttendanceVisible = false
      } catch (error) {
        this.$message.error('考勤失败，请稍后重试')
      } finally {
        if (this.$refs.batchAttendance) {
          this.batchAttendanceVisible = false
          this.$refs.batchAttendance.isSubmitting = false
        }
      }
    },

    // 打开周期排课抽屉
    handlePeriodicScheduling() {
      if (this.checkOrderAndTeacher()) return
      this.periodicSchedulingVisible = true
      this.isCalendarSchedule = false
    },

    // 排课成功回调
    handleScheduleSuccess() {
      this.switchSchedulingVisible = false
      this.periodicSchedulingVisible = false
      this.currentScheduleData = null
      this.selectedRows = []
      this.loadScheduleData()
    },

    // 处理日历排课点击
    handleCalendarScheduling() {
      if (this.checkOrderAndTeacher()) return
      this.isCalendarSchedule = true
      this.periodicSchedulingVisible = true
      this.calendarScheduleData = null // 重置日历数据
    },

    // 判断日期是否可以排课
    isDateSchedulable(date) {
      // 检查是否是过去的日期
      if (dayjs(date).isBefore(dayjs(), 'day')) {
        return false
      }
      return true
    },

    // 处理调课
    handleReschedule(course) {
      if (!course) return

      // 检查是否未考勤且未开始
      if (course.attendType !== 2) {
        this.$message.warning('只有未开始的课程才能进行调课操作')
        return
      }

      // 验证课程时间
      const now = new Date().getTime()
      const oneHour = 60 * 60 * 1000
      const courseDate = course.courseDate
      const courseTime = new Date(`${courseDate} ${course.startTime}`).getTime()

      if (courseTime <= now + oneHour) {
        this.$message.warning('上课时间距当前时间小于一小时，无法调课哦~')
        return
      }

      // 准备调课数据
      this.selectedRows = [
        {
          ...course,
          studentName: this.studentInfo?.studentName || '',
          studentId: this.studentId
        }
      ]

      this.currentScheduleData = [
        {
          ...course,
          courseDate: course.courseDate.replace(/-/g, ''),
          studentId: this.studentId,
          studentName: this.studentInfo?.studentName || ''
        }
      ]

      // 打开调课抽屉
      this.switchSchedulingVisible = true
    },

    // 判断时间段是否有可用的时间可以排课
    hasAvailableTimeInSlot(date, timeSlot) {
      // 如果没有课程，直接返回true
      if (this.getCoursesAtTime(date, timeSlot).length === 0) {
        // 还需要检查是否有跨越这个时间段的课程
        const slot = this.timeSlots.find(slot => slot.value === timeSlot)
        if (!slot) return false

        const slotStartMinutes = slot.minutes
        const slotEndMinutes = slotStartMinutes + 120 // 2小时时间段

        // 获取当天的所有课程
        const coursesOnThatDay = this.getCoursesByDate(date)

        // 检查是否有课程跨越了当前时间格子
        const hasOverlappingCourse = coursesOnThatDay.some(course => {
          // 检查课程是否与当前时间格子有重叠
          return course.startMinutes < slotEndMinutes && course.endMinutes > slotStartMinutes
        })

        // 如果有重叠的课程，则不能排课
        if (hasOverlappingCourse) {
          return false
        }

        return true
      }

      // 只要有课程占用了这个时间格子的任何部分，就不允许排课
      return false
    },

    handleBeforeUnload() {
      sessionStorage.removeItem('ScheduleStudentId')
    },

    initDriver() {
      // 在初始化driver之前，先找到一个可用的空闲时间格子
      this.findAvailableGridCell()

      this.driverObj = driver({
        className: 'driver-schedule',
        animate: true,
        opacity: 0.6,
        padding: 20,
        allowClose: false,
        showButtons: ['next'], // 仅显示"下一步"按钮
        showProgress: true, // 显示进度
        steps: this.driverSteps,
        nextBtnText: '我知道了', // 第一步显示"下一步"
        prevBtnText: '上一步',
        doneBtnText: '我知道了', // 最后一步显示"完成"
        onDeselected: () => {
          // 当用户点击"跳过引导"按钮或关闭引导时，我们不应该标记完成状态
          // 因为我们已经在 onNextClick 中处理了

          // 恢复所有的add-course-btn元素到正常状态
          const addButtons = document.querySelectorAll('[id^="add-course-btn"]')
          addButtons.forEach(button => {
            button.style.display = '' // 恢复原始显示属性
          })
          this.switchGuideStatus()
        },

        onHighlightStarted: element => {
          // 当第二步高亮开始时，确保新增排课按钮是可见的
          if (element?.id && element?.id.startsWith('add-course-btn')) {
            element.style.display = 'flex'
          }
        },
        onHighlighted: element => {
          // 当第二步高亮时，确保新增排课按钮是可见的
          if (element?.id && element?.id.startsWith('add-course-btn')) {
            element.style.display = 'flex'
          }
        },
        onNextClick: (element, step, { config }) => {
          // 第一步完成后，重新查找可用格子并更新第二步目标
          this.findAvailableGridCell()
          // 然后跳转到第二步
          setTimeout(() => {
            if (this.driverObj) {
              this.driverObj.moveNext() // 跳转到第二步
            }
          }, 300) // 稍微延长时间确保找到格子
        }
      })
    },

    // 新增方法：查找可用的时间格子并更新第二步引导的目标元素
    findAvailableGridCell() {
      // 检查是否已有课程数据
      if (!this.scheduleList || this.scheduleList.length === 0 || !this.weekDays || this.weekDays.length === 0) {
        return
      }

      // 查找所有可添加课程的格子
      const availableCells = []

      // 遍历所有日期和时间段，找出可用的格子
      this.weekDays.forEach((day, dayIndex) => {
        this.timeSlots.forEach((time, timeIndex) => {
          if (this.hasAvailableTimeInSlot(day.date, time.value)) {
            availableCells.push({
              dayIndex,
              timeIndex,
              id: `add-course-btn-${timeIndex}-${dayIndex}`
            })
          }
        })
      })

      // 如果找到可用格子，更新第二步引导的目标元素
      if (availableCells.length > 0) {
        // 优先选择中间位置的格子（如周三、周四的中间时间段）
        let targetCell

        // 尝试找接近中间的日期（如周三周四）
        const midDayIndices = [2, 3, 4]
        // 尝试找接近中间的时间段（如中午或下午）
        const midTimeIndices = [2, 3, 4]

        // 先尝试找理想的中间位置
        for (const dayIdx of midDayIndices) {
          for (const timeIdx of midTimeIndices) {
            const ideal = availableCells.find(cell => cell.dayIndex === dayIdx && cell.timeIndex === timeIdx)
            if (ideal) {
              targetCell = ideal
              break
            }
          }
          if (targetCell) break
        }

        // 如果没有找到理想位置，就选第一个可用格子
        if (!targetCell) {
          targetCell = availableCells[0]
        }

        // 更新第二步引导的目标元素
        if (this.driverSteps.length >= 2) {
          this.driverSteps[1].element = `#${targetCell.id}`

          // 确保该元素存在且可见
          this.$nextTick(() => {
            const elem = document.getElementById(targetCell.id)
            if (elem) {
              elem.style.display = 'flex' // 确保可见
            }
          })
        }
      } else {
        // 如果没有可用格子，尝试使用第一周的第一个时间段作为引导
        if (this.driverSteps.length >= 2 && this.weekDays.length > 0) {
          this.driverSteps[1].element = '#add-course-btn-0-0'
        }
      }
    },

    startGuide() {
      if (!this.driverObj) {
        this.initDriver()
      }
      this.driverObj.drive()
    },

    mounted() {},

    // 课表显示设置相关方法
    handleScheduleSetting() {
      // 打开弹窗前，先将当前设置复制到临时变量
      this.tempScheduleSettings = JSON.parse(JSON.stringify(this.scheduleSettings))
      this.scheduleSettingVisible = true
    },

    handleDisplayInfoChange(value) {
      // 限制最多选择2项
      if (value.length > 2) {
        this.tempScheduleSettings.displayInfo = value.slice(0, 2)
        this.$message.warning('最多只能选择2项显示信息')
      }
    },

    loadScheduleSettings() {
      // 从localStorage读取设置
      const savedSettings = localStorage.getItem('scheduleSettings')
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings)
          this.scheduleSettings = {
            ...this.scheduleSettings,
            ...parsedSettings
          }
          // 初始化临时设置与实际设置一致
          this.tempScheduleSettings = JSON.parse(JSON.stringify(this.scheduleSettings))
        } catch (e) {
          console.error('Failed to parse schedule settings:', e)
        }
      }
    },

    saveScheduleSettings() {
      // 将临时设置应用到实际设置
      this.scheduleSettings = JSON.parse(JSON.stringify(this.tempScheduleSettings))
      // 保存设置到localStorage
      localStorage.setItem('scheduleSettings', JSON.stringify(this.scheduleSettings))
      this.scheduleSettingVisible = false
      // 刷新课表
      this.loadScheduleData()
    },

    // 获取课程显示文本
    getCourseDisplayText(course) {
      if (!this.scheduleSettings || !this.scheduleSettings.displayInfo) return ''

      const displayParts = []

      if (this.scheduleSettings.displayInfo.includes('subject')) {
        displayParts.push(course.subjectName || '')
      }

      if (this.scheduleSettings.displayInfo.includes('branch')) {
        displayParts.push(course.shortBranchName || course.branchName || '')
      }

      if (this.scheduleSettings.displayInfo.includes('teacher')) {
        displayParts.push(course.teacherName || '')
      }

      if (this.scheduleSettings.displayInfo.includes('courseType')) {
        displayParts.push(course.courseKindName || '')
      }

      return displayParts.filter(part => part).join('-')
    },
    handleSettingDialogClose() {
      // 关闭弹窗时，丢弃所有未保存的更改
      this.tempScheduleSettings = JSON.parse(JSON.stringify(this.scheduleSettings))
    }
  },

  beforeDestroy() {
    // Remove event listener when component is destroyed
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }
}
</script>

<!-- interface ScheduleItem {
  id: number;                // 课程ID
  date: string;             // 课程日期，格式：YYYY-MM-DD
  startTime: string;        // 开始时间，格式：HH:mm
  endTime: string;          // 结束时间，格式：HH:mm
  startMinutes: number;     // 开始时间转换为分钟数（如 8:30 = 8*60 + 30 = 510）
  endMinutes: number;       // 结束时间转换为分钟数
  subject: string;          // 课程科目
  teacherName: string;      // 教师姓名
  status: 'normal' | 'finished' | 'canceled';  // 课程状态：正常/已完成/已取消


  {
  "code": 200,
  "data": {
    "scheduleList": [
      {
        "id": 1,
        "date": "2025-03-26",
        "startTime": "08:00",
        "endTime": "09:30",
        "startMinutes": 480,
        "endMinutes": 570,
        "subject": "数学",
        "teacherName": "帝豪",
        "status": "normal"
      }
    ]
  }
}
} -->

<style lang="scss" scoped>
.one2one-schedule {
  background: #f5f7fa;
  // min-height: 100vh;
  // padding: 16px;

  .schedule-header {
    background: #fff;
    border-radius: 8px;
    padding: 12px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .info-detail {
        .name {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          line-height: 22px;
        }
        .sub-info {
          font-size: 12px;
          color: #666;
          line-height: 17px;
          margin-top: 2px;
        }
      }
    }

    .header-right {
      .action-buttons {
        display: flex;
        gap: 10px;

        .el-button {
          font-size: 14px;
          color: #666;
          padding: 0;

          i {
            margin-right: 4px;
            font-size: 16px;
          }

          &:hover {
            color: #1890ff;
          }
        }
      }
    }
  }

  .schedule-nav {
    margin-top: 16px;
    background: #fff;
    border-radius: 8px;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .nav-right {
      display: flex;
      align-items: center;
      gap: 32px;

      .date-range {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .date-text {
          font-size: 14px;
          color: #333;
        }
      }
    }
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 16px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #666;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;

        &.dot-red {
          background: #ff5c5c;
        }
        &.dot-green {
          background: #1cc6a1;
        }
        &.dot-blue {
          background: #157cff;
        }
      }
    }
  }

  .schedule-content {
    margin-top: 16px;
    border-radius: 8px;

    .schedule-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .schedule-table {
      display: flex;
      border: 1px solid #ebeef5;
      // max-height: calc(100vh - 320px);
      // overflow-y: auto;

      .time-column {
        width: 100px;
        border-right: 1px solid #ebeef5;

        .time-header {
          height: 60px;
          line-height: 60px;
          text-align: center;
          background-color: rgba(250, 250, 250, 1);
          border-bottom: 1px solid #ebeef5;
          color: #303133;
        }

        .time-slot {
          height: 80px;
          line-height: 80px;
          text-align: center;
          border-bottom: 1px solid #ebeef5;

          &:last-child {
            border-bottom: none;
          }
        }
      }

      .days-container {
        flex: 1;

        .days-header {
          display: flex;
          height: 60px;
          background: #f5f7fa;
          border-bottom: 1px solid #ebeef5;

          .day-column {
            flex: 1;
            text-align: center;
            border-right: 1px solid #ebeef5;
            background-color: rgba(250, 250, 250, 1);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;

            &:last-child {
              border-right: none;
            }

            .day-label {
              position: relative;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .today-label {
              background-color: #157cff;
              color: #fff;
              font-size: 10px;
              padding: 2px 4px;
              border-radius: 4px;
              margin-left: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: normal;
            }

            .date-label {
              color: #666;
              font-size: 12px;
              margin-top: 4px;
            }
          }
        }

        .schedule-grid {
          display: flex;

          .day-column {
            flex: 1;
            border-right: 1px solid #ebeef5;

            &:last-child {
              border-right: none;
            }

            .grid-cell {
              position: relative;
              height: 80px;
              border-bottom: 1px solid #ebeef5;
              padding: 4px;
              // cursor: pointer;

              .course-container {
                width: 100%;
                height: 100%;
                position: relative;
                display: flex;

                .course-wrapper {
                  flex: 1;
                  height: 100%;
                  padding: 0 2px;
                }
              }

              &.has-course {
                &:not(.can-add) {
                  cursor: default;
                  &:hover {
                    background-color: unset !important;
                  }
                }
              }

              &:hover {
                // background-color: #f5f7fa;
              }

              .course-item {
                padding: 0px 8px;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
                z-index: 2; // 确保课程在新增按钮之上

                .course-subject {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100%;
                  position: relative;
                }

                .course-subject span {
                  /* 添加一个子元素包裹文本 */
                  font-size: 14px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  max-width: 100%; /* 确保内容不会超出父容器 */
                }

                // Add left border and background color based on attendance status
                &.course-attended {
                  border-left: 4px solid #1cc6a1;
                  background-color: rgba(28, 198, 161, 0.1);
                  color: #333;
                }

                &.course-scheduled {
                  border-left: 4px solid #157cff;
                  background-color: rgba(21, 124, 255, 0.1);
                  color: #333;
                }

                &.course-absent {
                  border-left: 4px solid #ff5c5c;
                  background-color: rgba(255, 92, 92, 0.1);
                  color: #333;
                }

                .course-time,
                .course-teacher {
                  color: #666;
                }
              }

              .add-course-btn {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 1px dashed #1890ff;
                border-radius: 4px;
                color: #1890ff;
                font-size: 14px;
                text-align: center;
                justify-content: center;
                align-items: center;
                flex-direction: column;
                cursor: pointer;
                z-index: 1; // 确保在课程下方
                background-color: rgba(255, 255, 255, 0.7); // 半透明背景
              }

              &:hover .add-course-btn {
                display: flex;
              }

              &.has-course.can-add:hover .add-course-btn {
                display: flex;
              }
            }
          }
        }
      }
    }
  }
}

.week-picker {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-date-picker {
    width: 200px;
  }

  ::v-deep .el-input__inner {
    text-align: center;
    cursor: pointer;
  }
}

.schedule-toolbar {
  .nav-left {
    .el-button {
      padding: 9px 15px;

      &[disabled] {
        color: #c0c4cc;
        background-color: #f5f7fa;
        border-color: #e4e7ed;
      }
    }
  }

  .schedule-type-buttons {
    display: flex;
    align-items: center;

    .el-button {
      min-width: 88px;
      border-radius: 4px;

      &.periodic-btn {
        background-color: #2979ff;
        border-color: #2979ff;
      }

      &.calendar-btn {
        color: #666;
        background-color: #fff;
        border-color: #dcdfe6;

        &:hover {
          color: #2979ff;
          border-color: #2979ff;
        }
      }
    }
  }
}

.course-detail {
  padding: 8px 0px;

  .detail-header {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
    display: flex;
    justify-content: space-between;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #666;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;

        &.dot-red {
          background: #ff5c5c;
        }
        &.dot-green {
          background: #1cc6a1;
        }
        &.dot-blue {
          background: #157cff;
        }
      }
    }
  }

  .detail-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
    padding: 8px;
    padding-bottom: 0px;
    div {
      cursor: pointer;
    }
  }

  .detail-btn {
    cursor: pointer;
    &:hover {
      color: #1890ff;
    }
  }

  .detail-item {
    margin-bottom: 8px;
    font-size: 14px;
    display: flex;
    text-align: right;
    gap: 12px;

    .label {
      color: #666;
      width: 80px;
      flex-shrink: 0;
    }
  }

  .detail-item span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
}

::v-deep .course-popover {
  padding: 0;

  .el-popover__title {
    margin: 0;
    padding: 12px;
    border-bottom: 1px solid #ebeef5;
  }
}

.label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-bottom: 0px;
}

.icon-attend {
  background-image: url('~@/assets/images/student/atten.png');
}

.detail-btn:hover .icon-attend {
  background-image: url('~@/assets/images/student/atten_blue.png');
}

.icon-copy {
  background-image: url('~@/assets/images/student/copy.png');
}

.detail-btn:hover .icon-copy {
  background-image: url('~@/assets/images/student/copy_blue.png');
}

.icon-cancel {
  background-image: url('~@/assets/images/student/cancel.png');
}

.detail-btn:hover .icon-cancel {
  background-image: url('~@/assets/images/student/cancel_blue.png');
}

.icon-change {
  background-image: url('~@/assets/images/student/change.png');
}

.detail-btn:hover .icon-change {
  background-image: url('~@/assets/images/student/change_blue.png');
}

/* 引导时添加的样式 */
.driver-schedule.driver-active .driver-highlighted-element[id^='add-course-btn'] {
  display: flex !important;
  z-index: 1000 !important;
}

.class-label {
  font-size: 12px;
  padding: 1px 2px;
  border-radius: 0px 4px 0px 4px;
  margin-left: 4px;
  position: absolute;
  top: 0px;
  right: -7px;
  color: #fff;

  &.class-label-red {
    background-color: #ff5c5c;
  }

  &.class-label-green {
    background-color: #1cc6a1;
  }

  &.class-label-blue {
    background-color: #157cff;
  }
}

/* 课表显示设置弹窗样式 */
.schedule-setting-dialog {
  .setting-content {
    padding: 0 20px;
  }

  .setting-item {
    margin-bottom: 10px;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .setting-label {
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 500;
    white-space: nowrap;

    .required {
      color: #f56c6c;
      margin-right: 2px;
    }
  }

  .tip-text {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
  }
}
</style>
