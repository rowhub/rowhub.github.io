/**
 * 🎯 نظام إدارة الإعلانات الذكية - النسخة المُصلحة والمُحسّنة
 * ✅ إصلاح البانرات السوداء
 * ✅ إصلاح تحميل الإعلانات
 * ✅ إصلاح atOptions conflicts
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
    this.scriptCounter = 0; // عداد للسكريبتات
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
      } else {
        console.log('⚠️ Anti-AdBlock معطّل - تخطي الفحص');
      }
      
      await this.loadAllAds();
      console.log('🎯 تم تفعيل جميع الإعلانات بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإعلانات:', error);
      this.showFallbackAds();
    }
  }

  // === 2. كشف AdBlock بشكل فعال ===
  async detectAdBlockEffectively() {
    console.log('🔍 بدء كشف AdBlock...');
    
    const test1 = await this.testAdElement();
    console.log('📊 Test 1 - Element Test:', test1 ? 'BLOCKED' : 'PASSED');
    
    const test2 = await this.testAdScript();
    console.log('📊 Test 2 - Script Test:', test2 ? 'BLOCKED' : 'PASSED');
    
    const test3 = await this.testAdFetch();
    console.log('📊 Test 3 - Fetch Test:', test3 ? 'BLOCKED' : 'PASSED');
    
    const failures = [test1, test2, test3].filter(Boolean).length;
    const hasAdBlock = failures >= 2;
    
    console.log('📊 النتيجة النهائية:', hasAdBlock ? '🚫 ADBLOCK DETECTED' : '✅ NO ADBLOCK');
    this.isAdBlockDetected = hasAdBlock;
    
    return hasAdBlock;
  }

  async testAdElement() {
    return new Promise(resolve => {
      const adElement = document.createElement('div');
      adElement.id = 'adblock-test-element-' + Date.now();
      
      const adClasses = ['ad', 'ads', 'advertisement', 'advert', 'ad-banner'];
      adClasses.forEach(className => adElement.classList.add(className));
      
      adElement.innerHTML = `<div style="width: 728px; height: 90px; background: #1a2a6c;"></div>`;
      adElement.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 728px;
        height: 90px;
        z-index: -999999;
        visibility: hidden;
      `;
      
      document.body.appendChild(adElement);
      
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(adElement);
        const isBlocked = 
          adElement.offsetHeight === 0 ||
          adElement.offsetWidth === 0 ||
          computedStyle.display === 'none' ||
          computedStyle.visibility === 'hidden';
        
        if (adElement.parentNode) {
          adElement.parentNode.removeChild(adElement);
        }
        
        resolve(isBlocked);
      }, 500);
    });
  }

  async testAdScript() {
    return new Promise(resolve => {
      const testScript = document.createElement('script');
      testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      testScript.id = 'adblock-test-script-' + Date.now();
      testScript.async = true;
      
      let scriptLoaded = false;
      let scriptBlocked = false;
      
      testScript.onload = () => {
        scriptLoaded = true;
        resolve(false);
      };
      
      testScript.onerror = () => {
        scriptBlocked = true;
        resolve(true);
      };
      
      document.head.appendChild(testScript);
      
      setTimeout(() => {
        if (!scriptLoaded && !scriptBlocked) {
          if (testScript.parentNode) {
            testScript.parentNode.removeChild(testScript);
          }
          resolve(true);
        }
      }, 2000);
    });
  }

  async testAdFetch() {
    try {
      await fetch('https://google-analytics.com/analytics.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return false;
    } catch (error) {
      return true;
    }
  }

  // === 3. حجب الصفحة عند اكتشاف AdBlock ===
  blockPageAccess() {
    console.log('⛔ حجب الوصول إلى الصفحة...');
    
    const blockOverlay = document.createElement('div');
    blockOverlay.id = 'adblock-block-overlay';
    blockOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      padding: 20px;
      text-align: center;
      color: white;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    `;
    
    blockOverlay.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 40px;
        max-width: 800px;
        width: 90%;
        border: 2px solid rgba(255, 68, 68, 0.5);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-size: 80px; color: #ff4444; margin-bottom: 20px;">🚫</div>
        <h1 style="font-size: 2.5rem; color: #ffd700; margin-bottom: 20px;">Ad Blocker Detected</h1>
        
        <div style="background: rgba(0, 0, 0, 0.4); border-radius: 15px; padding: 25px; margin-bottom: 25px; line-height: 1.7; text-align: left;">
          <p style="font-size: 18px; margin-bottom: 15px;">
            <strong>We have detected that you are using an ad blocker.</strong>
          </p>
          
          <p style="margin-bottom: 15px; font-size: 16px;">
            Our website is <strong>100% free</strong> and relies exclusively on advertisements to operate.
          </p>
          
          <div style="background: rgba(255, 68, 68, 0.2); border-left: 4px solid #ff4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #ffd700;">
              ⚠️ <strong>Access Denied:</strong> You cannot access the game with ad blocker enabled.
            </p>
          </div>
        </div>
        
        <button onclick="window.location.reload()" style="
          background: linear-gradient(135deg, #2ecc71, #27ae60);
          color: white;
          border: none;
          padding: 16px 35px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          transition: all 0.3s;
          min-width: 250px;
        ">
          🔄 I've Disabled Ad Blocker - Refresh
        </button>
      </div>
    `;
    
    document.body.appendChild(blockOverlay);
    this.disableOriginalPage();
  }

  disableOriginalPage() {
    document.body.classList.add('adblock-blocked');
    
    const elements = document.querySelectorAll('a, button, input, select, textarea, iframe, [onclick]');
    elements.forEach(el => {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.3';
      el.style.filter = 'blur(2px)';
    });
    
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  // === 4. تحميل جميع الإعلانات ===
  async loadAllAds() {
    console.log('📦 بدء تحميل جميع الإعلانات...');
    
    // 1. Native Banner (فوري)
    this.loadNativeBanner();
    
    // 2. إعلانات Sidebar
    await this.delay(500);
    this.loadSidebarAds();
    
    // 3. بانرات اللعبة
    await this.delay(1000);
    this.loadBanners();
    
    // 4. Social Bar
    await this.delay(2000);
    this.loadSocialBar();
    
    // 5. إعلان وسط الصفحة
    await this.delay(2500);
    this.loadMiddleAd();
    
    // 6. إعلان إضافي في Sidebar
    await this.delay(3000);
    this.loadExtraSidebarAd();
    
    // 7. Popunder & Smartlink
    await this.delay(4000);
    this.loadPopunder();
    this.loadSmartlink();
  }

  // === 5. تحميل البانرات - مُحسّن ===
  async loadBanners() {
    console.log('🖼️ تحميل البانرات...');
    
    if (this.config.banners?.aboveIframe?.enabled) {
      this.loadBannerAd('ad-above-iframe', this.config.banners.aboveIframe);
    }
    
    if (this.config.banners?.belowIframe?.enabled) {
      await this.delay(800);
      this.loadBannerAd('ad-below-iframe', this.config.banners.belowIframe);
    }
    
    if (this.config.banners?.pageBottom?.enabled) {
      await this.delay(1200);
      this.ensureContainerExists('ad-page-bottom');
      this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
    }
  }

  // === 6. تحميل إعلان واحد - مُحسّن بالكامل ===
  loadBannerAd(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container) {
      console.warn(`❌ Container ${containerId} not found`);
      return;
    }
    
    const ads = bannerConfig.ads;
    if (!ads || ads.length === 0) return;
    
    // تحميل أول إعلان
    this.loadSingleAd(container, ads[0], containerId);
    
    // التدوير
    if (bannerConfig.rotation && ads.length > 1) {
      let currentIndex = 0;
      const interval = bannerConfig.rotationInterval || 30000;
      
      if (this.rotationTimers[containerId]) {
        clearInterval(this.rotationTimers[containerId]);
      }
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        this.loadSingleAd(container, ads[currentIndex], containerId);
        console.log(`🔄 تدوير إعلان في ${containerId}: ${ads[currentIndex].id}`);
      }, interval);
    }
  }

  // === 7. تحميل إعلان مفرد - الإصلاح الرئيسي ===
  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) return;
    
    console.log(`📢 تحميل إعلان: ${ad.id} في ${containerId}`);
    
    // إنشاء معرف فريد
    this.scriptCounter++;
    const uniqueId = `${ad.id}-${this.scriptCounter}-${Date.now()}`;
    const scriptKey = ad.config?.key || `ad-${this.scriptCounter}`;
    
    // تنظيف الحاوية
    container.innerHTML = '';
    
    // إنشاء حاوية الإعلان
    const adWrapper = document.createElement('div');
    adWrapper.className = 'ad-banner';
    adWrapper.id = `ad-wrapper-${uniqueId}`;
    
    // إضافة تسمية الإعلان
    const adLabel = document.createElement('div');
    adLabel.className = 'ad-label';
    adLabel.textContent = 'Advertisement';
    adWrapper.appendChild(adLabel);
    
    // حاوية الإعلان الفعلية
    const adContent = document.createElement('div');
    adContent.id = `ad-content-${uniqueId}`;
    adContent.style.cssText = `
      text-align: center;
      min-height: ${ad.config?.height || 90}px;
      min-width: ${ad.config?.width || 728}px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;
    adWrapper.appendChild(adContent);
    
    container.appendChild(adWrapper);
    
    // تأخير قصير قبل تحميل السكريبت
    setTimeout(() => {
      // إعداد atOptions بشكل فريد
      const optionsVarName = `atOptions_${scriptKey.replace(/[^a-zA-Z0-9]/g, '_')}_${this.scriptCounter}`;
      
      // تعيين الخيارات في window
      window[optionsVarName] = {
        key: scriptKey,
        format: ad.config?.format || 'iframe',
        height: ad.config?.height || 90,
        width: ad.config?.width || 728,
        params: {}
      };
      
      console.log(`📝 تم إنشاء ${optionsVarName}:`, window[optionsVarName]);
      
      // إنشاء السكريبت
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = `script-${uniqueId}`;
      
      // معالجة الأحداث
      script.onload = () => {
        console.log(`✅ تم تحميل إعلان: ${ad.id}`);
        
        // إزالة شاشة التحميل إذا كانت موجودة
        const loadingEl = adContent.querySelector('.ad-loading');
        if (loadingEl) loadingEl.remove();
      };
      
      script.onerror = () => {
        console.warn(`⚠️ فشل تحميل إعلان: ${ad.id}`);
        adContent.innerHTML = `
          <div style="color: rgba(255,255,255,0.5); font-size: 14px; padding: 20px;">
            Advertisement loading...
          </div>
        `;
      };
      
      // إضافة شاشة تحميل مؤقتة
      adContent.innerHTML = `
        <div class="ad-loading" style="color: rgba(255,255,255,0.3); font-size: 12px;">
          Loading ad...
        </div>
      `;
      
      // إضافة السكريبت
      adContent.appendChild(script);
      
    }, 200);
  }

  // === 8. إعلان وسط الصفحة ===
  loadMiddleAd() {
    if (!this.config.banners?.pageMiddle?.enabled) return;
    
    const container = this.ensureContainerExists('ad-page-middle');
    this.loadBannerAd('ad-page-middle', this.config.banners.pageMiddle);
  }

  // === 9. إعلان إضافي في Sidebar ===
  loadExtraSidebarAd() {
    if (!this.config.sidebarAdExtra?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (sidebar.querySelector('#ad-sidebar-extra')) return;
    
    const extraContainer = document.createElement('div');
    extraContainer.id = 'ad-sidebar-extra';
    extraContainer.style.cssText = `
      min-height: 300px;
      margin: 20px 0;
      background: rgba(0,0,0,0.7);
      border-radius: 8px;
      padding: 15px;
      position: relative;
    `;
    
    const existingAd = sidebar.querySelector('#ad-sidebar');
    if (existingAd && existingAd.nextSibling) {
      sidebar.insertBefore(extraContainer, existingAd.nextSibling);
    } else {
      sidebar.appendChild(extraContainer);
    }
    
    this.loadBannerAd('ad-sidebar-extra', this.config.sidebarAdExtra);
  }

  // === 10. Native Banner ===
  loadNativeBanner() {
    if (!this.config.nativeBanner?.enabled) return;
    
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (sidebar.querySelector('.native-ad-banner')) return;
    
    const container = document.createElement('div');
    container.className = 'ad-banner native-ad-banner';
    container.innerHTML = this.config.nativeBanner.html || '<div id="native-banner-container"></div>';
    
    sidebar.insertBefore(container, sidebar.firstChild);
    
    if (this.config.nativeBanner.script) {
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = this.config.nativeBanner.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        container.appendChild(script);
        console.log('✅ Native Banner loaded');
      }, 1000);
    }
  }

  // === 11. Sidebar Ads ===
  loadSidebarAds() {
    if (!this.config.sidebarAd?.enabled) return;
    
    const container = document.getElementById('ad-sidebar');
    if (!container) {
      console.log('⚠️ حاوية Sidebar غير موجودة، إنشاء جديدة...');
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
        console.log(`🔄 تدوير إعلان Sidebar: ${ads[currentIndex].id}`);
      }, interval);
    }
  }

  loadSidebarAd(container, ad) {
    this.scriptCounter++;
    const uniqueId = `sidebar-${ad.id}-${this.scriptCounter}-${Date.now()}`;
    
    container.innerHTML = '';
    
    const adWrapper = document.createElement('div');
    adWrapper.className = 'ad-banner ad-sidebar';
    
    const adLabel = document.createElement('div');
    adLabel.className = 'ad-label';
    adLabel.textContent = 'Advertisement';
    adWrapper.appendChild(adLabel);
    
    const adContent = document.createElement('div');
    adContent.id = `ad-content-${uniqueId}`;
    adContent.style.cssText = `
      text-align: center;
      min-height: ${ad.config?.height || 300}px;
      background: transparent;
    `;
    adWrapper.appendChild(adContent);
    
    container.appendChild(adWrapper);
    
    setTimeout(() => {
      const optionsVarName = `atOptions_${(ad.config?.key || 'sidebar').replace(/[^a-zA-Z0-9]/g, '_')}_${this.scriptCounter}`;
      
      window[optionsVarName] = {
        key: ad.config?.key,
        format: ad.config?.format || 'iframe',
        height: ad.config?.height || 300,
        width: ad.config?.width || 160,
        params: {}
      };
      
      const script = document.createElement('script');
      script.src = ad.script;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = `script-${uniqueId}`;
      
      script.onload = () => console.log(`✅ Sidebar Ad loaded: ${ad.id}`);
      script.onerror = () => console.warn(`⚠️ فشل تحميل Sidebar Ad: ${ad.id}`);
      
      adContent.appendChild(script);
    }, 200);
  }

  // === 12. Social Bar ===
  loadSocialBar() {
    if (!this.config.socialBar?.enabled) return;
    
    const socialBarScript = this.config.socialBar.script;
    if (!socialBarScript) return;
    
    if (this.loadedScripts.has(socialBarScript)) {
      console.log('⚠️ Social Bar already loaded');
      return;
    }
    
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = socialBarScript;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.id = 'social-bar-script';
      
      document.body.appendChild(script);
      this.loadedScripts.add(socialBarScript);
      
      console.log('✅ Social Bar loaded');
    }, this.config.socialBar.delay || 5000);
  }

  // === 13. Popunder ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const frequency = this.config.popunder.frequency;
    const maxPerSession = this.config.popunder.maxPerSession || 1;
    
    if (frequency === 'once_per_session') {
      const currentCount = this.sessionData.popunderCount || 0;
      
      if (currentCount >= maxPerSession) {
        console.log(`⚠️ Popunder limit reached: ${currentCount}/${maxPerSession}`);
        return;
      }
    }
    
    setTimeout(() => {
      this.config.popunder.scripts.forEach((scriptUrl, index) => {
        if (this.loadedScripts.has(scriptUrl)) {
          console.log(`⚠️ Popunder script already loaded: ${scriptUrl}`);
          return;
        }
        
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `popunder-script-${index}`;
        
        document.body.appendChild(script);
        this.loadedScripts.add(scriptUrl);
        
        console.log(`✅ Popunder script loaded: ${scriptUrl}`);
      });
      
      this.sessionData.popunderCount = (this.sessionData.popunderCount || 0) + 1;
      this.sessionData.popunderShown = true;
      this.saveSessionData();
      
      console.log(`📊 Popunder count: ${this.sessionData.popunderCount}/${maxPerSession}`);
    }, this.config.popunder.delay || 8000);
  }

  // === 14. Smartlink ===
  loadSmartlink() {
    if (!this.config.smartlink?.enabled) return;
    
    const frequency = this.config.smartlink.frequency;
    if (frequency === 'once_per_session' && this.sessionData.smartlinkOpened) {
      console.log('⚠️ Smartlink already opened in this session');
      return;
    }
    
    const openSmartlink = () => {
      setTimeout(() => {
        if (this.config.smartlink.openInNewTab) {
          const newTab = window.open(this.config.smartlink.url, '_blank', 'noopener,noreferrer');
          if (newTab) {
            this.sessionData.smartlinkOpened = true;
            this.saveSessionData();
            console.log('✅ Smartlink opened in new tab');
          }
        } else {
          window.location.href = this.config.smartlink.url;
        }
      }, this.config.smartlink.delay || 3000);
    };
    
    setTimeout(() => openSmartlink(), 2000);
  }

  // === 15. فحص وإصلاح الحاويات ===
  fixAdContainers() {
    console.log('🔧 فحص وإصلاح حاويات الإعلانات...');
    
    const containers = [
      'ad-above-iframe',
      'ad-below-iframe', 
      'ad-page-bottom',
      'ad-sidebar',
      'ad-page-middle'
    ];
    
    containers.forEach(containerId => {
      this.ensureContainerExists(containerId);
    });
  }

  ensureContainerExists(containerId) {
    let container = document.getElementById(containerId);
    
    if (!container) {
      console.log(`⚠️ حاوية ${containerId} غير موجودة، إنشاء جديدة...`);
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        min-height: 50px;
        margin: 20px 0;
        position: relative;
        background: transparent;
      `;
      
      // تحديد مكان الإدراج
      if (containerId.includes('above')) {
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame && gameFrame.parentNode) {
          gameFrame.parentNode.insertBefore(container, gameFrame);
        }
      } else if (containerId.includes('below')) {
        const gameFrame = document.querySelector('.game-frame');
        if (gameFrame && gameFrame.parentNode) {
          gameFrame.parentNode.insertBefore(container, gameFrame.nextSibling);
        }
      } else if (containerId.includes('sidebar')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.appendChild(container);
        }
      } else {
        document.body.appendChild(container);
      }
    }
    
    return container;
  }

  // === 16. عرض إعلانات فولباك ===
  showFallbackAds() {
    console.log('🔄 عرض إعلانات احتياطية...');
    
    const fallbackHTML = `
      <div class="ad-banner" style="text-align:center;padding:20px;">
        <div class="ad-label">Advertisement</div>
        <p style="color:#fff;margin:10px 0;">Support our site by disabling ad blocker</p>
        <a href="#" onclick="window.location.reload()" style="color:#3498db;text-decoration:none;">Refresh after disabling</a>
      </div>
    `;
    
    ['ad-above-iframe', 'ad-below-iframe', 'ad-sidebar'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = fallbackHTML;
      }
    });
  }

  // === 17. إدارة الجلسة ===
  getSessionData() {
    try {
      const data = sessionStorage.getItem('adsSessionData');
      return data ? JSON.parse(data) : {
        popunderShown: false,
        popunderCount: 0,
        smartlinkOpened: false,
        adsLoaded: 0,
        sessionId: Date.now()
      };
    } catch (error) {
      console.error('خطأ في قراءة بيانات الجلسة:', error);
      return {
        popunderShown: false,
        popunderCount: 0,
        smartlinkOpened: false,
        adsLoaded: 0,
        sessionId: Date.now()
      };
    }
  }

  saveSessionData() {
    try {
      sessionStorage.setItem('adsSessionData', JSON.stringify(this.sessionData));
      console.log('💾 تم حفظ بيانات الجلسة');
    } catch (error) {
      console.error('خطأ في حفظ بيانات الجلسة:', error);
    }
  }

  // === 18. تصفية أخطاء Unity ===
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

  // === 19. دالة مساعدة للتأخير ===
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === 20. تنظيف الموارد ===
  destroy() {
    Object.values(this.rotationTimers).forEach(timer => clearInterval(timer));
    this.rotationTimers = {};
    this.loadedScripts.clear();
    console.log('🧹 تم تنظيف موارد الإعلانات');
  }
}

// === تشغيل تلقائي ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 بدء تشغيل نظام الإعلانات...');
  
  const adsManager = new AdsManager();
  adsManager.init();
  window.adsManager = adsManager;
  
  console.log('🎨 تم تحميل نظام الإعلانات بنجاح');
});
