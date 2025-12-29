/**
 * 🎯 نظام إدارة الإعلانات الذكي - النسخة المحسّنة والمُصلحة
 * ✅ إصلاح Popunder ليعمل مرة واحدة فقط (حتى بعد التحديث)
 * ✅ إصلاح التوافق مع الهواتف المحمولة
 * ✅ استخدام localStorage بدلاً من sessionStorage
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
      
      const adClasses = [
        'ad', 'ads', 'advertisement', 'advert', 
        'ad-banner', 'ad-container', 'ad-wrapper',
        'pub', 'publicite', 'sponsor', 'sponsored'
      ];
      
      adClasses.forEach(className => {
        adElement.classList.add(className);
      });
      
      adElement.innerHTML = `
        <div style="width: 728px; height: 90px; background: #1a2a6c; color: white; 
                    display: flex; align-items: center; justify-content: center;">
          Advertisement
        </div>
      `;
      
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
          computedStyle.visibility === 'hidden' ||
          computedStyle.opacity === '0' ||
          adElement.style.display === 'none' ||
          !document.body.contains(adElement);
        
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
      const response = await fetch('https://google-analytics.com/analytics.js', {
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
    
    blockOverlay.addEventListener('contextmenu', e => e.preventDefault());
    blockOverlay.addEventListener('keydown', e => {
      if (e.key === 'F12' || e.key === 'F5' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    
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
        <div style="font-size: 80px; color: #ff4444; margin-bottom: 20px;">
          🚫
        </div>
        
        <h1 style="font-size: 2.5rem; color: #ffd700; margin-bottom: 20px;">
          Ad Blocker Detected
        </h1>
        
        <div style="
          background: rgba(0, 0, 0, 0.4);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 25px;
          line-height: 1.7;
          text-align: left;
        ">
          <p style="font-size: 18px; margin-bottom: 15px;">
            <strong>We have detected that you are using an ad blocker.</strong>
          </p>
          
          <p style="margin-bottom: 15px; font-size: 16px;">
            Our website is <strong>100% free</strong> and relies exclusively on advertisements to operate. 
            By blocking ads, you are preventing us from providing free content.
          </p>
          
          <div style="
            background: rgba(255, 68, 68, 0.2);
            border-left: 4px solid #ff4444;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="margin: 0; font-weight: bold; color: #ffd700;">
              ⚠️ <strong>Access Denied:</strong> You cannot access the game with ad blocker enabled.
            </p>
          </div>
          
          <h3 style="color: #3498db; margin: 20px 0 15px 0;">
            📋 To Continue:
          </h3>
          <ol style="margin-left: 20px; font-size: 16px;">
            <li style="margin-bottom: 8px;">Disable your ad blocker for this website</li>
            <li style="margin-bottom: 8px;">Refresh this page</li>
            <li style="margin-bottom: 8px;">Add our site to your whitelist</li>
          </ol>
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 30px;">
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
          
          <button onclick="window.showAdBlockHelp()" style="
            background: linear-gradient(135deg, #3498db, #2980b9);
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
            📖 How to Disable Ad Block
          </button>
        </div>
        
        <p style="margin-top: 25px; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
          This message will appear until ad blocker is disabled.
        </p>
      </div>
    `;
    
    document.body.appendChild(blockOverlay);
    this.disableOriginalPage();
    window.showAdBlockHelp = () => this.showAdBlockHelp();
  }

  disableOriginalPage() {
    document.body.classList.add('adblock-blocked');
    
    const elements = document.querySelectorAll('a, button, input, select, textarea, iframe, [onclick]');
    elements.forEach(el => {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.3';
      el.style.filter = 'blur(2px)';
    });
    
    const gameIframe = document.getElementById('game-iframe');
    if (gameIframe) {
      gameIframe.style.pointerEvents = 'none';
      gameIframe.style.opacity = '0.2';
      gameIframe.style.filter = 'blur(5px) grayscale(1)';
    }
    
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  showAdBlockHelp() {
    const helpOverlay = document.createElement('div');
    helpOverlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a2a6c, #302b63);
      padding: 40px;
      border-radius: 20px;
      max-width: 900px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 2147483648;
      color: white;
      box-shadow: 0 30px 80px rgba(0,0,0,0.6);
      border: 2px solid #3498db;
    `;
    
    helpOverlay.innerHTML = `
      <div style="position: relative;">
        <button onclick="this.parentElement.parentElement.remove()" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: #ff4444;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
        ">✕</button>
        
        <h2 style="text-align: center; margin-bottom: 30px; color: #ffd700;">
          How to Disable Ad Blocker
        </h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #2ecc71;">AdBlock Plus</h3>
            <ol>
              <li>Click the AdBlock Plus icon</li>
              <li>Click "Don't run on pages on this domain"</li>
              <li>Refresh the page</li>
            </ol>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #3498db;">uBlock Origin</h3>
            <ol>
              <li>Click the uBlock Origin icon</li>
              <li>Click the big power button</li>
              <li>Refresh the page</li>
            </ol>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
            <h3 style="color: #9b59b6;">AdGuard</h3>
            <ol>
              <li>Click the AdGuard icon</li>
              <li>Disable protection for this site</li>
              <li>Refresh the page</li>
            </ol>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="location.reload()" style="
            background: #2ecc71;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          ">
            Refresh After Disabling
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpOverlay);
  }

  // === 6. تحميل جميع الإعلانات ===
  async loadAllAds() {
    console.log('📦 بدء تحميل جميع الإعلانات...');
    
    this.loadNativeBanner();
    
    setTimeout(() => {
      this.loadSidebarAds();
    }, 500);
    
    await this.delay(1000);
    this.loadBanners();
    
    await this.delay(1500);
    this.loadSocialBar();
    
    await this.delay(2000);
    this.loadMiddleAd();
    
    await this.delay(2500);
    this.loadExtraSidebarAd();
    
    // ⭐ إعلانات تفاعلية (Popunder & Smartlink)
    await this.delay(3000);
    this.loadPopunder();
    this.loadSmartlink();
  }

  // === 7. تحميل البانرات مع دعم الهواتف ===
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
        this.ensureContainerExists('ad-page-bottom');
        this.loadBannerAd('ad-page-bottom', this.config.banners.pageBottom);
      }, 1500);
    }
  }

  loadBannerAd(containerId, bannerConfig) {
    const container = this.ensureContainerExists(containerId);
    if (!container) {
      console.warn(`❌ Container ${containerId} not found`);
      return;
    }
    
    const ads = bannerConfig.ads;
    if (!ads || ads.length === 0) return;
    
    // ⭐ اختيار الإعلان المناسب للجهاز
    const selectedAd = this.selectAdForDevice(ads);
    this.loadSingleAd(container, selectedAd, containerId);
    
    // التدوير
    if (bannerConfig.rotation && ads.length > 1) {
      let currentIndex = ads.indexOf(selectedAd);
      const interval = bannerConfig.rotationInterval || 30000;
      
      if (this.rotationTimers[containerId]) {
        clearInterval(this.rotationTimers[containerId]);
      }
      
      this.rotationTimers[containerId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        const nextAd = this.selectAdForDevice(ads);
        this.loadSingleAd(container, nextAd, containerId);
        console.log(`🔄 تدوير إعلان في ${containerId}: ${nextAd.id}`);
      }, interval);
    }
  }

  // ⭐ دالة اختيار الإعلان المناسب حسب حجم الشاشة
  selectAdForDevice(ads) {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    // ترتيب الأولوية للهواتف: 320x50, 300x250, 468x60
    if (isMobile) {
      const mobileAd = ads.find(ad => 
        (ad.config?.width === 320 && ad.config?.height === 50) ||
        (ad.config?.width === 300 && ad.config?.height === 250)
      );
      return mobileAd || ads[0];
    }
    
    // ترتيب الأولوية للتابلت: 468x60, 300x250, 728x90
    if (isTablet) {
      const tabletAd = ads.find(ad => 
        (ad.config?.width === 468 && ad.config?.height === 60) ||
        (ad.config?.width === 300 && ad.config?.height === 250)
      );
      return tabletAd || ads[0];
    }
    
    // الكمبيوتر: 728x90 أو أي حجم كبير
    return ads[0];
  }

  loadSingleAd(container, ad, containerId) {
    if (!ad || !ad.script) return;
    
    console.log(`📢 تحميل إعلان: ${ad.id} في ${containerId}`);
    
    const uniqueId = `${ad.id}-${Date.now()}`;
    
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, {
        ...ad.config,
        params: ad.config?.params || {}
    });
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner';
    adDiv.id = `ad-wrapper-${uniqueId}`;
    
    // ⭐ تحسين العرض للهواتف
    const adWidth = ad.config?.width || 728;
    const adHeight = ad.config?.height || 90;
    
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="banner-${uniqueId}" style="
        text-align:center;
        min-height:${adHeight}px;
        max-width:${adWidth}px;
        margin:0 auto;
        background:transparent;
      "></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
        const script = document.createElement('script');
        script.src = ad.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `script-${uniqueId}`;
        
        script.onload = () => {
            console.log(`✅ تم تحميل إعلان: ${ad.id}`);
        };
        
        script.onerror = () => {
            console.warn(`⚠️ فشل تحميل إعلان: ${ad.id}`);
            this.showFallbackInContainer(container);
        };
        
        const targetElement = document.getElementById(`banner-${uniqueId}`);
        if (targetElement) {
            targetElement.appendChild(script);
        }
    }, 300);
  }

  loadMiddleAd() {
    if (!this.config.banners?.pageMiddle?.enabled) return;
    
    const container = this.ensureContainerExists('ad-page-middle');
    this.loadBannerAd('ad-page-middle', this.config.banners.pageMiddle);
  }

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
    
    // ⭐ اختيار إعلان مناسب للجهاز
    const selectedAd = this.selectAdForDevice(ads);
    this.loadSidebarAd(container, selectedAd);
    
    if (this.config.sidebarAd.rotation && ads.length > 1) {
      let currentIndex = ads.indexOf(selectedAd);
      const interval = this.config.sidebarAd.rotationInterval || 45000;
      
      this.rotationTimers['sidebar'] = setInterval(() => {
        currentIndex = (currentIndex + 1) % ads.length;
        const nextAd = this.selectAdForDevice(ads);
        this.loadSidebarAd(container, nextAd);
        console.log(`🔄 تدوير إعلان Sidebar: ${nextAd.id}`);
      }, interval);
    }
  }

  loadSidebarAd(container, ad) {
    const uniqueId = `${ad.id}-${Date.now()}`;
    
    window.atOptions = window.atOptions || {};
    Object.assign(window.atOptions, {
        ...ad.config,
        params: ad.config?.params || {}
    });
    
    const adDiv = document.createElement('div');
    adDiv.className = 'ad-banner ad-sidebar';
    
    const adHeight = ad.config?.height || 300;
    const adWidth = ad.config?.width || 160;
    
    adDiv.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="sidebar-${uniqueId}" style="
        text-align:center;
        min-height:${adHeight}px;
        max-width:${adWidth}px;
        margin:0 auto;
        background:transparent;
      "></div>
    `;
    
    container.innerHTML = '';
    container.appendChild(adDiv);
    
    setTimeout(() => {
        const script = document.createElement('script');
        script.src = ad.script;
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.id = `sidebar-script-${uniqueId}`;
        
        script.onload = () => {
            console.log(`✅ Sidebar Ad loaded: ${ad.id}`);
        };
        
        script.onerror = () => {
            console.warn(`⚠️ فشل تحميل Sidebar Ad: ${ad.id}`);
            this.showFallbackInContainer(container);
        };
        
        const targetElement = document.getElementById(`sidebar-${uniqueId}`);
        if (targetElement) {
            targetElement.appendChild(script);
        }
    }, 300);
  }

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

  // === ⭐ إصلاح Popunder - استخدام localStorage ===
  loadPopunder() {
    if (!this.config.popunder?.enabled) return;
    
    const frequency = this.config.popunder.frequency;
    const maxPerSession = this.config.popunder.maxPerSession || 1;
    
    // ⭐ استخدام localStorage بدلاً من sessionStorage
    const popunderData = this.getPopunderData();
    
    if (frequency === 'once_per_session') {
      const currentCount = popunderData.count || 0;
      const lastShown = popunderData.lastShown || 0;
      const now = Date.now();
      
      // التحقق من أن آخر ظهور كان قبل أكثر من ساعة (اختياري)
      // يمكنك تغيير المدة حسب رغبتك
      const oneHour = 60 * 60 * 1000;
      
      if (currentCount >= maxPerSession && (now - lastShown) < oneHour) {
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
      
      // ⭐ حفظ البيانات في localStorage
      const popunderData = this.getPopunderData();
      popunderData.count = (popunderData.count || 0) + 1;
      popunderData.lastShown = Date.now();
      this.savePopunderData(popunderData);
      
      console.log(`📊 Popunder count: ${popunderData.count}/${maxPerSession}`);
    }, this.config.popunder.delay || 8000);
  }

  // ⭐ دوال localStorage للـ Popunder
  getPopunderData() {
    try {
      const data = localStorage.getItem('popunderData');
      return data ? JSON.parse(data) : {
        count: 0,
        lastShown: 0
      };
    } catch (error) {
      console.error('خطأ في قراءة بيانات Popunder:', error);
      return {
        count: 0,
        lastShown: 0
      };
    }
  }

  savePopunderData(data) {
    try {
      localStorage.setItem('popunderData', JSON.stringify(data));
      console.log('💾 تم حفظ بيانات Popunder:', data);
    } catch (error) {
      console.error('خطأ في حفظ بيانات Popunder:', error);
    }
  }

  // === ⭐ Smartlink - محسّن مع localStorage ===
  loadSmartlink() {
    if (!
