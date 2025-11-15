<template>
  <el-drawer title="日历排课" :visible.sync="visible" direction="rtl" size="650px" :before-close="handleClose" custom-class="calendar-schedule-drawer">
    <div class="drawer-container">
      <div class="content-wrapper">
        <!-- 上课教材部分 - 仅当有适用教材时显示 -->
        <div v-if="joyEnglishTextbookList && joyEnglishTextbookList.length > 0" class="material-section">
          <div class="section-title">上课教材</div>
          <el-form ref="scheduleForm" :model="scheduleForm" :rules="rules" label-width="94px" size="small">
            <div class="form-row">
              <el-form-item label="上课教材" prop="material" class="required">
                <el-select v-model="scheduleForm.material" placeholder="请选择上课教材" style="width: 150px" @change="handleMaterialChange">
                  <el-option v-for="item in joyEnglishTextbookList" :key="item.id" :label="item.textbookName" :value="item.id">
                    {{ item.textbookName }}
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label-width="128px" label="预计授课小时数" prop="hours">
                <el-input disabled v-model="scheduleForm.hours" placeholder="" controls-position="right" style="width: 150px" />
              </el-form-item>
            </div>
          </el-form>
        </div>

        <!-- 排课处理部分 -->
        <div class="schedule-section">
          <div class="section-title">排课处理</div>
          <el-form :model="scheduleForm" :rules="rules" label-width="94px" size="small">
            <div class="form-row">
              <el-form-item label="课次时长" prop="duration" class="required">
                <el-input-number
                  v-model="scheduleForm.duration"
                  :min="minClassDuration"
                  :max="300"
                  :step="minClassDuration || 30"
                  controls-position="right"
                  @change="handleDurationChange"
                  style="width: 120px"
                />
                <span class="unit">分钟</span>
              </el-form-item>

              <el-form-item label="上课时间" prop="startTime" class="required">
                <el-time-picker
                  v-model="scheduleForm.startTime"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="请选择"
                  @change="changeStartTime"
                  @focus="handleStartTimeFocus"
                  style="width: 110px"
                />
                <span class="separator">-</span>
                <el-time-picker v-model="scheduleForm.endTime" format="HH:mm" value-format="HH:mm" placeholder="请选择" disabled style="width: 110px" />
              </el-form-item>
            </div>
          </el-form>
          <!-- 最小课次时长显示 -->
          <div v-if="minClassDuration > 0" style="margin-top: 10px;margin-left: 26px;">
            <span class="info-label">最小课次时长：</span>
            <span style="color: #4f8bed;">{{ minClassDuration }} </span>min
          </div>
        </div>

        <!-- 排课日历部分 -->
        <div class="calendar-section">
          <div class="section-title">排课日历</div>
          <div class="calendar-container">
            <Calendar :date="defaultDate" @selectDate="selectDate" :selectDateArr="selectDateArr" refs="Calendar" />
            <SleactDatePreview :customClass="'date-prev'" :dataArr="selectDateArr" @clear="clearSelectDate" @remove-data="removeDate" />
          </div>
          <div class="calendar-tip">点击日历选择日期，可多选，右边展示已选的日期，再次点击取消对应日期的选择。</div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="drawer-footer">
        <el-button :disabled="!isFormValid" type="primary" @click="handleSubmit">确 定</el-button>
        <el-button @click="handleClose">取 消</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import dayjs from 'dayjs'
