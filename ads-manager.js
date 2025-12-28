/**
 * 🎯 نظام إدارة الإعلانات الذكي - النسخة المصححة
 * يعمل مع ads.json بشكل كامل
 * جميع الإعلانات من الشركة الإعلانية مدمجة
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.adElements = new Map();
    this.adBlockChecks = [];
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
      
      // 🔍 أولاً: تحميل الإعلانات الأساسية
      await this.loadAdsSequentially();
      
      console.log('🎯 تم تفعيل جميع الإعلانات بنجاح');
      
      // 🔍 ثانياً: فحص AdBlock بعد تحميل الإعلانات
      setTimeout(() => {
        this.detectAdBlockIntelligent();
      }, 3000);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
      this.showFallbackAds();
    }
  }

  // === 2. كشف AdBlock الذكي ===
  detectAdBlockIntelligent() {
    console.log('🔍 بدء فحص AdBlock الذكي...');
    
    // اختبار 1: فحص إذا كانت الإعلانات قد ظهرت بالفعل
    this.checkIfAdsAreActuallyVisible();
    
    // اختبار 2: فحص السكريبتات المحملة
    this.checkLoadedScripts();
    
    // اختبار 3: محاولة تحميل إعلان تجريبي
    this.loadTestAd();
    
    // الانتظار والتحليل النهائي
    setTimeout(() => {
      this.analyzeAdBlockResults();
    }, 2000);
  }

  checkIfAdsAreActuallyVisible() {
    console.log('🔍 فحص ظهور الإعلانات...');
    
    const adContainers = [
      'ad-above-iframe',
      'ad-below-iframe',
      'ad-page-bottom',
      'ad-sidebar'
    ];
    
    adContainers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        const adContent = container.querySelector('iframe, img, .ad-banner');
        const hasContent = container.innerHTML.trim().length > 50;
        
        console.log(`📊 ${containerId}:`, {
          exists: !!container,
          hasAdElement: !!adContent,
          hasContent: hasContent,
          height: container.offsetHeight,
          htmlLength: container.innerHTML.length
        });
        
        if (container.offsetHeight < 10 && hasContent) {
          this.adBlockChecks.push({
            container: containerId,
            result: 'ADBLOCK_SUSPECTED',
            reason: 'Container has content but zero height'
          });
        }
      }
    });
  }

  checkLoadedScripts() {
    console.log('🔍 فحص السكريبتات المحملة...');
    
    const scripts = document.querySelectorAll('script[src*="highperformanceformat"], script[src*="effectivegatecpm"]');
    console.log(`📊 عدد سكريبتات الإعلانات المحملة: ${scripts.length}`);
    
    if (scripts.length === 0) {
      this.adBlockChecks.push({
        type: 'SCRIPTS',
        result: 'ADBLOCK_SUSPECTED',
        reason: 'No ad scripts loaded'
      });
    }
  }

  loadTestAd() {
    console.log('🔍 تحميل إعلان اختباري...');
    
    // إنشاء إعلان اختباري
    const testAd = document.createElement('div');
    testAd.id = 'ad-block-test-ad';
    testAd.style.cssText = 'width: 728px; height: 90px; background: #f0f0f0; border: 2px dashed #ccc; margin: 10px auto; text-align: center; line-height: 90px; color: #666;';
    testAd.innerHTML = 'Test Advertisement Area';
    
    // إضافة كلاس يحاول AdBlock حجبه
    testAd.classList.add('ad', 'ads', 'advertisement', 'ad-banner');
    
    const testContainer = document.getElementById('ad-above-iframe') || document.body;
    testContainer.appendChild(testAd);
    
    // فحص بعد فترة
    setTimeout(() => {
      const isHidden = 
        testAd.offsetHeight === 0 || 
        testAd.offsetWidth === 0 ||
        testAd.style.display === 'none' ||
        window.getComputedStyle(testAd).display === 'none';
      
      console.log(`📊 Test Ad Status:`, {
        height: testAd.offsetHeight,
        width: testAd.offsetWidth,
        display: testAd.style.display,
        computedDisplay: window.getComputedStyle(testAd).display,
        isHidden: isHidden
      });
      
      if (isHidden) {
        this.adBlockChecks.push({
          type: 'TEST_AD',
          result: 'ADBLOCK_SUSPECTED',
          reason: 'Test ad was hidden'
        });
      }
      
      // تنظيف الإعلان الاختباري
      testAd.remove();
    }, 1000);
  }

  analyzeAdBlockResults() {
    console.log('📊 تحليل نتائج فحص AdBlock:', this.adBlockChecks);
    
    // حساب النتائج
    const suspectedCount = this.adBlockChecks.filter(check => check.result === 'ADBLOCK_SUSPECTED').length;
    const totalChecks = this.adBlockChecks.length;
    
    // فقط إذا كان هناك شكوك قوية نعرض التحذير
    if (suspectedCount >= 2 && totalChecks >= 2) {
      this.isAdBlockDetected = true;
      console.log('🚫 تم اكتشاف AdBlock بناءً على تحليل شامل');
      
      // عرض تحذير AdBlock فقط إذا كان مفعلاً في الإعدادات
      if (this.config.antiAdblock?.enabled) {
        this.showAdBlockWarning();
      }
    } else {
      console.log('✅ لا يوجد AdBlock مكتشف - النظام يعمل بشكل طبيعي');
    }
  }

  // === 3. عرض تحذير AdBlock ===
  showAdBlockWarning() {
    console.log('⚠️ عرض تحذير AdBlock...');
    
    // إنشاء عنصر التحذير
    const warning = document.createElement('div');
    warning.id = 'adblock-warning';
    warning.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(231, 76, 60, 0.95);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      z-index: 999999;
      max-width: 400px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      border-left: 5px solid #c0392b;
    `;
    
    warning.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="font-size: 24px;">⚠️</div>
        <h4 style="margin: 0; font-size: 16px;">Ad Blocker Detected</h4>
      </div>
      <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
        We've detected an ad blocker. Some features may not work properly.
      </p>
      <div style="display: flex; gap: 10px;">
        <button onclick="location.reload()" style="
          background: white;
          color: #e74c3c;
          border: none;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
        ">
          Refresh
        </button>
        <button onclick="document.getElementById('adblock-warning').style.display='none'" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 13px;
        ">
          Dismiss
        </button>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    // إضافة أنيميشن
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // إخفاء التلقائي بعد 10 ثواني
    setTimeout(() => {
      if (warning.parentNode) {
        warning.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
          if (warning.parentNode) {
            warning.remove();
          }
        }, 500);
      }
    }, 10000);
  }

  // === 4. تحميل البانرات ===
  async loadBanners() {
    // فوق iframe
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    // تحت iframe
    if (this.config.banners?.belowIframe?.enabled) {
      setTimeout(() => {
        this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
      }, 1000);
    }
    
    // أسفل الصفحة
    if (this.config.banners?.pageBottom?.enabled) {
      setTimeout(() => {
        this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
      }, 1500);
    }
  }

  loadBannerAd(containerId, bannerConfig) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`❌ Container ${containerId} not found`);
      return;
    }
    
    container.innerHTML = '';
    
    const ads = bannerConfig.ads;
    if (!ads || ads.length === 0) {
      this.showFallbackBanner(container, bannerConfig);
      return;
    }
    
    // تحميل أول إعلان
    this.loadSingleAd(container, ads[0], containerId);
    
    // التدوير إذا كان مفعل
    if (bannerConfig.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = bannerConfig.rotationInterval || 30000;
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSingleAd(container, ads[currentIndex], containerId);
      }, interval);
    }
  }

  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) {
      this.showFallbackBanner(container, {});
      return;
    }
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner';
    adDiv.id = `ad-${ad.id}-${containerId}`;
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="banner-${ad.id}" style="text-align:center;min-height:${ad.config?.height || 90}px;"></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
      if (ad.config) {
        window.atOptions = ad.config;
      }
      
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.onload = () => console.log(`✅ Ad ${ad.id} loaded`);
      script.onerror = () => {
        console.warn(`⚠️ Ad ${ad.id} failed`);
        this.showFallbackBanner(container, {});
      };
      
      const targetElement = document.getElementById(`banner-${ad.id}`);
      if (targetElement) {
        targetElement.appendChild(script);
      } else {
        console.warn(`❌ Target element for ad ${ad.id} not found`);
      }
    }, 300);
  }

  showFallbackBanner(container, bannerConfig) {
    if (bannerConfig.fallbackHtml) {
      container.innerHTML = bannerConfig.fallbackHtml;
    }
    // ملاحظة: لا نعرض فولباك تلقائياً
  }

  // === 5. تحميل Native Banner ===
  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar') || document.getElementById('ad-sidebar');
    if (!sidebar) return;
    
    if (document.querySelector('.native-ad-banner')) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner native-ad-banner';
    container.innerHTML = this.config.nativeBanner.html || '<div id="native-banner-container"></div>';
    
    sidebar.insertBefore(container, sidebar.firstChild);
    
    if (this.config.nativeBanner.script) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = this.config.nativeBanner.script;
        script.async = true;
        container.appendChild(script);
      }, 1000);
    }
  }

  // === 6. تحميل إعلانات Sidebar ===
  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container) return;
    
    const ads = this.config.sidebarAd.ads;
    if (!ads || ads.length === 0) {
      this.showFallbackSidebar(container);
      return;
    }
    
    this.loadSidebarAd(container, ads[0]);
    
    // التدوير
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = this.config.sidebarAd.rotationInterval || 35000;
      
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSidebarAd(container, ads[currentIndex]);
      }, interval);
    }
  }

  loadSidebarAd(container, ad) {
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner ad-sidebar';
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="sidebar-${ad.id}" style="text-align:center;min-height:${ad.config?.height || 300}px;"></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
      window.atOptions = ad.config;
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      const targetElement = document.getElementById(`sidebar-${ad.id}`);
      if (targetElement) {
        targetElement.appendChild(script);
      }
    }, 300);
  }

  showFallbackSidebar(container) {
    // لا نعرض فولباك تلقائياً
  }

  // === 7. تحميل Popunder ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const frequency = this.config.popunder.frequency;
    if (frequency === 'once_per_session' && this.sessionData.popunderShown) {
      return;
    }
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach(scriptUrl => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        document.body.appendChild(script);
      });
      
      this.sessionData.popunderShown = true;
      this.saveSessionData();
    }, this.config.popunder.delay || 5000);
  }

  // === 8. تحميل Smartlink ===
  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    const frequency = this.config.smartlink.frequency;
    if (frequency === 'once_per_session' && this.sessionData.smartlinkOpened) {
      return;
    }
    
    const openSmartlink = () => {
      setTimeout(() => {
        if (this.config.smartlink.openInNewTab) {
          const newTab = window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
          if (newTab) {
            this.sessionData.smartlinkOpened = true;
            this.saveSessionData();
          }
        } else {
          window.location.href = this.config.smartlink.url;
        }
      }, this.config.smartlink.delay || 2000);
    };
    
    const checkGameLoaded = (attempt = 1) => {
      const iframe = document.getElementById('game-iframe');
      
      if (iframe && iframe.contentWindow) {
        openSmartlink();
      } else if (attempt < 10) {
        setTimeout(() => checkGameLoaded(attempt + 1), 1000);
      } else {
        openSmartlink();
      }
    };
    
    setTimeout(() => checkGameLoaded(), 3000);
  }

  // === 9. تحميل الإعلانات بالتسلسل ===
  async loadAdsSequentially() {
    // 1. إعلانات سريعة
    this.loadNativeBanner();
    this.loadSidebarAds();
    
    // 2. بانرات اللعبة
    await this.delay(1000);
    this.loadBanners();
    
    // 3. إعلانات تفاعلية
    await this.delay(2000);
    this.loadPopunder();
    this.loadSmartlink();
  }

  // === 10. فحص وإصلاح الحاويات ===
  fixAdContainers() {
    ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar'].forEach(containerId => {
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.cssText = 'min-height:50px;';
        
        if (containerId === 'ad-sidebar') {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) sidebar.prepend(container);
        } else {
          const gameContainer = document.querySelector('.game-container');
          if (gameContainer) gameContainer.appendChild(container);
        }
      }
    });
  }

  // === 11. عرض إعلانات فولباك ===
  showFallbackAds() {
    const containers = [
      'ad-above-iframe',
      'ad-below-iframe', 
      'ad-page-bottom',
      'ad-sidebar'
    ];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="ad-banner" style="background:linear-gradient(135deg,#1a2a6c,#b21f1f);padding:15px;border-radius:8px;text-align:center;">
            <div class="ad-label">Ad</div>
            <h4 style="color:#ffd700;margin:10px 0;">Advertisement</h4>
            <p style="color:rgba(255,255,255,0.8);">Ad loading failed</p>
          </div>
        `;
      }
    });
  }

  // === 12. إدارة الجلسة ===
  getSessionData() {
    const data = sessionStorage.getItem('adsSessionData');
    return data ? JSON.parse(data) : {
      popunderShown: false,
      smartlinkOpened: false
    };
  }

  saveSessionData() {
    sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
  }

  // === 13. تصفية أخطاء Unity ===
  filterUnityErrors() {
    const originalError = console.error;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string') {
        const errorMsg = args[0];
        if (errorMsg.includes('The referenced script') || errorMsg.includes('is missing!')) {
          return;
        }
      }
      originalError.apply(console, args);
    };
  }

  // === 14. دالة مساعدة للتأخير ===
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === 15. تنظيف الموارد ===
  destroy() {
    Object.values(this.rotationTimers).forEach(timer => clearInterval(timer));
    this.rotationTimers = {};
  }
}

// === تشغيل تلقائي ===
document.addEventListener('DOMContentLoaded', () => {
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;
  
  // إضافة أنماط CSS
  const style = document.createElement('style');
  style.textContent = `
    .ad-banner {
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      position: relative;
    }
    .ad-label {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);
});
