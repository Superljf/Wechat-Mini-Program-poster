<template>
  <el-dialog custom-class="open-class-dialog" title="开班确认" :visible.sync="dialogVisible" width="620px" :close-on-click-modal="false" @close="handleClose">
    <div class="dialog-content">
      <div class="tip-section">
        <span v-if="studentCount >= classDetail.openCourseNum">
          等班学员共计 <span class="count-number">{{ studentCount }}</span> 名。请确认班级信息，确认无误后即可开班哦~
        </span>
        <span v-else>
          等班学员共计 <span class="count-number">{{ studentCount }}</span> 名，未达建议开班人数。请确认班级信息，确认无误后即可开班哦~
        </span>
      </div>

      <div class="form-section">
        <h4>班级信息</h4>
        <el-form :model="form" :rules="rules" ref="form" label-width="96px" size="small" class="open-class-form">
          <!-- 班级名称独占一行 -->
          <div class="form-row full-width">
            <el-form-item label="班级名称" prop="courseName">
              <el-input v-model.trim="form.courseName" placeholder="请输入班级名称" maxlength="20" show-word-limit></el-input>
            </el-form-item>
          </div>

          <!-- 其他字段两列布局 -->
          <div class="form-row two-columns">
            <el-form-item label="班级简称">
              <el-input v-model.trim="form.shortName" placeholder="请输入班级简称" maxlength="5" show-word-limit></el-input>
            </el-form-item>

            <el-form-item label="科目" prop="subjectId">
              <HiDict disabled v-model="form.subjectId" dict-key="subject" placeholder="请选择科目" style="width: 100%" />
            </el-form-item>
          </div>

          <div class="form-row two-columns">
            <el-form-item label="老师" prop="teacherId">
              <HiAsyncSelector
                v-model="form.teacherId"
                dict-key="teacher"
                :param="{ buId: userBaseInfo.buId, size: 100 }"
                placeholder="请输入老师姓名/编码"
                style="width: 100%"
                clearable
                :defaultWord="form.teacherName"
              >
                <template v-slot="slotProps">
                  <span>{{ slotProps.label }}</span>
                  <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                </template>
              </HiAsyncSelector>
            </el-form-item>

            <el-form-item label="班主任" prop="courseManagerId">
              <HiAsyncSelector
                :defaultWord="form.courseManagerName"
                v-model="form.courseManagerId"
                dict-key="employee"
                placeholder="请输入班主任姓名/编码"
                style="width: 100%"
                clearable
              >
                <template v-slot="slotProps">
                  <span>{{ slotProps.label }}</span>
                  <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
                </template>
              </HiAsyncSelector>
            </el-form-item>
          </div>

          <div class="form-row two-columns">
            <el-form-item label="班级类型" prop="subCourseKind">
              <el-select disabled v-model="form.subCourseKind" placeholder="请选择班型" style="width: 100%" @change="handleClassTypeChange">
                <el-option v-for="item in classTypeList" :key="item.subCourseKind" :label="item.subCourseKindName" :value="item.subCourseKind"> </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="建议开班人数">
              <el-input v-model="form.suggestStudentCount" placeholder="根据班级类型自动设置" disabled></el-input>
            </el-form-item>
          </div>
        </el-form>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">确定开班</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'OpenClassDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classDetail: {
      type: Object,
      default: () => ({})
    },
    studentCount: {
      type: Number,
      default: 0
    },
    classTypeList: {
      type: Array,
      default: () => []
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
      return this.form.courseName && this.form.subjectId && this.form.teacherId && this.form.courseManagerId && this.form.subCourseKind
    }
  },
  data() {
    return {
      loading: false,
      form: {
        courseName: '',
        shortName: '',
        subjectId: '',
        teacherId: '',
        courseManagerId: '',
        subCourseKind: '',
        suggestStudentCount: '',
        teacherName: '',
        courseManagerName: ''
      },
      rules: {
        courseName: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
        subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
        teacherId: [{ required: true, message: '请选择老师', trigger: 'change' }],
        courseManagerId: [{ required: true, message: '请选择班主任', trigger: 'change' }],
        subCourseKind: [{ required: true, message: '请选择班型', trigger: 'change' }]
      }
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    }
  },
  methods: {
    initForm() {
      this.form = {
        courseName: this.classDetail.courseName || '',
        shortName: this.classDetail.shortName || '',
        subjectId: this.classDetail.subjectId || '',
        teacherId: this.classDetail.teacherId || '',
        courseManagerId: this.classDetail.courseManagerId || '',
        subCourseKind: +this.classDetail.subCourseKind || '',
        suggestStudentCount: this.classDetail.openCourseNum || 0,
        teacherName: this.classDetail.teacherName || '',
        courseManagerName: this.classDetail.courseManagerName || ''
      }
    },

    // 班级类型变化处理
    handleClassTypeChange(val) {
      const selectedType = this.classTypeList.find(item => item.subCourseKind === val)
      if (selectedType) {
        this.form.suggestStudentCount = selectedType.openCourseNum
      }
    },

    async handleConfirm() {
      try {
        await this.$refs.form.validate()
        this.loading = true

        // 传递表单数据给父组件
        this.$emit('confirm', {
          courseName: this.form.courseName,
          shortName: this.form.shortName,
          subjectId: this.form.subjectId,
          teacherId: this.form.teacherId,
          courseManagerId: this.form.courseManagerId,
          subCourseKind: this.form.subCourseKind,
          teacherName: this.form.teacherName,
          courseManagerName: this.form.courseManagerName
        })
      } catch (error) {
        if (typeof error === 'string') {
          this.$message.error(error)
        }
      } finally {
        this.loading = false
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.$refs.form.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-content {
  .tip-section {
    border-radius: 4px;
    margin-bottom: 20px;
    line-height: 1.5;
    color: #333;

    .count-number {
      color: #4f8bed;
      font-weight: bold;
    }
  }

  .form-section {
    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #333;
    }
  }
}

.open-class-form {
  .form-row {
    &.full-width {
      .el-form-item {
        width: 100%;
      }
    }

    &.two-columns {
      display: flex;
      gap: 20px;

      .el-form-item {
        flex: 1;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.open-class-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;
}

::v-deep .el-dialog.open-class-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.open-class-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.open-class-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.open-class-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 12px 20px;
  gap: 12px;
}
</style>