import Calendar from '@/components/calendar'
import SleactDatePreview from '@/views/tacenter/coursemgr/arrange-course/components/SelectDatePreview.vue'
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'CalendarScheduleDrawer',
  components: {
    Calendar,
    SleactDatePreview
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
    },
    // 佳音教材列表
    joyEnglishTextbookList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      scheduleForm: {
        material: '',
        hours: null,
        duration: null,
        startTime: '',
        endTime: '',
        previousValidDuration: null // 上一次的合理时长（分钟）
      },
      rules: {
        material: [{ required: true, message: '请选择上课教材', trigger: 'change' }],
        duration: [{ required: true, message: '请输入课次时长', trigger: 'blur' }],
        startTime: [{ required: true, message: '请选择上课时间', trigger: 'blur' }]
      },
      defaultDate: dayjs().format('YYYY-MM-DD'),
      selectDateArr: []
    }
  },
  computed: {
    // 最小课次时长（去除小数，保留整数）
    minClassDuration() {
      const hourLen = this.classData?.hourLen
      if (!hourLen || hourLen <= 0) {
        return 30 // 默认最小30分钟
      }
      // hourLen 本身就是分钟数，去除小数保留整数
      return Math.floor(hourLen)
    },
    isFormValid() {
      const { material, duration, startTime } = this.scheduleForm

      // 如果有适用教材，需要验证教材和小时数
      if (this.joyEnglishTextbookList && this.joyEnglishTextbookList.length > 0) {
        return material && duration && startTime && this.selectDateArr.length > 0
      }

      // 如果没有适用教材，只需要验证时长、时间和日期
      return duration && startTime && this.selectDateArr.length > 0
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // 抽屉打开时设置默认课次时长为最小课次时长
        this.scheduleForm.duration = this.minClassDuration
        this.scheduleForm.previousValidDuration = this.minClassDuration
      } else {
        this.resetForm()
      }
    }
  },
  methods: {
    // 教材变化处理
    handleMaterialChange(materialId) {
      const textbook = this.joyEnglishTextbookList.find(item => item.id === materialId)
      if (textbook) {
        this.scheduleForm.hours = textbook.expectTime
      }
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

    // 修改上课时间处理方法
    changeStartTime() {
      if (this.scheduleForm.startTime && this.scheduleForm.duration) {
        const [hours, minutes] = this.scheduleForm.startTime.split(':')
        const startMinutes = parseInt(hours) * 60 + parseInt(minutes)
        const endMinutes = startMinutes + this.scheduleForm.duration

        // 检查是否超过第二天
        if (endMinutes > 24 * 60) {
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
      // 校验课次时长是否满足最小时长和整数倍要求
      if (val && this.minClassDuration > 0) {
        // 校验1：时长不能小于最小课次时长
        if (val < this.minClassDuration) {
          this.$message.warning(`课次时长不能小于最小课次时长${this.minClassDuration}分钟，请调整`)
          this.$nextTick(() => {
            this.$set(this.scheduleForm, 'duration', this.scheduleForm.previousValidDuration)
          })
          return
        }

        // 校验2：时长必须是最小课次时长的整数倍
        if (val % this.minClassDuration !== 0) {
          this.$message.warning(`课次时长必须为最小课次时长${this.minClassDuration}分钟的整数倍，请调整`)
          // 恢复到上一次的合理值
          this.$nextTick(() => {
            this.$set(this.scheduleForm, 'duration', this.scheduleForm.previousValidDuration)
          })
          return
        }
      }

      // 如果校验通过，保存这个值作为上一次的合理值
      if (val && val > 0) {
        this.scheduleForm.previousValidDuration = val
      }

      if (this.scheduleForm.startTime) {
        this.changeStartTime()
      }
    },

    // 处理上课时间聚焦事件
    handleStartTimeFocus() {
      // 如果还没有设置开始时间，则设置为当前时间的整点
      if (!this.scheduleForm.startTime) {
        const now = new Date()
        const currentHour = now.getHours()
        this.scheduleForm.startTime = `${currentHour.toString().padStart(2, '0')}:00`
        // 设置开始时间后，自动计算结束时间
        this.changeStartTime()
      }
    },

    // 校验上课时间区间是否满足最小课次时长和整数倍要求
    validateMinDuration() {
      if (this.minClassDuration <= 0) {
        return { isValid: true, message: '' }
      }

      const duration = this.scheduleForm.duration

      if (!duration) {
        return { isValid: false, message: '请输入课次时长' }
      }

      // 校验1：时长不能小于最小课次时长
      if (duration < this.minClassDuration) {
        return {
          isValid: false,
          message: `课次时长为${duration}分钟，小于最小课次时长${this.minClassDuration}分钟，请调整`
        }
      }

      // 校验2：时长必须是最小课次时长的整数倍
      if (duration % this.minClassDuration !== 0) {
        return {
          isValid: false,
          message: `课次时长为${duration}分钟，必须为最小课次时长${this.minClassDuration}分钟的整数倍，请调整`
        }
      }

      return { isValid: true, message: '' }
    },

    // 生成排课数据
    generateScheduleData() {
      if (!this.selectDateArr || this.selectDateArr.length === 0) {
        this.$message.warning('请选择上课日期')
        return null
      }

      // 检查是否有适用教材
      const hasApplicableTextbooks = this.joyEnglishTextbookList && this.joyEnglishTextbookList.length > 0
      let textbooks = []
      let textbook = null

      if (hasApplicableTextbooks) {
        // 有适用教材时的处理逻辑
        if (!this.scheduleForm.material) {
          this.$message.warning('请选择上课教材')
          return null
        }

        textbook = this.joyEnglishTextbookList.find(item => item.id === this.scheduleForm.material)
        if (!textbook) {
          this.$message.warning('选择的教材不存在')
          return null
        }

        textbooks = [
          {
            id: textbook.id,
            textbookName: textbook.textbookName,
            expectTime: textbook.expectTime || 0
          }
        ]
      }

      // 生成排课列表 - 日历排课比较简单，直接按日期生成
      const yddAddSchedulingListBoList = this.selectDateArr.map(dateItem => {
        return {
          counselorId: this.classData.counselorId || '',
          courseDate: dateItem.date,
          courseManagerId: this.classData.courseManagerId || '',
          enCounselorId: this.classData.enCounselorId || '',
          endTime: this.scheduleForm.endTime,
          startTime: this.scheduleForm.startTime,
          teacherId: this.classData.teacherId || '',
          textbook: textbook ? textbook.id : null,
          textbookName: textbook ? textbook.textbookName : ''
        }
      })

      return {
        courseId: parseInt(this.classData.id),
        textbooks: textbooks,
        yddAddSchedulingListBoList: yddAddSchedulingListBoList
      }
    },

    // 提交排课
    async handleSubmit() {
      if (!this.isFormValid) {
        this.$message.warning('请完善必填信息')
        return
      }

      try {
        // 只有当有适用教材时才需要验证表单
        if (this.joyEnglishTextbookList && this.joyEnglishTextbookList.length > 0) {
          await this.$refs.scheduleForm.validate()
        }

        // 生成与周期排课相同的数据结构
        const scheduleData = this.generateScheduleData()
        if (!scheduleData) {
          return
        }

        // 显示排课预览信息
        const totalSchedules = scheduleData.yddAddSchedulingListBoList.length

        // 调用排课校验接口
        const checkResult = await One2ManyApi.checkSchedule(scheduleData)

        // 将校验结果和原始数据一起传递
        const scheduleConfirmData = {
          ...scheduleData,
          checkResult: checkResult || []
        }

        // 触发排课确认弹窗
        this.$emit('schedule-confirm', scheduleConfirmData)
      } catch (error) {
        this.$message.error('排课校验失败，请稍后重试')
      }
    },

    // 关闭抽屉
    handleClose() {
      this.$emit('update:visible', false)
      this.resetForm()
    },

    // 重置表单
    resetForm() {
      if (this.$refs.scheduleForm) {
        this.$refs.scheduleForm.resetFields()
      }
      this.scheduleForm = {
        material: '',
        hours: null,
        duration: null,
        startTime: '',
        endTime: '',
        previousValidDuration: null
      }
      this.selectDateArr = []
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

  .el-drawer__body {
    overflow-y: auto !important;
  }
}

.calendar-schedule-drawer {
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

  .material-section {
    margin-bottom: 24px;

    .form-row {
      display: flex;
      justify-content: space-between;

      .el-form-item {
        margin-bottom: 0;
      }
    }
  }

  .schedule-section {
    margin-bottom: 24px;

    .form-row {
      display: flex;
      justify-content: space-between;

      .el-form-item {
        margin-bottom: 0;
      }
    }

    .unit {
      margin-left: 8px;
      color: #606266;
      font-size: 13px;
    }

    .min-duration-tip {
      margin-left: 8px;
      color: #909399;
      font-size: 12px;
    }

    .separator {
      margin: 0 8px;
      color: #606266;
    }
  }

  .calendar-section {
    flex: 1;

    .calendar-container {
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
      padding-bottom: 50px;
    }
  }

  .required {
    ::v-deep .el-form-item__label::before {
      content: '*';
      color: #f56c6c;
      margin-right: 4px;
    }
  }

  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px;
    background: #fff;
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
</style>
