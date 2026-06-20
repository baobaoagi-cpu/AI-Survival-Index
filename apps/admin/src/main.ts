import "./styles.css";

const API_BASE_URL =
  localStorage.getItem("AI_SURVIVAL_ADMIN_API_BASE_URL") ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://ai-survivalapi-production.up.railway.app";

const ARCHETYPE_LABELS: Record<string, string> = {
  explorer: "AI探險家",
  craftsman: "AI工匠",
  guardian: "AI守護者",
  navigator: "AI領航員",
  strategist: "AI策士",
  inventor: "AI發明家",
  trader: "AI交易員",
  mentor: "AI導師",
  builder: "AI建造者",
  unknown: "未知",
};

type TabKey = "dashboard" | "users" | "sessions" | "assets" | "friends";

type AdminState = {
  token: string | null;
  tab: TabKey;
  loading: boolean;
  error: string | null;
  data: Record<string, unknown>;
};

const state: AdminState = {
  token: localStorage.getItem("AI_SURVIVAL_ADMIN_TOKEN"),
  tab: "dashboard",
  loading: false,
  error: null,
  data: {},
};

const appRoot = document.querySelector<HTMLDivElement>("#app") as HTMLDivElement | null;
if (!appRoot) throw new Error("App root not found");
const root = appRoot;

render();
if (state.token) void loadTab();

function render() {
  root.innerHTML = state.token ? shellTemplate() : loginTemplate();
  bindEvents();
}

function bindEvents() {
  const loginForm = document.querySelector<HTMLFormElement>("[data-login-form]");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    await login(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  });

  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.tab = button.dataset.tab as TabKey;
      render();
      await loadTab();
    });
  });

  document.querySelector<HTMLButtonElement>("[data-refresh]")?.addEventListener("click", () => void loadTab());
  document.querySelector<HTMLButtonElement>("[data-logout]")?.addEventListener("click", () => {
    localStorage.removeItem("AI_SURVIVAL_ADMIN_TOKEN");
    state.token = null;
    state.data = {};
    render();
  });
}

async function login(username: string, password: string) {
  state.loading = true;
  state.error = null;
  render();

  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "登入失敗");
    state.token = payload.token;
    localStorage.setItem("AI_SURVIVAL_ADMIN_TOKEN", payload.token);
    state.tab = "dashboard";
    render();
    await loadTab();
  } catch (error) {
    state.error = error instanceof Error ? error.message : "登入失敗";
    state.loading = false;
    render();
  }
}

async function loadTab() {
  state.loading = true;
  state.error = null;
  render();

  const endpointByTab: Record<TabKey, string> = {
    dashboard: "/admin/summary",
    users: "/admin/users",
    sessions: "/admin/quiz-sessions",
    assets: "/admin/question-assets",
    friends: "/admin/friend-links",
  };

  try {
    const payload = await adminFetch(endpointByTab[state.tab]);
    state.data[state.tab] = payload;
  } catch (error) {
    state.error = error instanceof Error ? error.message : "資料載入失敗";
  } finally {
    state.loading = false;
    render();
  }
}

async function adminFetch(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${state.token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `API error ${response.status}`);
  return payload;
}

function loginTemplate() {
  return `
    <main class="login-page">
      <section class="login-card">
        <div class="eyebrow">AI Survival Index</div>
        <h1>管理後台</h1>
        <p>管理測驗、用戶、好友圈與營運狀態。</p>
        ${state.error ? `<div class="alert">${escapeHtml(state.error)}</div>` : ""}
        <form data-login-form class="login-form">
          <label>帳號<input name="username" autocomplete="username" value="admin" /></label>
          <label>密碼<input name="password" type="password" autocomplete="current-password" value="admin123" /></label>
          <button type="submit" ${state.loading ? "disabled" : ""}>${state.loading ? "登入中..." : "登入"}</button>
        </form>
        <div class="hint">MVP 帳密：admin / admin123</div>
      </section>
    </main>
  `;
}

function shellTemplate() {
  return `
    <main class="admin-shell">
      <aside class="sidebar">
        <div>
          <div class="brand-mark">AI</div>
          <h1>生存指數後台</h1>
          <p>Alpha Ops Console</p>
        </div>
        <nav>
          ${tabButton("dashboard", "Dashboard")}
          ${tabButton("users", "用戶清單")}
          ${tabButton("sessions", "測驗紀錄")}
          ${tabButton("assets", "題目圖片")}
          ${tabButton("friends", "好友圈關係")}
        </nav>
        <button class="ghost-button" data-logout>登出</button>
      </aside>
      <section class="content">
        <header class="topbar">
          <div>
            <div class="eyebrow">Production API</div>
            <h2>${tabTitle(state.tab)}</h2>
          </div>
          <div class="top-actions">
            <code>${escapeHtml(API_BASE_URL)}</code>
            <button data-refresh>${state.loading ? "更新中" : "重新整理"}</button>
          </div>
        </header>
        ${state.error ? `<div class="alert">${escapeHtml(state.error)}</div>` : ""}
        ${state.loading ? `<div class="loading">資料載入中...</div>` : renderTab()}
      </section>
    </main>
  `;
}

function tabButton(tab: TabKey, label: string) {
  return `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}">${label}</button>`;
}

function tabTitle(tab: TabKey) {
  return {
    dashboard: "營運總覽",
    users: "正在玩的用戶與玩家清單",
    sessions: "測驗紀錄",
    assets: "題目圖片對照表",
    friends: "好友圈關係表",
  }[tab];
}

