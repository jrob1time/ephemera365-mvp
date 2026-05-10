const storeKey = "ephemera365-state";
const todayKey = new Date().toISOString().slice(0, 10);

const prompts = [
  "A quiet color you noticed today",
  "Something almost thrown away",
  "A shadow with a shape worth keeping",
  "The view from a familiar threshold",
  "A small repair",
  "A texture your hand remembers",
  "An object waiting patiently",
  "A trace of weather indoors",
  "Something arranged by accident",
  "The edge of a morning ritual",
  "A corner that held the light",
  "One thing that made the room feel alive"
];

const seedImages = [
  "assets/sample-1.png",
  "assets/sample-2.png",
  "assets/sample-3.png",
  "assets/sample-4.png"
];

const tiers = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    photoLimit: 50,
    circleLimit: 1,
    memberLimit: 10,
    filters: ["grid"],
    promptPacks: false
  },
  creator: {
    id: "creator",
    name: "Creator",
    price: "$6/month",
    photoLimit: 300,
    circleLimit: 3,
    memberLimit: 12,
    filters: ["date", "circle"],
    promptPacks: false
  },
  collector: {
    id: "collector",
    name: "Collector",
    price: "$15/month",
    photoLimit: 1000,
    circleLimit: 6,
    memberLimit: 15,
    filters: ["date", "circle", "tags"],
    promptPacks: true
  }
};

let state = loadState();
state = migrateState(state);
let sessionId = localStorage.getItem("ephemera365-session");
let activeView = "home";
let authMode = "signup";
let archiveFilter = "all";
let archiveDateFilter = "";
let archiveCircleFilter = "";
let archiveTagFilter = "";
let selectedCircleId = state.circles[0]?.id || null;
let pendingImage = "";
let pendingCheckoutTier = "";

