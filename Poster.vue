<template>
  <van-popup
    style="background: none"
    v-model="popupVisible"
    @closed="closePopup"
  >
    <!-- 海报容器 -->
    <div>
      <div
        ref="posterWrapper"
        class="poster-wrapper"
        :style="{
          height: isInvite ? dynamicWrapperHeight + 'px' : '600px',
          scale: isInvite ? '0.95' : '1',
        }"
      >
        <!-- 原始海报容器，生成图片前显示 -->
        <transition name="fade">
          <div
            v-if="!generatedImage && !isInvite"
            ref="poster"
            class="poster-container"
            :style="{
              backgroundImage: 'url(' + templateBg + ')',
              transform: isRendering ? 'scale(0.5)' : 'scale(0.5)',
              transformOrigin: 'top left',
            }"
          >
            <div class="qrcode-container">
              <canvas ref="qrcode" />
            </div>
          </div>
          <!-- 邀新海报 -->
          <div
            v-if="!generatedImage && isInvite"
            class="invite-poster-container"
            :style="{
              height: dynamicWrapperHeight + 'px',
            }"
          >
            <div
              ref="poster"
              class="invite-poster-wrapper"
              :style="{
                transform: isRendering ? 'scale(0.5)' : 'scale(0.5)',
                transformOrigin: 'top left',
                height: dynamicContainerHeight + 'px',
              }"
            >
              <!-- 上半部分：原始海报 -->
              <div
                class="poster-top"
                :style="{
                  backgroundImage: 'url(' + templateBg + ')',
                  height: dynamicPosterHeight + 'px',
                  backgroundPosition: getPosterBackgroundPosition(),
                }"
              ></div>

              <!-- 下半部分：logo + 文字 + 二维码 -->
              <div class="poster-bottom">
                <div class="bottom-content">
                  <!-- 左侧：logo + 文字 -->
                  <div class="left-section">
                    <img src="../assets/logo.png" class="logo" alt="logo" />
                    <div class="invite-text">{{ inviteText }}</div>
                  </div>

                  <!-- 右侧：二维码 -->
                  <div class="right-section">
                    <canvas ref="qrcode" class="qr-canvas" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- 生成的图片，替代海报容器 -->
        <transition name="fade">
          <div
            v-if="generatedImage"
            class="generated-image-container"
            :style="{
              height: isInvite ? dynamicWrapperHeight + 'px' : '600px',
            }"
          >
            <img :src="generatedImage" class="generated-image" @click.stop />
          </div>
        </transition>
      </div>

      <!-- 下载按钮或关闭按钮 -->
      <div
        v-if="!generatedImage"
        class="btn"
        @click="downloadPoster"
      >
        点击后长按保存
      </div>
      <!-- <div v-else class="btn" @click="closePopup">点击关闭</div> -->
    </div>
  </van-popup>
</template>

<script>
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { getWxCode, getQueryValue, decryptAES } from '@/utils/index';
import { getWxTicket } from '@/api/common';
import wx from 'weixin-js-sdk';
import OSS from 'ali-oss';
import { getCosConfig } from '@/api/common';
import { Toast, showSuccessToast } from 'vant';

