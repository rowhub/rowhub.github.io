/**
 * 🎯 نظام إدارة الإعلانات الذكي - النسخة النهائية المستقرة
 * ✅ حل مشكلة Popunder (مرة واحدة في الجلسة)
 * ✅ تحسين مظهر البانرات (بدون مساحات فارغة)
 * ✅ دعم كامل للموبايل وتوسيط الإعلانات
 * ✅ فلترة متقدمة لأخطاء Unity في الكونسول
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    // نستخدم sessionStorage لضمان العمل "مرة واحدة في الجلسة" حتى بعد التحديث
    this.sessionData = this.getSessionData();
    this.loadedScripts = new Set();
  }

  // === 1. تهيئة النظام ===
  async init() {
    try {
      this.filterUnityErrors();
      
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      this.config = await response.json();
      
      console.log('✅ تم تحميل الإعدادات بنجاح');

      // فحص AdBlock
      if (this.config.antiAdblock?.enabled) {
        const isBlocked = await this.detectAdBlock();
        if (isBlocked) {
          this.blockPageAccess();
          return;
        }
      }

      this.fixAdContainers();
      this.loadAllAds();
      
    } catch (error) {
      console.error('❌ AdsManager Error:', error);
    }
  }

  // === 2. كشف AdBlock ===
  async detectAdBlock() {
    const test = document.createElement('div');
    test.className = 'adsbox ads advertisement';
    test.style.cssText = 'position:absolute;left:-999px;top:-999px;width:1px;height:1px;';
    document.body.appendChild(test);
    
    return new Promise(resolve => {
      setTimeout(() => {
        const isBlocked = test.offsetHeight === 0 || window.getComputedStyle(test).display === 'none';
        test.remove();
        resolve(isBlocked);
      }, 500);
    });
  }

  // === 3. تحميل الإعلانات بالترتيب ===
  loadAllAds() {
    console.log('📦 بدء توزيع الإعلانات...');
    
    // 1. Social Bar (سريع)
    this.loadSocialBar();
    
    // 2. البانرات الأساسية
    this.loadBanners();
    
    // 3. إعلانات Sidebar
    this.loadSidebarAds();
    this.loadExtraSidebarAd();
    
    // 4. Popunder (بذكاء)
    this.loadPopunder();
  }

  // === 4. نظام تحميل البانرات (إصلاح الحجم والمظهر) ===
  loadBanners() {
    const sections = ['aboveIframe', 'belowIframe', 'pageBottom', 'pageMiddle'];
    sections.forEach(section => {
      const cfg = this.config.banners?.[section];
      if (cfg?.enabled) {
        const containerId = `ad-${section.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        this.renderBanner(containerId, cfg);
      }
    });
  }

  renderBanner(containerId, bannerConfig) {
    const container = document.getElementById(containerId);
    if (!container || !bannerConfig.ads.length) return;

    let currentIndex = 0;
    const updateAd = () => {
      const ad = bannerConfig.ads[currentIndex];
      this.injectAdScript(container, ad, containerId);
      if (bannerConfig.rotation) {
        currentIndex = (currentIndex + 1) % bannerConfig.ads.length;
      }
    };

    updateAd();
    if (bannerConfig.rotation) {
      this.rotationTimers[containerId] = setInterval(updateAd, bannerConfig.rotationInterval || 30000);
    }
  }

  injectAdScript(container, ad, containerId) {
    const uniqueId = `ad_${Math.random().toString(36).substr(2, 9)}`;
    
    // إعداد أوبشنز أدستيرا
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, ad.config);

    // إنشاء الهيكل (تم التخلص من الخلفيات والحدود المزعجة هنا)
    container.innerHTML = `
      <div class="ad-wrapper" style="width:100%; display:flex; justify-content:center; align-items:center; margin:10px 0;">
        <div id="${uniqueId}" style="min-height:50px; position:relative;">
          <small style="position:absolute; top:-15px; right:0; font-size:9px; color:#666;">Advertisement</small>
        </div>
      </div>
    `;

    const script = document.createElement('script');
    script.src = ad.script;
    script.async = true;
    
    const target = document.getElementById(uniqueId);
    if (target) target.appendChild(script);
  }

  // === 5. البوب اندر (الحل النهائي للتكرار) ===
  loadPopunder() {
    const cfg = this.config.popunder;
    if (!cfg?.enabled) return;

    // التحقق من sessionStorage (يُحذف عند إغلاق المتصفح، ويبقى عند الـ Refresh)
    const shownCount = parseInt(sessionStorage.getItem('popunder_count') || '0');
    
    if (shownCount >= (cfg.maxPerSession || 1)) {
      console.log('✅ Popunder already shown this session.');
      return;
    }

    setTimeout(() => {
      cfg.scripts.forEach((src, i) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        document.body.appendChild(s);
      });
      
      sessionStorage.setItem('popunder_count', (shownCount + 1).toString());
      console.log('🚀 Popunder Triggered');
    }, cfg.delay || 5000);
  }

  // === 6. Sidebar & Social Bar ===
  loadSidebarAds() {
    if (this.config.sidebarAd?.enabled) {
      this.renderBanner('ad-sidebar', this.config.sidebarAd);
    }
  }

  loadExtraSidebarAd() {
    if (this.config.sidebarAdExtra?.enabled) {
      this.renderBanner('ad-sidebar-extra', this.config.sidebarAdExtra);
    }
  }

  loadSocialBar() {
    if (this.config.socialBar?.enabled) {
      setTimeout(() => {
        const s = document.createElement('script');
        s.src = this.config.socialBar.script;
        document.body.appendChild(s);
        console.log('📱 Social Bar Loaded');
      }, this.config.socialBar.delay || 3000);
    }
  }

  // === 7. أدوات مساعدة ===
  fixAdContainers() {
    const ids = ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar', 'ad-sidebar-extra', 'ad-page-middle'];
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        const div = document.createElement('div');
        div.id = id;
        document.body.appendChild(div);
      }
    });
  }

  filterUnityErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;
    const ignoreList = ['script', 'Unity', 'missing', 'WebGL', 'deprecated', 'Permissions policy'];

    console.error = (...args) => {
      if (typeof args[0] === 'string' && ignoreList.some(term => args[0].includes(term))) return;
      originalError.apply(console, args);
    };
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && ignoreList.some(term => args[0].includes(term))) return;
      originalWarn.apply(console, args);
    };
  }

  getSessionData() {
    return { popunderCount: parseInt(sessionStorage.getItem('popunder_count') || '0') };
  }

  blockPageAccess() {
    document.body.innerHTML = `
      <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#1a1a1a; color:white; font-family:sans-serif; text-align:center; padding:20px;">
        <h1>🚫 AdBlock Detected</h1>
        <p>Please disable AdBlock to support our free games.</p>
        <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer; background:#ff4444; border:none; color:white; border-radius:5px;">I've disabled it, refresh!</button>
      </div>
    `;
  }
}

// التشغيل
document.addEventListener('DOMContentLoaded', () => {
  const ads = new AdsManager();
  ads.init();
  
  // تنسيق CSS مدمج لضمان التجاوب
  const style = document.createElement('style');
  style.textContent = `
    iframe, ins, .ad-wrapper div { max-width: 100% !important; height: auto !important; }
    #ad-sidebar, #ad-sidebar-extra { display: block; margin: 10px auto; text-align: center; }
    @media (max-width: 768px) {
      #ad-sidebar, #ad-sidebar-extra { display: none; } /* إخفاء السايدبار في الموبايل لعدم تشويه المنظر */
    }
  `;
  document.head.appendChild(style);
});