const el = {
  authView: document.querySelector("#authView"),
  appView: document.querySelector("#appView"),
  authForm: document.querySelector("#authForm"),
  authUsername: document.querySelector("#authUsername"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authSubmit: document.querySelector("#authSubmit"),
  authMessage: document.querySelector("#authMessage"),
  sessionName: document.querySelector("#sessionName"),
  logoutBtn: document.querySelector("#logoutBtn"),
  dailyPrompt: document.querySelector("#dailyPrompt"),
  profileName: document.querySelector("#profileName"),
  publicInspiration: document.querySelector("#publicInspiration"),
  entryForm: document.querySelector("#entryForm"),
  entryImage: document.querySelector("#entryImage"),
  imagePreview: document.querySelector("#imagePreview"),
  uploadText: document.querySelector("#uploadText"),
  entryCaption: document.querySelector("#entryCaption"),
  entryTags: document.querySelector("#entryTags"),
  entryTagsWrap: document.querySelector("#entryTagsWrap"),
  entryVisibility: document.querySelector("#entryVisibility"),
  entryMessage: document.querySelector("#entryMessage"),
  createLimitNotice: document.querySelector("#createLimitNotice"),
  homeUsage: document.querySelector("#homeUsage"),
  paywallRoot: document.querySelector("#paywallRoot"),
  archiveFilterPanel: document.querySelector("#archiveFilterPanel"),
  archiveGrid: document.querySelector("#archiveGrid"),
  profilePosts: document.querySelector("#profilePosts"),
  circleList: document.querySelector("#circleList"),
  circleDetail: document.querySelector("#circleDetail"),
  newCircleBtn: document.querySelector("#newCircleBtn"),
  circleDialog: document.querySelector("#circleDialog"),
  circleForm: document.querySelector("#circleForm"),
  circleName: document.querySelector("#circleName"),
  circleInviteEmail: document.querySelector("#circleInviteEmail"),
  circleMessage: document.querySelector("#circleMessage"),
  postDialog: document.querySelector("#postDialog"),
  dialogContent: document.querySelector("#dialogContent"),
  reportList: document.querySelector("#reportList"),
  adminUsers: document.querySelector("#adminUsers"),
  checkoutDialog: document.querySelector("#checkoutDialog"),
  checkoutForm: document.querySelector("#checkoutForm"),
  checkoutTitle: document.querySelector("#checkoutTitle"),
  checkoutCopy: document.querySelector("#checkoutCopy")
};

function loadState() {
  const saved = localStorage.getItem(storeKey);
  if (saved) return JSON.parse(saved);

  return {
    users: [
      {
        id: "u-admin",
        username: "admin",
        email: "admin@ephemera.local",
        password: "admin",
        role: "admin",
        tier: "collector",
        createdAt: Date.now()
      }
    ],
    posts: [
      seedPost("p-public-1", "u-seed", "Mara", seedImages[0], "Steam on the kitchen window before the house woke.", "public", null, daysAgo(1)),
      seedPost("p-public-2", "u-seed", "Noor", seedImages[1], "Pressed leaves from a walk I nearly skipped.", "public", null, daysAgo(2)),
      seedPost("p-public-3", "u-seed", "Eli", seedImages[2], "A strip of red thread caught in the notebook spine.", "public", null, daysAgo(4)),
      seedPost("p-public-4", "u-seed", "June", seedImages[3], "The table after everyone left.", "public", null, daysAgo(5))
    ],
    circles: [],
    comments: [],
    reports: []
  };
}

function migrateState(savedState) {
  savedState.users = savedState.users || [];
  savedState.posts = savedState.posts || [];
  savedState.circles = savedState.circles || [];
  savedState.comments = savedState.comments || [];
  savedState.reports = savedState.reports || [];
  savedState.users.forEach((user) => {
    user.tier = tiers[user.tier] ? user.tier : user.role === "admin" ? "collector" : "free";
    user.subscriptionStatus = user.subscriptionStatus || (user.tier === "free" ? "free" : "active");
  });
  savedState.posts.forEach((post) => {
    post.tags = Array.isArray(post.tags) ? post.tags : [];
  });
  return savedState;
}

function seedPost(id, userId, username, image, caption, visibility, circleId, createdAt) {
  return { id, userId, username, image, caption, visibility, circleId, createdAt, prompt: promptForDate(new Date(createdAt)) };
}

function daysAgo(count) {
  const date = new Date();
  date.setDate(date.getDate() - count);
  return date.getTime();
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function currentUser() {
  return state.users.find((user) => user.id === sessionId) || null;
}

function tierFor(user = currentUser()) {
  return tiers[user?.tier] || tiers.free;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function promptForDate(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  return prompts[day % prompts.length];
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function userPosts(userId = currentUser()?.id) {
  return state.posts
    .filter((post) => post.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function userCircles(userId = currentUser()?.id) {
  return state.circles.filter((circle) => circle.memberIds.includes(userId));
}

function ownedCircles(userId = currentUser()?.id) {
  return state.circles.filter((circle) => circle.createdBy === userId);
}

function usageFor(user = currentUser()) {
  if (!user) return { photos: 0, circles: 0 };
  const usage = {
    photos: userPosts(user.id).length,
    circles: ownedCircles(user.id).length
  };
  user.usage = { photos: usage.photos, circles: usage.circles };
  return usage;
}

function usagePercent(value, max) {
  return Math.min(100, Math.round((value / max) * 100));
}

function limitMessage(kind = "archive") {
  const phrases = {
    archive: "You’ve filled your current archive. Upgrade to keep creating.",
    circles: "Your circles are full for this plan. Upgrade to make more space for trusted sharing.",
    members: "This circle has reached your plan’s member limit. Upgrade to invite more people."
  };
  return phrases[kind] || phrases.archive;
}

function isNearLimit(value, max) {
  return value >= max * 0.8 && value < max;
}

function softUpgradePrompt(kind = "archive") {
  const labels = {
    archive: "You’re almost out of space—ready to expand your archive?",
    circles: "Your circle practice is nearly at capacity—ready for a little more room?",
    members: "This circle is almost full—ready to make space for more trusted eyes?"
  };
  return `
    <div class="soft-upgrade">
      ${labels[kind] || labels.archive}
      <button class="tiny-btn" data-nav="subscription">Upgrade</button>
    </div>
  `;
}

function upgradeNotice(kind) {
  return `
    <div class="upgrade-callout">
      <p>${limitMessage(kind)}</p>
      <button class="secondary-btn" data-open-paywall="${kind}">See plans</button>
    </div>
  `;
}

function parseTags(value = "") {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function render() {
  const user = currentUser();
  const isAuthed = Boolean(user);
  el.authView.hidden = isAuthed;
  el.appView.hidden = !isAuthed;
  document.body.classList.toggle("is-authed", isAuthed);
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.hidden = !user || user.role !== "admin";
  });

  if (!isAuthed) {
    el.logoutBtn.hidden = true;
    el.sessionName.textContent = "";
    return;
  }

  importDesktopImage(user);
  el.logoutBtn.hidden = false;
  el.sessionName.textContent = `${user.username} · ${tierFor(user).name}`;
  applyInviteFromUrl();

  if (activeView === "admin" && user.role !== "admin") activeView = "home";
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-visible"));
  document.querySelector(`#${activeView}View`)?.classList.add("is-visible");
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === activeView);
  });

  el.dailyPrompt.textContent = promptForDate();
  el.profileName.textContent = user.username;

  renderVisibilityOptions();
  renderInspiration();
  renderUsage();
  renderArchive();
  renderCircles();
  renderProfile();
  renderSubscription();
  renderReports();
  renderAdminUsers();
}

function renderVisibilityOptions() {
  const circles = userCircles();
  const user = currentUser();
  const plan = tierFor(user);
  const usage = usageFor(user);
  const nearPhotoLimit = isNearLimit(usage.photos, plan.photoLimit);
  el.entryTagsWrap.hidden = plan.id !== "collector";
  el.createLimitNotice.innerHTML = usage.photos >= plan.photoLimit
    ? upgradeNotice("archive")
    : nearPhotoLimit && plan.id !== "collector"
      ? softUpgradePrompt("archive")
      : "";
  el.entryVisibility.innerHTML = `
    <option value="private">Private archive</option>
    ${circles.map((circle) => `<option value="${circle.id}">Circle: ${escapeHtml(circle.name)}</option>`).join("")}
  `;
}

function usageMeter(label, value, max) {
  return `
    <div class="usage-card">
      <div class="usage-row">
        <strong>${label}</strong>
        <span>${value} / ${max}</span>
      </div>
      <div class="meter"><span style="width: ${usagePercent(value, max)}%"></span></div>
    </div>
  `;
}

function renderUsage() {
  const user = currentUser();
  const plan = tierFor(user);
  const usage = usageFor(user);
  const nearPhotoLimit = isNearLimit(usage.photos, plan.photoLimit);
  const nearCircleLimit = isNearLimit(usage.circles, plan.circleLimit);
  el.homeUsage.innerHTML = `
    <div class="tier-pill">${plan.name} plan</div>
    ${usageMeter("Photos used", usage.photos, plan.photoLimit)}
    ${usageMeter("Circles", usage.circles, plan.circleLimit)}
    ${(nearPhotoLimit || nearCircleLimit) && plan.id !== "collector" ? softUpgradePrompt(nearPhotoLimit ? "archive" : "circles") : ""}
  `;
}

function renderSubscription() {
  const user = currentUser();
  if (!user) return;
  const plan = tierFor(user);
  const usage = usageFor(user);
  const rendered = window.EphemeraPaywall?.renderPaywall(el.paywallRoot, {
    currentTier: user.tier,
    usage: {
      photos: usage.photos,
      photoLimit: plan.photoLimit,
      circles: usage.circles,
      circleLimit: plan.circleLimit
    },
    onUpgrade: startCheckout,
    onContinue: () => {
      activeView = "home";
      render();
    }
  });

  if (!rendered) {
    el.paywallRoot.innerHTML = `
      <div class="fallback-paywall">
        <p class="eyebrow">Ephemera 365</p>
        <h1>Keep Creating</h1>
        <p>You’ve filled your current archive. Your work deserves more space to grow.</p>
        <div class="usage-overview">${usageMeter("Photos", usage.photos, plan.photoLimit)}${usageMeter("Circles", usage.circles, plan.circleLimit)}</div>
        <div class="plan-grid">
          ${Object.values(tiers).map((tier) => `
            <article class="plan-card ${tier.id === "collector" ? "is-current" : ""}">
              <p class="eyebrow">${tier.name}${tier.id === "collector" ? " · Most Popular" : ""}</p>
              <h2>${tier.price}</h2>
              <ul>
                <li>${tier.photoLimit} photos</li>
                <li>${tier.circleLimit} circle${tier.circleLimit === 1 ? "" : "s"}</li>
                <li>${tier.memberLimit} members per circle</li>
              </ul>
              <button class="${tier.id === user.tier ? "secondary-btn" : "primary-btn"}" ${tier.id === user.tier ? "disabled" : `data-checkout-tier="${tier.id}"`}>
                ${tier.id === user.tier ? "Current Plan" : tier.id === "creator" ? "Upgrade to Creator" : tier.id === "collector" ? "Upgrade to Collector" : "Continue with Free Plan"}
              </button>
            </article>
          `).join("")}
        </div>
        <p class="paywall-value">This isn’t just storage. It’s a place to track your growth, preserve your work, and share with people who understand your creativity.</p>
        <div class="trust-row">
          <span>Cancel anytime</span>
          <span>Your work is always yours</span>
          <span>No ads, ever</span>
        </div>
        <button class="quiet-btn" data-nav="home">Continue with Free Plan</button>
      </div>
    `;
  }
}

function postCard(post) {
  const canDelete = post.userId === currentUser()?.id;
  const place = post.visibility === "public"
    ? "Public inspiration"
    : post.circleId
      ? state.circles.find((circle) => circle.id === post.circleId)?.name || "Circle"
      : "Private";
  return `
    <article class="post-card">
      <button class="image-button" data-open-post="${post.id}" aria-label="Open post from ${escapeHtml(post.username)}">
        <img src="${post.image}" alt="${escapeHtml(post.caption || "Journal image")}" />
      </button>
      <div class="post-body">
        <p>${escapeHtml(post.caption || "Untitled entry")}</p>
        ${(post.tags || []).length ? `<div class="tag-list">${post.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        <span class="meta">${escapeHtml(place)} · ${formatDate(post.createdAt)}</span>
        <div class="post-actions">
          <button class="tiny-btn" data-report-post="${post.id}">Report</button>
          ${canDelete ? `<button class="tiny-btn danger-btn" data-delete-post="${post.id}">Delete</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderInspiration() {
  const posts = state.posts
    .filter((post) => post.visibility === "public")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4);
  el.publicInspiration.innerHTML = posts.map(postCard).join("");
}

function renderArchive() {
  const plan = tierFor();
  const canDate = plan.filters.includes("date");
  const canCircle = plan.filters.includes("circle");
  const canTags = plan.filters.includes("tags");
  const archiveSegment = document.querySelector("#archiveView .segmented-control");
  if (archiveSegment) archiveSegment.hidden = !canCircle;
  if (!canCircle) archiveFilter = "all";
  const circleOptions = userCircles().map((circle) => `<option value="${circle.id}" ${archiveCircleFilter === circle.id ? "selected" : ""}>${escapeHtml(circle.name)}</option>`).join("");
  el.archiveFilterPanel.innerHTML = `
    ${canDate ? `<label>Date <input id="archiveDateFilter" type="date" value="${archiveDateFilter}" /></label>` : ""}
    ${canCircle ? `<label>Circle <select id="archiveCircleFilter"><option value="">Any circle</option>${circleOptions}</select></label>` : ""}
    ${canTags ? `<label>Tag <input id="archiveTagFilter" type="text" value="${escapeHtml(archiveTagFilter)}" placeholder="collage" /></label>` : ""}
    ${!canDate && !canCircle && !canTags ? `<p class="form-note">Free archives use the simple grid view. Upgrade for filters when your collection grows.</p>` : ""}
  `;

  let posts = userPosts().filter((post) => archiveFilter === "all" || post.circleId);
  if (canDate && archiveDateFilter) {
    posts = posts.filter((post) => new Date(post.createdAt).toISOString().slice(0, 10) === archiveDateFilter);
  }
  if (canCircle && archiveCircleFilter) {
    posts = posts.filter((post) => post.circleId === archiveCircleFilter);
  }
  if (canTags && archiveTagFilter.trim()) {
    const tag = archiveTagFilter.trim().toLowerCase();
    posts = posts.filter((post) => (post.tags || []).includes(tag));
  }
  el.archiveGrid.innerHTML = posts.length
    ? posts.map(postCard).join("")
    : `<p class="empty-state">Your archive is waiting for its first image.</p>`;
}

function renderProfile() {
  const posts = userPosts();
  el.profilePosts.innerHTML = posts.length
    ? posts.map(postCard).join("")
    : `<p class="empty-state">No posts yet.</p>`;
}

function renderCircles() {
  const plan = tierFor();
  const circleUsage = usageFor().circles;
  const circles = userCircles();
  if (!circles.some((circle) => circle.id === selectedCircleId)) selectedCircleId = circles[0]?.id || null;

  el.circleList.innerHTML = circles.length
    ? circles.map((circle) => `
      <button class="circle-row ${circle.id === selectedCircleId ? "is-active" : ""}" data-select-circle="${circle.id}">
        <strong>${escapeHtml(circle.name)}</strong>
        <div class="meta">${circle.memberIds.length} / ${plan.memberLimit} members</div>
      </button>
    `).join("")
    : `<p class="empty-state">Create up to ${plan.circleLimit} circle${plan.circleLimit === 1 ? "" : "s"} for people you trust.</p>`;

  if (!selectedCircleId) {
    el.circleDetail.innerHTML = `<p class="empty-state">No circle selected.</p>`;
    return;
  }

  const circle = state.circles.find((item) => item.id === selectedCircleId);
  const nearMemberLimit = isNearLimit(circle.memberIds.length, plan.memberLimit);
  const posts = state.posts
    .filter((post) => post.circleId === circle.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const members = circle.memberIds.map((memberId) => state.users.find((user) => user.id === memberId)?.username || "Invited guest");

  el.circleDetail.innerHTML = `
    <div class="circle-top">
      <div>
        <p class="eyebrow">Circle feed</p>
        <h2>${escapeHtml(circle.name)}</h2>
      </div>
      <button class="secondary-btn" data-copy-invite="${circle.id}">Copy invite link</button>
    </div>
    <div class="member-list">
      Members: ${members.map(escapeHtml).join(", ")}
      <div class="meter member-meter"><span style="width: ${usagePercent(circle.memberIds.length, plan.memberLimit)}%"></span></div>
      <span>${circle.memberIds.length} / ${plan.memberLimit} members</span>
    </div>
    ${circleUsage >= plan.circleLimit ? upgradeNotice("circles") : ""}
    ${nearMemberLimit && plan.id !== "collector" ? softUpgradePrompt("members") : ""}
    <div class="feed-list">
      ${posts.length ? posts.map(circlePost).join("") : `<p class="empty-state">No shared posts here yet.</p>`}
    </div>
  `;
}

function circlePost(post) {
  const comments = state.comments
    .filter((comment) => comment.postId === post.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  return `
    <article class="feed-post">
      <img src="${post.image}" alt="${escapeHtml(post.caption || "Circle journal image")}" />
      <div>
        <p>${escapeHtml(post.caption || "Untitled entry")}</p>
        <div class="meta">${escapeHtml(post.username)} · ${formatDate(post.createdAt)}</div>
        <div class="post-actions">
          <button class="tiny-btn" data-open-post="${post.id}">Open</button>
          <button class="tiny-btn" data-report-post="${post.id}">Report</button>
        </div>
        <form class="comment-form" data-comment-form="${post.id}">
          <input name="comment" placeholder="Add a quiet note" required />
          <button class="tiny-btn" type="submit">Comment</button>
        </form>
        <div class="comments-list">
          ${comments.map(commentItem).join("")}
        </div>
      </div>
    </article>
  `;
}

function commentItem(comment) {
  const canDelete = comment.userId === currentUser()?.id;
  return `
    <div class="comment">
      <p>${escapeHtml(comment.text)}</p>
      <div class="comment-tools">
        <span class="comment-time">${escapeHtml(comment.username)} · ${formatDate(comment.createdAt)}</span>
        <button class="tiny-btn" data-report-comment="${comment.id}">Report</button>
        ${canDelete ? `<button class="tiny-btn" data-delete-comment="${comment.id}">Delete</button>` : ""}
      </div>
    </div>
  `;
}

function renderReports() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;
  el.reportList.innerHTML = state.reports.length
    ? state.reports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((report) => `
        <article class="report-item">
          <strong>${report.type === "post" ? "Post" : "Comment"} report</strong>
          <span class="meta">Reported by ${escapeHtml(report.reporter)} · ${formatDate(report.createdAt)}</span>
          <p>${escapeHtml(report.preview)}</p>
          <div><button class="tiny-btn" data-clear-report="${report.id}">Mark reviewed</button></div>
        </article>
      `).join("")
    : `<p class="empty-state">No reports at the moment.</p>`;
}

function renderAdminUsers() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;
  el.adminUsers.innerHTML = `
    <div class="admin-table">
      ${state.users.map((account) => {
        const usage = usageFor(account);
        const plan = tierFor(account);
        return `
          <article class="admin-row">
            <div>
              <strong>${escapeHtml(account.username)}</strong>
              <div class="meta">${escapeHtml(account.email)} · ${usage.photos} photos · ${usage.circles} circles</div>
            </div>
            <label>
              Tier
              <select data-admin-tier="${account.id}">
                ${Object.values(tiers).map((tier) => `<option value="${tier.id}" ${account.tier === tier.id ? "selected" : ""}>${tier.name}</option>`).join("")}
              </select>
            </label>
            <span class="tier-pill">${plan.name}</span>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function importDesktopImage(user) {
  if (user.email !== "jeremy@example.test") return;
  const importId = `post-import-0-${user.id}`;
  if (state.posts.some((post) => post.id === importId)) return;
  state.posts.push({
    id: importId,
    userId: user.id,
    username: user.username,
    image: "assets/user-entry-0.jpg",
    caption: "",
    visibility: "private",
    circleId: null,
    createdAt: Date.now(),
    prompt: promptForDate()
  });
  saveState();
}

function openPost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;
  const location = post.circleId
    ? state.circles.find((circle) => circle.id === post.circleId)?.name
    : post.visibility === "public"
      ? "Public inspiration"
      : "Private archive";

  el.dialogContent.innerHTML = `
    <article class="dialog-post">
      <img src="${post.image}" alt="${escapeHtml(post.caption || "Journal image")}" />
      <div>
        <p class="eyebrow">${escapeHtml(location || "Entry")}</p>
        <h2>${escapeHtml(post.prompt)}</h2>
        <p>${escapeHtml(post.caption || "No caption.")}</p>
        <p class="meta">${escapeHtml(post.username)} · ${formatDate(post.createdAt)}</p>
        <div class="post-actions">
          <button class="tiny-btn" data-report-post="${post.id}">Report</button>
          ${post.userId === currentUser()?.id ? `<button class="tiny-btn danger-btn" data-delete-post="${post.id}">Delete</button>` : ""}
        </div>
      </div>
    </article>
  `;
  el.postDialog.showModal();
}

function addReport(type, id) {
  const user = currentUser();
  const target = type === "post"
    ? state.posts.find((post) => post.id === id)
    : state.comments.find((comment) => comment.id === id);
  if (!target) return;
  state.reports.push({
    id: makeId("report"),
    type,
    targetId: id,
    reporter: user.username,
    preview: type === "post" ? target.caption || "Image post without caption" : target.text,
    createdAt: Date.now()
  });
  saveState();
  render();
}

function showMessage(node, text) {
  node.textContent = text;
  window.setTimeout(() => {
    if (node.textContent === text) node.textContent = "";
  }, 2600);
}

function showToast(text) {
  el.toast.textContent = text;
  el.toast.classList.add("is-visible");
  window.setTimeout(() => {
    if (el.toast.textContent === text) {
      el.toast.classList.remove("is-visible");
      el.toast.textContent = "";
    }
  }, 2800);
}

function resetEntryForm() {
  pendingImage = "";
  el.entryForm.reset();
  el.imagePreview.removeAttribute("src");
  el.imagePreview.hidden = true;
  el.uploadText.hidden = false;
  el.entryMessage.textContent = "";
}

function openPaywall() {
  activeView = "subscription";
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function startCheckout(tierId) {
  if (!tiers[tierId]) return;
  pendingCheckoutTier = tierId;
  const tier = tiers[pendingCheckoutTier];
  el.checkoutTitle.textContent = `${tier.id === "free" ? "Change to" : "Subscribe to"} ${tier.name}`;
  el.checkoutCopy.textContent = tier.id === "free"
    ? "Your plan will change immediately. Existing posts and circles stay in place, but new creation follows Free limits."
    : `${tier.price}, monthly billing. Stripe checkout would securely collect payment here.`;
  el.checkoutDialog.showModal();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.dataset.nav) {
    event.preventDefault();
    activeView = target.dataset.nav;
    if (activeView === "create") resetEntryForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  }

  if (target.dataset.authMode) {
    authMode = target.dataset.authMode;
    document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.authMode === authMode));
    el.authSubmit.textContent = authMode === "signup" ? "Create account" : "Log in";
    el.authMessage.textContent = "";
  }

  if (target.dataset.filter) {
    archiveFilter = target.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === archiveFilter));
    renderArchive();
  }

  if (target.id === "logoutBtn") {
    sessionId = null;
    localStorage.removeItem("ephemera365-session");
    render();
  }

  if (target.dataset.openPost) openPost(target.dataset.openPost);
  if (target.dataset.reportPost) addReport("post", target.dataset.reportPost);
  if (target.dataset.reportComment) addReport("comment", target.dataset.reportComment);

  if (target.dataset.deletePost) {
    const postId = target.dataset.deletePost;
    const post = state.posts.find((item) => item.id === postId);
    if (!post || post.userId !== currentUser()?.id) return;
    state.posts = state.posts.filter((item) => item.id !== postId);
    state.comments = state.comments.filter((comment) => comment.postId !== postId);
    state.reports = state.reports.filter((report) => report.targetId !== postId);
    saveState();
    if (el.postDialog.open) el.postDialog.close();
    activeView = "archive";
    showToast("Entry deleted.");
    render();
  }

  if (target.dataset.deleteComment) {
    state.comments = state.comments.filter((comment) => comment.id !== target.dataset.deleteComment || comment.userId !== currentUser().id);
    saveState();
    render();
  }

  if (target.dataset.clearReport) {
    state.reports = state.reports.filter((report) => report.id !== target.dataset.clearReport);
    saveState();
    render();
  }

  if (target.dataset.selectCircle) {
    selectedCircleId = target.dataset.selectCircle;
    renderCircles();
  }

  if (target.dataset.openPaywall) {
    openPaywall(target.dataset.openPaywall);
  }

  if (target.dataset.copyInvite) {
    const circle = state.circles.find((item) => item.id === target.dataset.copyInvite);
    const plan = tierFor(state.users.find((user) => user.id === circle?.createdBy));
    if (circle && circle.memberIds.length >= plan.memberLimit) {
      openPaywall("members");
      return;
    }
    const link = `${location.origin}${location.pathname}?invite=${target.dataset.copyInvite}`;
    navigator.clipboard?.writeText(link);
    target.textContent = "Invite link copied";
  }

  if (target.id === "newCircleBtn") {
    const plan = tierFor();
    const circleCount = ownedCircles(currentUser().id).length;
    if (circleCount >= plan.circleLimit) {
      openPaywall("circles");
      return;
    }
    el.circleName.value = "";
    el.circleInviteEmail.value = "";
    el.circleMessage.textContent = "";
    el.circleDialog.showModal();
  }

  if (target.dataset.closeDialog !== undefined) el.postDialog.close();
  if (target.dataset.closeCircle !== undefined) el.circleDialog.close();
  if (target.dataset.closeCheckout !== undefined) el.checkoutDialog.close();
  if (target.dataset.checkoutTier) {
    startCheckout(target.dataset.checkoutTier);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "archiveDateFilter") {
    archiveDateFilter = event.target.value;
    renderArchive();
  }
  if (event.target.id === "archiveTagFilter") {
    archiveTagFilter = event.target.value;
    renderArchive();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "archiveCircleFilter") {
    archiveCircleFilter = event.target.value;
    renderArchive();
  }
  if (event.target.dataset.adminTier) {
    const account = state.users.find((user) => user.id === event.target.dataset.adminTier);
    if (!account) return;
    account.tier = event.target.value;
    account.subscriptionStatus = account.tier === "free" ? "free" : "active";
    saveState();
    render();
  }
});

function readSelectedImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}

document.addEventListener("submit", async (event) => {
  if (event.target === el.authForm) {
    event.preventDefault();
    const username = el.authUsername.value.trim();
    const email = el.authEmail.value.trim().toLowerCase();
    const password = el.authPassword.value;

    if (authMode === "signup") {
      if (state.users.some((user) => user.email === email)) {
        showMessage(el.authMessage, "That email already has an account.");
        return;
      }
      const user = { id: makeId("user"), username, email, password, role: "member", tier: "free", subscriptionStatus: "free", createdAt: Date.now() };
      state.users.push(user);
      sessionId = user.id;
      saveState();
      localStorage.setItem("ephemera365-session", sessionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
      return;
    }

    const user = state.users.find((item) => item.email === email && item.password === password);
    if (!user) {
      showMessage(el.authMessage, "Email or password did not match.");
      return;
    }
    sessionId = user.id;
    localStorage.setItem("ephemera365-session", sessionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
  }

  if (event.target === el.entryForm) {
  event.preventDefault();

  const user = currentUser();
  const plan = tierFor(user);

  if (usageFor(user).photos >= plan.photoLimit) {
    el.createLimitNotice.innerHTML = upgradeNotice("archive");
    showMessage(el.entryMessage, limitMessage("archive"));
    openPaywall("archive");
    return;
  }

  const selectedFile = el.entryImage.files[0];
  const imageData = pendingImage || await readSelectedImage(selectedFile);

  if (!imageData) {
    showMessage(el.entryMessage, "An image is required.");
    return;
  }

  const visibility = el.entryVisibility.value;
  const circleId = visibility === "private" ? null : visibility;

  state.posts.push({
    id: makeId("post"),
    userId: user.id,
    username: user.username,
    image: imageData,
    caption: el.entryCaption.value.trim(),
    tags: plan.id === "collector" ? parseTags(el.entryTags.value) : [],
    visibility: circleId ? "circle" : "private",
    circleId,
    createdAt: Date.now(),
    prompt: promptForDate()
  });

  saveState();

  pendingImage = "";
  el.entryForm.reset();
  el.imagePreview.removeAttribute("src");
  el.imagePreview.hidden = true;
  el.uploadText.hidden = false;
  el.entryMessage.textContent = "";

  activeView = "archive";
  selectedCircleId = circleId || selectedCircleId;
  render();

  showToast("Entry created.");
}


  if (event.target.matches("[data-comment-form]")) {
    event.preventDefault();
    const input = event.target.elements.comment;
    const text = input.value.trim();
    if (!text) return;
    state.comments.push({
      id: makeId("comment"),
      postId: event.target.dataset.commentForm,
      userId: currentUser().id,
      username: currentUser().username,
      text,
      createdAt: Date.now()
    });
    input.value = "";
    saveState();
    renderCircles();
  }

  if (event.target === el.circleForm) {
    event.preventDefault();
    const user = currentUser();
    const plan = tierFor(user);
    if (ownedCircles(user.id).length >= plan.circleLimit) {
      el.circleMessage.innerHTML = upgradeNotice("circles");
      el.circleDialog.close();
      openPaywall("circles");
      return;
    }
    const inviteEmail = el.circleInviteEmail.value.trim().toLowerCase();
    const inviteUser = state.users.find((item) => item.email === inviteEmail);
    const memberIds = inviteUser && inviteUser.id !== user.id ? [user.id, inviteUser.id] : [user.id];
    if (memberIds.length > plan.memberLimit) {
      el.circleMessage.innerHTML = upgradeNotice("members");
      return;
    }
    const circle = {
      id: makeId("circle"),
      name: el.circleName.value.trim(),
      createdBy: user.id,
      memberIds,
      invitedEmails: inviteEmail ? [inviteEmail] : [],
      createdAt: Date.now()
    };
    state.circles.push(circle);
    selectedCircleId = circle.id;
    saveState();
    el.circleDialog.close();
    activeView = "circles";
    render();
  }

  if (event.target === el.checkoutForm) {
    event.preventDefault();
    const user = currentUser();
    if (!user || !tiers[pendingCheckoutTier]) return;
    user.tier = pendingCheckoutTier;
    user.subscriptionStatus = pendingCheckoutTier === "free" ? "free" : "active";
    saveState();
    el.checkoutDialog.close();
    pendingCheckoutTier = "";
    render();
  }
});

el.entryImage.addEventListener("change", () => {
  const file = el.entryImage.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingImage = reader.result;
    el.imagePreview.src = pendingImage;
    el.imagePreview.hidden = false;
    el.uploadText.hidden = true;
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => el.postDialog.close());
});

saveState();
render();

function applyInviteFromUrl() {
  const params = new URLSearchParams(location.search);
  const inviteId = params.get("invite");
  if (!inviteId) return;
  const circle = state.circles.find((item) => item.id === inviteId);
  const user = currentUser();
  const owner = state.users.find((account) => account.id === circle?.createdBy);
  const plan = tierFor(owner);
  if (circle && user && !circle.memberIds.includes(user.id) && circle.memberIds.length < plan.memberLimit) {
    circle.memberIds.push(user.id);
    selectedCircleId = circle.id;
    activeView = "circles";
    saveState();
  }
  history.replaceState(null, "", location.pathname);
}
