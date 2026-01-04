/**
 * 🎯 نظام إدارة الإعلانات الذكي - النسخة النهائية (Full Fit Fix)
 * ✅ حل مشكلة قص الإعلانات (Clipping)
 * ✅ الإعلان يظهر كاملاً دائماً (Zoom Out تلقائي)
 * ✅ الحفاظ على التصميم الزجاجي العصري
 * ✅ نفس نظام الحماية والتدوير
 */

class AdsManager {
  constructor() {
    this.config = null;
    this.rotationTimers = {};
    this.sessionData = this.getSessionData();
    this.isAdBlockDetected = false;
    this.adElements = new Map();
    this.loadedScripts = new Set();
    this.isMobile = this.detectMobile();
    this.setupResponsiveListener();
  }

  detectMobile() {
    return window.innerWidth <= 768;
  }

  // === 1. التهيئة (بدون تغيير) ===
  async init() {
    try {
      this.filterUnityErrors();
      this.fixAdContainers();
      
      const response = await fetch('ads.json');
      if (!response.ok) throw new Error('Failed to load ads.json');
      
      this.config = await response.json();
      console.log('✅ Modern Ads System: Full Fit Version Loaded');
      
      if (this.config.antiAdblock?.enabled ?? true) {
        if (await this.detectAdBlockEffectively()) {
          this.blockPageAccess();
          return;
        }
      }
      
      await this.loadAllAds();
      
      // فحص متكرر لضمان تحجيم الإعلانات المتأخرة
      setInterval(() => this.applySmartScaling(), 2000);
      
    } catch (error) {
      console.error('❌ Error:', error);
      this.showFallbackAds();
    }
  }

  setupResponsiveListener() {
    window.addEventListener('resize', () => {
      this.isMobile = this.detectMobile();
      this.adjustAdsForScreenSize();
      setTimeout(() => this.applySmartScaling(), 100);
    });
  }

  adjustAdsForScreenSize() {
    document.querySelectorAll('.ad-sidebar, #ad-sidebar, #ad-sidebar-extra').forEach(el => {
      el.style.display = this.isMobile ? 'none' : 'block';
    });
  }

  // === 🌟 الجوهر: دالة التصغير الجبري (Force Fit) ===
  applySmartScaling() {
    const wrappers = document.querySelectorAll('.ad-content-scaler');
    
    wrappers.forEach(scaler => {
      const container = scaler.closest('.ad-modern-wrapper');
      if (!container) return;

      // 1. إعادة الوضع الطبيعي للحساب الدقيق
      scaler.style.transform = 'none';
      scaler.style.width = 'auto';
      
      // 2. الحصول على الأبعاد الحقيقية للمحتوى الداخلي (الإعلان)
      // نبحث عن العنصر العريض داخل السكيلر (iframe أو div)
      const contentChild = scaler.firstElementChild; 
      if (!contentChild) return;

      const adWidth = contentChild.offsetWidth || contentChild.scrollWidth;
      const adHeight = contentChild.offsetHeight || contentChild.scrollHeight;
      
      // 3. الحصول على العرض المتاح في الشاشة/الحاوية
      // نستخدم clientWidth للحاوية ونطرح الـ padding
      const availableWidth = container.clientWidth - 30; // 30px padding
      
      // 4. الحساب الرياضي
      if (adWidth > availableWidth && adWidth > 0) {
        const scale = availableWidth / adWidth; // مثال: 350 / 728 = 0.48
        
        // تطبيق التصغير
        scaler.style.transform = `scale(${scale})`;
        scaler.style.transformOrigin = 'center top'; // التثبيت من الأعلى والمنتصف
        scaler.style.width = `${adWidth}px`; // تثبيت العرض ليتمكن الـ CSS من توسيطه
        
        // 🚨 خطوة مهمة جداً: تعديل ارتفاع الحاوية لإزالة الفراغ الناتج عن التصغير
        // الارتفاع الجديد = الارتفاع الأصلي * نسبة التصغير
        const newHeight = adHeight * scale;
        container.style.height = `${newHeight + 40}px`; // +40 للبادينغ والـ label
        container.style.minHeight = '0'; // إلغاء الحد الأدنى القديم
      } else {
        // إذا كان الإعلان صغيراً ومناسباً
        scaler.style.width = '100%';
        container.style.height = 'auto';
      }
      
      // إظهار الإعلان بعد انتهاء الحسابات
      scaler.style.opacity = '1';
    });
  }

  // === نفس دوال الحقن والعرض السابقة ===
  
  detectAdBlockEffectively() { /* نفس الكود السابق تماماً */ return Promise.resolve(false); } // اختصار للكود هنا فقط
  // ... (افترض وجود دوال AdBlock هنا كما في الكود السابق) ...
  blockPageAccess() { /* نفس الكود السابق */ }
  disableOriginalPage() { document.body.classList.add('adblock-blocked'); }

  async loadAllAds() {
    this.loadNativeBanner();
    if (!this.isMobile) this.loadSidebarAds();
    this.loadBanners();
    this.loadSocialBar();
    this.loadMiddleAd();
    if (!this.isMobile) this.loadExtraSidebarAd();
    this.loadPopunder();
    this.loadSmartlink();
  }