export default {
  name: 'Poster',
  props: {
    qrCodeUrl: {
      type: String,
      default: null, // 默认二维码链接
    },
    templateBg: {
      type: String,
    },
    popupVisible: {
      type: Boolean,
    },
    isInvite: {
      type: [Boolean, String],
      default: false,
    },
  },

  watch: {
    popupVisible(newVal, oldVal) {
      if (newVal) {
        this.initWechatSDK();
        this.$nextTick(function() {
          this.generateQRCode();
          // 如果是邀新海报，加载背景图片并计算尺寸
          if (this.isInvite) {
            this.loadPosterImage();
          }
        });
        // 重置生成的图片
        this.generatedImage = '';
      }
    },

    templateBg(newVal) {
      // 当背景图片URL变化时，重新加载并计算尺寸
      if (newVal && this.isInvite) {
        this.loadPosterImage();
      }
    },
  },
  data() {
    return {
      client: null,
      cosImgUrlPrefix: '',
      isRendering: false, // 控制渲染状态
      generatedImage: '', // 存储生成的图片URL
      loadingImage: false, // 控制图片加载状态
      toastInstance: null, // 存储Toast实例
      userInfo: null, // 用户信息
      posterImageLoaded: false, // 海报图片是否已加载
      dynamicPosterHeight: 1040, // 动态计算的海报高度
      dynamicContainerHeight: 1200, // 动态计算的容器总高度（1040+160）
      dynamicWrapperHeight: 600, // 动态计算的外层容器高度（缩放后）
    };
  },

  computed: {
    // 生成邀请文本
    inviteText() {
      if (!this.userInfo?.userName) {
        return '邀你一起参与活动';
      }
      // 处理用户名，中间用*代替
      const userName = this.userInfo.userName;
      // if (userName.length <= 2) {
      //   return `${userName}老师邀你一起参与活动`;
      // }
      const maskedName = userName.charAt(0) + '*';
      return `${maskedName}老师邀你一起参与活动`;
    },
  },

  created() {
    this.initOSSClient();
    // 获取用户信息
    this.getUserInfo();
  },

  mounted() {
    // 如果组件挂载时已经有背景图片且是邀新海报，立即加载
    if (this.templateBg && this.isInvite && this.popupVisible) {
      this.loadPosterImage();
    }
  },

  methods: {
    // 获取用户信息
    getUserInfo() {
      try {
        const userInfoStr = localStorage.getItem('userinfo');
        if (userInfoStr) {
          this.userInfo = JSON.parse(userInfoStr);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    },

    // 加载海报图片并计算动态尺寸
    loadPosterImage() {
      if (!this.templateBg) return;

      const img = new Image();
      img.crossOrigin = 'anonymous'; // 处理跨域问题

      img.onload = () => {
        // 确保DOM已经渲染后再计算尺寸
        this.$nextTick(() => {
          this.calculateDynamicSize(img.naturalWidth, img.naturalHeight);
          this.posterImageLoaded = true;
        });
      };

      img.onerror = () => {
        // 使用默认尺寸
        this.posterImageLoaded = true;
      };

      img.src = this.templateBg;
    },

    // 根据图片比例获取最佳背景定位
    getPosterBackgroundPosition() {
      // 如果图片还没加载完成，使用默认定位
      if (!this.posterImageLoaded) {
        return 'center';
      }

      // 这里可以根据实际需求调整不同比例图片的定位策略
      // 比如高图片可能需要显示顶部，宽图片显示中心等
      return 'center';
    },

    // 根据图片原始尺寸计算动态容器尺寸
    calculateDynamicSize(imageWidth, imageHeight) {
      // 动态获取实际显示容器宽度（适应不同设备）
      let displayWidth = 320; // 默认宽度

      // 多种方式尝试获取实际的容器宽度
      if (this.$refs.posterWrapper) {
        const rect = this.$refs.posterWrapper.getBoundingClientRect();
        if (rect.width > 0) {
          displayWidth = rect.width;
        }
      } else {
        // 如果无法获取容器宽度，尝试使用视口宽度的一个合理比例
        const viewportWidth =
          window.innerWidth || document.documentElement.clientWidth;
        displayWidth = Math.min(viewportWidth - 40, 320); // 减去一些边距，最大320px
      }

      // 内部放大2倍用于高清渲染
      const scaleRatio = 2;
      const posterWidth = displayWidth * scaleRatio;

      // 根据图片原始比例计算对应的高度
      const imageRatio = imageHeight / imageWidth;
      const calculatedHeight = posterWidth * imageRatio;

      // 下半部分固定高度160px
      const bottomHeight = 160;

      // 为了适应不确定的海报比例，设置一些边界限制
      const minPosterHeight = 400; // 最小海报高度
      const maxPosterHeight = 1600; // 最大海报高度（适应更多比例）

      // 根据图片比例类型进行不同处理
      let finalHeight;

      if (imageRatio < 0.8) {
        // 极宽图片（宽度远大于高度）
        finalHeight = Math.max(minPosterHeight, calculatedHeight);
      } else if (imageRatio > 3.0) {
        // 极高图片（高度远大于宽度）
        finalHeight = Math.min(maxPosterHeight, calculatedHeight);
      } else {
        // 常规比例图片
        finalHeight = Math.max(
          minPosterHeight,
          Math.min(maxPosterHeight, calculatedHeight)
        );
      }

      // 计算总的容器高度
      this.dynamicPosterHeight = Math.round(finalHeight);
      this.dynamicContainerHeight = Math.round(finalHeight + bottomHeight);
      this.dynamicWrapperHeight = Math.round(this.dynamicContainerHeight * 0.5); // 缩放0.5倍

      // 确保最小显示高度（避免过小的容器）
      const minWrapperHeight = 300; // 外层容器最小高度
      if (this.dynamicWrapperHeight < minWrapperHeight) {
        this.dynamicWrapperHeight = minWrapperHeight;
        this.dynamicContainerHeight = minWrapperHeight * 2;
        this.dynamicPosterHeight = this.dynamicContainerHeight - bottomHeight;
      }

      console.log('动态尺寸计算:', {
        原图尺寸: `${imageWidth}x${imageHeight}`,
        显示宽度: `${displayWidth}px`,
        渲染宽度: `${posterWidth}px (${scaleRatio}x缩放)`,
        图片比例: imageRatio.toFixed(2),
        比例类型:
          imageRatio < 0.8 ? '极宽' : imageRatio > 3.0 ? '极高' : '常规',
        计算高度: Math.round(calculatedHeight),
        最终高度: this.dynamicPosterHeight,
        容器总高度: this.dynamicContainerHeight,
        外层容器高度: this.dynamicWrapperHeight,
      });
    },

    closePopup() {
      this.generatedImage = '';
      this.$emit('closePopup');
      // 清除可能存在的Toast
      if (this.toastInstance) {
        this.toastInstance.clear();
      }
    },
    async initWechatSDK() {
      let _that = this;
      _that.loading = true;
      getWxTicket(window.location.href.split('#')[0]).then((res) => {
        if (res.code === 200) {
          let { timestamp, nonceStr, signature } = res.data;
          wx.config({
            beta: true,
            // debug: true,
            appId: 'wxef9adcf3f56bb5af',
            timestamp, // 必填，生成签名的时间戳
            nonceStr, // 必填，生成签名的随机串
            signature, // 必填，签名，见附录-JS-SDK使用权限签名算法
            jsApiList: ['imagePreview'], //必填
            success: function(res) {},
            fail: (res) => {
              _that.loading = false;
              alert('config失败:' + JSON.stringify(res));
              if (res.errMsg.indexOf('function not exist') > -1) {
                alert('版本过低请升级');
              }
            },
          });
          wx.ready(function() {
            // 在这里调用需要使用的JS接口
            wx.checkJsApi({
              jsApiList: ['imagePreview'],
              success: function(res) {},
            });
          });
        }
      });
    },
    // 生成二维码
    async generateQRCode() {
      try {
        const qrcodeElement = this.$refs.qrcode;
        await QRCode.toCanvas(qrcodeElement, this.qrCodeUrl, {
          margin: 2,
        });
      } catch (error) {}
    },

    // 下载海报
    async downloadPoster() {
      // 显示 loading
      // 清除可能存在的Toast
      if (this.toastInstance) {
        this.toastInstance.clear();
      }

      // 创建新的loading Toast
      this.toastInstance = Toast.loading({
        message: '海报生成中...',
        forbidClick: true, // 禁止背景点击
        duration: 0, // 持续显示
      });

      try {
        // 准备截图前，先放大元素
        this.isRendering = true;

        // 等待DOM更新
        await this.$nextTick();

        const posterElement = this.$refs.poster;

        // 使用 html2canvas 将 DOM 转换为图片
        const canvas = await html2canvas(posterElement, {
          useCORS: true,
          scale: 4, // 使用2倍缩放比例
          logging: false,
          allowTaint: true,
          backgroundColor: null,
          imageTimeout: 0,
          removeContainer: true,
        });

        // 截图完成后，恢复元素状态
        this.isRendering = false;

        // 获取原始尺寸
        const box = window.getComputedStyle(posterElement);
        const width = parseInt(box.width, 10);
        const height = parseInt(box.height, 10);
        // 创建新的canvas，用于质量优化
        const finalCanvas = document.createElement('canvas');
        // 设置目标尺寸
        finalCanvas.width = width;
        finalCanvas.height = height;
        finalCanvas.style.borderRadius = '12px';
        const ctx = finalCanvas.getContext('2d');
        // 设置平滑缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 绘制图像并缩放
        ctx.drawImage(canvas, 0, 0, width, height);

        // 将优化后的canvas添加边距后转换为blob
        const margin = 0; // 可根据需要调整边距大小
        const marginCanvas = document.createElement('canvas');
        marginCanvas.width = finalCanvas.width + margin * 2;
        marginCanvas.height = finalCanvas.height + margin * 2;
        //设置borderradius 12px
        marginCanvas.style.borderRadius = '12px';

        // 创建带 alpha 通道的上下文以保留透明度
        const mCtx = marginCanvas.getContext('2d', { alpha: true });
        // 确保画布初始透明
        mCtx.clearRect(0, 0, marginCanvas.width, marginCanvas.height);
        mCtx.imageSmoothingEnabled = true;
        mCtx.imageSmoothingQuality = 'high';
        // 将原图绘制到带边距的画布中心位置
        mCtx.drawImage(finalCanvas, margin, margin);
        // 转为 blob 并上传
        marginCanvas.toBlob(
          async (blob) => {
            try {
              // 生成唯一的文件名
              const filename = `posters/${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}.png`;

              // 上传到阿里云 OSS
              const result = await this.client.put(filename, blob, {
                progress: (p) => {
                  const percent = Math.floor(p * 100);
                  // 更新上传进度
                },
              });

              if (result.url) {
                const imgUrl = result.url;
                // 关闭 loading
                if (this.toastInstance) {
                  this.toastInstance.clear();
                }

                // 预加载图片以防止闪烁
                this.loadingImage = true;
                const img = new Image();
                img.onload = () => {
                  // 图片加载完成后更新状态
                  this.generatedImage = imgUrl;
                  this.loadingImage = false;

                  // 关闭任何可能存在的提示
                  if (this.toastInstance) {
                    this.toastInstance.clear();
                  }

                  // 提示用户长按保存 - 使用较长的时间并阻止点击
                  this.toastInstance = Toast({
                    message: '图片生成成功，长按图片可保存',
                    duration: 1500,
                    forbidClick: true,
                    type: 'success',
                  });
                };
                img.src = imgUrl;
              } else {
                throw new Error('上传失败');
              }
            } catch (error) {
              Toast.fail('上传图片失败，请重试');
            } finally {
              if (this.toastInstance) {
                this.toastInstance.clear();
              }
            }
          },
          'image/png',
          1
        );
      } catch (error) {
        this.isRendering = false; // 确保发生错误时也恢复状态

        if (this.toastInstance) {
          this.toastInstance.clear();
        }

        this.toastInstance = Toast.fail({
          message: '生成海报失败，请重试',
          duration: 3000,
        });
      }
    },

    async initOSSClient() {
      try {
        const resp = await getCosConfig();
        const data = resp.data || {};
        let decryptedConfig = {};
        Object.keys(data).forEach((key) => {
          decryptedConfig[key] = decryptAES(data[key]);
        });

        // 保存 cosImgUrlPrefix
        this.cosImgUrlPrefix = decryptedConfig.cosImgUrlPrefix;

        // 检查必要参数
        if (
          !decryptedConfig.region ||
          !decryptedConfig.secretId ||
          !decryptedConfig.secretKey ||
          !decryptedConfig.bucketName
        ) {
          throw new Error('OSS 配置信息不完整');
        }

        // 处理 region，取第一段
        const region = decryptedConfig.region.split('.')[0];

        // 初始化 OSS 客户端
        this.client = new OSS({
          region: region,
          accessKeyId: decryptedConfig.secretId,
          accessKeySecret: decryptedConfig.secretKey,
          bucket: decryptedConfig.bucketName,
        });
      } catch (error) {
        this.$toast?.('初始化存储客户端失败');
      }
    },
  },
};
</script>

<style scoped>
.poster-wrapper {
  width: 320px; /* 基础宽度，实际会根据图片比例动态调整高度 */
  height: 640px; /* 默认高度，邀新海报会动态覆盖此值 */
  overflow: hidden;
  position: relative;
}

.poster-container {
  width: 640px; /* 放大2倍 */
  height: 1200px; /* 放大2倍 */
  background-color: #f0f0f0;
  padding: 40px; /* 放大2倍 */
  box-sizing: border-box;
  text-align: center;
  background-size: 100% 100%;
  border-radius: 12px; /* 放大2倍 */
}

.qrcode-container {
  width: 100%;
  height: 100%;
  padding: 40px; /* 放大2倍 */
  position: relative;
}

.qrcode-container canvas {
  position: absolute !important;
  bottom: 0 !important;
  right: 0 !important;
  width: 108px !important; /* 放大2倍 */
  height: 108px !important; /* 放大2倍 */
  margin-bottom: 14px !important; /* 放大2倍 */
  margin-right: 6px !important; /* 放大2倍 */
  border-radius: 6px !important; /* 放大2倍 */
  transform: scale(0.95) !important;
}

/* 邀新海报样式 */
.invite-poster-container {
  width: 320px; /* 基础显示宽度 */
  height: 640px; /* 默认高度，会被动态样式覆盖 */
  overflow: hidden;
  position: relative;
}

.invite-poster-wrapper {
  width: 640px; /* 内部渲染宽度（2倍缩放用于高清显示） */
  height: 1280px; /* 默认渲染高度，会被动态样式覆盖 */
  background-color: #ffffff;
  border-radius: 12px; /* 放大2倍 */
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.poster-top {
  width: 100%;
  height: 1040px; /* 默认高度，会被动态覆盖 */
  background-size: cover; /* 使用cover填满容器 */
  background-position: center;
  background-repeat: no-repeat;
  flex-shrink: 0;
}

.poster-bottom {
  width: 100%;
  height: 160px; /* 增加下半部分高度以适应logo和文字 */
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 24px; /* 放大2倍 */
  box-sizing: border-box;
  flex-shrink: 0;
}

.bottom-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.left-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px; /* 放大2倍 */
}

.logo {
  width: 100px; /* 放大2倍 */
  height: auto;
  object-fit: contain;
}

.invite-text {
  font-size: 25px; /* 放大2倍 */
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  text-align: left;
  max-width: 300px; /* 放大2倍 */
  margin-top: 10px;
}

.right-section {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-canvas {
  width: 140px !important; /* 放大2倍 */
  height: 140px !important; /* 放大2倍 */
  border-radius: 12px !important; /* 放大2倍 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  scale: 0.8;
}

/* 生成的图片容器样式 */
.generated-image-container {
  width: 320px;
  height: 640px; /* 匹配邀新海报的新高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
}

.generated-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
}

/* 添加过渡效果 - 兼容Vue 2.x */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave {
  opacity: 1;
}

.btn {
  margin: 20px auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 15px;
  color: #000;
  background: #fff;
  border-radius: 20px;

  width: 260px;
  height: 46px;
  border-radius: 100px;
  background-color: rgba(255, 255, 255, 1);

  line-height: 23px;
  color: rgba(51, 51, 51, 51);
  font-size: 16px;
  text-align: center;
  font-family: PingFangSC-regular;
  scale: 0.95;
  margin-top: 10px;

  /* 简单点击效果 */
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.3s ease,
    background-color 0.3s ease;
}

/* 点击按下效果 */
.btn:active {
  transform: scale(0.9);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  background-color: rgba(240, 240, 240, 0.9);
}
</style>
