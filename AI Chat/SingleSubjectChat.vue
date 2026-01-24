<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AchieveService } from '@/api/api'
import * as echarts from 'echarts'
import studyExpressionImage from '@/assets/one-person/study-expression.png'
import singleSubjectContentBottomBg from '@/assets/one-person/single-subject-content-bottom-bg.png'
import { isWeChat, setupQrcodeLongPress as setupQrcode } from '@/utils/qrcode'
import { showImagePreview } from 'vant'

const route = useRoute()

// 学生信息数据 - 用于 message-card
const studentInfo = ref({
  name: '',
  totalScore: '',
  targetScore: '',
  gap: '',
  daysLeft: '',
  district: '',
  summaryText: ''
})

// 打字效果相关
const displayedText = ref('')
const isTyping = ref(false)
const typingTimer = ref(null)
const typingCompleted = ref(false)
const hasInitialTyping = ref(false) // 标记顶部消息是否已经完成首次打字效果
const contentReady = ref(false) // 标记内容区域是否准备就绪，防止渲染闪烁

// 对话消息列表
const messages = ref([])
const currentMessageIndex = ref(0)
const isProcessingMessage = ref(false)
const chatContainerRef = ref(null)
const conversationData = ref([]) // 存储从接口获取的对话数据
const isLoadingConversation = ref(false) // 是否正在加载对话数据

// 自动滚动控制：用户手动滚动时暂停自动滚动，回到底部再恢复
const autoScrollEnabled = ref(true)
const userScrolling = ref(false)
let userScrollTimer = null
let isProgrammaticScroll = false
const SCROLL_BOTTOM_THRESHOLD = 60 // px，距离底部多少以内算“在底部”

const onChatScroll = () => {
  const el = chatContainerRef.value
  if (!el) return
  // 程序触发的滚动不参与“用户滚动”判断，避免互相打架
  if (isProgrammaticScroll) return

  const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight)
  const atBottom = distanceToBottom <= SCROLL_BOTTOM_THRESHOLD
  autoScrollEnabled.value = atBottom

  userScrolling.value = true
  if (userScrollTimer) clearTimeout(userScrollTimer)
  userScrollTimer = setTimeout(() => {
    userScrolling.value = false
  }, 150)
}

const openImagePreview = (url) => {
  if (!url) return
  showImagePreview({
    images: [url],
    startPosition: 0,
    closeable: true,
    maxZoom: 3
  })
}

// 二维码相关
const showConsultationPop = ref(false) // 控制课程咨询弹窗显示
const weH5SurveyChannelsVo = ref({
  qwxQrcodeUrl: '',
  qwxQrcodeTip: ''
})
const qrcodeImageRef = ref(null) // 弹窗中二维码图片元素的引用

// 打开课程咨询弹窗
const openConsultation = () => {
  showConsultationPop.value = true
}

// 监听弹窗显示状态，在弹窗打开时设置二维码长按保存功能
watch(
  () => showConsultationPop.value,
  (newVal) => {
    if (newVal && qrcodeImageRef.value && weH5SurveyChannelsVo.value.qwxQrcodeUrl) {
      nextTick(() => {
        setupQrcode(qrcodeImageRef.value, weH5SurveyChannelsVo.value.qwxQrcodeUrl)
      })
    }
  }
)

// 处理文本格式化（加粗、标红）
const formatText = (text) => {
  if (!text) return ''
  let result = text

  // 匹配数字+分或数字+天的模式，例如：720分、28分、126天等
  const regex = /(\d+(?:\.\d+)?)(分|天)/g
  result = result.replace(regex, '<span class="highlight">$1$2</span>')

  return result
}

// 打字效果函数
const startTyping = (text, callback) => {
  if (!text) {
    if (callback) callback()
    return Promise.resolve()
  }

  // 清除之前的定时器
  if (typingTimer.value) {
    clearInterval(typingTimer.value)
  }

  displayedText.value = ''
  isTyping.value = true
  let index = 0

  return new Promise((resolve) => {
    typingTimer.value = setInterval(() => {
      if (index < text.length) {
        // 如果当前位置是HTML标签的开始，则跳过整个标签
        if (text[index] === '<') {
          const tagEnd = text.indexOf('>', index)
          if (tagEnd !== -1) {
            // 一次性显示整个标签
            index = tagEnd + 1
            displayedText.value = text.substring(0, index)
          } else {
            // 如果找不到结束标签，正常处理
            displayedText.value = text.substring(0, index + 1)
            index++
          }
        } else {
          displayedText.value = text.substring(0, index + 1)
          index++
        }
      } else {
        clearInterval(typingTimer.value)
        isTyping.value = false
        typingTimer.value = null
        typingCompleted.value = true
        if (callback) callback()
        resolve()
      }
    }, 30) // 每30毫秒显示一个字符
  })
}

