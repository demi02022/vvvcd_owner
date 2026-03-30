const DEFAULT_EDITOR_SETTINGS = {
  imageScale: 1,
  imageX: 50,
  imageY: 50,
  textX: 24,
  textY: 24,
  textWidth: 54,
  overlayOpacity: 0.72
};

const DEFAULT_PROMO_SLIDES = [
  {
    id: "visual-league",
    title: "시각 내전",
    meta: "행사 기간 : 4월 8일(수)~4월 10일(금)",
    image: "assets/event-banner-poster.jpeg",
    link: "",
    background: "#b9c0cd",
    dark: false,
    editorSettings: { ...DEFAULT_EDITOR_SETTINGS }
  },
  {
    id: "circle-leader-recruitment",
    title: "써클장 모집",
    meta: "기간 : 페이지 확인",
    image: "",
    link: "https://forms.gle/rQKQXmLhevxFGWRbA",
    background: "#b8b8b8",
    dark: true,
    editorSettings: { ...DEFAULT_EDITOR_SETTINGS, overlayOpacity: 0.42 }
  }
];

const DEFAULT_STUDENT_EVENTS = [
  {
    id: "circle-recruitment",
    title: "써클 모집 기간 · 19:00",
    start: "2026-03-24",
    end: "2026-03-24",
    type: "student-event"
  },
  {
    id: "visual-war",
    title: "시각디자인학과 내전",
    start: "2026-04-08",
    end: "2026-04-10",
    type: "student-event"
  }
];

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const state = {
  promoSlides: cloneData(DEFAULT_PROMO_SLIDES),
  studentEvents: cloneData(DEFAULT_STUDENT_EVENTS),
  promoEditorIndex: 0,
  session: null,
  activeDetailEditorIndex: null,
  detailDraft: null
};

const refs = {
  promoList: document.querySelector("#promo-slide-list"),
  eventList: document.querySelector("#student-event-list"),
  status: document.querySelector("#admin-status"),
  addPromo: document.querySelector("#add-promo-slide"),
  addEvent: document.querySelector("#add-student-event"),
  save: document.querySelector("#save-admin-data"),
  reset: document.querySelector("#reset-admin-data"),
  promoPrev: document.querySelector("#promo-prev"),
  promoNext: document.querySelector("#promo-next"),
  promoPosition: document.querySelector("#promo-position"),
  editorGrid: document.querySelector("#admin-editor-grid"),
  actionBoard: document.querySelector("#admin-action-board"),
  loginModal: document.querySelector("#admin-login-modal"),
  loginForm: document.querySelector("#admin-login-form"),
  email: document.querySelector("#admin-email"),
  password: document.querySelector("#admin-password"),
  authStatus: document.querySelector("#admin-auth-status"),
  sessionPanel: document.querySelector("#admin-session-panel"),
  sessionEmail: document.querySelector("#admin-session-email"),
  signOut: document.querySelector("#admin-signout"),
  detailModal: document.querySelector("#promo-editor-modal"),
  detailPreview: document.querySelector("#promo-editor-preview"),
  detailPreviewImage: document.querySelector("#promo-editor-preview-image"),
  detailPreviewOverlay: document.querySelector("#promo-editor-preview-overlay"),
  detailPreviewCopy: document.querySelector("#promo-editor-preview-copy"),
  detailPreviewTitle: document.querySelector("#promo-editor-preview-title"),
  detailPreviewMeta: document.querySelector("#promo-editor-preview-meta"),
  editorTitle: document.querySelector("#editor-title"),
  editorMeta: document.querySelector("#editor-meta"),
  editorImageScale: document.querySelector("#editor-image-scale"),
  editorImageX: document.querySelector("#editor-image-x"),
  editorImageY: document.querySelector("#editor-image-y"),
  editorTextX: document.querySelector("#editor-text-x"),
  editorTextY: document.querySelector("#editor-text-y"),
  editorTextWidth: document.querySelector("#editor-text-width"),
  editorOverlay: document.querySelector("#editor-overlay"),
  editorReset: document.querySelector("#editor-reset"),
  editorSave: document.querySelector("#editor-save")
};

