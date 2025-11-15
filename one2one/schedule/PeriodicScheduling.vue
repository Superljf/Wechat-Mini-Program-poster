<template>
  <div>
    <el-drawer
      :title="isCalendarSchedule ? (isCopy ? '复制排课' : '日历排课') : '周期排课'"
      :visible.sync="visible"
      direction="rtl"
      size="620px"
      :before-close="handleClose"
      custom-class="periodic-scheduling"
    >
      <div class="drawer-container">
        <div class="content-wrapper">
          <!-- 排课订单部分 -->
          <div class="schedule-orders" id="schedule-orders">
            <div class="section-header">
              <div class="section-title">排课订单</div>
              <div style="display: flex; align-items: center">
                <div v-if="scheduleOrders && scheduleOrders.length > 1" style="margin-right: 10px;">
                  <el-checkbox v-model="scheduleForm.simulation" @change="handleSimulationChange">合并排课</el-checkbox>
                </div>
                <div v-if="scheduleOrders && scheduleOrders.length > 1" style="margin-right: 10px;color: #666;font-size: 14px;">
                  已选 <span style="color: #1890ff">{{ selectedOrders.length }}</span> 个订单
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
                :key="`${order.id}`"
                :class="[
                  'order-item',
                  {
                    selected: selectedOrders.includes(order.id),
                    disabled: order.orderStatus === 0,
                    collapsed: !isExpanded && !selectedOrders.includes(order.id)
                  }
                ]"
                @click="order.orderStatus === 1 && handleOrderSelect(order)"
              >
                <div class="order-header">
                  <span class="order-no">报班单号: {{ order.orderNo }}</span>
                  <span class="course-type">{{ order.courseKindName }}</span>
                </div>
                <div style="padding: 8px 16px;padding-bottom: 16px;">
                  <div class="order-content">
                    <div class="course-name">{{ order.courseName }}</div>
                    <div class="course-info">
                      <span
                        >可排 <span style="color: #1890ff">{{ order.courseScheduleCount }}</span> 小时</span
                      >
                      <span>可用 {{ order.courseSurplusCount }} 小时</span>
                      <span>报名小时 {{ order.courseTotalCount }} 小时</span>
                      <span>单价 {{ order.discountUnitPrice }} 元/小时</span>
                    </div>
                  </div>
                  <div v-if="order.applyInfo" class="course-subjects">{{ order.applyInfo }}</div>
                  <!-- <div v-if="order.orderStatus === 0" class="disabled-mask">
                    <span class="disabled-text">{{ order.disabledReason || '非本校区' }}</span>
                  </div> -->
                </div>
              </div>
              <div v-if="scheduleOrders && scheduleOrders.length === 0" style="text-align: center;color: #999;font-size: 16px;">暂无订单</div>
            </div>
          </div>

          <!-- 排课处理部分 -->
          <div class="schedule-handling">
            <div class="section-title">排课处理</div>
            <el-form ref="scheduleForm" :model="scheduleForm" :rules="rules" label-width="80px">
              <!-- 科目和教师 -->
              <div class="form-row" style="margin-bottom: -6px;gap:0px">
                <div style="display: flex;">
                  <el-form-item label="科目" prop="subjectId" class="required">
                    <HiDict @change="handleSubjectChange" size="small" v-model="scheduleForm.subjectId" dict-key="subject" :filterItems="filteredSubjectIds" />
                  </el-form-item>
                  <el-tooltip content="已做师生匹配的科目，点击可自动填写匹配信息哦～" placement="top">
                    <i class="el-icon-question" style="color: #999;cursor: pointer;margin-left: 5px;margin-top: 13px;"></i>
                  </el-tooltip>
                </div>

                <el-form-item label="教师" prop="teacherId" class="required">
                  <el-row type="flex">
                    <HiAsyncSelector
                      :key="scheduleForm.subjectId"
                      v-model="scheduleForm.teacherId"
                      dict-key="teacher"
                      :defaultWord="scheduleForm.teacherName"
                      :param="{ buId: userBaseInfo.buId, subjectId: scheduleForm.subjectId, page: 1, size: 100 }"
                      style="margin-right: 8px"
                      :extend-method="extendMethod"
                      placeholder="请输入名称搜索"
                      size="small"
                    >
                      <template v-slot="slotProps">
                        <span>{{ slotProps.label }}</span>
                        <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                      </template>
                    </HiAsyncSelector>
                  </el-row>
                </el-form-item>
              </div>

              <!-- 时间档期 -->
              <div class="time-slots">
                <div class="time-slots-header">时间档期</div>
                <div class="time-slots-list">
                  <div
                    class="time-slot"
                    v-for="time in timeSlots"
                    :key="time.startTime"
                    :class="{ active: scheduleForm.startTime === time.startTime }"
                    @click="handleTimeSlotClick(time)"
                  >
                    {{ time.startTime }}
                  </div>
                </div>
              </div>

              <!-- 上课时间和课次时长 -->

              <div class="form-row" style="margin-bottom:  -6px;">
                <el-form-item label="上课时间" prop="startTime" class="required">
                  <el-time-picker
                    v-model="scheduleForm.startTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    placeholder="请选择"
                    size="small"
                    @change="changeStartTime"
                    style="width: 110PX"
                  />
                  -
                  <el-time-picker
                    v-model="scheduleForm.endTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    size="small"
                    disabled
                    placeholder="请选择"
                    style="width: 110PX"
                  />
                </el-form-item>

                <el-form-item v-if="isCalendarSchedule" label="课次时长" class="required">
                  <el-input-number
                    size="small"
                    v-model="scheduleForm.duration"
                    :min="30"
                    :step="30"
                    :max="300"
                    controls-position="right"
                    @change="handleDurationChange"
                  />
                  <span class="unit">分钟</span>
                </el-form-item>

                <!-- 课次时长 -->
                <div v-if="!isCalendarSchedule" class="form-row" style="margin-bottom: 0px">
                  <el-form-item label="课次时长" class="required">
                    <el-input-number
                      size="small"
                      v-model="scheduleForm.duration"
                      :min="30"
                      :step="30"
                      :max="300"
                      controls-position="right"
                      @change="handleDurationChange"
                    />
                    <span class="unit">分钟</span>
                  </el-form-item>
                </div>
              </div>

              <div class="form-row" style="margin-bottom: -6px;">
                <el-form-item v-if="!isCalendarSchedule" label="课次数量" prop="courseCount" class="required">
                  <el-input-number placeholder="请输入" size="small" v-model="scheduleForm.courseCount" :min="1" :max="50" controls-position="right" />
                </el-form-item>
                <div v-if="!isCalendarSchedule" class="form-row">
                  <el-form-item label="开始日期" prop="courseDate">
                    <el-date-picker style="flex: 1;" v-model="scheduleForm.courseDate" type="date" placeholder="请选择" size="small" />
                  </el-form-item>
                </div>
              </div>

              <div v-if="!isCalendarSchedule" class="form-row">
                <el-form-item label="重复周期" prop="repeatCycle">
                  <el-select v-model="scheduleForm.repeatCycle" placeholder="请选择" size="small" multiple>
                    <el-option v-for="item in weekOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
                  </el-select>
                </el-form-item>
              </div>

              <!-- 上课日期和重复周期 -->
              <div v-if="isCalendarSchedule" class="form-row" style="margin-top: 10px;">
                <el-form-item prop="schedulingDays" class="scheduling-days">
                  <div class="date-wrap">
                    <Calendar :date="defaultDate" @selectDate="selectDate" :selectDateArr="selectDateArr" refs="Calendar" />
                    <SleactDatePreview :customClass="'date-prev'" :dataArr="selectDateArr" @clear="clearSelectDate" @remove-data="removeDate" />
                  </div>
                  <div class="calendar-tip">点击日历选择日期，可多选，右边展示已选的日期，再次点击取消对应日期的选择。</div>
                </el-form-item>
              </div>
            </el-form>
          </div>
        </div>

        <!-- 底部按钮 -->
        <!-- :disabled="!isFormValid" -->
        <div class="drawer-footer">
          <el-button :disabled="!isFormValid" type="primary" @click="handleSubmit">确 定</el-button>
          <el-button @click="handleClose">取 消</el-button>
        </div>
      </div>
    </el-drawer>
    <!-- 冲突列表 -->
    <div>
      <conflict-list :visible.sync="showConflictDialog" :schedule-list="scheduleListData" @success="handleScheduleSuccess" />
    </div>
  </div>