// 生成模板文本
const generateSummaryTemplate = () => {
  // 从路由参数获取科目和成绩
  const subject = route.query.subject || ''
  const subjectScore = route.query.score || ''
  const targetSchoolName = route.query.name || ''
  const subjectTargetScore = route.query.targetScore || ''
  const subjectGap = route.query.gap || ''

  // 如果缺少必要数据，返回空字符串
  if (!subjectScore || !subjectTargetScore) {
    return ''
  }

  // 科目名称映射
  const subjectMap = {
    'math': '数学',
    'chinese': '语文',
    'english': '英语',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物',
    'history': '历史',
    'geography': '地理',
    'politics': '政治',
  }
  const subjectName = subjectMap[subject] || subject || '数学'

  // 判断是否达标（subjectGap > 0 表示未达标）
  const gapNum = Number(subjectGap) || 0
  const isNotReached = gapNum > 0

  // 科目对应的模块数
  const moduleMap = {
    '数学': '六大模块',
    '英语': '八大模块',
    '语文': '三大模块',
    '物理': '五大模块',
    '化学': '三大模块'
  }
  const moduleText = moduleMap[subjectName] || '六大模块'

  // 生成第一段内容
  const boldTargetSchoolName = `<span class="highlight">${targetSchoolName}</span>`
  let firstParagraph = ''

  if (isNotReached) {
    firstParagraph = `本次期末质检你的${subjectName}成绩是 ${subjectScore}分，参考以往厦门中考${subjectName}分数线，你的目标高中 ${boldTargetSchoolName} 需要 ${subjectTargetScore}分，你还有 ${subjectGap}分 可提升空间。`
  } else {
    firstParagraph = `本次期末质检你的${subjectName}成绩是 ${subjectScore}分，参考以往厦门中考${subjectName}分数线，你的目标高中 ${boldTargetSchoolName} 需要 ${subjectTargetScore}分，如果2026年你的中考成绩能稳住，就能实现你的目标。`
  }

  // 根据科目和是否达标显示不同的第二段内容
  let secondParagraph = ''

  if (isNotReached) {
    secondParagraph = `为了帮你拿下目标，快乐老师即将为你形成专属提分方案，接下来将从中考${subjectName}难度和中考${subjectName}${moduleText}给到你专属提分策略、再根据你现有分数以及目标冲刺情况，给到你详细的复习建议和中考冲刺规划，详细专属提分方案如下：`
  } else {
    secondParagraph = `为了帮助你稳住成绩，快乐老师即将为你形成专属方案，接下来将从中考${subjectName}难度和中考${subjectName}${moduleText}给到你专属策略、再根据你现有实际分数情况，给到你详细的复习建议和中考规划，详细专属方案如下：`
  }

  // 组合完整文本
  const templateText = `${firstParagraph}\n${secondParagraph}`

  // 将首段（第一个 \n 之前的内容）添加样式类
  const firstNewlineIndex = templateText.indexOf('\n')
  if (firstNewlineIndex > 0) {
    const firstPart = templateText.substring(0, firstNewlineIndex)
    const restText = templateText.substring(firstNewlineIndex)
    return `<span class="first-paragraph">${firstPart}</span>${restText}`
  }

  return templateText
}

// 格式化并显示文本（带打字效果）
const formattedSummaryText = computed(() => {
  // 将换行符转换为带段间距的标签
  let text = displayedText.value.replace(/\n/g, '<span class="paragraph-break"></span>')
  return formatText(text)
})

// 更新页面标题
const updatePageTitle = () => {
  const subject = route.query.subject || ''
  const subjectMap = {
    'math': '数学',
    'chinese': '语文',
    'english': '英语',
    'physics': '物理',
    'chemistry': '化学',
    'biology': '生物',
    'history': '历史',
    'geography': '地理',
    'politics': '政治',
  }
  const subjectName = subjectMap[subject] || subject || '数学'
  document.title = `${subjectName}专属提分方案`
}

// 滚动到底部
const scrollToBottom = () => {
  if (!autoScrollEnabled.value || userScrolling.value) return
  nextTick(() => {
    if (chatContainerRef.value) {
      const scrollHeight = chatContainerRef.value.scrollHeight
      const clientHeight = chatContainerRef.value.clientHeight
      isProgrammaticScroll = true
      chatContainerRef.value.scrollTop = scrollHeight - clientHeight
      // 下一轮事件循环放开标记
      setTimeout(() => {
        isProgrammaticScroll = false
      }, 0)
    }
  })
}

// 图片加载后高度变化：需要再次滚动到底部
const onChatImageLoad = () => {
  scrollToBottom()
}

