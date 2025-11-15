<template>
  <el-dialog
    custom-class="periodic-schedule-dialog"
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    :show-close="canCloseDialog"
    :before-close="handleBeforeClose"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="form" label-width="100px" size="small">
      <!-- 上课教材 - 仅周期排课显示且有适用教材时才显示 -->
      <el-form-item v-if="!isAdjustMode && joyEnglishTextbookList && joyEnglishTextbookList.length > 0" label="上课教材" prop="materials">
        <el-select v-model="form.materials" placeholder="请选择上课教材" multiple style="width: 60%">
          <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id">
            {{ item.textbookName }}
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 排课小时数 - 仅周期排课显示 -->
      <el-form-item v-if="!isAdjustMode" label="排课小时数" prop="scheduleHours">
        <el-input-number v-model="form.scheduleHours" :min="1" :max="999" placeholder="请输入排课小时数" style="width: 200px" />
        <span class="unit-text">小时</span>
      </el-form-item>

      <!-- 选择日期 -->
      <el-form-item label="选择日期" prop="startDate">
        <el-date-picker
          v-model="form.startDate"
          type="date"
          placeholder="请选择"
          value-format="yyyy-MM-dd"
          style="width: 200px"
          :picker-options="isAdjustMode ? datePickerOptions : null"
          :disabled="!isAdjustMode && hasSchedulePeriod"
        />
        <span class="date-tip">{{ isAdjustMode ? '及以后，按新周期排课' : '及以后，按周期排课' }}</span>
      </el-form-item>
    </el-form>

    <!-- 上课周期列表 -->
    <div class="schedule-section">
      <!-- 表格表头 -->
      <div class="schedule-table">
        <div class="table-header">
          <div class="header-cell weekday-cell">上课周期</div>
          <div class="header-cell duration-cell">上课时长</div>
          <div class="header-cell time-cell">上课时间</div>
          <div class="header-cell action-cell">操作</div>
        </div>

        <!-- 表格内容 -->
        <div class="table-body">
          <div v-for="(item, index) in form.scheduleList" :key="index" class="table-row">
            <div class="body-cell weekday-cell">
              <el-select v-model="item.weekdays" placeholder="请选择上课周期" multiple style="width: 100%" size="small">
                <el-option label="周一" value="monday"></el-option>
                <el-option label="周二" value="tuesday"></el-option>
                <el-option label="周三" value="wednesday"></el-option>
                <el-option label="周四" value="thursday"></el-option>
                <el-option label="周五" value="friday"></el-option>
                <el-option label="周六" value="saturday"></el-option>
                <el-option label="周日" value="sunday"></el-option>
              </el-select>
            </div>

            <div class="body-cell duration-cell">
              <el-input-number
                v-model="item.duration"
                :min="minClassDuration || 30"
                :max="480"
                :step="minClassDuration || 30"
                placeholder="分钟"
                size="small"
                style="width: 120px"
                @change="handleDurationChange(item, index)"
              />
              <span class="duration-unit">分钟</span>
            </div>

            <div class="body-cell time-cell">
              <el-time-picker
                v-model="item.startTime"
                value-format="HH:mm"
                format="HH:mm"
                size="small"
                @focus="handleStartTimeFocus(item, index)"
                @change="handleStartTimeChange(item, index)"
                :picker-options="{
                  selectableRange: '00:00:00 - 23:59:59',
                  format: 'HH:mm'
                }"
                style="width: 110px"
              />
              <span class="time-separator">-</span>
              <el-time-picker v-model="item.endTime" value-format="HH:mm" format="HH:mm" size="small" disabled style="width: 110px" />
            </div>

            <div class="body-cell action-cell">
              <el-button icon="el-icon-plus" size="mini" @click="handleAddSchedule" title="添加" circle></el-button>
              <el-button
                icon="el-icon-delete"
                size="mini"
                :disabled="form.scheduleList.length <= 1"
                @click="handleRemoveSchedule(index)"
                title="移除"
                circle
              ></el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 最小课次时长显示 -->
      <div v-if="minClassDuration > 0" style="margin-top: 10px;">
        <span class="info-label">最小课次时长：</span>
        <span style="color: #4f8bed;">{{ minClassDuration }} </span>min
      </div>
    </div>

    <div slot="footer" class="dialog-foot">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" :disabled="!isFormValid" size="small">
        {{ isAdjustMode ? '确定调整' : '确定添加' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'
import dayjs from 'dayjs'

export default {
  name: 'PeriodicScheduleDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 是否为调整上课周期模式
    isAdjustMode: {
      type: Boolean,
      default: false
    },
    // 当前班级数据（用于回显当前上课周期）
    classData: {
      type: Object,
      default: () => ({})
    },
    // 班级ID
    classId: {
      type: [String, Number],
      default: ''
    },
    // 佳音教材列表
    joyEnglishTextbookList: {
      type: Array,
      default: () => []
    },
    // 是否已有上课周期（用于判断标题显示）
    hasSchedulePeriod: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    dialogTitle() {
      if (this.isAdjustMode) {
        return '调整上课周期'
      }
      // 根据是否已有上课周期显示不同标题
      return this.hasSchedulePeriod ? '周期排课' : '设置上课周期和排课次数'
    },
    isFormValid() {
      // 调整模式下不需要验证教材和排课小时数
      if (this.isAdjustMode) {
        return this.form.startDate && this.form.scheduleList.every(item => item.weekdays.length > 0 && item.duration > 0 && item.startTime && item.endTime)
      }

      // 周期排课模式需要验证字段
      const hasValidSchedule =
        this.form.startDate && this.form.scheduleList.every(item => item.weekdays.length > 0 && item.duration > 0 && item.startTime && item.endTime)

      // 如果有适用教材，需要选择教材和排课小时数
      if (this.joyEnglishTextbookList && this.joyEnglishTextbookList.length > 0) {
        return this.form.materials.length > 0 && this.form.scheduleHours > 0 && hasValidSchedule
      }

      // 如果没有适用教材，需要验证排课周期和排课小时数
      return this.form.scheduleHours > 0 && hasValidSchedule
    },
    // 判断是否允许关闭弹窗
    canCloseDialog() {
      // 所有情况都允许关闭
      return true
    },
    // 最小课次时长（去除小数，保留整数）
    minClassDuration() {
      const hourLen = this.classData?.hourLen
      if (!hourLen || hourLen <= 0) {
        return 0
      }
      // hourLen 本身就是分钟数，去除小数保留整数
      return Math.floor(hourLen)
    }
  },
  data() {
    return {
      loading: false,
      form: {
        materials: [],
        scheduleHours: null,
        startDate: '',
        scheduleList: [
          {
            weekdays: [],
            duration: this.minClassDuration || 30,
            startTime: null,
            endTime: null
          }
        ]
      },
      rules: {
        materials: [{ required: true, message: '请选择上课教材', trigger: 'change' }],
        scheduleHours: [{ required: true, message: '请输入排课小时数', trigger: 'blur' }],
        startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }]
      },
      scheduleRules: {
        weekdays: [{ required: true, message: '请选择上课周期', trigger: 'change' }],
        duration: [{ required: true, message: '请输入上课时长', trigger: 'change' }],
        startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }]
      },
      datePickerOptions: {
        disabledDate: time => {
          // 限制只能选择当前日期之后的日期（不包括当天）

          return time.getTime() <= Date.now() - 24 * 60 * 60 * 1000
        }
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    },
    'form.materials'(newVal) {
      // 根据选择的教材自动计算建议授课小时数（仅周期排课模式）
      if (!this.isAdjustMode && newVal && newVal.length > 0) {
        this.calculateScheduleHours()
      }
    }
  },
  methods: {
    initForm() {
      const today = new Date()

      if (this.isAdjustMode) {
        // 调整模式：回显当前班级的上课周期数据
        this.form = {
          materials: [], // 调整模式不需要
          scheduleHours: 0, // 调整模式不需要
          startDate: dayjs().format('YYYY-MM-DD'),
          scheduleList: this.getCurrentScheduleList()
        }
      } else {
        //  无排课周期，不论是否有结课日期，弹出设置上课周期和排课次数弹窗，日期默认当天
        // 有排课周期、有结课日期，周期排课弹窗，日期默认为结课日期+1
        // 有排课周期、无结课日期，周期排课弹窗，日期默认当天
        const endDate = this.classData?.endDate
          ? dayjs(this.classData.endDate)
              .add(1, 'day')
              .format('YYYY-MM-DD')
          : dayjs().format('YYYY-MM-DD')
        const lastEndDate = this.hasSchedulePeriod ? endDate : dayjs().format('YYYY-MM-DD')
        this.form = {
          materials: [],
          scheduleHours: null,
          // 只有周期排课才可以
          startDate: lastEndDate,
          scheduleList: this.getCurrentScheduleList()
        }
      }
    },

    // 获取当前班级的上课周期列表（用于调整模式回显）
    getCurrentScheduleList() {
      // 从classData.coursePeriodDtoList解析上课周期数据
      const coursePeriodDtoList = this.classData.coursePeriodDtoList || []

      if (coursePeriodDtoList.length === 0) {
        // 如果没有数据，返回默认空周期
        return [
          {
            weekdays: [],
            duration: this.minClassDuration || 30,
            startTime: null,
            endTime: null
          }
        ]
      }

      // 将coursePeriodDtoList转换为表单格式
      return coursePeriodDtoList.map(period => {
        // 解析weekNum数组，转换为weekday字符串
        const weekdays = (period.weekNum || []).map(num => this.getWeekDayString(num))

        // 解析courseTime，格式如 "09:00-10:30"
        let startTime = null
        let endTime = null
        let duration = this.minClassDuration || 30

        if (period.courseTime) {
          const times = period.courseTime.split('-')
          if (times.length === 2) {
            startTime = times[0].trim()
            endTime = times[1].trim()
            // 计算时长
            const startMinutes = this.timeToMinutes(startTime)
            const endMinutes = this.timeToMinutes(endTime)
            duration = endMinutes - startMinutes
          }
        }

        return {
          weekdays: weekdays,
          duration: duration,
          startTime: startTime,
          endTime: endTime
        }
      })
    },

    // 根据选择的教材计算建议授课小时数
    calculateScheduleHours() {
      if (!this.form.materials || this.form.materials.length === 0) {
        this.form.scheduleHours = 0
        return
      }

      // 按sort参数排序后计算总小时数
      const selectedTextbooks = this.joyEnglishTextbookList.filter(item => this.form.materials.includes(item.id)).sort((a, b) => (a.sort || 0) - (b.sort || 0))

      let totalHours = 0
      selectedTextbooks.forEach(textbook => {
        if (textbook && textbook.expectTime) {
          totalHours += textbook.expectTime
        }
      })

      this.form.scheduleHours = totalHours
    },

    // 转换星期几的映射
    getWeekDayNumber(weekdayStr) {
      const weekMap = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7
      }
      return weekMap[weekdayStr] || 1
    },

    // 将数字转换为星期几字符串
    getWeekDayString(weekNum) {
      const weekMap = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
        7: 'sunday'
      }
      return weekMap[weekNum] || 'monday'
    },

    // 计算每周上课总时长（分钟）
    calculateWeeklyMinutes() {
      let totalMinutes = 0

      this.form.scheduleList.forEach(item => {
        if (item.duration && item.weekdays && item.weekdays.length > 0) {
          // 每个时间段的时长 × 一周内的天数
          totalMinutes += item.duration * item.weekdays.length
        }
      })

      return totalMinutes
    },

    // 计算每周课次数
    getWeeklyClassCount() {
      let totalClasses = 0

      this.form.scheduleList.forEach(item => {
        if (item.weekdays && item.weekdays.length > 0) {
          // 每个时间段的课次数 = 选择的天数
          totalClasses += item.weekdays.length
        }
      })

      return totalClasses
    },

    // 时间字符串转分钟数
    timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      return hours * 60 + minutes
    },

    // 分钟数转时间字符串
    minutesToTime(minutes) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    },

    // 生成排课数据
    generateScheduleData() {
      //  新算法逻辑：
      // 计算每周课次数：周一1次 + 周二1次 = 2课次/周
      // 计算每课次平均时长：3h/周 ÷ 2课次/周 = 1.5h/课次
      // 计算总课次数：10h ÷ 1.5h/课次 = 6.67课次，向上取整 = 7课次 ✅
      // 按时间顺序生成7课次
      if (!this.form.scheduleList || this.form.scheduleList.length === 0) {
        this.$message.warning('请设置上课周期')
        return null
      }

      // 计算每周上课总时长（小时）
      const weeklyMinutes = this.calculateWeeklyMinutes()
      const weeklyHours = weeklyMinutes / 60

      if (weeklyHours <= 0) {
        this.$message.warning('请设置正确的上课时间')
        return null
      }

      // 检查是否有适用教材
      const hasApplicableTextbooks = this.joyEnglishTextbookList && this.joyEnglishTextbookList.length > 0

      let totalWeeks = 4 // 默认4周
      let textbooks = []

      if (hasApplicableTextbooks) {
        // 有适用教材时的处理逻辑
        if (!this.form.materials || this.form.materials.length === 0) {
          this.$message.warning('请选择上课教材')
          return null
        }

        if (!this.form.scheduleHours || this.form.scheduleHours <= 0) {
          this.$message.warning('排课小时数必须大于0')
          return null
        }

        // 准备教材数据 - 按sort参数重新排序
        const selectedTextbooks = this.joyEnglishTextbookList
          .filter(item => this.form.materials.includes(item.id))
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))

        textbooks = selectedTextbooks.map(textbook => ({
          id: textbook.id,
          textbookName: textbook.textbookName,
          expectTime: textbook.expectTime || 0
        }))

        // 计算每个课次的平均时长
        const avgHoursPerClass = weeklyHours / this.getWeeklyClassCount()

        // 根据用户输入的排课小时数计算总课次数
        const totalClasses = Math.ceil(this.form.scheduleHours / avgHoursPerClass)

        // 按教材顺序分配课次数（基于用户选择的排课小时数）
        const textbookClassInfo = []
        let remainingClasses = totalClasses

        // 调试信息
        console.log('=== 排课算法调试信息 ===')
        console.log('每周上课时长:', weeklyHours, '小时')
        console.log('每周课次数:', this.getWeeklyClassCount())
        console.log('每课次平均时长:', avgHoursPerClass, '小时')
        console.log('总排课小时数:', this.form.scheduleHours, '小时')
        console.log('总课次数:', totalClasses, '课次')
        console.log(
          '选择的教材:',
          selectedTextbooks.map(t => `${t.textbookName}(${t.expectTime}h)`)
        )

        selectedTextbooks.forEach((textbook, index) => {
          const textbookHours = textbook.expectTime || 0
          let classesForTextbook = 0

          if (index === selectedTextbooks.length - 1) {
            // 最后一本教材：分配所有剩余课次
            classesForTextbook = remainingClasses
            console.log(`${textbook.textbookName}(最后一本): 分配剩余课次 ${classesForTextbook}`)
          } else {
            // 非最后一本教材：按教材预期小时数分配课次，但不超过剩余课次数
            const expectedClasses = Math.ceil(textbookHours / avgHoursPerClass)
            classesForTextbook = Math.min(expectedClasses, remainingClasses)
            console.log(`${textbook.textbookName}: 预期课次 ${expectedClasses}, 实际分配 ${classesForTextbook}`)
          }

          if (classesForTextbook > 0) {
            textbookClassInfo.push({
              textbook: textbook,
              hours: textbookHours,
              classes: classesForTextbook
            })
            remainingClasses -= classesForTextbook
          }
        })

        console.log(
          '最终分配结果:',
          textbookClassInfo.map(info => `${info.textbook.textbookName}: ${info.classes}课次`)
        )
        console.log('========================')

        // 将总课次数传递给生成方法，而不是周数
        const yddAddSchedulingListBoList = this.generateScheduleListByClasses(totalClasses)

        // 分配教材到课次（使用新的分配逻辑）
        this.assignTextbooksToScheduleByClasses(yddAddSchedulingListBoList, textbookClassInfo)

        return {
          courseId: parseInt(this.classData.id),
          textbooks: textbooks,
          yddAddSchedulingListBoList: yddAddSchedulingListBoList
        }
      }

      // 没有适用教材时，根据排课小时数计算课次数
      if (!this.form.scheduleHours || this.form.scheduleHours <= 0) {
        this.$message.warning('排课小时数必须大于0')
        return null
      }

      // 计算每个课次的平均时长
      const avgHoursPerClass = weeklyHours / this.getWeeklyClassCount()
      // 计算总课次数 = 总排课小时数 / 每课次平均小时数，有余数则多排一节
      const totalClasses = Math.ceil(this.form.scheduleHours / avgHoursPerClass)

      // 使用按课次数生成的方法
      const yddAddSchedulingListBoList = this.generateScheduleListByClasses(totalClasses)

      return {
        courseId: parseInt(this.classData.id),
        textbooks: textbooks,
        yddAddSchedulingListBoList: yddAddSchedulingListBoList
      }
    },

    // 按课次数生成排课列表（借鉴一对一排课逻辑）
    generateScheduleListByClasses(totalClasses) {
      const scheduleList = []
      let currentDate = dayjs(this.form.startDate)

      // 收集所有上课时间段和对应的星期几
      const timeSlots = []
      this.form.scheduleList.forEach(item => {
        if (item.weekdays && item.weekdays.length > 0 && item.startTime && item.endTime) {
          item.weekdays.forEach(weekday => {
            timeSlots.push({
              weekday: this.getWeekDayNumber(weekday),
              startTime: item.startTime,
              endTime: item.endTime
            })
          })
        }
      })

      if (timeSlots.length === 0) {
        return scheduleList
      }

      // 将上课星期几转换为数组并排序
      const weekDays = [...new Set(timeSlots.map(slot => slot.weekday))].sort((a, b) => a - b)
      let count = 0

      // 首先检查初始日期是否是上课日
      const initialWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()

      // 如果初始日期不在重复周期内，先找到最近的一个上课日
      if (!weekDays.includes(initialWeekDay)) {
        // 找本周更后面的日期
        let found = false
        for (const day of weekDays) {
          if (day > initialWeekDay) {
            const daysToAdd = day - initialWeekDay
            currentDate = currentDate.add(daysToAdd, 'day')
            found = true
            break
          }
        }

        // 如果本周没有更多上课日，则跳到下周第一个上课日
        if (!found) {
          const firstDayNextWeek = weekDays[0]
          const daysToWeekEnd = 7 - initialWeekDay
          const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
          const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass
          currentDate = currentDate.add(daysToAdd, 'day')
        }
      }

      while (count < totalClasses) {
        // 获取当前日期的星期几（1-7，其中7表示周日）
        const currentWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()

        // 检查当前日期是否在重复周期内
        if (weekDays.includes(currentWeekDay)) {
          // 找到匹配的时间段
          const matchingSlots = timeSlots.filter(slot => slot.weekday === currentWeekDay)

          matchingSlots.forEach(slot => {
            if (count < totalClasses) {
              scheduleList.push({
                counselorId: this.classData.counselorId || '',
                courseDate: currentDate.format('YYYY-MM-DD'),
                courseManagerId: this.classData.courseManagerId || '',
                enCounselorId: this.classData.enCounselorId || '',
                endTime: slot.endTime,
                startTime: slot.startTime,
                teacherId: this.classData.teacherId || '',
                textbook: null, // 稍后分配
                textbookName: '' // 稍后分配
              })
              count++
            }
          })
        }

        // 寻找下一个上课日期
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
              const daysToAdd = day - currentWeekDay
              currentDate = currentDate.add(daysToAdd, 'day')
              found = true
              break
            }
          }
        }

        // 如果本周没有更多上课日，则跳到下周第一个上课日
        if (!found) {
          const firstDayNextWeek = weekDays[0]
          const daysToWeekEnd = 7 - currentWeekDay
          const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
          const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass
          currentDate = currentDate.add(daysToAdd, 'day')
        }
      }

      return scheduleList
    },

    // 生成排课列表（借鉴一对一排课逻辑，用于按周数排课）
    generateScheduleList(totalWeeks) {
      const scheduleList = []
      let currentDate = dayjs(this.form.startDate)

      // 收集所有上课时间段和对应的星期几
      const timeSlots = []
      this.form.scheduleList.forEach(item => {
        if (item.weekdays && item.weekdays.length > 0 && item.startTime && item.endTime) {
          item.weekdays.forEach(weekday => {
            timeSlots.push({
              weekday: this.getWeekDayNumber(weekday),
              startTime: item.startTime,
              endTime: item.endTime
            })
          })
        }
      })

      if (timeSlots.length === 0) {
        return scheduleList
      }

      // 将上课星期几转换为数组并排序
      const weekDays = [...new Set(timeSlots.map(slot => slot.weekday))].sort((a, b) => a - b)

      // 计算总课次数
      const totalClasses = totalWeeks * timeSlots.length
      let count = 0

      // 首先检查初始日期是否是上课日
      const initialWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()

      // 如果初始日期不在重复周期内，先找到最近的一个上课日
      if (!weekDays.includes(initialWeekDay)) {
        // 找本周更后面的日期
        let found = false
        for (const day of weekDays) {
          if (day > initialWeekDay) {
            const daysToAdd = day - initialWeekDay
            currentDate = currentDate.add(daysToAdd, 'day')
            found = true
            break
          }
        }

        // 如果本周没有更多上课日，则跳到下周第一个上课日
        if (!found) {
          const firstDayNextWeek = weekDays[0]
          const daysToWeekEnd = 7 - initialWeekDay
          const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
          const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass
          currentDate = currentDate.add(daysToAdd, 'day')
        }
      }

      while (count < totalClasses) {
        // 获取当前日期的星期几（1-7，其中7表示周日）
        const currentWeekDay = currentDate.day() === 0 ? 7 : currentDate.day()

        // 检查当前日期是否在重复周期内
        if (weekDays.includes(currentWeekDay)) {
          // 找到匹配的时间段
          const matchingSlots = timeSlots.filter(slot => slot.weekday === currentWeekDay)

          matchingSlots.forEach(slot => {
            if (count < totalClasses) {
              scheduleList.push({
                counselorId: this.classData.counselorId || '',
                courseDate: currentDate.format('YYYY-MM-DD'),
                courseManagerId: this.classData.courseManagerId || '',
                enCounselorId: this.classData.enCounselorId || '',
                endTime: slot.endTime,
                startTime: slot.startTime,
                teacherId: this.classData.teacherId || '',
                textbook: null, // 稍后分配
                textbookName: '' // 稍后分配
              })
              count++
            }
          })
        }

        // 寻找下一个上课日期
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
              const daysToAdd = day - currentWeekDay
              currentDate = currentDate.add(daysToAdd, 'day')
              found = true
              break
            }
          }
        }

        // 如果本周没有更多上课日，则跳到下周第一个上课日
        if (!found) {
          const firstDayNextWeek = weekDays[0]
          const daysToWeekEnd = 7 - currentWeekDay
          const daysFromWeekStartToFirstClass = firstDayNextWeek === 7 ? 0 : firstDayNextWeek
          const daysToAdd = daysToWeekEnd + daysFromWeekStartToFirstClass
          currentDate = currentDate.add(daysToAdd, 'day')
        }
      }

      return scheduleList
    },

    // 找到指定周数和星期几对应的日期
    findDateForWeekday(startDate, targetWeekday, weekOffset) {
      // 找到开始日期所在周的目标星期几
      const startWeekday = startDate.day() === 0 ? 7 : startDate.day()
      let daysToAdd = targetWeekday - startWeekday

      if (daysToAdd < 0) {
        daysToAdd += 7 // 如果目标星期几已过，则跳到下周
      }

      // 加上周偏移
      daysToAdd += weekOffset * 7

      return startDate.add(daysToAdd, 'day')
    },

    // 分配教材到课次
    assignTextbooksToSchedule(scheduleList, textbooks) {
      if (textbooks.length === 0 || scheduleList.length === 0) return

      let currentTextbookIndex = 0
      let currentTextbookHours = 0
      const totalScheduleHours = this.form.scheduleHours

      // 计算每个课次的时长（小时）
      scheduleList.forEach((schedule, index) => {
        const startMinutes = this.timeToMinutes(schedule.startTime)
        const endMinutes = this.timeToMinutes(schedule.endTime)
        const scheduleHours = (endMinutes - startMinutes) / 60

        // 累加当前教材已用时长
        currentTextbookHours += scheduleHours

        // 获取当前教材
        const currentTextbook = textbooks[currentTextbookIndex]

        // 分配教材
        schedule.textbook = currentTextbook.id
        schedule.textbookName = currentTextbook.textbookName

        // 检查是否需要切换到下一个教材
        if (currentTextbookIndex < textbooks.length - 1 && currentTextbookHours >= currentTextbook.expectTime) {
          currentTextbookIndex++
          currentTextbookHours = 0
        }

        // 如果已经是最后一个教材，继续使用最后一个教材
        // 这符合需求中"课次超出或不足用最后一本教材补充或扣除"的规则
      })
    },

    // 按课次数分配教材到课次（新方法）
    assignTextbooksToScheduleByClasses(scheduleList, textbookClassInfo) {
      if (textbookClassInfo.length === 0 || scheduleList.length === 0) return

      let currentClassIndex = 0

      // 按教材顺序分配课次
      textbookClassInfo.forEach(info => {
        const { textbook, classes } = info

        // 为当前教材分配指定数量的课次
        for (let i = 0; i < classes && currentClassIndex < scheduleList.length; i++) {
          const schedule = scheduleList[currentClassIndex]
          schedule.textbook = textbook.id
          schedule.textbookName = textbook.textbookName
          currentClassIndex++
        }
      })

      // 如果还有剩余课次，使用最后一本教材
      const lastTextbook = textbookClassInfo[textbookClassInfo.length - 1]?.textbook
      if (lastTextbook) {
        while (currentClassIndex < scheduleList.length) {
          const schedule = scheduleList[currentClassIndex]
          schedule.textbook = lastTextbook.id
          schedule.textbookName = lastTextbook.textbookName
          currentClassIndex++
        }
      }
    },

    // 校验上课周期和时间冲突
    validateScheduleConflicts() {
      const scheduleList = this.form.scheduleList
      const conflicts = []

      // 收集所有时间段
      const timeSlots = []
      for (let i = 0; i < scheduleList.length; i++) {
        const item = scheduleList[i]
        if (!item.weekdays || !item.startTime || !item.endTime) {
          continue
        }

        item.weekdays.forEach(weekday => {
          timeSlots.push({
            index: i + 1,
            weekday: weekday,
            startTime: item.startTime,
            endTime: item.endTime,
            startMinutes: this.timeToMinutes(item.startTime),
            endMinutes: this.timeToMinutes(item.endTime)
          })
        })
      }

      // 检查冲突
      for (let i = 0; i < timeSlots.length; i++) {
        for (let j = i + 1; j < timeSlots.length; j++) {
          const slot1 = timeSlots[i]
          const slot2 = timeSlots[j]

          // 检查相同星期几的时间冲突
          if (slot1.weekday === slot2.weekday) {
            // 检查时间是否重叠
            const isOverlap = this.isTimeRangeOverlap(slot1.startMinutes, slot1.endMinutes, slot2.startMinutes, slot2.endMinutes)

            if (isOverlap) {
              const weekdayNames = {
                monday: '周一',
                tuesday: '周二',
                wednesday: '周三',
                thursday: '周四',
                friday: '周五',
                saturday: '周六',
                sunday: '周日'
              }

              const weekdayName = weekdayNames[slot1.weekday]
              conflicts.push(`第${slot1.index}行和第${slot2.index}行在${weekdayName}的上课时间存在冲突`)
            }
          }
        }
      }

      return {
        isValid: conflicts.length === 0,
        message: conflicts.length > 0 ? conflicts[0] : ''
      }
    },

    // 检查两个时间段是否重叠
    isTimeRangeOverlap(start1, end1, start2, end2) {
      // 时间段1: [start1, end1]
      // 时间段2: [start2, end2]
      // 重叠条件: start1 < end2 && start2 < end1
      return start1 < end2 && start2 < end1
    },

    // 校验上课时间区间是否满足最小课次时长和整数倍要求
    validateMinDuration() {
      if (this.minClassDuration <= 0) {
        return { isValid: true, message: '' }
      }

      const scheduleList = this.form.scheduleList
      const violations = []

      for (let i = 0; i < scheduleList.length; i++) {
        const item = scheduleList[i]
        if (!item.startTime || !item.endTime || !item.duration) {
          continue
        }

        const duration = item.duration

        // 校验1：时长不能小于最小课次时长
        if (duration < this.minClassDuration) {
          violations.push({
            index: i + 1,
            duration: duration,
            timeRange: `${item.startTime}-${item.endTime}`,
            type: 'tooShort'
          })
        }
        // 校验2：时长必须是最小课次时长的整数倍
        else if (duration % this.minClassDuration !== 0) {
          violations.push({
            index: i + 1,
            duration: duration,
            timeRange: `${item.startTime}-${item.endTime}`,
            type: 'notMultiple'
          })
        }
      }

      if (violations.length > 0) {
        const violation = violations[0]
        if (violation.type === 'tooShort') {
          return {
            isValid: false,
            message: `第${violation.index}行的上课时间(${violation.timeRange})时长为${violation.duration}分钟，小于最小课次时长${this.minClassDuration}分钟，请调整`
          }
        } else if (violation.type === 'notMultiple') {
          return {
            isValid: false,
            message: `第${violation.index}行的上课时间(${violation.timeRange})时长为${violation.duration}分钟，必须为最小课次时长${this.minClassDuration}分钟的整数倍，请调整`
          }
        }
      }

      return { isValid: true, message: '' }
    },

    // 处理时长变化
    handleDurationChange(item, index) {
      if (item.startTime && item.duration) {
        this.calculateEndTime(item)
      }
    },

    // 处理开始时间聚焦事件
    handleStartTimeFocus(item, index) {
      // 如果还没有设置开始时间，则设置为当前时间的整点
      if (!item.startTime) {
        const now = new Date()
        const currentHour = now.getHours()
        item.startTime = `${currentHour.toString().padStart(2, '0')}:00`
        // 设置开始时间后，自动计算结束时间
        this.calculateEndTime(item)
      }
    },

    // 处理开始时间变化
    handleStartTimeChange(item, index) {
      if (item.startTime && item.duration) {
        this.calculateEndTime(item)
      }
    },

    // 计算结束时间
    calculateEndTime(item) {
      if (!item.startTime || !item.duration) {
        item.endTime = null
        return
      }

      const [hours, minutes] = item.startTime.split(':')
      const startMinutes = parseInt(hours) * 60 + parseInt(minutes)
      const endMinutes = startMinutes + item.duration

      // 检查是否超过第二天
      if (endMinutes > 24 * 60) {
        this.$message.warning('下课时间不能超过第二天，请重新选择上课时间')
        item.startTime = null
        item.endTime = null
        return
      }

      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      item.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
    },

    handleAddSchedule() {
      const newItem = {
        weekdays: [],
        duration: this.minClassDuration || 30,
        startTime: null,
        endTime: null
      }

      this.form.scheduleList.push(newItem)
    },

    handleRemoveSchedule(index) {
      if (this.form.scheduleList.length > 1) {
        this.form.scheduleList.splice(index, 1)
      }
    },

    async handleConfirm() {
      try {
        // 表单验证
        const valid = await this.$refs.form.validate().catch(() => false)
        if (!valid) {
          return
        }

        // 验证所有排课项目
        for (let i = 0; i < this.form.scheduleList.length; i++) {
          const item = this.form.scheduleList[i]
          if (!item.weekdays.length || !item.startTime || !item.endTime || !item.duration) {
            this.$message.warning('请完善所有上课周期信息')
            return
          }
        }

        // 校验上课周期和时间冲突
        const conflictResult = this.validateScheduleConflicts()
        if (!conflictResult.isValid) {
          this.$message.warning(conflictResult.message)
          return
        }

        // 校验上课时间区间是否小于最小课次时长
        const durationResult = this.validateMinDuration()
        if (!durationResult.isValid) {
          this.$message.warning(durationResult.message)
          return
        }

        this.loading = true

        let params = {}

        if (this.isAdjustMode) {
          // 调整模式：根据后端接口参数构建
          params = {
            courseId: parseInt(this.classData.id),
            startDate: this.form.startDate,
            coursePeriodDtoList: this.form.scheduleList
              .filter(item => item.weekdays && item.weekdays.length > 0 && item.startTime && item.endTime)
              .map(item => ({
                courseTime: `${item.startTime}-${item.endTime}`,
                weekNum: item.weekdays.map(weekday => this.getWeekDayNumber(weekday))
              }))
          }
        } else {
          // 周期排课模式：生成完整的排课数据
          const scheduleData = this.generateScheduleData()
          if (!scheduleData) {
            this.loading = false
            return
          }

          params = scheduleData

          // 显示排课预览信息
          const weeklyMinutes = this.calculateWeeklyMinutes()
          const weeklyHours = weeklyMinutes / 60
          const totalWeeks = Math.ceil(this.form.scheduleHours / weeklyHours)
          const totalSchedules = params.yddAddSchedulingListBoList.length
        }

        if (this.isAdjustMode) {
          // 调整模式：调用调整上课周期API
          await One2ManyApi.changeScheduleCoursePeriod(params)
          this.$message.success('调整上课周期成功')
          this.$emit('confirm', this.form)
          this.$emit('update:visible', false)
        } else {
          // 周期排课模式：先进行排课校验
          const checkResult = await One2ManyApi.checkSchedule(params)

          // 将校验结果和原始排课数据一起传递给确认弹窗
          const scheduleConfirmData = {
            ...params,
            checkResult: checkResult || [],
            coursePeriodDtoList: this.form.scheduleList
              .filter(item => item.weekdays && item.weekdays.length > 0 && item.startTime && item.endTime)
              .map(item => ({
                courseTime: `${item.startTime}-${item.endTime}`,
                weekNum: item.weekdays.map(weekday => this.getWeekDayNumber(weekday))
              }))
          }
          // 通知父组件更新hasSchedulePeriod状态
          this.$emit('update:hasSchedulePeriod', true)

          this.$emit('schedule-confirm', scheduleConfirmData)
          // 不关闭周期排课弹窗，等排课确认成功后再关闭
        }
      } catch (error) {
        this.$message.error(error || '设置失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleCancel() {
      // 如果未设置排课周期且不是调整模式，返回上一页
      // if (!this.hasSchedulePeriod && !this.isAdjustMode) {
      //   this.$router.go(-1)
      //   return
      // }
      // 其他情况正常关闭弹窗
      this.$emit('update:visible', false)
    },

    handleBeforeClose(done) {
      // 如果未设置排课周期且不是调整模式，返回上一页
      // if (!this.hasSchedulePeriod && !this.isAdjustMode) {
      //   this.$router.go(-1)
      //   return
      // }
      // 其他情况正常关闭
      done()
    },

    handleClose() {
      this.$refs.form.resetFields()
      this.handleCancel()
    }
  }
}
</script>