  loadBanners() {
    const b = this.config?.banners;
    if (b?.aboveIframe?.enabled) this.renderModernBanner('ad-above-iframe', b.aboveIframe);
    if (b?.belowIframe?.enabled) setTimeout(() => this.renderModernBanner('ad-below-iframe', b.belowIframe), 1000);
    if (b?.pageBottom?.enabled) setTimeout(() => this.renderModernBanner('ad-page-bottom', b.pageBottom), 1500);
  }
  
  loadMiddleAd() { if (this.config?.banners?.pageMiddle?.enabled) this.renderModernBanner('ad-page-middle', this.config.banners.pageMiddle); }
  loadExtraSidebarAd() { if (this.config?.sidebarAdExtra?.enabled && !this.isMobile) this.renderModernBanner('ad-sidebar-extra', this.config.sidebarAdExtra); }
  loadSidebarAds() { if (this.config?.sidebarAd?.enabled && !this.isMobile) this.renderModernBanner('ad-sidebar', this.config.sidebarAd); }

  renderModernBanner(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container || !bannerConfig.ads.length) return;
    if (this.isMobile && containerId.includes('sidebar')) { container.style.display='none'; return; }

    container.classList.add('modern-ad-slot');
    
    let idx = 0;
    const update = () => {
      this.injectModernAd(container, bannerConfig.ads[idx]);
      idx = (idx + 1) % bannerConfig.ads.length;
    };
    update();
    if (bannerConfig.rotation) {
        if(this.rotationTimers[containerId]) clearInterval(this.rotationTimers[containerId]);
        this.rotationTimers[containerId] = setInterval(update, bannerConfig.rotationInterval || 30000);
    }
  }

  injectModernAd(container, ad) {
    if (!ad || !ad.script) return;
    const uid = `ad_${Math.random().toString(36).substr(2, 9)}`;
    
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, { ...ad.config, params: ad.config?.params || {} });

    container.innerHTML = `
      <div class="ad-modern-wrapper">
        <div class="ad-label-modern">SPONSORED</div>
        <div id="loader-${uid}" class="ad-skeleton-loader"></div>
        <div id="${uid}" class="ad-content-scaler"></div>
      </div>
    `;

    setTimeout(() => {
        const s = document.createElement('script');
        s.src = ad.script; s.async = true; s.setAttribute('data-cfasync', 'false');
        s.onload = () => {
             document.getElementById(`loader-${uid}`).style.display = 'none';
             // ننتظر قليلاً ليرسم الإعلان نفسه ثم نقوم بالتصغير
             setTimeout(() => this.applySmartScaling(), 500);
             setTimeout(() => this.applySmartScaling(), 2000); // تأكيد
        };
        const target = document.getElementById(uid);
        if (target) target.appendChild(s);
    }, 50);
  }

  loadNativeBanner() { /* نفس الكود السابق */ }
  loadSocialBar() { /* نفس الكود السابق */ }
  loadPopunder() { /* نفس الكود السابق */ }
  loadSmartlink() { /* نفس الكود السابق */ }
  
  fixAdContainers() { ['ad-above-iframe', 'ad-below-iframe', 'ad-page-bottom', 'ad-sidebar', 'ad-page-middle'].forEach(id => this.ensureContainerExists(id)); }
  ensureContainerExists(id) { 
      let c = document.getElementById(id); 
      if(!c) { c=document.createElement('div'); c.id=id; document.body.appendChild(c); } 
      return c; 
  }
  getSessionData() { return JSON.parse(sessionStorage.getItem('adsSessionData')) || {}; }
  filterUnityErrors() {}
}

document.addEventListener('DOMContentLoaded', () => {
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;

  // === CSS المطور لحل مشكلة القص ===
  const style = document.createElement('style');
  style.textContent = `
    :root { --ad-bg: rgba(20, 20, 35, 0.8); --ad-border: rgba(255,255,255,0.1); }
    
    .modern-ad-slot {
      display: block; width: 100%; margin: 20px auto; 
      text-align: center; clear: both;
    }

    .ad-modern-wrapper {
      background: var(--ad-bg);
      border: 1px solid var(--ad-border);
      border-radius: 12px;
      padding: 15px; 
      position: relative;
      overflow: hidden; /* يمنع الخروج */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: height 0.3s ease; /* نعومة عند تغيير الارتفاع */
      min-height: 90px;
    }

    .ad-label-modern {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      background: #000; color: #fff; font-size: 9px; padding: 2px 8px;
      border-radius: 0 0 6px 6px; z-index: 10;
    }

    .ad-skeleton-loader {
      width: 100%; height: 90px; background: rgba(255,255,255,0.05); border-radius: 4px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%{opacity:0.6} 50%{opacity:1} 100%{opacity:0.6} }

    /* === 🚨 السحر هنا: Scaler Configuration === */
    .ad-content-scaler {
      display: inline-block; /* ضروري ليأخذ حجم محتواه */
      opacity: 0;
      transition: opacity 0.4s ease;
      white-space: nowrap; /* يمنع نزول العناصر لسطر جديد */
      line-height: 0; /* يمنع الفراغات العمودية */
    }
    
    .ad-content-scaler iframe, 
    .ad-content-scaler > div {
        display: inline-block !important;
    }

    /* الموبايل */
    @media (max-width: 768px) {
       #ad-sidebar, #ad-sidebar-extra { display: none !important; }
       .modern-ad-slot { margin: 10px auto; }
       .ad-modern-wrapper { padding: 10px 5px; } /* تقليل البادينغ للجوال */
    }
  `;
  document.head.appendChild(style);
});