</template>

<script>
import { studentManApi } from '@/services'
import { mapState } from 'vuex'
import dayjs from 'dayjs'
import ConflictList from './ConflictList.vue'
import Calendar from '@/components/calendar'
import SleactDatePreview from '../../coursemgr/arrange-course/components/SelectDatePreview.vue'

export default {
  name: 'PeriodicScheduling',
  components: {
    ConflictList,
    Calendar,
    SleactDatePreview
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentId: {
      type: [String, Number],
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
    // 新增 prop：是否是复制排课
    isCopy: {
      type: Boolean,
      default: false
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
        courseCount: 1,
        repeatCycle: [],
        teacherName: '',
        simulation: false, // 新增合并排课选项，默认不勾选
        schedulingDays: []
      },
      scheduleApplySubject: [],
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
      filteredSubjectIds: [], // 用于过滤科目的ID数组
      selectSubjectArr: [],
      timeSlots: [], // 初始化时间档期
      weekOptions: [
        { label: '周一', value: '1' },
        { label: '周二', value: '2' },
        { label: '周三', value: '3' },
        { label: '周四', value: '4' },
        { label: '周五', value: '5' },
        { label: '周六', value: '6' },
        { label: '周日', value: '7' }
      ],
      defaultDate: dayjs().format('YYYY-MM-DD'),
      selectDateArr: [],
      limitDate: new Date(new Date().toLocaleDateString()).getTime(),
      scheduleListData: {}
    }
  },

  computed: {
    ...mapState('user', ['userBaseInfo']),
    isFormValid() {
      const { subjectId, teacherId, startTime, duration, courseDate, repeatCycle, courseCount } = this.scheduleForm
      // 检查所有必填项是否都有值
      let hasRequiredFields = false
      if (this.isCalendarSchedule) {
        // 日历排课
        hasRequiredFields = subjectId && teacherId && startTime && duration && this.selectDateArr.length > 0
      } else {
        // 周期排课
        hasRequiredFields = subjectId && teacherId && startTime && duration && courseDate && repeatCycle && repeatCycle.length > 0 && courseCount
      }

      // 检查是否选择了订单
      const hasSelectedOrder = this.selectedOrders.length > 0

      return hasRequiredFields && hasSelectedOrder
    },
    // 计算所有选中订单的可用科目ID数组
    availableSubjectIds() {
      if (!this.selectedOrders.length || !this.scheduleOrders.length) return []

      const selectedOrders = this.scheduleOrders.filter(order => this.selectedOrders.includes(order.id)).filter(order => order.subjectStr)

      // 获取每个订单的科目ID数组
      const subjectIdArrays = selectedOrders.map(order => {
        if (!order.subjectStr) return []
        return order.subjectStr.split(',').map(id => id.trim())
      })

      // 如果只有一个订单，直接返回其科目ID数组
      if (subjectIdArrays.length === 1) {
        return subjectIdArrays[0]
      }

      // 如果有多个订单，找出所有订单共同的科目ID（交集）
      if (subjectIdArrays.length > 1) {
        return subjectIdArrays.reduce((intersection, ids) => {
          return intersection.filter(id => ids.includes(id))
        }, subjectIdArrays[0])
      }

      return []
    }
  },

  created() {
    if (this.studentId) {
      this.fetchScheduleOrders()
      this.getYdyScheduleApplySubject()
    }
    this.fetchTimeSlots() // 组件创建时获取时间档期
  },

  watch: {
    visible(newVal) {
      if (!newVal) {
        // 关闭抽屉时重置所有数据
        this.resetForm()
      } else {
        this.fetchScheduleOrders()
        this.getYdyScheduleApplySubject()
      }
      if (newVal && this.calendarScheduleData?.date) {
        this.scheduleForm.courseDate = this.calendarScheduleData.date
        this.selectDateArr.push({
          date: this.calendarScheduleData.date,
          dateValue: dayjs(this.calendarScheduleData.date).valueOf(),
          weekName: '周' + this.weekEnumMap[dayjs(this.calendarScheduleData.date).day()]
        })
      }
      if (newVal && this.calendarScheduleData?.time) {
        const timeMatch = this.calendarScheduleData.time.match(/(\d{2}:\d{2})/)
        if (timeMatch) {
          this.scheduleForm.startTime = timeMatch[1]
          this.scheduleForm.subjectId = this.calendarScheduleData.subjectId
          this.scheduleForm.teacherId = this.calendarScheduleData.teacherId
          this.scheduleForm.duration = this.calendarScheduleData.duration
          this.scheduleForm.teacherName = this.calendarScheduleData.teacherName
          this.changeStartTime()
        }
      }
    },
    // 监听科目变化，检查科目是否在订单适用范围内
    'scheduleForm.subjectId': function(newVal) {
      if (newVal && this.selectedOrders.length > 0) {
        this.checkSubjectValidForOrders(newVal)
      }
    },
    // 监听选中订单变化，更新可用科目列表
    selectedOrders: {
      handler(newVal) {
        // 从所有选中订单中提取不可用的科目ID
        if (newVal && newVal.length > 0) {
          const allSubjectIds = [] // 所有科目ID数组
          const dictionary = {} // 用于存储所有科目字典

          // 从store或其他地方获取所有科目字典
          this.$store.dispatch('dictNew/getDictByKey', { dictKey: 'subject' }).then(() => {
            const allSubjects = this.$store.state.dictNew.dictMap['subject']?.items || []

            // 构建所有科目ID数组和字典
            allSubjects.forEach(subject => {
              allSubjectIds.push(subject.value)
              dictionary[subject.value] = subject
            })

            // 获取可用科目ID
            const availableIds = this.availableSubjectIds

            // 如果没有订单或订单没有指定科目，则不过滤
            if (availableIds.length === 0) {
              this.filteredSubjectIds = []
              return
            }

            // 过滤出不可用的科目ID
            this.filteredSubjectIds = allSubjectIds.filter(id => !availableIds.includes(id.toString()))
          })
        } else {
          this.filteredSubjectIds = [] // 重置为空数组
        }
      },
      immediate: true
    }
  },

  methods: {
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

    // 师生匹配
    async getYdyScheduleApplySubject() {
      const response = await studentManApi.getYdyScheduleApplySubject({ studentId: this.studentId, branchId: this.userBaseInfo.branchId })
      this.scheduleApplySubject = response
    },

    handleSubjectChange(val) {
      this.scheduleApplySubjectList = this.scheduleApplySubject.filter(item => item.subjectId === val)
      if (this.scheduleApplySubjectList.length > 0) {
        this.scheduleForm.teacherId = Number(this.scheduleApplySubjectList[0].teacherId)
        this.scheduleForm.startTime = this.scheduleApplySubjectList[0].startTime
        this.scheduleForm.endTime = this.scheduleApplySubjectList[0].endTime
        this.scheduleForm.teacherName = this.scheduleApplySubjectList[0]?.teacherName
      } else {
        this.scheduleForm.teacherId = ''
        this.scheduleForm.startTime = ''
        this.scheduleForm.endTime = ''
        this.scheduleForm.teacherName = ''
      }
    },

    // 获取排课订单
    async fetchScheduleOrders() {
      try {
        const response = await studentManApi.getYdyOrder({ studentId: this.studentId })
        this.scheduleOrders = response
        // 默认选中第一个可用订单
        const firstValidOrder = this.scheduleOrders?.find(order => order.orderStatus === 1)
        if (firstValidOrder) {
          this.selectedOrders = [firstValidOrder.id]
        }
      } catch (error) {
        console.error('获取排课订单失败:', error)
        this.$message.error('获取排课订单失败')
      }
    },

    // 关闭抽屉
    handleClose() {
      this.$emit('update:visible', false)
      this.$emit('update:isCalendarSchedule', false)
      this.$emit('update:calendarScheduleData', {})
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
        courseCount: 1,
        repeatCycle: [],
        teacherName: '',
        simulation: false,
        schedulingDays: []
      }
      this.selectDateArr = []
    },

    // 选择日期
    selectDate(date) {
      if (date.disabled) return
      const findIndex = this.selectDateArr.findIndex(i => i.date === date.date)
      if (findIndex !== -1) {
        this.selectDateArr.splice(findIndex, 1)
      } else {
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

      if (!courseDate || !repeatCycle || !courseCount) {
        return []
      }

      const scheduleList = []
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
            teacherId,
            startTime,
            endTime,
            duration: `${duration / 60}小时`,
            courseDate: currentDate.format('YYYY-MM-DD').replace(/-/g, ''),
            courseScheduleCount: courseCount,
            attendClassPeriod: weekDays.join(','),
            orderCourseIds: this.selectedOrders.join(','),
            scheduleType: 'period',
            studentId: this.studentId,
            subjectId,
            attendType: 'YDY_WKQ',
            counselorId: this.studentInfo.counselorId
          })

          count++ // 只有添加了课程才增加计数

          // 修改：即使在当前周期找到上课日也继续查找下一个日期
          // 不应该立即跳出循环
        }

        // 修改：总是寻找下一个上课日期，不管当前是否已添加课程
        // 找到下一个上课日期
        let found = false

        // 如果当前是周日且周日在上课周期中，需要特殊处理下一周的查找逻辑
        if (currentWeekDay === 7) {
          // 直接查找下周的第一个上课日
          const firstDayNextWeek = weekDays[0]
          const daysToAdd = firstDayNextWeek === 7 ? 7 : firstDayNextWeek
          currentDate = currentDate.add(daysToAdd, 'day')
          found = true
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
        }

        // 如果本周没有更多上课日，则跳到下周第一个上课日
        if (!found) {
          const firstDayNextWeek = weekDays[0] // 使用数组的第一个元素作为下周第一个上课日
          // 计算到下周第一个上课日需要的天数
          const daysToWeekEnd = 7 - currentWeekDay // 到本周日的天数
          const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
          const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass

          currentDate = currentDate.add(daysToAdd, 'day')
        }
      }

      return scheduleList
    },
    // 修改生成排课列表方法
    generateScheduleListCalendar() {
      const { subjectId, teacherId, startTime, endTime, duration } = this.scheduleForm
      //根据 selectDateArr 去循环生成
      const scheduleList = []
      this.selectDateArr.forEach(date => {
        scheduleList.push({
          teacherId,
          startTime,
          endTime,
          duration,
          courseDate: date.date.replace(/-/g, ''),
          orderCourseIds: this.selectedOrders.join(','),
          scheduleType: 'time',
          studentId: this.studentId,
          subjectId,
          attendType: 'YDY_WKQ',
          counselorId: this.studentInfo.counselorId
        })
      })
      return scheduleList
    },

    // 修改提交方法
    async handleSubmit() {
      if (!this.isFormValid) {
        return
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
        console.error('排课失败:', error)
        this.$message.warning(`排课失败，${error}`)
      }
    },

    // 排课成功
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
        if (!this.scheduleForm.simulation) {
          // 非合并排课模式下只能选择1个订单，切换选择
          this.selectedOrders = [order.id]
        } else if (this.scheduleForm.simulation && this.selectedOrders.length >= 2) {
          // 合并排课模式下最多选择2个订单
          this.$message.warning('最多只能选择2个订单')
          return
        } else {
          // 合并排课模式下，添加到选中订单列表
          // 检查课程类型是否一致
          if (this.selectedOrders.length > 0) {
            const selectedOrder = this.scheduleOrders.find(o => o.id === this.selectedOrders[0])
            if (selectedOrder.courseKind !== order.courseKind) {
              this.$message.warning('只能选择同一课程类型订单哦~')
              return
            }
          }

          this.selectedOrders.push(order.id)
        }

        // 当选择新订单时，检查已选科目是否适用
        if (this.scheduleForm.subjectId) {
          this.checkAndClearSubject()
        }
      }
    },

    // 监听合并排课状态变化
    handleSimulationChange(val) {
      if (!val && this.selectedOrders.length > 1) {
        // 如果从合并排课切换到单选排课，且已选择多个订单，则只保留第一个订单
        this.selectedOrders = [this.selectedOrders[0]]
        this.$message.warning('已切换为单选排课模式，仅保留第一个选中的订单')
      }
    },

    // 检查当前选中的科目是否在所有选中订单的适用范围内，如果不在则清空已选科目
    checkAndClearSubject() {
      if (!this.scheduleForm.subjectId) return

      const selectedOrders = this.scheduleOrders.filter(order => this.selectedOrders.includes(order.id))

      // 验证科目是否在订单适用范围内
      const isSubjectValid = this.isSubjectValidForOrders(this.scheduleForm.subjectId, selectedOrders)

      if (!isSubjectValid) {
        this.$message.warning('已选科目不适用于当前订单，已清空科目选择')
        this.scheduleForm.subjectId = ''
      }
    },

    // 检查科目是否适用于所有选中的订单
    isSubjectValidForOrders(subjectId, orders) {
      if (!orders || orders.length === 0) return true

      return orders.every(order => {
        // 检查订单的适用科目字段
        if (!order.subjectStr) return true

        // 解析科目ID数组
        const subjectIds = order.subjectStr.split(',').map(id => id.trim())
        return subjectIds.includes(subjectId.toString())
      })
    },

    // 检查所选科目是否在订单适用范围内
    checkSubjectValidForOrders(subjectId) {
      if (!subjectId || this.selectedOrders.length === 0) return

      const selectedOrders = this.scheduleOrders.filter(order => this.selectedOrders.includes(order.id))
      const isValid = this.isSubjectValidForOrders(subjectId, selectedOrders)

      if (!isValid) {
        this.$message.warning('该订单不适用此科目')
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

    async fetchTimeSlots() {
      try {
        const response = await studentManApi.getYdyTpScheduleTime()
        this.timeSlots = response
      } catch (error) {
        console.error('获取时间档期失败:', error)
        this.$message.error('获取时间档期失败')
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
    display: flex;
    flex-direction: column;
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
    margin-bottom: 10px;
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-left: 13px;

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
      overflow-y: auto;
      flex: 1;

      .el-button {
        padding: 0;
        font-size: 13px;

        i {
          margin-left: 4px;
        }
      }
    }

    .order-list {
      .order-item {
        position: relative;
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid #ebeef5;
        border-radius: 7px;
        background: #fff;
        margin-bottom: 16px;
        // padding: 12px 16px;

        &:hover:not(.disabled) {
          border-color: #c6e2ff;
          background-color: #f5f7fa;
        }

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
        margin-bottom: 18px;

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

  .el-form-item__content {
    white-space: nowrap;
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
}
</style>
