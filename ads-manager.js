/**
 * 🎯 نظام إدارة الإعلانات - الإصلاح النهائي
 * ✅ إصلاح البانرات السوداء بالكامل
 * ✅ طريقة جديدة لتحميل الإعلانات
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.loadedScripts = new Set();
  }

  async init() {
    try {
      this.filterUnityErrors();
      this.fixAdContainers();
      
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      
      this.config = await response.json();
      console.log('✅ تم تحميل إعدادات الإعلانات');
      
      const antiAdblockEnabled = this.config.antiAdblock?.enabled ?? true;
      
      if (antiAdblockEnabled) {
        console.log('🔍 Anti-AdBlock مُفعّل - بدء الفحص...');
        const adBlockDetected = await this.detectAdBlockEffectively();
        
        if (adBlockDetected) {
          console.log('🚫 AdBlock detected');
          this.blockPageAccess();
          return;
        }
      }
      
      await this.loadAllAds();
      console.log('🎯 تم تفعيل جميع الإعلانات');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
    }
  }

  // === AdBlock Detection ===
  async detectAdBlockEffectively() {
    const test1 = await this.testAdElement();
    const test2 = await this.testAdScript();
    const test3 = await this.testAdFetch();
    
    const failures = [test1, test2, test3].filter(Boolean).length;
    const hasAdBlock = failures >= 2;
    
    this.isAdBlockDetected = hasAdBlock;
    return hasAdBlock;
  }

  async testAdElement() {
    return new Promise(resolve => {
      const adElement = document.createElement('div');
      adElement.className = 'ad ads advertisement';
      adElement.style.cssText = 'position:fixed;top:-9999px;width:728px;height:90px;';
      document.body.appendChild(adElement);
      
      setTimeout(() => {
        const isBlocked = adElement.offsetHeight === 0;
        if (adElement.parentNode) adElement.remove();
        resolve(isBlocked);
      }, 500);
    });
  }

  async testAdScript() {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.onload = () => resolve(false);
      script.onerror = () => resolve(true);
      document.head.appendChild(script);
      setTimeout(() => resolve(true), 2000);
    });
  }

  async testAdFetch() {
    try {
      await fetch('https://google-analytics.com/analytics.js', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return false;
    } catch {
      return true;
    }
  }

  blockPageAccess() {
    const overlay = document.createElement('div');
    overlay.id = 'adblock-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui;
    `;
    
    overlay.innerHTML = `
      <div style="text-align:center;padding:40px;max-width:600px;">
        <div style="font-size:80px;margin-bottom:20px;">🚫</div>
        <h1 style="color:#ffd700;margin-bottom:20px;">Ad Blocker Detected</h1>
        <p style="margin-bottom:30px;">Please disable your ad blocker to access this content.</p>
        <button onclick="location.reload()" style="
          background:#2ecc71;
          color:white;
          border:none;
          padding:15px 30px;
          border-radius:8px;
          cursor:pointer;
          font-size:16px;
          font-weight:bold;
        ">Refresh Page</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  // === تحميل الإعلانات - الطريقة المُحسّنة ===
  async loadAllAds() {
    console.log('📦 بدء تحميل الإعلانات...');
    
    // Native Banner
    this.loadNativeBanner();
    
    await this.delay(800);
    
    // البانرات
    this.loadBanners();
    
    await this.delay(1500);
    
    // Sidebar
    this.loadSidebarAds();
    
    await this.delay(2000);
    
    // Social Bar
    this.loadSocialBar();
    
    await this.delay(2500);
    
    // Middle & Extra
    this.loadMiddleAd();
    this.loadExtraSidebarAd();
    
    await this.delay(3500);
    
    // Interactive
    this.loadPopunder();
    this.loadSmartlink();
  }

  // === تحميل البانرات - الطريقة الصحيحة ===
  loadBanners() {
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerSet('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    setTimeout(() => {
      if (this.config.banners?.belowIframe?.enabled) {
        this.loadBannerSet('ad-below-iframe', this.config.banners.belowIframe);
      }
    }, 1000);
    
    setTimeout(() => {
      if (this.config.banners?.pageBottom?.enabled) {
        this.loadBannerSet('ad-page-bottom', this.config.banners.pageBottom);
      }
    }, 1500);
  }

  // === الدالة الرئيسية لتحميل إعلان واحد - الإصلاح الكامل ===
  loadBannerSet(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container || !config.ads || config.ads.length === 0) return;
    
    let currentIndex = 0;
    
    // تحميل أول إعلان
    this.injectAd(container, config.ads[currentIndex]);
    
    // التدوير
    if (config.rotation && config.ads.length > 1) {
      if (this.rotationTimers[containerId]) {
        clearInterval(this.rotationTimers[containerId]);
      }
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % config.ads.length;
        this.injectAd(container, config.ads[currentIndex]);
        console.log(`🔄 تدوير ${containerId}`);
      }, config.rotationInterval || 30000);
    }
  }

  // === حقن الإعلان - الطريقة الصحيحة 100% ===
  injectAd(container, adConfig) {
    // تنظيف الحاوية
    container.innerHTML = '';
    
    // إنشاء wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-banner';
    wrapper.style.cssText = `
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 15px;
      position: relative;
      min-height: ${adConfig.config?.height || 90}px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Label
    const label = document.createElement('div');
    label.className = 'ad-label';
    label.textContent = 'Advertisement';
    label.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      padding: 3px 8px;
      font-size: 10px;
      border-radius: 3px;
      z-index: 10;
    `;
    wrapper.appendChild(label);
    
    // إنشاء DIV للإعلان - هذا هو المفتاح!
    const adDiv = document.createElement('div');
    const uniqueKey = `ad_${adConfig.config?.key}_${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '_');
    adDiv.id = uniqueKey;
    wrapper.appendChild(adDiv);
    
    container.appendChild(wrapper);
    
    // الآن نُحمّل السكريبت بالطريقة الصحيحة
    setTimeout(() => {
      // تعيين atOptions في window بشكل صحيح
      const optionsKey = `atOptions_${uniqueKey}`;
      window[optionsKey] = {
        key: adConfig.config?.key,
        format: adConfig.config?.format || 'iframe',
        height: adConfig.config?.height || 90,
        width: adConfig.config?.width || 728,
        params: {}
      };
      
      console.log(`✅ تم إنشاء ${optionsKey}:`, window[optionsKey]);
      
      // إنشاء السكريبت
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = adConfig.script;
      script.async = true;
      
      script.onload = () => {
        console.log(`✅ تم تحميل إعلان: ${adConfig.id}`);
      };
      
      script.onerror = () => {
        console.warn(`⚠️ فشل: ${adConfig.id}`);
        wrapper.innerHTML += `<div style="color:rgba(255,255,255,0.3);text-align:center;">Ad loading...</div>`;
      };
      
      // إضافة السكريبت إلى الـ DIV نفسه
      adDiv.appendChild(script);
      
    }, 100);
  }

  // === Sidebar Ads ===
  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container || !this.config.sidebarAd.ads) return;
    
    let currentIndex = 0;
    const ads = this.config.sidebarAd.ads;
    
    this.injectAd(container, ads[currentIndex]);
    
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.injectAd(container, ads[currentIndex]);
      }, this.config.sidebarAd.rotationInterval || 45000);
    }
  }

  // === Native Banner ===
  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('.native-ad-banner')) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner native-ad-banner';
    container.innerHTML = this.config.nativeBanner.html || '';
    sidebar.insertBefore(container, sidebar.firstChild);
    
    if (this.config.nativeBanner.script) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = this.config.nativeBanner.script;
        script.async = true;
        container.appendChild(script);
        console.log('✅ Native Banner loaded');
      }, 500);
    }
  }

  // === Middle Ad ===
  loadMiddleAd() {
    if (!this.config.banners?.pageMiddle?.enabled) return;
    
    let container = document.getElementById('ad-page-middle');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ad-page-middle';
      container.style.cssText = 'margin: 30px 0;';
      
      const gameInfo = document.querySelector('.game-info');
      if (gameInfo?.parentNode) {
        gameInfo.parentNode.insertBefore(container, gameInfo.nextSibling);
      }
    }
    
    this.loadBannerSet('ad-page-middle', this.config.banners.pageMiddle);
  }

  // === Extra Sidebar ===
  loadExtraSidebarAd() {
    if (!this.config.sidebarAdExtra?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    let container = document.getElementById('ad-sidebar-extra');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ad-sidebar-extra';
      container.style.cssText = 'margin: 20px 0;';
      
      const mainSidebar = sidebar.querySelector('#ad-sidebar');
      if (mainSidebar) {
        sidebar.insertBefore(container, mainSidebar.nextSibling);
      } else {
        sidebar.appendChild(container);
      }
    }
    
    this.loadBannerSet('ad-sidebar-extra', this.config.sidebarAdExtra);
  }

  // === Social Bar ===
  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    
    const script = this.config.socialBar.script;
    if (!script || this.loadedScripts.has(script)) return;
    
    setTimeout(() => {
      const scriptEl = document.createElement('script');
      scriptEl.src = script;
      scriptEl.async = true;
      scriptEl.id = 'social-bar-script';
      document.body.appendChild(scriptEl);
      this.loadedScripts.add(script);
      console.log('✅ Social Bar loaded');
    }, this.config.socialBar.delay || 5000);
  }

  // === Popunder ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const maxPerSession = this.config.popunder.maxPerSession || 1;
    const currentCount = this.sessionData.popunderCount || 0;
    
    if (currentCount >= maxPerSession) {
      console.log('⚠️ Popunder limit reached');
      return;
    }
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach((scriptUrl, index) => {
        if (this.loadedScripts.has(scriptUrl)) return;
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.id = `popunder-script-${index}`;
        document.body.appendChild(script);
        this.loadedScripts.add(scriptUrl);
      });
      
      this.sessionData.popunderCount = currentCount + 1;
      this.saveSessionData();
    }, this.config.popunder.delay || 8000);
  }

  // === Smartlink ===
  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    if (this.sessionData.smartlinkOpened) {
      console.log('⚠️ Smartlink already opened');
      return;
    }
    
    setTimeout(() => {
      if (this.config.smartlink.openInNewTab) {
        const tab = window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
        if (tab) {
          this.sessionData.smartlinkOpened = true;
          this.saveSessionData();
        }
      }
    }, this.config.smartlink.delay || 3000);
  }

  // === Helper Functions ===
  fixAdContainers() {
    ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar'].forEach(id => {
      if (!document.getElementById(id)) {
        const div = document.createElement('div');
        div.id = id;
        div.style.margin = '20px 0';
        
        if (id.includes('sidebar')) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.appendChild(div);
        } else if (id.includes('above')) {
          const gameFrame = document.querySelector('.game-frame');
          if (gameFrame?.parentNode) {
            gameFrame.parentNode.insertBefore(div, gameFrame);
          }
        } else if (id.includes('below')) {
          const gameFrame = document.querySelector('.game-frame');
          if (gameFrame?.parentNode) {
            gameFrame.parentNode.insertBefore(div, gameFrame.nextSibling);
          }
        }
      }
    });
  }

  getSessionData() {
    try {
      const data = sessionStorage.getItem('adsSessionData');
      return data ? JSON.parse(data) : {
        popunderCount: 0,
        smartlinkOpened: false,
        sessionId: Date.now()
      };
    } catch {
      return { popunderCount: 0, smartlinkOpened: false };
    }
  }

  saveSessionData() {
    try {
      sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    }
  }

  filterUnityErrors() {
    const originalError = console.error;
    console.error = function(...args) {
      const msg = args[0]?.toString() || '';
      if (!msg.includes('referenced script') && !msg.includes('is missing')) {
        originalError.apply(console, args);
      }
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    Object.values(this.rotationTimers).forEach(timer => clearInterval(timer));
    this.rotationTimers = {};
    this.loadedScripts.clear();
  }
}

// === Auto-initialize ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 تشغيل نظام الإعلانات...');
    const adsManager = new AdsManager();
    adsManager.init();
    window.adsManager = adsManager;
  });
} else {
  console.log('🚀 تشغيل نظام الإعلانات...');
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;
}
