<template>
  <div>
    <el-drawer :title="drawerTitle" :visible.sync="visible" direction="rtl" size="620px" :before-close="handleClose" custom-class="periodic-scheduling">
      <div class="drawer-container">
        <div class="content-wrapper">
          <!-- 排课订单部分 -->
          <div class="schedule-orders">
            <div class="section-header">
              <div class="section-title">排课订单</div>
              <div style="display: flex; align-items: center">
                <div style="margin-right: 10px;color: #666;font-size: 14px;">
                  已选 <span style="color: #1890ff">{{ selectedOrders && selectedOrders.length }}</span> 个订单
                </div>
                <el-button v-if="scheduleOrders && scheduleOrders.length > 1" type="text" @click="toggleExpand">
                  {{ isExpanded ? '收起' : '展开' }}
                  <i :class="['el-icon-arrow-' + (isExpanded ? 'up' : 'down')]"></i>
                </el-button>
              </div>
            </div>
            <div class="order-list">
              <div
                v-for="order in scheduleOrders"
                :key="order.orderNo"
                :class="[
                  'order-item',
                  {
                    // selected: selectedOrders.includes(order.id),
                    disabled: !order.applyInfo,
                    collapsed: !isExpanded && !selectedOrders.includes(order.id)
                  }
                ]"
              >
                <div class="order-header">
                  <span class="order-no">报班单号: {{ order.orderNo }}</span>
                  <span class="course-type">{{ order.courseKindName }}</span>
                </div>
                <div style="padding: 8px 16px;padding-bottom: 16px;">
                  <div class="order-content">
                    <div class="course-name">{{ order.courseName }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 排课处理部分 -->
          <div class="schedule-handling">
            <div class="section-title">排课处理</div>
            <el-form ref="scheduleForm" :model="scheduleForm" :rules="rules" label-width="80px">
              <!-- 科目和教师 所有模式都显示 -->
              <div class="form-row">
                <el-form-item label="科目" prop="subjectId" class="required">
                  <HiDict size="small" v-model="scheduleForm.subjectId" dict-key="subject" :disabled="true" />
                </el-form-item>
                <el-form-item label="教师" prop="teacherId" class="required">
                  <el-row type="flex">
                    <HiAsyncSelector
                      v-model="scheduleForm.teacherId"
                      dict-key="teacher"
                      :defaultWord="scheduleForm.teacherName"
                      :param="{ buId: userBaseInfo.buId }"
                      style="margin-right: 8px"
                      placeholder="请输入名称搜索"
                      size="small"
                      :disabled="true"
                    >
                      <template v-slot="slotProps">
                        <span>{{ slotProps.label }}</span>
                        <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                      </template>
                    </HiAsyncSelector>
                  </el-row>
                </el-form-item>
              </div>

              <!-- 上课时间 所有模式都显示 -->
              <div class="form-row">
                <el-form-item label="上课时间" prop="startTime" class="required">
                  <el-time-picker
                    v-model="scheduleForm.startTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="请选择"
                    size="small"
                    @change="changeStartTime"
                    style="width: 120PX"
                  />
                  -
                  <el-time-picker
                    v-model="scheduleForm.endTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    size="small"
                    disabled
                    placeholder="请选择"
                    style="width: 120PX"
                  />
                </el-form-item>
              </div>

              <div v-if="isCalendarSchedule" class="form-row">
                <el-form-item label="课次数量" prop="courseCount" class="required">
                  <el-input-number disabled placeholder="请输入" size="small" v-model="scheduleForm.courseCount" :min="1" :max="50" controls-position="right" />
                </el-form-item>
              </div>

              <!-- 上课日期 在单次调课和周期调课时显示 -->
              <div v-if="!isCalendarSchedule" class="form-row">
                <el-form-item label="开始日期" prop="courseDate" class="required">
                  <el-date-picker v-model="scheduleForm.courseDate" type="date" placeholder="请选择" size="small" :picker-options="datePickerOptions" />
                </el-form-item>
              </div>

              <!-- 重复周期和课次数量 仅在周期调课时显示 -->
              <div v-if="!isCalendarSchedule && !isSingleSchedule" class="form-row">
                <el-form-item label="重复周期" prop="repeatCycle" class="required">
                  <el-select v-model="scheduleForm.repeatCycle" placeholder="请选择" size="small" multiple>
                    <el-option v-for="item in weekOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="课次数量" prop="courseCount" class="required">
                  <el-input-number disabled placeholder="请输入" size="small" v-model="scheduleForm.courseCount" :min="1" :max="50" controls-position="right" />
                </el-form-item>
              </div>

              <!-- 日历选择 仅在日历调课时显示 -->
              <div v-if="isCalendarSchedule" class="form-row">
                <el-form-item prop="schedulingDays" class="scheduling-days">
                  <div class="date-wrap">
                    <Calendar :date="defaultDate" @selectDate="selectDate" :selectDateArr="selectDateArr" refs="Calendar" />
                    <SleactDatePreview :customClass="'date-prev'" :dataArr="selectDateArr" @clear="clearSelectDate" @remove-data="removeDate" />
                  </div>
                  <div class="calendar-tip">点击日历选择日期，可多选，右边展示已选的日期，再次点击取消对应日期的选择。</div>
                  <div v-if="isCalendarSchedule && selectDateArr && selectDateArr.length !== scheduleForm.courseCount" class="calendar-warning">
                    请选择与课次数量一致的天数
                  </div>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>

        <!-- 底部按钮 -->
        <!-- :disabled="!isFormValid" -->
        <div class="drawer-footer">
          <el-button :disabled="!isFormValid" type="primary" @click="handleSubmit">确定调课</el-button>
          <el-button @click="handleClose">取 消</el-button>
        </div>
      </div>
    </el-drawer>
    <!-- 冲突列表 -->
    <div>
      <conflict-list :visible.sync="showConflictDialog" :schedule-list="scheduleListData" :is-switch="true" @success="handleScheduleSuccess" />
    </div>
  </div>
</template>

<script>
import { studentManApi } from '@/services'
import { mapState } from 'vuex'
import dayjs from 'dayjs'
import Calendar from '@/components/calendar'
import SleactDatePreview from '../../coursemgr/arrange-course/components/SelectDatePreview.vue'
import ConflictList from '../schedule/ConflictList.vue'

export default {
  name: 'PeriodicScheduling',
  components: {
    Calendar,
    SleactDatePreview,
    ConflictList
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: String,
      default: ''
    },
    studentInfo: {
      type: Object,
      default: () => ({})
    },
    // 新增 prop：是否是日历排课
    isCalendarSchedule: {
      type: Boolean,
      default: false
    },
    // 新增 prop：日历排课数据
    calendarScheduleData: {
      type: Object,
      default: () => ({})
    },
    // 添加单次调课相关的props
    isSingleSchedule: {
      type: Boolean,
      default: false
    },
    currentScheduleData: {
      type: Array,
      default: () => []
    },
    selectedRows: {
      type: Array,
      default: () => []
    },
    switchSchedulingType: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      showConflictDialog: false,
      scheduleOrders: [], // 排课订单列表
      scheduleForm: {
        subjectId: '',
        teacherId: '',
        startTime: '',
        endTime: '',
        courseDate: '',
        duration: 120,
        courseCount: undefined,
        repeatCycle: [],
        teacherName: '',
        simulation: 'NO'
      },
      datePickerOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
        }
      },
      weekOptions: [
        { label: '周一', value: 1 },
        { label: '周二', value: 2 },
        { label: '周三', value: 3 },
        { label: '周四', value: 4 },
        { label: '周五', value: 5 },
        { label: '周六', value: 6 },
        { label: '周日', value: 7 }
      ],
      scheduleListData: {},
      selectDateArr: [], // 日历选择的日期数组
      defaultDate: new Date(),
      limitDate: {
        start: new Date(),
        end: new Date(new Date().setMonth(new Date().getMonth() + 3))
      },
      weekEnumMap: {
        0: '日',
        1: '一',
        2: '二',
        3: '三',
        4: '四',
        5: '五',
        6: '六'
      },
      rules: {
        subject: [{ required: true, message: '请选择科目', trigger: 'blur' }],
        teacherId: [{ required: true, message: '请选择教师', trigger: 'blur' }],
        courseDate: [{ required: true, message: '请选择上课日期', trigger: 'blur' }],
        duration: [{ required: true, message: '请输入课次时长', trigger: 'blur' }],
        courseCount: [{ required: true, message: '请输入课次数量', trigger: 'blur' }],
        repeatCycle: [{ required: true, message: '请选择重复周期', trigger: 'blur' }],
        startTime: [{ required: true, message: '请选择上课时间', trigger: 'blur' }]
      },
      subjectOptions: [
        { label: '语文', value: 'chinese' },
        { label: '数学', value: 'math' },
        { label: '英语', value: 'english' }
      ],
      teacherOptions: [],
      teacherLoading: false,
      startDateOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
        }
      },
      isExpanded: true,
      selectedOrders: [],
      timeSlots: [] // 初始化时间档期
    }
  },

  computed: {
    ...mapState('user', ['userBaseInfo']),
    isFormValid() {
      const { subjectId, teacherId, startTime } = this.scheduleForm
      // 基础字段验证（所有模式都需要）
      let baseFieldsValid = subjectId && teacherId && startTime

      if (this.isSingleSchedule) {
        // 单次调课 科目、教师、上课时间、上课日期
        return baseFieldsValid && this.scheduleForm.courseDate
      } else if (this.isCalendarSchedule) {
        // 日历调课 科目、教师、上课时间、选择的日期数量等于课次数量
        return (
          baseFieldsValid && this.scheduleForm.courseCount > 0 && this.selectDateArr.length > 0 && this.selectDateArr.length === this.scheduleForm.courseCount
        )
      } else {
        // 周期调课 科目、教师、上课时间、上课日期、重复周期、课次数量
        return baseFieldsValid && this.scheduleForm.courseDate && this.scheduleForm.repeatCycle.length > 0 && this.scheduleForm.courseCount > 0
      }
    },

    // 抽屉标题
    drawerTitle() {
      if (this.isSingleSchedule) return '单次调课'
      return this.isCalendarSchedule ? '日历调课' : '周期调课'
    }
  },

  created() {
    // 页面初始化时获取学生排课订单信息
    this.getStudentOrders()
  },

  watch: {
    visible(newVal) {
      if (newVal) {
        // 打开抽屉时初始化数据
        this.getStudentOrders()
        this.initFormData()
      } else {
        // 关闭抽屉时重置所有数据
        this.resetForm()
      }
    },
    selectedRows: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.length > 0 && this.visible) {
          // 日历调课，设置课次数量
          if (this.isCalendarSchedule) {
            this.scheduleForm.courseCount = newVal.length
          }

          // 初始化表单数据
          this.initFormData()
        }
      }
    },
    currentScheduleData: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.visible) {
          // 初始化表单数据
          this.initFormData()
        }
      }
    },
    switchSchedulingType: {
      immediate: true,
      handler(newVal) {
        if (newVal && this.visible) {
          if (newVal === 'calendar' && this.selectedRows && this.selectedRows.length > 0) {
            // 设置课次数量为选中行数量
            this.scheduleForm.courseCount = this.selectedRows.length
          }

          // 初始化表单数据
          this.initFormData()
        }
      }
    }
  },

  methods: {
    // 获取学生的排课订单
    async getStudentOrders() {
      try {
        // attTeacherName: '毛扬'
        // attendBranchId: 100000705
        // attendCount: null
        // attendDate: null
        // attendType: 'YDY_QX'
        // attendTypeName: '排课取消'
        // attendTypeTeacher: 23
        // attendTypeTeacherName: '排课取消'
        // attendancePic: null
        // branchId: null
        // branchName: '个性化瑞景测试校区'
        // businessType: null
        // counselorId: 100001313
        // counselorName: '毛扬'
        // courseDate: 20250313
        // courseDateStr: '2025-03-13(周四)'
        // courseKind: null
        // courseName: '2022测试1对1课程0411'
        // courseNo: 'YDY_20220411003477'
        // courseTimes: 4
        // date: null
        // encoding: 'att-gxh_20250305002812'
        // endTime: '15:40'
        // gradeId: null
        // gradeName: null
        // id: 108527163
        // orderCourseId: 1231779500
        // remark: null
        // startTime: '13:40'
        // studentCount: null
        // studentId: 100715953
        // studentName: '快乐'
        // subAttendType: 23
        // subjectId: 8
        // subjectName: '数学'
        // teacherId: 100037930
        // teacherNo: 'my'

        // 处理订单数据
        this.scheduleOrders = this.currentScheduleData?.map(order => ({
          id: order.id,
          orderNo: order?.orderNo || order?.courseNo,
          courseKindName: order?.courseKindName,
          courseName: order?.courseName,
          courseScheduleCount: order?.courseScheduleCount || 0,
          courseSurplusCount: order?.courseSurplusCount || 0,
          courseTotalCount: order?.courseTotalCount || 0,
          discountUnitPrice: order?.discountUnitPrice || 0,
          subjects: order?.subjects || [],
          courseKind: order?.courseKind,
          disabled: false,
          applyInfo: true
        }))

        // 去重处理，确保每个订单号只保留一个
        const uniqueCourseNos = new Set()
        this.scheduleOrders = this.scheduleOrders?.filter(order => {
          if (!uniqueCourseNos.has(order.orderNo)) {
            uniqueCourseNos.add(order.orderNo)
            return true
          }
          return false
        })

        // 默认选中第一个可用订单
        const availableOrder = this.scheduleOrders?.find(order => order.applyInfo)
        if (availableOrder) {
          this.selectedOrders = [availableOrder.id]
        }
      } catch (error) {
        console.error('获取排课订单失败:', error)
      }
    },

    // 初始化表单数据
    initFormData() {
      if (this.isSingleSchedule && this.currentScheduleData) {
        // 单次调课，从当前课程中获取数据
        const data = this.currentScheduleData[0]
        this.scheduleForm.subjectId = data.subjectId
        this.scheduleForm.teacherId = data.teacherId
        this.scheduleForm.teacherName = data.teacherName || data.attTeacherName
        this.scheduleForm.startTime = data.startTime
        this.scheduleForm.endTime = data.endTime

        // 处理日期格式
        const courseDate = data.courseDate.toString()
        this.scheduleForm.courseDate = `${courseDate.substring(0, 4)}-${courseDate.substring(4, 6)}-${courseDate.substring(6, 8)}`

        // 计算课程时长（小时）
        if (data.startTime && data.endTime) {
          const [startHour, startMinute] = data.startTime.split(':').map(Number)
          const [endHour, endMinute] = data.endTime.split(':').map(Number)
          const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
          this.scheduleForm.duration = durationMinutes
        }
      } else if (this.isCalendarSchedule && this.selectedRows && this.selectedRows.length > 0) {
        // 日历调课，使用第一个选中行的数据作为基础
        const firstRow = this.selectedRows[0]
        this.scheduleForm.subjectId = firstRow.subjectId
        this.scheduleForm.teacherId = firstRow.teacherId
        this.scheduleForm.teacherName = firstRow.teacherName || firstRow.attTeacherName
        this.scheduleForm.startTime = firstRow.startTime
        this.scheduleForm.endTime = firstRow.endTime
        this.scheduleForm.courseCount = this.selectedRows.length

        // 计算课程时长
        if (firstRow.startTime && firstRow.endTime) {
          const [startHour, startMinute] = firstRow.startTime.split(':').map(Number)
          const [endHour, endMinute] = firstRow.endTime.split(':').map(Number)
          const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
          this.scheduleForm.duration = durationMinutes
        }
      } else if (!this.isSingleSchedule && !this.isCalendarSchedule && this.selectedRows && this.selectedRows.length > 0) {
        // 周期调课，使用第一个选中行的数据作为基础
        const firstRow = this.selectedRows[0]
        this.scheduleForm.subjectId = firstRow.subjectId
        this.scheduleForm.teacherId = firstRow.teacherId
        this.scheduleForm.teacherName = firstRow.teacherName || firstRow.attTeacherName
        this.scheduleForm.startTime = firstRow.startTime
        this.scheduleForm.endTime = firstRow.endTime
        this.scheduleForm.courseCount = this.selectedRows.length

        // 处理日期格式
        const courseDate = firstRow.courseDate.toString()
        this.scheduleForm.courseDate = `${courseDate.substring(0, 4)}-${courseDate.substring(4, 6)}-${courseDate.substring(6, 8)}`

        // 计算课程时长
        if (firstRow.startTime && firstRow.endTime) {
          const [startHour, startMinute] = firstRow.startTime.split(':').map(Number)
          const [endHour, endMinute] = firstRow.endTime.split(':').map(Number)
          const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
          this.scheduleForm.duration = durationMinutes
        }
      }
    },

    // 远程搜索教师
    async remoteSearchTeacher(query) {
      if (query.length < 1) return

      this.teacherLoading = true
      try {
        // 这里需要调用实际的API
        const response = await this.searchTeachers(query)
        this.teacherOptions = response.data
      } catch (error) {
        console.error('搜索教师失败:', error)
        this.$message.error('搜索教师失败')
      } finally {
        this.teacherLoading = false
      }
    },

    // 关闭抽屉
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('update:isCalendarSchedule', false)
      this.$emit('update:calendarScheduleData', null)
      this.resetForm()
    },

    // 重置表单
    resetForm() {
      if (this.$refs.scheduleForm) {
        this.$refs.scheduleForm.resetFields()
      }
      this.scheduleForm = {
        subjectId: '',
        teacherId: '',
        startTime: '',
        endTime: '',
        courseDate: '',
        duration: 120,
        courseCount: undefined,
        repeatCycle: [],
        teacherName: '',
        simulation: 'NO'
      }
      this.selectDateArr = []
      this.calendarScheduleData = null
      // 清除日历排课数据
      this.$emit('update:calendarScheduleData', {})
    },

    // 选择日期
    selectDate(date) {
      if (date.disabled) return

      const findIndex = this.selectDateArr.findIndex(i => i.date === date.date)

      if (findIndex !== -1) {
        // 已选择，取消选择
        this.selectDateArr.splice(findIndex, 1)
      } else {
        // 新选择，检查是否超过课次数量
        if (this.isCalendarSchedule && this.selectDateArr.length >= this.scheduleForm.courseCount) {
          this.$message.warning(`最多只能选择${this.scheduleForm.courseCount}个日期`)
          return
        }

        // 添加新选择的日期
        this.selectDateArr.push(date)
        this.selectDateArr.sort((a, b) => a.dateValue - b.dateValue)
      }
    },

    // 清空排课日期
    clearSelectDate() {
      this.selectDateArr = []
    },

    // 删除单个日期
    removeDate(index) {
      this.selectDateArr.splice(index, 1)
    },

    // 修改生成排课列表方法
    generateScheduleList() {
      const { subjectId, teacherId, startTime, endTime, courseDate, repeatCycle, courseCount, duration } = this.scheduleForm

      // 创建基础课程对象
      const createScheduleItem = date => ({
        teacherId,
        startTime,
        endTime,
        duration: `${duration / 60}小时`,
        courseDate: date.format('YYYY-MM-DD').replace(/-/g, ''),
        orderCourseIds: this.selectedOrders.join(','),
        subjectId,
        attendType: 'YDY_WKQ',
        counselorId: this.studentInfo.counselorId
      })

      // 单次调课逻辑
      if (this.isSingleSchedule) {
        if (!courseDate) return []

        const scheduleDate = dayjs(courseDate)
        return [
          {
            ...createScheduleItem(scheduleDate),
            id: this.currentScheduleData[0].id,
            attendanceId: this.currentScheduleData[0].attendId,
            scheduleType: 'time', // 单次调课使用time类型,
            studentId: this.currentScheduleData[0].studentId
          }
        ]
      }

      // 周期调课逻辑
      else {
        if (!courseDate || !repeatCycle || !repeatCycle.length || !courseCount) {
          return []
        }

        let scheduleList = []
        let currentDate = dayjs(courseDate)
        let count = 0

        // 将选择的重复周期转为数字数组并排序
        const weekDays = repeatCycle.map(Number).sort((a, b) => a - b)

        // 首先检查初始日期是否是上课日
        const initialWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()
        // 如果初始日期不在重复周期内，先找到最近的一个上课日
        if (!weekDays.includes(initialWeekDay)) {
          // 找本周更后面的日期
          let found = false
          for (const day of weekDays) {
            if (day > initialWeekDay) {
              // 找到了本周的上课日
              const daysToAdd = day - initialWeekDay
              currentDate = currentDate.add(daysToAdd, 'day')
              found = true
              break
            }
          }

          // 如果本周没有更多上课日，则跳到下周第一个上课日
          if (!found) {
            const firstDayNextWeek = weekDays[0] // 使用数组的第一个元素作为下周第一个上课日
            // 计算到下周第一个上课日需要的天数
            const daysToWeekEnd = 7 - initialWeekDay // 到本周日的天数
            const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
            const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass

            currentDate = currentDate.add(daysToAdd, 'day')
          }
        }

        while (count < courseCount) {
          // 获取当前日期的星期几（1-7，其中7表示周日）
          const currentWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()

          // 检查当前日期是否在重复周期内
          if (weekDays.includes(currentWeekDay)) {
            // 当前日期是上课日，添加到课程列表
            scheduleList.push({
              ...createScheduleItem(currentDate),
              courseScheduleCount: courseCount,
              attendClassPeriod: weekDays.join(','),
              scheduleType: 'period', // 周期调课使用period类型
              studentId: this.currentScheduleData[count].studentId
            })

            count++ // 只有添加了课程才增加计数
            // 保留原有逻辑：达到课程数后跳出循环
            if (count >= courseCount) break
          }

          // 移动到下一个日期
          // 找到下一个上课日期
          let found = false

          // 修改：如果当前是周日且周日在上课周期中，需要特殊处理下一周的查找逻辑
          if (currentWeekDay === 7) {
            // 直接跳到下周的第一个上课日
            const daysToAdd = 7 // 直接加7天到下周同一天
            currentDate = currentDate.add(daysToAdd, 'day')

            // 如果下周同一天不在上课周期内，则继续寻找下周的其他上课日
            const nextWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()
            if (!weekDays.includes(nextWeekDay)) {
              // 找下周第一个上课日
              for (const day of weekDays) {
                if (day > nextWeekDay) {
                  const daysToAdjust = day - nextWeekDay
                  currentDate = currentDate.add(daysToAdjust, 'day')
                  found = true
                  break
                }
              }

              // 如果下周没有找到，再跳到下下周第一个上课日
              if (!found) {
                const firstDay = weekDays[0]
                const daysToWeekEnd = 7 - nextWeekDay
                const daysFromWeekStartToFirstClass = firstDay === 7 ? 0 : firstDay
                const daysToAdjust = daysToWeekEnd + daysFromWeekStartToFirstClass
                currentDate = currentDate.add(daysToAdjust, 'day')
              }
            } else {
              found = true
            }
          } else {
            // 先尝试找本周剩余天数中是否有上课日
            for (const day of weekDays) {
              if (day > currentWeekDay) {
                // 找到了本周的下一个上课日
                const daysToAdd = day - currentWeekDay
                currentDate = currentDate.add(daysToAdd, 'day')
                found = true
                break
              }
            }

            // 如果本周没有更多上课日，则跳到下周第一个上课日
            if (!found) {
              const firstDayNextWeek = weekDays[0] // 使用数组的第一个元素作为下周第一个上课日
              // 计算到下周第一个上课日需要的天数
              // 先计算到本周末还有几天，再加上下周开始到第一个上课日的天数
              const daysToWeekEnd = 7 - currentWeekDay // 到本周日的天数
              const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
              const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass

              currentDate = currentDate.add(daysToAdd, 'day')
            }
          }
        }

        // 根据 生成的scheduleList 拿到相应选中的id
        scheduleList = scheduleList.map((item, index) => {
          return {
            ...item,
            id: this.currentScheduleData[index].id,
            attendanceId: this.currentScheduleData[index].attendId
          }
        })
        return scheduleList
      }
    },

    // 修改生成排课列表方法
    generateScheduleListCalendar() {
      const { subjectId, teacherId, startTime, endTime, duration } = this.scheduleForm
      //根据 selectDateArr 去循环生成
      const scheduleList = []
      this.selectDateArr.forEach((date, index) => {
        scheduleList.push({
          teacherId,
          startTime,
          endTime,
          duration,
          courseDate: date.date.replace(/-/g, ''),
          orderCourseIds: this.selectedOrders.join(','),
          scheduleType: 'time',
          studentId: this.currentScheduleData[index].studentId,
          subjectId,
          attendType: 'YDY_WKQ',
          counselorId: this.studentInfo.counselorId,
          id: this.currentScheduleData[index].id,
          attendanceId: this.currentScheduleData[index].attendId
        })
      })
      return scheduleList
    },

    // 修改提交方法
    async handleSubmit() {
      if (!this.isFormValid) {
        return
      }

      // 单次调课时间校验
      if (this.isSingleSchedule) {
        const now = new Date().getTime()
        const courseDate = this.scheduleForm.courseDate
        const startTime = this.scheduleForm.startTime

        if (courseDate && startTime) {
          const [hours, minutes] = startTime.split(':')
          const courseDateTime = new Date(courseDate)
          courseDateTime.setHours(parseInt(hours))
          courseDateTime.setMinutes(parseInt(minutes))

          // 计算时间差是否小于一小时(毫秒)
          const timeDiff = courseDateTime.getTime() - now
          const oneHour = 60 * 60 * 1000

          if (timeDiff <= oneHour) {
            this.$message.warning('上课时间距当前时间小于一小时，无法调课哦~')
            return
          }
        }
      }

      let toScheduleList = []

      try {
        if (this.isCalendarSchedule) {
          toScheduleList = this.generateScheduleListCalendar()
        } else {
          toScheduleList = this.generateScheduleList()
        }

        // 调用排课确认接口
        const response = await studentManApi.getYdyConflictScheduling(toScheduleList)

        this.showConflictDialog = true
        this.scheduleListData = response
      } catch (error) {
        this.$message.warning(`调课失败，${error}`)
      }
    },

    // 调课成功
    handleScheduleSuccess() {
      this.$emit('submit-success')
      this.handleClose()
    },

    toggleExpand() {
      this.isExpanded = !this.isExpanded
    },

    handleOrderSelect(order) {
      if (order.disabled) {
        return
      }

      const orderIndex = this.selectedOrders.indexOf(order.id)

      if (orderIndex > -1) {
        // 取消选中
        this.selectedOrders.splice(orderIndex, 1)
        // 如果当前选中的科目不在新的订单适用范围内，清空科目选择
        this.checkAndClearSubject()
      } else {
        // 选中订单
        if (this.selectedOrders.length >= 2) {
          this.$message.warning('最多只能选择2个订单')
          return
        }

        // 检查课程类型是否一致
        if (this.selectedOrders.length > 0) {
          const selectedOrder = this.scheduleOrders?.find(o => o.id === this.selectedOrders[0])
          if (selectedOrder.courseKind !== order.courseKind) {
            this.$message.warning('只能选择同一课程类型订单哦~')
            return
          }
        }

        this.selectedOrders.push(order.id)
      }
    },

    checkAndClearSubject() {
      if (!this.scheduleForm.subjectId) return

      const selectedOrders = this.scheduleOrders?.filter(order => this.selectedOrders.includes(order.id))

      // 检查当前选中的科目是否在所有选中订单的适用范围内
      const isSubjectValid = selectedOrders.every(order => order.subjects.includes(this.scheduleForm.subjectId))

      if (!isSubjectValid) {
        this.scheduleForm.subjectId = ''
      }
    },

    handleTimeSlotClick(time) {
      this.scheduleForm.startTime = time.startTime
      this.changeStartTime()
    },

    // 设置待定老师
    setDefaultTeacher(val) {
      this.scheduleForm.teacherName = val === 'YES' ? '快乐老师' : undefined
      this.scheduleForm.teacherId = val === 'YES' ? -1 : undefined
    },

    // 扩展方法
    extendMethod(list) {
      return list.filter(c => c.label !== '快乐老师')
    },

    // 修改上课时间处理方法
    changeStartTime() {
      if (this.scheduleForm.startTime && this.scheduleForm.duration) {
        const [hours, minutes] = this.scheduleForm.startTime.split(':')
        const startMinutes = parseInt(hours) * 60 + parseInt(minutes)
        const endMinutes = startMinutes + this.scheduleForm.duration

        // 检查是否超过第二天
        if (endMinutes >= 24 * 60) {
          this.$message.warning('下课时间不能超过第二天，请重新选择上课时间')
          this.scheduleForm.startTime = ''
          this.scheduleForm.endTime = ''
          return
        }

        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        this.scheduleForm.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      }
    },

    // 监听课次时长变化
    handleDurationChange(val) {
      if (this.scheduleForm.startTime) {
        this.changeStartTime()
      }
    },

    // 获取行类名
    getRowClassName({ row, rowIndex }) {
      return row.status === '可排' ? 'available-row' : 'unavailable-row'
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

  .el-form-item.scheduling-days {
    width: 100%;
    .el-form-item__content {
      margin-left: 0px !important;
    }
  }

  .el-drawer__body {
    overflow-y: auto !important;
  }
}

