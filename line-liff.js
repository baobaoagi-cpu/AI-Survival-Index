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
    await ready;
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

    await ready;
    if (window.liff?.permanentLink?.createUrlBy) {
      try {
        return window.liff.permanentLink.createUrlBy(webUrl);
      } catch (error) {
        console.warn("LIFF permanent link failed, fallback to LIFF URL", error);
      }
    }

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
      const url =
        options.url ||
        preparedGameUrl ||
        (await permanentGameUrl({
          ...options,
          source: options.source || "share_game",
          metadata: options.metadata || {},
        }));
      const title = options.title || copy.title;
      const text = options.text || copy.inviteText;

      const lead = options.lead || copy.inviteLead;
      const flexMessage = buildInviteFlex(url, {
        title,
        text,
        lead,
        imageUrl: options.imageUrl,
      });

      try {
        const result = await share([flexMessage]);
        if (!options.url && !preparedGameUrl) {
          prepareGameShare({ source: "share_rewarm_after_success" }).catch(() => null);
        }
        return result;
      } catch (error) {
        window.AI_SURVIVAL_LAST_SHARE_ERROR = String(error?.message || error);
        console.warn("Flex share failed, retrying with text share.", error);
        const result = await share([
          {
            type: "text",
            text: `${lead}\n${title}\n${text}\n${url}`,
          },
        ]);
        if (!options.url && !preparedGameUrl) {
          prepareGameShare({ source: "share_rewarm_after_text_success" }).catch(() => null);
        }
        return result;
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
    getDiagnostics: diagnostics,
    getStatus: () => window.AI_SURVIVAL_LINE_STATUS,
  };
})();
