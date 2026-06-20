(function () {
  const API_FALLBACK = "https://ai-survivalapi-production.up.railway.app";
  const PAGE_EVENT_MAP = [
    { match: "AI原型演化結果", eventName: "viewed_result" },
    { match: "我的AI朋友圈", eventName: "opened_friend_wall" },
    { match: "未來導航", eventName: "entered_membership_page" },
  ];

  function apiBase() {
    return (
      localStorage.getItem("AI_SURVIVAL_API_BASE_URL") ||
      window.AI_SURVIVAL_API_BASE_URL ||
      API_FALLBACK
    ).replace(/\/$/, "");
  }

  function lineUserId() {
    const explicit = localStorage.getItem("AI_SURVIVAL_LINE_USER_ID");
    if (explicit) return explicit;
    const generated = "local-alpha-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("AI_SURVIVAL_LINE_USER_ID", generated);
    return generated;
  }

  function context(extra) {
    return {
      page: decodeURIComponent(location.pathname.split("/").pop() || "index"),
      profileId: localStorage.getItem("profileId") || null,
      sessionId: localStorage.getItem("quizSessionId") || null,
      lineUserId: lineUserId(),
      metadata: {
        path: location.pathname,
        search: location.search,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        lineLoginStatus: window.AI_SURVIVAL_LINE?.getStatus?.() || null,
        persisted: localStorage.getItem("quizPersisted"),
        primaryType: localStorage.getItem("primaryType"),
        secondaryType: localStorage.getItem("secondaryType"),
        evolutionType: localStorage.getItem("evolutionType"),
        ...(extra && extra.metadata ? extra.metadata : {}),
      },
      ...extra,
    };
  }

  function track(eventName, extra) {
    const payload = context({ eventName, ...(extra || {}) });
    return fetch(apiBase() + "/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => null);
  }

  function trackPage() {
    track("opened_app");
    const page = decodeURIComponent(location.pathname);
    const matched = PAGE_EVENT_MAP.find((item) => page.includes(item.match));
    if (matched) track(matched.eventName);
  }

  function textOf(target) {
    const element = target instanceof Element ? target.closest("button,[data-action],[data-pick],a,div") : null;
    return {
      element,
      text: (element?.textContent || "").replace(/\s+/g, " ").trim(),
    };
  }

  document.addEventListener(
    "click",
    (event) => {
      const { element, text } = textOf(event.target);
      if (!element) return;

      const action = element.getAttribute("data-action");
      const optionId = element.getAttribute("data-option-id");
      const selectedKey = element.getAttribute("data-pick");

      if (optionId || selectedKey) {
        track("answered_question", {
          optionId: optionId || undefined,
          metadata: { selectedKey, text },
        });
      }

      if (text.includes("開始探索")) track("started_quiz");
      if (text.includes("分享")) track("clicked_share", { metadata: { text, action } });
      if (text.includes("邀請")) track("clicked_invite", { metadata: { text, action } });
      if (text.includes("好友圈") || text.includes("家徽牆")) track("opened_friend_wall", { metadata: { text, action } });
      if (text.includes("未來導航")) track("entered_membership_page", { metadata: { text, action } });
    },
    { capture: true },
  );

  window.AI_SURVIVAL_TRACK = { track };
  window.addEventListener("load", trackPage, { once: true });
})();