function setStatus(message) {
  if (refs.status) refs.status.textContent = message;
}

function setAuthStatus(message) {
  if (refs.authStatus) refs.authStatus.textContent = message;
}

function setEditorVisibility(visible) {
  if (refs.editorGrid) refs.editorGrid.hidden = false;
  if (refs.actionBoard) refs.actionBoard.hidden = false;
  if (refs.loginModal) {
    refs.loginModal.classList.toggle("active", !visible);
    refs.loginModal.setAttribute("aria-hidden", visible ? "true" : "false");
  }
  document.body.classList.toggle("admin-locked", !visible);
}

function normalizeEditorSettings(settings = {}) {
  return {
    imageScale: Number(settings.imageScale ?? DEFAULT_EDITOR_SETTINGS.imageScale),
    imageX: Number(settings.imageX ?? DEFAULT_EDITOR_SETTINGS.imageX),
    imageY: Number(settings.imageY ?? DEFAULT_EDITOR_SETTINGS.imageY),
    textX: Number(settings.textX ?? DEFAULT_EDITOR_SETTINGS.textX),
    textY: Number(settings.textY ?? DEFAULT_EDITOR_SETTINGS.textY),
    textWidth: Number(settings.textWidth ?? DEFAULT_EDITOR_SETTINGS.textWidth),
    overlayOpacity: Number(settings.overlayOpacity ?? DEFAULT_EDITOR_SETTINGS.overlayOpacity)
  };
}

function ensurePromoShape(slide) {
  return {
    id: slide.id || makeId("promo"),
    title: slide.title || "",
    meta: slide.meta || "",
    image: slide.image || "",
    link: slide.link || "",
    background: slide.background || "#b8b8b8",
    dark: Boolean(slide.dark),
    editorSettings: normalizeEditorSettings(slide.editorSettings || slide.editor_settings || {})
  };
}

function ensureEventShape(event) {
  return {
    id: event.id || makeId("student-event"),
    title: event.title || "",
    start: event.start || "2026-03-30",
    end: event.end || event.start || "2026-03-30",
    type: "student-event"
  };
}

function updatePromoControls() {
  const count = state.promoSlides.length;
  const safeCount = count || 1;
  const current = count ? state.promoEditorIndex + 1 : 0;
  if (refs.promoPosition) refs.promoPosition.textContent = `${current} / ${safeCount}`;
  if (refs.promoPrev) refs.promoPrev.disabled = count <= 1;
  if (refs.promoNext) refs.promoNext.disabled = count <= 1;
}