// 获取对话数据（直接使用接口数据）
const getConversations = () => {
  // 直接返回接口数据
  return conversationData.value || []
}


// 处理按钮点击（会话级别）
const handleButtonClick = async (buttonText, sessionIndex) => {
  // 如果正在处理消息，不允许点击
  if (isProcessingMessage.value) {
    return
  }

  // 禁用所有按钮
  const session = messages.value[sessionIndex]
  if (session && session.buttons) {
    session.buttonsDisabled = true
  }

  // 设置处理中状态
  isProcessingMessage.value = true

  // 动态添加用户消息（显示点击的按钮文本，即家长文本）
  const userMessage = {
    id: Date.now(),
    sessionNo: session.sessionNo + 0.5, // 使用小数避免与其他会话冲突
    role: 'user',
    avatar: '我',
    contentItems: [
      {
        sequenceNo: 1,
        content: buttonText,
        type: 'text',
        displayedContent: buttonText,
        isVisible: true, // 直接可见
        isTyping: false
      }
    ],
    hasStamp: true
  }

  messages.value.push(userMessage)
  await nextTick()
  scrollToBottom()

  // 稍作延迟，让用户看到消息
  await new Promise(resolve => setTimeout(resolve, 300))

  // 重置处理状态，继续显示下一个会话
  isProcessingMessage.value = false
  showNextMessage()
}

// 为会话中的内容项添加打字机效果
const typeSessionContent = (sessionIndex, contentItemIndex, content) => {
  if (!content) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const session = messages.value[sessionIndex]
    if (!session || !session.contentItems || !session.contentItems[contentItemIndex]) {
      resolve()
      return
    }

    const contentItem = session.contentItems[contentItemIndex]
    contentItem.isTyping = true
    contentItem.displayedContent = ''

    let index = 0
    const timer = setInterval(() => {
      if (index < content.length) {
        // 如果当前位置是HTML标签的开始，则跳过整个标签
        if (content[index] === '<') {
          const tagEnd = content.indexOf('>', index)
          if (tagEnd !== -1) {
            index = tagEnd + 1
            contentItem.displayedContent = content.substring(0, index)
          } else {
            contentItem.displayedContent = content.substring(0, index + 1)
            index++
          }
        } else {
          contentItem.displayedContent = content.substring(0, index + 1)
          index++
        }
        scrollToBottom()
      } else {
        clearInterval(timer)
        contentItem.isTyping = false
        contentItem.displayedContent = content
        scrollToBottom()

        // 不做延迟：让下一项立刻出现
        resolve()
      }
    }, 30)
  })
}

// 显示下一个会话
const showNextMessage = async () => {
  // 如果正在处理消息，直接返回，确保不会并行
  if (isProcessingMessage.value) {
    return
  }

  const conversations = getConversations()
  if (currentMessageIndex.value >= conversations.length) {
    return
  }

  // 立即设置为处理中，防止并行执行
  isProcessingMessage.value = true
  const session = conversations[currentMessageIndex.value]

  // 创建会话对象
  let newSession
  let sessionIndex

  // 如果是课程咨询类型，直接显示，不需要内容项处理
  if (session.role === 'consultation') {
    newSession = {
      ...session,
      id: Date.now() + currentMessageIndex.value,
      isVisible: false
    }
    messages.value.push(newSession)
    sessionIndex = messages.value.length - 1
    scrollToBottom()

    // 直接显示课程咨询按钮
    await nextTick()
    messages.value[sessionIndex].isVisible = true
    await nextTick()
    scrollToBottom()
    // 课程咨询有 0.6s 渐入动画：先等动画结束，再额外停 200ms
    await new Promise(resolve => setTimeout(resolve, 1000))
  } else {
    // 普通会话（深拷贝内容项，内容项/按钮初始不可见）
    newSession = {
      ...session,
      id: Date.now() + currentMessageIndex.value,
      contentItems: session.contentItems.map(item => ({
        ...item,
        displayedContent: '',
        isTyping: false,
        isVisible: false
      })),
      isTyping: false,
      buttonsVisible: false
    }

    messages.value.push(newSession)
    sessionIndex = messages.value.length - 1
    scrollToBottom()

    // 如果是助手会话，依次显示每个内容项（按顺序从上到下）
    if (session.role === 'assistant' && session.contentItems) {
      for (let i = 0; i < session.contentItems.length; i++) {
        const contentItem = session.contentItems[i]

        // 先让当前内容项出现
        // 关键：这里必须改响应式代理对象 messages，不能改 newSession（否则第 2/4 张图不会及时渲染）
        const reactiveSession = messages.value[sessionIndex]
        reactiveSession.contentItems[i].isVisible = true
        // 文本项：先标记为打字中，避免 nextTick 时直接渲染完整文本
        if (contentItem.content) {
          reactiveSession.contentItems[i].isTyping = true
          reactiveSession.contentItems[i].displayedContent = ''
        }
        await nextTick()
        scrollToBottom()

        // 如果有文本，打字；没有文本（如纯图片）就直接显示
        if (contentItem.content) {
          await typeSessionContent(sessionIndex, i, contentItem.content)
        } else {
          await nextTick()
          scrollToBottom()
        }
      }

      // 内容项全部完成后，立刻显示按钮（直接修改 messages 中的对象）
      if (session.buttons && session.buttons.length > 0) {
        messages.value[sessionIndex].buttonsVisible = true
        await nextTick()
        scrollToBottom()
      }
    } else {
      // 用户消息直接显示，不需要打字效果
      newSession.contentItems.forEach(item => {
        item.displayedContent = item.content
        item.isVisible = true
      })
      await nextTick()
      scrollToBottom()
    }
  }

  // 更新索引
  currentMessageIndex.value++
  // 重置处理状态
  isProcessingMessage.value = false

  // 如果没有按钮，自动显示下一个会话
  if (!session.buttons || session.buttons.length === 0) {
    // 不做延迟：直接继续下一个会话（微任务，避免同步递归堆栈）
    Promise.resolve().then(() => showNextMessage())
  }
}

