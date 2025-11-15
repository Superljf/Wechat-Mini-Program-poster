<template>
  <el-dialog
    custom-class="select-orders-dialog"
    title="排课订单"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="orders-content">
      <!-- 订单列表 -->
      <HiTable ref="ordersTable" v-loading="ordersLoading" :columns="ordersColumns" :data="ordersList" stripe row-key="orderId" :max-height="400" />
    </div>

    <!-- 暂时注释确定取消按钮 -->
    <!-- <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading" size="small" :disabled="!isFormValid">确定</el-button>
    </div> -->
  </el-dialog>
</template>

<script>
import One2ManyApi from '@/services/tacenter/one2many'

export default {
  name: 'SelectOrdersDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    studentData: {
      type: Object,
      default: () => ({})
    },
    // 新增API所需参数
    courseId: {
      type: [String, Number],
      default: ''
    },
    buId: {
      type: [String, Number],
      default: 0
    },
    subCourseKind: {
      type: String,
      default: ''
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
    isFormValid() {
      return this.selectedOrders.length > 0
    },
    ordersColumns() {
      return [
        // 暂时注释复选框列
        // {
        //   type: 'selection',
        //   width: 55
        // },
        {
          prop: 'orderNo',
          label: '报班单号',
          width: 180
        },
        {
          prop: 'courseName',
          label: '课程名称',
          width: 200
        },
        {
          prop: 'attendClassDate',
          label: '报班时间',
          width: 150
        },
        {
          prop: 'courseScheduleCount',
          label: '剩余可排小时数',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            // 计算剩余可排时间：courseScheduleCount * hourLen / 60
            return h('span', `${(row.courseScheduleCount * row.hourLen) / 60 || 0}h`)
          }
        },
        {
          prop: 'courseSurplusCount',
          label: '剩余可用小时数',
          width: 120,
          align: 'center',
          render: (h, { row }) => {
            return h('span', `${(row.courseSurplusCount * row.hourLen) / 60 || 0}h`)
          }
        },
        {
          prop: 'discountUnitPrice',
          label: '课时单价',
          width: 100,
          align: 'center',
          render: (h, { row }) => {
            return h('span', row.discountUnitPrice === 0 ? '¥0' : `¥${row.discountUnitPrice}`)
          }
        }
        // 暂时注释排序列
        // {
        //   prop: 'sortOrder',
        //   label: '排序',
        //   width: 100,
        //   align: 'center',
        //   render: (h, { row, $index }) => {
        //     return h('el-input-number', {
        //       props: {
        //         value: row.sortOrder,
        //         min: 1,
        //         max: this.ordersList.length,
        //         controls: false,
        //         size: 'small'
        //       },
        //       style: {
        //         width: '80px'
        //       },
        //       on: {
        //         input: value => this.handleSortChange(row, value)
        //       }
        //     })
        //   }
        // }
      ]
    }
  },
  data() {
    return {
      loading: false,
      ordersLoading: false,
      ordersList: [],
      selectedOrders: []
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.loadOrdersList()
      }
    }
  },
  methods: {
    // 加载订单列表
    async loadOrdersList() {
      this.ordersLoading = true
      try {
        const params = {
          courseId: this.courseId,
          studentId: this.studentData.studentId
        }

        const res = await One2ManyApi.getScheduleStudentOrderList(params)
        console.log('🚀 ~ loadOrdersList ~ res:', res)

        this.ordersList = res || []
      } catch (error) {
        this.$message.error('获取订单列表失败，请稍后重试')
      } finally {
        this.ordersLoading = false
      }
    },

    // 暂时注释排序变化方法
    // handleSortChange(row, value) {
    //   row.sortOrder = value
    //   // 重新排序订单列表
    //   this.ordersList.sort((a, b) => a.sortOrder - b.sortOrder)
    // },

    // 暂时注释表格选择变化方法
    // handleSelectionChange(selection) {
    //   this.selectedOrders = selection
    // },

    // 暂时注释确认选择方法
    // async handleConfirm() {
    //   this.loading = true
    //   try {
    //     // 调用选择排课订单API
    //     const params = {
    //       courseStudentId: this.studentData.id,
    //       orderIdList: this.selectedOrders.map(order => order.orderId)
    //     }

    //     await One2ManyApi.selectScheduleStudentOrder(params)
    //     this.$message.success('选择排课订单成功')

    //     this.$emit('confirm', {
    //       studentData: this.studentData,
    //       selectedOrders: this.selectedOrders,
    //       ordersList: this.ordersList
    //     })

    //     this.handleClose()
    //   } catch (error) {
    //     this.$message.error('操作失败，请稍后重试')
    //   } finally {
    //     this.loading = false
    //   }
    // },

    // 关闭弹窗
    handleClose() {
      this.dialogVisible = false
      this.resetData()
    },

    // 重置数据
    resetData() {
      this.ordersList = []
      // 暂时注释selectedOrders重置
      // this.selectedOrders = []
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

// 弹窗样式
::v-deep .el-dialog.select-orders-dialog {
  border-radius: 8px;
  margin-top: 10vh !important;
}

::v-deep .el-dialog.select-orders-dialog .el-dialog__header {
  border: none !important;
  border-radius: 8px 8px 0px 0px;
  background-color: rgba(241, 244, 247, 1);
  display: flex;
  align-items: center;
  padding: 12px 20px;
}

::v-deep .el-dialog.select-orders-dialog .el-dialog__header .el-dialog__title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

::v-deep .el-dialog.select-orders-dialog .el-dialog__body {
  padding: 20px !important;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

::v-deep .el-dialog.select-orders-dialog .el-dialog__footer {
  display: flex;
  justify-content: flex-end;
  border-top: none !important;
  padding: 16px 20px;
  gap: 12px;
}

::v-deep .dialog-footer .el-button {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 4px;
}
</style>
