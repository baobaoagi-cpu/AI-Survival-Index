(function () {
  const SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";
  const LOCAL_ID_PREFIX = "local-alpha-";

  const config = {
    liffId:
      window.AI_SURVIVAL_LIFF_ID ||
      localStorage.getItem("AI_SURVIVAL_LIFF_ID") ||
      "",
    requireLogin:
      window.AI_SURVIVAL_REQUIRE_LINE_LOGIN === true ||
      localStorage.getItem("AI_SURVIVAL_REQUIRE_LINE_LOGIN") === "true",
  };

  function apiBase() {
    return (
      localStorage.getItem("AI_SURVIVAL_API_BASE_URL") ||
      window.AI_SURVIVAL_API_BASE_URL ||
      "https://ai-survivalapi-production.up.railway.app"
    ).replace(/\/$/, "");
  }

  function storeReferralFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("refProfileId") || params.get("inviter");
    if (ref) localStorage.setItem("AI_SURVIVAL_REFERRER_PROFILE_ID", ref);
    return ref || localStorage.getItem("AI_SURVIVAL_REFERRER_PROFILE_ID") || "";
  }

  function setLocalProfile(profile) {
    if (!profile?.userId) return;
    localStorage.setItem("AI_SURVIVAL_LINE_USER_ID", profile.userId);
    if (profile.displayName) localStorage.setItem("AI_SURVIVAL_LINE_DISPLAY_NAME", profile.displayName);
    if (profile.pictureUrl) localStorage.setItem("AI_SURVIVAL_LINE_PICTURE_URL", profile.pictureUrl);
    localStorage.setItem("AI_SURVIVAL_LINE_PROFILE", JSON.stringify(profile));
  }

  async function syncReferral(profile) {
    const referrerProfileId = storeReferralFromUrl();
    if (!referrerProfileId || !profile?.userId) return;

    const currentProfileId = localStorage.getItem("profileId");
    if (currentProfileId && currentProfileId === referrerProfileId) return;

    await fetch(apiBase() + "/friends/referral", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Line-User-Id": profile.userId,
        "X-Line-Display-Name": profile.displayName || "",
        "X-Line-Picture-Url": profile.pictureUrl || "",
      },
      body: JSON.stringify({
        referrerProfileId,
        source: "line_liff_login",
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
    storeReferralFromUrl();

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
    await window.liff.init({ liffId: config.liffId });

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
      lineUserId: localStorage.getItem("AI_SURVIVAL_LINE_USER_ID"),
    };
    return window.AI_SURVIVAL_LINE_STATUS;
  }

  async function share(messages) {
    await ready;
    if (!window.liff?.isLoggedIn?.()) throw new Error("LINE login is required before sharing");
    if (!window.liff.isApiAvailable("shareTargetPicker")) {
      throw new Error("LINE shareTargetPicker is not available");
    }
    return window.liff.shareTargetPicker(messages);
  }

  function gameUrl(extra = {}) {
    const params = new URLSearchParams();
    const profileId = extra.profileId || localStorage.getItem("profileId");
    if (profileId) params.set("ref", profileId);

    const liffUrl = config.liffId ? `https://liff.line.me/${config.liffId}` : "";
    const webUrl = `${window.location.origin}${window.location.pathname.includes(".html") ? "/" : window.location.pathname}`;
    const base = extra.preferWeb ? webUrl : liffUrl || webUrl;
    const query = params.toString();
    return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base;
  }

  async function shareGame(options = {}) {
    const url = options.url || gameUrl(options);
    const title = options.title || "AI 時代生存指數";
    const text =
      options.text ||
      "我剛測了我的 AI 原型。你也來測看看，在超智能時代你屬於哪個位置？";

    return share([
      {
        type: "text",
        text: `${title}\n${text}\n${url}`,
      },
    ]);
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

  window.AI_SURVIVAL_LINE = {
    ready,
    share,
    shareGame,
    gameUrl,
    getStatus: () => window.AI_SURVIVAL_LINE_STATUS,
  };
})();