function renderPromoSlides() {
  if (!refs.promoList) return;
  refs.promoList.innerHTML = "";

  if (!state.promoSlides.length) {
    refs.promoList.innerHTML = '<p class="admin-list-empty">등록된 배너가 없습니다. 배너 추가로 새 항목을 만들어 주세요.</p>';
    updatePromoControls();
    return;
  }

  state.promoEditorIndex = Math.max(0, Math.min(state.promoEditorIndex, state.promoSlides.length - 1));
  const slide = state.promoSlides[state.promoEditorIndex];
  const index = state.promoEditorIndex;

  const item = document.createElement("article");
  item.className = "admin-item admin-item-promo";
  item.innerHTML = `
    <div class="admin-item-header">
      <strong>배너 ${index + 1}</strong>
      <button class="inline-link admin-danger" type="button" data-remove-promo="${index}">삭제</button>
    </div>
    <div class="admin-form-grid">
      <label class="admin-field">
        <span>행사명</span>
        <input type="text" value="${slide.title}" data-promo-field="title" data-index="${index}" />
      </label>
      <label class="admin-field">
        <span>기간/설명</span>
        <input type="text" value="${slide.meta}" data-promo-field="meta" data-index="${index}" />
      </label>
      <label class="admin-field admin-field-wide">
        <span>포스터 이미지 경로 또는 URL</span>
        <input type="text" value="${slide.image}" data-promo-field="image" data-index="${index}" placeholder="예: assets/event-banner-poster.jpeg 또는 이미지 URL" />
      </label>
      <div class="admin-upload-panel admin-field-wide">
        <span class="admin-upload-title">포스터 업로드</span>
        <label class="admin-upload-dropzone" data-upload-dropzone="${index}">
          <input type="file" accept="image/*" data-promo-upload="${index}" hidden />
          <strong>파일을 드래그하거나 클릭해서 업로드</strong>
          <small>${slide.image ? '현재 이미지가 연결되어 있습니다.' : 'PNG, JPG, WEBP 파일 업로드 가능'}</small>
        </label>
        <div class="admin-upload-actions">
          <button class="inline-link admin-upload-browse" type="button" data-upload-browse="${index}">파일 찾아보기</button>
        </div>
      </div>
      <div class="admin-detail-actions admin-field-wide">
        <button class="inline-link admin-detail-button" type="button" data-open-detail-editor="${index}">상세 조정 열기</button>
        <p class="admin-detail-caption">업로드 후 크롭, 이미지 위치, 텍스트 배치까지 세부 조정할 수 있습니다.</p>
      </div>
      <label class="admin-field admin-field-wide">
        <span>클릭 링크</span>
        <input type="text" value="${slide.link}" data-promo-field="link" data-index="${index}" placeholder="비우면 클릭 링크 없음" />
      </label>
      <label class="admin-field">
        <span>배경 색상</span>
        <input type="text" value="${slide.background}" data-promo-field="background" data-index="${index}" placeholder="#b8b8b8" />
      </label>
      <label class="admin-toggle">
        <input type="checkbox" ${slide.dark ? "checked" : ""} data-promo-field="dark" data-index="${index}" />
        <span>어두운 텍스트 스타일 사용</span>
      </label>
    </div>
  `;
  refs.promoList.appendChild(item);
  updatePromoControls();
}

