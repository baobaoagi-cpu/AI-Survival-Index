(function () {
  const SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";
  const LOCAL_ID_PREFIX = "local-alpha-";

  const config = {
    liffId:
      window.AI_SURVIVAL_LIFF_ID ||
      localStorage.getItem("AI_SURVIVAL_LIFF_ID") ||
      "",
    productionOrigin:
      window.AI_SURVIVAL_PUBLIC_ORIGIN ||
      localStorage.getItem("AI_SURVIVAL_PUBLIC_ORIGIN") ||
      "https://ai-survival-index.pages.dev",
    requireLogin:
      window.AI_SURVIVAL_REQUIRE_LINE_LOGIN === true ||
      localStorage.getItem("AI_SURVIVAL_REQUIRE_LINE_LOGIN") === "true",
  };

  const copy = {
    title: "\u0041\u0049 \u6642\u4ee3\u751f\u5b58\u6307\u6578",
    inviteLead: "\u5206\u4eab\u7d66\u4f60\u7684\u4e00\u500b\u6e2c\u9a57",
    inviteText:
      "\u6211\u525b\u6e2c\u51fa\u81ea\u5df1\u7684 AI \u4eba\u683c\u539f\u578b\u3002\u4f60\u4e5f\u4f86\u770b\u770b\u81ea\u5df1\u5728\u8d85\u667a\u80fd\u6642\u4ee3\u7684\u4f4d\u7f6e\u3002",
    cardTitle: "\u8d85\u667a\u80fd\u6642\u4ee3\u4f86\u81e8",
    cardSubtitle: "\u4f60\u5c6c\u65bc\u54ea\u500b\u4f4d\u7f6e\uff1f",
    cardBody: "30 \u79d2\u6e2c\u51fa\u4f60\u7684 AI \u4eba\u683c\u539f\u578b\uff0c\u770b\u770b\u4f60\u548c\u597d\u53cb\u8ab0\u5df2\u7d93\u627e\u5230\u65b9\u5411\u3002",
    cta: "\u958b\u59cb\u6e2c\u9a57",
  };
  let preparedGameUrl = "";
  let preparedGameUrlPromise = null;
  let shareInFlight = false;
  let shareInFlightAt = 0;
  let fallbackPanelRetry = null;

  function publicOrigin() {
    if (window.location.protocol === "https:") return window.location.origin;
    return config.productionOrigin.replace(/\/$/, "");
  }

  function apiBase() {
    return (
      localStorage.getItem("AI_SURVIVAL_API_BASE_URL") ||
      window.AI_SURVIVAL_API_BASE_URL ||
      "https://ai-survivalapi-production.up.railway.app"
    ).replace(/\/$/, "");
  }

  function assetUrl(path) {
    return `${publicOrigin()}/${path.replace(/^\.\//, "").replace(/^\//, "")}`;
  }

  function profileHeaders() {
    return {
      "X-Line-User-Id": localStorage.getItem("AI_SURVIVAL_LINE_USER_ID") || "",
      "X-Line-Display-Name": localStorage.getItem("AI_SURVIVAL_LINE_DISPLAY_NAME") || "",
      "X-Line-Picture-Url": localStorage.getItem("AI_SURVIVAL_LINE_PICTURE_URL") || "",
    };
  }

  async function ensureProfileId(explicitProfileId) {
    if (explicitProfileId) return explicitProfileId;

    const storedProfileId = localStorage.getItem("profileId");
    await ready;

    const lineUserId = localStorage.getItem("AI_SURVIVAL_LINE_USER_ID");
    const profileLineUserId = localStorage.getItem("AI_SURVIVAL_PROFILE_LINE_USER_ID");
    if (storedProfileId && (!lineUserId || lineUserId.startsWith(LOCAL_ID_PREFIX) || profileLineUserId === lineUserId)) {
      return storedProfileId;
    }
    if (!lineUserId || lineUserId.startsWith(LOCAL_ID_PREFIX)) return "";

    const url = new URL(apiBase() + "/friends/wall");
    url.searchParams.set("lineUserId", lineUserId);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: profileHeaders(),
      keepalive: true,
    });
    const data = await response.json().catch(() => null);
    const profileId = data?.owner?.id || data?.owner?.profileId || "";
    if (profileId) {
      localStorage.setItem("profileId", profileId);
      localStorage.setItem("AI_SURVIVAL_PROFILE_LINE_USER_ID", lineUserId);
    }
    return profileId || storedProfileId || "";
  }

  function storeReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite") || params.get("inviteCode");
    if (invite) localStorage.setItem("AI_SURVIVAL_INVITE_CODE", normalizeInviteCode(invite));
    const ref = params.get("ref") || params.get("refProfileId") || params.get("inviter");
    if (ref) localStorage.setItem("AI_SURVIVAL_REFERRER_PROFILE_ID", ref);
    return ref || localStorage.getItem("AI_SURVIVAL_REFERRER_PROFILE_ID") || "";
  }

  function normalizeInviteCode(inviteCode) {
    return String(inviteCode || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function storedInviteCode() {
    return normalizeInviteCode(localStorage.getItem("AI_SURVIVAL_INVITE_CODE"));
  }

  async function trackInviteOpen(inviteCode) {
    const code = normalizeInviteCode(inviteCode);
    if (!code) return;
    await fetch(apiBase() + "/friends/invite/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
      keepalive: true,
    }).catch(() => null);
  }

  async function createInviteCode(options = {}) {
    await ready;
    const lineUserId = localStorage.getItem("AI_SURVIVAL_LINE_USER_ID");
    if (!lineUserId || lineUserId.startsWith(LOCAL_ID_PREFIX)) return "";

    const response = await fetch(apiBase() + "/friends/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...profileHeaders(),
      },
      body: JSON.stringify({
        source: options.source || "share_button",
        metadata: options.metadata || {},
      }),
      keepalive: true,
    });
    const data = await response.json().catch(() => null);
    const inviteCode = normalizeInviteCode(data?.inviteCode);
    if (inviteCode) {
      localStorage.setItem("AI_SURVIVAL_LAST_CREATED_INVITE_CODE", inviteCode);
      if (data?.ownerProfileId) {
        localStorage.setItem("profileId", data.ownerProfileId);
        localStorage.setItem("AI_SURVIVAL_PROFILE_LINE_USER_ID", lineUserId);
      }
    }
    return inviteCode;
  }

  function setLocalProfile(profile) {
    if (!profile?.userId) return;
    const previousLineUserId = localStorage.getItem("AI_SURVIVAL_LINE_USER_ID");
    if (previousLineUserId && previousLineUserId !== profile.userId) {
      localStorage.removeItem("profileId");
      localStorage.removeItem("AI_SURVIVAL_PROFILE_LINE_USER_ID");
    }
    localStorage.setItem("AI_SURVIVAL_LINE_USER_ID", profile.userId);
    if (profile.displayName) localStorage.setItem("AI_SURVIVAL_LINE_DISPLAY_NAME", profile.displayName);
    if (profile.pictureUrl) localStorage.setItem("AI_SURVIVAL_LINE_PICTURE_URL", profile.pictureUrl);
    localStorage.setItem("AI_SURVIVAL_LINE_PROFILE", JSON.stringify(profile));
  }

  async function syncReferral(profile) {
    const referrerProfileId = storeReferralFromUrl();
    const inviteCode = storedInviteCode();
    if ((!referrerProfileId && !inviteCode) || !profile?.userId) return;

    const currentProfileId = localStorage.getItem("profileId");
    if (!inviteCode && currentProfileId && currentProfileId === referrerProfileId) return;

    await fetch(apiBase() + "/friends/referral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Line-User-Id": profile.userId,
        "X-Line-Display-Name": profile.displayName || "",
        "X-Line-Picture-Url": profile.pictureUrl || "",
      },
      body: JSON.stringify({
        ...(referrerProfileId ? { referrerProfileId } : {}),
        ...(inviteCode ? { inviteCode } : {}),
        source: inviteCode ? "line_liff_invite" : "line_liff_login",
      }),
      keepalive: true,
    })
      .then((response) => response.json().catch(() => null))
      .then((data) => {
        if (data?.profileId) localStorage.setItem("profileId", data.profileId);
      })
      .catch(() => null);
  }

  function localLineUserId() {
    const explicit = localStorage.getItem("AI_SURVIVAL_LINE_USER_ID");
    if (explicit) return explicit;
    const generated = LOCAL_ID_PREFIX + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("AI_SURVIVAL_LINE_USER_ID", generated);
    return generated;
  }

  function loadScript() {
    if (window.liff) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function init() {
    const referrerProfileId = storeReferralFromUrl();
    const inviteCode = storedInviteCode();
    if (inviteCode) trackInviteOpen(inviteCode);

    if (!config.liffId) {
      window.AI_SURVIVAL_LINE_STATUS = {
        ready: false,
        disabled: true,
        reason: "LIFF ID is not configured",
        lineUserId: localLineUserId(),
      };
      return window.AI_SURVIVAL_LINE_STATUS;
    }

    await loadScript();
    await window.liff.init({
      liffId: config.liffId,
      withLoginOnExternalBrowser: true,
    });

    if (config.requireLogin && !window.liff.isLoggedIn()) {
      window.liff.login({ redirectUri: window.location.href });
      return { ready: false, redirecting: true };
    }

    if (window.liff.isLoggedIn()) {
      const profile = await window.liff.getProfile();
      setLocalProfile(profile);
      await syncReferral(profile);
      window.dispatchEvent(new CustomEvent("ai-survival:line-profile", { detail: profile }));
      window.AI_SURVIVAL_TRACK?.track?.("line_login_ready", {
        metadata: {
          isInClient: window.liff.isInClient(),
          displayName: profile.displayName || null,
        },
      });
    }

    window.AI_SURVIVAL_LINE_STATUS = {
      ready: true,
      disabled: false,
      isLoggedIn: window.liff.isLoggedIn(),
      isInClient: window.liff.isInClient(),
      shareTargetPickerAvailable: window.liff.isApiAvailable("shareTargetPicker"),
      lineUserId: localStorage.getItem("AI_SURVIVAL_LINE_USER_ID"),
    };
    return window.AI_SURVIVAL_LINE_STATUS;
  }

  const ready = init().catch((error) => {
    console.warn("LIFF init failed", error);
    window.AI_SURVIVAL_LINE_STATUS = {
      ready: false,
      disabled: false,
      error: String(error?.message || error),
      lineUserId: localLineUserId(),
    };
    return window.AI_SURVIVAL_LINE_STATUS;
  });

  function diagnostics(extra = {}) {
    let context = null;
    try {
      context = window.liff?.getContext?.() || null;
    } catch (_) {
      context = null;
    }
    return {
      href: window.location.href,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      visibilityState: document.visibilityState,
      status: window.AI_SURVIVAL_LINE_STATUS || null,
      context,
      ...extra,
    };
  }

  function trackLineEvent(eventName, metadata = {}) {
    window.AI_SURVIVAL_TRACK?.track?.(eventName, {
      metadata: diagnostics(metadata),
    });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  }

  function ensureFallbackPanelStyles() {
    if (document.querySelector("[data-ai-share-fallback-style]")) return;
    const style = document.createElement("style");
    style.setAttribute("data-ai-share-fallback-style", "true");
    style.textContent = `
      .ai-share-fallback-backdrop{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding:18px;background:rgba(5,4,10,.72);backdrop-filter:blur(12px)}
      .ai-share-fallback-panel{width:min(100%,390px);border:1px solid rgba(255,255,255,.16);border-radius:26px;background:linear-gradient(180deg,rgba(25,20,44,.98),rgba(7,6,15,.98));box-shadow:0 24px 80px rgba(0,0,0,.55);padding:22px;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans TC","Microsoft JhengHei",sans-serif}
      .ai-share-fallback-kicker{font-size:12px;letter-spacing:.18em;color:#8df8d5;font-weight:800;text-transform:uppercase}
      .ai-share-fallback-title{margin:9px 0 8px;font-size:22px;line-height:1.25;font-weight:900}
      .ai-share-fallback-copy{font-size:14px;line-height:1.65;color:rgba(255,255,255,.72)}
      .ai-share-fallback-url{margin:14px 0;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);font-size:12px;line-height:1.45;color:rgba(255,255,255,.82);word-break:break-all}
      .ai-share-fallback-qr{display:flex;align-items:center;gap:13px;margin:12px 0 16px}
      .ai-share-fallback-qr img{width:86px;height:86px;border-radius:14px;background:#fff;padding:6px}
      .ai-share-fallback-qr span{font-size:13px;line-height:1.55;color:rgba(255,255,255,.64)}
      .ai-share-fallback-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .ai-share-fallback-actions button{min-height:48px;border:0;border-radius:999px;font-size:15px;font-weight:900;color:#fff;background:rgba(255,255,255,.12)}
      .ai-share-fallback-actions button[data-primary]{grid-column:1/-1;background:linear-gradient(90deg,#8b5cf6,#ec4fb3,#60a5fa);box-shadow:0 12px 30px rgba(139,92,246,.32)}
      .ai-share-fallback-actions button:active{transform:scale(.98)}
    `;
    document.head.appendChild(style);
  }

  function showShareFallbackPanel(url, options = {}) {
    ensureFallbackPanelStyles();
    document.querySelector("[data-ai-share-fallback]")?.remove();
    const panel = document.createElement("div");
    const title = options.title || copy.title;
    const lead = options.lead || copy.inviteLead;
    const text = options.text || copy.inviteText;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
    panel.className = "ai-share-fallback-backdrop";
    panel.setAttribute("data-ai-share-fallback", "true");
    panel.innerHTML = `
      <div class="ai-share-fallback-panel" role="dialog" aria-modal="true" aria-label="分享備用方案">
        <div class="ai-share-fallback-kicker">Share fallback</div>
        <div class="ai-share-fallback-title">LINE 好友清單沒有打開</div>
        <div class="ai-share-fallback-copy">已幫你複製分享連結。你可以直接貼到 LINE 聊天室，也可以再試一次開啟好友清單。</div>
        <div class="ai-share-fallback-url">${escapeHtml(url)}</div>
        <div class="ai-share-fallback-qr">
          <img src="${qrUrl}" referrerpolicy="no-referrer" alt="分享 QR code">
          <span>朋友掃這個 QR code，也會進到同一個測驗入口。</span>
        </div>
        <div class="ai-share-fallback-actions">
          <button type="button" data-primary data-action="retry">再試一次好友清單</button>
          <button type="button" data-action="copy">複製連結</button>
          <button type="button" data-action="system">系統分享</button>
          <button type="button" data-action="close">關閉</button>
        </div>
      </div>
    `;
    panel.addEventListener("click", async (event) => {
      if (event.target === panel) {
        panel.remove();
        return;
      }
      const button = event.target.closest?.("button[data-action]");
      if (!button) return;
      const action = button.getAttribute("data-action");
      if (action === "close") {
        trackLineEvent("share_fallback_panel_closed");
        panel.remove();
        return;
      }
      if (action === "copy") {
        await copyText(url).catch(() => false);
        trackLineEvent("share_fallback_copy_clicked", { url });
        button.textContent = "已複製";
        return;
      }
      if (action === "system") {
        trackLineEvent("share_fallback_system_clicked", { url });
        if (navigator.share) {
          await navigator.share({ title, text: `${lead}\n${text}`, url }).catch((error) => {
            trackLineEvent("share_fallback_system_failed", {
              errorName: error?.name || null,
              errorMessage: String(error?.message || error),
            });
          });
        } else {
          await copyText(url).catch(() => false);
          button.textContent = "已複製";
        }
        return;
      }
      if (action === "retry") {
        trackLineEvent("share_fallback_retry_clicked", { url });
        button.disabled = true;
        button.textContent = "開啟中...";
        try {
          if (fallbackPanelRetry) await fallbackPanelRetry();
          panel.remove();
        } catch (error) {
          button.disabled = false;
          button.textContent = "再試一次好友清單";
          trackLineEvent("share_fallback_retry_failed", {
            errorName: error?.name || null,
            errorMessage: String(error?.message || error),
          });
        }
      }
    });
    document.body.appendChild(panel);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function prepareGameShare(options = {}) {
    if (preparedGameUrl) return Promise.resolve(preparedGameUrl);
    if (!preparedGameUrlPromise) {
      preparedGameUrlPromise = permanentGameUrl({
        ...options,
        source: options.source || "share_prewarm",
        metadata: {
          ...(options.metadata || {}),
          prewarm: true,
        },
      })
        .then((url) => {
          preparedGameUrl = url;
          return url;
        })
        .catch((error) => {
          preparedGameUrlPromise = null;
          throw error;
        });
    }
    return preparedGameUrlPromise;
  }

  ready.then((status) => {
    if (status?.ready && status?.isLoggedIn) {
      window.setTimeout(() => {
        prepareGameShare({ source: "share_prewarm_ready" }).catch((error) => {
          console.warn("Share prewarm failed", error);
        });
      }, 250);
    }
  });

  async function share(messages) {
    if (!window.AI_SURVIVAL_LINE_STATUS?.ready) {
      await ready;
    }
    trackLineEvent("share_picker_attempt", {
      messageTypes: Array.isArray(messages) ? messages.map((message) => message?.type).filter(Boolean) : [],
    });

    if (!window.liff?.isLoggedIn?.()) {
      trackLineEvent("share_picker_blocked", { reason: "not_logged_in" });
      window.liff?.login?.({ redirectUri: window.location.href });
      throw new Error("LINE login is required before sharing");
    }

    if (!window.liff.isApiAvailable("shareTargetPicker")) {
      trackLineEvent("share_picker_blocked", { reason: "shareTargetPicker_unavailable" });
      throw new Error("LINE shareTargetPicker is not available");
    }

    try {
      const result = await window.liff.shareTargetPicker(messages, { isMultiple: true });
      trackLineEvent("share_picker_resolved", { result });
      return result;
    } catch (error) {
      trackLineEvent("share_picker_failed", {
        errorName: error?.name || null,
        errorCode: error?.code || null,
        errorMessage: String(error?.message || error),
      });
      throw error;
    }
  }

  async function shareFallback(error, initialUrl, options = {}, copyOptions = {}) {
    window.AI_SURVIVAL_LAST_SHARE_ERROR = String(error?.message || error);
    let fallbackUrl = initialUrl;
    try {
      fallbackUrl = await permanentGameUrl({
        ...options,
        source: `${options.source || "share_game"}_fallback_url`,
        metadata: {
          ...(options.metadata || {}),
          fallbackReason: String(error?.message || error),
        },
      });
    } catch (urlError) {
      trackLineEvent("share_fallback_url_failed", {
        errorName: urlError?.name || null,
        errorMessage: String(urlError?.message || urlError),
      });
    }
    const copied = await copyText(fallbackUrl).catch(() => false);
    trackLineEvent("share_copy_fallback", {
      copied,
      url: fallbackUrl,
      errorName: error?.name || null,
      errorCode: error?.code || null,
      errorMessage: String(error?.message || error),
    });
    const retryMessage = textInviteMessage(fallbackUrl, copyOptions);
    fallbackPanelRetry = () => share([retryMessage]);
    showShareFallbackPanel(fallbackUrl, copyOptions);
    return { fallback: true, copied, url: fallbackUrl, reason: String(error?.message || error) };
  }

  function gameUrl(extra = {}) {
    const params = new URLSearchParams();
    const inviteCode = normalizeInviteCode(extra.inviteCode || localStorage.getItem("AI_SURVIVAL_LAST_CREATED_INVITE_CODE"));
    if (inviteCode) params.set("invite", inviteCode);
    const profileId = extra.profileId || localStorage.getItem("profileId");
    if (!inviteCode && profileId) params.set("ref", profileId);

    const liffUrl = config.liffId ? `https://liff.line.me/${config.liffId}` : "";
    const webUrl = `${window.location.origin}${window.location.pathname.includes(".html") ? "/" : window.location.pathname}`;
    const base = extra.preferWeb ? webUrl : liffUrl || webUrl;
    const query = params.toString();
    return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base;
  }

  function textInviteMessage(url, options = {}) {
    const title = options.title || copy.title;
    const lead = options.lead || copy.inviteLead;
    const text = options.text || copy.inviteText;
    return {
      type: "text",
      text: `${lead}\n${title}\n${text}\n${url}`,
    };
  }

  async function permanentGameUrl(extra = {}) {
    const params = new URLSearchParams();
    const inviteCode = normalizeInviteCode(extra.inviteCode || (await createInviteCode({
      source: extra.source || "share_button",
      metadata: extra.metadata || {},
    })));
    if (inviteCode) params.set("invite", inviteCode);
    const profileId = inviteCode ? "" : await ensureProfileId(extra.profileId);
    if (!inviteCode && profileId) params.set("ref", profileId);

    const endpointUrl = `${publicOrigin()}/`;
    const query = params.toString();
    const webUrl = query ? `${endpointUrl}?${query}` : endpointUrl;

    // Prefer direct LIFF URLs for sharing. It avoids an extra permanent-link step
    // before the target picker and keeps invite/ref query parameters intact.
    return config.liffId
      ? `https://liff.line.me/${config.liffId}${query ? `?${query}` : ""}`
      : webUrl;
  }

  function buildInviteFlex(url, options = {}) {
    const title = options.title || copy.title;
    const lead = options.lead || copy.inviteLead;
    const text = options.text || copy.cardBody;
    const imageUrl = options.imageUrl || assetUrl("assets/share-cards/game-invite.png");

    return {
      type: "flex",
      altText: `${lead}｜${title}`,
      contents: {
        type: "bubble",
        size: "mega",
        hero: {
          type: "image",
          url: imageUrl,
          size: "full",
          aspectRatio: "1200:630",
          aspectMode: "cover",
          action: {
            type: "uri",
            uri: url,
          },
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          backgroundColor: "#090713",
          contents: [
            {
              type: "text",
              text: lead,
              size: "xs",
              color: "#D8C4FF",
              weight: "bold",
            },
            {
              type: "text",
              text: copy.cardTitle,
              size: "xl",
              color: "#FFFFFF",
              weight: "bold",
              wrap: true,
            },
            {
              type: "text",
              text: copy.cardSubtitle,
              size: "lg",
              color: "#BFD8FF",
              weight: "bold",
              wrap: true,
            },
            {
              type: "text",
              text,
              size: "sm",
              color: "#D9DEEA",
              wrap: true,
              margin: "sm",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#090713",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#8B5CF6",
              action: {
                type: "uri",
                label: copy.cta,
                uri: url,
              },
            },
          ],
        },
      },
    };
  }

  async function shareGame(options = {}) {
    const now = Date.now();
    if (shareInFlight && now - shareInFlightAt < 12000) {
      trackLineEvent("share_game_deduped", { reason: "share_already_in_progress" });
      throw new Error("LINE share is already in progress");
    }
    shareInFlight = true;
    shareInFlightAt = now;

    try {
      const hadPreparedUrl = Boolean(options.url || preparedGameUrl);
      const url = options.url || preparedGameUrl || gameUrl({ profileId: options.profileId });
      const title = options.title || copy.title;
      const text = options.text || copy.inviteText;

      const lead = options.lead || copy.inviteLead;
      if (!hadPreparedUrl) {
        trackLineEvent("share_url_fast_fallback", {
          reason: "prepared_invite_url_not_ready",
          url,
        });
        prepareGameShare({
          ...options,
          source: options.source || "share_game_rewarm_after_fast_fallback",
          metadata: options.metadata || {},
        }).catch((error) => {
          console.warn("Share rewarm failed after fast fallback", error);
        });
      }

      const textMessage = textInviteMessage(url, { title, text, lead });
      if (options.preferFlex !== true) {
        try {
          return await share([textMessage]);
        } catch (error) {
          return await shareFallback(error, url, options, { title, text, lead });
        }
      }

      const flexMessage = buildInviteFlex(url, {
        title,
        text,
        lead,
        imageUrl: options.imageUrl,
      });

      try {
        const result = await share([flexMessage]);
        if (!hadPreparedUrl) {
          prepareGameShare({ source: "share_rewarm_after_success" }).catch(() => null);
        }
        return result;
      } catch (error) {
        window.AI_SURVIVAL_LAST_SHARE_ERROR = String(error?.message || error);
        console.warn("Flex share failed, retrying with text share.", error);
        try {
          const result = await share([textMessage]);
          if (!hadPreparedUrl) {
            prepareGameShare({ source: "share_rewarm_after_text_success" }).catch(() => null);
          }
          return result;
        } catch (textError) {
          return await shareFallback(textError, url, options, { title, text, lead });
        }
      }
    } finally {
      shareInFlight = false;
    }
  }

  window.AI_SURVIVAL_LINE = {
    ready,
    share,
    shareGame,
    prepareGameShare,
    gameUrl,
    permanentGameUrl,
    buildInviteFlex,
    textInviteMessage,
    showShareFallbackPanel,
    getDiagnostics: diagnostics,
    getStatus: () => window.AI_SURVIVAL_LINE_STATUS,
  };
})();
