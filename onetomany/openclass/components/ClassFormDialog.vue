<template>
  <el-dialog
    :custom-class="isEdit ? 'edit-class-dialog' : 'add-class-dialog'"
    :title="isEdit ? '编辑班级' : '新增班级'"
    :visible.sync="dialogVisible"
    width="620px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="formRules" ref="classForm" label-width="96px" size="small" class="class-form">
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
          <HiDict :disabled="isEdit" v-model="form.subjectId" dict-key="subject" placeholder="请选择科目" style="width: 100%" />
        </el-form-item>
      </div>

      <div class="form-row two-columns">
        <el-form-item label="老师">
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

        <el-form-item label="班主任">
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
          <el-select :disabled="isEdit" v-model="form.subCourseKind" placeholder="请选择班型" style="width: 100%" @change="handleClassTypeChange">
            <el-option v-for="item in classTypeList" :key="item.subCourseKind" :label="item.subCourseKindName" :value="item.subCourseKind"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="建议开班人数">
          <el-input v-model="form.suggestStudentCount" placeholder="" disabled></el-input>
        </el-form-item>
      </div>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">
        {{ isEdit ? '确定修改' : '确定新增' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'ClassFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
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
      return this.form.courseName && this.form.subjectId && this.form.subCourseKind
    }
  },
  data() {
    return {
      loading: false,
      form: {
        branchId: '',
        buId: '',
        courseManagerId: '',
        courseName: '',
        shortName: '',
        subCourseKind: '',
        subjectId: '',
        teacherId: '',
        suggestStudentCount: ''
      },
      formRules: {
        courseName: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
        subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
        subCourseKind: [{ required: true, message: '请选择班型', trigger: 'change' }]
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initForm()
      }
    }
  },
  methods: {
    // 初始化表单
    initForm() {
      if (this.isEdit && this.classData) {
        // 编辑模式：回显数据
        this.form = {
          branchId: this.classData.branchId || this.userBaseInfo?.branchId || 0,
          buId: this.userBaseInfo?.buId || 0,
          courseManagerId: this.classData.courseManagerId || '',
          courseName: this.classData.courseName || '',
          shortName: this.classData.shortName || '',
          subCourseKind: +this.classData.subCourseKind || '',
          subjectId: this.classData.subjectId || '',
          teacherId: this.classData.teacherId || '',
          suggestStudentCount: this.classData.openCourseNum || '',
          teacherName: this.classData.teacherName || '',
          courseManagerName: this.classData.courseManagerName || ''
        }
      } else {
        // 新增模式：初始化空表单
        this.form = {
          branchId: this.userBaseInfo?.branchId || 0,
          buId: this.userBaseInfo?.buId || 0,
          courseManagerId: '',
          courseName: '',
          shortName: '',
          subCourseKind: '',
          subjectId: '',
          teacherId: '',
          suggestStudentCount: ''
        }
      }
    },

    // 班级类型变化
    handleClassTypeChange(val) {
      const selectedType = this.classTypeList.find(item => item.subCourseKind === val)
      if (selectedType) {
        this.form.suggestStudentCount = selectedType.openCourseNum
      }
    },

    // 确定按钮
    async handleConfirm() {
      try {
        await this.$refs.classForm.validate()
        this.loading = true

        const params = { ...this.form }
        // 移除UI专用字段
        delete params.suggestStudentCount

        if (this.isEdit) {
          // 编辑模式
          await One2ManyApi.updateOpenCourse(this.classData.id, params)
          this.$message.success('修改班级信息成功')
        } else {
          // 新增模式
          await One2ManyApi.createOpenCourse(params)
          this.$message.success('新增班级成功')
        }

        this.dialogVisible = false
        this.$emit('success')
      } catch (error) {
        this.$message.error(error || (this.isEdit ? '编辑班级失败，请稍后重试' : '新增班级失败，请稍后重试'))
      } finally {
        this.loading = false
      }
    },

    // 取消按钮
    handleCancel() {
      this.dialogVisible = false
    },

    // 弹窗关闭
    handleClose() {
      if (this.$refs.classForm) {
        this.$refs.classForm.resetFields()
      }
      this.form = {
        branchId: '',
        buId: '',
        courseManagerId: '',
        courseName: '',
        shortName: '',
        subCourseKind: '',
        subjectId: '',
        teacherId: '',
        suggestStudentCount: ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// 班级表单弹窗布局
.class-form {
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
</style>

<style lang="scss">
// 弹窗样式
.el-dialog.add-class-dialog,
.el-dialog.edit-class-dialog {
  border-radius: 8px;
  margin-top: 15vh !important;

  .el-dialog__header {
    border: none !important;
    border-radius: 8px 8px 0px 0px;
    background-color: rgba(241, 244, 247, 1);
    display: flex;
    align-items: center;
    padding: 12px 20px;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
  }

  .el-dialog__body {
    padding: 20px !important;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
    border-top: none !important;
    padding: 16px 20px;
    gap: 12px;
  }
}

.dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