const formatContent = (content) => {
  if (!content) return content

  const rules = [
    // red + bold / blod（优先）
    [/<red>\s*<(bold|blod)>/g, '<span class="red-text"><strong>'],
    [/<\/(bold|blod)>\s*<\/red>/g, '</strong></span>'],

    // 单 bold / blod
    [/<(bold|blod)>/g, '<strong>'],
    [/<\/(bold|blod)>/g, '</strong>'],

    // 单 red
    [/<red>/g, '<span class="red-text">'],
    [/<\/red>/g, '</span>']
  ]

  if (/<blod>/.test(content)) {
    console.warn('⚠️ 检测到拼写错误标签 <blod>', content)
  }
  return rules.reduce(
    (text, [pattern, replacement]) =>
      text.replace(pattern, replacement),
    content
  )
}





// 转换后端数据为前端可用格式
const convertBackendDataToMessages = (backendData) => {
  if (!backendData || !backendData.contentList || !Array.isArray(backendData.contentList)) {
    return []
  }

  const messages = []
  const parentTextItems = [] // 存储家长文本项，用于后续处理

  // 按 sessionNo 分组
  const sessionMap = new Map()

  backendData.contentList.forEach((item) => {
    const sessionNo = item.sessionNo || 1

    if (!sessionMap.has(sessionNo)) {
      sessionMap.set(sessionNo, [])
    }

    sessionMap.get(sessionNo).push(item)

    // 记录家长文本项
    const contentType = item.contentType || ''
    if (contentType.includes('家长')) {
      parentTextItems.push({ ...item, sessionNo })
    }
  })

  // 第一步：按会话合并消息（不包括家长文本）
  sessionMap.forEach((items, sessionNo) => {
    // 按 sequenceNo 排序
    items.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0))

    // 过滤掉家长文本
    const nonParentItems = items.filter(item => !(item.contentType || '').includes('家长'))

    if (nonParentItems.length === 0) {
      return // 如果没有非家长文本，跳过这个会话
    }

    // 创建会话对象，合并同一会话的所有内容
    const session = {
      sessionNo: sessionNo,
      role: 'assistant',
      avatar: '师',
      contentItems: [], // 多个内容项
      buttons: null,
      delay: sessionNo === 1 ? 300 : 300
    }

    nonParentItems.forEach((item) => {
      const contentType = item.contentType || ''

      // 处理内容
      let content = item.content || ''
      content = formatContent(content)

      // 根据 contentType 确定内容项类型
      const hasImage = contentType.includes('图片') || contentType.includes('image')
      const isConsultation = contentType.includes('课程咨询') || contentType.includes('咨询')

      // 如果是课程咨询，跳过（在后面作为独立会话处理）
      if (isConsultation) {
        return
      }

      const contentItem = {
        sequenceNo: item.sequenceNo || 0,
        content: content,
        type: 'text'
      }

      if (hasImage) {
        // 提取图片URL
        const imageMatch = content.match(/https?:\/\/[^\s<>"]+/)
        if (imageMatch) {
          contentItem.imageUrl = imageMatch[0]
          contentItem.content = content.replace(imageMatch[0], '').trim()
        } else if (content.startsWith('http')) {
          contentItem.imageUrl = content
          contentItem.content = ''
        }
        contentItem.type = 'image'
      }

      // 注意：按钮不在这里处理，按钮只在下一个会话是"家长文本"时才出现
      // 按钮处理逻辑在后面的"处理家长文本"部分

      session.contentItems.push(contentItem)
    })

    // 确保同一会话内严格按 sequenceNo 顺序渲染
    session.contentItems.sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0))

    // 只有当 contentItems 不为空时才添加会话
    if (session.contentItems.length > 0) {
      messages.push(session)
    }
  })

  // 第二步：处理家长文本，给上一个会话添加按钮（家长文本不再创建独立的用户消息）
  parentTextItems.forEach((parentItem) => {
    const currentSessionNo = parentItem.sessionNo
    const prevSessionNo = currentSessionNo - 1

    // 给上一个会话添加按钮
    if (prevSessionNo > 0) {
      const prevSession = messages.find(msg => msg.sessionNo === prevSessionNo)
      if (prevSession) {
        if (!prevSession.buttons) {
          prevSession.buttons = []
        }
        prevSession.buttons.push({
          text: parentItem.content || '',
          style: 'secondary'
        })
      }
    }

    // 注意：家长文本已作为按钮添加到上一个会话，点击按钮后会显示下一个会话
    // 不再创建独立的用户消息，避免重复显示
  })



  // 第三步：处理课程咨询，作为独立的会话
  const consultationItems = backendData.contentList.filter(item => {
    const contentType = item.contentType || ''
    return contentType.includes('课程咨询') || contentType.includes('咨询')
  })

  consultationItems.forEach((item) => {
    messages.push({
      sessionNo: item.sessionNo || 0,
      sequenceNo: item.sequenceNo || 0,
      role: 'consultation',
      consultationText: item.content || '课程咨询',
      isVisible: false, // 初始不可见，showNextMessage 中设置
      delay: 500
    })
  })

  // 最后按 sessionNo 和 sequenceNo 排序
  messages.sort((a, b) => {
    if (a.sessionNo !== b.sessionNo) {
      return a.sessionNo - b.sessionNo
    }
    return a.sequenceNo - b.sequenceNo
  })
  console.log('messages', messages)

  // 打印最终转换后的数据结构
  console.log('✅ 最终转换后的会话数据结构:', JSON.stringify(messages, null, 2))

  return messages
}

