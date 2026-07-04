    (function () {
      "use strict";

      var storage = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
      };

      var htmlEl = document.documentElement;

      /* ------------------------------------------------------------
         深浅色主题
         ------------------------------------------------------------ */
      var mql = window.matchMedia("(prefers-color-scheme: dark)");
      function systemTheme() { return mql.matches ? "dark" : "light"; }

      function applyTheme(theme) {
        htmlEl.setAttribute("data-theme", theme);
        var sun = document.querySelector(".icon-sun");
        var moon = document.querySelector(".icon-moon");
        if (sun && moon) {
          sun.style.display = theme === "dark" ? "none" : "block";
          moon.style.display = theme === "dark" ? "block" : "none";
        }
      }

      applyTheme(storage.get("theme") || "light");

      mql.addEventListener("change", function () {
        // 不再自动跟随系统主题变化，保持用户看到的或手动选择的主题
      });

      var themeToggle = document.getElementById("theme-toggle");
      if (themeToggle) {
        themeToggle.addEventListener("click", function () {
          var next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
          storage.set("theme", next);
          applyTheme(next);
        });
      }

      /* ------------------------------------------------------------
         头像占位字母：从 h1.name 取第一个字（中文页取"王"，英文页取"C"）
         ------------------------------------------------------------ */
      function updateAvatarFallback() {
        var el = document.getElementById("avatar-fallback");
        if (!el) return;
        var nameEl = document.querySelector("h1.name");
        var fullName = nameEl ? nameEl.textContent.trim() : "";
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
      var sections = Array.prototype.slice.call(document.querySelectorAll("section[id], header[id]"));
      var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
      var navLinksEl = document.getElementById("nav-links");
      var navLinksWrap = navLinksEl ? navLinksEl.parentElement : null;
      var NAV_OFFSET = 80; // 略大于吸顶导航高度 + scroll-margin-top

      var lastActiveId = null;

      function getDocHeight() {
        return Math.max(
          document.body.scrollHeight, document.documentElement.scrollHeight,
          document.body.offsetHeight, document.documentElement.offsetHeight,
          document.body.clientHeight, document.documentElement.clientHeight
        );
      }

      function scrollActiveLinkIntoView(link) {
        if (!navLinksEl || !link) return;
        var linkLeft = link.offsetLeft;
        var linkRight = linkLeft + link.offsetWidth;
        var viewLeft = navLinksEl.scrollLeft;
        var viewRight = viewLeft + navLinksEl.clientWidth;
        if (linkLeft < viewLeft || linkRight > viewRight) {
          var target = linkLeft - (navLinksEl.clientWidth - link.offsetWidth) / 2;
          navLinksEl.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
        }
      }

      function setActive(id) {
        var activeLink = null;
        navLinks.forEach(function (a) {
          var isActive = a.getAttribute("href") === "#" + id;
          a.classList.toggle("active", isActive);
          if (isActive) activeLink = a;
        });
        if (id !== lastActiveId) {
          lastActiveId = id;
          scrollActiveLinkIntoView(activeLink);
          // 更新语言切换链接的 hash，使切换到另一语言后保持相同板块位置
          var langBtn = document.querySelector(".lang-btn");
          if (langBtn) {
            var baseHref = langBtn.getAttribute("href").split("#")[0];
            langBtn.setAttribute("href", baseHref + "#" + id);
          }
        }
      }

      var ticking = false;
      function computeActiveSection() {
        var scrollY = window.scrollY || window.pageYOffset;
        var pos = scrollY + NAV_OFFSET;
        var currentId = sections.length ? sections[0].id : null;

        // 常规判断：找到最后一个 offsetTop <= pos 的 section
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= pos) currentId = sections[i].id;
        }

        // 关键修复：如果页面已经滚动到底部，强制激活最后一个 section
        // 使用缓存高度避免每帧强制 layout；回退到 getDocHeight() 兜底
        var docHeight = _cachedDocHeight || getDocHeight();
        var atBottom = scrollY + window.innerHeight >= docHeight - 5;
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
         导航栏横向滑动的渐隐提示
         ------------------------------------------------------------ */
      function updateNavFade() {
        if (!navLinksEl || !navLinksWrap) return;
        var maxScroll = navLinksEl.scrollWidth - navLinksEl.clientWidth;
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
        var btn = document.createElement("button");
        btn.className = "back-to-top";
        // 根据页面语言设置 aria-label
        var pageLang = htmlEl.getAttribute("lang") || "";
        btn.setAttribute("aria-label", pageLang === "en" ? "Back to top" : "返回顶部");

        // SVG: 外圈背景环 + 进度环 + 箭头图标
        // 圆周长 = 2 * π * 22 ≈ 138.23
        var svgNS = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 48 48");
        svg.setAttribute("width", "48");
        svg.setAttribute("height", "48");

        // 背景圆环（轨道）
        var bgCircle = document.createElementNS(svgNS, "circle");
        bgCircle.setAttribute("cx", "24");
        bgCircle.setAttribute("cy", "24");
        bgCircle.setAttribute("r", "22");
        bgCircle.setAttribute("fill", "none");
        bgCircle.setAttribute("stroke-width", "2");
        bgCircle.classList.add("back-to-top__track");

        // 进度圆环（从顶部12点方向顺时针增长）
        var progressCircle = document.createElementNS(svgNS, "circle");
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
        var arrow = document.createElementNS(svgNS, "path");
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

      var backToTop = createBackToTopButton();
      var bttBtn = backToTop.btn;
      var bttProgress = backToTop.progressCircle;
      var CIRCUMFERENCE = 138.23; // 2 * π * 22

      // 缓存文档高度，避免每次 scroll 事件都强制 layout
      var _cachedDocHeight = 0;
      var _cachedWinHeight = 0;

      function refreshCachedSizes() {
        // getDocHeight() 会触发 layout，只在 resize 或首次计算时调用
        _cachedDocHeight = getDocHeight();
        _cachedWinHeight = window.innerHeight;
      }

      // 更新进度圆环 + 按钮显示/隐藏（rAF 节流）
      var _bttTicking = false;
      function updateBackToTop() {
        if (_bttTicking) return;
        _bttTicking = true;
        window.requestAnimationFrame(function () {
          var scrollY = window.scrollY || window.pageYOffset;
          var docHeight = _cachedDocHeight;
          var winHeight = _cachedWinHeight;
          var maxScroll = docHeight - winHeight;

          if (maxScroll <= 0) {
            bttBtn.classList.remove("visible");
            bttProgress.setAttribute("stroke-dashoffset", CIRCUMFERENCE);
            _bttTicking = false;
            return;
          }

          var progress = Math.min(1, Math.max(0, scrollY / maxScroll));
          var offset = CIRCUMFERENCE * (1 - progress);
          bttProgress.setAttribute("stroke-dashoffset", offset);

          if (scrollY > 300) {
            bttBtn.classList.add("visible");
          } else {
            bttBtn.classList.remove("visible");
          }
          _bttTicking = false;
        });
      }

      // 点击返回顶部：尊重 prefers-reduced-motion 设置（含动态变化监听）
      var _motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      function getScrollBehavior() {
        return _motionQuery.matches ? "auto" : "smooth";
      }
      _motionQuery.addEventListener("change", function () {
        // 无障碍设置变化时自动调整，无需刷新页面
      });
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

      /* ------------------------------------------------------------
         语言切换前保存滚动比例，用于目标页恢复精确位置
         ------------------------------------------------------------ */
      window.addEventListener("beforeunload", function () {
        try {
          var dh = _cachedDocHeight || getDocHeight();
          if (dh > 0) {
            var ratio = (window.scrollY || window.pageYOffset) / dh;
            sessionStorage.setItem("_scrollRatio", String(ratio));
          }
        } catch (e) {}
      });

    })();
