    (function () {
      "use strict";

      const storage = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
      };

      const htmlEl = document.documentElement;

      /* ------------------------------------------------------------
         深浅色主题
         ------------------------------------------------------------ */
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      // 滚动动效偏好（reduced-motion），导航横向滚动与返回顶部共用
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

      function applyTheme(theme) {
        htmlEl.setAttribute("data-theme", theme);
        const sun = document.querySelector(".icon-sun");
        const moon = document.querySelector(".icon-moon");
        if (sun && moon) {
          sun.style.display = theme === "dark" ? "none" : "block";
          moon.style.display = theme === "dark" ? "block" : "none";
        }
      }

      // 无手动选择记录时跟随系统偏好（与 head 防闪烁脚本保持一致）；
      // 校验 localStorage 值：历史遗留非法值（如 "system"）回退到系统偏好
      const savedTheme = storage.get("theme");
      let resolvedTheme;
      if (savedTheme === "dark" || savedTheme === "light") {
        resolvedTheme = savedTheme;
      } else {
        resolvedTheme = mql.matches ? "dark" : "light";
      }
      applyTheme(resolvedTheme);

      const themeChangeHandler = function (e) {
        // 仅在用户未手动选择过主题时跟随系统变化；手动选择后以 localStorage 为准
        if (!storage.get("theme")) applyTheme(e.matches ? "dark" : "light");
      };
      // Safari < 14 不支持 MediaQueryList.addEventListener，回退 addListener
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", themeChangeHandler);
      } else if (typeof mql.addListener === "function") {
        mql.addListener(themeChangeHandler);
      }

      const themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        themeToggle.addEventListener("click", function () {
          const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
          storage.set("theme", next);
          applyTheme(next);
        });
      }

      /* ------------------------------------------------------------
         头像占位字母：从 h1.name 取第一个字（中文页取"王"，英文页取"C"）
         ------------------------------------------------------------ */
      function updateAvatarFallback() {
        const el = document.getElementById("avatar-fallback");
        if (!el) return;
        const nameEl = document.querySelector("h1.name");
        const fullName = nameEl ? nameEl.textContent.trim() : "";
        el.textContent = fullName.charAt(0) || "";
      }
      updateAvatarFallback();

      /* ------------------------------------------------------------
         滚动高亮当前板块
         修复方案：
         1. 对比每个 section 的 offsetTop 来确定当前板块；
         2. 当用户滚动到页面最底部时，强制激活最后一个 section（联系方式）；
         3. 增加底部留白确保最后一个 section 能进入触发区域。
         ------------------------------------------------------------ */
      const sections = Array.prototype.slice.call(document.querySelectorAll("section[id], header[id]"));
      const navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
      const navLinksEl = document.getElementById("nav-links");
      const navLinksWrap = navLinksEl ? navLinksEl.parentElement : null;
      const NAV_OFFSET = 80; // 略大于吸顶导航高度 + scroll-margin-top

      let lastActiveId = null;
      let _spyPaused = false;    // 导航点击后短暂抑制 scroll spy
      let _spyResumeTimer = null;
      let _spyResumeOnScroll = null;  // 滚动停止后恢复 spy 的回调
      // 文档高度/视口高度缓存：提前声明，避免 let 暂时性死区
      // （首次 computeActiveSection() 调用发生在旧声明位置之前）
      let _cachedDocHeight = 0;
      let _cachedWinHeight = 0;

      function getDocHeight() {
        return Math.max(
          document.body.scrollHeight, document.documentElement.scrollHeight,
          document.body.offsetHeight, document.documentElement.offsetHeight,
          document.body.clientHeight, document.documentElement.clientHeight
        );
      }

      function scrollActiveLinkIntoView(link) {
        if (!navLinksEl || !link) return;
        const linkLeft = link.offsetLeft;
        const linkRight = linkLeft + link.offsetWidth;
        const viewLeft = navLinksEl.scrollLeft;
        const viewRight = viewLeft + navLinksEl.clientWidth;
        if (linkLeft < viewLeft || linkRight > viewRight) {
          const target = linkLeft - (navLinksEl.clientWidth - link.offsetWidth) / 2;
          navLinksEl.scrollTo({ left: Math.max(0, target), behavior: motionQuery.matches ? "auto" : "smooth" });
        }
      }

      function setActive(id) {
        let activeLink = null;
        navLinks.forEach(function (a) {
          const isActive = a.getAttribute("href") === "#" + id;
          a.classList.toggle("active", isActive);
          if (isActive) activeLink = a;
        });
        if (id !== lastActiveId) {
          lastActiveId = id;
          scrollActiveLinkIntoView(activeLink);
          // 更新语言切换链接的 hash，使切换到另一语言后保持相同板块位置
          const langBtn = document.querySelector(".lang-btn");
          if (langBtn) {
            const href = langBtn.getAttribute("href");
            if (href) { // 元素存在但无 href 时跳过，避免 TypeError 冻结 scroll-spy
              const baseHref = href.split("#")[0];
              langBtn.setAttribute("href", baseHref + "#" + id);
            }
          }
        }
      }

      let ticking = false;
      function computeActiveSection() {
        if (_spyPaused) { ticking = false; return; }
        const scrollY = window.scrollY || window.pageYOffset;
        const pos = scrollY + NAV_OFFSET;
        let currentId = sections.length ? sections[0].id : null;

        // 常规判断：找到最后一个 offsetTop <= pos 的 section
        for (let i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= pos) currentId = sections[i].id;
        }

        // 关键修复：如果页面已经滚动到底部，强制激活最后一个 section
        // 使用缓存高度避免每帧强制 layout；回退到 getDocHeight() 兜底
        const docHeight = _cachedDocHeight || getDocHeight();
        const atBottom = scrollY + window.innerHeight >= docHeight - 5;
        if (atBottom && sections.length > 0) {
          currentId = sections[sections.length - 1].id;
        }

        if (currentId) setActive(currentId);
        ticking = false;
      }

      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(computeActiveSection);
          ticking = true;
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      computeActiveSection(); // 首次加载时立即计算

      /* ------------------------------------------------------------
         导航链接点击：手动滚动替代浏览器默认锚点，避免首次点击
         时页面布局未稳定导致的偏移问题
         ------------------------------------------------------------ */
      // 滚动结束检测：每次 scroll 重置唯一计时器，单条恢复路径
      function resumeSpy() {
        _spyPaused = false;
        clearTimeout(_spyResumeTimer);
        _spyResumeTimer = null;
        if (_spyResumeOnScroll) {
          window.removeEventListener("scroll", _spyResumeOnScroll);
          _spyResumeOnScroll = null;
        }
      }

      function pauseSpyUntilScrollStops() {
        _spyPaused = true;
        clearTimeout(_spyResumeTimer);
        if (!_spyResumeOnScroll) {
          _spyResumeOnScroll = function () {
            clearTimeout(_spyResumeTimer);
            _spyResumeTimer = setTimeout(resumeSpy, 150);
          };
          window.addEventListener("scroll", _spyResumeOnScroll, { passive: true });
        }
        // 兜底：若点击后没有产生任何滚动事件（例如重复点击当前已激活锚点），
        // 也必须恢复 scroll spy，避免高亮功能被永久暂停。
        _spyResumeTimer = setTimeout(resumeSpy, 1000);
      }

      navLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          const href = this.getAttribute("href");
          // 只拦截 hash 锚点链接（如 #projects），放行普通页面跳转（如 /index.html）
          if (!href || href.charAt(0) !== "#") return;
          e.preventDefault();
          const id = href.replace("#", "");
          const target = document.getElementById(id);
          if (!target) return;
          const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
          window.scrollTo({ top: top, behavior: motionQuery.matches ? "auto" : "smooth" });
          if (history.pushState) {
            try { history.pushState(null, null, "#" + id); } catch (e) {}
          }
          setActive(id);
          pauseSpyUntilScrollStops();
        });
      });

      /* ------------------------------------------------------------
         导航栏横向滑动的渐隐提示
         ------------------------------------------------------------ */
      function updateNavFade() {
        if (!navLinksEl || !navLinksWrap) return;
        const maxScroll = navLinksEl.scrollWidth - navLinksEl.clientWidth;
        navLinksWrap.classList.toggle("can-scroll-left", navLinksEl.scrollLeft > 4);
        navLinksWrap.classList.toggle("can-scroll-right", navLinksEl.scrollLeft < maxScroll - 4);
      }

      if (navLinksEl) {
        navLinksEl.addEventListener("scroll", updateNavFade, { passive: true });
        window.addEventListener("resize", updateNavFade);
        updateNavFade();
      }

      /* ============================================================
         返回顶部按钮 + 阅读进度圆环
         ============================================================ */

      // 创建按钮 DOM
      function createBackToTopButton() {
        const btn = document.createElement("button");
        btn.className = "back-to-top";
        btn.type = "button";
        // 根据页面语言设置 aria-label
        const pageLang = htmlEl.getAttribute("lang") || "";
        btn.setAttribute("aria-label", pageLang === "en" ? "Back to top" : "返回顶部");

        // SVG: 外圈背景环 + 进度环 + 箭头图标
        // 圆周长 = 2 * π * 22 ≈ 138.23
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 48 48");
        svg.setAttribute("width", "48");
        svg.setAttribute("height", "48");

        // 背景圆环（轨道）
        const bgCircle = document.createElementNS(svgNS, "circle");
        bgCircle.setAttribute("cx", "24");
        bgCircle.setAttribute("cy", "24");
        bgCircle.setAttribute("r", "22");
        bgCircle.setAttribute("fill", "none");
        bgCircle.setAttribute("stroke-width", "2");
        bgCircle.classList.add("back-to-top__track");

        // 进度圆环（从顶部12点方向顺时针增长）
        const progressCircle = document.createElementNS(svgNS, "circle");
        progressCircle.setAttribute("cx", "24");
        progressCircle.setAttribute("cy", "24");
        progressCircle.setAttribute("r", "22");
        progressCircle.setAttribute("fill", "none");
        progressCircle.setAttribute("stroke-width", "2");
        progressCircle.setAttribute("stroke-linecap", "round");
        progressCircle.setAttribute("stroke-dasharray", "138.23");
        progressCircle.setAttribute("stroke-dashoffset", "138.23"); // 初始空圆
        progressCircle.setAttribute("transform", "rotate(-90 24 24)");
        progressCircle.classList.add("back-to-top__progress");

        // 向上箭头
        const arrow = document.createElementNS(svgNS, "path");
        arrow.setAttribute("d", "M24 32V16M18 22l6-6 6 6");
        arrow.setAttribute("fill", "none");
        arrow.setAttribute("stroke-width", "2");
        arrow.setAttribute("stroke-linecap", "round");
        arrow.setAttribute("stroke-linejoin", "round");
        arrow.classList.add("back-to-top__arrow");

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);
        svg.appendChild(arrow);
        btn.appendChild(svg);

        document.body.appendChild(btn);

        return {
          btn: btn,
          progressCircle: progressCircle
        };
      }

      const backToTop = createBackToTopButton();
      const bttBtn = backToTop.btn;
      const bttProgress = backToTop.progressCircle;
      const CIRCUMFERENCE = 138.23; // 2 * π * 22

      function refreshCachedSizes() {
        // getDocHeight() 会触发 layout，只在 resize 或首次计算时调用
        _cachedDocHeight = getDocHeight();
        _cachedWinHeight = window.innerHeight;
      }

      // 更新进度圆环 + 按钮显示/隐藏（rAF 节流）
      let _bttTicking = false;
      function updateBackToTop() {
        if (_bttTicking) return;
        _bttTicking = true;
        window.requestAnimationFrame(function () {
          const scrollY = window.scrollY || window.pageYOffset;
          const docHeight = _cachedDocHeight || getDocHeight();
          const winHeight = _cachedWinHeight || window.innerHeight;
          const maxScroll = docHeight - winHeight;

          if (maxScroll <= 0) {
            bttBtn.classList.remove("visible");
            bttProgress.setAttribute("stroke-dashoffset", CIRCUMFERENCE);
            _bttTicking = false;
            return;
          }

          const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
          const offset = CIRCUMFERENCE * (1 - progress);
          bttProgress.setAttribute("stroke-dashoffset", offset);

          if (scrollY > 300) { // 显示阈值：约一屏的 1/3（经验值，无精确来源）
            bttBtn.classList.add("visible");
          } else {
            bttBtn.classList.remove("visible");
          }
          _bttTicking = false;
        });
      }

      // 点击返回顶部：尊重 prefers-reduced-motion 设置
      function getScrollBehavior() {
        return motionQuery.matches ? "auto" : "smooth";
      }
      bttBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() });
      });

      // 绑定滚动更新（resize 时刷新缓存尺寸）
      window.addEventListener("scroll", updateBackToTop, { passive: true });
      window.addEventListener("resize", function () {
        refreshCachedSizes();
        updateBackToTop();
      });
      refreshCachedSizes(); // 初始化缓存
      updateBackToTop();    // 初始计算

      // 图片/字体等异步资源加载完成后文档高度会变化：window load 时统一刷新缓存，
      // 避免逐图监听造成重复强制布局（reflow）
      function refreshOnLayoutChange() {
        refreshCachedSizes();
        updateBackToTop();
        computeActiveSection();
      }
      window.addEventListener("load", refreshOnLayoutChange);

      /* ------------------------------------------------------------
         语言切换前保存滚动比例，用于目标页恢复精确位置。
         仅在点击语言切换按钮时保存——若对所有页面跳转（beforeunload）
         都保存，从详情页返回主页时会用详情页的滚动比例污染主页位置。
         ------------------------------------------------------------ */
      const langToggleBtn = document.querySelector(".lang-btn");
      if (langToggleBtn) {
        langToggleBtn.addEventListener("click", function () {
          try {
            const dh = _cachedDocHeight || getDocHeight();
            if (dh > 0) {
              const ratio = (window.scrollY || window.pageYOffset) / dh;
              sessionStorage.setItem("_scrollRatio", String(ratio));
            }
          } catch (e) {}
        });
      }

    // 头像加载失败时隐藏（从 default.html 内联 onerror 迁移至此）
    const _avatarImg = document.querySelector('.avatar img');
    if (_avatarImg) {
      _avatarImg.addEventListener('error', function () { this.style.display = 'none'; });
    }

    })();