// 调用解锁科目提分方案接口并获取对话数据
const fetchConversationData = async () => {
  if (isLoadingConversation.value) {
    return
  }

  try {
    isLoadingConversation.value = true

    const activityId = route.query.activityId || route.query.id
    const cid = sessionStorage.getItem('cid')
    const score = route.query.targetScore
    const subject = route.query.subject
    const name = route.query.name

    if (!activityId || !score || !subject) {
      console.warn('缺少必要参数，无法调用接口')
      return
    }

    const params = {
      activityId: Number(activityId),
      cid: cid ? Number(cid) : undefined,
      score: Number(score),
      subject: subject,
      name: name
    }

    const res = await AchieveService.unlockQmSubject(params)

    if (res?.data?.result) {
      const result = res.data.result

      // 更新学生信息
      if (result.teacherSummary) {
        studentInfo.value = { ...result.teacherSummary }
      }

      // 获取二维码数据（如果接口返回）
      if (result.weH5SurveyChannelsVo) {
        weH5SurveyChannelsVo.value = { ...result.weH5SurveyChannelsVo }
      }

      // 如果没有返回二维码数据，尝试从原接口获取
      if (!weH5SurveyChannelsVo.value.qwxQrcodeUrl && activityId) {
        try {
          const qrRes = await AchieveService.queryImprovementPlan({
            activityId,
            targetSchool: route.query.name || ''
          })
          if (qrRes?.data?.result?.weH5SurveyChannelsVo) {
            weH5SurveyChannelsVo.value = { ...qrRes.data.result.weH5SurveyChannelsVo }
          }
        } catch (error) {
          console.warn('获取二维码数据失败:', error)
        }
      }

      // 转换数据格式
      const convertedMessages = convertBackendDataToMessages(result)
      conversationData.value = convertedMessages

      console.log('✅ 成功获取对话数据，共', convertedMessages.length, '条消息')
    }
  } catch (error) {
    console.error('❌ 调用解锁科目提分方案接口失败:', error)
    // 失败时使用mock数据
    conversationData.value = []
  } finally {
    isLoadingConversation.value = false
  }
}

