/**
 * 🎯 نظام إدارة الإعلانات الذكي - الإصلاح النهائي
 * ✅ إصلاح تحميل السكريبتات بشكل صحيح
 * ✅ إضافة atOptions قبل السكريبت مباشرة
 * ✅ حل مشكلة البانرات السوداء نهائياً
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.adElements = new Map();
    this.loadedScripts = new Set();
    this.popunderCount = 0;
    this.adScalingObservers = new Map();
    this.scriptCounter = 0;
  }

  // === نظام تحجيم الإعلانات الذكي ===
  scaleAdElement(adElement) {
    if (!adElement || !adElement.parentElement) return;
    
    const container = adElement.closest('[id^="ad-"]') || adElement.parentElement;
    if (!container) return;
    
    const containerWidth = container.clientWidth || container.offsetWidth;
    const containerHeight = container.clientHeight || container.offsetHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0) return;
    
    let adWidth = 0;
    let adHeight = 0;
    
    if (adElement.tagName === 'IFRAME') {
      try {
        const iframeDoc = adElement.contentDocument || adElement.contentWindow.document;
        const iframeBody = iframeDoc.body;
        if (iframeBody) {
          adWidth = iframeBody.scrollWidth || iframeBody.offsetWidth;
          adHeight = iframeBody.scrollHeight || iframeBody.offsetHeight;
        }
      } catch (e) {
        adWidth = adElement.offsetWidth || adElement.scrollWidth;
        adHeight = adElement.offsetHeight || adElement.scrollHeight;
      }
    } else {
      adWidth = adElement.scrollWidth || adElement.offsetWidth;
      adHeight = adElement.scrollHeight || adElement.offsetHeight;
    }
    
    if (adWidth > containerWidth && containerWidth > 0) {
      const widthScale = containerWidth / adWidth;
      const heightScale = containerHeight / adHeight;
      const scale = Math.min(widthScale, heightScale, 0.95);
      
      adElement.style.transform = `scale(${scale})`;
      adElement.style.transformOrigin = 'top center';
      adElement.style.maxWidth = '100%';
      adElement.style.maxHeight = '100%';
      
      console.log(`📐 تحجيم الإعلان: ${scale.toFixed(2)}`);
    }
  }

  startAdScalingSystem() {
    console.log('📏 بدء نظام تحجيم الإعلانات...');
    
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        document.querySelectorAll('.ad-banner iframe, .ad-banner ins').forEach(ad => {
          this.scaleAdElement(ad);
        });
      }, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setInterval(() => {
      document.querySelectorAll('.ad-banner iframe, .ad-banner ins').forEach(ad => {
        this.scaleAdElement(ad);
      });
    }, 3000);
    
    window.addEventListener('resize', () => {
      document.querySelectorAll('.ad-banner iframe, .ad-banner ins').forEach(ad => {
        this.scaleAdElement(ad);
      });
    });
  }

  // === 1. تحميل الإعدادات ===
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
          console.log('🚫 AdBlock detected - Blocking page access');
          this.blockPageAccess();
          return;
        }
      }
      
      await this.loadAllAds();
      console.log('🎯 تم تفعيل جميع الإعلانات بنجاح');
      
      setTimeout(() => {
        this.startAdScalingSystem();
      }, 5000);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
    }
  }

  // === 2. كشف AdBlock ===
  async detectAdBlockEffectively() {
    console.log('🔍 بدء كشف AdBlock...');
    
    const test1 = await this.testAdElement();
    const test2 = await this.testAdScript();
    const test3 = await this.testAdFetch();
    
    const failures = [test1, test2, test3].filter(Boolean).length;
    const hasAdBlock = failures >= 2;
    
    console.log('📊 النتيجة:', hasAdBlock ? '🚫 ADBLOCK' : '✅ NO ADBLOCK');
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
        const isBlocked = adElement.offsetHeight === 0 || !document.body.contains(adElement);
        if (adElement.parentNode) adElement.remove();
        resolve(isBlocked);
      }, 500);
    });
  }

  async testAdScript() {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
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
      position:fixed;top:0;left:0;width:100vw;height:100vh;
      background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);
      z-index:2147483647;display:flex;align-items:center;justify-content:center;
      color:white;font-family:Arial,sans-serif;text-align:center;padding:20px;
    `;
    overlay.innerHTML = `
      <div style="background:rgba(255,255,255,0.1);padding:40px;border-radius:20px;max-width:600px;">
        <div style="font-size:80px;margin-bottom:20px;">🚫</div>
        <h1 style="color:#ffd700;margin-bottom:20px;">Ad Blocker Detected</h1>
        <p style="margin-bottom:20px;">Please disable your ad blocker to access this site.</p>
        <button onclick="location.reload()" style="
          background:#2ecc71;color:white;border:none;padding:15px 30px;
          border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;">
          I've Disabled Ad Blocker - Refresh
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // === 6. تحميل جميع الإعلانات ===
  async loadAllAds() {
    console.log('📦 بدء تحميل الإعلانات...');
    
    this.loadNativeBanner();
    
    setTimeout(() => this.loadSidebarAds(), 500);
    
    await this.delay(1000);
    this.loadBanners();
    
    await this.delay(2000);
    this.loadSocialBar();
    
    await this.delay(2500);
    this.loadMiddleAd();
    this.loadExtraSidebarAd();
    
    await this.delay(3000);
    this.loadPopunder();
    this.loadSmartlink();
  }

  async loadBanners() {
    console.log('🖼️ تحميل البانرات...');
    
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    if (this.config.banners?.belowIframe?.enabled) {
      setTimeout(() => {
        this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
      }, 1000);
    }
    
    if (this.config.banners?.pageBottom?.enabled) {
      setTimeout(() => {
        this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
      }, 1500);
    }
  }

  loadBannerAd(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container) return;
    
    const ads = bannerConfig.ads;
    if (!ads || ads.length === 0) return;
    
    this.loadSingleAd(container, ads[0], containerId);
    
    if (bannerConfig.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = bannerConfig.rotationInterval || 30000;
      
      if (this.rotationTimers[containerId]) {
        clearInterval(this.rotationTimers[containerId]);
      }
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSingleAd(container, ads[currentIndex], containerId);
      }, interval);
    }
  }

  // === ✅ الدالة المُصلحة نهائياً ===
  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) {
      console.warn(`⚠️ إعلان غير صالح في ${containerId}`);
      return;
    }
    
    console.log(`📢 تحميل: ${ad.id} في ${containerId}`);
    
    const uniqueId = `ad-${this.scriptCounter++}-${Date.now()}`;
    
    // ✅ تنظيف الحاوية
    container.innerHTML = '';
    
    // ✅ إنشاء wrapper بسيط
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-banner';
    wrapper.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="${uniqueId}"></div>
    `;
    container.appendChild(wrapper);
    
    // ✅ تعيين atOptions قبل السكريبت مباشرة
    if (ad.config) {
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.textContent = `
        window.atOptions = ${JSON.stringify(ad.config)};
      `;
      document.body.appendChild(atOptionsScript);
      console.log(`⚙️ تم تعيين atOptions لـ ${ad.id}`);
    }
    
    // ✅ تحميل السكريبت
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = ad.script;
      script.type = 'text/javascript';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      
      script.onload = () => {
        console.log(`✅ نجح تحميل: ${ad.id}`);
        
        // التحقق من الظهور
        setTimeout(() => {
          const adDiv = document.getElementById(uniqueId);
          if (adDiv) {
            const hasContent = adDiv.querySelector('iframe, ins, [id*="container"]');
            if (hasContent) {
              console.log(`✅ الإعلان ظاهر: ${containerId}`);
            } else {
              console.warn(`⚠️ الإعلان لم يظهر في: ${containerId}`);
            }
          }
        }, 3000);
      };
      
      script.onerror = () => {
        console.error(`❌ فشل تحميل: ${ad.id}`);
      };
      
      // ✅ إضافة السكريبت للحاوية المحددة
      const targetDiv = document.getElementById(uniqueId);
      if (targetDiv) {
        targetDiv.appendChild(script);
      }
      
    }, 300);
  }

  loadMiddleAd() {
    if (!this.config.banners?.pageMiddle?.enabled) return;
    this.loadBannerAd('ad-page-middle', this.config.banners.pageMiddle);
  }

  loadExtraSidebarAd() {
    if (!this.config.sidebarAdExtra?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('#ad-sidebar-extra')) return;
    
    const container = document.createElement('div');
    container.id = 'ad-sidebar-extra';
    container.style.cssText = 'min-height:300px;margin:20px 0;';
    
    const existingAd = sidebar.querySelector('#ad-sidebar');
    if (existingAd?.nextSibling) {
      sidebar.insertBefore(container, existingAd.nextSibling);
    } else {
      sidebar.appendChild(container);
    }
    
    this.loadBannerAd('ad-sidebar-extra', this.config.sidebarAdExtra);
  }

  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || sidebar.querySelector('.native-ad-banner')) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner native-ad-banner';
    container.innerHTML = this.config.nativeBanner.html || '<div id="native-banner"></div>';
    
    sidebar.insertBefore(container, sidebar.firstChild);
    
    if (this.config.nativeBanner.script) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = this.config.nativeBanner.script;
        script.async = true;
        document.body.appendChild(script);
        console.log('✅ Native Banner loaded');
      }, 1000);
    }
  }

  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container) {
      this.ensureContainerExists('ad-sidebar');
      return;
    }
    
    const ads = this.config.sidebarAd.ads;
    if (!ads || ads.length === 0) return;
    
    this.loadSidebarAd(container, ads[0]);
    
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = this.config.sidebarAd.rotationInterval || 45000;
      
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSidebarAd(container, ads[currentIndex]);
      }, interval);
    }
  }

  loadSidebarAd(container, ad) {
    const uniqueId = `sidebar-${this.scriptCounter++}-${Date.now()}`;
    
    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'ad-banner ad-sidebar';
    wrapper.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="${uniqueId}"></div>
    `;
    container.appendChild(wrapper);
    
    if (ad.config) {
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.textContent = `
        window.atOptions = ${JSON.stringify(ad.config)};
      `;
      document.body.appendChild(atOptionsScript);
    }
    
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = ad.script;
      script.type = 'text/javascript';
      script.async = true;
      
      script.onload = () => console.log(`✅ Sidebar: ${ad.id}`);
      script.onerror = () => console.error(`❌ Sidebar failed: ${ad.id}`);
      
      const targetDiv = document.getElementById(uniqueId);
      if (targetDiv) targetDiv.appendChild(script);
      
    }, 300);
  }

  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    
    const script = this.config.socialBar.script;
    if (!script || this.loadedScripts.has(script)) return;
    
    setTimeout(() => {
      const scriptEl = document.createElement('script');
      scriptEl.src = script;
      scriptEl.async = true;
      document.body.appendChild(scriptEl);
      this.loadedScripts.add(script);
      console.log('✅ Social Bar loaded');
    }, this.config.socialBar.delay || 5000);
  }

  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const maxPerSession = this.config.popunder.maxPerSession || 1;
    const currentCount = this.sessionData.popunderCount || 0;
    
    if (currentCount >= maxPerSession) {
      console.log(`⚠️ Popunder limit: ${currentCount}/${maxPerSession}`);
      return;
    }
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach((scriptUrl, index) => {
        if (this.loadedScripts.has(scriptUrl)) return;
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        document.body.appendChild(script);
        this.loadedScripts.add(scriptUrl);
        
        console.log(`✅ Popunder ${index + 1} loaded`);
      });
      
      this.sessionData.popunderCount = currentCount + 1;
      this.saveSessionData();
      
    }, this.config.popunder.delay || 8000);
  }

  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    const mode = this.config.smartlink.mode || 'direct';
    
    if (mode === 'popunder' && this.config.smartlink.triggerOnClick) {
      this.setupSmartlinkPopunder();
    } else {
      this.openSmartlinkDirect();
    }
  }

  setupSmartlinkPopunder() {
    const maxShows = this.config.smartlink.maxShowsPerSession || 3;
    const minInterval = this.config.smartlink.minIntervalBetweenShows || 300000;
    
    if (this.sessionData.smartlinkCount >= maxShows) return;
    
    const lastShown = this.sessionData.lastSmartlinkShown;
    if (lastShown && (Date.now() - lastShown) < minInterval) {
      setTimeout(() => this.setupSmartlinkPopunder(), minInterval - (Date.now() - lastShown));
      return;
    }
    
    const handler = (e) => {
      if (e.target.tagName === 'A' && e.target.href?.startsWith('http')) return;
      
      window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
      
      document.removeEventListener('click', handler);
      
      this.sessionData.smartlinkCount = (this.sessionData.smartlinkCount || 0) + 1;
      this.sessionData.lastSmartlinkShown = Date.now();
      this.saveSessionData();
      
      setTimeout(() => {
        if (this.sessionData.smartlinkCount < maxShows) {
          this.setupSmartlinkPopunder();
        }
      }, minInterval);
    };
    
    document.addEventListener('click', handler);
    console.log('✅ Smartlink ready');
  }

  openSmartlinkDirect() {
    if (this.sessionData.smartlinkOpened) return;
    
    setTimeout(() => {
      if (this.config.smartlink.openInNewTab) {
        window.open(this.config.smartlink.url, '_blank');
        this.sessionData.smartlinkOpened = true;
        this.saveSessionData();
      }
    }, this.config.smartlink.delay || 3000);
  }

  fixAdContainers() {
    const containers = ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar', 'ad-page-middle'];
    
    containers.forEach(id => {
      if (document.getElementById(id)) return;
      
      const container = document.createElement('div');
      container.id = id;
      container.style.cssText = 'min-height:90px;margin:15px 0;';
      
      if (id.includes('above') || id.includes('below')) {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
          if (id.includes('above')) {
            gameContainer.prepend(container);
          } else {
            gameContainer.appendChild(container);
          }
        }
      } else if (id.includes('sidebar')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.appendChild(container);
      }
    });
  }

  ensureContainerExists(containerId) {
    let container = document.getElementById(containerId);
    if (container) return container;
    
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'min-height:90px;margin:15px 0;';
    document.body.appendChild(container);
    
    return container;
  }

  getSessionData() {
    try {
      const data = sessionStorage.getItem('adsSessionData');
      return data ? JSON.parse(data) : {
        popunderCount: 0,
        smartlinkCount: 0,
        smartlinkOpened: false,
        lastSmartlinkShown: null
      };
    } catch {
      return {
        popunderCount: 0,
        smartlinkCount: 0,
        smartlinkOpened: false
      };
    }
  }

  saveSessionData() {
    try {
      sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
    } catch (e) {
      console.error('Session save error:', e);
    }
  }

  filterUnityErrors() {
    const original = console.error;
    console.error = function(...args) {
      if (args[0]?.includes?.('referenced script')) return;
      original.apply(console, args);
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    Object.values(this.rotationTimers).forEach(t => clearInterval(t));
    this.loadedScripts.clear();
  }
}

// === تشغيل ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 بدء نظام الإعلانات...');
  
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;
  
  const style = document.createElement('style');
  style.textContent = `
    .ad-banner {
      background: transparent !important;
      padding: 10px;
      margin: 15px auto;
      position: relative;
      min-height: 100px;
      max-width: 100%;
      text-align: center;
    }
    
    .ad-banner > div[id^="ad-"],
    .ad-banner > div[id^="sidebar-"] {
      min-height: 90px;
      width: 100%;
      display: block;
    }
    
    .ad-label {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.5);
      color: rgba(255,255,255,0.7);
      font-size: 9px;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      text-transform: uppercase;
      z-index: 10;
      pointer-events: none;
    }
    
    .ad-sidebar {
      position: sticky;
      top: 100px;
    }
    
    .native-ad-banner {
      background: linear-gradient(135deg, rgba(26,42,108,0.2), rgba(178,31,31,0.2)) !important;
    }
    
    @media (max-width: 768px) {
      .ad-banner {
        padding: 8px;
        margin: 10px auto;
      }
      
      .ad-sidebar {
        position: static !important;
      }
      
      html, body {
        overflow-x: hidden !important;
      }
    }
    
    .ad-banner iframe,
    .ad-banner ins {
      max-width: 100% !important;
      height: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log('🎨 تم تحميل الأنماط');
});