function renderStudentEvents() {
  if (!refs.eventList) return;
  refs.eventList.innerHTML = "";

  state.studentEvents.forEach((event, index) => {
    const item = document.createElement("article");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="admin-item-header">
        <strong>학생회 일정 ${index + 1}</strong>
        <button class="inline-link admin-danger" type="button" data-remove-event="${index}">삭제</button>
      </div>
      <div class="admin-form-grid admin-form-grid-events">
        <label class="admin-field admin-field-wide">
          <span>일정명</span>
          <input type="text" value="${event.title}" data-event-field="title" data-index="${index}" />
        </label>
        <label class="admin-field">
          <span>시작일</span>
          <input type="date" value="${event.start}" data-event-field="start" data-index="${index}" />
        </label>
        <label class="admin-field">
          <span>종료일</span>
          <input type="date" value="${event.end}" data-event-field="end" data-index="${index}" />
        </label>
      </div>
    `;
    refs.eventList.appendChild(item);
  });
}

function renderAll() {
  renderPromoSlides();
  renderStudentEvents();
}

async function loadRemoteState() {
  if (!window.kmuSupabaseApi) {
    setStatus("Supabase 연결을 찾을 수 없습니다.");
    return;
  }

  setStatus("Supabase 데이터를 불러오는 중입니다...");
  const [promoSlides, studentEvents] = await Promise.all([
    window.kmuSupabaseApi.fetchPromoSlides(DEFAULT_PROMO_SLIDES),
    window.kmuSupabaseApi.fetchStudentEvents(DEFAULT_STUDENT_EVENTS)
  ]);

  state.promoSlides = promoSlides.map(ensurePromoShape);
  state.studentEvents = studentEvents.map(ensureEventShape);
  state.promoEditorIndex = 0;
  renderAll();
  setStatus("Supabase 데이터를 불러왔습니다.");
}

function syncDetailFormToPreview() {
  if (state.activeDetailEditorIndex === null) return;
  const draft = state.detailDraft;
  if (!draft) return;

  refs.detailPreviewImage.style.backgroundImage = draft.image ? `url('${draft.image.replace(/'/g, "\\'")}')` : 'none';
  refs.detailPreviewImage.style.backgroundColor = draft.background || '#b8b8b8';
  refs.detailPreviewImage.style.backgroundPosition = `${draft.editorSettings.imageX}% ${draft.editorSettings.imageY}%`;
  refs.detailPreviewImage.style.backgroundSize = `${draft.editorSettings.imageScale * 100}% auto`;
  refs.detailPreviewOverlay.style.background = `linear-gradient(180deg, rgba(7, 17, 32, 0) 0%, rgba(7, 17, 32, ${Math.max(0.12, draft.editorSettings.overlayOpacity * 0.45).toFixed(2)}) 46%, rgba(7, 17, 32, ${draft.editorSettings.overlayOpacity.toFixed(2)}) 100%)`;
  refs.detailPreviewCopy.style.left = `${draft.editorSettings.textX}px`;
  refs.detailPreviewCopy.style.bottom = `${draft.editorSettings.textY}px`;
  refs.detailPreviewCopy.style.width = `${draft.editorSettings.textWidth}%`;
  refs.detailPreviewTitle.textContent = draft.title || '행사명';
  refs.detailPreviewMeta.textContent = draft.meta || '기간 또는 설명을 입력하세요';
}

function openDetailEditor(index) {
  const slide = state.promoSlides[index];
  if (!slide) return;
  state.activeDetailEditorIndex = index;
  state.detailDraft = cloneData(ensurePromoShape(slide));
  const settings = normalizeEditorSettings(slide.editorSettings);

  refs.editorTitle.value = slide.title || '';
  refs.editorMeta.value = slide.meta || '';
  refs.editorImageScale.value = settings.imageScale;
  refs.editorImageX.value = settings.imageX;
  refs.editorImageY.value = settings.imageY;
  refs.editorTextX.value = settings.textX;
  refs.editorTextY.value = settings.textY;
  refs.editorTextWidth.value = settings.textWidth;
  refs.editorOverlay.value = settings.overlayOpacity;

  refs.detailModal.hidden = false;
  refs.detailModal.classList.add('active');
  refs.detailModal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    syncDetailFormToPreview();
    refreshRangeTracks();
  });
}

function closeDetailEditor() {
  state.activeDetailEditorIndex = null;
  state.detailDraft = null;
  refs.detailModal.classList.remove('active');
  refs.detailModal.setAttribute('aria-hidden', 'true');
  refs.detailModal.hidden = true;
}

function resetDetailEditor() {
  if (state.activeDetailEditorIndex === null) return;
  const slide = state.promoSlides[state.activeDetailEditorIndex];
  const resetSlide = ensurePromoShape({ ...slide, editorSettings: DEFAULT_EDITOR_SETTINGS });
  state.detailDraft = cloneData(resetSlide);
  refs.editorTitle.value = resetSlide.title || "";
  refs.editorMeta.value = resetSlide.meta || "";
  refs.editorImageScale.value = resetSlide.editorSettings.imageScale;
  refs.editorImageX.value = resetSlide.editorSettings.imageX;
  refs.editorImageY.value = resetSlide.editorSettings.imageY;
  refs.editorTextX.value = resetSlide.editorSettings.textX;
  refs.editorTextY.value = resetSlide.editorSettings.textY;
  refs.editorTextWidth.value = resetSlide.editorSettings.textWidth;
  refs.editorOverlay.value = resetSlide.editorSettings.overlayOpacity;
  syncDetailFormToPreview();
  refreshRangeTracks();
}

function applyDetailEditor() {
  if (state.activeDetailEditorIndex === null || !state.detailDraft) return;
  state.promoSlides[state.activeDetailEditorIndex] = ensurePromoShape(state.detailDraft);
  renderPromoSlides();
  closeDetailEditor();
  setStatus('상세 조정이 반영되었습니다. 저장해 주세요.');
}