// 初始化顶部消息和会话
const initContent = async () => {
  updatePageTitle()

  // 重置会话状态
  messages.value = []
  currentMessageIndex.value = 0
  isProcessingMessage.value = false
  contentReady.value = false

  // 调用接口获取对话数据
  await fetchConversationData()

  // 数据就绪，标记可以渲染，等待 DOM 完成更新后再开始打字机效果
  contentReady.value = true
  await nextTick()

  // 只在首次加载时显示顶部打字效果
  if (!hasInitialTyping.value) {
    const templateText = generateSummaryTemplate()
    if (templateText) {
      await nextTick()
      await startTyping(templateText)
      typingCompleted.value = true
      hasInitialTyping.value = true
      setTimeout(() => {
        showNextMessage()
      }, 200)
      // 立刻开始对话
    } else {
      // 如果没有文本，直接开始对话
      hasInitialTyping.value = true
      showNextMessage()
    }
  } else {
    // 如果已经完成首次打字，直接显示完整文本并开始对话
    const templateText = generateSummaryTemplate()
    if (templateText) {
      displayedText.value = templateText
      typingCompleted.value = true
    }
    showNextMessage()
  }
}

// 监听路由参数变化
watch(
  () => [
    route.query.subject,
    route.query.score,
    route.query.name,
    route.query.targetScore,
    route.query.gap
  ],
  async () => {
    await initContent()
  },
  { immediate: true }
)

onMounted(() => {
  // initContent 已由 watch immediate:true 触发，此处不再重复调用
})

onUnmounted(() => {
  if (typingTimer.value) {
    clearInterval(typingTimer.value)
    typingTimer.value = null
  }
  if (userScrollTimer) {
    clearTimeout(userScrollTimer)
    userScrollTimer = null
  }
})
</script>

