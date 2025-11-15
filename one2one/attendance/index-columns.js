const columns = ctx => {
  return [
    {
      type: 'selection',
      width: 55,
      selectable: row => row.attendType === 'YDY_WKQ' // Only allow selection for unmarked attendance
    },
    { prop: 'encoding', label: '考勤单号', width: 180 },
    { prop: 'studentName', label: '学员姓名' },
    { prop: 'courseDateStr', label: '上课日期', width: 140 },
    { prop: 'startTime', label: '开始时间', width: 100 },
    { prop: 'endTime', label: '结束时间', width: 100 },
    { prop: 'subjectName', label: '科目' },
    { prop: 'attTeacherName', label: '老师' },
    { prop: 'counselorName', label: '学管师' },
    { prop: 'gradeName', label: '年级' },
    {
      prop: 'branchName',
      label: '校区',
      width: 150,
      render: (h, { row }) => {
        return (
          <span>{row.branchName}</span>

          // <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">
          //   <el-tooltip class="item" effect="dark" content={row.branchName} placement="top">
          //     <span>{row.branchName}</span>
          //   </el-tooltip>
          // </div>
        )
      }
    },
    {
      prop: 'attendTypeTeacherName',
      label: '考勤类型'
    },
    {
      prop: 'orderNo',
      label: '报班单号',
      width: 170
    },
    {
      prop: 'attendTypeName',
      label: '考勤状态',
      fixed: 'right',
      render: (h, { row }) => {
        return row.attendTypeName ? <el-tag type={ctx.getStatusType(row.attendType)}>{row.attendTypeName}</el-tag> : <span>-</span>
      }
    },
    {
      label: '操作',
      width: 180,
      fixed: 'right',
      render: (h, { row }) => {
        const now = new Date().getTime()
        const classTime = new Date(`${row.courseDateStr} ${row.startTime}`).getTime()
        const isAfterClassTime = now > classTime
        const isOneHourBefore = classTime - now > 3600000 // 3600000ms = 1小时

        return (
          <div>
            {row.attendType === 'YDY_WKQ' && isAfterClassTime && (
              <el-button type="text" onClick={() => ctx.handleAttendance(row)}>
                考勤
              </el-button>
            )}
            {row.attendType === 'YDY_WKQ' && (
              <el-button
                style="margin-left: 0px"
                type="text"
                onClick={() => {
                  // if (!isOneHourBefore) {
                  //   ctx.$message.warning('距离上课时间不到1小时，无法调课哦~ 请进行调整')
                  //   return
                  // }
                  ctx.handleReschedule(row)
                }}
              >
                调课
              </el-button>
            )}
            {row.attendType === 'YDY_WKQ' && (
              <el-button style="margin-left: 0px" type="text" onClick={() => ctx.handleCancel(row)}>
                取消
              </el-button>
            )}
            <el-button style="margin-left: 0px" type="text" onClick={() => ctx.handleDetail(row)}>
              详情
            </el-button>
          </div>
        )
      }
    }
  ]
}

export default columns