function updateDetailDraftFromInputs() {
  if (!state.detailDraft) return;
  state.detailDraft.title = refs.editorTitle.value;
  state.detailDraft.meta = refs.editorMeta.value;
  state.detailDraft.editorSettings = normalizeEditorSettings({
    imageScale: refs.editorImageScale.value,
    imageX: refs.editorImageX.value,
    imageY: refs.editorImageY.value,
    textX: refs.editorTextX.value,
    textY: refs.editorTextY.value,
    textWidth: refs.editorTextWidth.value,
    overlayOpacity: refs.editorOverlay.value
  });
  requestAnimationFrame(() => {
    syncDetailFormToPreview();
    refreshRangeTracks();
  });
}

function paintRangeTrack(range) {
  if (!range) return;
  const wrapper = range.closest('[data-range-wrapper]');
  if (!wrapper) return;
  const min = Number(range.min || 0);
  const max = Number(range.max || 100);
  const value = Number(range.value || 0);
  const ratio = max === min ? 0 : (value - min) / (max - min);
  const clamped = Math.min(1, Math.max(0, ratio));
  const thumbSize = 24;
  const sideInset = 12;
  const width = Math.max(wrapper.clientWidth || 0, thumbSize + sideInset * 2);
  const trackWidth = Math.max(width - sideInset * 2, 1);
  const position = sideInset + trackWidth * clamped;
  const fillWidth = Math.max(0, position - sideInset);
  wrapper.style.setProperty('--range-position', `${position}px`);
  wrapper.style.setProperty('--range-fill-width', `${fillWidth}px`);
  wrapper.style.setProperty('--range-thumb-size', `${thumbSize}px`);
}

function refreshRangeTracks() {
  [
    refs.editorImageScale,
    refs.editorImageX,
    refs.editorImageY,
    refs.editorTextX,
    refs.editorTextY,
    refs.editorTextWidth,
    refs.editorOverlay
  ].forEach(paintRangeTrack);
}

async function uploadPromoImageAt(index, file) {
  if (!state.session || !window.kmuSupabaseApi) {
    setStatus('로그인 후 이미지 업로드를 할 수 있습니다.');
    return;
  }

  try {
    setStatus('이미지를 업로드하는 중입니다...');
    const imageUrl = await window.kmuSupabaseApi.uploadPromoImage(file);
    if (!state.promoSlides[index]) return;
    state.promoSlides[index].image = imageUrl;
    renderPromoSlides();
    openDetailEditor(index);
    if (state.detailDraft) {
      state.detailDraft.image = imageUrl;
      syncDetailFormToPreview();
      refreshRangeTracks();
    }
    setStatus('이미지가 업로드되었습니다. 상세 조정 후 저장해 주세요.');
  } catch (error) {
    console.error(error);
    setStatus(`이미지 업로드 실패: ${error.message || 'Storage 설정을 확인해 주세요.'}`);
  }
}

async function saveAll() {
  if (!state.session || !window.kmuSupabaseApi) {
    setStatus('로그인 후 저장할 수 있습니다.');
    return;
  }

  const promoPayload = state.promoSlides
    .map(ensurePromoShape)
    .filter((slide) => slide.title.trim());
  const eventPayload = state.studentEvents
    .map(ensureEventShape)
    .filter((event) => event.title.trim() && event.start && event.end);

  try {
    setStatus('Supabase에 저장 중입니다...');
    const [savedSlides, savedEvents] = await Promise.all([
      window.kmuSupabaseApi.replacePromoSlides(promoPayload),
      window.kmuSupabaseApi.replaceStudentEvents(eventPayload)
    ]);
    state.promoSlides = savedSlides.map(ensurePromoShape);
    state.studentEvents = savedEvents.map(ensureEventShape);
    renderAll();
    setStatus('저장되었습니다.');
  } catch (error) {
    console.error(error);
    setStatus(`저장 실패: ${error.message || 'Supabase 설정을 확인해 주세요.'}`);
  }
}