<template>
  <div class="single-subject-chat">


    <div class="content" ref="chatContainerRef" @scroll.passive="onChatScroll">
      <!-- 个性化消息卡片 -->
      <div style="padding: 15px; padding-bottom: 0px;">
        <div class="card message-card">
          <div class="avatar">
            <img src="@/assets/one-person/person-logo.png" alt="头像" />
          </div>
          <div class="message-header">
            <div class="greeting">
              <div class="speech-bubble">
                <img src="@/assets/one-person/two-logo.png" alt="快乐学习" />
              </div>
              <div class="greeting-text">
                Hi~ {{ studentInfo.name || studentInfo.studentName }}同学
              </div>
            </div>
          </div>
          <div class="message-content" :class="{ 'content-visible': contentReady }">
            <div class="score-message">
              <span v-html="formattedSummaryText"></span>
              <span v-if="isTyping" class="typing-cursor">|</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 对话消息区域 -->
      <div class="chat-messages">
        <template v-for="(session, sessionIndex) in messages" :key="`session-${session.sessionNo}`">
          <!-- 课程咨询按钮（独立显示，不需要头像和气泡） -->
          <div v-if="session.role === 'consultation'" class="course-consultation-container">
            <div class="course-consultation" :class="{ 'course-consultation--loaded': session.isVisible }"
              @click="openConsultation">
              <img src="@/assets/result/person-logo.png" alt="课程咨询" class="course-icon" />
              <span class="course-text">{{ session.consultationText || '课程咨询' }}</span>

            </div>
            <div class="btn-study-expression">
              <img :src="studyExpressionImage" alt="快乐学习" class="study-expression-img" />
              <span>快乐学习，天天向上～</span>
            </div>
          </div>


          <!-- 普通消息（用户/助手） -->
          <div v-else class="message" :class="{ 'message-user': session.role === 'user' }">
            <div class="message-avatar">
              <!-- 用户头像 -->
              <img v-if="session.role === 'assistant'" src="@/assets/images/img/teacher.png" alt="头像" />
              <!-- 老师头像 -->
              <img v-else src="@/assets/images/img/my.png" alt="我" />
            </div>
            <div class="message-bubble">
              <!-- 遍历会话中的所有内容项 -->
              <template v-for="(contentItem, itemIndex) in session.contentItems" :key="`content-${itemIndex}`">
                <template v-if="contentItem.isVisible">
                  <!-- 文字内容 -->
                  <div v-if="contentItem.content" class="message-text">
                    <span v-html="contentItem.isTyping ? contentItem.displayedContent : contentItem.content"></span>
                    <span v-if="contentItem.isTyping" class="typing-cursor">|</span>
                  </div>

                  <!-- 图片 -->
                  <div v-if="contentItem.type === 'image' && contentItem.imageUrl && !contentItem.isTyping"
                    class="message-image">
                    <img :src="contentItem.imageUrl" alt="方案图片" @load="onChatImageLoad" @error="onChatImageLoad"
                      @click="openImagePreview(contentItem.imageUrl)" />
                  </div>
                </template>
              </template>

              <!-- 按钮（会话级别） -->
              <div v-if="session.buttons && session.buttons.length > 0 && session.buttonsVisible"
                class="message-buttons">
                <button v-for="(button, btnIndex) in session.buttons" :key="btnIndex" class="bubble-btn"
                  :class="button.style || 'secondary'" :disabled="session.buttonsDisabled"
                  @click="handleButtonClick(button.text, sessionIndex)">
                  {{ button.text }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 课程咨询弹窗 -->
    <van-popup v-model:show="showConsultationPop" position="center" round :close-on-click-overlay="false"
      class="unlock-plan-popup">
      <div class="unlock-plan-content">
        <!-- 背景图片 -->
        <img :src="singleSubjectContentBottomBg" alt="课程咨询" class="plan-bg-image" />

        <!-- 关闭按钮 -->
        <div class="close-btn" @click="showConsultationPop = false">
          <van-icon name="cross" />
        </div>

        <!-- 二维码容器 -->
        <div class="qrcode-container" v-if="weH5SurveyChannelsVo.qwxQrcodeUrl">
          <img ref="qrcodeImageRef" :src="weH5SurveyChannelsVo.qwxQrcodeUrl" alt="二维码" class="qrcode-image" />
          <div class="qrcode-tip" v-if="weH5SurveyChannelsVo.qwxQrcodeTip">
            {{ weH5SurveyChannelsVo.qwxQrcodeTip }}
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style lang="less" scoped>
@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

// 简单的淡入+向上滑动效果（微信风格）
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes studyExpressionImgBounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

.single-subject-chat {
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;

  .content {
    flex: 1;
    max-width: 375px;
    margin: 0 auto;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  // 个性化消息卡片样式（复用SingleSubject.vue的样式）
  .card {
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    position: relative;
  }

  .message-card {
    position: relative;
    overflow: visible;
    margin-top: 30px;
    padding: 16px 16px 0;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('@/assets/one-person/two-bg.png');
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
      border-radius: 12px;
      clip-path: inset(0 round 12px);
    }

    .avatar {
      position: absolute;
      top: -25px;
      right: 35px;
      width: 73px;
      height: 110px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      z-index: 0;
      pointer-events: none;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: auto;
      }
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
      overflow: visible;

      .greeting {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;

        .speech-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 44px;
          flex-shrink: 0;
          position: relative;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        .greeting-text {
          font-weight: 800;
          font-size: 14px;
          color: #222222;
          line-height: 1.4;
          white-space: nowrap;
        }
      }
    }

    .message-content {
      position: relative;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.25s ease;

      &.content-visible {
        opacity: 1;
      }

      background-image: url('@/assets/one-person/two-sub-bg.png');
      background-size: 100% 100%;
      background-position: center;
      background-repeat: no-repeat;
      margin: 0 -16px;
      padding: 20px;
      border-radius: 12px;
      min-height: 100px;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        right: 35px;
        width: 76px;
        height: 25px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        mask-image: radial-gradient(ellipse 50px 25px at center, black 80%, transparent 100%);
        -webkit-mask-image: radial-gradient(ellipse 50px 25px at center,
            black 80%,
            transparent 100%);
        z-index: 2;
        pointer-events: none;
      }

      .score-message {
        font-size: 13px;
        color: #222222;
        line-height: 1.8;
        font-weight: 400;
        width: 380px;
        max-width: 100%;
        min-height: 80px;
        position: relative;
        z-index: 2;

        :deep(.first-paragraph) {
          font-size: 13px;
          color: #222222;
        }

        :deep(.paragraph-break) {
          display: block;
          margin-bottom: 0;
        }

        :deep(.first-paragraph + .paragraph-break) {
          margin-top: 10px;
        }

        :deep(.highlight) {
          color: #E60027;
          font-weight: 700;
          font-size: 14px;
        }

        .typing-cursor {
          display: inline-block;
          color: #E60027;
          font-weight: 700;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
      }
    }
  }



  // 对话消息区域样式
  .chat-messages {
    padding: 15px;
    padding-bottom: 30px;

    .course-consultation-container {
      width: 100%;
      height: 79px;
      background: linear-gradient(0deg, #FFFFFF 0%, #FEF4F6 100%);
      border-image: linear-gradient(360deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)) 2 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 15px;
      border-radius: 20px;
      position: relative;
      margin-top: 40px;
      margin-bottom: 15px;
      border: 2.5px solid #fff;
    }
  }

  .course-consultation {
    width: 100%;
    height: 44px;
    background-image: url('@/assets/one-person/kczx.svg');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    color: #FFFFFF;
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(-10px);
    overflow: visible;
    cursor: pointer;
    position: relative;

    @keyframes consultationReveal {
      0% {
        opacity: 0;
        transform: translateY(-10px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    &.course-consultation--loaded {
      animation: consultationReveal 0.6s ease-out forwards;
    }

    .course-text {
      white-space: nowrap;
      position: relative;
      display: inline-block;
    }

    .course-icon {
      position: absolute;
      width: 60px;
      height: 80px;
      margin-right: 10px;
      flex-shrink: 0;
      left: 30px;

      bottom: -43px;
      transform: translateY(-50%);
      z-index: 10;
      object-fit: contain;
    }
  }

  .btn-study-expression {
    position: absolute !important;
    right: 13px;
    top: -5px;
    transform: translateY(-50%) !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    pointer-events: none !important;

    img,
    .study-expression-img {
      width: 39px !important;
      height: 30px !important;
      object-fit: contain !important;
      flex-shrink: 0 !important;
      position: relative !important;
      animation: studyExpressionImgBounce 1.5s ease-in-out infinite !important;
      z-index: 99 !important;
      will-change: transform !important;
    }

    span {
      padding: 0 8px 0 20px;
      height: 20px;
      background: #fff8ea !important;
      border-radius: 12px !important;
      border: 1px solid rgba(225, 117, 0, 0.2) !important;
      font-weight: 500 !important;
      margin-left: -25px;
      font-size: 9px !important;
      color: #e17500 !important;
      line-height: 20px !important;
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      z-index: 9;
    }
  }

  .message {
    display: flex;
    margin-bottom: 15px;
    gap: 10px;
    opacity: 0;
    animation: fadeInUp 0.3s ease-out forwards;

    &.message-user {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 40px;
      height: 47px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .message-bubble {
      background: #fff;
      padding: 14px 18px;
      border-radius: 5px 20px 20px 20px;
      line-height: 1.8;
      font-size: 13px;
      color: #333;
      position: relative;

      .message-text {
        // 让后端返回的 \n 在聊天里生效（保留 HTML 标签能力）
        white-space: pre-line;
        word-break: break-word;
        overflow-wrap: anywhere;

        :deep(.red-text) {
          color: #E60027;
        }

        :deep(.underline) {
          text-decoration: underline;
        }

        .typing-cursor {
          display: inline-block;
          color: #E60027;
          font-weight: 700;
          animation: blink 1s infinite;
          margin-left: 2px;
        }
      }

      .message-chart {
        width: 100%;
        height: 300px;
        margin-top: 12px;
      }

      .message-table {
        margin-top: 12px;
        overflow-x: auto;

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;

          th,
          td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #e0e0e0;
          }

          th {
            background: #f5f5f5;
            font-weight: 600;
          }
        }
      }

      .message-image {
        margin-top: 12px;
        opacity: 0;
        animation: fadeInUp 0.6s ease-out forwards;

        img {
          width: 100%;
          height: auto;
          border-radius: 8px;
          cursor: pointer;
        }
      }

      .message-buttons {
        display: flex;
        gap: 10px;
        margin-top: 12px;
        flex-wrap: wrap;
        opacity: 0;
        animation: fadeInUp 0.4s ease-out forwards;
      }

      .bubble-btn {
        padding: 10px 18px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
        font-weight: 500;
        width: 100%;
        height: 44px;
        background: #E60027;
        border-radius: 23px;

        font-weight: bold;
        font-size: 12px;
        color: #FFFFFF;
        line-height: 12px;
        font-style: normal;

        &:disabled {
          cursor: not-allowed;
          background: #F0F0F0;
          color: #666;
        }
      }

      .message-stamp {
        font-size: 40px;
        margin-top: 8px;
        text-align: center;
      }
    }

    &.message-user .message-bubble {

      background: #E6ECFB;
      border-radius: 20px 5px 20px 20px;
      font-weight: 400;
      font-size: 12px;
      color: #222222;
      line-height: 18px;
      text-align: center;
      font-style: normal;

      .message-text {
        :deep(.red-text) {
          color: #ffd700;
        }

        .typing-cursor {
          color: white;
          font-weight: 700;
        }
      }
    }
  }

  .message-image img {
    cursor: zoom-in;
  }
}

// 大图预览
// 课程咨询弹窗样式
:deep(.unlock-plan-popup) {
  background: transparent !important;
  overflow: visible !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unlock-plan-content {
  position: relative;
  width: 327px;
  height: 403px;
  border-radius: 16px;
  overflow: visible;
  box-sizing: border-box;
  margin: 0 auto;

  .plan-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 16px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    pointer-events: none;
  }

  .close-btn {
    position: absolute !important;
    top: -50px !important;
    right: 12px !important;
    width: 32px !important;
    height: 32px !important;
    cursor: pointer !important;
    z-index: 10000 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    color: #fff;
    font-size: 32px;
  }

  .qrcode-container {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: auto;

    .qrcode-image {
      width: 146px;
      height: 146px;
      object-fit: contain;
      display: block;
      -webkit-touch-callout: default;
      -webkit-user-select: auto;
      user-select: auto;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
      touch-action: auto;
      transform: translateZ(0);
      -webkit-user-drag: none;
    }

    .qrcode-tip {
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  }
}
</style>