.periodic-scheduling {
  .drawer-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content-wrapper {
    flex: 1;
    background: #fff;
    border-radius: 4px;
    padding: 20px;
    overflow-y: auto;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
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

  .form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
    width: 100%;

    .el-form-item {
      flex: 1;
      margin-bottom: 0;
    }

    .el-time-picker {
      width: 100%;
    }
  }

  .time-slots {
    margin-bottom: 16px;
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-left: 10px;

    .time-slots-header {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }

    .time-slots-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .time-slot {
        padding: 6px 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        cursor: pointer;
        color: #606266;
        font-size: 13px;
        transition: all 0.3s;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }

        &.active {
          background: #ecf5ff;
          border-color: #409eff;
          color: #409eff;
          font-weight: 500;
        }
      }
    }
  }

  .separator {
    margin: 0 8px;
    color: #606266;
  }

  .unit {
    margin-left: 8px;
    color: #606266;
  }

  .required {
    ::v-deep .el-form-item__label::before {
      content: '*';
      color: #f56c6c;
      margin-right: 4px;
    }
  }

  .schedule-orders {
    margin-bottom: 24px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .el-button {
        padding: 0;
        font-size: 13px;

        i {
          margin-left: 4px;
        }
      }
    }

    .order-list {
      max-height: 50vh;
      overflow-y: auto;
      .order-item {
        position: relative;
        // cursor: pointer;
        transition: all 0.3s;
        border: 1px solid #ebeef5;
        border-radius: 7px;
        background: #fff;
        margin-bottom: 16px;
        // padding: 12px 16px;

        // &:hover:not(.disabled) {
        //   border-color: #c6e2ff;
        //   background-color: #f5f7fa;
        // }

        &.selected {
          border-color: #409eff;
          background-color: #ecf5ff;
          .order-header {
            width: 100%;
            height: 40px;
            line-height: 20px;
            border-radius: 7px 7px 0px 0px;
            background: linear-gradient(88.17deg, rgba(21, 124, 255, 1) 2.02%, rgba(239, 247, 255, 1) 98.92%);
            color: rgba(16, 16, 16, 1);
            font-size: 14px;
            text-align: center;
            font-family: -regular;
            padding: 0px 16px;
            color: #fff;
            .order-no {
              color: #fff;
            }
          }
        }

        &.disabled {
          cursor: not-allowed;
          background-color: #f5f7fa;
          opacity: 0.8;
          // pointer-events: none;
        }

        &.collapsed {
          display: none;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          background-color: rgba(250, 250, 250, 1);
          color: rgba(16, 16, 16, 1);
          width: 100%;
          height: 40px;
          line-height: 20px;
          border-radius: 7px 7px 0px 0px;
          padding: 0px 16px;

          .order-no {
            color: rgba(102, 102, 102, 1);
            font-size: 13px;
          }

          .course-type {
            padding: 2px 8px;
            color: rgba(102, 102, 102, 1);
            border-radius: 2px;
            font-size: 13px;
          }
        }

        .order-content {
          .course-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 8px;
            font-weight: 600;
          }

          .course-info {
            display: flex;
            align-items: center;
            gap: 16px;
            color: #606266;
            font-size: 13px;

            span {
              position: relative;

              &:not(:last-child)::after {
                content: '';
                position: absolute;
                right: -8px;
                top: 50%;
                transform: translateY(-50%);
                width: 1px;
                height: 12px;
                background: #dcdfe6;
              }
            }
          }
        }

        .course-subjects {
          color: #909399;
          font-size: 13px;
          line-height: 1.4;
          margin-top: 16px;
        }

        .disabled-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;

          .disabled-text {
            color: #909399;
            font-size: 13px;
            background: rgba(144, 147, 153, 0.1);
            padding: 4px 8px;
            border-radius: 2px;
          }
        }
      }
    }
  }

  .schedule-handling {
    flex: 1;
    // overflow-y: auto;
    background: #fff;
    border-radius: 4px;
    padding-bottom: 36px;

    .el-form {
      .el-form-item {
        margin-bottom: 0px;

        &:last-child {
          margin-bottom: 0;
        }
      }

      .el-select {
        width: 100%;
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

      .el-input-number {
        width: 120px;
      }

      .el-time-select {
        width: calc(50% - 12px);
      }
    }
  }

  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px;
    background: #fff;
    // border-top: 1px solid #e4e7ed;
    text-align: center;
    z-index: 99;

    .el-button {
      padding: 9px 20px;

      & + .el-button {
        margin-left: 12px;
      }

      &[disabled] {
        cursor: not-allowed;
        background-color: #a0cfff;
        border-color: #a0cfff;
        color: #fff;

        &:hover {
          background-color: #a0cfff;
          border-color: #a0cfff;
          color: #fff;
        }
      }
    }
  }
}

// 覆盖 element-ui 的一些默认样式
::v-deep {
  .el-input-number {
    width: 120px;
  }

  .el-select {
    width: 100%;
  }

  .el-date-picker {
    width: 100%;
  }

  .el-form-item__label {
    font-size: 14px;
    color: #606266;
  }
}

.calendar-schedule-table {
  .table-wrap {
    width: 100%;
    border: 1px solid #ebeef5;
    border-radius: 4px;

    ::v-deep {
      .el-table {
        .el-table__header-wrapper {
          th {
            background-color: #f5f7fa;
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }
  }

  .status-text {
    &.success {
      color: #67c23a;
    }
    &.warning {
      color: #e6a23c;
    }
  }
}

.scheduling-days {
  .date-wrap {
    display: flex;
    margin-bottom: 10px;

    .date-prev {
      margin-left: 10px;
    }
  }

  .calendar-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
  }

  .calendar-warning {
    color: #e6a23c;
    font-size: 12px;
    margin-top: 4px;
  }
}
</style>
