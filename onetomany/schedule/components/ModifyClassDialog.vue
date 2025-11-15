<template>
  <el-dialog
    custom-class="modify-class-dialog"
    title="修改班级信息"
    :visible.sync="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="form" label-width="80px" size="small" class="modify-form">
      <!-- 两列布局 -->
      <div class="form-row">
        <el-form-item label="班级名称">
          <el-input v-model="form.courseName" disabled />
        </el-form-item>
        <el-form-item label="班级简称" prop="shortName">
          <el-input v-model="form.shortName" placeholder="请输入班级简称" maxlength="5" show-word-limit />
        </el-form-item>
      </div>

      <div class="form-row">
        <el-form-item label="科目">
          <el-input v-model="form.subjectName" disabled />
        </el-form-item>
        <!-- classTypeCodeName -->
        <el-form-item label="班级类型">
          <el-input v-model="form.classTypeCodeName" disabled />
        </el-form-item>
      </div>

      <div class="form-row">
        <!-- teacherName -->
        <el-form-item label="老师" prop="teacherId">
          <HiAsyncSelector
            v-model="form.teacherId"
            dict-key="teacher"
            :defaultWord="form.teacherName"
            :param="{ buId: userBaseInfo.buId, size: 100 }"
            placeholder="请输入老师姓名/编码"
            style="width: 100%"
            clearable
          >
            <template v-slot="slotProps">
              <span>{{ slotProps.label }}</span>
              <span class="c-info-light g-fz-xs">/{{ slotProps.encoding }}</span>
            </template>
          </HiAsyncSelector>
        </el-form-item>
        <el-form-item label="班主任" prop="courseManagerId">
          <HiAsyncSelector
            v-model="form.courseManagerId"
            dict-key="employee"
            :defaultWord="form.courseManagerName"
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
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small">
        确定修改
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'ModifyClassDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    classData: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  data() {
    return {
      loading: false,
      form: {
        id: '', // 班级ID
        courseName: '', // API字段：课程名称
        shortName: '', // API字段：简称
        subjectName: '',
        courseKind: '', // API字段：课程类型
        teacherName: '', // 老师名称（用于回显）
        courseManagerName: '', // 班主任名称（用于回显）
        gradeId: '', // API字段：年级
        subCourseKind: '', // API字段：课程子类型
        courseBranchIdList: [], // API字段：适用校区列表
        isAll: 0, // API字段：适用全部校区
        performanceBelongType: 1, // API字段：业绩归属类型
        userId: 0 // API字段：用户
      },
      rules: {
        teacherId: [{ required: true, message: '请选择老师', trigger: 'change' }],
        courseManagerId: [{ required: true, message: '请选择班主任', trigger: 'change' }]
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
        id: this.classData.id || '',
        courseName: this.classData.courseName || '',
        shortName: this.classData.shortName || '',
        subjectName: this.classData.subjectName || '',
        courseKind: 16,
        classTypeCodeName: this.classData.classTypeCodeName || '',
        teacherId: this.classData.teacherId || '',
        teacherName: this.classData.teacherName || '',
        courseManagerId: this.classData.courseManagerId || '',
        courseManagerName: this.classData.courseManagerName || '',
        gradeId: this.classData.gradeId || '',
        subCourseKind: this.classData.classTypeCode || '',
        courseBranchIdList: [this.classData.branchId] || [],
        isAll: 0,
        performanceBelongType: 1,
        userId: this.userInfo?.id || 0
      }
    },

    async handleConfirm() {
      try {
        // 表单验证
        const valid = await this.$refs.form.validate().catch(() => false)
        if (!valid) {
          return
        }

        this.loading = true

        // 调用真实API
        const res = await One2ManyApi.modifyScheduleBaseInfo(this.form)
        this.$emit('confirm', this.form)
        this.handleCancel()
      } catch (error) {
        this.$message.error(error || '修改失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    handleCancel() {
      this.$emit('update:visible', false)
    },

    handleClose() {
      this.$refs.form.resetFields()
      this.handleCancel()
    }
  }
}
</script>

<style lang="scss" scoped>
.modify-form {
  .form-row {
    display: flex;
    gap: 20px;

    .el-form-item {
      flex: 1;
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style>