<style lang="scss" scoped>
.unit-text {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}

.date-tip {
  margin-left: 10px;
  color: #333;
}

.schedule-section {
  margin: 20px 0;

  .section-header {
    margin-bottom: 15px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      position: relative;
      padding-left: 10px;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 14px;
        background: #4f8bed;
      }
    }
  }

  .schedule-table {
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    overflow: hidden;

    .table-header {
      display: flex;
      background: #f5f7fa;
      border-bottom: 1px solid #e6e6e6;

      .header-cell {
        padding: 12px 16px;
        font-weight: 600;
        color: #333;
        font-size: 14px;
        border-right: 1px solid #e6e6e6;

        &:last-child {
          border-right: none;
        }

        &.weekday-cell {
          width: 230px;
          flex: 0 0 230px;
        }

        &.duration-cell {
          width: 180px;
          flex: 0 0 180px;
        }

        &.time-cell {
          width: 250px;
          flex: 0 0 250px;
        }

        &.action-cell {
          width: 80px;
          flex: 0 0 80px;
        }
      }
    }

    .table-body {
      .table-row {
        display: flex;
        border-bottom: 1px solid #e6e6e6;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f8f9fa;
        }

        .body-cell {
          padding: 12px 16px;
          border-right: 1px solid #e6e6e6;
          display: flex;
          align-items: center;

          &:last-child {
            border-right: none;
          }

          &.weekday-cell {
            width: 230px;
            flex: 0 0 230px;
          }

          &.duration-cell {
            width: 180px;
            flex: 0 0 180px;
            align-items: center;

            .duration-unit {
              margin-left: 5px;
              color: #606266;
              font-size: 12px;
              white-space: nowrap;
            }
          }

          &.time-cell {
            width: 250px;
            flex: 0 0 250px;
            align-items: center;

            .time-separator {
              margin: 0 8px;
              color: #606266;
            }
          }

          &.action-cell {
            flex: 0 0 80px;
            justify-content: center;
            gap: 6px;

            .el-button {
              width: 28px;
              height: 28px;
              padding: 0;
            }
          }
        }
      }
    }
  }
}

// 选项图标样式
.material-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: #4f8bed;
  border-radius: 2px;
  margin-right: 6px;
}

// 表单项间距调整
::v-deep .el-form-item {
  margin-bottom: 20px;
}

::v-deep .el-form-item__label {
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.periodic-schedule-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .el-input-number .el-input__inner {
  text-align: center;
}
</style>
