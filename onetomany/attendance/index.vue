<template>
  <div class="one2many-attendance">
    <el-card>
      <!-- <div class="page-title">1对多考勤</div> -->

      <!-- Tab切换 -->
      <el-tabs size="small" v-model="activeTab" lang="true" class="attendance-tabs" @tab-click="handleTabClick">
        <el-tab-pane label="课次考勤" name="classAttendance">
          <ClassAttendanceList ref="classAttendanceList" v-if="userInfoLoaded" :team-branch-list="teamBranchList" />
        </el-tab-pane>
        <el-tab-pane label="课次学员考勤" name="studentAttendance">
          <StudentAttendanceList ref="studentAttendanceList" v-if="userInfoLoaded" :team-branch-list="teamBranchList" />
        </el-tab-pane>
        <el-tab-pane label="课次学员补课" name="studentMakeup">
          <StudentMakeupList ref="studentMakeupList" v-if="userInfoLoaded" :team-branch-list="teamBranchList" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { ClassAttendanceList } from './components/class-attendance'
import { StudentAttendanceList } from './components/student-attendance'
import { StudentMakeupList } from './components/student-makeup'
import { CommonApi } from '@api'

export default {
  name: 'One2ManyAttendance',
  components: {
    ClassAttendanceList,
    StudentAttendanceList,
    StudentMakeupList
  },
  computed: {
    ...mapState('user', ['userBaseInfo', 'userInfo']),

    // 用户信息是否已加载完成
    userInfoLoaded() {
      return !!(this.userBaseInfo && this.userInfo)
    }
  },
  data() {
    return {
      activeTab: 'classAttendance',
      // 校区列表
      teamBranchList: [],
      // Tab缓存键名
      TAB_CACHE_KEY: 'one2many_attendance_active_tab'
    }
  },
  created() {
    // 加载缓存的Tab
    this.loadCachedTab()
  },
  mounted() {
    this.getOrganizationBranchList()
    this.handleRouteParams()
  },
  activated() {
    // 如果是从其他页面跳转过来的，处理路由参数
    this.handleRouteParams()
  },
  methods: {
    // 处理路由参数，自动跳转到对应Tab并设置搜索条件
    handleRouteParams() {
      const { tab, studentId, studentName, orderNo, classId, className, englishName, gradeName, branchName, subjectName } = this.$route.query

      // 如果指定了tab参数或有学员相关参数，跳转到对应Tab
      if (tab === 'studentAttendance' || studentId || studentName) {
        this.activeTab = 'studentAttendance'
        // this.saveCachedTab('studentAttendance') // 保存到缓存
        // 等待组件渲染完成后设置搜索条件
        this.$nextTick(() => {
          const studentAttendanceRef = this.$refs.studentAttendanceList
          if (studentAttendanceRef) {
            // 设置学员搜索条件
            if (studentId && studentName) {
              studentAttendanceRef.setStudentSearch(studentId, studentName)
            }

            // 如果有班级信息，设置班级搜索条件
            if (className) {
              studentAttendanceRef.setClassSearch(className)
            }
            if (orderNo) {
              studentAttendanceRef.setOrderNoSearch(orderNo)
            }

            // 自动执行搜索
            setTimeout(() => {
              studentAttendanceRef.handleSearch()
            }, 500) // 增加延迟确保组件完全初始化
          }
        })
      } else if (tab === 'classAttendance') {
        this.activeTab = 'classAttendance'
        // this.saveCachedTab('classAttendance') // 保存到缓存
      } else if (tab === 'studentMakeup') {
        this.activeTab = 'studentMakeup'
        // this.saveCachedTab('studentMakeup') // 保存到缓存
      }
      // 如果没有路由参数，使用缓存的Tab（在created中已经加载）
    },

    // 获取校区列表
    async getOrganizationBranchList() {
      try {
        let res = await CommonApi.getOrganizationBranchList()
        this.teamBranchList = res.data || []
      } catch (e) {
        e && this.$message.error(e)
      }
    },

    // Tab切换处理
    handleTabClick(tab) {
      // Tab切换时保存到缓存
      // this.saveCachedTab(tab.name)
      // Tab切换时不需要特殊处理，各组件会自行管理校区选择器
    },

    // 加载缓存的Tab
    loadCachedTab() {
      try {
        const cachedTab = sessionStorage.getItem(this.TAB_CACHE_KEY)
        if (cachedTab && ['classAttendance', 'studentAttendance', 'studentMakeup'].includes(cachedTab)) {
          this.activeTab = cachedTab
        }
      } catch (error) {
        console.warn('加载Tab缓存失败:', error)
        // 如果缓存加载失败，使用默认值
        this.activeTab = 'classAttendance'
      }
    }

    // 保存Tab到缓存
    // saveCachedTab(tabName) {
    //   try {
    //     if (tabName && ['classAttendance', 'studentAttendance', 'studentMakeup'].includes(tabName)) {
    //       sessionStorage.setItem(this.TAB_CACHE_KEY, tabName)
    //     }
    //   } catch (error) {
    //     console.warn('保存Tab缓存失败:', error)
    //   }
    // }
  }
}
</script>

<style lang="scss" scoped>
.one2many-attendance {
  .page-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .attendance-tabs {
    ::v-deep .el-tabs__header {
      margin-bottom: 20px;
    }

    ::v-deep .el-tabs__item {
      // font-size: 16px;
      font-weight: 500;
    }

    ::v-deep .el-tabs__content {
      padding: 0;
    }
  }
}
</style>