async function handleAuthSession(session) {
  state.session = session;
  const loggedIn = Boolean(session);
  if (refs.loginForm) refs.loginForm.hidden = loggedIn;
  if (refs.sessionPanel) refs.sessionPanel.hidden = !loggedIn;
  if (refs.sessionEmail) refs.sessionEmail.textContent = session?.user?.email || '-';
  setEditorVisibility(loggedIn);

  if (loggedIn) {
    setAuthStatus('로그인되었습니다. 저장하면 메인 사이트에 바로 반영됩니다.');
    setStatus('편집 가능한 상태입니다.');
  } else {
    setAuthStatus('');
    setStatus('읽기 전용으로 표시 중입니다. 로그인 후 저장할 수 있습니다.');
  }
}

function bindInteractions() {
  refs.loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.kmuSupabaseApi) {
      setAuthStatus('Supabase 연결을 찾을 수 없습니다.');
      return;
    }

    try {
      setAuthStatus('로그인 중입니다...');
      const { error } = await window.kmuSupabaseApi.signIn(refs.email.value.trim(), refs.password.value);
      if (error) throw error;
      refs.password.value = '';
    } catch (error) {
      console.error(error);
      setAuthStatus(`로그인 실패: ${error.message || '계정을 확인해 주세요.'}`);
    }
  });

  refs.signOut?.addEventListener('click', async () => {
    if (!window.kmuSupabaseApi) return;
    await window.kmuSupabaseApi.signOut();
    setAuthStatus('로그아웃되었습니다.');
  });

  refs.addPromo?.addEventListener('click', () => {
    state.promoSlides.push(ensurePromoShape({
      id: makeId('promo'),
      title: '새 행사',
      meta: '기간을 입력하세요',
      image: '',
      link: '',
      background: '#b8b8b8',
      dark: true,
      editorSettings: { ...DEFAULT_EDITOR_SETTINGS }
    }));
    state.promoEditorIndex = state.promoSlides.length - 1;
    renderPromoSlides();
    setStatus('새 행사 배너를 추가했습니다. 저장해 주세요.');
  });

  refs.addEvent?.addEventListener('click', () => {
    state.studentEvents.push(ensureEventShape({
      id: makeId('student-event'),
      title: '새 학생회 행사',
      start: '2026-03-30',
      end: '2026-03-30'
    }));
    renderStudentEvents();
    setStatus('새 학생회 일정을 추가했습니다. 저장해 주세요.');
  });

  refs.save?.addEventListener('click', saveAll);
  refs.editorReset?.addEventListener('click', resetDetailEditor);
  refs.editorSave?.addEventListener('click', applyDetailEditor);

  window.addEventListener('resize', () => {
    refreshRangeTracks();
  });

  [
    refs.editorTitle,
    refs.editorMeta,
    refs.editorImageScale,
    refs.editorImageX,
    refs.editorImageY,
    refs.editorTextX,
    refs.editorTextY,
    refs.editorTextWidth,
    refs.editorOverlay
  ].forEach((input) => {
    input?.addEventListener('input', () => {
      paintRangeTrack(input);
      updateDetailDraftFromInputs();
    });
  });

  refs.promoPrev?.addEventListener('click', () => {
    if (state.promoSlides.length <= 1) return;
    state.promoEditorIndex = (state.promoEditorIndex - 1 + state.promoSlides.length) % state.promoSlides.length;
    renderPromoSlides();
  });

  refs.promoNext?.addEventListener('click', () => {
    if (state.promoSlides.length <= 1) return;
    state.promoEditorIndex = (state.promoEditorIndex + 1) % state.promoSlides.length;
    renderPromoSlides();
  });

  refs.reset?.addEventListener('click', () => {
    state.promoSlides = cloneData(DEFAULT_PROMO_SLIDES);
    state.studentEvents = cloneData(DEFAULT_STUDENT_EVENTS);
    state.promoEditorIndex = 0;
    renderAll();
    setStatus('기본값으로 되돌렸습니다. 저장하면 Supabase에 반영됩니다.');
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.dataset.promoField) {
      const index = Number(target.dataset.index);
      const field = target.dataset.promoField;
      if (!state.promoSlides[index]) return;
      state.promoSlides[index][field] = target.type === 'checkbox' ? target.checked : target.value;
      setStatus('변경사항이 있습니다. 저장해 주세요.');
    }

    if (target.dataset.eventField) {
      const index = Number(target.dataset.index);
      const field = target.dataset.eventField;
      if (!state.studentEvents[index]) return;
      state.studentEvents[index][field] = target.value;
      setStatus('변경사항이 있습니다. 저장해 주세요.');
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.dataset.promoUpload || !target.files?.length) return;
    const index = Number(target.dataset.promoUpload);
    uploadPromoImageAt(index, target.files[0]);
    target.value = '';
  });

  document.addEventListener('dragover', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const zone = target.closest('[data-upload-dropzone]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.add('is-dragging');
  });

  document.addEventListener('dragleave', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const zone = target.closest('[data-upload-dropzone]');
    if (!zone) return;
    zone.classList.remove('is-dragging');
  });

  document.addEventListener('drop', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const zone = target.closest('[data-upload-dropzone]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove('is-dragging');
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    const index = Number(zone.getAttribute('data-upload-dropzone'));
    uploadPromoImageAt(index, file);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('[data-editor-close]')) {
      closeDetailEditor();
      return;
    }

    const browseButton = target.closest('[data-upload-browse]');
    if (browseButton) {
      const index = Number(browseButton.getAttribute('data-upload-browse'));
      const input = document.querySelector(`[data-promo-upload="${index}"]`);
      input?.click();
      return;
    }

    const openEditor = target.closest('[data-open-detail-editor]');
    if (openEditor) {
      openDetailEditor(Number(openEditor.getAttribute('data-open-detail-editor')));
      return;
    }

    const promoRemove = target.closest('[data-remove-promo]');
    if (promoRemove) {
      const index = Number(promoRemove.getAttribute('data-remove-promo'));
      state.promoSlides.splice(index, 1);
      state.promoEditorIndex = Math.max(0, Math.min(state.promoEditorIndex, state.promoSlides.length - 1));
      renderPromoSlides();
      setStatus('행사 배너를 삭제했습니다. 저장해 주세요.');
      return;
    }

    const eventRemove = target.closest('[data-remove-event]');
    if (eventRemove) {
      const index = Number(eventRemove.getAttribute('data-remove-event'));
      const currentEvent = state.studentEvents[index];
      const shouldDelete = window.confirm(`'${currentEvent?.title || '이 일정'}' 일정을 삭제할까요?`);
      if (!shouldDelete) {
        return;
      }
      state.studentEvents.splice(index, 1);
      renderStudentEvents();
      setStatus('학생회 일정을 삭제했습니다. 저장해 주세요.');
    }
  });
}

async function initializeAdminPage() {
  bindInteractions();
  refreshRangeTracks();
  setEditorVisibility(false);

  if (!window.kmuSupabaseApi) {
    setAuthStatus('');
    setStatus('Supabase 연결을 찾을 수 없습니다.');
    return;
  }

  try {
    await loadRemoteState();
  } catch (error) {
    console.error(error);
  }

  window.kmuSupabaseApi.onAuthStateChange((_event, session) => {
    handleAuthSession(session);
  });

  try {
    const session = await window.kmuSupabaseApi.getSession();
    await handleAuthSession(session);
  } catch (error) {
    console.error(error);
    setAuthStatus(`세션 확인 실패: ${error.message || 'Supabase 연결을 확인해 주세요.'}`);
  }
}

initializeAdminPage();