function renderTab() {
  if (state.tab === "dashboard") return dashboardTemplate(state.data.dashboard as any);
  if (state.tab === "users") return usersTemplate(state.data.users as any);
  if (state.tab === "sessions") return sessionsTemplate(state.data.sessions as any);
  if (state.tab === "assets") return assetsTemplate(state.data.assets as any);
  return friendsTemplate(state.data.friends as any);
}

function dashboardTemplate(data: any = {}) {
  const totals = data.totals ?? {};
  const distribution = data.archetypeDistribution ?? {};
  return `
    <section class="metric-grid">
      ${metric("用戶總數", totals.users)}
      ${metric("測驗紀錄", totals.quizSessions)}
      ${metric("24h 完成", totals.completedLast24h)}
      ${metric("好友關係", totals.friendLinks)}
      ${metric("分享事件", totals.shareEvents)}
      ${metric("Supabase", data.health?.supabase ? "正常" : "待確認")}
    </section>
    <section class="panel">
      <div class="panel-head"><h3>九大原型分布</h3><span>最近 1000 筆結果</span></div>
      <div class="bars">
        ${Object.entries(ARCHETYPE_LABELS)
          .filter(([key]) => key !== "unknown")
          .map(([key, label]) => bar(label, Number(distribution[key] ?? 0), maxValue(distribution)))
          .join("")}
      </div>
    </section>
  `;
}

function usersTemplate(data: any = {}) {
  const users = data.users ?? [];
  return `
    <section class="panel">
      <div class="panel-head"><h3>用戶清單</h3><span>${users.length} 筆</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>用戶</th><th>LINE ID</th><th>人格</th><th>測驗</th><th>朋友</th><th>最近活動</th></tr></thead>
          <tbody>
            ${users.map((user: any) => `
              <tr>
                <td>${avatar(user.picture_url)}<strong>${escapeHtml(user.display_name || "未命名")}</strong></td>
                <td><code>${escapeHtml(shortId(user.line_user_id))}</code></td>
                <td>${typePill(user.latestResult?.primary_type)}</td>
                <td>${user.quizCount ?? 0}</td>
                <td>${user.friendCount ?? 0}</td>
                <td>${formatDate(user.latestSessionAt || user.updated_at || user.created_at)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function sessionsTemplate(data: any = {}) {
  const sessions = data.sessions ?? [];
  return `
    <section class="panel">
      <div class="panel-head"><h3>測驗紀錄</h3><span>${sessions.length} 筆</span></div>
      <div class="record-list">
        ${sessions.map((session: any) => `
          <article class="record">
            <div>
              <div class="record-title">${escapeHtml(session.profile?.display_name || "匿名用戶")} ${typePill(session.primary_type)}</div>
              <div class="muted">${formatDate(session.completed_at || session.created_at)} · ${escapeHtml(session.status)}</div>
            </div>
            <div class="answer-line">
              ${(session.answers ?? []).map((answer: any) => `<span>${escapeHtml(answer.scenario_id)} / ${escapeHtml(answer.option_id)} / ${labelType(answer.archetype_key)}</span>`).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function assetsTemplate(data: any = {}) {
  const questions = data.questions ?? [];
  return `
    <section class="panel">
      <div class="panel-head"><h3>題目圖片對照表</h3><span>目前只讀，下一版可上傳替換</span></div>
      <div class="card-grid">
        ${questions.map((question: any) => `
          <article class="asset-card">
            <div class="asset-preview">${String(question.order).padStart(2, "0")}</div>
            <div>
              <h4>${escapeHtml(question.title || question.id)}</h4>
              <p>${escapeHtml(question.line || "")}</p>
              <code>${escapeHtml(question.imagePath)}</code>
              <div class="option-list">
                ${(question.options ?? []).map((option: any) => `<span>${escapeHtml(option.id)} → ${labelType(option.archetypeKey)}</span>`).join("")}
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function friendsTemplate(data: any = {}) {
  const links = data.links ?? [];
  return `
    <section class="panel">
      <div class="panel-head"><h3>好友圈關係表</h3><span>${links.length} 筆</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Owner</th><th>Friend</th><th>來源</th><th>建立時間</th></tr></thead>
          <tbody>
            ${links.map((link: any) => `
              <tr>
                <td>${avatar(link.owner?.picture_url)}<strong>${escapeHtml(link.owner?.display_name || shortId(link.owner?.line_user_id || link.owner_profile_id))}</strong></td>
                <td>${avatar(link.friend?.picture_url)}<strong>${escapeHtml(link.friend?.display_name || shortId(link.friend?.line_user_id || link.friend_profile_id))}</strong></td>
                <td>${escapeHtml(link.source)}</td>
                <td>${formatDate(link.created_at)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function metric(label: string, value: unknown) {
  return `<article class="metric"><span>${label}</span><strong>${value ?? 0}</strong></article>`;
}

function bar(label: string, value: number, max: number) {
  const width = max > 0 ? Math.max(5, Math.round((value / max) * 100)) : 0;
  return `<div class="bar-row"><span>${label}</span><div><i style="width:${width}%"></i></div><b>${value}</b></div>`;
}

function maxValue(values: Record<string, number>) {
  return Math.max(0, ...Object.values(values).map(Number));
}

function avatar(src?: string | null) {
  return src ? `<img class="avatar" src="${escapeHtml(src)}" alt="">` : `<span class="avatar empty">AI</span>`;
}

function typePill(type?: string | null) {
  return type ? `<span class="pill">${labelType(type)}</span>` : `<span class="muted">未完成</span>`;
}

function labelType(type?: string | null) {
  return ARCHETYPE_LABELS[type || "unknown"] || type || "未知";
}

function shortId(value: string) {
  if (!value) return "unknown";
  return value.length > 16 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
