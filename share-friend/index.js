const app = getApp();
import LoginManager from '../../utils/loginManager';
import inviteApi from '../../api/invite.js';
import Toast from '@vant/weapp/toast/toast';
import StudentManager from '../../utils/studentManager.js';

Page({
  data: {
    canvasWidth: 500, // 基础显示宽度（会根据设备屏幕动态调整）
    canvasHeight: 800, // 动态计算的总高度（初始值，会根据图片比例重新计算）
    posterImagePath: '', // 生成的海报图片路径
    userInfo: {},

    themeColor: '#FF4E4E',
    isGenerating: false, // 是否正在生成海报
    canvasId: 'share-poster-canvas',

    // 新增：动态尺寸相关
    originalPosterWidth: 0, // 原始海报宽度
    originalPosterHeight: 0, // 原始海报高度
    dynamicPosterHeight: 0, // 动态计算的海报显示高度
    bottomFixedHeight: 130, // 底部区域高度（会根据Canvas宽度自适应调整）
    isImageLoaded: false, // 海报图片是否已加载
    // 后端图片URL配置
    posterUrl: '', // 海报背景图URL
    qrcodeUrl: '', // 二维码图片URL,
    sharePath: '', // 分享路径带活动id 员工id  学生id
    activityId: '', // 活动id
    studentId: '', // 学生id
    employeeId: '', // 员工id
    coverImage: '', // 封面图
    shareId: '', // 分享id

    // 防重复调用标记
    isInitialized: false, // 是否已初始化
    isLoadingQRCode: false, // 是否正在加载二维码
    isLoadingPosterData: false, // 是否正在加载海报数据
    appId: 'wx2c1425e1867a4c8d', // 小程序id
  },

  onLoad(options) {
    // 获取传入的参数
    this.setData({
      activityId: options.activityId || '',
      studentId: options.studentId || '',
      employeeId: options.employeeId || '',
      themeColor: decodeURIComponent(options.themeColor || '#FF4E4E'),
    });

    // 验证登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 只有在非首次加载时才重新检查登录状态
    // if (this.data.isInitialized) {
    //   this.checkLoginStatus();
    // }
  },

  // 生成小程序码图片
  generateQrcodeImage(shareId) {
    // 防重复调用
    if (this.data.isLoadingQRCode) {
      return this.data.qrcodeUrl || '';
    }

    if (!shareId || shareId === 'fallback' || shareId === 'default') {
      // 使用默认二维码或返回空字符串
      return '';
    }

    this.setData({ isLoadingQRCode: true });

    try {
      // 获取环境版本
      const envVersion = wx.getAccountInfoSync().miniProgram.envVersion;

      // 根据环境选择域名
      const localHost =
        envVersion === 'release'
          ? 'https://parents-mp.entstudy.com'
          : 'https://parents-mp-rls.entstudy.com';

      // 构建二维码URL
      const url = `${localHost}/mp/parents/qr-code/getUnlimitedQRCode?scene=shareId=${shareId}&page=pages/new-student-landing/index&width=430&envVersion=${envVersion}&appId=${this.data.appId}`;

      console.log('生成二维码URL:', {
        shareId: shareId,
        envVersion: envVersion,
        url: url,
      });

      return url;
    } catch (error) {
      console.error('生成二维码失败:', error);
      return '';
    } finally {
      this.setData({ isLoadingQRCode: false });
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const isLoggedIn = LoginManager.isLoggedIn();

    if (!isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再分享',
        showCancel: false,
        confirmText: '去登录',
        success: () => {
          // 保存当前页面URL用于登录后回跳
          const currentUrl = `/pages/share-friend/index?activityId=${
            this.data.activityId
          }&studentId=${this.data.studentId}&themeColor=${encodeURIComponent(
            this.data.themeColor
          )}`;
          LoginManager.goToLogin(currentUrl);
        },
      });
      return;
    }

    // 已登录，继续初始化
    this.initPage();
  },

  /**
   * 初始化页面
   */
  initPage() {
    // 标记为已初始化
    this.setData({ isInitialized: true });
    // Toast.loading({
    //   message: '加载中...',
    //   duration: 0,
    // });
    this.initPosterInfo();
  },

  onTipTextTapTest() {
    // 非 release（即不是正式版）才允许跳转，用于测试
    const envVersion = wx.getAccountInfoSync().miniProgram.envVersion;
    if (envVersion !== 'release') {
      wx.navigateTo({
        url: `/pages/new-student-landing/index?shareId=${this.data.shareId}`,
      });
      return;
    }
  },

  initPosterInfo() {
    const currentStudent = StudentManager.getUserInfo();
    this.setData(
      {
        userInfo: {
          nickName: currentStudent.name || '快乐学习用户',
          avatarUrl: currentStudent.avatar || '/images/default-avatar.png',
        },
      },
      () => {
        this.setBackendImageUrls();
      }
    );
  },

  // 设置后端图片URL
  async setBackendImageUrls() {
    // 防重复调用

    if (this.data.isLoadingPosterData) {
      return;
    }

    this.setData({ isLoadingPosterData: true });

    try {
      // 调用后端API获取分享海报相关图片
      const res = await inviteApi.getSharePosterData(
        this.data.activityId,
        this.data.employeeId
      );

      if (res && res.data) {
        const shareId = res.data.shareId;

        // 异步生成二维码URL
        const qrcodeUrl = this.generateQrcodeImage(shareId);

        // 更新海报数据
        this.setData({
          posterUrl: res.data.posterImage || '', // 确保有默认值
          qrcodeUrl: qrcodeUrl,
          coverImage: res.data.coverImage || '',
          shareId: shareId,
        });

        console.log('海报数据设置成功:', {
          posterUrl: res.data.posterImage,
          shareId: shareId,
          coverImage: res.data.coverImage,
        });
      } else {
        // 数据格式异常，使用默认配置
        console.warn('后端返回数据格式异常:', res);
        this.setData({
          posterUrl: '',
          qrcodeUrl: this.generateQrcodeImage('default'),
          coverImage: '',
          shareId: 'default',
        });
      }

      // 预加载海报图片并获取原始尺寸
      await this.loadPosterImageAndCalculateSize();
    } catch (error) {
      console.error('获取海报数据失败:', error);

      // 使用默认图片作为兜底
      this.setData({
        posterUrl: '',
        qrcodeUrl: this.generateQrcodeImage('fallback'),
        coverImage: '',
        shareId: 'fallback',
      });

      // 即使失败也要尝试加载默认图片
      await this.loadPosterImageAndCalculateSize();
    } finally {
      this.setData({ isLoadingPosterData: false });

      // 延迟一点生成海报，确保数据完全设置完成
      setTimeout(() => {
        this.generatePoster();
      }, 100);
    }
  },

  // 预加载海报图片并计算动态尺寸
  async loadPosterImageAndCalculateSize() {
    return new Promise((resolve) => {
      const posterUrl = this.data.posterUrl;

      if (!posterUrl) {
        // 使用默认尺寸（参考常见海报比例）
        this.calculateCanvasSize(750, 1334); // 常见手机屏幕比例
        resolve();
        return;
      }

      // 对于本地图片，直接使用默认尺寸
      if (!posterUrl.startsWith('http')) {
        this.calculateCanvasSize(750, 1334);
        resolve();
        return;
      }

      // 网络图片需要下载到本地并获取信息
      wx.getImageInfo({
        src: posterUrl,
        success: (res) => {
          // 更新图片加载状态
          this.setData({
            originalPosterWidth: res.width,
            originalPosterHeight: res.height,
            isImageLoaded: true,
          });

          // 验证图片尺寸的合理性
          const imageWidth = res.width;
          const imageHeight = res.height;

          // 确保图片尺寸在合理范围内
          if (
            imageWidth > 0 &&
            imageHeight > 0 &&
            imageWidth <= 4000 &&
            imageHeight <= 4000
          ) {
            // 根据原始尺寸计算Canvas尺寸
            this.calculateCanvasSize(imageWidth, imageHeight);
          } else {
            // 异常尺寸，使用默认比例
            console.warn('图片尺寸异常:', {
              width: imageWidth,
              height: imageHeight,
            });
            this.calculateCanvasSize(750, 1334);
          }

          resolve();
        },
        fail: (error) => {
          console.error('图片加载失败:', error);

          // 图片加载失败，使用默认尺寸
          this.calculateCanvasSize(750, 1334);

          // 标记图片加载失败但继续处理
          this.setData({
            isImageLoaded: false,
          });

          resolve();
        },
      });
    });
  },

  // 根据海报原始尺寸计算Canvas尺寸
  calculateCanvasSize(imageWidth, imageHeight) {
    // 微信小程序Canvas尺寸限制：单边不超过4096px，总像素不超过16777216（4096*4096）
    const MAX_CANVAS_SIZE = 4096;
    const MAX_TOTAL_PIXELS = 16777216;
    
    // 参考Poster.vue的简单处理：固定底部高度160px（但需要按Canvas比例调整）
    const baseBottomHeight = 160; // 基础底部高度（参考Poster.vue）
    
    // 计算缩放比例，确保Canvas尺寸在安全范围内
    let scaleRatio = 1;
    let finalWidth = imageWidth;
    let finalHeight = imageHeight;
    
    // 1. 检查单边尺寸限制
    if (imageWidth > MAX_CANVAS_SIZE || imageHeight > MAX_CANVAS_SIZE) {
      const widthRatio = MAX_CANVAS_SIZE / imageWidth;
      const heightRatio = MAX_CANVAS_SIZE / imageHeight;
      scaleRatio = Math.min(widthRatio, heightRatio);
    }
    
    // 2. 应用初步缩放
    finalWidth = Math.floor(imageWidth * scaleRatio);
    finalHeight = Math.floor(imageHeight * scaleRatio);
    
    // 3. 计算底部高度（按缩放后的宽度）
    const bottomHeight = Math.round(baseBottomHeight * (finalWidth / 750));
    const totalHeight = finalHeight + bottomHeight;
    
    // 4. 检查总像素限制
    const totalPixels = finalWidth * totalHeight;
    if (totalPixels > MAX_TOTAL_PIXELS) {
      const pixelRatio = Math.sqrt(MAX_TOTAL_PIXELS / totalPixels);
      finalWidth = Math.floor(finalWidth * pixelRatio);
      finalHeight = Math.floor(finalHeight * pixelRatio);
    }
    
    // 5. 确保最小尺寸（避免过小）
    const MIN_WIDTH = 300;
    const MIN_HEIGHT = 400;
    if (finalWidth < MIN_WIDTH) {
      const ratio = MIN_WIDTH / finalWidth;
      finalWidth = MIN_WIDTH;
      finalHeight = Math.floor(finalHeight * ratio);
    }
    if (finalHeight < MIN_HEIGHT) {
      const ratio = MIN_HEIGHT / finalHeight;
      finalHeight = MIN_HEIGHT;
      finalWidth = Math.floor(finalWidth * ratio);
    }
    
    // 重新计算底部高度
    const adjustedBottomHeight = Math.round(baseBottomHeight * (finalWidth / 750));
    const canvasWidth = finalWidth;
    const canvasHeight = finalHeight + adjustedBottomHeight;

    console.log('Canvas尺寸计算:', {
      原图尺寸: `${imageWidth}x${imageHeight}`,
      缩放比例: scaleRatio.toFixed(3),
      海报尺寸: `${finalWidth}x${finalHeight}`,
      底部高度: adjustedBottomHeight,
      最终Canvas尺寸: `${canvasWidth}x${canvasHeight}`,
      总像素: canvasWidth * canvasHeight,
      是否安全: canvasWidth <= MAX_CANVAS_SIZE && canvasHeight <= MAX_CANVAS_SIZE && (canvasWidth * canvasHeight) <= MAX_TOTAL_PIXELS
    });

    // 更新数据
    this.setData({
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      dynamicPosterHeight: finalHeight,
      originalPosterWidth: imageWidth,
      originalPosterHeight: imageHeight,
      bottomFixedHeight: adjustedBottomHeight,
    });
  },

  // 生成海报
  generatePoster() {
    // 防止重复生成
    if (this.data.isGenerating) {
      console.log('海报正在生成中，跳过重复调用');
      return;
    }

    this.setData({ isGenerating: true });

    // 使用Canvas API生成海报
    this.drawPoster()
      .then((imagePath) => {
        this.setData({
          posterImagePath: imagePath,
          isGenerating: false,
        });
        wx.hideLoading();

        // 验证生成的图片
        this.validateGeneratedImage(imagePath);
      })
            .catch((error) => {
        console.error('海报生成失败:', error);
        this.setData({ isGenerating: false });
        wx.hideLoading();
        
        // 检查是否是Canvas尺寸问题
        if (error && (
          error.errMsg?.includes('exceed size limit') || 
          error.errMsg?.includes('buffer parameter fail') ||
          error.errMsg?.includes('native buffer')
        )) {
          console.log('检测到Canvas尺寸问题，尝试降级处理');
          this.handleCanvasSizeError();
        } else {
          // 其他错误的通用处理
          wx.showToast({
            title: '海报生成失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
  },

  // 处理Canvas尺寸错误的降级方案
  handleCanvasSizeError() {
    console.log('执行Canvas降级处理');
    
    // 强制使用更小的尺寸
    const { originalPosterWidth, originalPosterHeight } = this.data;
    
    // 使用更激进的缩放策略
    const MAX_SAFE_WIDTH = 1200;  // 更保守的最大宽度
    const MAX_SAFE_HEIGHT = 1600; // 更保守的最大高度
    
    let scaleWidth = originalPosterWidth;
    let scaleHeight = originalPosterHeight;
    
    // 强制缩放到安全尺寸
    if (scaleWidth > MAX_SAFE_WIDTH || scaleHeight > MAX_SAFE_HEIGHT) {
      const widthRatio = MAX_SAFE_WIDTH / scaleWidth;
      const heightRatio = MAX_SAFE_HEIGHT / scaleHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      scaleWidth = Math.floor(scaleWidth * ratio);
      scaleHeight = Math.floor(scaleHeight * ratio);
    }
    
    // 重新计算Canvas尺寸
    this.calculateCanvasSize(scaleWidth, scaleHeight);
    
    console.log('降级后Canvas尺寸:', {
      原始尺寸: `${originalPosterWidth}x${originalPosterHeight}`,
      降级尺寸: `${scaleWidth}x${scaleHeight}`,
      最终Canvas: `${this.data.canvasWidth}x${this.data.canvasHeight}`
    });
    
    // 延迟重试生成
    setTimeout(() => {
      console.log('使用降级尺寸重新生成海报');
      this.generatePoster();
    }, 1000);
  },

  // 验证生成的图片
  validateGeneratedImage(imagePath) {
    if (!imagePath) {
      return;
    }

    wx.getFileInfo({
      filePath: imagePath,
      success: (res) => {
        if (res.size === 0) {
          wx.showToast({
            title: '海报生成异常',
            icon: 'none',
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '海报文件异常',
          icon: 'none',
        });
      },
    });
  },

  // 使用 Canvas API 绘制海报
  drawPoster() {
    return new Promise((resolve, reject) => {
      const query = wx.createSelectorQuery();
      query
        .select('#' + this.data.canvasId)
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            reject('Canvas节点获取失败');
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 智能计算DPR，避免Canvas过大
          const systemDpr = wx.getSystemInfoSync().pixelRatio || 2;
          const { canvasWidth, canvasHeight } = this.data;
          
          // 根据Canvas尺寸动态调整DPR
          let dpr = systemDpr;
          const maxPixelsWithDpr = canvasWidth * canvasHeight * dpr * dpr;
          const MAX_SAFE_PIXELS = 12000000; // 安全像素限制（约3464x3464）
          
          if (maxPixelsWithDpr > MAX_SAFE_PIXELS) {
            // 如果DPR导致像素过多，降低DPR
            dpr = Math.sqrt(MAX_SAFE_PIXELS / (canvasWidth * canvasHeight));
            dpr = Math.max(1, Math.min(dpr, 3)); // DPR范围：1-3
          }
          
          dpr = Math.floor(dpr * 10) / 10; // 保留一位小数
          
          console.log('Canvas DPR计算:', {
            系统DPR: systemDpr,
            Canvas尺寸: `${canvasWidth}x${canvasHeight}`,
            使用DPR: dpr,
            实际像素: `${canvasWidth * dpr}x${canvasHeight * dpr}`,
            总像素: Math.floor(canvasWidth * dpr * canvasHeight * dpr)
          });

          // 设置Canvas尺寸
          canvas.width = Math.floor(canvasWidth * dpr);
          canvas.height = Math.floor(canvasHeight * dpr);
          ctx.scale(dpr, dpr);

          // 优化图像质量
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 开始绘制
          this.drawPosterContent(ctx, canvas)
            .then(() => {
              // 生成高质量图片
              wx.canvasToTempFilePath({
                canvas: canvas,
                quality: 1.0, // 最高质量
                success: (res) => {
                  resolve(res.tempFilePath);
                },
                fail: (err) => {
                  reject(err);
                },
              });
            })
            .catch(reject);
        });
    });
  },

  // 绘制海报内容
  drawPosterContent(ctx, canvas) {
    return new Promise((resolve, reject) => {
      const {
        canvasWidth,
        canvasHeight,
        dynamicPosterHeight,
        bottomFixedHeight,
        userInfo,
      } = this.data;

      // 1. 绘制白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. 使用动态计算的尺寸
      const posterHeight = dynamicPosterHeight; // 动态计算的海报高度
      const bottomHeight = bottomFixedHeight; // 固定的底部区域高度

      console.log('Canvas 绘制尺寸:', {
        总画布尺寸: `${canvasWidth}x${canvasHeight}`,
        海报区域高度: posterHeight,
        底部区域高度: bottomHeight,
      });

      // 绘制海报背景图
      try {
        // 3. 绘制海报背景图（保持原始比例）
        const posterImg = canvas.createImage();
        posterImg.onload = () => {
          // 高质量绘制海报背景，保持原始比例
          ctx.drawImage(posterImg, 0, 0, canvasWidth, posterHeight);
          this.continueDrawing(
            ctx,
            canvas,
            resolve,
            reject,
            posterHeight,
            bottomHeight
          );
        };
        posterImg.onerror = () => {
          // 图片加载失败，绘制渐变背景作为兜底
          const gradient = ctx.createLinearGradient(0, 0, 0, posterHeight);
          gradient.addColorStop(0, '#FFF6EF');
          gradient.addColorStop(1, '#FAFAFA');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasWidth, posterHeight);

          this.continueDrawing(
            ctx,
            canvas,
            resolve,
            reject,
            posterHeight,
            bottomHeight
          );
        };
        // 使用后端返回的海报背景图URL
        posterImg.src = this.data.posterUrl;
      } catch (error) {
        // 绘制渐变背景作为兜底
        const gradient = ctx.createLinearGradient(0, 0, 0, posterHeight);
        gradient.addColorStop(0, '#FFF6EF');
        gradient.addColorStop(1, '#FAFAFA');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, posterHeight);

        this.continueDrawing(
          ctx,
          canvas,
          resolve,
          reject,
          posterHeight,
          bottomHeight
        );
      }
    });
  },

  // 继续绘制其他内容
  continueDrawing(ctx, canvas, resolve, reject, posterHeight, bottomHeight) {
    const { canvasWidth, canvasHeight, userInfo } = this.data;

    // 5. 绘制底部白色区域
    const bottomY = posterHeight;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, bottomY, canvasWidth, bottomHeight);

    // 6. 使用flex布局绘制底部内容
    this.loadImages(canvas)
      .then((imageMap) => {
        this.drawBottomFlexLayout(
          ctx,
          imageMap,
          userInfo,
          bottomY,
          canvasWidth,
          bottomHeight
        );
        resolve();
      })
      .catch(() => {
        this.drawBottomFlexLayout(
          ctx,
          {},
          userInfo,
          bottomY,
          canvasWidth,
          bottomHeight
        );
        resolve();
      });
  },

  // 为Canvas API加载图片
  loadImages(canvas) {
    return new Promise((resolve) => {
      const { userInfo } = this.data;
      const imageMap = {};

      const imagePromises = [];

      // 加载头像
      if (userInfo.avatarUrl) {
        const avatarPromise = new Promise((res) => {
          try {
            const avatarImg = canvas.createImage();
            avatarImg.onload = () => res({ key: 'avatar', image: avatarImg });
            avatarImg.onerror = () => res({ key: 'avatar', image: null });
            avatarImg.src = userInfo.avatarUrl;
          } catch (error) {
            res({ key: 'avatar', image: null });
          }
        });
        imagePromises.push(avatarPromise);
      }

      // 加载logo图片
      const logoPromise = new Promise((res) => {
        try {
          const logoImg = canvas.createImage();
          logoImg.onload = () => res({ key: 'logo', image: logoImg });
          logoImg.onerror = () => res({ key: 'logo', image: null });
          logoImg.src = '/images/logo_down.png';
        } catch (error) {
          res({ key: 'logo', image: null });
        }
      });
      imagePromises.push(logoPromise);

      // 加载二维码（处理base64格式）
      const qrcodePromise = new Promise((res) => {
        try {
          const qrImg = canvas.createImage();
          qrImg.onload = () => res({ key: 'qrcode', image: qrImg });
          qrImg.onerror = () => res({ key: 'qrcode', image: null });

          // 直接使用base64或本地图片路径
          const qrcodeUrl =
            this.data.qrcodeUrl || '/pages/share-friend/qrcode.png';
          qrImg.src = qrcodeUrl;
        } catch (error) {
          res({ key: 'qrcode', image: null });
        }
      });
      imagePromises.push(qrcodePromise);

      Promise.all(imagePromises)
        .then((results) => {
          results.forEach((item) => {
            if (item.image) {
              imageMap[item.key] = item.image;
            }
          });
          resolve(imageMap);
        })
        .catch(() => {
          resolve({});
        });
    });
  },

  // Canvas版本的flex布局绘制
  drawBottomFlexLayout(
    ctx,
    imageMap,
    userInfo,
    bottomY,
    canvasWidth,
    bottomHeight
  ) {
    // 参考Poster.vue的简单布局：固定padding 24px，gap 20px（按Canvas比例调整）
    const scale = canvasWidth / 750; // 以750px为基准的缩放比例
    const padding = Math.round(24 * scale); // 固定24px padding（参考Poster.vue）
    const gap = Math.round(20 * scale); // 固定20px gap（参考Poster.vue）

    // 可用宽度（去除左右内边距）
    const availableWidth = canvasWidth - padding * 2;

    // 左侧区域占flex: 1，右侧固定宽度为二维码大小
    const qrSize = Math.round(150 * scale * 0.9); // 140px * scale: 0.8（参考Poster.vue）
    const leftWidth = availableWidth - qrSize - gap;

    const leftContainer = {
      x: padding,
      y: bottomY + padding,
      width: leftWidth,
      height: bottomHeight - padding * 2,
    };

    const rightContainer = {
      x: padding + leftWidth + gap,
      y: bottomY + padding,
      width: qrSize,
      height: bottomHeight - padding * 2,
    };

    console.log('Canvas 底部布局配置:', {
      canvasWidth,
      scale: scale.toFixed(2),
      padding,
      gap,
      qrSize,
      左侧容器: leftContainer,
      右侧容器: rightContainer,
    });

    this.drawLeftContent(
      ctx,
      imageMap.avatar,
      userInfo,
      leftContainer,
      imageMap.logo
    );
    this.drawRightContent(ctx, imageMap.qrcode, rightContainer);
  },

  // Canvas版本的左侧内容绘制
  drawLeftContent(ctx, avatarImage, userInfo, container, logoImage) {
    // 参考Poster.vue的固定尺寸：logo 100px，文字 25px（按Canvas比例调整）
    const scale = this.data.canvasWidth / 750; // 缩放比例
    const avatarSize = Math.round(100 * scale); // 头像固定80px（比logo略小）
    const gap = Math.round(20 * scale); // 固定20px间距（参考Poster.vue）
    const fontSize = Math.round(30 * scale); // 固定25px字体（参考Poster.vue）

    // 头像位置计算
    const avatarX = container.x;
    const textStartX = avatarX + avatarSize + gap;
    const avatarY = container.y + (container.height - avatarSize) / 2;

    // 绘制头像
    if (avatarImage) {
      this.drawCircleImage(ctx, avatarImage, avatarX, avatarY, avatarSize / 2);
    }

    // 文字垂直居中计算
    const lineSpacing = Math.round(16 * scale); // 固定行间距
    const totalTextHeight = fontSize + lineSpacing + fontSize;
    const textStartY = container.y + (container.height - totalTextHeight) / 2;

    // 用户名
    ctx.fillStyle = '#000000';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(
      userInfo.nickName || '快乐学习用户',
      textStartX,
      textStartY + fontSize
    );

    // 邀请文字
    const inviteY = textStartY + fontSize + lineSpacing + fontSize;
    ctx.fillStyle = '#333333';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText('邀你一起', textStartX, inviteY);

    // 测量文字宽度
    const inviteTextWidth = ctx.measureText
      ? ctx.measureText('邀你一起').width
      : fontSize * 4;

    // Logo图片（宽48，高13）
    if (logoImage) {
      const logoWidth = Math.round(48 * scale * 2.3);
      const logoHeight = Math.round(13 * scale * 2.3);
      const logoX = textStartX + inviteTextWidth + 6;
      const logoY = inviteY - logoHeight + 2; // 调整垂直位置，使logo与文字基线对齐

      ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    }

    console.log('Canvas 左侧内容配置:', {
      scale: scale.toFixed(2),
      头像大小: avatarSize,
      字体大小: fontSize,
      间距: gap,
    });
  },

  // Canvas版本的右侧内容绘制
  drawRightContent(ctx, qrcodeImage, container) {
    if (qrcodeImage) {
      // 参考Poster.vue：固定140px二维码，scale: 0.8
      const scale = this.data.canvasWidth / 750; // 缩放比例
      const qrSize = Math.round(150 * scale * 0.9); // 固定140px * scale: 0.8（参考Poster.vue）
      const qrX = container.x + (container.width - qrSize) / 2;
      const qrY = container.y + (container.height - qrSize) / 2;

      ctx.drawImage(qrcodeImage, qrX, qrY, qrSize, qrSize);

      console.log('Canvas 二维码配置:', {
        scale: scale.toFixed(2),
        二维码大小: qrSize,
        二维码位置: `${qrX}, ${qrY}`,
      });
    }
  },

  // 绘制圆形图片
  drawCircleImage(ctx, img, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(img, x, y, radius * 2, radius * 2);
    ctx.restore();
  },

  // 长按保存海报
  onLongPressPoster() {
    if (!this.data.posterImagePath) {
      wx.showToast({
        title: '海报生成中，请稍候',
        icon: 'none',
      });
      return;
    }

    // 检查文件是否存在
    this.checkFileExists(this.data.posterImagePath)
      .then((exists) => {
        if (!exists) {
          wx.showModal({
            title: '提示',
            content: '海报文件丢失，是否重新生成？',
            success: (res) => {
              if (res.confirm) {
                this.generatePoster();
              }
            },
          });
          return;
        }

        wx.showActionSheet({
          itemList: ['保存到相册'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.saveToAlbum();
            }
          },
        });
      })
      .catch((error) => {
        // 即使检查失败，也尝试保存
        wx.showActionSheet({
          itemList: ['保存到相册'],
          success: (res) => {
            if (res.tapIndex === 0) {
              this.saveToAlbum();
            }
          },
        });
      });
  },

  // 检查文件是否存在
  checkFileExists(filePath) {
    return new Promise((resolve, reject) => {
      if (!filePath) {
        resolve(false);
        return;
      }

      wx.getFileInfo({
        filePath: filePath,
        success: (res) => {
          resolve(true);
        },
        fail: (err) => {
          resolve(false);
        },
      });
    });
  },

  // 保存到相册（优化版本）
  saveToAlbum() {
    if (!this.data.posterImagePath) {
      wx.showToast({
        title: '海报未生成',
        icon: 'none',
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '正在保存...',
      mask: true,
    });

    // 检查保存权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          // 用户之前拒绝了授权，引导用户手动开启
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            showCancel: false,
            success: () => {
              wx.openSetting();
            },
          });
        } else {
          // 保存图片
          this.performSave();
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '获取权限失败',
          icon: 'none',
        });
      },
    });
  },

  // 执行保存操作
  performSave() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterImagePath,
      success: (res) => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
        });
      },
      fail: (err) => {
        wx.hideLoading();

        // 详细的错误处理
        if (
          err.errMsg.indexOf('auth deny') !== -1 ||
          err.errMsg.indexOf('authorize') !== -1
        ) {
          // 权限被拒绝
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册权限',
            showCancel: false,
            success: () => {
              wx.openSetting();
            },
          });
        } else if (
          err.errMsg.indexOf('file not found') !== -1 ||
          err.errMsg.indexOf('no such file') !== -1
        ) {
          // 文件不存在，重新生成
          wx.showModal({
            title: '提示',
            content: '海报文件丢失，是否重新生成？',
            success: (res) => {
              if (res.confirm) {
                this.generatePoster();
              }
            },
          });
        } else if (err.errMsg.indexOf('invalid') !== -1) {
          // 文件格式无效，重新生成
          wx.showModal({
            title: '提示',
            content: '海报格式异常，是否重新生成？',
            success: (res) => {
              if (res.confirm) {
                this.generatePoster();
              }
            },
          });
        } else {
          // 其他错误，提供重试选项
          wx.showModal({
            title: '保存失败',
            content: `保存失败: ${err.errMsg}`,
            confirmText: '重试',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 重试保存
                setTimeout(() => {
                  this.saveToAlbum();
                }, 500);
              }
            },
          });
        }
      },
    });
  },

  // 分享给微信好友
  onShareToFriend() {
    // 微信小程序分享功能通过 onShareAppMessage 实现
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none',
    });
  },

  // 分享到朋友圈
  onShareToMoments() {
    if (!this.data.posterImagePath) {
      wx.showToast({
        title: '海报生成中，请稍候',
        icon: 'none',
      });
      return;
    }

    // 保存海报后提示用户手动分享到朋友圈
    this.saveToAlbum();
    setTimeout(() => {
      wx.showModal({
        title: '提示',
        content: '海报已保存到相册，请到微信朋友圈手动发布',
        showCancel: false,
      });
    }, 1000);
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 关闭页面
  onClose() {
    wx.navigateBack();
  },

  // 分享配置
  onShareAppMessage() {
    const { activityId, studentId, employeeId } = this.data;
    return {
      title: `${this.data.userInfo.nickName}邀你一起快乐学习`,
      path: `/pages/new-student-landing/index?id=${activityId}&sid=${studentId}&eid=${employeeId}`,
      imageUrl: this.data.coverImage || '/pages/share-friend/poster.png',
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { activityId, studentId, userInfo, employeeId } = this.data;
    return {
      title: `${userInfo.nickName || '我'}邀你一起快乐学习`,
      path: `/pages/new-student-landing/index?id=${activityId}&sid=${studentId}&eid=${employeeId}`,
      imageUrl: this.data.coverImage || '/pages/share-friend/poster.png',
    };
  },
});
