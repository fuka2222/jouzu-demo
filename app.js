/**
 * SNS学習コーチング – モバイルタスクアプリ
 * 運用ロール（画面）: student | manager | leader | admin の4種（メール＋パスワード）
 * レガシーで coach が残る場合のみ参照（新規シードでは未使用）
 * データ: localStorage（本番はAPIに差し替え可能）
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'snsclub_coaching_tasks_v1';
  const SESSION_KEY = 'snsclub_session_v1';

  const ROLE_LABELS = {
    admin: '管理者',
    leader: 'リーダー（チーム）',
    manager: 'マネージャー（MG）',
    student: '生徒',
    coach: '※旧ロール（コーチ）',
  };

  const TASK_TYPE_LABELS = {
    post_goal: '投稿',
    coaching_session: 'コーチング',
    lecture: '講義',
    custom: 'その他',
  };

  const TASK_TYPE_ICONS = {
    post_goal: '📝',
    coaching_session: '💬',
    lecture: '📚',
    custom: '✓',
  };

  /** スターター18STEPとは別に「タスク」タブで管理する固定項目（スターターと重複しない） */
  var CORE_STUDENT_TASK_TITLES = ['目標設定シート', '自己分析シート', '投稿作成', 'リサーチ', 'ストーリーズ'];

  const ACTIVITY_CATEGORIES = [
    'コーチングセッション',
    '講義',
    'グルコン',
    'オン会',
    'オフ会',
    '講師1on1',
    'エスキャン',
    'SnsClubラジオ',
    '成果報告',
    '週報',
    '気づき',
    '振り返り',
    '投稿予定',
    'その他',
  ];

  const POST_STEPS = [
    { key: 'research',      label: 'リサーチ',             phase: 1, weight: 15 },
    { key: 'script',        label: '台本の作成',           phase: 1, weight: 15 },
    { key: 'script_review', label: '台本の添削',           phase: 1, weight: 10 },
    { key: 'shooting',      label: '素材の撮影',           phase: 2, weight: 10 },
    { key: 'recording',     label: '動画の撮影・アフレコ', phase: 2, weight: 10 },
    { key: 'subtitles',     label: 'テロップ入れ',         phase: 2, weight: 8 },
    { key: 'jump_cut',      label: 'ジェットカット',       phase: 2, weight: 7 },
    { key: 'edit_finish',   label: '編集の仕上げ',         phase: 2, weight: 10 },
    { key: 'review_fix',    label: '添削依頼・修正',       phase: 3, weight: 10 },
    { key: 'publish',       label: '投稿',                 phase: 3, weight: 5 },
  ];

  var PHASE_LABELS = { 1: 'フェーズ1：企画・台本', 2: 'フェーズ2：制作', 3: 'フェーズ3：添削・投稿' };
  var PHASES = [1, 2, 3];

  const STARTER_STEPS_DEFAULT = [
    { id: 'sp1',  title: 'ツール登録 / アウトプットの重要性', days: 1 },
    { id: 'sp2',  title: '生徒対談視聴 / 夢と目標設定', days: 1 },
    { id: 'sp3',  title: '初期設計動画の視聴 / 自己分析と目標の確定', days: 1 },
    { id: 'sp4',  title: '初期設計', days: 2 },
    { id: 'sp5',  title: '1on1の予約', days: 1 },
    { id: 'sp6',  title: 'Capcut基礎操作', days: 1 },
    { id: 'sp7',  title: '商品紹介動画素材撮影', days: 1 },
    { id: 'sp8',  title: '商品紹介動画編集', days: 1 },
    { id: 'sp9',  title: 'ショート動画講義の視聴', days: 1 },
    { id: 'sp10', title: '競合リサーチ', days: 2 },
    { id: 'sp11', title: 'バズ投稿リサーチ', days: 2 },
    { id: 'sp12', title: 'プロフィール作成', days: 2 },
    { id: 'sp13', title: 'アカウント作成', days: 1 },
    { id: 'sp14', title: 'アイレポート登録', days: 1 },
    { id: 'sp15', title: 'リール台本・素材模写', days: 2 },
    { id: 'sp16', title: '競合リール動画模倣', days: 4 },
    { id: 'sp17', title: '初投稿の動画作成', days: 5 },
    { id: 'sp18', title: '初投稿 / エスキャン登録', days: 1 },
  ];

  const ROADMAP_MILESTONES = [
    { id: 'rm_starter',       title: 'スタータープログラム完了',       type: 'program', icon: '🎓' },
    { id: 'rm_account',       title: 'アカウント設計プログラム完了',   type: 'program', icon: '📋' },
    { id: 'rm_1on1_design',   title: '講師との1on1で初期設計',         type: 'program', icon: '🤝' },
    { id: 'rm_post_starter',  title: '投稿スタータープログラム完了',   type: 'program', icon: '🚀' },
    { id: 'rm_post_1',        title: '1投稿目完了!!!!!',               type: 'post', postCount: 1, icon: '🏅' },
    { id: 'rm_class_hr',      title: 'クラスHR参加',                   type: 'event', icon: '🏫' },
    { id: 'rm_goal_session',  title: '1回目（目標設定セッション）',     type: 'session', icon: '🎯' },
    { id: 'rm_session_1',     title: '2回目セッション',                type: 'session', icon: '💬' },
    { id: 'rm_selfanalysis',  title: '自己分析シート提出完了',         type: 'program', icon: '📝' },
    { id: 'rm_session_2',     title: '3回目セッション',                type: 'session', icon: '💬' },
    { id: 'rm_session_3',     title: '4回目セッション',                type: 'session', icon: '💬' },
    { id: 'rm_session_4',     title: '5回目セッション',                type: 'session', icon: '💬' },
    { id: 'rm_ireport',       title: 'アイレポート登録',               type: 'program', icon: '📊' },
    { id: 'rm_post_10',       title: '10投稿目完了',                   type: 'post', postCount: 10, icon: '🥉' },
    { id: 'rm_post_15',       title: '15投稿目完了',                   type: 'post', postCount: 15, icon: '🥈' },
    { id: 'rm_post_20',       title: '20投稿目完了',                   type: 'post', postCount: 20, icon: '🥇' },
    { id: 'rm_post_25',       title: '25投稿目完了',                   type: 'post', postCount: 25, icon: '🏆' },
    { id: 'rm_post_30',       title: '30投稿目完了',                   type: 'post', postCount: 30, icon: '🏆' },
    { id: 'rm_post_50',       title: '50投稿目完了',                   type: 'post', postCount: 50, icon: '💎' },
    { id: 'rm_post_80',       title: '80投稿目完了',                   type: 'post', postCount: 80, icon: '💎' },
    { id: 'rm_post_100',      title: '100投稿目完了',                  type: 'post', postCount: 100, icon: '👑' },
    { id: 'rm_post_120',      title: '120投稿目完了',                  type: 'post', postCount: 120, icon: '👑' },
  ];

  const RECURRING_TASKS = [
    { id: 'rt_radio',   title: 'SnsClubラジオ',   frequency: 'daily', icon: '📻' },
    { id: 'rt_escan',   title: 'エスキャン',       frequency: 'daily', icon: '🔍' },
    { id: 'rt_weekly',  title: '週報提出',         frequency: 'weekly', icon: '📄' },
    { id: 'rt_monthly', title: '月一成果報告提出', frequency: 'monthly', icon: '📈' },
    { id: 'rt_onoff',   title: 'オン会・オフ会参加', frequency: 'monthly', icon: '🤝' },
  ];

  /** 定期タスクの色分け用（ACTIVITY_CATEGORIES のラベルに寄せる） */
  var RECURRING_CHIP_CATEGORY = {
    rt_radio: 'SnsClubラジオ',
    rt_escan: 'エスキャン',
    rt_weekly: '週報',
    rt_monthly: '成果報告',
    rt_onoff: 'オン会',
  };

  /** プルダウン末尾：選ぶと自由入力のタイトルで追加 */
  const SESSION_TASK_OTHER_LABEL = 'その他（任意で追加できる）';

  const SESSION_TASK_LIBRARY = [
    '投稿',
    '添削依頼',
    'エスキャン',
    'SnsClubラジオ',
    'オン会',
    'オフ会',
    'グルコン',
    '講師からアドバイス',
    '気づき',
    '成果報告メモ',
    '週報メモ',
    SESSION_TASK_OTHER_LABEL,
  ];

  /** 旧デフォルトと一致する localStorage のみ新一覧へ置き換え */
  var LEGACY_SESSION_TASK_LIBRARY_DEFAULT = [
    'スタータープログラム完了',
    'アカウント設計プログラム完了',
    '講師との1on1で初期設計',
    '投稿スタータープログラム完了',
    'クラスHR参加',
    '1回目（目標設定セッション）',
    '自己分析シート提出',
    'アイレポート登録',
    'プロフィール作成',
    'アカウント作成',
    '競合リサーチ',
    'リール台本作成',
    '動画撮影',
    '動画編集',
    '投稿する',
    'その他',
  ];

  /** スターター完了後はセッションタスクの候補から外す（マイルストーン名・スターター工程に相当するもの） */
  var SESSION_TASKS_EXTRA_HIDDEN_AFTER_STARTER_DONE = [
    'スタータープログラム完了',
    '投稿スタータープログラム完了',
    '講師との1on1で初期設計',
    '自己分析シート提出',
    'アカウント設計プログラム完了',
    'クラスHR参加',
    '1回目（目標設定セッション）',
    'プロフィール作成',
    'アカウント作成',
    'アイレポート登録',
    '競合リサーチ',
    'リール台本作成',
  ];

  /** @type {{ users: object[], tasks: object[], messages: object[], consultations: object[], bookings: object[], memos: object[], passwordResetTokens?: object[] }} */
  let db = {
    users: [],
    tasks: [],
    messages: [],
    consultations: [],
    bookings: [],
    memos: [],
    posts: [],
    starterSteps: [],
    starterProgress: [],
    milestoneProgress: [],
    coachingSessions: [],
    activityLog: [],
    passwordResetTokens: [],
    sessionTaskLibrary: [],
    calendarSchedulePresets: [],
  };
  /** @type {object | null} */
  let sessionUser = null;
  let currentTab = 'home';
  let chatPartnerId = null;

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function loadDb() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        db = JSON.parse(raw);
        if (!Array.isArray(db.messages)) db.messages = [];
        if (!Array.isArray(db.consultations)) db.consultations = [];
        if (!Array.isArray(db.bookings)) db.bookings = [];
        if (!Array.isArray(db.memos)) db.memos = [];
        if (!Array.isArray(db.posts)) db.posts = [];
        if (!Array.isArray(db.starterSteps)) db.starterSteps = [];
        if (!Array.isArray(db.starterProgress)) db.starterProgress = [];
        if (!Array.isArray(db.milestoneProgress)) db.milestoneProgress = [];
        if (!Array.isArray(db.coachingSessions)) db.coachingSessions = [];
        if (!Array.isArray(db.activityLog)) db.activityLog = [];
        if (!Array.isArray(db.passwordResetTokens)) db.passwordResetTokens = [];
        if (!Array.isArray(db.sessionTaskLibrary)) db.sessionTaskLibrary = [];
        if (!Array.isArray(db.calendarSchedulePresets)) db.calendarSchedulePresets = [];
        migrateDbAll();
        return;
      }
    } catch (e) {
      console.warn(e);
    }
    seedDb();
    migrateDbAll();
    saveDb();
  }

  function migrateDbAll() {
    migrateDbMilestones();
    migrateDbProfiles();
    migrateDbBookings();
    migrateDbMemos();
    migrateDbPosts();
    migrateDbStarterAndRoadmap();
    migrateDbBookingSessionLinks();
    migrateDbPasswordResetTokens();
    migrateDbSessionTaskLibrary();
    migrateDbCalendarSchedulePresets();
    migrateCoachingSessionExtendedFields();
    migrateStudentTasksCleanup();
    migrateDbTasksCompletedAt();
    ensureCoreStudentTasks();
  }

  function migrateDbTasksCompletedAt() {
    if (!Array.isArray(db.tasks)) return;
    db.tasks.forEach(function (t) {
      if (t.completedAt === undefined) t.completedAt = '';
      if (isTaskDone(t) && !String(t.completedAt || '').trim()) {
        t.completedAt = t.dueDate || (t.createdAt || '').slice(0, 10) || todayIso();
      }
    });
  }

  function migrateDbSessionTaskLibrary() {
    if (!Array.isArray(db.sessionTaskLibrary)) db.sessionTaskLibrary = [];
    function sameList(a, b) {
      if (!a || !b || a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
    if (db.sessionTaskLibrary.length === 0) {
      db.sessionTaskLibrary = SESSION_TASK_LIBRARY.slice();
    } else if (sameList(db.sessionTaskLibrary, LEGACY_SESSION_TASK_LIBRARY_DEFAULT)) {
      db.sessionTaskLibrary = SESSION_TASK_LIBRARY.slice();
    }
  }

  /** スケジュール「予定の項目」プルダウン・メモカテゴリのマスタ（未設定時は ACTIVITY_CATEGORIES と同じ） */
  function migrateDbCalendarSchedulePresets() {
    if (!Array.isArray(db.calendarSchedulePresets)) db.calendarSchedulePresets = [];
    if (db.calendarSchedulePresets.length === 0) {
      db.calendarSchedulePresets = ACTIVITY_CATEGORIES.slice();
    }
  }

  function getCalendarSchedulePresets() {
    if (db.calendarSchedulePresets && db.calendarSchedulePresets.length > 0) {
      return db.calendarSchedulePresets;
    }
    return ACTIVITY_CATEGORIES;
  }

  function migrateCoachingSessionExtendedFields() {
    if (!Array.isArray(db.coachingSessions)) return;
    db.coachingSessions.forEach(function (s) {
      if (s.nextSessionAt === undefined) s.nextSessionAt = '';
      if (s.goalUntilNextStudent === undefined) s.goalUntilNextStudent = '';
      if (s.goalUntilNextMg === undefined) s.goalUntilNextMg = '';
      if (s.postSlotsTarget === undefined) s.postSlotsTarget = 0;
    });
  }

  /** スターターSTEP名と同じタイトルのタスクは削除（スターター画面で管理） */
  function migrateStudentTasksCleanup() {
    if (!Array.isArray(db.tasks)) return;
    var starterTitles = {};
    STARTER_STEPS_DEFAULT.forEach(function (st) {
      if (st && st.title) starterTitles[st.title] = true;
    });
    db.tasks = db.tasks.filter(function (t) {
      return !starterTitles[t.title];
    });
  }

  function ensureCoreStudentTasks() {
    if (!Array.isArray(db.tasks)) db.tasks = [];
    getStudentUsers().forEach(function (u) {
      var mgr = u.links && u.links.managerId ? u.links.managerId : u.id;
      var due = addDaysToIsoDate(todayIso(), 14) || todayIso();
      var specs = [
        { title: '目標設定シート', type: 'custom', target: 1 },
        { title: '自己分析シート', type: 'custom', target: 1 },
        { title: '投稿作成', type: 'post_goal', target: 5 },
        { title: 'リサーチ', type: 'custom', target: 5 },
        { title: 'ストーリーズ', type: 'custom', target: 5 },
      ];
      specs.forEach(function (sp) {
        var exists = db.tasks.some(function (t) {
          return t.studentUserId === u.id && t.title === sp.title;
        });
        if (exists) return;
        db.tasks.push({
          id: uid('task'),
          studentUserId: u.id,
          type: sp.type,
          title: sp.title,
          targetNumber: sp.target,
          currentNumber: 0,
          dueDate: due,
          completed: false,
          completedAt: '',
          createdBy: mgr,
          createdAt: new Date().toISOString(),
        });
      });
    });
  }

  function migrateDbPasswordResetTokens() {
    if (!Array.isArray(db.passwordResetTokens)) db.passwordResetTokens = [];
  }

  /** 旧データで linkedSessionId が空のコーチング予定に、セッション id を補完 */
  function migrateDbBookingSessionLinks() {
    if (!Array.isArray(db.bookings) || !Array.isArray(db.coachingSessions)) return;
    db.bookings.forEach(function (b) {
      if (b.bookingType !== 'schedule' || b.category !== 'コーチングセッション') return;
      if (b.linkedSessionId) return;
      if (b.coachingSessionNum == null || !b.studentUserId) return;
      var n = parseInt(b.coachingSessionNum, 10);
      if (isNaN(n)) return;
      var sess = db.coachingSessions.find(function (s) {
        return s.studentUserId === b.studentUserId && parseInt(s.sessionNum, 10) === n;
      });
      if (sess) b.linkedSessionId = sess.id;
    });
  }

  function migrateDbBookings() {
    if (!Array.isArray(db.bookings)) db.bookings = [];
    db.bookings.forEach(function (b) {
      if (b.bookingType === undefined) {
        if (/^投稿 #\d+ 完了$/.test(String(b.category || ''))) b.bookingType = 'post_log';
        else b.bookingType = 'schedule';
      }
      if (b.bookingType === 'schedule') {
        if (b.completed === undefined) b.completed = false;
        if (b.completedAt === undefined) b.completedAt = '';
        if (b.coachingSessionNum === undefined) b.coachingSessionNum = null;
        if (b.linkedSessionId === undefined) b.linkedSessionId = '';
        if (b.linkedPostId === undefined) b.linkedPostId = '';
      }
    });
  }

  function migrateDbMemos() {
    if (!Array.isArray(db.memos)) db.memos = [];
  }

  function migrateDbPosts() {
    if (!Array.isArray(db.posts)) db.posts = [];
    db.posts.forEach(function (p) {
      if (p.recordedToCalendar === undefined) p.recordedToCalendar = false;
      if (!Array.isArray(p.customSteps)) p.customSteps = [];
      if (p.plannedPublishDate === undefined) p.plannedPublishDate = '';
      if (p.workflowCompletedAt === undefined) p.workflowCompletedAt = '';
    });
    db.posts.forEach(function (p) {
      if (postProgress(p).pct >= 100 && !String(p.workflowCompletedAt || '').trim()) {
        var back = postCompletionLatestDate(p);
        p.workflowCompletedAt = back ? back : todayIso();
      }
    });
  }

  /** セッションカードの最大「回」（1回目〜この回まで登録可能）。セッション登録はマイルストーンと連動しない。 */
  var MAX_COACHING_SESSION_SLOT = 12;

  function migrateDbStarterAndRoadmap() {
    if (!Array.isArray(db.starterSteps) || db.starterSteps.length === 0) {
      db.starterSteps = JSON.parse(JSON.stringify(STARTER_STEPS_DEFAULT));
    }
    if (!Array.isArray(db.starterProgress)) db.starterProgress = [];
    if (!Array.isArray(db.milestoneProgress)) db.milestoneProgress = [];
    if (!Array.isArray(db.coachingSessions)) db.coachingSessions = [];
    if (!Array.isArray(db.activityLog)) db.activityLog = [];
    migrateDbCoachingSessions();
    migrateStarterStepsCurriculum();
  }

  /** 正式カリキュラムのタイトルに同期。運営が変えた目安日数（days）は id ごとに維持 */
  function migrateStarterStepsCurriculum() {
    if (!Array.isArray(db.starterSteps)) db.starterSteps = [];
    var oldById = {};
    db.starterSteps.forEach(function (s) {
      if (s && s.id) oldById[s.id] = s;
    });
    db.starterSteps = STARTER_STEPS_DEFAULT.map(function (def) {
      var old = oldById[def.id];
      var days = def.days;
      if (old && typeof old.days === 'number' && old.days >= 1 && old.days <= 365) {
        days = old.days;
      }
      return { id: def.id, title: def.title, days: days };
    });
  }

  function migrateDbCoachingSessions() {
    if (!Array.isArray(db.coachingSessions)) return;
    var byStudent = {};
    db.coachingSessions.forEach(function (s) {
      if (s.mgMessage === undefined) s.mgMessage = '';
      if (!byStudent[s.studentUserId]) byStudent[s.studentUserId] = [];
      byStudent[s.studentUserId].push(s);
    });
    Object.keys(byStudent).forEach(function (sid) {
      var list = byStudent[sid].slice().sort(function (a, b) {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
      list.forEach(function (s, idx) {
        var sn = parseInt(s.sessionNum, 10);
        if (isNaN(sn) || sn < 1) {
          s.sessionNum = Math.min(idx + 1, MAX_COACHING_SESSION_SLOT);
        }
      });
    });
  }

  function ensureProfile(u) {
    if (!u) return;
    if (!u.profile || typeof u.profile !== 'object') {
      u.profile = {};
    }
    const p = u.profile;
    if (p.className === undefined) p.className = '';
    if (p.instagram === undefined) p.instagram = '';
    if (p.tiktok === undefined) p.tiktok = '';
    if (p.youtube === undefined) p.youtube = '';
    if (p.avatarDataUrl === undefined) p.avatarDataUrl = '';
    if (p.startDate === undefined) p.startDate = '';
    if (p.supportEndDate === undefined) p.supportEndDate = '';
    if (p.visionLife === undefined) p.visionLife = '';
    if (p.goalHalfYear === undefined) p.goalHalfYear = '';
    if (p.goalPostCount === undefined) {
      var legacyCount = parseInt(String(p.goalNumber || '').replace(/[^\d]/g, ''), 10);
      p.goalPostCount = isNaN(legacyCount) ? '' : String(legacyCount);
    }
    if (p.nextPostDate === undefined) p.nextPostDate = '';
    if (!p.postPace || typeof p.postPace !== 'object') {
      p.postPace = {};
    }
    POST_STEPS.forEach(function (s) {
      if (p.postPace[s.key] === undefined) p.postPace[s.key] = s.weight >= 15 ? 2 : (s.weight >= 10 ? 2 : 1);
    });
    if (!u.profile.milestonesDone) u.profile.milestonesDone = {};
    if (!u.profile.starterDone) u.profile.starterDone = {};
    if (!u.profile.recurringDoneByDate || typeof u.profile.recurringDoneByDate !== 'object') u.profile.recurringDoneByDate = {};
  }

  function migrateDbProfiles() {
    db.users.forEach((u) => ensureProfile(u));
  }

  /** 生徒のみ。LINE18は納期のみ／1投稿終了日から30日で10投稿目安 */
  function ensureMilestones(u) {
    if (!u || u.role !== 'student') return;
    if (!u.milestones || typeof u.milestones !== 'object') {
      u.milestones = { line18DueDate: '', firstLessonDoneDate: '' };
    }
    if (u.milestones.line18DueDate === undefined) u.milestones.line18DueDate = '';
    if (u.milestones.firstLessonDoneDate === undefined) u.milestones.firstLessonDoneDate = '';
    if (u.milestones.starterCompletedDate === undefined) u.milestones.starterCompletedDate = '';
  }

  function migrateDbMilestones() {
    db.users.forEach((u) => ensureMilestones(u));
  }

  /** YYYY-MM-DD に n 日加算 */
  function addDaysToIsoDate(isoDateStr, n) {
    if (!isoDateStr || typeof n !== 'number') return '';
    const d = new Date(isoDateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  /** toIso - fromIso の日数差（カレンダー日） */
  function daysDiffIso(fromIso, toIso) {
    if (!fromIso || !toIso) return 0;
    var a = new Date(fromIso + 'T12:00:00').getTime();
    var b = new Date(toIso + 'T12:00:00').getTime();
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.round((b - a) / 86400000);
  }

  /**
   * コーチングセッションの実施日変更時、紐づく予定（bookings）の日付と
   * セッションタスクの納期を同じだけずらして揃える。
   */
  function syncSessionScheduleLinks(session, oldDateIso, newDateIso) {
    if (!session || !newDateIso) return;
    var sid = session.studentUserId;
    var sn = parseInt(session.sessionNum, 10);
    (db.bookings || []).forEach(function (b) {
      if (b.studentUserId !== sid || b.bookingType !== 'schedule') return;
      if (b.category !== 'コーチングセッション') return;
      var linked = b.linkedSessionId && b.linkedSessionId === session.id;
      var byNum =
        !isNaN(sn) &&
        b.coachingSessionNum != null &&
        parseInt(b.coachingSessionNum, 10) === sn;
      if (linked || byNum) b.date = newDateIso;
    });
    if (oldDateIso && oldDateIso !== newDateIso) {
      var delta = daysDiffIso(oldDateIso, newDateIso);
      if (delta !== 0 && session.tasks && session.tasks.length) {
        session.tasks.forEach(function (t) {
          if (!t.dueDate) return;
          var shifted = addDaysToIsoDate(t.dueDate, delta);
          if (shifted) t.dueDate = shifted;
        });
      }
    }
  }

  function tenLessonsDeadlineFrom(isoFirstLessonDone) {
    return addDaysToIsoDate(isoFirstLessonDone, 30);
  }

  function canEditMilestones(viewer, studentUserId) {
    if (!viewer) return false;
    if (viewer.role === 'student') return viewer.id === studentUserId;
    return canViewStudent(viewer, studentUserId);
  }

  function saveMilestones(studentUserId, line18Due, firstLessonDone) {
    const u = getUserById(studentUserId);
    if (!u || u.role !== 'student' || !canEditMilestones(sessionUser, studentUserId)) return false;
    ensureMilestones(u);
    u.milestones.line18DueDate = line18Due || '';
    u.milestones.firstLessonDoneDate = firstLessonDone || '';
    saveDb();
    renderAll();
    return true;
  }

  function milestoneStudentCardHtml(u) {
    ensureMilestones(u);
    const m = u.milestones;
    const ten = tenLessonsDeadlineFrom(m.firstLessonDoneDate);
    const tenLine = ten ? '～10投稿の目安期限は <strong>' + ten + '</strong> まで（1投稿が終わった日から30日後）' : '1投稿が終わった日を入れると、自動で表示されます';
    const tenClass = ten ? dueClass(ten) : '';
    let html = '<div class="card"><p class="card-title">学習の大きなスケジュール</p>';
    html +=
      '<p class="milestone-hint">LINEの18ステップは日々の配信で進みます。<strong>このアプリでは18個のタスクにはしません</strong>。全体をやり切る<strong>納期</strong>だけ記録してください。</p>';
    html += '<label class="label" for="milestoneLine18">LINE・18ステップを終える目標日（納期）</label>';
    html +=
      '<input type="date" id="milestoneLine18" class="input" value="' +
      escapeHtml(m.line18DueDate || '') +
      '" />';
    html += '<label class="label" for="milestoneFirstLesson">1投稿が終わった日</label>';
    html +=
      '<input type="date" id="milestoneFirstLesson" class="input" value="' +
      escapeHtml(m.firstLessonDoneDate || '') +
      '" />';
    html += '<div id="milestoneTenWrap" class="milestone-computed' + (tenClass ? ' ' + tenClass : '') + '">' + tenLine + '</div>';
    html += '<button type="button" class="btn btn-primary" id="btnSaveMilestones" style="margin-top:14px;">保存する</button>';
    html += '</div>';
    return html;
  }

  function milestoneStaffCardHtml() {
    const ids = visibleStudentIds(sessionUser);
    if (ids.length === 0) return '';
    let html = '<div class="card"><p class="card-title">生徒の学習スケジュール（納期）</p>';
    html += '<p class="milestone-hint">LINE18は納期のみ。1投稿完了日から30日後を「1〜10投稿」の目安として表示します。</p>';
    html += '<label class="label" for="msStudent">生徒</label><select id="msStudent" class="student-picker">';
    ids.forEach((sid) => {
      const s = getUserById(sid);
      if (s) html += '<option value="' + sid + '">' + escapeHtml(s.name) + '</option>';
    });
    html += '</select>';
    html += '<label class="label" for="msLine18">LINE・18ステップの納期</label>';
    html += '<input type="date" id="msLine18" class="input" value="" />';
    html += '<label class="label" for="msFirstLesson">1投稿が終わった日</label>';
    html += '<input type="date" id="msFirstLesson" class="input" value="" />';
    html += '<div id="msTenWrap" class="milestone-computed"></div>';
    html += '<button type="button" class="btn btn-primary" id="btnSaveMilestonesStaff" style="margin-top:14px;">この生徒の内容を保存</button>';
    html += '</div>';
    return html;
  }

  function fillStaffMilestoneForm(studentId) {
    const u = getUserById(studentId);
    if (!u) return;
    ensureMilestones(u);
    const m = u.milestones;
    const lineEl = document.getElementById('msLine18');
    const firstEl = document.getElementById('msFirstLesson');
    const wrap = document.getElementById('msTenWrap');
    if (lineEl) lineEl.value = m.line18DueDate || '';
    if (firstEl) firstEl.value = m.firstLessonDoneDate || '';
    if (wrap) {
      const ten = tenLessonsDeadlineFrom(m.firstLessonDoneDate);
      if (ten) {
        wrap.className = 'milestone-computed ' + dueClass(ten);
        wrap.innerHTML =
          '～10投稿の目安期限: <strong>' +
          ten +
          '</strong> まで（1投稿完了から30日後）';
      } else {
        wrap.className = 'milestone-computed';
        wrap.innerHTML = '1投稿完了日を入れると表示されます';
      }
    }
  }

  function bindStudentMilestoneForm() {
    const line = document.getElementById('milestoneLine18');
    const first = document.getElementById('milestoneFirstLesson');
    const wrap = document.getElementById('milestoneTenWrap');
    const upd = function () {
      const ten = tenLessonsDeadlineFrom(first && first.value ? first.value : '');
      if (!wrap) return;
      if (ten) {
        wrap.className = 'milestone-computed ' + dueClass(ten);
        wrap.innerHTML =
          '～10投稿の目安期限は <strong>' +
          ten +
          '</strong> まで（1投稿が終わった日から30日後）';
      } else {
        wrap.className = 'milestone-computed';
        wrap.innerHTML = '1投稿が終わった日を入れると、自動で表示されます';
      }
    };
    if (first) first.addEventListener('input', upd);
    if (first) first.addEventListener('change', upd);
    const btn = document.getElementById('btnSaveMilestones');
    if (btn) {
      btn.addEventListener('click', function () {
        const l = line ? line.value : '';
        const f = first ? first.value : '';
        saveMilestones(sessionUser.id, l, f);
      });
    }
  }

  function bindStaffMilestoneForm() {
    const sel = document.getElementById('msStudent');
    const line = document.getElementById('msLine18');
    const first = document.getElementById('msFirstLesson');
    if (!sel) return;
    const upd = function () {
      fillStaffMilestoneForm(sel.value);
    };
    sel.addEventListener('change', upd);
    if (first) first.addEventListener('input', function () {
      const wrap = document.getElementById('msTenWrap');
      const ten = tenLessonsDeadlineFrom(first.value);
      if (!wrap) return;
      if (ten) {
        wrap.className = 'milestone-computed ' + dueClass(ten);
        wrap.innerHTML = '～10投稿の目安期限: <strong>' + ten + '</strong> まで（1投稿完了から30日後）';
      } else {
        wrap.className = 'milestone-computed';
        wrap.innerHTML = '1投稿完了日を入れると表示されます';
      }
    });
    fillStaffMilestoneForm(sel.value);
    const btn = document.getElementById('btnSaveMilestonesStaff');
    if (btn) {
      btn.addEventListener('click', function () {
        const sid = sel.value;
        if (!canEditMilestones(sessionUser, sid)) return;
        const l = line ? line.value : '';
        const f = first ? first.value : '';
        saveMilestones(sid, l, f);
      });
    }
  }

  function saveDb() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function seedDb() {
    const leaderId = 'user-leader-1';
    const managerId = 'user-mgr-1';
    const studentA = 'user-stu-1';
    const studentB = 'user-stu-2';

    db.users = [
      {
        id: 'user-admin-1',
        email: 'admin@demo.local',
        password: 'demo123',
        name: '管理者デモ',
        role: 'admin',
        links: {},
      },
      {
        id: leaderId,
        email: 'leader@demo.local',
        password: 'demo123',
        name: '山田リーダー',
        role: 'leader',
        links: {},
      },
      {
        id: managerId,
        email: 'manager@demo.local',
        password: 'demo123',
        name: '鈴木MG',
        role: 'manager',
        links: { leaderId },
      },
      {
        id: studentA,
        email: 'student@demo.local',
        password: 'demo123',
        name: '太郎さん（デモ生徒）',
        role: 'student',
        links: { managerId, leaderId },
        milestones: { line18DueDate: '', firstLessonDoneDate: '' },
        profile: {
          className: '4期生',
          instagram: '',
          tiktok: '',
          youtube: '',
          avatarDataUrl: '',
          startDate: '2026-03-01',
          supportEndDate: '2026-09-30',
        },
      },
      {
        id: studentB,
        email: 'hanako@demo.local',
        password: 'demo123',
        name: '花子さん（デモ生徒）',
        role: 'student',
        links: { managerId, leaderId },
        milestones: { line18DueDate: '', firstLessonDoneDate: '' },
        profile: {
          className: '4期生',
          instagram: '',
          tiktok: '',
          youtube: '',
          avatarDataUrl: '',
          startDate: '2026-03-15',
          supportEndDate: '2026-10-15',
        },
      },
    ];

    db.tasks = [];
  }

  function loadSession() {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) return null;
      return db.users.find((u) => u.id === id) || null;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    sessionUser = user;
    if (user) localStorage.setItem(SESSION_KEY, user.id);
    else localStorage.removeItem(SESSION_KEY);
  }

  function getStudentUsers() {
    return db.users.filter((u) => u.role === 'student');
  }

  function getUserById(id) {
    return db.users.find((u) => u.id === id);
  }

  function canViewStudent(viewer, studentUserId) {
    if (!viewer) return false;
    const st = getUserById(studentUserId);
    if (!st || st.role !== 'student') return false;
    if (viewer.role === 'admin') return true;
    if (viewer.role === 'student') return viewer.id === studentUserId;
    const links = st.links || {};
    if (viewer.role === 'manager' && links.managerId === viewer.id) return true;
    if (viewer.role === 'leader') {
      if (links.leaderId === viewer.id) return true;
      var mgrId = links.managerId;
      if (mgrId) {
        var mgr = getUserById(mgrId);
        if (mgr && mgr.role === 'manager' && mgr.links && mgr.links.leaderId === viewer.id) return true;
      }
      return false;
    }
    if (viewer.role === 'coach' && links.coachId === viewer.id) return true;
    return false;
  }

  function visibleStudentIds(viewer) {
    if (!viewer) return [];
    if (viewer.role === 'admin') return getStudentUsers().map((s) => s.id);
    if (viewer.role === 'student') return [viewer.id];
    return getStudentUsers()
      .filter((s) => canViewStudent(viewer, s.id))
      .map((s) => s.id);
  }

  function tasksForViewer() {
    if (!sessionUser) return [];
    const ids = new Set(visibleStudentIds(sessionUser));
    return db.tasks.filter((t) => ids.has(t.studentUserId));
  }

  function canEditTask(viewer, task) {
    if (!viewer || !task) return false;
    if (viewer.role === 'student') return viewer.id === task.studentUserId;
    return canViewStudent(viewer, task.studentUserId);
  }

  function canCreateTaskFor(viewer, studentUserId) {
    if (!viewer) return false;
    if (viewer.role === 'student') return viewer.id === studentUserId;
    return canViewStudent(viewer, studentUserId);
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  }

  function dueClass(dateStr) {
    const d = daysUntil(dateStr);
    if (d === null) return '';
    if (d < 0) return 'due-over';
    if (d <= 3) return 'due-soon';
    return '';
  }

  function dueText(dateStr) {
    const d = daysUntil(dateStr);
    if (d === null) return '';
    if (d < 0) return '期限超過 ' + Math.abs(d) + '日前';
    if (d === 0) return '今日が期限';
    return 'あと' + d + '日';
  }

  function progressPercent(task) {
    if (!task.targetNumber) return 0;
    return Math.min(100, Math.round((task.currentNumber / task.targetNumber) * 100));
  }

  function isTaskDone(task) {
    return task.completed || (task.targetNumber > 0 && task.currentNumber >= task.targetNumber);
  }

  // --- Login ---
  function normalizeLoginEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  /**
   * パスワード再発行の開始。
   * 本番: ここでサーバーAPIを呼び、メール送信のみ行いトークンはサーバー側で管理する。
   * デモ: 6桁コードを localStorage 上の db.passwordResetTokens に保存し画面表示する。
   */
  function issuePasswordResetToken(emailRaw) {
    const email = normalizeLoginEmail(emailRaw);
    if (!email) {
      alert('メールアドレスを入力してください。');
      return null;
    }
    const u = db.users.find((x) => normalizeLoginEmail(x.email) === email);
    if (!u) {
      alert('このメールアドレスは登録されていません。');
      return null;
    }
    const now = Date.now();
    const ttlMs = 30 * 60 * 1000;
    if (!Array.isArray(db.passwordResetTokens)) db.passwordResetTokens = [];
    db.passwordResetTokens = db.passwordResetTokens.filter(function (t) {
      if (!t || !t.expiresAt) return false;
      if (new Date(t.expiresAt).getTime() < now) return false;
      return t.userId !== u.id;
    });
    const token = String(100000 + Math.floor(Math.random() * 900000));
    const entry = {
      id: uid('pwreset'),
      userId: u.id,
      email: email,
      token: token,
      expiresAt: new Date(now + ttlMs).toISOString(),
      createdAt: new Date().toISOString(),
    };
    db.passwordResetTokens.push(entry);
    saveDb();
    return { token: token, email: email, expiresAt: entry.expiresAt };
  }

  /**
   * 確認コードでパスワードを更新。
   * 本番: サーバーでトークン検証後にパスワードを更新する。
   */
  function completePasswordResetWithToken(emailRaw, codeRaw, newPass, newPass2) {
    const email = normalizeLoginEmail(emailRaw);
    const code = String(codeRaw || '').trim().replace(/\s/g, '');
    if (!email || !code) {
      alert('メールアドレスと確認コードを入力してください。');
      return false;
    }
    if (!newPass || newPass.length < 8) {
      alert('新しいパスワードは8文字以上にしてください。');
      return false;
    }
    if (newPass !== newPass2) {
      alert('新しいパスワードが一致しません。');
      return false;
    }
    const now = Date.now();
    const idx = (db.passwordResetTokens || []).findIndex(function (t) {
      return (
        t &&
        normalizeLoginEmail(t.email) === email &&
        String(t.token) === code &&
        new Date(t.expiresAt).getTime() > now
      );
    });
    if (idx < 0) {
      alert('確認コードが違うか、有効期限（発行から30分）が切れています。最初からやり直してください。');
      return false;
    }
    const entry = db.passwordResetTokens[idx];
    const u = db.users.find((x) => x.id === entry.userId);
    if (!u || normalizeLoginEmail(u.email) !== email) {
      alert('アカウントが見つかりません。');
      return false;
    }
    u.password = newPass;
    db.passwordResetTokens.splice(idx, 1);
    saveDb();
    return true;
  }

  function resetLoginPasswordResetPanel() {
    const panel = document.getElementById('loginPasswordResetPanel');
    const step2 = document.getElementById('pwResetStep2');
    const emailEl = document.getElementById('pwResetEmail');
    const codeEl = document.getElementById('pwResetCode');
    const n1 = document.getElementById('pwResetNew');
    const n2 = document.getElementById('pwResetNew2');
    const disp = document.getElementById('pwResetCodeDisplay');
    if (panel) panel.classList.add('hidden');
    if (step2) step2.classList.add('hidden');
    if (emailEl) emailEl.value = '';
    if (codeEl) codeEl.value = '';
    if (n1) n1.value = '';
    if (n2) n2.value = '';
    if (disp) disp.textContent = '';
  }

  function tryLogin(email, password) {
    const u = db.users.find(
      (x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password
    );
    if (!u) {
      alert('メールまたはパスワードが正しくありません。\n\nデモは画面の下のボタンから入れます。');
      return false;
    }
    if (u.role !== 'student') {
      alert('このアプリは生徒専用です。\n管理者・マネージャーの方は管理ポータルからログインしてください。');
      return false;
    }
    setSession(u);
    showApp();
    return true;
  }

  function logout() {
    setSession(null);
    resetLoginPasswordResetPanel();
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
    applyBrandTheme();
  }

  /** 生徒=SnsClub（青・金）／スタッフ=Levela（赤系） */
  function applyBrandTheme() {
    const html = document.documentElement;
    const meta = document.getElementById('metaThemeColor');
    const staffRoles = ['admin', 'leader', 'manager'];
    const isStaff = sessionUser && staffRoles.indexOf(sessionUser.role) >= 0;
    if (isStaff) {
      html.setAttribute('data-brand', 'levela');
      if (meta) meta.setAttribute('content', '#be123c');
    } else {
      html.setAttribute('data-brand', 'snsclub');
      if (meta) meta.setAttribute('content', '#1a3a6e');
    }
  }

  function showApp() {
    sessionUser = loadSession();
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').classList.remove('hidden');
    mgDesktopClassicOverride = false;
    applyBrandTheme();
    updateHeader();
    setupNav();
    bindManagerDesktopResize();
    bindManagerDesktopChromeOnce();
    setTab('home');
    renderAll();
  }

  function updateHeader() {
    const u = sessionUser;
    document.getElementById('headerTitle').textContent = u ? 'じょーず 🦈' : 'ログイン';
    document.getElementById('headerSub').textContent = u ? '' : '';
    document.getElementById('roleChip').textContent = u ? ROLE_LABELS[u.role] || u.role : '';
    updateQuickConsultButton();
  }

  function updateQuickConsultButton() {
    var btn = document.getElementById('quickConsultBtn');
    if (!btn) return;
    btn.classList.add('hidden');
  }

  function setupNav() {
    const role = sessionUser && sessionUser.role;
    const isStaff = role && role !== 'student';
    const isStudent = role === 'student';
    document.querySelectorAll('[data-nav="team"]').forEach((el) => {
      el.classList.toggle('hidden', !isStaff);
    });
    document.querySelectorAll('[data-nav="studentOnly"]').forEach((el) => {
      el.classList.toggle('hidden', !isStudent);
    });
    document.querySelectorAll('[data-nav="staffOnly"]').forEach((el) => {
      el.classList.toggle('hidden', !isStaff);
    });
  }

  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.screen[data-screen]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-screen') === tab);
    });
    var navHighlight = (tab === 'chat' || tab === 'consult') ? 'home' : ((tab === 'goals' || tab === 'profile' || tab === 'memo') ? 'mypage' : tab);
    document.querySelectorAll('.bottom-nav button[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === navHighlight);
    });
    renderAll();
  }

  function renderAll() {
    if (!sessionUser) return;
    renderHome();
    renderPosts();
    renderRoadmap();
    renderTasks();
    renderTeam();
    renderLog();
    renderMemo();
    renderSchedule();
    renderMypage();
    if (currentTab === 'goals') renderGoalsEditor();
    if (currentTab === 'profile') renderProfileEditor();
    if (currentTab === 'chat') renderChat();
    if (currentTab === 'consult') renderConsultation();
    syncManagerDesktopShell();
    renderManagerDesktopFull();
    syncManagerDesktopRestoreBar();
  }

  var mgDesktopSelected = 'home';
  var mgDesktopClassicOverride = false;

  function mgDesktopSelStorageKey() {
    return 'jouzuMgDeskSel:' + (sessionUser && sessionUser.id ? sessionUser.id : '');
  }

  function loadMgDesktopSelection(studentIds) {
    try {
      var v = localStorage.getItem(mgDesktopSelStorageKey());
      if (v === 'home') return 'home';
      if (v && studentIds.indexOf(v) >= 0) return v;
    } catch (e) { /* ignore */ }
    return 'home';
  }

  function saveMgDesktopSelection(sel) {
    try {
      localStorage.setItem(mgDesktopSelStorageKey(), sel);
    } catch (e) { /* ignore */ }
  }

  function isManagerDesktopLayout() {
    if (!sessionUser || sessionUser.role !== 'manager') return false;
    if (mgDesktopClassicOverride) return false;
    try {
      return window.matchMedia('(min-width: 960px)').matches;
    } catch (e) {
      return typeof window.innerWidth === 'number' && window.innerWidth >= 960;
    }
  }

  function managerDesktopStudentSummary(sid) {
    var st = getUserById(sid);
    if (!st || st.role !== 'student') return null;
    var today = todayIso();
    var agenda = buildHomeAgendaItems(st);
    var todayItems = agenda.filter(function (it) {
      return it.sortDate === today;
    });
    var agendaOpen = todayItems.filter(function (it) {
      return !it.done;
    });
    var ts = db.tasks.filter(function (t) {
      return t.studentUserId === sid;
    });
    var overdue = ts.filter(function (t) {
      return isOverdue(t);
    });
    var postPlanOpen = 0;
    bookingsForStudent(sid).forEach(function (b) {
      if (b.date === today && b.category === '投稿予定' && !b.completed) postPlanOpen++;
    });
    var postWipToday = 0;
    postsForStudent(sid).forEach(function (p) {
      if (p.plannedPublishDate === today && postProgress(p).pct < 100) postWipToday++;
    });
    var needsFollowUp =
      agendaOpen.length > 0 || overdue.length > 0 || postPlanOpen > 0 || postWipToday > 0;
    return {
      student: st,
      agendaToday: todayItems,
      agendaOpen: agendaOpen,
      overdueTasks: overdue,
      postPlanOpen: postPlanOpen,
      postWipToday: postWipToday,
      needsFollowUp: needsFollowUp,
    };
  }

  function renderManagerDesktopHomeHtml(ids) {
    var need = [];
    var ok = [];
    ids.forEach(function (sid) {
      var sum = managerDesktopStudentSummary(sid);
      if (!sum) return;
      if (sum.needsFollowUp) need.push(sum);
      else ok.push(sum);
    });
    var html = '<div class="mg-desk-home">';
    html += '<section class="mg-desk-section mg-desk-section--alert">';
    html += '<h2 class="mg-desk-h2"><span class="mg-desk-h2-ico" aria-hidden="true">⚠️</span>要フォロー（連絡を検討）</h2>';
    html +=
      '<p class="mg-desk-lead">今日の予定・投稿が未完了、またはタスク期限超過の担当生徒です。Discord 等でフォローが必要か判断してください。</p>';
    if (need.length === 0) {
      html += '<div class="mg-desk-empty-good">✨ 現在、この条件ではフォロー待ちの生徒はいません。</div>';
    } else {
      html += '<div class="mg-desk-alert-table-wrap"><table class="mg-desk-table">';
      html += '<thead><tr><th>生徒</th><th>状況（いつまでに・何が）</th><th></th></tr></thead><tbody>';
      need.forEach(function (sum) {
        var chips = '';
        if (sum.agendaOpen.length) {
          chips +=
            '<span class="mg-desk-chip mg-desk-chip--warn">今日の予定 ' + sum.agendaOpen.length + '件未</span>';
        }
        if (sum.overdueTasks.length) {
          chips +=
            '<span class="mg-desk-chip mg-desk-chip--danger">期限超過タスク ' + sum.overdueTasks.length + '件</span>';
        }
        if (sum.postPlanOpen) {
          chips +=
            '<span class="mg-desk-chip mg-desk-chip--post">投稿予定 ' + sum.postPlanOpen + '件未</span>';
        }
        if (sum.postWipToday) {
          chips +=
            '<span class="mg-desk-chip mg-desk-chip--post">今日期限の投稿WIP ' + sum.postWipToday + '件</span>';
        }
        html += '<tr>';
        html += '<td class="mg-desk-td-name">' + escapeHtml(sum.student.name) + '</td>';
        html += '<td class="mg-desk-td-chips"><div class="mg-desk-chip-row">' + chips + '</div></td>';
        html +=
          '<td class="mg-desk-td-act"><button type="button" class="btn btn-secondary btn-small" data-mg-desk-open-student="' +
          escapeHtml(sum.student.id) +
          '">詳細</button></td>';
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</section>';
    html += '<section class="mg-desk-section mg-desk-section--ok">';
    html += '<h2 class="mg-desk-h2">本日フォロー不要（目安）</h2>';
    if (ok.length === 0) {
      html += '<p class="mg-desk-muted">該当する生徒がいません</p>';
    } else {
      html += '<ul class="mg-desk-ok-list">';
      ok.forEach(function (sum) {
        html += '<li>' + escapeHtml(sum.student.name) + '</li>';
      });
      html += '</ul>';
    }
    html += '</section></div>';
    return html;
  }

  function renderManagerDesktopStudentHtml(sid) {
    var sum = managerDesktopStudentSummary(sid);
    if (!sum) return '<p class="mg-desk-muted">データがありません</p>';
    var st = sum.student;
    ensureProfile(st);
    var today = todayIso();
    var html = '<div class="mg-desk-student">';
    html += '<div class="mg-desk-student-meta">';
    html += '<span class="mg-desk-meta-pill">' + escapeHtml(st.profile.className || 'クラス未設定') + '</span>';
    html += '<span class="mg-desk-meta-pill mg-desk-meta-pill--muted">' + escapeHtml(supportPeriodText(st)) + '</span>';
    html +=
      '<span class="mg-desk-meta-pill">投稿完了 <strong>' +
      completedPostCountForStudent(sid) +
      '</strong> 件</span>';
    html += '</div>';
    html += '<div class="mg-desk-kanban">';
    html += '<div class="mg-desk-col">';
    html += '<div class="mg-desk-col-head mg-desk-col-head--purple"><span>今日のタスク・予定</span>';
    if (sum.agendaOpen.length) {
      html += '<span class="mg-desk-col-badge">' + sum.agendaOpen.length + ' 未</span>';
    }
    html += '</div><div class="mg-desk-col-body">';
    if (sum.agendaToday.length === 0) {
      html += '<p class="mg-desk-col-empty">今日の予定はありません</p>';
    } else {
      sum.agendaToday.forEach(function (it) {
        var cls = 'mg-desk-card' + (it.done ? ' mg-desk-card--done' : ' mg-desk-card--open');
        html += '<div class="' + cls + '">';
        html +=
          '<div class="mg-desk-card-title">' +
          (it.icon ? '<span class="mg-desk-card-ico">' + it.icon + '</span> ' : '') +
          escapeHtml(it.label) +
          '</div>';
        html +=
          '<div class="mg-desk-card-meta">' +
          escapeHtml(it.dateLabel) +
          ' · ' +
          (it.done ? '完了' : '未完了') +
          '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
    html += '<div class="mg-desk-col">';
    html += '<div class="mg-desk-col-head mg-desk-col-head--orange"><span>今日の投稿</span></div><div class="mg-desk-col-body">';
    var postRows = [];
    bookingsForStudent(sid).forEach(function (b) {
      if (b.date !== today || b.category !== '投稿予定') return;
      var lbl = '投稿予定';
      if (b.linkedPostId) {
        var lp = (db.posts || []).find(function (p) {
          return p.id === b.linkedPostId;
        });
        if (lp && lp.title) lbl = lp.title;
      }
      postRows.push({ label: lbl, done: !!b.completed, sub: b.completed ? '' : 'カレンダー未チェック' });
    });
    postsForStudent(sid).forEach(function (p) {
      if (p.plannedPublishDate !== today) return;
      var pct = postProgress(p).pct;
      postRows.push({
        label: p.title || '投稿',
        done: pct >= 100,
        sub: '進捗 ' + pct + '%',
      });
    });
    if (postRows.length === 0) {
      html += '<p class="mg-desk-col-empty">今日の投稿予定・今日期限の投稿はありません</p>';
    } else {
      postRows.forEach(function (row) {
        var cls = 'mg-desk-card' + (row.done ? ' mg-desk-card--done' : ' mg-desk-card--open');
        html += '<div class="' + cls + '">';
        html += '<div class="mg-desk-card-title">' + escapeHtml(row.label) + '</div>';
        if (row.sub) html += '<div class="mg-desk-card-meta">' + escapeHtml(row.sub) + '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
    html += '<div class="mg-desk-col">';
    html += '<div class="mg-desk-col-head mg-desk-col-head--blue"><span>担当タスク（期限順・未完了）</span></div><div class="mg-desk-col-body">';
    var tasks = sortTasks(db.tasks.filter(function (t) {
      return t.studentUserId === sid;
    }));
    var openT = tasks.filter(function (t) {
      return !isTaskDone(t);
    }).slice(0, 14);
    if (openT.length === 0) {
      html += '<p class="mg-desk-col-empty">未完了タスクはありません</p>';
    } else {
      openT.forEach(function (t) {
        var pct = progressPercent(t);
        var od = isOverdue(t) ? ' mg-desk-card--danger' : '';
        html += '<div class="mg-desk-card mg-desk-card--task' + od + '">';
        html += '<div class="mg-desk-card-title">' + escapeHtml(t.title) + '</div>';
        html +=
          '<div class="mg-desk-card-meta">期限 ' +
          (t.dueDate ? shortDate(t.dueDate) : '—') +
          ' · 進捗 ' +
          (t.currentNumber || 0) +
          '/' +
          (t.targetNumber || 0) +
          '</div>';
        html +=
          '<div class="mg-desk-mini-bar" title="進捗"><div class="mg-desk-mini-bar-fill" style="width:' +
          pct +
          '%"></div></div>';
        html += '</div>';
      });
    }
    html += '</div></div>';
    html += '</div></div>';
    return html;
  }

  function renderManagerDesktopFull() {
    if (!isManagerDesktopLayout()) return;
    var nav = document.getElementById('mgDesktopNav');
    var panel = document.getElementById('mgDesktopPanel');
    var titleEl = document.getElementById('mgDesktopPageTitle');
    if (!nav || !panel || !titleEl) return;
    var ids = visibleStudentIds(sessionUser);
    mgDesktopSelected = loadMgDesktopSelection(ids);
    var homeAlertStudents = 0;
    ids.forEach(function (sid) {
      var sum = managerDesktopStudentSummary(sid);
      if (sum && sum.needsFollowUp) homeAlertStudents++;
    });
    var navHtml = '';
    navHtml +=
      '<button type="button" class="mg-desktop-nav-item' +
      (mgDesktopSelected === 'home' ? ' is-active' : '') +
      '" data-mg-desk-nav="home">';
    navHtml += '<span class="mg-desktop-nav-ico" aria-hidden="true">🏠</span>';
    navHtml += '<span class="mg-desktop-nav-label">ホーム</span>';
    if (homeAlertStudents > 0) {
      navHtml +=
        '<span class="mg-desktop-nav-badge" title="要フォローの担当生徒数">' +
        homeAlertStudents +
        '</span>';
    }
    navHtml += '</button>';
    navHtml += '<div class="mg-desktop-nav-divider" role="presentation">担当生徒</div>';
    ids.forEach(function (sid) {
      var s = getUserById(sid);
      if (!s) return;
      var sum = managerDesktopStudentSummary(sid);
      var initial = (s.name || '?').trim().charAt(0) || '?';
      var active = mgDesktopSelected === sid ? ' is-active' : '';
      navHtml += '<button type="button" class="mg-desktop-nav-item' + active + '" data-mg-desk-nav="' + escapeHtml(sid) + '">';
      navHtml += '<span class="mg-desktop-nav-avatar">' + escapeHtml(initial) + '</span>';
      navHtml += '<span class="mg-desktop-nav-label">' + escapeHtml(s.name) + '</span>';
      if (sum && sum.needsFollowUp) {
        navHtml += '<span class="mg-desktop-nav-alert-dot" title="未完了・期限超過あり"></span>';
      }
      navHtml += '</button>';
    });
    nav.innerHTML = navHtml;
    nav.querySelectorAll('[data-mg-desk-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-mg-desk-nav');
        mgDesktopSelected = v;
        saveMgDesktopSelection(v);
        renderManagerDesktopFull();
      });
    });
    if (mgDesktopSelected === 'home') {
      titleEl.textContent = 'ダッシュボード';
      panel.innerHTML = renderManagerDesktopHomeHtml(ids);
    } else {
      var st = getUserById(mgDesktopSelected);
      titleEl.textContent = st ? st.name + ' さん' : '生徒';
      panel.innerHTML = renderManagerDesktopStudentHtml(mgDesktopSelected);
    }
    panel.querySelectorAll('[data-mg-desk-open-student]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-mg-desk-open-student');
        if (!sid) return;
        mgDesktopSelected = sid;
        saveMgDesktopSelection(sid);
        renderManagerDesktopFull();
      });
    });
  }

  function syncManagerDesktopShell() {
    var shell = document.getElementById('appShell');
    var desk = document.getElementById('mgDesktopShell');
    if (!shell || !desk) return;
    var on = isManagerDesktopLayout();
    shell.classList.toggle('mg-desktop-mode', on);
    desk.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  function bindManagerDesktopResize() {
    if (bindManagerDesktopResize._ok) return;
    bindManagerDesktopResize._ok = true;
    window.addEventListener('resize', function () {
      if (window.innerWidth < 960) mgDesktopClassicOverride = false;
      if (!sessionUser || sessionUser.role !== 'manager') return;
      syncManagerDesktopShell();
      renderManagerDesktopFull();
      syncManagerDesktopRestoreBar();
    });
  }

  function managerDesktopOpenClassicTab(tabName) {
    mgDesktopClassicOverride = true;
    var shell = document.getElementById('appShell');
    if (shell) shell.classList.remove('mg-desktop-mode');
    syncManagerDesktopShell();
    setTab(tabName || 'tasks');
    syncManagerDesktopRestoreBar();
  }

  function syncManagerDesktopRestoreBar() {
    var bar = document.getElementById('mgDesktopRestoreBar');
    if (!bar) return;
    var shell = document.getElementById('appShell');
    var wide =
      typeof window.innerWidth === 'number'
        ? window.innerWidth >= 960
        : false;
    var show =
      sessionUser &&
      sessionUser.role === 'manager' &&
      wide &&
      shell &&
      !shell.classList.contains('mg-desktop-mode');
    bar.classList.toggle('hidden', !show);
  }

  function bindManagerDesktopChromeOnce() {
    if (bindManagerDesktopChromeOnce._ok) return;
    bindManagerDesktopChromeOnce._ok = true;
    document.querySelectorAll('[data-mg-desk-classic-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        managerDesktopOpenClassicTab(btn.getAttribute('data-mg-desk-classic-tab') || 'tasks');
      });
    });
    var restore = document.getElementById('mgDesktopRestoreBtn');
    if (restore) {
      restore.addEventListener('click', function () {
        mgDesktopClassicOverride = false;
        syncManagerDesktopShell();
        renderManagerDesktopFull();
        syncManagerDesktopRestoreBar();
      });
    }
  }

  function sortTasks(list) {
    return [...list].sort((a, b) => {
      const da = a.dueDate || '9999';
      const db_ = b.dueDate || '9999';
      if (da !== db_) return da.localeCompare(db_);
      return (a.title || '').localeCompare(b.title || '', 'ja');
    });
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  var DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

  function shortDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return (d.getMonth() + 1) + '/' + d.getDate() + '(' + DAY_NAMES[d.getDay()] + ')';
  }

  /** 年なし「4月2日」（データは YYYY-MM-DD のまま） */
  function monthDayJa(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /** スケジュール表示期間ラベル: 「4月2日から4月8日まで」／単日は「4月2日」 */
  function scheduleViewRangeLabel(viewStartIso, dayCount) {
    var n = dayCount || 1;
    var endIso = n <= 1 ? viewStartIso : addDaysToIsoDate(viewStartIso, n - 1);
    if (!endIso) return monthDayJa(viewStartIso);
    if (n <= 1 || viewStartIso === endIso) return monthDayJa(viewStartIso);
    return monthDayJa(viewStartIso) + 'から' + monthDayJa(endIso) + 'まで';
  }

  /** カレンダー1日分の見出しHTML（月日＋曜） */
  function scheduleDayHeadingHtml(dayIso) {
    if (!dayIso) return '';
    var wd = new Date(dayIso + 'T12:00:00').getDay();
    return monthDayJa(dayIso) + '<span class="cal-day-week">(' + DAY_NAMES[wd] + ')</span>';
  }

  function pad2(n) {
    return ('0' + n).slice(-2);
  }

  function startOfWeekSundayIso(iso) {
    if (!iso) return '';
    var dow = new Date(iso + 'T12:00:00').getDay();
    return addDaysToIsoDate(iso, -dow);
  }

  function addMonthsFirstIso(monthFirstIso, delta) {
    var y = parseInt(monthFirstIso.slice(0, 4), 10);
    var m = parseInt(monthFirstIso.slice(5, 7), 10) - 1 + delta;
    while (m < 0) {
      m += 12;
      y--;
    }
    while (m > 11) {
      m -= 12;
      y++;
    }
    return y + '-' + pad2(m + 1) + '-01';
  }

  function lastDayOfMonthIso(monthFirstIso) {
    var y = parseInt(monthFirstIso.slice(0, 4), 10);
    var mo = parseInt(monthFirstIso.slice(5, 7), 10) - 1;
    var last = new Date(y, mo + 1, 0, 12, 0, 0).getDate();
    return y + '-' + pad2(mo + 1) + '-' + pad2(last);
  }

  function enumerateInclusiveRange(startIso, endIso) {
    if (!startIso || !endIso) return [];
    var a = startIso <= endIso ? startIso : endIso;
    var b = startIso <= endIso ? endIso : startIso;
    var out = [];
    var cur = a;
    var guard = 0;
    while (cur && cur <= b && guard++ < 400) {
      out.push(cur);
      cur = addDaysToIsoDate(cur, 1);
    }
    return out;
  }

  function isoInInclusiveRange(d, startIso, endIso) {
    if (!d || !startIso || !endIso) return false;
    var a = startIso <= endIso ? startIso : endIso;
    var b = startIso <= endIso ? endIso : startIso;
    return d >= a && d <= b;
  }

  function scheduleRangeListLabel(startIso, endIso) {
    if (!startIso || !endIso) return '';
    if (schedulePeriodMode === 'month') {
      return monthYearJaHeader(startIso.slice(0, 7) + '-01') + ' を表示';
    }
    if (startIso === endIso) return monthDayJa(startIso) + ' のみ表示';
    var a = startIso <= endIso ? startIso : endIso;
    var b = startIso <= endIso ? endIso : startIso;
    var base = monthDayJa(a) + '〜' + monthDayJa(b) + ' を表示';
    if (schedulePeriodMode === 'week') return base + '（最大7日）';
    return base;
  }

  function monthYearJaHeader(monthFirstIso) {
    if (!monthFirstIso) return '';
    var d = new Date(monthFirstIso + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '年 ' + (d.getMonth() + 1) + '月';
  }

  function schedChipToneClass(categoryLabel) {
    var presets = getCalendarSchedulePresets();
    var i = presets.indexOf(categoryLabel);
    if (i >= 0) return 'sched-tone-' + (i % 10);
    return 'sched-tone-9';
  }

  function bookingCategoryForTone(category) {
    var c = String(category || '');
    var presets = getCalendarSchedulePresets();
    if (presets.indexOf(c) >= 0) return c;
    return presets.indexOf('その他') >= 0 ? 'その他' : (presets[0] || 'その他');
  }

  function sessionTaskCategoryGuess(title) {
    var t = String(title || '').replace(/^SP:\s*/, '');
    var presets = getCalendarSchedulePresets();
    for (var i = 0; i < presets.length; i++) {
      var ac = presets[i];
      if (ac !== 'その他' && t.indexOf(ac) !== -1) return ac;
    }
    return presets.indexOf('コーチングセッション') >= 0 ? 'コーチングセッション' : (presets[0] || 'コーチングセッション');
  }

  /** セッションタスクのうち「投稿」系（チェックをカレンダーの投稿色に合わせる） */
  function isSessionPostTaskTitle(title) {
    var t = String(title || '').trim();
    if (!t) return false;
    if (t === '投稿する') return true;
    if (t.indexOf('投稿') !== -1) return true;
    return sessionTaskCategoryGuess(t) === '投稿予定';
  }

  function snapTimeToQuarterHour(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    if (!m) return '09:00';
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    if (isNaN(h) || isNaN(min)) return '09:00';
    h = Math.min(23, Math.max(0, h));
    min = Math.min(59, Math.max(0, min));
    var total = h * 60 + min;
    var snapped = Math.round(total / 15) * 15;
    if (snapped >= 24 * 60) snapped = 23 * 60 + 45;
    var nh = Math.floor(snapped / 60);
    var nm = snapped % 60;
    return (nh < 10 ? '0' : '') + nh + ':' + (nm < 10 ? '0' : '') + nm;
  }

  function composeNextSessionAtFromParts(dateStr, timeStr) {
    var d = String(dateStr || '').trim();
    if (!d) return '';
    var t = snapTimeToQuarterHour(timeStr || '09:00');
    return d + 'T' + t;
  }

  function nextSessionQuarterHourOptionsHtml(selectedHhmm) {
    var sel = snapTimeToQuarterHour(selectedHhmm || '09:00');
    var out = '';
    for (var h = 0; h < 24; h++) {
      for (var q = 0; q < 4; q++) {
        var mm = q * 15;
        var hh = (h < 10 ? '0' : '') + h;
        var mms = (mm < 10 ? '0' : '') + mm;
        var val = hh + ':' + mms;
        out += '<option value="' + val + '"' + (val === sel ? ' selected' : '') + '>' + val + '</option>';
      }
    }
    return out;
  }

  function isRecurringDoneOnDate(u, rtId, dateIso) {
    ensureProfile(u);
    var m = u.profile.recurringDoneByDate && u.profile.recurringDoneByDate[dateIso];
    return !!(m && m[rtId]);
  }

  function toggleRecurringDoneOnDate(rtId, dateIso) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    ensureProfile(sessionUser);
    if (!sessionUser.profile.recurringDoneByDate) sessionUser.profile.recurringDoneByDate = {};
    if (!sessionUser.profile.recurringDoneByDate[dateIso]) sessionUser.profile.recurringDoneByDate[dateIso] = {};
    var m = sessionUser.profile.recurringDoneByDate[dateIso];
    if (m[rtId]) delete m[rtId];
    else m[rtId] = true;
    saveDb();
    renderHome();
    renderSchedule();
  }

  function toggleBookingComplete(bookingId) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var b = db.bookings.find(function (x) { return x.id === bookingId; });
    if (!b || b.studentUserId !== sessionUser.id) return;
    if (b.bookingType === 'post_log') return;
    b.completed = !b.completed;
    b.completedAt = b.completed ? todayIso() : '';
    saveDb();
    renderHome();
    renderSchedule();
  }

  /** タスク名からメモのカテゴリ（カレンダー予定マスタのいずれか）を推定。該当なしは null */
  function memoCategoryFromTaskTitle(title) {
    var t = String(title || '').replace(/^SP:\s*/, '');
    var presets = getCalendarSchedulePresets();
    for (var i = 0; i < presets.length; i++) {
      var ac = presets[i];
      if (ac === 'その他') continue;
      if (t.indexOf(ac) !== -1) return ac;
    }
    return null;
  }

  var HOME_AGENDA_MEMO_TITLE_BLOCK = /アイレポート/;

  /** ホーム「今後の予定」からメモ追加できる項目か（スケジュールのメモと同じカテゴリで保存） */
  function homeAgendaMemoCategory(it) {
    var cat = null;
    if (it.kind === 'recurring') {
      cat = RECURRING_CHIP_CATEGORY[it.recurringId] || null;
    } else if (it.kind === 'booking') {
      cat = it.bookingCategory || null;
      if (cat && getCalendarSchedulePresets().indexOf(cat) < 0) cat = null;
    } else if (it.kind === 'session') {
      if (HOME_AGENDA_MEMO_TITLE_BLOCK.test(it.label || '')) return null;
      cat = memoCategoryFromTaskTitle(it.label);
    }
    if (!cat || getCalendarSchedulePresets().indexOf(cat) < 0) return null;
    return cat;
  }

  var homeAgendaMemoModalState = null;

  function openHomeAgendaMemoModal(category, dateIso) {
    var modal = document.getElementById('homeAgendaMemoModal');
    var meta = document.getElementById('homeMemoModalMeta');
    var ta = document.getElementById('homeMemoModalText');
    if (!modal || !ta) return;
    homeAgendaMemoModalState = { category: category, date: dateIso || todayIso() };
    if (meta) {
      meta.textContent = category + ' · ' + shortDate(homeAgendaMemoModalState.date);
    }
    ta.value = '';
    modal.classList.add('home-memo-modal--open');
    setTimeout(function () { ta.focus(); }, 50);
  }

  function closeHomeAgendaMemoModal() {
    var modal = document.getElementById('homeAgendaMemoModal');
    if (modal) modal.classList.remove('home-memo-modal--open');
    homeAgendaMemoModalState = null;
  }

  function saveHomeAgendaMemo() {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var st = homeAgendaMemoModalState;
    var ta = document.getElementById('homeMemoModalText');
    if (!st || !ta) return;
    var text = ta.value.trim();
    if (!text) {
      alert('メモを入力してください。');
      return;
    }
    db.memos.push({
      id: uid('memo'),
      studentUserId: sessionUser.id,
      date: st.date || todayIso(),
      category: st.category,
      text: text,
      createdAt: new Date().toISOString(),
    });
    saveDb();
    closeHomeAgendaMemoModal();
    renderHome();
    renderSchedule();
  }

  function buildHomeAgendaItems(studentUser) {
    ensureProfile(studentUser);
    var today = todayIso();
    var end = addDaysToIsoDate(today, 7);
    if (!end) end = today;
    var items = [];

    getRecurringTasks().forEach(function (rt) {
      if (!rt.enabled) return;
      var cat = RECURRING_CHIP_CATEGORY[rt.id] || rt.title;
      var done = isRecurringDoneOnDate(studentUser, rt.id, today);
      items.push({
        kind: 'recurring',
        sortDate: today,
        dateLabel: '今日',
        label: rt.title,
        icon: rt.icon,
        done: done,
        tone: schedChipToneClass(cat),
        recurringId: rt.id,
      });
    });

    bookingsForStudent(studentUser.id).forEach(function (b) {
      if (b.bookingType === 'post_log') return;
      if (!b.date || b.date < today || b.date > end) return;
      var bl = b.category;
      if (b.coachingSessionNum && b.category === 'コーチングセッション') {
        bl = sessionMilestoneLabel(b.coachingSessionNum);
      }
      items.push({
        kind: 'booking',
        sortDate: b.date,
        dateLabel: b.date === today ? '今日' : shortDate(b.date),
        label: bl,
        done: !!b.completed,
        tone: schedChipToneClass(bookingCategoryForTone(b.category)),
        bookingId: b.id,
        bookingCategory: b.category,
      });
    });

    getCoachingSessions(studentUser.id).forEach(function (sess) {
      sess.tasks.forEach(function (t) {
        if (!t.dueDate || t.dueDate < today || t.dueDate > end) return;
        items.push({
          kind: 'session',
          sortDate: t.dueDate,
          dateLabel: t.dueDate === today ? '今日' : shortDate(t.dueDate),
          label: t.title,
          done: !!t.done,
          tone: schedChipToneClass(sessionTaskCategoryGuess(t.title)),
          sessionId: sess.id,
          taskId: t.id,
        });
      });
    });

    items.sort(function (a, b) {
      if (a.sortDate !== b.sortDate) return a.sortDate.localeCompare(b.sortDate);
      var order = { recurring: 0, booking: 1, session: 2 };
      return (order[a.kind] || 9) - (order[b.kind] || 9);
    });

    return items;
  }

  function bookingsForStudent(studentId) {
    return (db.bookings || [])
      .filter(function (b) { return b.studentUserId === studentId; })
      .sort(function (a, b) { return (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || ''); });
  }

  function programStartDateOf(studentUser) {
    ensureProfile(studentUser);
    return studentUser.profile.startDate || todayIso();
  }

  function graduationDateOf(studentUser) {
    return addDaysToIsoDate(programStartDateOf(studentUser), 210);
  }

  /** 指定日がコンサル開始日／卒業予定日（開始＋210日）か */
  function consultPeriodDayFlags(studentUser, dayIso) {
    if (!studentUser || !dayIso) return { start: false, grad: false };
    var d = String(dayIso).trim().slice(0, 10);
    var s = String(programStartDateOf(studentUser)).trim().slice(0, 10);
    var g = String(graduationDateOf(studentUser) || '').trim().slice(0, 10);
    return { start: !!s && s === d, grad: !!g && g === d };
  }

  function bindEarlySprintBanner(container) {
    if (!container) return;
    container.querySelectorAll('[data-early-sprint-goto-posts]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTab('posts');
      });
    });
  }

  /**
   * 入会直後の「初投稿30日以内」「1投稿後30日で10投稿」をホーム専用で表示。
   * opts.embedOnHome === true のときだけ HTML を返す（他タブへの誤埋め込み防止）。
   * 10投稿達成後は非表示（必要なら後で条件調整）。
   */
  function earlyPostSprintBannerHtml(u, opts) {
    opts = opts || {};
    if (opts.embedOnHome !== true) return '';
    if (!u || u.role !== 'student' || !sessionUser || sessionUser.id !== u.id) return '';
    ensureProfile(u);
    ensureMilestones(u);
    var posts = completedPostCount();
    if (posts >= 10) return '';

    var compact = !!opts.compact;
    var ctaHint =
      '<p class="early-sprint-cta-hint">下のボタンは<strong>投稿タブへのショートカット</strong>です。台本・撮影などの工程を進め、<strong>ワークフローが100%</strong>になると1投稿完了として上のカウントに入ります。</p>';
    var start = programStartDateOf(u);
    var today = todayIso();
    var firstDl = addDaysToIsoDate(start, 30);
    var phase = posts < 1 ? 'first' : 'ten';

    var wrapCls = 'early-sprint-banner' + (compact ? ' early-sprint-banner--compact' : '');
    var html = '<div class="' + wrapCls + '" role="region" aria-label="はじめのスプリント">';

    if (phase === 'first') {
      var du = daysUntil(firstDl);
      var overdue = du !== null && du < 0;
      var duLine = du === null ? '' : overdue ? Math.abs(du) + '日超過' : 'あと' + du + '日';
      var elapsed = Math.max(0, daysDiffIso(start, today));
      var timePct = Math.min(100, (elapsed / 30) * 100);
      html += '<div class="early-sprint-badge">はじめのスプリント</div>';
      html += '<p class="early-sprint-title">初投稿は<strong>プログラム開始から30日以内</strong></p>';
      html += '<p class="early-sprint-sub">開始日 ' + shortDate(start) + ' ・ 目安期限 <span class="' + dueClass(firstDl) + '">' + shortDate(firstDl) + '</span>（' + escapeHtml(duLine) + '）</p>';
      html += '<div class="early-sprint-dual">';
      html += '<div class="early-sprint-bar-track" title="開始からの経過（30日枠）"><div class="early-sprint-bar-fill early-sprint-bar-fill--time" style="width:' + timePct + '%"></div></div>';
      html += '<span class="early-sprint-bar-lbl">経過 ' + Math.min(30, elapsed) + '/30日</span>';
      html += '</div>';
      html += '<button type="button" class="btn btn-secondary btn-small early-sprint-cta" data-early-sprint-goto-posts>投稿タブを開く</button>';
      html += ctaHint;
    } else {
      var m = u.milestones || {};
      var tenDl = m.firstLessonDoneDate ? tenLessonsDeadlineFrom(m.firstLessonDoneDate) : '';
      var postPct = Math.min(100, (posts / 10) * 100);
      html += '<div class="early-sprint-badge">はじめのスプリント</div>';
      html += '<p class="early-sprint-title"><strong>1投稿完了から30日以内</strong>に10投稿をめざそう</p>';
      html += '<p class="early-sprint-sub">現在 <strong>' + posts + ' / 10</strong> 投稿完了（投稿ワークフロー）</p>';
      if (m.firstLessonDoneDate && tenDl) {
        var du2 = daysUntil(tenDl);
        var overdue2 = du2 !== null && du2 < 0;
        var duLine2 = du2 === null ? '' : overdue2 ? Math.abs(du2) + '日超過' : 'あと' + du2 + '日';
        html += '<p class="early-sprint-sub">10投稿までの目安期限: <span class="' + dueClass(tenDl) + '">' + shortDate(tenDl) + '</span>（' + escapeHtml(duLine2) + '）</p>';
        var elTen = Math.max(0, daysDiffIso(m.firstLessonDoneDate, today));
        var tenTimePct = Math.min(100, (elTen / 30) * 100);
        html += '<div class="early-sprint-dual">';
        html += '<div class="early-sprint-bar-track" title="10投稿の達成度"><div class="early-sprint-bar-fill early-sprint-bar-fill--posts" style="width:' + postPct + '%"></div></div>';
        html += '<span class="early-sprint-bar-lbl">投稿 ' + posts + '/10</span>';
        html += '</div>';
        html += '<div class="early-sprint-dual early-sprint-dual--sub">';
        html += '<div class="early-sprint-bar-track" title="1投稿完了日からの経過（30日枠）"><div class="early-sprint-bar-fill early-sprint-bar-fill--time" style="width:' + tenTimePct + '%"></div></div>';
        html += '<span class="early-sprint-bar-lbl">1投稿後 ' + Math.min(30, elTen) + '/30日</span>';
        html += '</div>';
      } else {
        html += '<p class="early-sprint-hint">マイページの「学習の大きなスケジュール」で<strong>1投稿が終わった日</strong>を入れると、10投稿までの期限が表示されます。</p>';
        html += '<div class="early-sprint-dual">';
        html += '<div class="early-sprint-bar-track"><div class="early-sprint-bar-fill early-sprint-bar-fill--posts" style="width:' + postPct + '%"></div></div>';
        html += '<span class="early-sprint-bar-lbl">投稿 ' + posts + '/10</span>';
        html += '</div>';
      }
      html += '<button type="button" class="btn btn-secondary btn-small early-sprint-cta" data-early-sprint-goto-posts>投稿タブを開く</button>';
      html += ctaHint;
    }

    html += '</div>';
    return html;
  }

  function upcomingScheduleCardHtml(studentUser) {
    var todayStr = todayIso();
    var tomorrowStr = addDaysToIsoDate(todayStr, 1) || todayStr;
    var allAgenda = buildHomeAgendaItems(studentUser);
    var agendaToday = allAgenda.filter(function (it) {
      return it.sortDate === todayStr;
    });
    var agendaTomorrow = allAgenda.filter(function (it) {
      return it.sortDate === tomorrowStr;
    });
    var todayAllDone = agendaToday.length > 0 && agendaToday.every(function (it) {
      return it.done;
    });

    function homeAgendaItemHtml(it) {
      var chipCls = 'sched-chip home-agenda-chip ' + it.tone + (it.done ? ' done' : '');
      var dataAttr = '';
      if (it.kind === 'booking') dataAttr = ' data-home-booking="' + escapeHtml(it.bookingId) + '"';
      else if (it.kind === 'recurring') dataAttr = ' data-home-recurring="' + escapeHtml(it.recurringId) + '"';
      else if (it.kind === 'session') dataAttr = ' data-home-stask="' + escapeHtml(it.sessionId) + '|' + escapeHtml(it.taskId) + '"';
      var memoCat = homeAgendaMemoCategory(it);
      var row = '<div class="home-agenda-item">';
      row += '<button type="button" class="' + chipCls + '"' + dataAttr + ' aria-pressed="' + (it.done ? 'true' : 'false') + '">';
      row += '<span class="home-agenda-check-slot" aria-hidden="true">';
      if (it.done) {
        row += '<span class="home-agenda-check-done">✓</span>';
      } else {
        row += '<span class="home-agenda-check-pending"></span>';
      }
      row += '</span>';
      if (it.icon) row += '<span class="sched-chip-ico">' + it.icon + '</span>';
      row += '<span class="sched-chip-txt">' + escapeHtml(it.label) + '</span>';
      row += '</button>';
      if (memoCat) {
        row += '<button type="button" class="home-agenda-memo-btn" data-home-memo-add data-memo-cat="' + escapeHtml(memoCat) + '" data-memo-date="' + escapeHtml(it.sortDate) + '" title="メモを追加（スケジュールのメモと同じ一覧）"><span class="home-agenda-memo-ico" aria-hidden="true">📝</span><span class="home-agenda-memo-lbl">メモ</span></button>';
      }
      row += '</div>';
      return row;
    }

    function renderAgendaGroup(sortDateStr, dateLabel, items) {
      var h = '';
      h += '<div class="home-agenda-group home-agenda-group--day' + (sortDateStr === todayStr ? ' home-agenda-group--today' : '') + '" role="group" aria-label="' + escapeHtml(dateLabel) + 'の予定">';
      h += '<div class="home-agenda-day-label">' + escapeHtml(dateLabel) + '</div>';
      h += '<div class="home-agenda-day-stack">';
      items.forEach(function (it) {
        h += homeAgendaItemHtml(it);
      });
      h += '</div></div>';
      return h;
    }

    var html = '<div class="card home-agenda-card"><p class="card-title">今日の予定</p>';
    html += '<p class="home-agenda-hint">左の<span class="home-agenda-hint-ring" aria-hidden="true"></span>をタップで完了（✓に変わります）。📝メモはスケジュールのメモと同じ一覧に保存されます。スケジュールタブのカレンダーと表示は共通です。</p>';
    if (agendaToday.length === 0) {
      html += '<p style="margin:0 0 10px;font-size:0.95rem;font-weight:700;">今日の予定はありません</p>';
      html += '<p style="margin:0 0 12px;color:var(--muted);font-size:0.82rem;">スケジュールタブで今後の予定を確認できます。セッションへの課題の追加はロードマップのセッションタスクから。定期タスクやセッションタスクは今日が期限のものだけここに出ます。</p>';
    } else if (todayAllDone) {
      html += '<div class="home-agenda-all-done" role="status">';
      html += '<p class="home-agenda-all-done-title">すべて完了！おめでとう！</p>';
      html += '<p class="home-agenda-all-done-sub">今日の分はすべてチェック済みです。次は明日の予定を進めましょう。</p>';
      html += '</div>';
      html += '<div class="home-agenda-list home-agenda-list--after-done">';
      html += '<p class="home-agenda-next-heading">明日の予定</p>';
      if (agendaTomorrow.length === 0) {
        html += '<p class="home-agenda-tomorrow-empty">明日の予定はまだありません。ロードマップや投稿タブで計画すると、ここに反映されます。</p>';
      } else {
        html += renderAgendaGroup(tomorrowStr, '明日（' + shortDate(tomorrowStr) + '）', agendaTomorrow);
      }
      html += '</div>';
    } else {
      html += '<div class="home-agenda-list">';
      html += renderAgendaGroup(todayStr, '今日', agendaToday);
      html += '</div>';
    }
    html += '<div id="homeAgendaMemoModal" class="home-memo-modal">';
    html += '<div class="home-memo-modal-backdrop" data-home-memo-close="1"></div>';
    html += '<div class="home-memo-modal-panel">';
    html += '<p class="home-memo-modal-title">メモを追加</p>';
    html += '<p class="home-memo-modal-meta" id="homeMemoModalMeta"></p>';
    html += '<textarea id="homeMemoModalText" class="input" rows="4" placeholder="気づき・メモを入力"></textarea>';
    html += '<div class="home-memo-modal-actions">';
    html += '<button type="button" class="btn btn-secondary btn-small" data-home-memo-close="1">キャンセル</button>';
    html += '<button type="button" class="btn btn-primary btn-small" id="homeMemoModalSave">保存</button>';
    html += '</div></div></div>';
    html += '<button type="button" class="btn btn-primary home-student-cta" id="homeOpenBooking">スケジュールを開く</button>';
    html += '</div>';
    return html;
  }

  function coachLikeProgressText(list) {
    var current = list.reduce(function (a, t) { return a + (t.currentNumber || 0); }, 0);
    var target = list.reduce(function (a, t) { return a + (t.targetNumber || 0); }, 0);
    if (target <= 0) return current + ' / 0';
    return current + ' / ' + target;
  }

  function quickSwipeTaskHtml(task, showStudentName, studentName) {
    var icon = TASK_TYPE_ICONS[task.type] || '✓';
    var dText = dueText(task.dueDate);
    var title = escapeHtml(task.title);
    var userLine = showStudentName && studentName ? '<div class="swipe-student">' + escapeHtml(studentName) + '</div>' : '';
    var dueLine = task.dueDate ? '<div class="swipe-due ' + dueClass(task.dueDate) + '">期限 ' + shortDate(task.dueDate) + '（' + dText + '）</div>' : '';
    return (
      '<div class="swipe-item" data-swipe-item="' + task.id + '">' +
        '<div class="swipe-actions">' +
          '<button type="button" class="swipe-btn done" data-swipe-done="' + task.id + '">完了</button>' +
          '<button type="button" class="swipe-btn postpone" data-swipe-postpone="' + task.id + '">+7日</button>' +
        '</div>' +
        '<div class="swipe-main">' +
          '<div class="swipe-left-icon">' + icon + '</div>' +
          '<div class="swipe-main-body">' +
            userLine +
            '<div class="swipe-title">' + title + '</div>' +
            dueLine +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderHome() {
    const el = document.getElementById('homeContent');
    if (!el) return;
    let html = '';

    if (sessionUser.role === 'student') {
      ensureProfile(sessionUser);
      var p = sessionUser.profile;
      html += earlyPostSprintBannerHtml(sessionUser, { embedOnHome: true });
      html += homeLearningProgressCardHtml(sessionUser);
      html += homePostSummaryHtml();
      html += upcomingScheduleCardHtml(sessionUser);
      if (p.visionLife || p.goalHalfYear || p.goalPostCount) {
        html += visionCardHtml(sessionUser);
      }
    }
    if (sessionUser.role !== 'student') {
      const list = sortTasks(tasksForViewer()).filter((t) => !isTaskDone(t));
      const soon = list.slice(0, 5);
      html += '<div class="card"><p class="card-title">期限が近いタスク</p>';
      if (soon.length === 0) {
        html += '<p style="margin:0;color:var(--muted);">未完了のタスクはありません。お疲れさまです！</p></div>';
      } else {
        soon.forEach((t) => {
          const st = getUserById(t.studentUserId);
          const showName = true;
          html += quickSwipeTaskHtml(t, showName, st ? st.name : '');
        });
        html += '</div>';
      }
    }

    el.innerHTML = html;
    bindTaskButtons(el);
    bindSwipeTaskRows(el);
    bindEarlySprintBanner(el);
    el.querySelectorAll('[data-open-goals-editor]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openGoalsEditor();
      });
    });
    var homeOpenBooking = document.getElementById('homeOpenBooking');
    if (homeOpenBooking) {
      homeOpenBooking.addEventListener('click', function () {
        setTab('schedule');
      });
    }

    el.querySelectorAll('[data-home-booking]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBookingComplete(btn.getAttribute('data-home-booking'));
      });
    });
    el.querySelectorAll('[data-home-recurring]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleRecurringDoneOnDate(btn.getAttribute('data-home-recurring'), todayIso());
      });
    });
    el.querySelectorAll('[data-home-stask]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-home-stask').split('|');
        if (parts.length >= 2) toggleSessionTask(parts[0], parts[1]);
      });
    });

    el.querySelectorAll('[data-home-memo-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        var cat = btn.getAttribute('data-memo-cat');
        var d = btn.getAttribute('data-memo-date');
        if (cat) openHomeAgendaMemoModal(cat, d);
      });
    });

    var memoModal = document.getElementById('homeAgendaMemoModal');
    if (memoModal) {
      memoModal.querySelectorAll('[data-home-memo-close]').forEach(function (n) {
        n.addEventListener('click', function () {
          closeHomeAgendaMemoModal();
        });
      });
      var memoSave = document.getElementById('homeMemoModalSave');
      if (memoSave) {
        memoSave.addEventListener('click', function () {
          saveHomeAgendaMemo();
        });
      }
    }

    var homeGoToPosts = document.getElementById('homeGoToPosts');
    if (homeGoToPosts) {
      homeGoToPosts.addEventListener('click', function () {
        setTab('posts');
      });
    }

    var homeGoToRoadmap = document.getElementById('homeGoToRoadmap');
    if (homeGoToRoadmap) {
      homeGoToRoadmap.addEventListener('click', function () {
        var starterComplete = starterProgressPct() >= 100;
        roadmapView = starterComplete ? 'milestones' : 'starter';
        setTab('roadmap');
      });
    }
  }

  function completeTask(taskId) {
    var t = db.tasks.find(function (x) { return x.id === taskId; });
    if (!t || !canEditTask(sessionUser, t)) return;
    t.currentNumber = t.targetNumber || t.currentNumber || 0;
    t.completed = true;
    t.completedAt = todayIso();
    saveDb();
    renderAll();
  }

  function postponeTaskByDays(taskId, days) {
    var t = db.tasks.find(function (x) { return x.id === taskId; });
    if (!t || !canEditTask(sessionUser, t)) return;
    var base = t.dueDate || todayIso();
    var next = addDaysToIsoDate(base, days || 7);
    rescheduleTask(taskId, next);
  }

  function bindSwipeTaskRows(container) {
    container.querySelectorAll('[data-swipe-item]').forEach(function (item) {
      var main = item.querySelector('.swipe-main');
      var startX = 0;
      var currentX = 0;
      var dragging = false;
      item.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        dragging = true;
      }, { passive: true });
      item.addEventListener('touchmove', function (e) {
        if (!dragging || !e.touches || !e.touches[0]) return;
        currentX = e.touches[0].clientX - startX;
        if (currentX < 0) {
          var move = Math.max(-132, currentX);
          if (main) main.style.transform = 'translateX(' + move + 'px)';
        }
      }, { passive: true });
      item.addEventListener('touchend', function () {
        dragging = false;
        if (currentX < -52) item.classList.add('open');
        else item.classList.remove('open');
        if (main) main.style.transform = '';
        currentX = 0;
      });
    });
    container.querySelectorAll('[data-swipe-done]').forEach(function (btn) {
      btn.addEventListener('click', function () { completeTask(btn.getAttribute('data-swipe-done')); });
    });
    container.querySelectorAll('[data-swipe-postpone]').forEach(function (btn) {
      btn.addEventListener('click', function () { postponeTaskByDays(btn.getAttribute('data-swipe-postpone'), 7); });
    });
  }

  function bindTaskButtons(container) {
    container.querySelectorAll('[data-post-cards-task]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        bulkCreatePostsForTaskBoundary(btn.getAttribute('data-post-cards-task'));
      });
    });
    container.querySelectorAll('[data-inc-task]').forEach(function (btn) {
      btn.addEventListener('click', function () { incrementTask(btn.getAttribute('data-inc-task'), 1); });
    });
    container.querySelectorAll('[data-resched-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var taskId = btn.getAttribute('data-resched-btn');
        var dateInput = container.querySelector('[data-resched-date="' + taskId + '"]');
        if (!dateInput || !dateInput.value) { alert('新しい日付を選んでください'); return; }
        rescheduleTask(taskId, dateInput.value);
      });
    });
  }

  function isOverdue(task) {
    if (!task.dueDate || isTaskDone(task)) return false;
    return daysUntil(task.dueDate) < 0;
  }

  function rescheduleTask(taskId, newDate) {
    var t = db.tasks.find(function (x) { return x.id === taskId; });
    if (!t || !canEditTask(sessionUser, t)) return;
    if (!t.originalDueDate) t.originalDueDate = t.dueDate;
    if (!t.rescheduleCount) t.rescheduleCount = 0;
    t.rescheduleCount++;
    if (!t.rescheduleHistory) t.rescheduleHistory = [];
    t.rescheduleHistory.push({ from: t.dueDate, to: newDate, at: new Date().toISOString() });
    t.dueDate = newDate;
    saveDb();
    renderAll();
  }

  function taskSummaryHtml(task, opts) {
    const compact = opts && opts.compact;
    const showStudentName = opts && opts.showStudentName;
    const studentName = opts && opts.studentName;
    const pct = progressPercent(task);
    const done = isTaskDone(task);
    const overdue = isOverdue(task);
    const icon = TASK_TYPE_ICONS[task.type] || '✓';
    const typeClass = 'type-' + (task.type === 'post_goal' ? 'post' : task.type === 'coaching_session' ? 'session' : task.type === 'lecture' ? 'lecture' : 'other');
    const dClass = dueClass(task.dueDate);
    const dText = dueText(task.dueDate);

    let html = '<div class="task-row" data-task-id="' + task.id + '">';
    html += '<div class="task-type-badge ' + typeClass + '">' + icon + '</div>';
    html += '<div style="flex:1;min-width:0;">';
    if (showStudentName && studentName) {
      html += '<div style="font-size:0.7rem;color:var(--muted);">' + escapeHtml(studentName) + '</div>';
    }
    html += '<div style="font-weight:700;font-size:0.95rem;">' + escapeHtml(task.title) + '</div>';
    html +=
      '<div style="font-size:0.8rem;color:var(--muted);margin-top:4px;">' +
      TASK_TYPE_LABELS[task.type] +
      ' · 目標 ' +
      task.targetNumber +
      ' / いま ' +
      task.currentNumber +
      '</div>';
    if (task.dueDate) {
      html += '<div class="' + dClass + '" style="font-size:0.8rem;margin-top:4px;">期限 ' + task.dueDate + '（' + dText + '）</div>';
    }
    if (task.originalDueDate && task.originalDueDate !== task.dueDate) {
      html += '<div style="font-size:0.7rem;color:var(--muted);margin-top:2px;">当初: ' + shortDate(task.originalDueDate) + '（' + (task.rescheduleCount || 0) + '回変更）</div>';
    }
    html += '<div class="progress-track"><div class="progress-fill' + (done ? ' done' : '') + '" style="width:' + pct + '%"></div></div>';

    if (overdue && canEditTask(sessionUser, task)) {
      html += '<div class="overdue-actions" style="margin-top:10px;">';
      html += '<p style="margin:0 0 6px;font-size:0.8rem;color:var(--danger);font-weight:600;">予定を立て直しましょう</p>';
      html += '<div style="display:flex;gap:8px;align-items:center;">';
      html += '<input type="date" class="input" style="margin:0;flex:1;padding:10px;font-size:0.85rem;" data-resched-date="' + task.id + '" />';
      html += '<button type="button" class="btn btn-primary btn-small" style="white-space:nowrap;" data-resched-btn="' + task.id + '">変更</button>';
      html += '</div>';
      html += '</div>';
    }

    if (!overdue && sessionUser && sessionUser.role === 'student' && canEditTask(sessionUser, task) && !done) {
      html +=
        '<button type="button" class="btn btn-secondary btn-small" style="margin-top:10px;" data-inc-task="' +
        task.id +
        '">' +
        (compact ? '＋1（したらタップ）' : '＋1 カウントを足す') +
        '</button>';
    }
    if (!overdue && done) {
      // no extra button
    }
    html += '</div></div>';
    return html;
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeHtmlMultiline(s) {
    return escapeHtml(s == null ? '' : String(s)).replace(/\n/g, '<br>');
  }

  function adminStarterProgramEditorHtml() {
    if (!sessionUser || sessionUser.role !== 'admin') return '';
    var steps = getStarterSteps();
    var html = '<div class="card admin-starter-card"><p class="card-title">スタータープログラム（全体）</p>';
    html += '<p class="admin-starter-hint">各STEPの<strong>目安日数</strong>を変更できます。タイトルはカリキュラム定義に合わせて自動更新されます。生徒のロードマップにすぐ反映されます。</p>';
    html += '<div class="admin-starter-list">';
    steps.forEach(function (s, idx) {
      html += '<div class="admin-starter-row">';
      html += '<span class="admin-starter-idx">STEP ' + (idx + 1) + '</span>';
      html += '<span class="admin-starter-title">' + escapeHtml(s.title) + '</span>';
      html += '<label class="admin-starter-days-label"><span class="sr-only">目安日数</span>';
      html += '<input type="number" class="input admin-starter-day-input" id="adminStarterDay-' + escapeHtml(s.id) + '" min="1" max="365" value="' + (parseInt(s.days, 10) || 1) + '" />';
      html += '<span class="admin-starter-days-unit">日</span></label>';
      html += '</div>';
    });
    html += '</div>';
    html += '<button type="button" class="btn btn-primary" id="btnSaveStarterSteps" style="margin-top:12px;width:100%;">目安日数を保存</button>';
    html += '</div>';
    return html;
  }

  function saveAdminStarterStepsFromForm() {
    if (!sessionUser || sessionUser.role !== 'admin') return;
    var steps = getStarterSteps();
    steps.forEach(function (s) {
      var inp = document.getElementById('adminStarterDay-' + s.id);
      if (!inp) return;
      var d = parseInt(inp.value, 10);
      if (!isNaN(d) && d >= 1 && d <= 365) {
        s.days = d;
      }
    });
    saveDb();
    alert('スタータープログラムの目安日数を保存しました。');
    renderAll();
  }

  function adminCalendarSchedulePresetsEditorHtml() {
    if (!sessionUser || sessionUser.role !== 'admin') return '';
    var lines = getCalendarSchedulePresets().slice();
    var html = '<div class="card admin-cal-preset-card"><p class="card-title">カレンダー予定の項目一覧</p>';
    html += '<p class="admin-starter-hint">メモのカテゴリや、既に登録された予定の表示ラベルなどに使う文言のマスタです。<strong>生徒がスケジュール画面から新規にカレンダー予定を追加する機能はありません</strong>（セッション課題は下のセッション用タスク一覧＝ロードマップから）。空行は保存時に除かれます。</p>';
    html += '<div id="adminCalendarPresetList">';
    lines.forEach(function (line) {
      html += '<div class="admin-sess-tasklib-row"><input type="text" class="input admin-cal-preset-input" value="' + escapeHtml(line) + '" maxlength="80" /></div>';
    });
    html += '</div>';
    html += '<button type="button" class="btn btn-secondary btn-small" id="btnAdminCalendarPresetAddRow" style="margin-top:8px;width:100%;">行を追加</button>';
    html += '<button type="button" class="btn btn-primary" id="btnSaveCalendarSchedulePresets" style="margin-top:10px;width:100%;">カレンダー予定の一覧を保存</button>';
    html += '</div>';
    return html;
  }

  function saveAdminCalendarSchedulePresetsFromForm() {
    if (!sessionUser || sessionUser.role !== 'admin') return;
    var rows = document.querySelectorAll('#adminCalendarPresetList .admin-cal-preset-input');
    var next = [];
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i].value.trim();
      if (v) next.push(v);
    }
    if (next.length === 0) {
      alert('1行以上入力してください。');
      return;
    }
    db.calendarSchedulePresets = next;
    saveDb();
    alert('カレンダー予定の一覧を保存しました。');
    renderAll();
  }

  function adminSessionTaskLibraryEditorHtml() {
    if (!sessionUser || sessionUser.role !== 'admin') return '';
    var lines = db.sessionTaskLibrary && db.sessionTaskLibrary.length ? db.sessionTaskLibrary : SESSION_TASK_LIBRARY.slice();
    var html = '<div class="card admin-sess-tasklib-card"><p class="card-title">セッション課題ライブラリ（ロードマップ用）</p>';
    html += '<p class="admin-starter-hint">ロードマップの<strong>セッションタスク</strong>のプルダウンに出る文言です。<strong>上の「カレンダー予定の項目」とは別リスト</strong>です。末尾の「' + escapeHtml(SESSION_TASK_OTHER_LABEL) + '」を入れておくと、生徒が自由入力でタスク名を追加できます。空行は保存時に除かれます。</p>';
    html += '<div id="adminSessTaskLibList">';
    lines.forEach(function (line) {
      html += '<div class="admin-sess-tasklib-row"><input type="text" class="input admin-sess-tasklib-input" value="' + escapeHtml(line) + '" maxlength="80" /></div>';
    });
    html += '</div>';
    html += '<button type="button" class="btn btn-secondary btn-small" id="btnAdminSessTaskLibAddRow" style="margin-top:8px;width:100%;">行を追加</button>';
    html += '<button type="button" class="btn btn-primary" id="btnSaveSessionTaskLibrary" style="margin-top:10px;width:100%;">セッション用タスク一覧を保存</button>';
    html += '</div>';
    return html;
  }

  function saveAdminSessionTaskLibraryFromForm() {
    if (!sessionUser || sessionUser.role !== 'admin') return;
    var rows = document.querySelectorAll('#adminSessTaskLibList .admin-sess-tasklib-input');
    var next = [];
    for (var i = 0; i < rows.length; i++) {
      var v = rows[i].value.trim();
      if (v) next.push(v);
    }
    if (next.length === 0) {
      alert('1行以上入力してください。');
      return;
    }
    db.sessionTaskLibrary = next;
    saveDb();
    alert('セッション用タスク一覧を保存しました。');
    renderAll();
  }

  /** スタッフ・生徒共通：タスク追加フォームの種類〜期限まで（生徒選択は別途） */
  function taskAddFormFieldsHtml() {
    var html = '';
    html += '<label class="label">種類</label><select id="addTaskType" class="input">';
    html += '<option value="post_goal">投稿の目標本数</option>';
    html += '<option value="coaching_session">コーチング受講回数</option>';
    html += '<option value="lecture">講義・動画の視聴回数</option>';
    html += '<option value="custom">その他（自由）</option>';
    html += '</select>';
    html += '<label class="label">タイトル（分かりやすい一言）</label><input type="text" id="addTaskTitle" class="input" placeholder="例：今週の投稿" maxlength="80">';
    html += '<label class="label">目標の数（回数や本数）</label><input type="number" id="addTaskTarget" class="input" min="1" value="5">';
    html += '<label class="label">期限</label><input type="date" id="addTaskDue" class="input" value="">';
    return html;
  }

  function renderTasks() {
    const el = document.getElementById('tasksContent');
    if (!el) return;
    const list = sortTasks(tasksForViewer());
    let html = '';

    if (sessionUser.role === 'admin') {
      html += adminStarterProgramEditorHtml();
      html += adminCalendarSchedulePresetsEditorHtml();
      html += adminSessionTaskLibraryEditorHtml();
    }

    if (sessionUser.role !== 'student') {
      html += milestoneStaffCardHtml();
    }

    if (sessionUser.role !== 'student') {
      html += '<div class="card"><p class="card-title">生徒にタスクを追加</p>';
      html += '<label class="label">生徒</label><select id="addTaskStudent" class="student-picker">';
      visibleStudentIds(sessionUser).forEach((sid) => {
        const s = getUserById(sid);
        if (s) html += '<option value="' + sid + '">' + escapeHtml(s.name) + '</option>';
      });
      html += '</select>';
      html += taskAddFormFieldsHtml();
      html += '<button type="button" class="btn btn-primary" id="btnAddTask">追加する</button></div>';
    } else {
      html += '<div class="card"><p class="card-title">タスクを追加</p>';
      html +=
        '<input type="hidden" id="addTaskStudent" value="' +
        escapeHtml(sessionUser.id) +
        '" />';
      html += taskAddFormFieldsHtml();
      html += '<button type="button" class="btn btn-primary" id="btnAddTask">追加する</button></div>';
    }

    html += '<div class="card"><p class="card-title">すべてのタスク</p>';
    if (list.length === 0) {
      html += '<div class="empty-state">タスクはまだありません</div>';
    } else {
      list.forEach((t) => {
        const st = getUserById(t.studentUserId);
        html += taskSummaryHtml(t, {
          compact: false,
          showStudentName: sessionUser.role !== 'student',
          studentName: st ? st.name : '',
        });
      });
    }
    html += '</div>';

    el.innerHTML = html;

    const dueInput = document.getElementById('addTaskDue');
    if (dueInput && !dueInput.value) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueInput.value = d.toISOString().slice(0, 10);
    }

    const btnAdd = document.getElementById('btnAddTask');
    if (btnAdd) {
      btnAdd.addEventListener('click', addTaskFromForm);
    }

    var btnSaveStarter = document.getElementById('btnSaveStarterSteps');
    if (btnSaveStarter) {
      btnSaveStarter.addEventListener('click', saveAdminStarterStepsFromForm);
    }
    var btnCalSave = document.getElementById('btnSaveCalendarSchedulePresets');
    if (btnCalSave) {
      btnCalSave.addEventListener('click', saveAdminCalendarSchedulePresetsFromForm);
    }
    var btnCalAdd = document.getElementById('btnAdminCalendarPresetAddRow');
    if (btnCalAdd) {
      btnCalAdd.addEventListener('click', function () {
        var list = document.getElementById('adminCalendarPresetList');
        if (!list) return;
        var row = document.createElement('div');
        row.className = 'admin-sess-tasklib-row';
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'input admin-cal-preset-input';
        inp.maxLength = 80;
        inp.placeholder = '予定名';
        row.appendChild(inp);
        list.appendChild(row);
        inp.focus();
      });
    }
    var btnLibSave = document.getElementById('btnSaveSessionTaskLibrary');
    if (btnLibSave) {
      btnLibSave.addEventListener('click', saveAdminSessionTaskLibraryFromForm);
    }
    var btnLibAdd = document.getElementById('btnAdminSessTaskLibAddRow');
    if (btnLibAdd) {
      btnLibAdd.addEventListener('click', function () {
        var list = document.getElementById('adminSessTaskLibList');
        if (!list) return;
        var row = document.createElement('div');
        row.className = 'admin-sess-tasklib-row';
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'input admin-sess-tasklib-input';
        inp.maxLength = 80;
        inp.placeholder = 'タスク名';
        row.appendChild(inp);
        list.appendChild(row);
        inp.focus();
      });
    }

    bindTaskButtons(el);

    if (sessionUser.role !== 'student') bindStaffMilestoneForm();
  }

  function addTaskFromForm() {
    const sid = document.getElementById('addTaskStudent').value;
    const type = document.getElementById('addTaskType').value;
    let title = document.getElementById('addTaskTitle').value.trim();
    const target = parseInt(document.getElementById('addTaskTarget').value, 10);
    const due = document.getElementById('addTaskDue').value;
    if (!canCreateTaskFor(sessionUser, sid)) {
      alert(sessionUser.role === 'student' ? 'タスクを追加できません。' : 'この生徒にはタスクを追加できません。');
      return;
    }
    if (!title) {
      title = TASK_TYPE_LABELS[type] || 'タスク';
    }
    if (!target || target < 1) {
      alert('目標の数を1以上で入れてください。');
      return;
    }
    const task = {
      id: uid('task'),
      studentUserId: sid,
      type,
      title,
      targetNumber: target,
      currentNumber: 0,
      dueDate: due || null,
      completed: false,
      completedAt: '',
      createdBy: sessionUser.id,
      createdAt: new Date().toISOString(),
    };
    db.tasks.push(task);
    saveDb();
    renderAll();
  }

  function incrementTask(taskId, delta) {
    const t = db.tasks.find((x) => x.id === taskId);
    if (!t || !canEditTask(sessionUser, t)) return;
    t.currentNumber = Math.max(0, (t.currentNumber || 0) + delta);
    if (t.targetNumber > 0 && t.currentNumber >= t.targetNumber) {
      t.completed = true;
      if (!String(t.completedAt || '').trim()) t.completedAt = todayIso();
    } else {
      t.completed = false;
      t.completedAt = '';
    }
    saveDb();
    renderAll();
  }

  function teamOverviewStorageKey() {
    return 'jouzuTeamOverviewStudent:' + (sessionUser && sessionUser.id ? sessionUser.id : '');
  }

  function getStoredTeamOverviewStudentId(validIds) {
    try {
      var v = localStorage.getItem(teamOverviewStorageKey());
      if (v && validIds.indexOf(v) >= 0) return v;
    } catch (e) { /* ignore */ }
    return '';
  }

  function setStoredTeamOverviewStudentId(sid) {
    try {
      if (sid) localStorage.setItem(teamOverviewStorageKey(), sid);
      else localStorage.removeItem(teamOverviewStorageKey());
    } catch (e) { /* ignore */ }
  }

  function supportEndDateForStudent(u) {
    if (!u || u.role !== 'student') return '';
    ensureProfile(u);
    if (u.profile.supportEndDate) return u.profile.supportEndDate;
    return graduationDateOf(u) || '';
  }

  function supportPeriodText(u) {
    if (!u || u.role !== 'student') return '—';
    ensureProfile(u);
    var start = u.profile.startDate || '';
    var end = supportEndDateForStudent(u);
    if (!start && !end) return '未設定';
    var a = start ? shortDate(start) : '？';
    var b = end ? shortDate(end) : '？';
    return a + ' 〜 ' + b;
  }

  function taskProgressSummaryForStudent(sid) {
    var ts = db.tasks.filter(function (t) { return t.studentUserId === sid; });
    if (!ts.length) {
      return { pct: 0, label: 'タスクなし', open: 0, total: 0, done: 0 };
    }
    var cur = 0;
    var tgt = 0;
    ts.forEach(function (t) {
      var tn = parseInt(t.targetNumber, 10) || 0;
      if (tn < 1) return;
      cur += Math.min(tn, parseInt(t.currentNumber, 10) || 0);
      tgt += tn;
    });
    var open = ts.filter(function (t) { return !isTaskDone(t); }).length;
    var done = ts.length - open;
    if (tgt <= 0) {
      var pct = open ? 0 : 100;
      return {
        pct: pct,
        label: open ? '未完了 ' + open + '件' : 'すべて完了',
        open: open,
        total: ts.length,
        done: done,
      };
    }
    var pct = Math.min(100, Math.round((cur / tgt) * 100));
    return {
      pct: pct,
      label: cur + ' / ' + tgt + '（回数ベース）',
      open: open,
      total: ts.length,
      done: done,
    };
  }

  function todayAgendaChipsForStudent(u) {
    if (!u || u.role !== 'student') return [];
    return buildHomeAgendaItems(u).filter(function (it) {
      return it.sortDate === todayIso();
    });
  }

  function renderTeam() {
    const el = document.getElementById('teamContent');
    if (!el) return;
    if (sessionUser.role === 'student') {
      el.innerHTML = '';
      return;
    }
    const ids = visibleStudentIds(sessionUser);
    let html = '<div class="card mg-team-card"><p class="card-title">担当生徒</p>';
    if (ids.length === 0) {
      html += '<div class="empty-state">表示できる生徒がいません</div></div>';
      el.innerHTML = html;
      return;
    }
    var selected = getStoredTeamOverviewStudentId(ids) || ids[0];
    html += '<p class="mg-team-hint">チップで生徒を切り替え、今日の予定と進捗を横並びで確認できます。</p>';
    html += '<div class="mg-team-chips-scroll"><div class="mg-team-chips" role="tablist" aria-label="担当生徒">';
    ids.forEach(function (sid) {
      var s = getUserById(sid);
      var active = sid === selected ? ' mg-team-chip--active' : '';
      var initial = (s.name || '?').trim().charAt(0) || '?';
      html +=
        '<button type="button" class="mg-team-chip' +
        active +
        '" data-mg-team-chip="' +
        escapeHtml(sid) +
        '" role="tab" aria-selected="' +
        (sid === selected ? 'true' : 'false') +
        '">';
      html += '<span class="mg-team-chip-avatar" aria-hidden="true">' + escapeHtml(initial) + '</span>';
      html += '<span class="mg-team-chip-name">' + escapeHtml(s.name) + '</span>';
      html += '</button>';
    });
    html += '</div></div>';

    var selUser = getUserById(selected);
    ensureProfile(selUser);
    ensureMilestones(selUser);
    var postsDone = completedPostCountForStudent(selected);
    var tsum = taskProgressSummaryForStudent(selected);
    var agendaToday = todayAgendaChipsForStudent(selUser);
    var ts = db.tasks.filter(function (t) { return t.studentUserId === selected; });
    var overdueCount = ts.filter(function (t) { return isOverdue(t); }).length;

    html += '<div class="mg-team-detail">';
    html += '<div class="mg-team-detail-head">';
    html += '<div class="mg-team-detail-title">' + escapeHtml(selUser.name) + '</div>';
    html += '<div class="mg-team-detail-meta">';
    html += '<span class="mg-pill mg-pill-class">' + escapeHtml(selUser.profile.className || 'クラス未設定') + '</span>';
    html += '<span class="mg-pill mg-pill-period">' + escapeHtml(supportPeriodText(selUser)) + '</span>';
    html += '</div></div>';

    html += '<div class="mg-team-metrics">';
    html += '<div class="mg-metric"><span class="mg-metric-lbl">投稿完了</span><span class="mg-metric-val">' + postsDone + '<span class="mg-metric-unit">件</span></span></div>';
    html +=
      '<div class="mg-metric"><span class="mg-metric-lbl">タスク</span><span class="mg-metric-val">' +
      tsum.done +
      '/' +
      tsum.total +
      '</span></div>';
    html += '</div>';

    html += '<div class="mg-team-progress-block">';
    html += '<div class="mg-team-progress-head"><span>タスク進捗</span><span class="mg-team-progress-pct">' + tsum.pct + '%</span></div>';
    html +=
      '<div class="early-sprint-bar-track mg-team-bar" title="カウント付きタスクの合計進捗"><div class="early-sprint-bar-fill early-sprint-bar-fill--posts" style="width:' +
      tsum.pct +
      '%"></div></div>';
    html += '<p class="mg-team-progress-sub">' + escapeHtml(tsum.label) + '</p>';
    html += '</div>';

    html += '<div class="mg-team-today"><div class="mg-team-today-lbl">今日のタスク・予定</div>';
    if (agendaToday.length === 0) {
      html += '<p class="mg-team-today-empty">今日の予定はありません（生徒ホームの「今日の予定」と同じ内容です）。</p>';
    } else {
      html += '<div class="mg-team-today-chips">';
      agendaToday.forEach(function (it) {
        var doneCls = it.done ? ' mg-mini-chip--done' : '';
        html +=
          '<span class="mg-mini-chip' +
          doneCls +
          '"><span class="mg-mini-chip-ico" aria-hidden="true">' +
          (it.icon || '') +
          '</span><span class="mg-mini-chip-txt">' +
          escapeHtml(it.label) +
          '</span>' +
          (it.done ? '<span class="mg-mini-chip-check">✓</span>' : '') +
          '</span>';
      });
      html += '</div>';
    }
    html += '</div>';

    if (overdueCount > 0) {
      html +=
        '<p class="mg-team-alert">期限超過のタスクが ' +
        overdueCount +
        ' 件あります。「タスク」タブで確認してください。</p>';
    }

    html += '</div></div>';
    html += '<p class="mg-team-footnote">詳細の追加・変更は「タスク」「スケジュール」タブから行えます。</p>';
    el.innerHTML = html;

    el.querySelectorAll('[data-mg-team-chip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-mg-team-chip');
        if (!sid) return;
        setStoredTeamOverviewStudentId(sid);
        renderTeam();
      });
    });
  }

  function renderLog() {
    const el = document.getElementById('logContent');
    if (!el) return;
    if (sessionUser.role !== 'student') {
      el.innerHTML =
        '<div class="card"><p class="card-title">記録（生徒向け）</p><p style="margin:0;color:var(--muted);font-size:0.9rem;">生徒アカウントでログインすると、ワンタップで回数を足せます。</p></div>';
      return;
    }
    const mine = sortTasks(db.tasks.filter((t) => t.studentUserId === sessionUser.id));
    let html = '<div class="card"><p class="card-title">今日の記録</p><p style="margin:0 0 12px;font-size:0.85rem;color:var(--muted);">投稿・セッション・講義をしたら、大きなボタンで＋1できます。</p>';
    const open = mine.filter((t) => !isTaskDone(t));
    if (open.length === 0) {
      html += '<p style="margin:0;color:var(--ok);font-weight:600;">すべてのタスクが目標に達しています 🎉</p>';
    } else {
      open.forEach((t) => {
        const icon = TASK_TYPE_ICONS[t.type] || '✓';
        if (t.title === '投稿作成') {
          const boundary = getNextSessionBoundaryDateForStudent(sessionUser.id);
          const need = Math.max(0, (t.targetNumber || 0) - (t.currentNumber || 0));
          html += '<div class="log-task-block" style="margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">';
          html +=
            '<div style="font-weight:700;font-size:0.95rem;margin-bottom:6px;">' +
            icon +
            ' ' +
            escapeHtml(t.title) +
            ' <span style="font-size:0.85rem;color:var(--muted);font-weight:600;">' +
            (t.currentNumber || 0) +
            '/' +
            (t.targetNumber || 0) +
            '</span></div>';
          if (boundary) {
            html +=
              '<p style="margin:0 0 10px;font-size:0.78rem;color:var(--muted);line-height:1.45;">次回まで（' +
              shortDate(boundary) +
              '）までの期間に、残り ' +
              need +
              ' 件の投稿カードを均等に配置します。</p>';
          } else {
            html +=
              '<p style="margin:0 0 10px;font-size:0.78rem;color:var(--muted);line-height:1.45;">ロードマップで次回セッションの日時（「次回まで」）または未来の実施日を設定すると、ここから投稿カードを作成できます。</p>';
          }
          html +=
            '<button type="button" class="btn btn-secondary btn-small" style="margin-bottom:8px;width:100%;" data-post-cards-task="' +
            escapeHtml(t.id) +
            '"' +
            (need < 1 || !boundary ? ' disabled' : '') +
            '>投稿カードを作成（日付を均等配置）</button>';
          html +=
            '<button type="button" class="btn btn-primary" style="width:100%;background:var(--brand);" data-inc-task="' +
            escapeHtml(t.id) +
            '">' +
            icon +
            ' 投稿した ＋1</button>';
          html += '</div>';
          return;
        }
        html +=
          '<button type="button" class="btn btn-primary" style="margin-bottom:10px;background:var(--brand);" data-inc-task="' +
          t.id +
          '">' +
          icon +
          ' ' +
          escapeHtml(t.title) +
          ' ＋1</button>';
      });
    }
    html += '</div>';
    el.innerHTML = html;
    bindTaskButtons(el);
  }

  function memosForStudent(studentId) {
    return (db.memos || [])
      .filter(function (m) { return m.studentUserId === studentId; })
      .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
  }

  function addMemoFromForm() {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var catEl = document.getElementById('memoCategorySelect');
    var textEl = document.getElementById('memoInputText');
    if (!catEl || !textEl) return;
    var category = catEl.value;
    var text = textEl.value.trim();
    if (!category) {
      alert('メモの種類を選択してください。');
      return;
    }
    if (!text) {
      alert('メモ内容を入力してください。');
      return;
    }
    db.memos.push({
      id: uid('memo'),
      studentUserId: sessionUser.id,
      category: category,
      text: text,
      createdAt: new Date().toISOString(),
    });
    saveDb();
    renderMemo();
  }

  function renderMemo() {
    var el = document.getElementById('memoContent');
    if (!el) return;
    if (!sessionUser || sessionUser.role !== 'student') {
      el.innerHTML = '<div class="card"><p class="card-title">メモ</p><p style="margin:0;color:var(--muted);">生徒アカウントで利用できます。</p></div>';
      return;
    }
    var list = memosForStudent(sessionUser.id);
    var html = '<div class="card"><p class="card-title">メモ</p>';
    html += '<label class="label">メモの種類</label>';
    html += '<select id="memoCategorySelect" class="input">';
    html += '<option value="">選択してください</option>';
    getCalendarSchedulePresets().forEach(function (c) {
      html += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });
    html += '</select>';
    html += '<textarea id="memoInputText" class="input" rows="4" placeholder="気づき・メモを入力"></textarea>';
    html += '<button type="button" class="btn btn-primary" id="memoAddBtn">メモを保存</button></div>';
    html += '<div class="card"><p class="card-title">保存したメモ</p>';
    if (list.length === 0) {
      html += '<p style="margin:0;color:var(--muted);">メモはまだありません。</p>';
    } else {
      list.forEach(function (m) {
        var d = new Date(m.createdAt);
        var label = (d.getMonth() + 1) + '/' + d.getDate() + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
        var catTag = m.category ? '<span class="memo-cat-tag">' + escapeHtml(m.category) + '</span>' : '';
        html += '<div class="memo-row">';
        html += '<div class="memo-head"><span class="memo-date">' + label + '</span>' + catTag + '</div>';
        html += '<div class="memo-text">' + escapeHtml(m.text) + '</div></div>';
      });
    }
    html += '</div>';
    el.innerHTML = html;
    var addBtn = document.getElementById('memoAddBtn');
    if (addBtn) addBtn.addEventListener('click', addMemoFromForm);
  }

  var scheduleSubTab = 'calendar';
  /** 月グリッドで表示する月の1日 YYYY-MM-01 */
  var scheduleGridMonth = null;
  /** 下のリストに出す日付範囲（両端含む） */
  var scheduleListRangeStart = null;
  var scheduleListRangeEnd = null;
  /** 日別一覧でハイライトする日（フォーカス用） */
  var scheduleAddTargetDate = null;
  /** 期間モード: day=日ごと / week=最大1週間 / month=月全体 */
  var schedulePeriodMode = 'week';

  var calDragState = { active: false, anchorIso: null, hoverIso: null };
  var calDragDocBound = false;

  function normalizeScheduleListAndTarget() {
    var days = enumerateInclusiveRange(scheduleListRangeStart, scheduleListRangeEnd);
    if (days.length === 0) {
      var t = todayIso();
      scheduleListRangeStart = t;
      scheduleListRangeEnd = t;
      scheduleAddTargetDate = scheduleAddTargetDate || t;
      return;
    }
    if (scheduleAddTargetDate && days.indexOf(scheduleAddTargetDate) >= 0) return;
    var t = todayIso();
    scheduleAddTargetDate = days.indexOf(t) >= 0 ? t : days[0];
  }

  /** anchorDayIso を基準に、現在の scheduleGridMonth と schedulePeriodMode で一覧範囲を決める */
  function snapScheduleRangeToPeriodMode(anchorDayIso) {
    var a = anchorDayIso || scheduleAddTargetDate || todayIso();
    if (schedulePeriodMode === 'month') {
      scheduleListRangeStart = scheduleGridMonth;
      scheduleListRangeEnd = lastDayOfMonthIso(scheduleGridMonth);
    } else if (schedulePeriodMode === 'week') {
      scheduleListRangeStart = startOfWeekSundayIso(a);
      scheduleListRangeEnd = addDaysToIsoDate(scheduleListRangeStart, 6);
    } else {
      scheduleListRangeStart = scheduleListRangeEnd = a;
    }
    normalizeScheduleListAndTarget();
  }

  function clampIsoRangeToMaxDays(lo, hi, maxDays) {
    var a = lo <= hi ? lo : hi;
    var b = lo <= hi ? hi : lo;
    var days = enumerateInclusiveRange(a, b);
    if (days.length <= maxDays) return { lo: a, hi: b };
    return { lo: a, hi: days[maxDays - 1] };
  }

  function updateScheduleAddTargetUI(container, dayIso) {
    var hid = document.getElementById('scheduleDate');
    if (hid) hid.value = dayIso || '';
    var lab = document.getElementById('scheduleAddTargetLabel');
    if (lab) {
      lab.innerHTML = '追加先: <strong>' + scheduleDayHeadingHtml(dayIso) + '</strong>';
    }
    if (container) {
      container.querySelectorAll('.cal-day[data-cal-pick-day]').forEach(function (node) {
        var isSel = node.getAttribute('data-cal-pick-day') === dayIso;
        node.classList.toggle('cal-day-selected', isSel);
        node.setAttribute('aria-pressed', isSel ? 'true' : 'false');
        node.setAttribute('tabindex', isSel ? '0' : '-1');
      });
      container.querySelectorAll('.cal-m-day[data-cal-cell-day]').forEach(function (node) {
        var d = node.getAttribute('data-cal-cell-day');
        node.classList.toggle('cal-m-day--add-target', d === dayIso);
      });
    }
  }

  function calMonthGridClearPreview(container) {
    if (!container) return;
    container.querySelectorAll('.cal-m-day--preview').forEach(function (n) {
      n.classList.remove('cal-m-day--preview');
    });
  }

  function calMonthGridApplyPreview(container, anchorIso, hoverIso) {
    calMonthGridClearPreview(container);
    if (!anchorIso || !hoverIso) return;
    var lo = anchorIso <= hoverIso ? anchorIso : hoverIso;
    var hi = anchorIso <= hoverIso ? hoverIso : anchorIso;
    if (schedulePeriodMode === 'day' || schedulePeriodMode === 'month') {
      lo = hi = hoverIso;
    } else if (schedulePeriodMode === 'week') {
      var cw = clampIsoRangeToMaxDays(lo, hi, 7);
      lo = cw.lo;
      hi = cw.hi;
    }
    container.querySelectorAll('.cal-m-day[data-cal-cell-day]').forEach(function (n) {
      var d = n.getAttribute('data-cal-cell-day');
      if (d && d >= lo && d <= hi) n.classList.add('cal-m-day--preview');
    });
  }

  function calDocPointerMove(e) {
    if (!calDragState.active || !calDragState.anchorIso) return;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var btn = el && el.closest && el.closest('.cal-m-day[data-cal-cell-day]');
    var iso = btn ? btn.getAttribute('data-cal-cell-day') : null;
    if (!iso) return;
    calDragState.hoverIso = iso;
    var gridHost = document.getElementById('scheduleContent');
    if (gridHost) calMonthGridApplyPreview(gridHost, calDragState.anchorIso, iso);
  }

  function calDocPointerUp(e) {
    if (!calDragState.active) return;
    calDragState.active = false;
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var btn = el && el.closest && el.closest('.cal-m-day[data-cal-cell-day]');
    var endIso = btn ? btn.getAttribute('data-cal-cell-day') : calDragState.hoverIso || calDragState.anchorIso;
    var anchor = calDragState.anchorIso;
    calDragState.anchorIso = null;
    calDragState.hoverIso = null;
    var gridHost = document.getElementById('scheduleContent');
    if (gridHost) calMonthGridClearPreview(gridHost);
    if (!anchor || !endIso) return;
    scheduleAddTargetDate = endIso;
    if (endIso.slice(0, 7) !== scheduleGridMonth.slice(0, 7)) {
      scheduleGridMonth = endIso.slice(0, 7) + '-01';
    }

    if (schedulePeriodMode === 'month') {
      scheduleListRangeStart = scheduleGridMonth;
      scheduleListRangeEnd = lastDayOfMonthIso(scheduleGridMonth);
      normalizeScheduleListAndTarget();
      renderSchedule();
      return;
    }
    if (schedulePeriodMode === 'day') {
      scheduleListRangeStart = scheduleListRangeEnd = endIso;
      normalizeScheduleListAndTarget();
      renderSchedule();
      return;
    }
    /* week */
    var sameCell = anchor === endIso;
    if (sameCell) {
      scheduleListRangeStart = startOfWeekSundayIso(endIso);
      scheduleListRangeEnd = addDaysToIsoDate(scheduleListRangeStart, 6);
    } else {
      var lo = anchor <= endIso ? anchor : endIso;
      var hi = anchor <= endIso ? endIso : anchor;
      var capped = clampIsoRangeToMaxDays(lo, hi, 7);
      scheduleListRangeStart = capped.lo;
      scheduleListRangeEnd = capped.hi;
    }
    normalizeScheduleListAndTarget();
    renderSchedule();
  }

  function ensureCalDragDocumentListeners() {
    if (calDragDocBound) return;
    calDragDocBound = true;
    document.addEventListener('pointermove', calDocPointerMove);
    document.addEventListener('pointerup', calDocPointerUp);
    document.addEventListener('pointercancel', calDocPointerUp);
  }

  /**
   * スケジュール月グリッド用：完了件数をタスク系／投稿系に分ける。
   * タスク系: ホーム期限タスク、セッションタスク、定期、予定（投稿予定・投稿ログ以外）
   * 投稿系: 投稿予定の✓、投稿ログ、未記録の投稿ワークフロー100%（workflowCompletedAt）
   */
  function scheduleMonthDoneSplitByDay(studentId, ym) {
    var task = {};
    var post = {};
    function bump(o, d) {
      if (!d || d.slice(0, 7) !== ym) return;
      o[d] = (o[d] || 0) + 1;
    }

    (db.tasks || []).forEach(function (t) {
      if (t.studentUserId !== studentId || !isTaskDone(t)) return;
      var due = t.dueDate && String(t.dueDate).trim().slice(0, 10);
      var ca = String(t.completedAt || '').trim().slice(0, 10);
      bump(task, due || ca);
    });

    getCoachingSessions(studentId).forEach(function (sess) {
      (sess.tasks || []).forEach(function (st) {
        if (!st.done) return;
        var due = st.dueDate && String(st.dueDate).trim().slice(0, 10);
        var doneD = st.doneDate && String(st.doneDate).trim().slice(0, 10);
        bump(task, due || doneD);
      });
    });

    (db.bookings || []).forEach(function (b) {
      if (b.studentUserId !== studentId) return;
      var d = (b.date || '').slice(0, 10);
      if (b.bookingType === 'post_log') {
        bump(post, d);
        return;
      }
      if (!b.completed) return;
      if (b.category === '投稿予定') {
        bump(post, d);
        return;
      }
      bump(task, d);
    });

    if (sessionUser && sessionUser.id === studentId && sessionUser.role === 'student') {
      var monthFirst = ym.length === 7 ? ym + '-01' : ym;
      var lastD = lastDayOfMonthIso(monthFirst);
      for (var walk = monthFirst; walk && walk <= lastD; walk = addDaysToIsoDate(walk, 1)) {
        if (!walk) break;
        getRecurringTasks().forEach(function (rt) {
          if (!rt.enabled) return;
          if (isRecurringDoneOnDate(sessionUser, rt.id, walk)) bump(task, walk);
        });
      }
    }

    postsForStudent(studentId).forEach(function (p) {
      if (p.recordedToCalendar) return;
      if (postProgress(p).pct < 100) return;
      var w = String(p.workflowCompletedAt || '').trim().slice(0, 10);
      if (!w) w = postWorkflowCompletedDateIso(p);
      bump(post, w);
    });

    return { task: task, post: post };
  }

  /** 月グリッド用：その日が「投稿予定日」かつ未完了の本数 */
  function scheduleMonthPostPlannedOpenByDay(studentId, ym) {
    var open = {};
    postsForStudent(studentId).forEach(function (p) {
      if (p.recordedToCalendar) return;
      if (postProgress(p).pct >= 100) return;
      var plan = String(p.plannedPublishDate || '').trim().slice(0, 10);
      if (!plan || plan.slice(0, 7) !== ym) return;
      open[plan] = (open[plan] || 0) + 1;
    });
    return open;
  }

  function renderMonthCalendarGridHtml() {
    var monthFirst = scheduleGridMonth;
    if (!monthFirst) return '';
    var firstCell = addDaysToIsoDate(monthFirst, -new Date(monthFirst + 'T12:00:00').getDay());
    if (!firstCell) firstCell = monthFirst;
    var ym = monthFirst.slice(0, 7);
    var doneSplit =
      sessionUser && sessionUser.role === 'student' ? scheduleMonthDoneSplitByDay(sessionUser.id, ym) : { task: {}, post: {} };
    var planOpen =
      sessionUser && sessionUser.role === 'student' ? scheduleMonthPostPlannedOpenByDay(sessionUser.id, ym) : {};
    var consultStartCal = sessionUser && sessionUser.role === 'student' ? String(programStartDateOf(sessionUser)).slice(0, 10) : '';
    var consultGradCal = sessionUser && sessionUser.role === 'student' ? String(graduationDateOf(sessionUser) || '').slice(0, 10) : '';

    var html = '<div class="cal-month-wrap card">';
    html += '<div class="cal-month-head">';
    html += '<button type="button" class="cal-month-nav-btn" data-cal-month-prev aria-label="前の月">‹</button>';
    html += '<span class="cal-month-title">' + escapeHtml(monthYearJaHeader(monthFirst)) + '</span>';
    html += '<button type="button" class="cal-month-nav-btn" data-cal-month-next aria-label="次の月">›</button>';
    html += '<button type="button" class="cal-month-today-btn" data-cal-month-today>今日</button>';
    html += '</div>';
    html += '<div class="cal-period-tabs" role="tablist" aria-label="表示期間">';
    html += '<button type="button" role="tab" class="cal-period-tab' + (schedulePeriodMode === 'day' ? ' cal-period-tab--active' : '') + '" data-cal-period="day" aria-selected="' + (schedulePeriodMode === 'day' ? 'true' : 'false') + '">日</button>';
    html += '<button type="button" role="tab" class="cal-period-tab' + (schedulePeriodMode === 'week' ? ' cal-period-tab--active' : '') + '" data-cal-period="week" aria-selected="' + (schedulePeriodMode === 'week' ? 'true' : 'false') + '">1週間</button>';
    html += '<button type="button" role="tab" class="cal-period-tab' + (schedulePeriodMode === 'month' ? ' cal-period-tab--active' : '') + '" data-cal-period="month" aria-selected="' + (schedulePeriodMode === 'month' ? 'true' : 'false') + '">月</button>';
    html += '</div>';
    html += '<div class="cal-m-weekday-row">';
    DAY_NAMES.forEach(function (dn) {
      html += '<span class="cal-m-wd">' + dn + '</span>';
    });
    html += '</div>';
    html += '<div class="cal-m-legend-block">';
    html += '<p class="cal-m-task-legend"><span class="cal-m-legend-swatch cal-m-legend-swatch--task" aria-hidden="true"></span><span>緑＝タスク系（ホーム期限・セッション・定期・一般予定の✓）</span></p>';
    html += '<p class="cal-m-task-legend"><span class="cal-m-legend-swatch cal-m-legend-swatch--post" aria-hidden="true"></span><span>橙＝投稿の完了（記録・WF100%の日付）</span></p>';
    html += '<p class="cal-m-task-legend"><span class="cal-m-legend-swatch cal-m-legend-swatch--plan" aria-hidden="true"></span><span>紫＝未完了の投稿予定がある日（件数）</span></p>';
    html += '<p class="cal-m-task-legend"><span class="cal-m-legend-swatch cal-m-legend-swatch--consult-start" aria-hidden="true">始</span><span>コンサル開始日（マイページのプログラム開始日）</span></p>';
    html += '<p class="cal-m-task-legend"><span class="cal-m-legend-swatch cal-m-legend-swatch--consult-grad" aria-hidden="true">卒</span><span>卒業予定日（開始から210日後）</span></p>';
    html += '<p class="cal-m-legend cal-m-legend--today-hint"><span class="cal-m-legend-today-ico" aria-hidden="true"></span>「今日」は日付の<strong>枠</strong>と「今日」表示。下の丸数字だけが件数です。</p>';
    html += '</div>';
    html += '<div class="cal-m-grid" id="calMonthGrid">';

    var today = todayIso();
    var rs = scheduleListRangeStart;
    var re = scheduleListRangeEnd;
    var addT = scheduleAddTargetDate;

    for (var row = 0; row < 6; row++) {
      html += '<div class="cal-m-row">';
      for (var col = 0; col < 7; col++) {
        var idx = row * 7 + col;
        var cellIso = addDaysToIsoDate(firstCell, idx);
        if (!cellIso) continue;
        var inMonth = cellIso.slice(0, 7) === ym;
        var isToday = cellIso === today;
        var rangeLo = rs <= re ? rs : re;
        var rangeHi = rs <= re ? re : rs;
        var inList = isoInInclusiveRange(cellIso, rs, re);
        var isRangeStart = inList && cellIso === rangeLo;
        var isRangeEnd = inList && cellIso === rangeHi;
        var isAdd = cellIso === addT;
        var dayNum = parseInt(cellIso.slice(8, 10), 10);
        var cellConsultStart = consultStartCal && cellIso === consultStartCal;
        var cellConsultGrad = consultGradCal && cellIso === consultGradCal;
        var cls = 'cal-m-day';
        if (!inMonth) cls += ' cal-m-day--muted';
        if (isToday) cls += ' cal-m-day--today';
        if (inList) cls += ' cal-m-day--in-range';
        if (isRangeStart) cls += ' cal-m-day--range-start';
        if (isRangeEnd) cls += ' cal-m-day--range-end';
        if (isAdd) cls += ' cal-m-day--add-target';
        if (cellConsultStart) cls += ' cal-m-day--consult-start';
        if (cellConsultGrad) cls += ' cal-m-day--consult-grad';
        var tDone = (doneSplit.task && doneSplit.task[cellIso]) || 0;
        var pDone = (doneSplit.post && doneSplit.post[cellIso]) || 0;
        var pPlanOpen = (planOpen && planOpen[cellIso]) || 0;
        var tip = shortDate(cellIso);
        if (tDone > 0) tip += ' · タスク系✓ ' + tDone + '件';
        if (pDone > 0) tip += ' · 投稿完了 ' + pDone + '件';
        if (pPlanOpen > 0) tip += ' · 投稿予定（未） ' + pPlanOpen + '件';
        if (cellConsultStart) tip += ' · コンサル開始日';
        if (cellConsultGrad) tip += ' · 卒業予定日';
        html += '<button type="button" class="' + cls + '" data-cal-cell-day="' + escapeHtml(cellIso) + '" title="' + escapeHtml(tip) + '">';
        if (isAdd) {
          html += '<span class="cal-m-day-num">' + dayNum + '</span>';
        } else if (isToday) {
          html += '<span class="cal-m-day-num-stack">';
          html += '<span class="cal-m-day-num cal-m-day-num--today-ring">' + dayNum + '</span>';
          html += '<span class="cal-m-today-lbl">今日</span>';
          html += '</span>';
        } else {
          html += '<span class="cal-m-day-num">' + dayNum + '</span>';
        }
        if (cellConsultStart || cellConsultGrad) {
          html += '<span class="cal-m-ms-pills" aria-hidden="true">';
          if (cellConsultStart) html += '<span class="cal-m-ms-pill cal-m-ms-pill--start" title="コンサル開始日">始</span>';
          if (cellConsultGrad) html += '<span class="cal-m-ms-pill cal-m-ms-pill--grad" title="卒業予定日">卒</span>';
          html += '</span>';
        }
        if (tDone > 0 || pDone > 0 || pPlanOpen > 0) {
          html += '<span class="cal-m-done-badges">';
          if (pPlanOpen > 0) {
            html += '<span class="cal-m-plan-badge" title="未完了の投稿予定">' + (pPlanOpen > 1 ? pPlanOpen : '·') + '</span>';
          }
          if (tDone > 0) {
            html += '<span class="cal-m-done-badge cal-m-done-badge--task" title="タスク系">' + tDone + '</span>';
          }
          if (pDone > 0) {
            html += '<span class="cal-m-done-badge cal-m-done-badge--post" title="投稿完了">' + pDone + '</span>';
          }
          html += '</span>';
        }
        html += '</button>';
      }
      html += '</div>';
    }
    html += '</div>';

    html += '<div class="cal-month-footer">';
    html += '<span class="cal-month-range-lbl">' + escapeHtml(scheduleRangeListLabel(rs, re)) + '</span>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  function getAllEventsForDate(day, byDate, sessionsByDate, studentUser) {
    var events = [];
    if (studentUser && studentUser.role === 'student' && day === todayIso()) {
      getRecurringTasks().forEach(function (rt) {
        if (!rt.enabled) return;
        var cat = RECURRING_CHIP_CATEGORY[rt.id] || rt.title;
        events.push({
          type: 'recurring',
          label: rt.title,
          icon: rt.icon,
          recurringId: rt.id,
          category: cat,
          done: isRecurringDoneOnDate(studentUser, rt.id, day),
        });
      });
    }
    (byDate[day] || []).forEach(function (b) {
      if (b.bookingType === 'post_log') {
        events.push({
          type: 'post-log',
          label: b.category || '投稿完了',
          done: true,
          readonly: true,
        });
        return;
      }
      var dispLabel = b.category;
      if (b.category === '投稿予定' && b.linkedPostId) {
        var lp = (db.posts || []).find(function (p) { return p.id === b.linkedPostId; });
        if (lp) dispLabel = '投稿予定 · ' + (lp.title || '投稿');
      }
      if (b.coachingSessionNum && b.category === 'コーチングセッション') {
        dispLabel = sessionMilestoneLabel(b.coachingSessionNum);
      }
      events.push({
        type: 'booking',
        label: dispLabel,
        bookingId: b.id,
        category: b.category,
        done: !!b.completed,
        linkedPostId: b.linkedPostId || '',
      });
    });
    (sessionsByDate[day] || []).forEach(function (wrap) {
      var t = wrap.task;
      events.push({
        type: 'session-task',
        label: t.title,
        sessionId: wrap.sessionId,
        taskId: t.id,
        done: !!t.done,
      });
    });

    if (studentUser && studentUser.role === 'student') {
      var allP = postsForStudent(studentUser.id);
      allP.forEach(function (p, idx) {
        if (p.recordedToCalendar) return;
        if (postProgress(p).pct >= 100) return;
        var plan = String(p.plannedPublishDate || '').trim().slice(0, 10);
        if (plan !== day) return;
        var dup = events.some(function (ev) {
          return ev.type === 'booking' && ev.category === '投稿予定' && ev.linkedPostId === p.id;
        });
        if (dup) return;
        events.push({
          type: 'post-plan-synth',
          postId: p.id,
          label: '投稿予定 · ' + (p.title || '投稿 #' + (idx + 1)),
          done: false,
        });
      });
      allP.forEach(function (p, idx) {
        if (p.recordedToCalendar) return;
        if (postProgress(p).pct < 100) return;
        var cd = postWorkflowCompletedDateIso(p);
        if (!cd || cd.slice(0, 10) !== day) return;
        events.push({
          type: 'post-wf-done',
          postId: p.id,
          label: '投稿完了（記録前）· ' + (p.title || '投稿 #' + (idx + 1)),
          done: true,
          readonly: true,
        });
      });
    }

    return events;
  }

  function buildSessionTasksByDate() {
    var map = {};
    var sessions = getCoachingSessions(sessionUser.id);
    sessions.forEach(function (sess) {
      sess.tasks.forEach(function (t) {
        if (t.dueDate) {
          if (!map[t.dueDate]) map[t.dueDate] = [];
          map[t.dueDate].push({ task: t, sessionId: sess.id });
        }
      });
    });
    return map;
  }

  function renderSchedule() {
    var el = document.getElementById('scheduleContent');
    if (!el) return;
    document.body.classList.remove('schedule-sheet-lock');
    if (!sessionUser || sessionUser.role !== 'student') {
      el.innerHTML = '<div class="card"><p class="card-title">スケジュール</p><p style="margin:0;color:var(--muted);">生徒アカウントで予定を確認できます。</p></div>';
      return;
    }
    ensureProfile(sessionUser);
    if (!scheduleGridMonth) scheduleGridMonth = todayIso().slice(0, 7) + '-01';
    if (!scheduleListRangeStart || !scheduleListRangeEnd) {
      if (!scheduleAddTargetDate) scheduleAddTargetDate = todayIso();
      snapScheduleRangeToPeriodMode(scheduleAddTargetDate);
    }
    normalizeScheduleListAndTarget();

    var html = '';

    html += '<div class="rm-tabs">';
    html += '<button type="button" class="rm-tab' + (scheduleSubTab === 'calendar' ? ' active' : '') + '" data-sched-sub="calendar">スケジュール</button>';
    html += '<button type="button" class="rm-tab' + (scheduleSubTab === 'memo' ? ' active' : '') + '" data-sched-sub="memo">メモ</button>';
    html += '</div>';

    if (scheduleSubTab === 'memo') {
      html += renderMemoInlineHtml();
    } else {
      html += renderCalendarHtml();
    }

    el.innerHTML = html;
    bindScheduleEvents(el);
  }

  function renderCalendarHtml() {
    var start = programStartDateOf(sessionUser);
    var bookings = bookingsForStudent(sessionUser.id);
    var byDate = {};
    bookings.forEach(function (b) {
      if (!byDate[b.date]) byDate[b.date] = [];
      byDate[b.date].push(b);
    });
    var sessionsByDate = buildSessionTasksByDate();

    var html = '';

    html += '<div class="cal-schedule-stack">';
    html += renderMonthCalendarGridHtml();
    html += '</div>';
    html += '<p class="cal-schedule-view-hint">ここでは<strong>予定の確認</strong>と<strong>完了チェック</strong>ができます。<strong>投稿予定日</strong>・<strong>投稿完了</strong>も日付ごとに表示されます（予定は投稿タブで変更）。セッション課題の追加はロードマップの<strong>セッションタスク</strong>から。</p>';

    var listDays = enumerateInclusiveRange(scheduleListRangeStart, scheduleListRangeEnd);

    html += '<div class="cal-day-list">';
    for (var i = 0; i < listDays.length; i++) {
      var day = listDays[i];
      if (!day) continue;
      var events = getAllEventsForDate(day, byDate, sessionsByDate, sessionUser);
      var dayClass = day === todayIso() ? ' today' : '';
      var isWeekend = new Date(day + 'T12:00:00').getDay() % 6 === 0;
      if (isWeekend) dayClass += ' weekend';
      var dayNum = '';
      for (var d = 0; d < 210; d++) {
        if (addDaysToIsoDate(start, d) === day) { dayNum = 'Day ' + (d + 1); break; }
      }

      if (day === scheduleAddTargetDate) dayClass += ' cal-day-selected';

      html += '<div class="cal-day cal-day-pickable' + dayClass + '" data-cal-pick-day="' + escapeHtml(day) + '" role="button" tabindex="' + (day === scheduleAddTargetDate ? '0' : '-1') + '" aria-pressed="' + (day === scheduleAddTargetDate ? 'true' : 'false') + '">';
      html += '<div class="cal-day-header">';
      html += '<span class="cal-day-date">' + scheduleDayHeadingHtml(day) + '</span>';
      if (dayNum) html += '<span class="cal-day-num">' + dayNum + '</span>';
      html += '</div>';
      if (events.length > 0) {
        html += '<div class="cal-events-stack">';
        events.forEach(function (ev) {
          if (ev.type === 'recurring') {
            var rtone = schedChipToneClass(ev.category);
            html += '<button type="button" class="sched-chip sched-cal-chip ' + rtone + (ev.done ? ' done' : '') + '" data-cal-recurring="' + escapeHtml(ev.recurringId) + '" data-cal-recurring-day="' + escapeHtml(day) + '">';
            if (ev.icon) html += '<span class="sched-chip-ico">' + ev.icon + '</span>';
            else html += '<span class="sched-chip-ico">🔁</span>';
            html += '<span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            if (ev.done) html += '<span class="sched-chip-check" aria-hidden="true">✓</span>';
            html += '</button>';
          } else if (ev.type === 'booking') {
            var btone = schedChipToneClass(bookingCategoryForTone(ev.category));
            var bIco = ev.category === '投稿予定' ? '📅' : '📌';
            html += '<button type="button" class="sched-chip sched-cal-chip ' + btone + (ev.done ? ' done' : '') + '" data-cal-booking="' + escapeHtml(ev.bookingId) + '">';
            html += '<span class="sched-chip-ico">' + bIco + '</span><span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            if (ev.done) html += '<span class="sched-chip-check" aria-hidden="true">✓</span>';
            html += '</button>';
          } else if (ev.type === 'post-log') {
            var logTone = schedChipToneClass('投稿予定');
            html += '<div class="sched-chip sched-cal-chip sched-cal-chip--readonly ' + logTone + ' done" role="status" title="投稿タブでまとめて記録済み">';
            html += '<span class="sched-chip-ico">✅</span><span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            html += '<span class="sched-chip-check" aria-hidden="true">✓</span>';
            html += '</div>';
          } else if (ev.type === 'post-plan-synth') {
            var ptone = schedChipToneClass('投稿予定');
            html += '<button type="button" class="sched-chip sched-cal-chip ' + ptone + '" data-cal-goto-post="' + escapeHtml(ev.postId) + '" title="投稿タブで開く">';
            html += '<span class="sched-chip-ico">📅</span><span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            html += '</button>';
          } else if (ev.type === 'post-wf-done') {
            var wtone = schedChipToneClass('投稿予定');
            html += '<button type="button" class="sched-chip sched-cal-chip ' + wtone + ' done" data-cal-goto-post="' + escapeHtml(ev.postId) + '" title="投稿タブで開く・まとめて記録へ">';
            html += '<span class="sched-chip-ico">✅</span><span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            html += '<span class="sched-chip-check" aria-hidden="true">✓</span>';
            html += '</button>';
          } else {
            var stone = schedChipToneClass(sessionTaskCategoryGuess(ev.label));
            html += '<button type="button" class="sched-chip sched-cal-chip ' + stone + (ev.done ? ' done' : '') + '" data-cal-stask="' + escapeHtml(ev.sessionId) + '|' + escapeHtml(ev.taskId) + '">';
            html += '<span class="sched-chip-ico">📋</span><span class="sched-chip-txt">' + escapeHtml(ev.label) + '</span>';
            if (ev.done) html += '<span class="sched-chip-check" aria-hidden="true">✓</span>';
            html += '</button>';
          }
        });
        html += '</div>';
      } else {
        html += '<div class="cal-empty">予定なし</div>';
      }
      html += '</div>';
    }
    html += '</div>';

    return html;
  }

  function bindScheduleEvents(el) {
    el.querySelectorAll('[data-sched-sub]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        scheduleSubTab = btn.getAttribute('data-sched-sub');
        renderSchedule();
      });
    });

    if (scheduleSubTab === 'memo') {
      bindMemoEvents(el);
      return;
    }

    el.querySelectorAll('[data-cal-pick-day]').forEach(function (row) {
      row.addEventListener('click', function () {
        var dayIso = row.getAttribute('data-cal-pick-day');
        if (!dayIso) return;
        scheduleAddTargetDate = dayIso;
        scheduleGridMonth = dayIso.slice(0, 7) + '-01';
        snapScheduleRangeToPeriodMode(dayIso);
        renderSchedule();
      });
      row.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        var dayIso = row.getAttribute('data-cal-pick-day');
        if (!dayIso) return;
        scheduleAddTargetDate = dayIso;
        scheduleGridMonth = dayIso.slice(0, 7) + '-01';
        snapScheduleRangeToPeriodMode(dayIso);
        renderSchedule();
      });
    });

    var prevM = el.querySelector('[data-cal-month-prev]');
    if (prevM) {
      prevM.addEventListener('click', function () {
        scheduleGridMonth = addMonthsFirstIso(scheduleGridMonth, -1);
        var anchor = scheduleAddTargetDate;
        if (!anchor || anchor.slice(0, 7) !== scheduleGridMonth.slice(0, 7)) {
          anchor = scheduleGridMonth;
          scheduleAddTargetDate = scheduleGridMonth;
        }
        snapScheduleRangeToPeriodMode(anchor);
        renderSchedule();
      });
    }
    var nextM = el.querySelector('[data-cal-month-next]');
    if (nextM) {
      nextM.addEventListener('click', function () {
        scheduleGridMonth = addMonthsFirstIso(scheduleGridMonth, 1);
        var anchor = scheduleAddTargetDate;
        if (!anchor || anchor.slice(0, 7) !== scheduleGridMonth.slice(0, 7)) {
          anchor = scheduleGridMonth;
          scheduleAddTargetDate = scheduleGridMonth;
        }
        snapScheduleRangeToPeriodMode(anchor);
        renderSchedule();
      });
    }
    var todayM = el.querySelector('[data-cal-month-today]');
    if (todayM) {
      todayM.addEventListener('click', function () {
        var t = todayIso();
        scheduleGridMonth = t.slice(0, 7) + '-01';
        scheduleAddTargetDate = t;
        snapScheduleRangeToPeriodMode(t);
        renderSchedule();
      });
    }

    el.querySelectorAll('[data-cal-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-cal-period');
        if (m !== 'day' && m !== 'week' && m !== 'month') return;
        schedulePeriodMode = m;
        var a = scheduleAddTargetDate || todayIso();
        if (schedulePeriodMode !== 'month') {
          scheduleGridMonth = a.slice(0, 7) + '-01';
        }
        snapScheduleRangeToPeriodMode(a);
        renderSchedule();
      });
    });

    var monthGrid = el.querySelector('#calMonthGrid');
    if (monthGrid) {
      monthGrid.addEventListener('pointerdown', function (e) {
        var btn = e.target.closest('.cal-m-day[data-cal-cell-day]');
        if (!btn) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        ensureCalDragDocumentListeners();
        var iso = btn.getAttribute('data-cal-cell-day');
        calDragState.active = true;
        calDragState.anchorIso = iso;
        calDragState.hoverIso = iso;
        calMonthGridApplyPreview(el, iso, iso);
      });
    }

    el.querySelectorAll('[data-cal-booking]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleBookingComplete(btn.getAttribute('data-cal-booking'));
      });
    });
    el.querySelectorAll('[data-cal-goto-post]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var pid = btn.getAttribute('data-cal-goto-post');
        if (!pid) return;
        selectedPostId = pid;
        setTab('posts');
        renderPosts();
        renderHome();
      });
    });
    el.querySelectorAll('[data-cal-stask]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var parts = btn.getAttribute('data-cal-stask').split('|');
        if (parts.length >= 2) toggleSessionTask(parts[0], parts[1]);
      });
    });
    el.querySelectorAll('[data-cal-recurring]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-cal-recurring');
        var d = btn.getAttribute('data-cal-recurring-day') || todayIso();
        if (id) toggleRecurringDoneOnDate(id, d);
      });
    });
  }

  // === 投稿ワークフロー + ガントチャート ===

  function postsForStudent(studentId) {
    return (db.posts || [])
      .filter(function (p) { return p.studentUserId === studentId; })
      .sort(function (a, b) { return (a.targetDate || '9999').localeCompare(b.targetDate || '9999'); });
  }

  function findBookingByLinkedPostId(postId) {
    return (db.bookings || []).find(function (b) {
      return b.bookingType === 'schedule' && b.linkedPostId === postId;
    });
  }

  /** 投稿の「投稿予定日」とスケジュールの予定を同期（skipSave で連続更新時は最後に saveDb）。予定日と工程の targetDate を揃え、カレンダー「投稿予定」と1対1で連動。 */
  function setPostPlannedPublishDate(postId, isoDate, skipSave) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || post.studentUserId !== sessionUser.id) return;
    post.plannedPublishDate = isoDate ? isoDate : '';
    if (isoDate) {
      post.targetDate = isoDate;
    } else if (post.startDate) {
      var td = addDaysToIsoDate(post.startDate, totalPaceDays());
      if (td) post.targetDate = td;
    }
    var existing = findBookingByLinkedPostId(postId);
    if (!isoDate) {
      if (existing) {
        db.bookings = db.bookings.filter(function (b) { return b.id !== existing.id; });
      }
    } else {
      if (existing) {
        existing.date = isoDate;
        existing.category = '投稿予定';
        existing.linkedPostId = postId;
      } else {
        db.bookings.push({
          id: uid('booking'),
          studentUserId: post.studentUserId,
          category: '投稿予定',
          date: isoDate,
          bookingType: 'schedule',
          linkedPostId: postId,
          completed: false,
          completedAt: '',
          coachingSessionNum: null,
          linkedSessionId: '',
          createdAt: new Date().toISOString(),
        });
      }
    }
    if (!skipSave) saveDb();
  }

  /** 今日〜最終日（両端含む）に n 件をおおよそ均等に割り振る日付（ISO） */
  function distributePlannedDatesInclusive(startIso, endIso, n) {
    if (!startIso || !endIso || n < 1) return [];
    if (endIso < startIso) return [];
    var span = daysDiffIso(startIso, endIso);
    if (n === 1) return [addDaysToIsoDate(startIso, Math.floor(span / 2))];
    var out = [];
    for (var i = 0; i < n; i++) {
      var off = Math.round((i / (n - 1)) * span);
      out.push(addDaysToIsoDate(startIso, off));
    }
    return out;
  }

  function postCompletionLatestDate(post) {
    var latestDone = '';
    POST_STEPS.forEach(function (s) {
      if (post.steps[s.key] && post.steps[s.key].doneDate) {
        if (!latestDone || post.steps[s.key].doneDate > latestDone) latestDone = post.steps[s.key].doneDate;
      }
    });
    (post.customSteps || []).forEach(function (cs) {
      if (cs.doneDate && (!latestDone || cs.doneDate > latestDone)) latestDone = cs.doneDate;
    });
    return latestDone || '';
  }

  function bulkCreatePostsForTaskBoundary(taskId) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var t = db.tasks.find(function (x) { return x.id === taskId; });
    if (!t || t.studentUserId !== sessionUser.id) return;
    var boundary = getNextSessionBoundaryDateForStudent(sessionUser.id);
    if (!boundary) {
      alert('ロードマップのセッションカード「次回まで」に次回の日時を入れるか、未来のセッション実施日を設定してください。');
      return;
    }
    var need = Math.max(0, (t.targetNumber || 0) - (t.currentNumber || 0));
    if (need < 1) {
      alert('投稿作成の残り件数がありません（目標に達しています）。');
      return;
    }
    bulkCreatePostsUntilSession(boundary, need);
  }

  /** @returns {string} エラーメッセージ、問題なければ空 */
  function validateBulkPostsUntilSessionParams(sessionDateIso, count) {
    var n = parseInt(count, 10);
    if (!sessionDateIso || isNaN(n) || n < 1) {
      return 'セッション日と投稿数（1以上）を入力してください。';
    }
    var t = todayIso();
    if (sessionDateIso <= t) {
      return 'セッション日は今日より後の日付にしてください。';
    }
    var endDay = addDaysToIsoDate(sessionDateIso, -1);
    if (!endDay || endDay < t) {
      return 'セッション前に投稿を割り当てる日がありません。';
    }
    var dates = distributePlannedDatesInclusive(t, endDay, n);
    if (dates.length !== n) {
      return '日付の割り当てに失敗しました。期間を長くするか、投稿数を減らしてください。';
    }
    return '';
  }

  /** options.stayOnCurrentTab が true のとき投稿タブへ切り替えず renderAll のみ */
  function bulkCreatePostsUntilSession(sessionDateIso, count, options) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var err = validateBulkPostsUntilSessionParams(sessionDateIso, count);
    if (err) {
      alert(err);
      return;
    }
    var n = parseInt(count, 10);
    var t = todayIso();
    var endDay = addDaysToIsoDate(sessionDateIso, -1);
    var dates = distributePlannedDatesInclusive(t, endDay, n);
    var pace = totalPaceDays();
    var lastId = '';
    for (var i = 0; i < dates.length; i++) {
      var planDate = dates[i];
      var start = addDaysToIsoDate(planDate, -pace);
      if (!start || start < t) start = t;
      var post = createNewPostRaw(sessionUser.id, start);
      post.targetDate = planDate;
      post.plannedPublishDate = planDate;
      setPostPlannedPublishDate(post.id, planDate, true);
      lastId = post.id;
    }
    saveDb();
    if (lastId) selectedPostId = lastId;
    if (options && options.stayOnCurrentTab) {
      renderAll();
    } else {
      setTab('posts');
    }
  }

  function createNewPostRaw(studentId, startDate) {
    var existing = postsForStudent(studentId);
    var num = existing.length + 1;
    var steps = {};
    POST_STEPS.forEach(function (s) {
      steps[s.key] = { done: false, doneDate: '' };
    });
    var s = startDate || todayIso();
    var post = {
      id: uid('post'),
      studentUserId: studentId,
      title: '投稿 #' + num,
      startDate: s,
      targetDate: addDaysToIsoDate(s, totalPaceDays()),
      steps: steps,
      customSteps: [],
      plannedPublishDate: '',
      recordedToCalendar: false,
      workflowCompletedAt: '',
      createdAt: new Date().toISOString(),
    };
    db.posts.push(post);
    return post;
  }

  function createNewPost(studentId, startDate) {
    var p = createNewPostRaw(studentId, startDate);
    saveDb();
    return p;
  }

  function togglePostStep(postId, stepKey) {
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || post.studentUserId !== sessionUser.id) return;

    var prevPct = postProgress(post).pct;

    var customStep = (post.customSteps || []).find(function (cs) { return cs.key === stepKey; });
    if (customStep) {
      customStep.done = !customStep.done;
      customStep.doneDate = customStep.done ? todayIso() : '';
      syncPostWorkflowCompletion(post, prevPct);
      saveDb();
      syncSessionPostSlotChecksFromWorkflow(post.studentUserId);
      renderPosts();
      renderRoadmap();
      renderHome();
      return;
    }

    var step = post.steps[stepKey];
    if (!step) return;
    step.done = !step.done;
    step.doneDate = step.done ? todayIso() : '';

    if (step.done && phaseProgress(post, 3).complete) {
      POST_STEPS.forEach(function (s) {
        if (s.phase < 3 && post.steps[s.key] && !post.steps[s.key].done) {
          post.steps[s.key].done = true;
          if (!post.steps[s.key].doneDate) post.steps[s.key].doneDate = todayIso();
        }
      });
    }

    syncPostWorkflowCompletion(post, prevPct);
    saveDb();
    syncSessionPostSlotChecksFromWorkflow(post.studentUserId);
    renderPosts();
    renderRoadmap();
    renderHome();
  }

  function postProgress(post) {
    var done = 0;
    var customs = post.customSteps || [];
    var total = POST_STEPS.length + customs.length;
    POST_STEPS.forEach(function (s) {
      if (post.steps[s.key] && post.steps[s.key].done) done++;
    });
    customs.forEach(function (cs) { if (cs.done) done++; });
    return { done: done, total: total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  /** ワークフロー100%になったタイミングの日付（マッピング・記録用）。予定日とは独立。 */
  function syncPostWorkflowCompletion(post, prevPct) {
    var pp = postProgress(post);
    if (pp.pct >= 100) {
      if (prevPct === undefined || prevPct < 100) {
        post.workflowCompletedAt = todayIso();
      }
    } else {
      post.workflowCompletedAt = '';
    }
  }

  function postWorkflowCompletedDateIso(post) {
    var w = String(post.workflowCompletedAt || '').trim().slice(0, 10);
    if (w) return w;
    return postCompletionLatestDate(post);
  }

  function phaseProgress(post, phase) {
    var steps = POST_STEPS.filter(function (s) { return s.phase === phase; });
    var done = 0;
    steps.forEach(function (s) {
      if (post.steps[s.key] && post.steps[s.key].done) done++;
    });
    return { done: done, total: steps.length, complete: done === steps.length && steps.length > 0 };
  }

  function phaseDeadline(stepDates, phase) {
    var last = '';
    var first = '';
    stepDates.forEach(function (s) {
      if (s.phase === phase) {
        if (!first) first = s.startDate;
        last = s.endDate;
      }
    });
    return { start: first, end: last };
  }

  function completePhase(postId, phase) {
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || post.studentUserId !== sessionUser.id) return;
    var prevPct = postProgress(post).pct;
    POST_STEPS.forEach(function (s) {
      if (s.phase === phase && post.steps[s.key]) {
        post.steps[s.key].done = true;
        if (!post.steps[s.key].doneDate) post.steps[s.key].doneDate = todayIso();
      }
    });
    syncPostWorkflowCompletion(post, prevPct);
    saveDb();
    syncSessionPostSlotChecksFromWorkflow(post.studentUserId);
    renderPosts();
    renderRoadmap();
    renderHome();
  }

  function currentPostStep(post) {
    for (var i = 0; i < POST_STEPS.length; i++) {
      var s = POST_STEPS[i];
      if (!post.steps[s.key] || !post.steps[s.key].done) return s;
    }
    var customs = post.customSteps || [];
    for (var j = 0; j < customs.length; j++) {
      if (!customs[j].done) return customs[j];
    }
    return null;
  }

  function getPostPace() {
    if (!sessionUser) return {};
    ensureProfile(sessionUser);
    return sessionUser.profile.postPace || {};
  }

  function totalPaceDays() {
    var pace = getPostPace();
    var total = 0;
    POST_STEPS.forEach(function (s) { total += (pace[s.key] || 1); });
    return total;
  }

  function computeStepDates(post) {
    var pace = getPostPace();
    var results = [];
    var dayOffset = 0;
    var totalDays = 0;
    POST_STEPS.forEach(function (s) { totalDays += (pace[s.key] || 1); });
    if (totalDays < 1) totalDays = 1;

    POST_STEPS.forEach(function (s) {
      var days = pace[s.key] || 1;
      var stepStart = addDaysToIsoDate(post.startDate, dayOffset);
      dayOffset += days;
      var stepEnd = addDaysToIsoDate(post.startDate, dayOffset);
      results.push({
        key: s.key,
        label: s.label,
        phase: s.phase,
        startDate: stepStart,
        endDate: stepEnd,
        days: days,
        dayOffset: dayOffset - days,
        totalDays: totalDays,
        done: post.steps[s.key] ? post.steps[s.key].done : false,
      });
    });
    return results;
  }

  function stepRemainingText(endDate, done) {
    if (done) return '';
    var d = daysUntil(endDate);
    if (d === null) return '';
    if (d < 0) return '期限超過';
    if (d === 0) return '今日';
    return 'あと' + d + '日';
  }

  function phaseBarHtml(post, phase) {
    var pp = phaseProgress(post, phase);
    var pct = pp.total > 0 ? Math.round((pp.done / pp.total) * 100) : 0;
    var fillClass = 'gantt-phase-bar-fill phase' + phase + '-fill' + (pp.complete ? ' bar-complete' : '');
    return '<div class="gantt-phase-bar-row">' +
      '<div class="gantt-phase-bar-track"><div class="' + fillClass + '" style="width:' + pct + '%"></div></div>' +
      '<span class="gantt-phase-bar-pct">' + pct + '%</span></div>';
  }

  function postGanttCardHtml(post) {
    var prog = postProgress(post);
    var stepDates = computeStepDates(post);
    var cur = currentPostStep(post);
    var postNum = postsForStudent(post.studentUserId).indexOf(post) + 1;
    var safeId = post.id.replace(/[^a-zA-Z0-9_-]/g, '');

    var html = '<div class="card gantt-card">';
    html += '<div class="gantt-header">';
    if (editingPostId === post.id) {
      html += '<div class="gantt-title-edit">';
      html += '<span class="gantt-post-num">#' + postNum + '</span>';
      html += '<input type="text" id="editPostTitleInput_' + safeId + '" class="gantt-title-input" value="' + escapeHtml(post.title) + '" maxlength="40" />';
      html += '<button type="button" class="gantt-title-save-btn" data-save-post-title="' + post.id + '">保存</button>';
      html += '<button type="button" class="gantt-title-cancel-btn" data-cancel-edit-title="' + post.id + '">×</button>';
      html += '</div>';
    } else {
      html += '<div class="gantt-title-row">';
      html += '<span class="gantt-post-num">#' + postNum + '</span>';
      html += '<span class="gantt-title">' + escapeHtml(post.title) + '</span>';
      html +=
        '<button type="button" class="gantt-title-edit-btn" data-edit-post-title="' +
        escapeHtml(post.id) +
        '" aria-label="タイトルを編集">✎</button>';
      html += '</div>';
    }
    html += '<div class="gantt-meta">' + shortDate(post.startDate) + ' → ' + shortDate(post.targetDate) + '</div>';
    html += '</div>';

    html += '<div class="gantt-dates-2col">';
    html += '<div class="gantt-date-col">';
    html +=
      '<label class="label gantt-date-col-label" for="ganttPlan_' +
      safeId +
      '">予定日</label>';
    html +=
      '<input type="date" id="ganttPlan_' +
      safeId +
      '" class="input post-plan-date-input" data-post-plan-date="' +
      escapeHtml(post.id) +
      '" value="' +
      escapeHtml(post.plannedPublishDate || '') +
      '" />';
    html += '</div>';
    html +=
      '<div class="gantt-date-col gantt-date-col--done' +
      (prog.pct >= 100 ? '' : ' gantt-date-col--done-locked') +
      '">';
    html +=
      '<label class="label gantt-date-col-label" for="ganttDone_' +
      safeId +
      '">完了日</label>';
    if (prog.pct >= 100) {
      var wfd = String(post.workflowCompletedAt || '').trim().slice(0, 10);
      if (!wfd) wfd = todayIso();
      html +=
        '<input type="date" id="ganttDone_' +
        safeId +
        '" class="input" data-post-workflow-date="' +
        escapeHtml(post.id) +
        '" value="' +
        escapeHtml(wfd) +
        '" />';
    } else {
      html +=
        '<input type="date" id="ganttDone_' +
        safeId +
        '" class="input" disabled value="" title="工程をすべて完了すると、マッピング用の完了日をここで選べます" />';
    }
    html += '</div>';
    html += '</div>';

    html += '<div class="gantt-progress-row"><div class="gantt-progress-bar"><div class="gantt-progress-fill' + (prog.pct >= 100 ? ' complete' : '') + '" style="width:' + prog.pct + '%"></div></div><span class="gantt-pct">' + prog.pct + '%</span></div>';

    var openPhase = 0;
    stepDates.forEach(function (s) {
      if (s.phase !== openPhase) {
        if (openPhase !== 0) html += '</div>';
        openPhase = s.phase;
        var pp = phaseProgress(post, s.phase);
        var pd = phaseDeadline(stepDates, s.phase);
        var phaseClass = 'gantt-phase-block' + (pp.complete ? ' phase-complete' : '');

        html += '<div class="' + phaseClass + '">';
        html += '<div class="gantt-phase-head">';
        html += '<div class="gantt-phase-head-left">';
        html += '<div class="gantt-phase-label">' + PHASE_LABELS[s.phase] + '</div>';
        html += '<div class="gantt-phase-deadline">' + dueText(pd.end) + '</div>';
        html += '</div>';
        if (pp.complete) {
          html += '<span class="gantt-phase-done-badge">完了</span>';
        } else {
          html += '<button type="button" class="gantt-phase-complete-btn" data-complete-phase="' + post.id + '|' + s.phase + '">完了にする</button>';
        }
        html += '</div>';
        html += phaseBarHtml(post, s.phase);
      }

      var isCurrent = cur && cur.key === s.key;
      var rowClass = 'gantt-step-row' + (s.done ? ' step-done' : '') + (isCurrent ? ' step-current' : '');
      var icon = s.done ? '✓' : (isCurrent ? '●' : '○');
      var iconClass = 'gantt-step-icon' + (s.done ? ' done' : '') + (isCurrent ? ' current' : '');
      var remaining = stepRemainingText(s.endDate, s.done);

      html += '<div class="' + rowClass + '">';
      html += '<button type="button" class="' + iconClass + '" data-toggle-step="' + post.id + '|' + s.key + '">' + icon + '</button>';
      html += '<div class="gantt-step-info">';
      html += '<span class="gantt-step-name">' + escapeHtml(s.label) + '</span>';
      if (remaining) {
        var overdue = daysUntil(s.endDate) !== null && daysUntil(s.endDate) < 0;
        html += '<span class="step-days' + (overdue ? ' overdue' : '') + '">' + remaining + '</span>';
      }
      html += '</div>';
      html += '</div>';
    });
    if (openPhase !== 0) html += '</div>';

    var customs = post.customSteps || [];
    if (customs.length > 0) {
      var customDone = 0;
      customs.forEach(function (cs) { if (cs.done) customDone++; });
      var customAll = customs.length;
      var customPct = Math.round((customDone / customAll) * 100);
      var customComplete = customDone === customAll;
      var customBlockClass = 'gantt-phase-block gantt-custom-phase' + (customComplete ? ' phase-complete' : '');

      html += '<div class="' + customBlockClass + '">';
      html += '<div class="gantt-phase-head">';
      html += '<div class="gantt-phase-head-left">';
      html += '<div class="gantt-phase-label">追加プロセス</div>';
      html += '</div>';
      if (customComplete) {
        html += '<span class="gantt-phase-done-badge">完了</span>';
      } else {
        html += '<span class="gantt-phase-bar-pct" style="font-size:0.7rem;">' + customDone + '/' + customAll + '</span>';
      }
      html += '</div>';

      var customBarFill = 'gantt-phase-bar-fill custom-phase-fill' + (customComplete ? ' bar-complete' : '');
      html += '<div class="gantt-phase-bar-row">';
      html += '<div class="gantt-phase-bar-track"><div class="' + customBarFill + '" style="width:' + customPct + '%"></div></div>';
      html += '<span class="gantt-phase-bar-pct">' + customPct + '%</span>';
      html += '</div>';

      customs.forEach(function (cs) {
        var isCurrent = cur && cur.key === cs.key;
        var rowClass = 'gantt-step-row gantt-custom-step-row' + (cs.done ? ' step-done' : '') + (isCurrent ? ' step-current' : '');
        var icon = cs.done ? '✓' : (isCurrent ? '●' : '○');
        var iconClass = 'gantt-step-icon' + (cs.done ? ' done' : '') + (isCurrent ? ' current' : '');
        html += '<div class="' + rowClass + '">';
        html += '<button type="button" class="' + iconClass + '" data-toggle-step="' + post.id + '|' + cs.key + '">' + icon + '</button>';
        html += '<div class="gantt-step-info">';
        html += '<span class="gantt-step-name">' + escapeHtml(cs.label) + '</span>';
        html += '</div>';
        html += '<button type="button" class="gantt-custom-step-del" data-del-custom-post="' + escapeHtml(post.id) + '" data-del-custom-key="' + escapeHtml(cs.key) + '" title="このステップを削除" aria-label="削除">✕</button>';
        html += '</div>';
      });
      html += '</div>';
    }

    if (addingStepToPostId === post.id) {
      html += '<div class="custom-step-add-form">';
      html += '<label class="label" for="customStepInput" style="margin-bottom:6px;">新しいプロセス</label>';
      html += '<input type="text" id="customStepInput" class="input" placeholder="例：講師に確認" maxlength="50" autofocus />';
      html += '<p class="custom-step-add-hint">内容を確認して「送信」で追加します</p>';
      html += '<div class="custom-step-add-actions">';
      html += '<button type="button" class="btn btn-primary btn-small" data-confirm-add-step="' + post.id + '">送信</button>';
      html += '<button type="button" class="btn btn-secondary btn-small" data-cancel-add-step="' + post.id + '">キャンセル</button>';
      html += '</div>';
      html += '</div>';
    } else {
      html += '<button type="button" class="gantt-add-step-btn" data-add-step="' + post.id + '">＋ プロセスを追加</button>';
    }

    html += '</div>';
    return html;
  }

  var editingPostId = null;
  var selectedPostId = null;
  var addingStepToPostId = null;
  /** 投稿タブ「月間の予定・完了」グリッドの表示月 YYYY-MM-01 */
  var postsHeatmapMonth = null;
  /** renderPosts 後にマッピングの日別シートを同じ日で開き直す（日付修正の連続操作用） */
  var postHeatmapSheetReopenIso = null;
  /** Esc でシートを閉じるリスナー（重複登録防止用・1本だけ） */
  var postHeatmapEscListener = null;
  var postHeatmapCloseSheetFn = null;

  /** 紫「予定」ドット・件数に含めるか（完了済みは予定を満たした扱いでポチを消す） */
  function postCountsAsHeatmapPlanned(p) {
    if (!p || p.recordedToCalendar) return false;
    if (!p.plannedPublishDate || !String(p.plannedPublishDate).trim()) return false;
    return postProgress(p).pct < 100;
  }

  /** 未完了かつ予定日ありの投稿について、今日基準のペース表示 */
  function computePostHeatmapPaceBanner(studentId) {
    var t = todayIso();
    var pending = [];
    postsForStudent(studentId).forEach(function (p) {
      if (!postCountsAsHeatmapPlanned(p)) return;
      var plan = String(p.plannedPublishDate || '').trim().slice(0, 10);
      if (!plan) return;
      pending.push({ plan: plan });
    });
    pending.sort(function (a, b) {
      return a.plan.localeCompare(b.plan);
    });
    if (pending.length === 0) {
      return {
        cls: 'ph-pace--none',
        title: '予定日付きの未完了投稿はありません',
        sub: '投稿に予定日を入れると、目標に対して遅れ・余裕がここに出ます。',
      };
    }
    var overdue = pending.filter(function (x) {
      return x.plan < t;
    });
    var todayHits = pending.filter(function (x) {
      return x.plan === t;
    });
    if (overdue.length > 0) {
      return {
        cls: 'ph-pace--late',
        title: '目標日を過ぎた未完了が ' + overdue.length + ' 件あります（要フォロー）',
        sub: '投稿タブで工程を進めるか、予定日を見直してください。',
      };
    }
    if (todayHits.length > 0) {
      return {
        cls: 'ph-pace--today',
        title: '今日が目標日の投稿が ' + todayHits.length + ' 件あります',
        sub: '',
      };
    }
    var next = pending[0];
    var until = daysDiffIso(t, next.plan);
    return {
      cls: 'ph-pace--ahead',
      title: '次の目標日まで余裕があります（まだ遅れていません）',
      sub: '次の目標：' + shortDate(next.plan) + '（あと ' + until + ' 日）',
    };
  }

  /** 指定日にマッピングに載る投稿（予定日／完了日）。予定は未完了のみ */
  function getHeatmapDayPostBreakdown(studentId, dayIso) {
    var d = String(dayIso || '').trim().slice(0, 10);
    if (!d) return [];
    var all = postsForStudent(studentId);
    var map = {};
    function touch(p, idx, tag) {
      var id = p.id;
      if (!map[id]) {
        var num = idx + 1;
        map[id] = {
          id: id,
          num: num,
          title: String(p.title || '投稿 #' + num).trim() || '投稿 #' + num,
          tags: [],
          plannedPublishDate: String(p.plannedPublishDate || '').trim().slice(0, 10),
          doneDateIso: String(postWorkflowCompletedDateIso(p) || '').trim().slice(0, 10),
        };
      }
      if (map[id].tags.indexOf(tag) < 0) map[id].tags.push(tag);
      map[id].plannedPublishDate = String(p.plannedPublishDate || '').trim().slice(0, 10);
      map[id].doneDateIso = String(postWorkflowCompletedDateIso(p) || '').trim().slice(0, 10);
    }
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (postCountsAsHeatmapPlanned(p) && String(p.plannedPublishDate).slice(0, 10) === d) {
        touch(p, i, 'plan');
      }
      if (postProgress(p).pct >= 100) {
        var cd = postWorkflowCompletedDateIso(p);
        if (cd && cd.slice(0, 10) === d) {
          touch(p, i, 'done');
        }
      }
    }
    return Object.keys(map).map(function (k) {
      return map[k];
    });
  }

  function renderPostsMonthHeatmapHtml(studentId, monthFirst) {
    if (!monthFirst) return '';
    var ym = monthFirst.slice(0, 7);
    var firstCell = addDaysToIsoDate(monthFirst, -new Date(monthFirst + 'T12:00:00').getDay());
    if (!firstCell) firstCell = monthFirst;

    var stuHeat = getUserById(studentId);
    var consultStartIso = stuHeat ? String(programStartDateOf(stuHeat)).slice(0, 10) : '';
    var consultGradIso = stuHeat ? String(graduationDateOf(stuHeat) || '').slice(0, 10) : '';

    var plannedByDay = {};
    var doneByDay = {};
    postsForStudent(studentId).forEach(function (p) {
      if (postCountsAsHeatmapPlanned(p) && p.plannedPublishDate.slice(0, 7) === ym) {
        var k = p.plannedPublishDate;
        plannedByDay[k] = (plannedByDay[k] || 0) + 1;
      }
      if (postProgress(p).pct >= 100) {
        var cd = postWorkflowCompletedDateIso(p);
        if (cd && cd.slice(0, 7) === ym) {
          doneByDay[cd] = (doneByDay[cd] || 0) + 1;
        }
      }
    });

    var monthPlanTotal = 0;
    var monthDoneTotal = 0;
    Object.keys(plannedByDay).forEach(function (k) {
      if (k.slice(0, 7) === ym) monthPlanTotal += plannedByDay[k];
    });
    Object.keys(doneByDay).forEach(function (k) {
      if (k.slice(0, 7) === ym) monthDoneTotal += doneByDay[k];
    });
    var lifeDone = completedPostCountForStudent(studentId);

    var freqTargetTotal = 0;
    getCoachingSessions(studentId).forEach(function (s) {
      freqTargetTotal += Math.max(0, Math.min(52, parseInt(s.postSlotsTarget, 10) || 0));
    });

    var pace = computePostHeatmapPaceBanner(studentId);

    var html = '<div class="card post-heatmap-card post-heatmap-card--overview">';
    html += '<div class="post-heatmap-head">';
    html += '<p class="card-title post-heatmap-title">投稿マッピング</p>';
    html += '<div class="post-heatmap-nav">';
    html += '<button type="button" class="post-heatmap-nav-btn" data-post-heat-prev aria-label="前の月">‹</button>';
    html += '<span class="post-heatmap-month">' + escapeHtml(monthYearJaHeader(monthFirst)) + '</span>';
    html += '<button type="button" class="post-heatmap-nav-btn" data-post-heat-next aria-label="次の月">›</button>';
    html += '<button type="button" class="post-heatmap-today-btn" data-post-heat-today>今月</button>';
    html += '</div></div>';
    html += '<div class="post-heatmap-month-stats">';
    html += '<div class="ph-month-stat-row ph-month-stat-row--freq"><span class="ph-month-label">予定投稿頻度</span>';
    html += '<span class="ph-month-val">ロードマップ目標の合計 <strong>' + freqTargetTotal + '</strong> 本</span>';
    html += '<span class="ph-month-sep">·</span>';
    html += '<span class="ph-month-val ph-month-val--plan">今月・未完了の予定 <strong>' + monthPlanTotal + '</strong> 本</span></div>';
    html += '<div class="ph-month-stat-row"><span class="ph-month-label">この月</span>';
    html += '<span class="ph-month-val ph-month-val--done">完了 <strong>' + monthDoneTotal + '</strong></span>';
    html += '<span class="ph-month-sep">·</span>';
    html += '<span class="ph-month-val ph-month-val--plan">未完了の予定 <strong>' + monthPlanTotal + '</strong></span></div>';
    html += '<div class="ph-month-stat-row ph-month-stat-row--sub"><span class="ph-month-label">累計完了</span>';
    html += '<span class="ph-month-val"><strong>' + lifeDone + '</strong>（ホームの投稿カウントと同じ）</span></div>';
    html += '</div>';
    html += '<div class="ph-pace-banner ' + pace.cls + '">';
    html += '<p class="ph-pace-title">' + escapeHtml(pace.title) + '</p>';
    if (pace.sub) html += '<p class="ph-pace-sub">' + escapeHtml(pace.sub) + '</p>';
    html += '</div>';
    html +=
      '<p class="post-heatmap-legend"><span class="ph-leg ph-leg--plan">●</span>予定（<strong>未完了のみ</strong>） <span class="ph-leg ph-leg--done">●</span>完了（1投稿＝1つ）<span class="ph-leg ph-leg--start">始</span>開始 <span class="ph-leg ph-leg--grad">卒</span>卒業<span class="post-heatmap-legend-tap"> · <strong>日付タップ</strong>でタイトル確認・日付修正</span></p>';
    html += '<div class="post-heat-wd-row">';
    DAY_NAMES.forEach(function (dn) {
      html += '<span class="post-heat-wd">' + dn + '</span>';
    });
    html += '</div>';
    html += '<div class="post-heat-grid">';
    for (var row = 0; row < 6; row++) {
      html += '<div class="post-heat-row">';
      for (var col = 0; col < 7; col++) {
        var idx = row * 7 + col;
        var cellIso = addDaysToIsoDate(firstCell, idx);
        if (!cellIso) continue;
        var inMonth = cellIso.slice(0, 7) === ym;
        var pCount = plannedByDay[cellIso] || 0;
        var dCount = doneByDay[cellIso] || 0;
        var msFlags = stuHeat ? consultPeriodDayFlags(stuHeat, cellIso) : { start: false, grad: false };
        var cls = 'post-heat-cell';
        if (!inMonth) cls += ' post-heat-cell--muted';
        if (cellIso === todayIso()) cls += ' post-heat-cell--today';
        if (pCount > 0 || dCount > 0 || msFlags.start || msFlags.grad) cls += ' post-heat-cell--has-data';
        if (msFlags.start) cls += ' post-heat-cell--consult-start';
        if (msFlags.grad) cls += ' post-heat-cell--consult-grad';
        cls += ' post-heat-cell--interactive';
        var tip = shortDate(cellIso);
        if (pCount || dCount) tip += ' · 予定' + pCount + '件・完了' + dCount + '件';
        if (msFlags.start) tip += ' · コンサル開始日';
        if (msFlags.grad) tip += ' · 卒業予定日';
        tip += '（タップで詳細）';
        html += '<div class="' + cls + '" role="button" tabindex="0" data-heat-cell-day="' + escapeHtml(cellIso) + '" title="' + escapeHtml(tip) + '" aria-label="' + escapeHtml(tip) + '">';
        html += '<span class="post-heat-day">' + parseInt(cellIso.slice(8, 10), 10) + '</span>';
        if (msFlags.start || msFlags.grad) {
          html += '<span class="post-heat-ms-pills" aria-hidden="true">';
          if (msFlags.start) html += '<span class="post-heat-ms-pill post-heat-ms-pill--start">始</span>';
          if (msFlags.grad) html += '<span class="post-heat-ms-pill post-heat-ms-pill--grad">卒</span>';
          html += '</span>';
        }
        if (pCount > 0 || dCount > 0) {
          html += '<span class="post-heat-dot-stack post-heat-dot-stack--one-pochi" aria-hidden="true">';
          if (pCount > 0) {
            html += '<span class="post-heat-metric post-heat-metric--plan">';
            html += '<span class="ph-round ph-round--plan"></span>';
            if (pCount > 1) html += '<span class="ph-metric-count">' + pCount + '</span>';
            html += '</span>';
          }
          if (dCount > 0) {
            html += '<span class="post-heat-metric post-heat-metric--done">';
            html += '<span class="ph-round ph-round--done"></span>';
            if (dCount > 1) html += '<span class="ph-metric-count">' + dCount + '</span>';
            html += '</span>';
          }
          html += '</span>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="post-heat-sheet-root" id="postHeatSheetRoot" aria-hidden="true">';
    html += '<div class="post-heat-sheet-backdrop" data-post-heat-sheet-close tabindex="-1"></div>';
    html += '<div class="post-heat-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="postHeatDetailDateLabel">';
    html += '<div class="post-heat-sheet-handle" aria-hidden="true"></div>';
    html += '<div class="post-heat-detail-inner">';
    html += '<div class="post-heat-detail-top">';
    html += '<span class="post-heat-detail-date" id="postHeatDetailDateLabel"></span>';
    html += '<button type="button" class="post-heat-detail-close" data-post-heat-sheet-close aria-label="閉じる">×</button>';
    html += '</div>';
    html += '<div class="post-heat-detail-body" id="postHeatDetailBody"></div>';
    html += '</div></div></div>';
    return html;
  }

  function bindPostHeatmapDayClicks(hostEl, studentId) {
    if (postHeatmapEscListener) {
      document.removeEventListener('keydown', postHeatmapEscListener);
      postHeatmapEscListener = null;
    }
    postHeatmapCloseSheetFn = null;

    var sheetRoot = hostEl.querySelector('#postHeatSheetRoot');
    var dateLabel = hostEl.querySelector('#postHeatDetailDateLabel');
    var bodyEl = hostEl.querySelector('#postHeatDetailBody');
    if (!sheetRoot || !dateLabel || !bodyEl) return;

    var openDayIso = null;

    function closePanel() {
      if (postHeatmapEscListener) {
        document.removeEventListener('keydown', postHeatmapEscListener);
        postHeatmapEscListener = null;
      }
      postHeatmapCloseSheetFn = null;
      openDayIso = null;
      sheetRoot.classList.remove('is-open');
      sheetRoot.setAttribute('aria-hidden', 'true');
      bodyEl.innerHTML = '';
    }

    function openForDay(dayIso) {
      openDayIso = String(dayIso || '').slice(0, 10);
      var stu = getUserById(studentId);
      var ms = stu ? consultPeriodDayFlags(stu, openDayIso) : { start: false, grad: false };
      var items = getHeatmapDayPostBreakdown(studentId, openDayIso);
      var doneItems = items.filter(function (it) {
        return it.tags.indexOf('done') >= 0;
      });
      var planItems = items.filter(function (it) {
        return it.tags.indexOf('plan') >= 0;
      });

      dateLabel.textContent = shortDate(openDayIso);

      var h = '';

      if (ms.start) {
        h +=
          '<div class="ph-sheet-milestone ph-sheet-milestone--start" role="status"><span class="ph-sheet-ms-ico" aria-hidden="true">📌</span><span><strong>コンサル開始日</strong>（マイページのプログラム開始日）</span></div>';
      }
      if (ms.grad) {
        h +=
          '<div class="ph-sheet-milestone ph-sheet-milestone--grad" role="status"><span class="ph-sheet-ms-ico" aria-hidden="true">🎓</span><span><strong>卒業予定日</strong>（開始から210日後）</span></div>';
      }

      h += '<div class="ph-sheet-section">';
      h += '<h3 class="ph-sheet-h3">投稿完了</h3>';
      if (doneItems.length === 0) {
        h += '<p class="ph-sheet-none">投稿なし</p>';
      } else {
        h += '<ul class="ph-sheet-ul">';
        doneItems.forEach(function (it) {
          var wfd = it.doneDateIso || openDayIso;
          h += '<li class="ph-sheet-li ph-sheet-li--card">';
          h += '<p class="ph-sheet-post-kicker">' + it.num + '投稿目・完了</p>';
          h += '<p class="ph-sheet-post-title">' + escapeHtml(it.title) + '</p>';
          h += '<div class="ph-sheet-date-field">';
          h +=
            '<input type="date" id="heatDone_' +
            escapeHtml(it.id) +
            '" class="input ph-sheet-date-input" data-heat-done-date="' +
            escapeHtml(it.id) +
            '" value="' +
            escapeHtml(wfd) +
            '" aria-label="完了日" />';
          h += '</div>';
          h += '</li>';
        });
        h += '</ul>';
      }
      h += '</div>';

      h += '<div class="ph-sheet-section">';
      h += '<h3 class="ph-sheet-h3">投稿予定</h3>';
      if (planItems.length === 0) {
        h += '<p class="ph-sheet-none">投稿なし</p>';
      } else {
        h += '<ul class="ph-sheet-ul">';
        planItems.forEach(function (it) {
          var pd = it.plannedPublishDate || openDayIso;
          h += '<li class="ph-sheet-li ph-sheet-li--card">';
          h += '<p class="ph-sheet-post-kicker">' + it.num + '投稿目・予定</p>';
          h += '<p class="ph-sheet-post-title">' + escapeHtml(it.title) + '</p>';
          h += '<div class="ph-sheet-date-field">';
          h +=
            '<input type="date" id="heatPlan_' +
            escapeHtml(it.id) +
            '" class="input ph-sheet-date-input" data-heat-plan-date="' +
            escapeHtml(it.id) +
            '" value="' +
            escapeHtml(pd) +
            '" aria-label="予定日" />';
          h += '</div>';
          h += '</li>';
        });
        h += '</ul>';
      }
      h += '</div>';

      bodyEl.innerHTML = h;
      sheetRoot.classList.add('is-open');
      sheetRoot.setAttribute('aria-hidden', 'false');
      if (postHeatmapEscListener) {
        document.removeEventListener('keydown', postHeatmapEscListener);
        postHeatmapEscListener = null;
      }
      postHeatmapCloseSheetFn = closePanel;
      postHeatmapEscListener = function (e) {
        if (e.key !== 'Escape') return;
        if (postHeatmapCloseSheetFn) postHeatmapCloseSheetFn();
      };
      document.addEventListener('keydown', postHeatmapEscListener);
    }

    sheetRoot.querySelectorAll('[data-post-heat-sheet-close]').forEach(function (node) {
      node.addEventListener('click', function (e) {
        e.preventDefault();
        closePanel();
      });
    });

    hostEl.querySelectorAll('[data-heat-cell-day]').forEach(function (cell) {
      function activate() {
        var day = cell.getAttribute('data-heat-cell-day');
        if (!day) return;
        openForDay(day);
      }
      cell.addEventListener('click', function (e) {
        if (e.target.closest('#postHeatSheetRoot')) return;
        activate();
      });
      cell.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        activate();
      });
    });

    bodyEl.addEventListener('change', function (e) {
      var inp = e.target;
      if (!inp || inp.tagName !== 'INPUT' || inp.type !== 'date') return;
      var dayKeep = openDayIso;
      var planId = inp.getAttribute('data-heat-plan-date');
      var doneId = inp.getAttribute('data-heat-done-date');
      if (planId) {
        var vPlan = String(inp.value || '').trim().slice(0, 10);
        setPostPlannedPublishDate(planId, vPlan);
        syncSessionPostSlotChecksFromWorkflow(sessionUser.id);
        postHeatmapSheetReopenIso = dayKeep;
        renderPosts();
        renderSchedule();
        renderHome();
        renderRoadmap();
        return;
      }
      if (doneId) {
        var postD = db.posts.find(function (p) {
          return p.id === doneId;
        });
        if (!postD || !sessionUser || postD.studentUserId !== sessionUser.id) return;
        if (postProgress(postD).pct < 100) return;
        var vDone = String(inp.value || '').trim().slice(0, 10);
        postD.workflowCompletedAt = vDone || todayIso();
        saveDb();
        postHeatmapSheetReopenIso = dayKeep;
        renderPosts();
        renderSchedule();
        renderHome();
        renderRoadmap();
      }
    });

    if (postHeatmapSheetReopenIso) {
      var reopen = postHeatmapSheetReopenIso;
      postHeatmapSheetReopenIso = null;
      requestAnimationFrame(function () {
        openForDay(reopen);
      });
    }
  }

  function addCustomStep(postId, label) {
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || post.studentUserId !== sessionUser.id) return;
    if (!post.customSteps) post.customSteps = [];
    var prevPct = postProgress(post).pct;
    post.customSteps.push({
      key: uid('cs'),
      label: label,
      done: false,
      doneDate: '',
    });
    syncPostWorkflowCompletion(post, prevPct);
    saveDb();
    syncSessionPostSlotChecksFromWorkflow(post.studentUserId);
    addingStepToPostId = null;
    renderPosts();
    renderRoadmap();
    renderHome();
  }

  function removeCustomStep(postId, stepKey) {
    var post = db.posts.find(function (p) { return p.id === postId; });
    if (!post || post.studentUserId !== sessionUser.id) return;
    if (!post.customSteps || !post.customSteps.length) return;
    var prevPct = postProgress(post).pct;
    post.customSteps = post.customSteps.filter(function (cs) { return cs.key !== stepKey; });
    syncPostWorkflowCompletion(post, prevPct);
    saveDb();
    renderPosts();
    renderHome();
  }

  function recordCompletedPosts() {
    if (!sessionUser || sessionUser.role !== 'student') return;
    var posts = postsForStudent(sessionUser.id);
    var recorded = 0;
    posts.forEach(function (p, idx) {
      if (postProgress(p).pct >= 100 && !p.recordedToCalendar) {
        setPostPlannedPublishDate(p.id, '', true);
        var completionDate = postWorkflowCompletedDateIso(p) || todayIso();
        var postNum = idx + 1;
        db.bookings.push({
          id: uid('booking'),
          studentUserId: sessionUser.id,
          category: '投稿 #' + postNum + ' 完了',
          date: completionDate,
          bookingType: 'post_log',
          createdAt: new Date().toISOString(),
        });
        p.recordedToCalendar = true;
        recorded++;
      }
    });
    if (recorded > 0) {
      saveDb();
      renderPosts();
      renderSchedule();
      renderHome();
    }
  }

  function renderPosts() {
    var el = document.getElementById('postsContent');
    if (!el) return;
    if (!sessionUser || sessionUser.role !== 'student') {
      el.innerHTML = '<div class="card"><p class="card-title">投稿管理</p><p style="margin:0;color:var(--muted);">生徒アカウントで利用できます。</p></div>';
      return;
    }
    ensureProfile(sessionUser);
    var allPosts = postsForStudent(sessionUser.id);
    var activePosts = allPosts.filter(function (p) { return !p.recordedToCalendar; });
    var html = '';

    var unrecorded = allPosts.filter(function (p) {
      return postProgress(p).pct >= 100 && !p.recordedToCalendar;
    });

    if (!postsHeatmapMonth) postsHeatmapMonth = todayIso().slice(0, 7) + '-01';
    html += renderPostsMonthHeatmapHtml(sessionUser.id, postsHeatmapMonth);

    html += '<div class="card post-add-card">';
    html += '<label class="label" for="newPostPlannedDate" style="margin-bottom:6px;">投稿予定日</label>';
    html += '<div class="post-add-row">';
    html += '<input type="date" id="newPostPlannedDate" class="input" value="' + todayIso() + '" style="flex:1;" />';
    html += '<button type="button" class="btn btn-primary btn-small" id="btnCreatePost">＋ 新しい投稿</button>';
    html += '</div>';
    html += '<p style="margin:6px 0 0;font-size:0.72rem;color:var(--muted);">選んだ日が<strong>投稿予定日</strong>としてカードに入ります。作業開始日は予定日から<strong>' + totalPaceDays() + '日分</strong>さかのぼって自動設定（今日より前にはしません）。日数はマイページの投稿ペースで変更できます。</p>';
    html += '</div>';

    if (activePosts.length === 0) {
      var recorded = allPosts.length - activePosts.length;
      var msg = recorded > 0
        ? '進行中の投稿はありません。<br>' + recorded + '件は記録済みです。'
        : 'まだ投稿がありません。<br>上のボタンから最初の投稿を作成しましょう。';
      html += '<div class="card"><div class="empty-state">' + msg + '</div></div>';
    } else {
      if (!selectedPostId || !activePosts.find(function (p) { return p.id === selectedPostId; })) {
        var firstIncomplete = activePosts.find(function (p) { return postProgress(p).pct < 100; });
        selectedPostId = firstIncomplete ? firstIncomplete.id : activePosts[0].id;
      }
      var selected = activePosts.find(function (p) {
        return p.id === selectedPostId;
      });

      html += '<div class="post-selector-bar">';
      html += '<div class="post-selector post-selector-pills">';
      if (activePosts.length > 1) {
        activePosts.forEach(function (p) {
          var num = allPosts.indexOf(p) + 1;
          var prog = postProgress(p);
          var active = p.id === selectedPostId;
          var done = prog.pct >= 100;
          var cls = 'post-pill' + (active ? ' active' : '') + (done ? ' completed' : '');
          html += '<button type="button" class="' + cls + '" data-select-post="' + p.id + '">#' + num + (done ? ' ✓' : '') + '</button>';
        });
      } else if (selected) {
        var onlyNum = allPosts.indexOf(selected) + 1;
        var onlyDone = postProgress(selected).pct >= 100;
        var onlyCls = 'post-pill post-pill--static' + (onlyDone ? ' completed' : '');
        html += '<span class="' + onlyCls + '">#' + onlyNum + (onlyDone ? ' ✓' : '') + '</span>';
      }
      html += '</div>';
      html += '<div class="post-selector-actions">';
      if (unrecorded.length > 0) {
        html +=
          '<button type="button" class="btn btn-accent btn-record-inline" id="btnRecordPosts">📅 まとめて記録（' +
          unrecorded.length +
          '件）</button>';
      }
      html += '</div>';
      html += '</div>';

      if (selected) html += postGanttCardHtml(selected);
    }

    el.innerHTML = html;

    var createBtn = document.getElementById('btnCreatePost');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var dateEl = document.getElementById('newPostPlannedDate');
        var planned = dateEl ? String(dateEl.value || '').trim().slice(0, 10) : '';
        if (!planned) {
          alert('投稿予定日を選択してください。');
          return;
        }
        var pace = totalPaceDays();
        var workStart = addDaysToIsoDate(planned, -pace);
        var t = todayIso();
        if (!workStart || workStart < t) workStart = t;
        var newPost = createNewPost(sessionUser.id, workStart);
        setPostPlannedPublishDate(newPost.id, planned);
        syncSessionPostSlotChecksFromWorkflow(sessionUser.id);
        selectedPostId = newPost.id;
        renderPosts();
        renderSchedule();
        renderHome();
        renderRoadmap();
      });
    }

    var recordBtn = document.getElementById('btnRecordPosts');
    if (recordBtn) {
      recordBtn.addEventListener('click', recordCompletedPosts);
    }

    var heatPrev = el.querySelector('[data-post-heat-prev]');
    if (heatPrev) {
      heatPrev.addEventListener('click', function () {
        postsHeatmapMonth = addMonthsFirstIso(postsHeatmapMonth, -1);
        renderPosts();
      });
    }
    var heatNext = el.querySelector('[data-post-heat-next]');
    if (heatNext) {
      heatNext.addEventListener('click', function () {
        postsHeatmapMonth = addMonthsFirstIso(postsHeatmapMonth, 1);
        renderPosts();
      });
    }
    var heatToday = el.querySelector('[data-post-heat-today]');
    if (heatToday) {
      heatToday.addEventListener('click', function () {
        postsHeatmapMonth = todayIso().slice(0, 7) + '-01';
        renderPosts();
      });
    }

    bindPostHeatmapDayClicks(el, sessionUser.id);

    el.querySelectorAll('[data-select-post]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedPostId = btn.getAttribute('data-select-post');
        renderPosts();
      });
    });

    bindPostCardEvents(el);
  }

  function bindPostCardEvents(container) {
    container.querySelectorAll('[data-toggle-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-toggle-step').split('|');
        togglePostStep(parts[0], parts[1]);
      });
    });

    container.querySelectorAll('[data-complete-phase]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-complete-phase').split('|');
        completePhase(parts[0], parseInt(parts[1], 10));
      });
    });

    container.querySelectorAll('[data-edit-post-title]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editingPostId = btn.getAttribute('data-edit-post-title');
        renderPosts();
      });
    });

    container.querySelectorAll('[data-save-post-title]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var postId = btn.getAttribute('data-save-post-title');
        var input = container.querySelector('#editPostTitleInput_' + postId.replace(/[^a-zA-Z0-9_-]/g, ''));
        if (!input) return;
        var post = db.posts.find(function (p) { return p.id === postId; });
        if (!post) return;
        var newTitle = input.value.trim();
        if (newTitle) post.title = newTitle;
        editingPostId = null;
        saveDb();
        renderPosts();
        renderHome();
      });
    });

    container.querySelectorAll('[data-cancel-edit-title]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        editingPostId = null;
        renderPosts();
      });
    });

    container.querySelectorAll('[data-add-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addingStepToPostId = btn.getAttribute('data-add-step');
        renderPosts();
        var inp = document.getElementById('customStepInput');
        if (inp) inp.focus();
      });
    });

    container.querySelectorAll('[data-confirm-add-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = document.getElementById('customStepInput');
        if (!inp) return;
        var label = inp.value.trim();
        if (!label) { inp.focus(); return; }
        addCustomStep(btn.getAttribute('data-confirm-add-step'), label);
      });
    });

    container.querySelectorAll('[data-cancel-add-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addingStepToPostId = null;
        renderPosts();
      });
    });

    var customInput = container.querySelector('#customStepInput');
    if (customInput) {
      customInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var label = customInput.value.trim();
          if (!label) return;
          addCustomStep(addingStepToPostId, label);
        }
      });
    }

    container.querySelectorAll('[data-del-custom-post]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var postId = btn.getAttribute('data-del-custom-post');
        var stepKey = btn.getAttribute('data-del-custom-key');
        if (!postId || !stepKey) return;
        if (!confirm('このステップを削除しますか？')) return;
        removeCustomStep(postId, stepKey);
      });
    });

    container.querySelectorAll('input.post-plan-date-input[data-post-plan-date]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var postId = inp.getAttribute('data-post-plan-date');
        if (!postId) return;
        var v = String(inp.value || '').trim();
        setPostPlannedPublishDate(postId, v);
        renderPosts();
        renderSchedule();
        renderHome();
      });
    });

    container.querySelectorAll('[data-post-workflow-date]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var postId = inp.getAttribute('data-post-workflow-date');
        var post = db.posts.find(function (p) { return p.id === postId; });
        if (!post || !sessionUser || post.studentUserId !== sessionUser.id) return;
        if (postProgress(post).pct < 100) return;
        var v = String(inp.value || '').trim().slice(0, 10);
        post.workflowCompletedAt = v || todayIso();
        saveDb();
        renderPosts();
        renderHome();
        renderSchedule();
      });
    });
  }

  var paceEditOpen = false;

  function phaseDays(phaseNum) {
    ensureProfile(sessionUser);
    var pace = sessionUser.profile.postPace;
    var total = 0;
    POST_STEPS.forEach(function (s) { if (s.phase === phaseNum) total += (pace[s.key] || 1); });
    return total;
  }

  function paceSettingsHtml() {
    ensureProfile(sessionUser);
    var pace = sessionUser.profile.postPace;
    var total = totalPaceDays();
    var html = '<div class="card">';
    html += '<div class="pace-header-row">';
    html += '<p class="card-title" style="margin:0;">投稿ペース</p>';
    html += '<button type="button" class="pace-edit-toggle" id="paceToggleBtn">' + (paceEditOpen ? '✕ 閉じる' : '✏️ 編集') + '</button>';
    html += '</div>';

    html += '<div class="pace-summary">';
    html += '<div class="pace-summary-total">1投稿あたり <strong>' + total + '日</strong></div>';
    html += '<div class="pace-summary-phases">';
    PHASES.forEach(function (ph) {
      html += '<span class="pace-summary-chip">フェーズ' + ph + '：' + phaseDays(ph) + '日</span>';
    });
    html += '</div>';
    html += '</div>';

    if (paceEditOpen) {
      html += '<div class="pace-detail">';
      var currentPhase = 0;
      POST_STEPS.forEach(function (s) {
        if (s.phase !== currentPhase) {
          currentPhase = s.phase;
          html += '<div class="pace-phase-label">' + PHASE_LABELS[s.phase] + '</div>';
        }
        var days = pace[s.key] || 1;
        html += '<div class="pace-row">';
        html += '<span class="pace-step-name">' + escapeHtml(s.label) + '</span>';
        html += '<div class="pace-day-control">';
        html += '<button type="button" class="pace-btn" data-pace-minus="' + s.key + '">−</button>';
        html += '<span class="pace-day-value">' + days + '日</span>';
        html += '<button type="button" class="pace-btn" data-pace-plus="' + s.key + '">＋</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function bindPaceButtons(container) {
    ensureProfile(sessionUser);
    var pace = sessionUser.profile.postPace;

    var toggleBtn = container.querySelector('#paceToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        paceEditOpen = !paceEditOpen;
        renderMypage();
      });
    }

    container.querySelectorAll('[data-pace-minus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pace-minus');
        var cur = pace[key] || 1;
        if (cur > 1) {
          pace[key] = cur - 1;
          saveDb();
          renderMypage();
        }
      });
    });
    container.querySelectorAll('[data-pace-plus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-pace-plus');
        var cur = pace[key] || 1;
        if (cur < 14) {
          pace[key] = cur + 1;
          saveDb();
          renderMypage();
        }
      });
    });
  }

  function getRecurringTasks() {
    ensureProfile(sessionUser);
    if (!sessionUser.profile.recurringTasks) {
      sessionUser.profile.recurringTasks = RECURRING_TASKS.map(function (rt) {
        return { id: rt.id, title: rt.title, frequency: rt.frequency, icon: rt.icon, enabled: true };
      });
    }
    return sessionUser.profile.recurringTasks;
  }

  var recurringEditOpen = false;

  function recurringTasksHtml() {
    var tasks = getRecurringTasks();
    var enabled = tasks.filter(function (t) { return t.enabled; });
    var freqLabel = { daily: '毎日', weekly: '毎週', monthly: '毎月' };
    var html = '<div class="card">';
    html += '<div class="pace-header-row">';
    html += '<p class="card-title" style="margin:0;">定期タスク</p>';
    html += '<button type="button" class="pace-edit-toggle" id="recurringToggleBtn">' + (recurringEditOpen ? '✕ 閉じる' : '✏️ 編集') + '</button>';
    html += '</div>';

    if (!recurringEditOpen) {
      if (enabled.length === 0) {
        html += '<p style="margin:8px 0 0;font-size:0.85rem;color:var(--muted);">定期タスクなし</p>';
      } else {
        enabled.forEach(function (t) {
          html += '<div class="rm-recurring">';
          html += '<span class="rm-recurring-icon">' + t.icon + '</span>';
          html += '<span class="rm-recurring-title">' + escapeHtml(t.title) + '</span>';
          html += '<span class="rm-recurring-freq">' + (freqLabel[t.frequency] || '') + '</span>';
          html += '</div>';
        });
      }
    } else {
      tasks.forEach(function (t) {
        html += '<div class="rm-recurring' + (t.enabled ? '' : ' disabled') + '">';
        html += '<label class="recurring-toggle-label">';
        html += '<input type="checkbox" class="recurring-check" data-recurring-id="' + t.id + '"' + (t.enabled ? ' checked' : '') + ' />';
        html += '<span class="rm-recurring-icon">' + t.icon + '</span>';
        html += '<span class="rm-recurring-title">' + escapeHtml(t.title) + '</span>';
        html += '</label>';
        html += '<span class="rm-recurring-freq">' + (freqLabel[t.frequency] || '') + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';
    return html;
  }

  function bindRecurringButtons(container) {
    var toggleBtn = container.querySelector('#recurringToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        recurringEditOpen = !recurringEditOpen;
        renderMypage();
      });
    }
    container.querySelectorAll('.recurring-check').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-recurring-id');
        var tasks = getRecurringTasks();
        var t = tasks.find(function (x) { return x.id === id; });
        if (t) {
          t.enabled = cb.checked;
          saveDb();
        }
      });
    });
  }

  /** 学習進捗＋ロードマップ要約を1枚に。スターター完了前は1列目をスターター進捗バー、完了後は投稿カウント。 */
  function homeLearningProgressCardHtml(u) {
    if (!sessionUser || sessionUser.role !== 'student' || !u) return '';
    ensureProfile(u);
    var mine = tasksForViewer();
    var posts = mine.filter(function (x) { return x.type === 'post_goal'; });
    var sess = mine.filter(function (x) { return x.type === 'coaching_session'; });
    var lec = mine.filter(function (x) { return x.type === 'lecture'; });
    function sum(arr, field) {
      return arr.reduce(function (a, t) { return a + (t[field] || 0); }, 0);
    }
    var starterComplete = starterProgressPct() >= 100;
    var html = '<div class="card home-learning-progress-card"><p class="card-title">学習進捗</p><div class="stat-grid">';
    if (!starterComplete) {
      var spPct = starterProgressPct();
      html += '<div class="stat-box stat-box--starter-home">';
      html += '<div class="lbl">スターター</div>';
      html += '<div class="gantt-progress-bar stat-box--starter-home-bar"><div class="gantt-progress-fill' + (spPct >= 100 ? ' complete' : '') + '" style="width:' + spPct + '%"></div></div>';
      html += '<div class="num stat-box--starter-home-pct">' + spPct + '%</div>';
      html += '</div>';
    } else {
      html += '<div class="stat-box"><div class="num">' + sum(posts, 'currentNumber') + '</div><div class="lbl">投稿</div></div>';
    }
    html += '<div class="stat-box"><div class="num">' + sum(sess, 'currentNumber') + '</div><div class="lbl">コーチング</div></div>';
    html += '<div class="stat-box"><div class="num">' + sum(lec, 'currentNumber') + '</div><div class="lbl">講義</div></div>';
    html += '</div>';

    if (starterComplete) {
      var postCount = completedPostCount();
      var nextMilestone = null;
      for (var i = 0; i < ROADMAP_MILESTONES.length; i++) {
        if (!isMilestoneDone(ROADMAP_MILESTONES[i])) { nextMilestone = ROADMAP_MILESTONES[i]; break; }
      }
      var sessions = getCoachingSessions(sessionUser.id);
      var pendingTasks = 0;
      sessions.forEach(function (s) {
        s.tasks.forEach(function (t) { if (!t.done) pendingTasks++; });
      });
      if (nextMilestone) {
        html += '<div class="home-rm-next">' + nextMilestone.icon + ' 次: ' + escapeHtml(nextMilestone.title);
        if (nextMilestone.type === 'post' && nextMilestone.postCount) {
          html += '（あと' + Math.max(0, nextMilestone.postCount - postCount) + '投稿）';
        }
        html += '</div>';
      }
      if (pendingTasks > 0) {
        html += '<div class="home-rm-pending">⬜ 未完了セッションタスク: ' + pendingTasks + '件</div>';
      }
    }

    var btnLabel = starterComplete ? '投稿ロードマップを見る' : 'ロードマップを見る';
    html += '<button type="button" class="btn btn-primary home-student-cta" id="homeGoToRoadmap">' + btnLabel + '</button>';
    html += '</div>';
    return html;
  }

  function homePostSummaryHtml() {
    if (!sessionUser || sessionUser.role !== 'student') return '';
    var posts = postsForStudent(sessionUser.id).filter(function (p) {
      return postProgress(p).pct < 100;
    });
    if (posts.length === 0) return '';
    var html = '<div class="card"><p class="card-title">進行中の投稿</p>';
    posts.slice(0, 3).forEach(function (p) {
      var prog = postProgress(p);
      var cur = currentPostStep(p);
      html += '<div class="home-post-mini">';
      html += '<div class="home-post-mini-head">';
      html += '<span class="home-post-mini-title">' + escapeHtml(p.title) + '</span>';
      html += '<span class="home-post-mini-pct">' + prog.pct + '%</span>';
      html += '</div>';
      html += '<div class="gantt-progress-bar" style="margin:4px 0;"><div class="gantt-progress-fill" style="width:' + prog.pct + '%"></div></div>';
      if (cur) html += '<div class="home-post-mini-step">次: ' + escapeHtml(cur.label) + '</div>';
      html += '<div class="home-post-mini-date">投稿予定: ' + shortDate(p.targetDate) + '</div>';
      html += '</div>';
    });
    html += '<button type="button" class="btn btn-primary home-student-cta" id="homeGoToPosts">すべての投稿を見る</button>';
    html += '</div>';
    return html;
  }

  // === ロードマップタブ ===

  var roadmapView = 'milestones';
  /** セッションカード内タブ: sessionId → 'tasks' | 'next'（旧 'mg' は次回までに読み替え） */
  var roadmapSessionCardTab = {};
  /** 「次回まで」自動保存のデバウンス用 */
  var roadmapNextGoalsTimers = {};

  function getStarterSteps() {
    return db.starterSteps && db.starterSteps.length > 0 ? db.starterSteps : STARTER_STEPS_DEFAULT;
  }

  function getStarterProgress(studentId) {
    ensureProfile(sessionUser);
    return sessionUser.profile.starterDone || {};
  }

  function toggleStarterStep(stepId) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    ensureProfile(sessionUser);
    if (!sessionUser.profile.starterDone) sessionUser.profile.starterDone = {};
    if (sessionUser.profile.starterDone[stepId]) {
      delete sessionUser.profile.starterDone[stepId];
    } else {
      sessionUser.profile.starterDone[stepId] = todayIso();
    }
    saveDb();
    renderRoadmap();
    renderHome();
  }

  function starterTotalDays() {
    var steps = getStarterSteps();
    var t = 0;
    steps.forEach(function (s) { t += (s.days || 1); });
    return t;
  }

  function starterProgressPct() {
    var steps = getStarterSteps();
    var done = getStarterProgress(sessionUser.id);
    var total = steps.length;
    var ct = 0;
    steps.forEach(function (s) { if (done[s.id]) ct++; });
    return total > 0 ? Math.round((ct / total) * 100) : 0;
  }

  function completedPostCountForStudent(studentId) {
    if (!studentId) return 0;
    return postsForStudent(studentId).filter(function (p) {
      return postProgress(p).pct >= 100;
    }).length;
  }

  function completedPostCount() {
    if (!sessionUser) return 0;
    return completedPostCountForStudent(sessionUser.id);
  }

  function isMilestoneDone(m) {
    ensureProfile(sessionUser);
    if (sessionUser.profile.milestonesDone && sessionUser.profile.milestonesDone[m.id]) return true;
    if (m.type === 'post' && m.postCount) {
      return completedPostCount() >= m.postCount;
    }
    if (m.id === 'rm_starter') return starterProgressPct() >= 100;
    return false;
  }

  function toggleMilestone(milestoneId) {
    if (!sessionUser || sessionUser.role !== 'student') return;
    ensureProfile(sessionUser);
    if (!sessionUser.profile.milestonesDone) sessionUser.profile.milestonesDone = {};
    if (sessionUser.profile.milestonesDone[milestoneId]) {
      delete sessionUser.profile.milestonesDone[milestoneId];
    } else {
      sessionUser.profile.milestonesDone[milestoneId] = todayIso();
    }
    saveDb();
    renderRoadmap();
    renderHome();
  }

  function getCoachingSessions(studentId) {
    return (db.coachingSessions || [])
      .filter(function (s) { return s.studentUserId === studentId; })
      .sort(function (a, b) {
        var na = parseInt(a.sessionNum, 10);
        var nb = parseInt(b.sessionNum, 10);
        if (isNaN(na)) na = 999;
        if (isNaN(nb)) nb = 999;
        if (na !== nb) return na - nb;
        return (b.date || '').localeCompare(a.date || '');
      });
  }

  /** 今日より後の「次回セッション」または実施日のうち最も近い日（YYYY-MM-DD）。投稿カードの均等配置に使用 */
  function getNextSessionBoundaryDateForStudent(studentId) {
    var t = todayIso();
    var candidates = [];
    (db.coachingSessions || [])
      .filter(function (s) { return s.studentUserId === studentId; })
      .forEach(function (s) {
        var ns = (s.nextSessionAt || '').trim();
        if (ns.length >= 10) {
          var d = ns.slice(0, 10);
          if (d > t) candidates.push(d);
        }
        var sd = s.date;
        if (sd && sd > t) candidates.push(sd);
      });
    if (candidates.length === 0) return null;
    candidates.sort();
    return candidates[0];
  }

  function sessionNumber(session) {
    var sn = parseInt(session.sessionNum, 10);
    if (!isNaN(sn) && sn >= 1) return sn;
    var all = (db.coachingSessions || [])
      .filter(function (s) { return s.studentUserId === session.studentUserId; })
      .sort(function (a, b) { return (a.createdAt || '').localeCompare(b.createdAt || ''); });
    return all.indexOf(session) + 1;
  }

  function sessionMilestoneLabel(num) {
    var n = parseInt(num, 10);
    if (n === 1) return '1回目（目標設定セッション）';
    if (n >= 2 && n <= MAX_COACHING_SESSION_SLOT) return n + '回目セッション';
    return (isNaN(n) ? '?' : n) + '回目セッション';
  }

  function getOccupiedSessionNums(studentId) {
    var occ = {};
    (db.coachingSessions || [])
      .filter(function (s) { return s.studentUserId === studentId; })
      .forEach(function (s) {
        var n = parseInt(s.sessionNum, 10);
        if (!isNaN(n) && n >= 1 && n <= MAX_COACHING_SESSION_SLOT) occ[n] = true;
      });
    return occ;
  }

  function getAvailableSessionSlotsForStudent(studentId) {
    var occ = getOccupiedSessionNums(studentId);
    var out = [];
    for (var n = 1; n <= MAX_COACHING_SESSION_SLOT; n++) {
      if (!occ[n]) out.push(n);
    }
    return out;
  }

  /** 全回ぶんそろっていて新規の「回」が選べないときの説明（日付の空きではない旨） */
  function sessionSlotsMaxedHintHtml(studentId) {
    var count = getCoachingSessions(studentId).length;
    var max = MAX_COACHING_SESSION_SLOT;
    return (
      '<p class="sched-session-empty rm-session-slots-hint">ここで選べるのは<strong>実施日の空き</strong>ではなく、<strong>1〜' +
      max +
      '回目のうち、まだセッションカードがない回</strong>だけです。いま <strong>' +
      count +
      '/' +
      max +
      '</strong> 回ぶん登録済みのため、これ以上の新規登録はできません。実施日だけ変えたいときは、各セッションカードの<strong>✎</strong>から編集してください。</p>'
    );
  }

  function hasRegisteredSessionOne(studentId) {
    return getCoachingSessions(studentId).some(function (s) {
      return parseInt(s.sessionNum, 10) === 1;
    });
  }

  /**
   * N 回目のあとに来る（N+1 回目）までの目安日数。1〜3→1週間、4〜9→2週間、10〜11→約1ヶ月（11→12含む）。
   */
  function sessionGapDaysAfterSession(sessionNum) {
    var n = parseInt(sessionNum, 10);
    if (isNaN(n) || n < 1) return 7;
    if (n <= 3) return 7;
    if (n <= 9) return 14;
    if (n === 10 || n === 11) return 30;
    return 14;
  }

  function suggestedNextSessionDateIso(prevSessionNum, prevDateIso) {
    var base = prevDateIso && String(prevDateIso).trim().slice(0, 10);
    if (!base) base = todayIso();
    var gap = sessionGapDaysAfterSession(prevSessionNum);
    return addDaysToIsoDate(base, gap) || base;
  }

  function suggestedBulkNextSessionDateForStudent(studentId) {
    var sessions = getCoachingSessions(studentId);
    if (sessions.length === 0) return '';
    var last = sessions[sessions.length - 1];
    var n = parseInt(last.sessionNum, 10);
    if (isNaN(n)) n = sessionNumber(last);
    if (n >= MAX_COACHING_SESSION_SLOT) return '';
    return suggestedNextSessionDateIso(n, last.date || todayIso());
  }

  /**
   * 指定回のセッションを作成または日付更新（カレンダー予定との同期のみ。マイルストーンは変更しない）。
   */
  function ensureCoachingSessionSlot(studentId, sessionNum, dateIso) {
    if (!Array.isArray(db.coachingSessions)) db.coachingSessions = [];
    var num = parseInt(sessionNum, 10);
    if (isNaN(num) || num < 1 || num > MAX_COACHING_SESSION_SLOT) return null;
    var date = dateIso || todayIso();
    var found = db.coachingSessions.find(function (s) {
      return s.studentUserId === studentId && parseInt(s.sessionNum, 10) === num;
    });
    if (found) {
      var prevDate = found.date || '';
      if (prevDate !== date) {
        found.date = date;
        syncSessionScheduleLinks(found, prevDate, date);
      }
      if (found.mgMessage === undefined) found.mgMessage = '';
      if (found.postSlotsTarget === undefined) found.postSlotsTarget = 0;
      saveDb();
      return found;
    }
    var session = {
      id: uid('cs'),
      studentUserId: studentId,
      date: date,
      sessionNum: num,
      tasks: [],
      mgMessage: '',
      nextSessionAt: '',
      goalUntilNextStudent: '',
      goalUntilNextMg: '',
      postSlotsTarget: 0,
      createdAt: new Date().toISOString(),
    };
    db.coachingSessions.push(session);
    saveDb();
    return session;
  }

  /** 次回セッション実施日 or このカードの nextSessionAt 日付までを「投稿カード集計」の終端に使う */
  function getSessionPostWindowEndIso(sess, orderedSessions) {
    var curNum = parseInt(sess.sessionNum, 10);
    if (isNaN(curNum)) curNum = sessionNumber(sess);
    for (var i = 0; i < orderedSessions.length; i++) {
      var n = parseInt(orderedSessions[i].sessionNum, 10);
      if (isNaN(n)) n = sessionNumber(orderedSessions[i]);
      if (n === curNum + 1 && orderedSessions[i].date) {
        return String(orderedSessions[i].date).trim().slice(0, 10);
      }
    }
    var ns = (sess.nextSessionAt || '').trim();
    if (ns.length >= 10) return ns.slice(0, 10);
    return '';
  }

  /** 実施日〜区間終端の間に予定日がある投稿カード数とワークフロー完了数 */
  function countPostsInWindowForSession(studentId, sess, orderedSessions) {
    var start = (sess.date || '').trim().slice(0, 10);
    if (!start) return { cards: 0, wfDone: 0 };
    var end = getSessionPostWindowEndIso(sess, orderedSessions);
    var cards = 0;
    var wfDone = 0;
    postsForStudent(studentId).forEach(function (p) {
      var anchor = (p.plannedPublishDate || p.targetDate || '').trim().slice(0, 10);
      if (!anchor) return;
      if (anchor < start) return;
      if (end && anchor > end) return;
      cards++;
      if (postProgress(p).pct >= 100) wfDone++;
    });
    return { cards: cards, wfDone: wfDone };
  }

  /** 実施日〜次回セッション前までの区間に予定日がある投稿カードを日付順に並べた配列 */
  function getPostsInSessionWindowSorted(studentId, sess, orderedSessions) {
    var start = (sess.date || '').trim().slice(0, 10);
    if (!start) return [];
    var end = getSessionPostWindowEndIso(sess, orderedSessions);
    var list = [];
    postsForStudent(studentId).forEach(function (p) {
      var anchor = (p.plannedPublishDate || p.targetDate || '').trim().slice(0, 10);
      if (!anchor) return;
      if (anchor < start) return;
      if (end && anchor > end) return;
      list.push(p);
    });
    list.sort(function (a, b) {
      var aa = String((a.plannedPublishDate || a.targetDate || '')).trim().slice(0, 10);
      var bb = String((b.plannedPublishDate || b.targetDate || '')).trim().slice(0, 10);
      if (aa !== bb) return aa < bb ? -1 : (aa > bb ? 1 : 0);
      return String(a.id).localeCompare(String(b.id));
    });
    return list;
  }

  /** 「3投稿」または旧「投稿 #3」からスロット番号 */
  function parseSessionPostSlotTitleIndex(title) {
    var t = String(title || '').trim();
    var m = /^(\d+)投稿$/.exec(t);
    if (m) return parseInt(m[1], 10);
    m = /^投稿 #(\d+)$/.exec(t);
    return m ? parseInt(m[1], 10) : 0;
  }

  function isSessionPostSlotShapeTitle(title) {
    var t = String(title || '').trim();
    return /^(\d+)投稿$/.test(t) || /^投稿 #\d+$/.test(t);
  }

  /** セッション内の「n投稿」で最大の n の次（手動で「投稿」を追加するときの連番） */
  function nextSessionPostActionOrdinal(session) {
    var maxN = 0;
    (session && session.tasks || []).forEach(function (t) {
      var n = parseSessionPostSlotTitleIndex(t.title);
      if (n > maxN) maxN = n;
    });
    return maxN + 1;
  }

  /**
   * postSlotsTarget に合わせて「1投稿」… を並べる（完了状態は番号ごとに維持）。
   * @returns {boolean} タスク配列を書き換えたか
   */
  function ensureCoachingSessionPostSlotTasks(session) {
    if (!session || !Array.isArray(session.tasks)) return false;
    var target = Math.max(0, Math.min(52, parseInt(session.postSlotsTarget, 10) || 0));
    var rest = [];
    var oldByIdx = {};
    session.tasks.forEach(function (t) {
      var title = String(t.title || '').trim();
      var isSlot = t.sessionPostSlot === true || (isSessionPostSlotShapeTitle(title) && !t.manualPostTask);
      if (!isSlot) {
        rest.push(t);
        return;
      }
      var idx = t.slotIndex != null && t.slotIndex !== '' ? parseInt(t.slotIndex, 10) : parseSessionPostSlotTitleIndex(title);
      if (isNaN(idx)) idx = 0;
      if (idx >= 1 && idx <= 52 && !oldByIdx[idx]) oldByIdx[idx] = t;
      else rest.push(t);
    });

    var unchanged = true;
    if (Object.keys(oldByIdx).length !== target) unchanged = false;
    else {
      for (var j = 1; j <= target; j++) {
        if (!oldByIdx[j]) {
          unchanged = false;
          break;
        }
      }
    }
    if (unchanged && target === 0 && session.tasks.every(function (t) {
      var title = String(t.title || '').trim();
      return !(t.sessionPostSlot === true || (isSessionPostSlotShapeTitle(title) && !t.manualPostTask));
    })) {
      return false;
    }
    if (unchanged && target > 0) return false;

    var newSlots = [];
    var baseDue = session.date || todayIso();
    for (var i = 1; i <= target; i++) {
      var old = oldByIdx[i];
      if (old) {
        old.title = i + '投稿';
        old.slotIndex = i;
        old.sessionPostSlot = true;
        if (!old.dueDate) old.dueDate = baseDue;
        newSlots.push(old);
      } else {
        newSlots.push({
          id: uid('cst'),
          title: i + '投稿',
          dueDate: baseDue,
          done: false,
          doneDate: '',
          sessionPostSlot: true,
          slotIndex: i,
        });
      }
    }
    session.tasks = rest.concat(newSlots);
    return true;
  }

  function prepareCoachingSessionsPostSlots(studentId) {
    var dirty = false;
    getCoachingSessions(studentId).forEach(function (s) {
      if (ensureCoachingSessionPostSlotTasks(s)) dirty = true;
    });
    if (dirty) saveDb();
  }

  /** ワークフロー100%の投稿カードと、セッション区間内 n 本目の「n投稿」チェックを連動（未完了にはしない） */
  function syncSessionPostSlotChecksFromWorkflow(studentId) {
    var dirty = false;
    var sessions = getCoachingSessions(studentId);
    sessions.forEach(function (sess) {
      var sorted = getPostsInSessionWindowSorted(studentId, sess, sessions);
      (sess.tasks || []).forEach(function (t) {
        if (!t.sessionPostSlot) return;
        var idx = t.slotIndex != null && t.slotIndex !== '' ? parseInt(t.slotIndex, 10) : parseSessionPostSlotTitleIndex(t.title);
        if (isNaN(idx) || idx < 1) return;
        var post = sorted[idx - 1];
        if (!post) return;
        var wfDone = postProgress(post).pct >= 100;
        if (wfDone && !t.done) {
          t.done = true;
          t.doneDate = postWorkflowCompletedDateIso(post) || todayIso();
          dirty = true;
        }
      });
    });
    if (dirty) saveDb();
  }

  function updateCoachingSessionDate(sessionId, dateIso) {
    var s = db.coachingSessions.find(function (x) { return x.id === sessionId; });
    if (!s || !dateIso) return;
    var prevDate = s.date || '';
    if (prevDate === dateIso) return;
    s.date = dateIso;
    syncSessionScheduleLinks(s, prevDate, dateIso);
    saveDb();
    renderRoadmap();
    renderSchedule();
    renderHome();
  }

  function updateCoachingSessionMgMessage(sessionId, text) {
    var s = db.coachingSessions.find(function (x) { return x.id === sessionId; });
    if (!s) return;
    s.mgMessage = text == null ? '' : String(text);
    saveDb();
    renderRoadmap();
  }

  function saveCoachingSessionNextAndGoals(sessionId, nextAt, gStu, gMg, skipRoadmapRerender, postSlotsRaw) {
    var s = db.coachingSessions.find(function (x) { return x.id === sessionId; });
    if (!s) return;
    if (nextAt !== undefined) s.nextSessionAt = nextAt == null ? '' : String(nextAt).trim();
    if (gStu !== undefined) s.goalUntilNextStudent = gStu == null ? '' : String(gStu);
    if (gMg !== undefined) s.goalUntilNextMg = gMg == null ? '' : String(gMg);
    if (postSlotsRaw !== undefined && postSlotsRaw !== null) {
      var nv = Math.max(0, Math.min(52, parseInt(String(postSlotsRaw), 10) || 0));
      s.postSlotsTarget = nv;
      ensureCoachingSessionPostSlotTasks(s);
    }
    saveDb();
    if (skipRoadmapRerender) {
      renderHome();
      renderSchedule();
    } else {
      renderRoadmap();
      renderSchedule();
      renderHome();
    }
  }

  function addCoachingSession(studentId) {
    var avail = getAvailableSessionSlotsForStudent(studentId);
    if (avail.length === 0) return null;
    return ensureCoachingSessionSlot(studentId, avail[0], todayIso());
  }

  function addSessionTask(sessionId, title, dueDate, taskExtra) {
    var session = db.coachingSessions.find(function (s) { return s.id === sessionId; });
    if (!session) return;
    var due = dueDate && String(dueDate).trim() ? String(dueDate).trim() : '';
    if (!due && session.date) due = session.date;
    var row = {
      id: uid('cst'),
      title: title,
      dueDate: due,
      done: false,
      doneDate: '',
    };
    if (taskExtra && typeof taskExtra === 'object') {
      Object.keys(taskExtra).forEach(function (k) {
        row[k] = taskExtra[k];
      });
    }
    session.tasks.push(row);
    saveDb();
  }

  function toggleSessionTask(sessionId, taskId) {
    var session = db.coachingSessions.find(function (s) { return s.id === sessionId; });
    if (!session) return;
    var task = session.tasks.find(function (t) { return t.id === taskId; });
    if (!task) return;
    task.done = !task.done;
    task.doneDate = task.done ? todayIso() : '';
    saveDb();
    renderRoadmap();
    renderSchedule();
    renderHome();
  }

  function markAllSessionTasksDone(sessionId) {
    var session = db.coachingSessions.find(function (s) { return s.id === sessionId; });
    if (!session || !session.tasks.length) return;
    var d = todayIso();
    session.tasks.forEach(function (t) {
      if (!t.done) {
        t.done = true;
        t.doneDate = d;
      }
    });
    saveDb();
    renderRoadmap();
    renderSchedule();
    renderHome();
  }

  function deleteSessionTask(sessionId, taskId) {
    var session = db.coachingSessions.find(function (s) { return s.id === sessionId; });
    if (!session) return;
    var task = session.tasks.find(function (t) { return t.id === taskId; });
    if (task && task.sessionPostSlot) {
      alert('「1投稿」「2投稿」…の行の数は、そのセッションカードの「次回まで」タブの目標本数で変えられます。');
      return;
    }
    session.tasks = session.tasks.filter(function (t) { return t.id !== taskId; });
    saveDb();
    renderRoadmap();
    renderSchedule();
    renderHome();
  }

  function renderRoadmap() {
    var el = document.getElementById('roadmapContent');
    if (!el) return;
    if (!sessionUser || sessionUser.role !== 'student') {
      el.innerHTML = '<div class="card"><p class="card-title">ロードマップ</p><p style="margin:0;color:var(--muted);">生徒アカウントで利用できます。</p></div>';
      return;
    }
    ensureProfile(sessionUser);
    var html = '';

    html += '<div class="rm-tabs">';
    html += '<button type="button" class="rm-tab' + (roadmapView === 'milestones' ? ' active' : '') + '" data-rm-tab="milestones">マイルストーン</button>';
    html += '<button type="button" class="rm-tab' + (roadmapView === 'starter' ? ' active' : '') + '" data-rm-tab="starter">スターター</button>';
    html += '<button type="button" class="rm-tab' + (roadmapView === 'sessions' ? ' active' : '') + '" data-rm-tab="sessions">セッションタスク</button>';
    html += '</div>';

    if (roadmapView === 'starter') {
      html += renderStarterHtml();
    } else if (roadmapView === 'milestones') {
      html += renderMilestonesHtml();
    } else if (roadmapView === 'sessions') {
      html += renderSessionsHtml();
    }

    el.innerHTML = html;
    bindRoadmapEvents(el);
  }

  function renderStarterHtml() {
    var steps = getStarterSteps();
    var done = getStarterProgress(sessionUser.id);
    var pct = starterProgressPct();

    var html = '<div class="card">';
    html += '<p class="card-title">スタータープログラム</p>';
    html += '<p style="margin:0 0 8px;font-size:0.72rem;color:var(--muted);">全' + steps.length + 'ステップ / 約' + starterTotalDays() + '日</p>';
    html += '<div class="gantt-progress-row"><div class="gantt-progress-bar"><div class="gantt-progress-fill' + (pct >= 100 ? ' complete' : '') + '" style="width:' + pct + '%"></div></div><span class="gantt-pct">' + pct + '%</span></div>';
    html += '</div>';

    steps.forEach(function (s, idx) {
      var isDone = !!done[s.id];
      var cls = 'rm-step-card' + (isDone ? ' done' : '');
      html += '<div class="' + cls + '">';
      html += '<button type="button" class="rm-step-check" data-toggle-starter="' + s.id + '">';
      html += isDone ? '✓' : (idx + 1);
      html += '</button>';
      html += '<div class="rm-step-body">';
      html += '<span class="rm-step-title">' + escapeHtml(s.title) + '</span>';
      var meta = '目安 ' + (s.days || 1) + '日';
      if (isDone) meta += ' <span class="rm-done-date">✓ ' + shortDate(done[s.id]) + '</span>';
      html += '<div class="rm-step-meta">' + meta + '</div>';
      html += '</div>';
      html += '</div>';
    });

    return html;
  }

  function renderMilestonesHtml() {
    var postCount = completedPostCount();
    var currentMs = null;
    for (var ci = 0; ci < ROADMAP_MILESTONES.length; ci++) {
      if (!isMilestoneDone(ROADMAP_MILESTONES[ci])) {
        currentMs = ROADMAP_MILESTONES[ci];
        break;
      }
    }

    var html = '<div class="rm-milestone-current">';
    html += '<p class="rm-milestone-current-kicker">いまのマイルストーン</p>';
    if (currentMs) {
      html += '<div class="rm-milestone-current-head">';
      html += '<span class="rm-milestone-current-ico" aria-hidden="true">' + currentMs.icon + '</span>';
      html += '<p class="rm-milestone-current-title">' + escapeHtml(currentMs.title) + '</p>';
      html += '</div>';
      if (currentMs.type === 'post' && currentMs.postCount) {
        html += '<p class="rm-milestone-current-sub">あと <strong>' + Math.max(0, currentMs.postCount - postCount) + '</strong> 投稿で達成（投稿ワークフロー完了）</p>';
      } else {
        html += '<p class="rm-milestone-current-sub">下の一覧で内容の確認や「達成にする」から記録できます。</p>';
      }
    } else {
      html += '<div class="rm-milestone-current-head">';
      html += '<span class="rm-milestone-current-ico" aria-hidden="true">🎉</span>';
      html += '<p class="rm-milestone-current-title rm-milestone-current-title--done">すべてのマイルストーンを達成しました</p>';
      html += '</div>';
      html += '<p class="rm-milestone-current-sub">この先もペースを継続していきましょう。</p>';
    }
    html += '<p class="rm-milestone-current-postline">投稿ワークフロー完了: <strong>' + postCount + '</strong></p>';
    html += '</div>';

    var prevDone = true;
    ROADMAP_MILESTONES.forEach(function (m) {
      var done = isMilestoneDone(m);
      var isPostMilestone = m.type === 'post';
      var isFocus = currentMs && m.id === currentMs.id;
      var cls = 'rm-milestone' + (done ? ' achieved' : '') + (isPostMilestone ? ' post-medal' : '') + (isFocus ? ' rm-milestone--focus' : '');
      html += '<div class="' + cls + '">';
      html += '<div class="rm-ms-icon-col">';
      if (done) {
        html += '<div class="rm-ms-icon done">' + m.icon + '</div>';
      } else {
        html += '<div class="rm-ms-icon">' + m.icon + '</div>';
      }
      if (prevDone || done) html += '<div class="rm-ms-line done"></div>';
      else html += '<div class="rm-ms-line"></div>';
      html += '</div>';
      html += '<div class="rm-ms-body">';
      html += '<div class="rm-ms-title">' + escapeHtml(m.title) + '</div>';
      if (done) {
        var doneDate = '';
        if (sessionUser.profile.milestonesDone && sessionUser.profile.milestonesDone[m.id]) {
          doneDate = sessionUser.profile.milestonesDone[m.id];
        }
        html += '<div class="rm-ms-status achieved">達成!' + (doneDate ? ' ' + shortDate(doneDate) : '') + '</div>';
      } else if (isPostMilestone) {
        html += '<div class="rm-ms-status">あと ' + Math.max(0, m.postCount - postCount) + ' 投稿</div>';
      } else {
        html += '<button type="button" class="rm-ms-done-btn" data-toggle-milestone="' + m.id + '">達成にする</button>';
      }
      html += '</div>';
      html += '</div>';
      prevDone = done;
    });

    return html;
  }

  /** 「投稿」を先頭、「その他…」を末尾に並べ替え（旧ラベルも互換） */
  function orderSessionTaskPickList(lib) {
    var postLabels = ['投稿', '投稿する'];
    var otherLabels = [SESSION_TASK_OTHER_LABEL, 'その他'];
    var postPick = null;
    var i;
    for (i = 0; i < postLabels.length; i++) {
      if (lib.indexOf(postLabels[i]) >= 0) {
        postPick = postLabels[i];
        break;
      }
    }
    var otherPick = null;
    for (i = otherLabels.length - 1; i >= 0; i--) {
      if (lib.indexOf(otherLabels[i]) >= 0) {
        otherPick = otherLabels[i];
        break;
      }
    }
    var mid = lib.filter(function (t) {
      return t !== postPick && t !== otherPick;
    });
    var out = [];
    if (postPick) out.push(postPick);
    out = out.concat(mid);
    if (otherPick) out.push(otherPick);
    return out;
  }

  /** セッションに紐づくタスクのプルダウン（管理画面の sessionTaskLibrary を優先） */
  function getSessionTaskPickList() {
    var lib = (db.sessionTaskLibrary && db.sessionTaskLibrary.length > 0)
      ? db.sessionTaskLibrary.slice()
      : SESSION_TASK_LIBRARY.slice();
    if (!sessionUser || sessionUser.role !== 'student') return orderSessionTaskPickList(lib);
    if (starterProgressPct() < 100) return orderSessionTaskPickList(lib);
    var hide = {};
    getStarterSteps().forEach(function (s) {
      if (s && s.title) hide[s.title] = true;
    });
    SESSION_TASKS_EXTRA_HIDDEN_AFTER_STARTER_DONE.forEach(function (t) {
      hide[t] = true;
    });
    lib = lib.filter(function (t) {
      return !hide[t];
    });
    return orderSessionTaskPickList(lib);
  }

  function renderSessionsHtml() {
    var sessions = getCoachingSessions(sessionUser.id);
    prepareCoachingSessionsPostSlots(sessionUser.id);
    syncSessionPostSlotChecksFromWorkflow(sessionUser.id);
    var taskLib = getSessionTaskPickList();
    var avail = getAvailableSessionSlotsForStudent(sessionUser.id);
    var html = '';

    if (!hasRegisteredSessionOne(sessionUser.id)) {
      html += '<div class="card rm-session-register-card">';
      html += '<p class="card-title">1回目のセッションを登録</p>';
      html += '<p class="sched-session-hint" style="margin:0 0 8px;">2回目以降は、下の各カード末尾の「次のセッションと投稿カードを同時に作成」から追加します。</p>';
      html += '<label class="label">実施日（予定）</label>';
      html += '<input type="date" id="rmNewSessionDate" class="input" value="' + escapeHtml(todayIso()) + '" />';
      html += '<input type="hidden" id="rmNewSessionSlot" value="1" />';
      if (avail.indexOf(1) < 0) {
        html += '<p class="sched-session-empty" style="margin-top:10px;">1回目はすでに登録済みです。下の一覧を確認してください。</p>';
        html += '<button type="button" class="btn btn-primary" id="btnRegisterSessionSlot" style="margin-top:12px;width:100%;" disabled>セッションを登録</button>';
      } else {
        html += '<button type="button" class="btn btn-primary" id="btnRegisterSessionSlot" style="margin-top:12px;width:100%;">1回目のセッションを登録</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="card rm-session-register-card rm-session-register-card--hint-only">';
      html += '<p class="card-title">2回目以降のセッション</p>';
      html += '<p class="sched-session-hint" style="margin:0;">直前のカードの下にある「次のセッションと投稿カードを同時に作成」から追加します。</p>';
      html += '</div>';
    }

    /** 次の回のセッションが未作成のときは、下の「投稿だけ追加」カードは出さず、上でセッション＋投稿を同時作成する */
    var roadmapHasPendingNextSlotCreate = false;

    sessions.forEach(function (sess) {
        var num = parseInt(sess.sessionNum, 10);
        if (isNaN(num)) num = sessionNumber(sess);
        var msLabel = sessionMilestoneLabel(num);
        var totalTasks = sess.tasks.length;
        var doneTasks = sess.tasks.filter(function (t) { return t.done; }).length;
        var progressPct = totalTasks > 0 ? Math.round((100 * doneTasks) / totalTasks) : 0;
        var tgtPosts = Math.max(0, Math.min(52, parseInt(sess.postSlotsTarget, 10) || 0));
        var winPosts = countPostsInWindowForSession(sessionUser.id, sess, sessions);
        var slotDone = sess.tasks.filter(function (t) { return t.sessionPostSlot && t.done; }).length;

        html += '<div class="card rm-session-card' + (totalTasks > 0 && doneTasks === totalTasks ? ' rm-session-card--all-tasks-done' : '') + '">';
        html += '<div class="rm-session-card-top">';
        html += '<div class="rm-session-title-block">';
        html += '<span class="rm-session-num">' + escapeHtml(msLabel) + '</span>';
        html += '<div class="rm-session-date-inline">';
        html += '<span class="rm-session-date-shown">' + (shortDate(sess.date) || '日付未設定') + '</span>';
        html += '<button type="button" class="rm-session-date-pencil" data-rm-session-date-toggle="' + escapeHtml(sess.id) + '" aria-label="実施日を編集">✎</button>';
        html += '</div>';
        html += '<div class="rm-session-date-edit-wrap hidden" data-rm-session-date-wrap="' + escapeHtml(sess.id) + '">';
        html += '<input type="date" class="input rm-session-date-input" data-rm-session-date="' + escapeHtml(sess.id) + '" value="' + escapeHtml(sess.date || '') + '" />';
        html += '<button type="button" class="btn btn-primary btn-small rm-session-date-save-inline" data-rm-session-date-save="' + escapeHtml(sess.id) + '">保存</button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="rm-session-head-meta" title="実施日〜次回セッションまでの区間で集計。目標＝次回までタブの本数。投稿＝投稿タブで工程が100%まで終わった本数。">';
        html += '<div class="rm-session-post-stats">';
        html += '<span class="rm-session-post-stat" title="次回までタブで決めた、この期間の投稿本数（0〜52）"><span class="rm-session-post-stat-key">目標</span><strong>' + tgtPosts + '</strong></span>';
        html += '<span class="rm-session-post-stat" title="この期間に予定日がある投稿カードのうち、投稿タブのワークフロー（工程）が100%まで完了した本数"><span class="rm-session-post-stat-key">投稿</span><strong>' + winPosts.wfDone + '</strong></span>';
        html += '</div>';
        html += '<div class="rm-session-post-slot-line" title="タスクの「n投稿」チェックの完了数／目標本数">チェック <strong>' + slotDone + '</strong>/' + tgtPosts + '</div>';
        html += '</div>';
        html += '</div>';

        if (totalTasks > 0) {
          html += '<div class="rm-session-progress-wrap">';
          html += '<div class="rm-session-progress-line">';
          html += '<span class="rm-session-count">' + doneTasks + '/' + totalTasks + '</span>';
          if (doneTasks === totalTasks) {
            html += '<span class="rm-session-all-done-badge">すべて完了</span>';
          }
          html += '</div>';
          html += '<div class="rm-session-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progressPct + '">';
          html += '<div class="rm-session-progress-fill" style="width:' + progressPct + '%"></div>';
          html += '</div></div>';
        }

        var tab = roadmapSessionCardTab[sess.id] || 'tasks';
        if (tab === 'meta' || tab === 'mg') tab = 'next';
        var nextAtVal = (sess.nextSessionAt || '').trim();
        var nextDate = '';
        var nextTimeSnapped = '09:00';
        if (nextAtVal.length >= 16) {
          nextDate = nextAtVal.slice(0, 10);
          nextTimeSnapped = snapTimeToQuarterHour(nextAtVal.slice(11, 16));
        } else if (nextAtVal.length >= 10) {
          nextDate = nextAtVal.slice(0, 10);
        }
        var hiddenNextVal = nextDate ? composeNextSessionAtFromParts(nextDate, nextTimeSnapped) : '';

        html += '<div class="rm-session-subtabs" role="tablist">';
        html += '<button type="button" role="tab" class="rm-session-subtab' + (tab === 'tasks' ? ' rm-session-subtab--active' : '') + '" data-rm-sess-tab="' + escapeHtml(sess.id) + '" data-rm-sess-tabkey="tasks">タスク</button>';
        html += '<button type="button" role="tab" class="rm-session-subtab' + (tab === 'next' ? ' rm-session-subtab--active' : '') + '" data-rm-sess-tab="' + escapeHtml(sess.id) + '" data-rm-sess-tabkey="next">次回まで</button>';
        html += '</div>';

        html += '<div class="rm-session-panel"' + (tab !== 'tasks' ? ' style="display:none;"' : '') + ' data-rm-sess-panel="' + escapeHtml(sess.id) + '" data-panel="tasks">';
        html += '<div class="rm-session-add-block">';
        html += '<div class="rm-session-add-row">';
        html += '<select class="input rm-task-select" data-session-lib="' + escapeHtml(sess.id) + '">';
        html += '<option value="">タスクを追加…</option>';
        taskLib.forEach(function (t) {
          html += '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
        });
        html += '</select>';
        html += '<input type="date" class="input rm-task-due" data-session-due="' + escapeHtml(sess.id) + '" value="' + escapeHtml(sess.date || '') + '" style="width:140px;" />';
        html += '<button type="button" class="btn btn-primary btn-small rm-task-add-btn" data-add-stask="' + escapeHtml(sess.id) + '">追加</button>';
        html += '</div>';
        html += '<input type="text" class="input rm-task-custom-title hidden" data-session-custom="' + escapeHtml(sess.id) + '" placeholder="その他のタスク名を入力" maxlength="80" aria-label="その他のタスク名" />';
        html += '</div>';

        sess.tasks.forEach(function (t) {
          var tcls = 'rm-session-task' + (t.done ? ' done' : '');
          var postChk = isSessionPostTaskTitle(t.title);
          var chkCls = 'rm-session-task-check' + (t.done ? ' done' : '') + (postChk ? ' rm-session-task-check--post' : '');
          html += '<div class="' + tcls + '">';
          html += '<button type="button" class="' + chkCls + '" data-toggle-stask="' + sess.id + '|' + t.id + '">' + (t.done ? '✓' : '○') + '</button>';
          html += '<div class="rm-session-task-body">';
          html += '<span class="rm-session-task-title">' + escapeHtml(t.title) + '</span>';
          if (t.dueDate) {
            var rem = dueText(t.dueDate);
            html += '<span class="rm-session-task-due">' + rem + '</span>';
          }
          html += '</div>';
          if (!t.sessionPostSlot) {
            html += '<button type="button" class="rm-session-task-del" data-del-stask="' + sess.id + '|' + t.id + '" title="削除">✕</button>';
          } else {
            html += '<span class="rm-session-task-del-spacer" aria-hidden="true"></span>';
          }
          html += '</div>';
        });

        if (totalTasks > 0 && doneTasks < totalTasks) {
          html += '<div class="rm-session-check-all-row">';
          html += '<button type="button" class="btn btn-secondary btn-small rm-session-check-all-btn" data-rm-check-all-tasks="' + escapeHtml(sess.id) + '">すべて完了にする</button>';
          html += '</div>';
        }

        html += '</div>';

        html += '<div class="rm-session-panel"' + (tab !== 'next' ? ' style="display:none;"' : '') + ' data-rm-sess-panel="' + escapeHtml(sess.id) + '" data-panel="next">';
        html += '<div class="rm-session-next-fields">';
        html += '<p class="rm-session-next-student-kicker">あなたが入力</p>';
        html += '<label class="label">次のセッション（日付・時間）</label>';
        html += '<p class="rm-session-next-time-hint">時間は下の一覧から15分刻みのみ選べます。</p>';
        html += '<input type="hidden" data-rm-session-next-at="' + escapeHtml(sess.id) + '" value="' + escapeHtml(hiddenNextVal) + '" />';
        html += '<div class="rm-session-next-datetime-row">';
        html += '<input type="date" class="input rm-session-next-date" data-rm-next-date="' + escapeHtml(sess.id) + '" data-rm-next-autosave="' + escapeHtml(sess.id) + '" value="' + escapeHtml(nextDate) + '" />';
        html += '<select class="input rm-session-next-time-select" data-rm-next-time="' + escapeHtml(sess.id) + '" data-rm-next-autosave="' + escapeHtml(sess.id) + '">';
        html += nextSessionQuarterHourOptionsHtml(nextTimeSnapped);
        html += '</select></div>';
        html += '<label class="label" style="margin-top:10px;">次のセッションまでの投稿・目標本数</label>';
        html += '<p class="rm-session-next-time-hint">0〜52。タスクに「1投稿」…が並び、詳細は<strong>投稿</strong>タブで記録します。</p>';
        html += '<input type="number" min="0" max="52" class="input rm-session-post-slots-input" data-rm-post-slots-target="' + escapeHtml(sess.id) + '" data-rm-next-autosave="' + escapeHtml(sess.id) + '" value="' + tgtPosts + '" />';
        html += '</div>';
        html += '<div class="rm-session-next-stack">';
        html += '<div class="rm-session-next-stack-box rm-session-next-stack-box--goal">';
        html += '<p class="rm-session-next-stack-box-title">自分の目標</p>';
        html += '<div class="rm-session-next-stack-box-frame">';
        html += '<textarea class="input rm-session-goal-ta rm-session-next-stack-ta" data-rm-next-autosave="' + escapeHtml(sess.id) + '" rows="4" data-rm-session-goal-stu="' + escapeHtml(sess.id) + '" placeholder="自分の目標・やること">' + escapeHtml(sess.goalUntilNextStudent || '') + '</textarea>';
        html += '<div class="rm-session-next-footer">';
        html += '<span class="rm-session-next-toast hidden" data-rm-next-toast="' + escapeHtml(sess.id) + '">保存しました</span>';
        html += '<span class="rm-session-next-saved-note hidden" data-rm-next-saved-note="' + escapeHtml(sess.id) + '">保存しました</span>';
        html += '<button type="button" class="rm-session-next-send" data-rm-session-next-save="' + escapeHtml(sess.id) + '" aria-label="今すぐ保存">➤</button>';
        html += '</div>';
        html += '</div></div>';
        html += '<div class="rm-session-next-stack-box rm-session-next-stack-box--mg" aria-label="MGから（閲覧のみ）">';
        html += '<p class="rm-session-next-stack-box-title">MGから<span class="rm-mg-tab-caption-badge">閲覧のみ</span></p>';
        html += '<div class="rm-session-next-stack-box-frame rm-session-next-stack-box-frame--mg">';
        html += '<div class="rm-session-next-mg-block">';
        html += '<p class="rm-session-next-mg-subhead">次回までの共有</p>';
        if ((sess.goalUntilNextMg || '').trim()) {
          html += '<div class="rm-session-next-mg-text">' + escapeHtmlMultiline(sess.goalUntilNextMg) + '</div>';
        } else {
          html += '<p class="rm-session-next-mg-empty">まだありません。</p>';
        }
        html += '</div>';
        html += '<div class="rm-session-next-mg-block">';
        html += '<p class="rm-session-next-mg-subhead">メッセージ</p>';
        if ((sess.mgMessage || '').trim()) {
          html += '<div class="rm-session-next-mg-text">' + escapeHtmlMultiline(sess.mgMessage) + '</div>';
        } else {
          html += '<p class="rm-session-next-mg-empty">まだメッセージはありません。</p>';
        }
        html += '</div>';
        html += '</div></div>';
        html += '</div>';
        html += '</div>';

        if (num >= 1 && num < MAX_COACHING_SESSION_SLOT) {
          var nextNum = num + 1;
          var hasNextCard = sessions.some(function (s) {
            return parseInt(s.sessionNum, 10) === nextNum;
          });
          var presetNext = suggestedNextSessionDateIso(num, sess.date || todayIso());
          if (!hasNextCard) {
            roadmapHasPendingNextSlotCreate = true;
            html += '<div class="rm-session-create-next-wrap">';
            html += '<p class="rm-session-create-next-title">次のセッションと投稿カードを同時に作成</p>';
            html += '<label class="label">' + escapeHtml(sessionMilestoneLabel(nextNum)) + 'の実施日（目安・✎で調整可）</label>';
            html += '<input type="date" class="input" data-rm-next-slot-date="' + nextNum + '" value="' + escapeHtml(presetNext) + '" />';
            html += '<label class="label" style="margin-top:10px;">その日までに増やす投稿の数</label>';
            html += '<input type="number" class="input" min="1" max="52" value="3" data-rm-next-slot-post-count="' + nextNum + '" />';
            html += '<button type="button" class="btn btn-primary" style="margin-top:12px;width:100%;" data-rm-create-next-and-posts="' + nextNum + '">セッションと投稿カードを作成</button>';
            html += '</div>';
          }
        }

        html += '</div>';
    });

    if (!roadmapHasPendingNextSlotCreate) {
      var bulkNext = suggestedBulkNextSessionDateForStudent(sessionUser.id);
      html += '<div class="card rm-session-bulk-posts-card">';
      html += '<p class="card-title">次回セッションまでの投稿カード</p>';
      html += '<p class="sched-session-hint" style="margin:0 0 10px;">次のセッション用のカードを<strong>すでに追加済み</strong>のときだけ使います。日付と本数から投稿タブの工程カードだけ増やせます。</p>';
      html += '<label class="label">次回セッションの日付</label>';
      html += '<input type="date" id="rmBulkSessionDate" class="input" value="' + escapeHtml(bulkNext) + '" />';
      html += '<label class="label" style="margin-top:10px;">その日までに増やす投稿の数</label>';
      html += '<input type="number" id="rmBulkPostCount" class="input" min="1" max="52" value="3" />';
      html += '<button type="button" class="btn btn-primary" id="btnBulkCreatePosts" style="margin-top:12px;width:100%;">投稿カードを作成</button>';
      html += '</div>';
    }

    return html;
  }

  var memoViewMode = 'category';
  var memoOpenGroup = null;

  function renderMemoInlineHtml() {
    if (!sessionUser || sessionUser.role !== 'student') return '';
    var memos = memosForStudent(sessionUser.id);
    var html = '<div class="card"><p class="card-title">学んだこと・気づきを記録</p>';
    html += '<label class="label">カテゴリ</label>';
    html += '<select id="memoCategorySelect" class="input">';
    html += '<option value="">選択してください</option>';
    getCalendarSchedulePresets().forEach(function (c) {
      html += '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
    });
    html += '</select>';
    html += '<div id="memoOtherRow" class="cal-other-row" style="display:none;">';
    html += '<input type="text" id="memoOtherText" class="input" placeholder="カテゴリを入力" maxlength="30" />';
    html += '</div>';
    html += '<label class="label">メモ</label>';
    html += '<textarea id="memoTextInput" class="input" rows="3" placeholder="何を学んだ？気づいたことは？"></textarea>';
    html += '<button type="button" class="btn btn-primary" id="memoAddBtnInline" style="margin-top:8px;width:100%;">保存する</button>';
    html += '</div>';

    if (memos.length > 0) {
      html += '<div class="memo-view-tabs">';
      html += '<button type="button" class="memo-view-tab' + (memoViewMode === 'category' ? ' active' : '') + '" data-memo-view="category">カテゴリ別</button>';
      html += '<button type="button" class="memo-view-tab' + (memoViewMode === 'date' ? ' active' : '') + '" data-memo-view="date">日付別</button>';
      html += '</div>';

      if (memoViewMode === 'category') {
        html += renderMemoByCategoryHtml(memos);
      } else {
        html += renderMemoByDateHtml(memos);
      }
    }

    return html;
  }

  function renderMemoByCategoryHtml(memos) {
    var groups = {};
    memos.forEach(function (m) {
      var cat = m.category || 'その他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    var html = '';
    var presets = getCalendarSchedulePresets();
    var seen = {};
    var catOrder = [];
    presets.forEach(function (c) {
      if (seen[c]) return;
      seen[c] = true;
      catOrder.push(c);
    });
    Object.keys(groups).sort().forEach(function (c) {
      if (seen[c]) return;
      seen[c] = true;
      catOrder.push(c);
    });
    catOrder.forEach(function (cat) {
      if (!groups[cat] || groups[cat].length === 0) return;
      var items = groups[cat];
      var isOpen = memoOpenGroup === cat;
      html += '<div class="card memo-group-card">';
      html += '<button type="button" class="memo-group-head" data-memo-group="' + escapeHtml(cat) + '">';
      html += '<span class="memo-group-title">' + escapeHtml(cat) + '</span>';
      html += '<span class="memo-group-count">' + items.length + '件</span>';
      html += '<span class="memo-group-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
      html += '</button>';
      if (isOpen) {
        html += '<div class="memo-group-body">';
        items.slice(0, 20).forEach(function (m) {
          html += '<div class="memo-entry">';
          html += '<div class="memo-head"><span class="memo-date">' + shortDate(m.date) + '</span></div>';
          html += '<div class="memo-text">' + escapeHtml(m.text) + '</div></div>';
        });
        if (items.length > 20) {
          html += '<p class="memo-more">他 ' + (items.length - 20) + '件</p>';
        }
        html += '</div>';
      }
      html += '</div>';
    });
    return html;
  }

  function renderMemoByDateHtml(memos) {
    var groups = {};
    memos.forEach(function (m) {
      var key = (m.date || '').slice(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    var months = Object.keys(groups).sort().reverse();
    var html = '';
    months.forEach(function (ym) {
      var items = groups[ym];
      var parts = ym.split('-');
      var label = parts.length === 2 ? (parseInt(parts[1], 10) + '月') : ym;
      var isOpen = memoOpenGroup === ym;
      html += '<div class="card memo-group-card">';
      html += '<button type="button" class="memo-group-head" data-memo-group="' + escapeHtml(ym) + '">';
      html += '<span class="memo-group-title">' + escapeHtml(label) + '</span>';
      html += '<span class="memo-group-count">' + items.length + '件</span>';
      html += '<span class="memo-group-arrow">' + (isOpen ? '▲' : '▼') + '</span>';
      html += '</button>';
      if (isOpen) {
        html += '<div class="memo-group-body">';
        items.slice(0, 20).forEach(function (m) {
          var catTag = m.category ? '<span class="memo-cat-tag">' + escapeHtml(m.category) + '</span>' : '';
          html += '<div class="memo-entry">';
          html += '<div class="memo-head"><span class="memo-date">' + shortDate(m.date) + '</span>' + catTag + '</div>';
          html += '<div class="memo-text">' + escapeHtml(m.text) + '</div></div>';
        });
        if (items.length > 20) {
          html += '<p class="memo-more">他 ' + (items.length - 20) + '件</p>';
        }
        html += '</div>';
      }
      html += '</div>';
    });
    return html;
  }

  function bindRoadmapEvents(container) {
    container.querySelectorAll('[data-rm-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        roadmapView = btn.getAttribute('data-rm-tab');
        renderRoadmap();
      });
    });

    container.querySelectorAll('[data-toggle-starter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleStarterStep(btn.getAttribute('data-toggle-starter'));
      });
    });

    container.querySelectorAll('[data-toggle-milestone]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleMilestone(btn.getAttribute('data-toggle-milestone'));
      });
    });

    container.querySelectorAll('[data-toggle-stask]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-toggle-stask').split('|');
        toggleSessionTask(parts[0], parts[1]);
      });
    });

    container.querySelectorAll('[data-del-stask]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-del-stask').split('|');
        if (confirm('このタスクを削除しますか？')) {
          deleteSessionTask(parts[0], parts[1]);
        }
      });
    });

    function toggleRmSessionTaskCustomField(selEl) {
      if (!selEl) return;
      var sid = selEl.getAttribute('data-session-lib');
      if (!sid) return;
      var block = selEl.closest('.rm-session-add-block');
      var custom = block ? block.querySelector('[data-session-custom="' + sid + '"]') : null;
      if (!custom) return;
      if (selEl.value === SESSION_TASK_OTHER_LABEL) {
        custom.classList.remove('hidden');
      } else {
        custom.classList.add('hidden');
        custom.value = '';
      }
    }

    container.querySelectorAll('[data-session-lib]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        toggleRmSessionTaskCustomField(sel);
      });
      toggleRmSessionTaskCustomField(sel);
    });

    container.querySelectorAll('[data-add-stask]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sessId = btn.getAttribute('data-add-stask');
        var selEl = container.querySelector('[data-session-lib="' + sessId + '"]');
        var dueEl = container.querySelector('[data-session-due="' + sessId + '"]');
        var pick = selEl ? selEl.value : '';
        var due = dueEl ? dueEl.value : '';
        if (!pick) { alert('タスクを選択してください。'); return; }
        var title = pick;
        if (pick === '投稿' || pick === '投稿する') {
          var sessForOrd = db.coachingSessions.find(function (s) { return s.id === sessId; });
          title = (sessForOrd ? nextSessionPostActionOrdinal(sessForOrd) : 1) + '投稿';
          addSessionTask(sessId, title, due, { manualPostTask: true });
        } else if (pick === SESSION_TASK_OTHER_LABEL) {
          var block = selEl.closest('.rm-session-add-block');
          var customEl = block ? block.querySelector('[data-session-custom="' + sessId + '"]') : null;
          title = customEl ? customEl.value.trim() : '';
          if (!title) { alert('タスク名を入力してください。'); return; }
        }
        if (!(pick === '投稿' || pick === '投稿する')) {
          addSessionTask(sessId, title, due);
        }
        if (selEl) selEl.value = '';
        var blk = selEl ? selEl.closest('.rm-session-add-block') : null;
        var ce = blk && sessId ? blk.querySelector('[data-session-custom="' + sessId + '"]') : null;
        if (ce) {
          ce.value = '';
          ce.classList.add('hidden');
        }
        renderRoadmap();
        renderSchedule();
        renderHome();
      });
    });

    var regBtn = container.querySelector('#btnRegisterSessionSlot');
    if (regBtn) {
      regBtn.addEventListener('click', function () {
        var dateEl = container.querySelector('#rmNewSessionDate');
        var slotEl = container.querySelector('#rmNewSessionSlot');
        var d = dateEl ? dateEl.value : '';
        var slot = slotEl ? slotEl.value : '1';
        if (!d) { alert('日付を選んでください。'); return; }
        if (!slot) { alert('回を選んでください。'); return; }
        ensureCoachingSessionSlot(sessionUser.id, parseInt(slot, 10), d);
        renderRoadmap();
        renderSchedule();
        renderHome();
      });
    }

    container.querySelectorAll('[data-rm-create-next-and-posts]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var nextNum = parseInt(btn.getAttribute('data-rm-create-next-and-posts'), 10);
        if (isNaN(nextNum)) return;
        var wrap = btn.closest('.rm-session-create-next-wrap');
        var dateInp = wrap ? wrap.querySelector('[data-rm-next-slot-date="' + nextNum + '"]') : null;
        var cntInp = wrap ? wrap.querySelector('[data-rm-next-slot-post-count="' + nextNum + '"]') : null;
        var d = dateInp ? String(dateInp.value || '').trim() : '';
        var cnt = cntInp ? cntInp.value : '';
        if (!d) {
          alert('実施日を選んでください。');
          return;
        }
        var vErr = validateBulkPostsUntilSessionParams(d, cnt);
        if (vErr) {
          alert(vErr);
          return;
        }
        var created = ensureCoachingSessionSlot(sessionUser.id, nextNum, d);
        if (!created) {
          alert('セッションを作成できませんでした。');
          return;
        }
        var cntNum = parseInt(String(cnt || '').trim(), 10);
        if (!isNaN(cntNum) && cntNum >= 1) {
          var prevNum = nextNum - 1;
          var prevSess = db.coachingSessions.find(function (s) {
            return s.studentUserId === sessionUser.id && parseInt(s.sessionNum, 10) === prevNum;
          });
          if (prevSess) {
            prevSess.postSlotsTarget = Math.max(0, Math.min(52, cntNum));
            ensureCoachingSessionPostSlotTasks(prevSess);
            saveDb();
          }
        }
        bulkCreatePostsUntilSession(d, cnt, { stayOnCurrentTab: true });
      });
    });

    var bulkPostsBtn = container.querySelector('#btnBulkCreatePosts');
    if (bulkPostsBtn) {
      bulkPostsBtn.addEventListener('click', function () {
        var dEl = document.getElementById('rmBulkSessionDate');
        var nEl = document.getElementById('rmBulkPostCount');
        var sessionDate = dEl ? String(dEl.value || '').trim() : '';
        var cnt = nEl ? nEl.value : '';
        if (!sessionDate) {
          alert('次回セッションの日付を選んでください。');
          return;
        }
        bulkCreatePostsUntilSession(sessionDate, cnt, { stayOnCurrentTab: true });
      });
    }

    container.querySelectorAll('[data-rm-check-all-tasks]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-rm-check-all-tasks');
        if (!sid) return;
        markAllSessionTasksDone(sid);
      });
    });

    container.querySelectorAll('[data-rm-sess-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-rm-sess-tab');
        var key = btn.getAttribute('data-rm-sess-tabkey');
        if (key === 'mg') key = 'next';
        roadmapSessionCardTab[sid] = key;
        renderRoadmap();
      });
    });

    container.querySelectorAll('[data-rm-session-date-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-rm-session-date-save');
        var inp = container.querySelector('[data-rm-session-date="' + sid + '"]');
        updateCoachingSessionDate(sid, inp ? inp.value : '');
      });
    });

    container.querySelectorAll('[data-rm-session-date-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-rm-session-date-toggle');
        var wrap = container.querySelector('[data-rm-session-date-wrap="' + sid + '"]');
        if (!wrap) return;
        wrap.classList.toggle('hidden');
        if (!wrap.classList.contains('hidden')) {
          var inp = wrap.querySelector('.rm-session-date-input');
          if (inp) inp.focus();
        }
      });
    });

    function syncNextSessionHiddenFromUi(c, sid) {
      var h = c.querySelector('[data-rm-session-next-at="' + sid + '"]');
      var dEl = c.querySelector('[data-rm-next-date="' + sid + '"]');
      var tEl = c.querySelector('[data-rm-next-time="' + sid + '"]');
      if (!h || !dEl || !tEl) return;
      h.value = composeNextSessionAtFromParts(dEl.value, tEl.value);
    }

    function revealNextGoalsManualSaveUi(c, sid) {
      var sendBtn = c.querySelector('[data-rm-session-next-save="' + sid + '"]');
      var savedLbl = c.querySelector('[data-rm-next-saved-note="' + sid + '"]');
      if (sendBtn) sendBtn.classList.remove('hidden');
      if (savedLbl) savedLbl.classList.add('hidden');
    }

    function flushNextGoalsSaveFromContainer(c, sid, skipRoadmap, opts) {
      opts = opts || {};
      var manualSave = !!opts.manualSave;
      syncNextSessionHiddenFromUi(c, sid);
      var nextEl = c.querySelector('[data-rm-session-next-at="' + sid + '"]');
      var gStuEl = c.querySelector('[data-rm-session-goal-stu="' + sid + '"]');
      var gMgEl = c.querySelector('[data-rm-session-goal-mg="' + sid + '"]');
      var slotsEl = c.querySelector('[data-rm-post-slots-target="' + sid + '"]');
      saveCoachingSessionNextAndGoals(
        sid,
        nextEl ? nextEl.value : '',
        gStuEl ? gStuEl.value : '',
        gMgEl ? gMgEl.value : undefined,
        !!skipRoadmap,
        slotsEl ? slotsEl.value : undefined
      );
      var toast = c.querySelector('[data-rm-next-toast="' + sid + '"]');
      var sendBtn = c.querySelector('[data-rm-session-next-save="' + sid + '"]');
      var savedLbl = c.querySelector('[data-rm-next-saved-note="' + sid + '"]');
      if (toast) {
        toast.classList.remove('hidden');
        setTimeout(function () {
          toast.classList.add('hidden');
        }, manualSave ? 2200 : 1400);
      }
      if (manualSave && sendBtn && savedLbl) {
        sendBtn.classList.add('hidden');
        savedLbl.classList.remove('hidden');
      }
    }

    function scheduleNextGoalsDebounced(c, sid) {
      if (roadmapNextGoalsTimers[sid]) clearTimeout(roadmapNextGoalsTimers[sid]);
      roadmapNextGoalsTimers[sid] = setTimeout(function () {
        roadmapNextGoalsTimers[sid] = null;
        flushNextGoalsSaveFromContainer(c, sid, true);
      }, 550);
    }

    container.querySelectorAll('[data-rm-next-autosave]').forEach(function (el) {
      var sid = el.getAttribute('data-rm-next-autosave');
      if (!sid) return;
      function onNextGoalsFieldChange() {
        syncNextSessionHiddenFromUi(container, sid);
        revealNextGoalsManualSaveUi(container, sid);
        scheduleNextGoalsDebounced(container, sid);
      }
      el.addEventListener('input', onNextGoalsFieldChange);
      el.addEventListener('change', onNextGoalsFieldChange);
    });

    container.querySelectorAll('[data-rm-session-next-save]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-rm-session-next-save');
        if (roadmapNextGoalsTimers[sid]) {
          clearTimeout(roadmapNextGoalsTimers[sid]);
          roadmapNextGoalsTimers[sid] = null;
        }
        flushNextGoalsSaveFromContainer(container, sid, true, { manualSave: true });
      });
    });

  }

  function bindMemoEvents(container) {
    var catSelect = container.querySelector('#memoCategorySelect');
    var otherRow = container.querySelector('#memoOtherRow');
    if (catSelect && otherRow) {
      catSelect.addEventListener('change', function () {
        otherRow.style.display = catSelect.value === 'その他' ? '' : 'none';
      });
    }

    var memoBtn = container.querySelector('#memoAddBtnInline');
    if (memoBtn) {
      memoBtn.addEventListener('click', function () {
        var catEl = container.querySelector('#memoCategorySelect');
        var textEl = container.querySelector('#memoTextInput');
        var category = catEl ? catEl.value : '';
        var text = textEl ? textEl.value.trim() : '';
        if (!category) { alert('カテゴリを選択してください。'); return; }
        if (category === 'その他') {
          var otherEl = container.querySelector('#memoOtherText');
          var otherText = otherEl ? otherEl.value.trim() : '';
          if (!otherText) { alert('カテゴリを入力してください。'); return; }
          category = otherText;
        }
        if (!text) { alert('メモを入力してください。'); return; }
        db.memos.push({
          id: uid('memo'),
          studentUserId: sessionUser.id,
          date: todayIso(),
          category: category,
          text: text,
          createdAt: new Date().toISOString(),
        });
        saveDb();
        memoOpenGroup = category;
        renderSchedule();
      });
    }

    container.querySelectorAll('[data-memo-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        memoViewMode = btn.getAttribute('data-memo-view');
        memoOpenGroup = null;
        renderSchedule();
      });
    });

    container.querySelectorAll('[data-memo-group]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-memo-group');
        memoOpenGroup = (memoOpenGroup === key) ? null : key;
        renderSchedule();
      });
    });
  }

  // === My Page ===

  // === 目標カード + 次の投稿予定 ===

  function visionCardHtml(u) {
    ensureProfile(u);
    var p = u.profile;
    var totalGoalPosts = parseInt(p.goalPostCount, 10);
    if (isNaN(totalGoalPosts) || totalGoalPosts < 0) totalGoalPosts = 0;
    var pacePlan = buildPostPacePlan(totalGoalPosts);
    var html = '<div class="vision-card">';
    html += '<div class="vision-header">';
    html += '<p class="vh-label">MY VISION</p>';
    html += '<p class="vh-name">' + escapeHtml(u.name.replace(/（.*$/, '').replace(/\(.*$/, '')) + ' の目標</p>';
    html += '<button type="button" class="vision-edit-btn" data-open-goals-editor>編集</button>';
    html += '</div>';
    html += '<div class="vision-body">';

    html += '<div class="vision-item">';
    html += '<p class="vi-label">🌟 将来なりたい姿（人生のビジョン）</p>';
    html += '<p class="vi-text' + (p.visionLife ? '' : ' empty') + '">' + (p.visionLife ? escapeHtml(p.visionLife) : 'まだ設定されていません') + '</p>';
    html += '</div>';

    html += '<div class="vision-item">';
    html += '<p class="vi-label">🎯 この半年間で成し遂げたいこと</p>';
    html += '<p class="vi-text' + (p.goalHalfYear ? '' : ' empty') + '">' + (p.goalHalfYear ? escapeHtml(p.goalHalfYear) : 'まだ設定されていません') + '</p>';
    html += '</div>';

    html += '<div class="vision-item">';
    html += '<p class="vi-label">📊 半年で達成したい投稿数</p>';
    html += '<p class="vi-text' + (totalGoalPosts > 0 ? '' : ' empty') + '">' + (totalGoalPosts > 0 ? (escapeHtml(String(totalGoalPosts)) + '投稿') : 'まだ設定されていません') + '</p>';
    if (pacePlan) {
      html += '<div class="vision-pace">';
      html += '<p class="vp-head">最初の1ヶ月は <strong>' + pacePlan.month1 + '投稿</strong> を目標にします</p>';
      html += '<p class="vp-sub">2ヶ月目以降は徐々に投稿ペースを上げる目安です</p>';
      html += '<div class="vp-grid">';
      pacePlan.monthly.forEach(function (row) {
        html += '<span class="vp-chip">' + row.label + ': ' + row.count + '投稿</span>';
      });
      html += '</div></div>';
    }
    html += '</div>';

    html += '</div>';
    html += '<div class="vision-edit-hint" data-open-goals-editor>タップして編集 →</div>';
    html += '</div>';
    return html;
  }

  function buildPostPacePlan(totalGoalPosts) {
    if (!totalGoalPosts || totalGoalPosts < 1) return null;
    var month1 = Math.min(1, totalGoalPosts);
    var remaining = Math.max(0, totalGoalPosts - month1);
    var weights = [1, 2, 3, 4, 5];
    var weightSum = 15;
    var rest = [];
    var allocated = 0;
    for (var i = 0; i < weights.length; i++) {
      var base = Math.floor((remaining * weights[i]) / weightSum);
      rest.push(base);
      allocated += base;
    }
    var rem = remaining - allocated;
    for (var j = rest.length - 1; j >= 0 && rem > 0; j--) {
      rest[j]++;
      rem--;
    }
    return {
      month1: month1,
      monthly: [
        { label: '1ヶ月目', count: month1 },
        { label: '2ヶ月目', count: rest[0] },
        { label: '3ヶ月目', count: rest[1] },
        { label: '4ヶ月目', count: rest[2] },
        { label: '5ヶ月目', count: rest[3] },
        { label: '6ヶ月目', count: rest[4] },
      ],
    };
  }

  function snsUrl(raw, platform) {
    if (!raw) return '';
    const s = raw.trim();
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (platform === 'instagram') return 'https://www.instagram.com/' + s.replace(/^@/, '') + '/';
    if (platform === 'tiktok') return 'https://www.tiktok.com/@' + s.replace(/^@/, '');
    if (platform === 'youtube') return 'https://www.youtube.com/@' + s.replace(/^@/, '');
    return s;
  }

  function snsDisplayName(raw) {
    if (!raw) return '';
    const s = raw.trim();
    if (s.startsWith('http')) {
      try { return new URL(s).pathname.replace(/^\//, '').replace(/\/$/, ''); } catch (e) { return s; }
    }
    return s;
  }

  function monthsElapsed(startDateStr) {
    if (!startDateStr) return null;
    const s = new Date(startDateStr + 'T00:00:00');
    if (isNaN(s.getTime())) return null;
    const now = new Date();
    let m = (now.getFullYear() - s.getFullYear()) * 12 + (now.getMonth() - s.getMonth());
    if (now.getDate() < s.getDate()) m--;
    return Math.max(0, m);
  }

  function totalPostCount(studentId) {
    return db.tasks
      .filter((t) => t.studentUserId === studentId && t.type === 'post_goal')
      .reduce((sum, t) => sum + (t.currentNumber || 0), 0);
  }

  function totalSessionCount(studentId) {
    return db.tasks
      .filter((t) => t.studentUserId === studentId && t.type === 'coaching_session')
      .reduce((sum, t) => sum + (t.currentNumber || 0), 0);
  }

  function totalLectureCount(studentId) {
    return db.tasks
      .filter((t) => t.studentUserId === studentId && t.type === 'lecture')
      .reduce((sum, t) => sum + (t.currentNumber || 0), 0);
  }

  function renderMypage() {
    const el = document.getElementById('mypageContent');
    if (!el) return;
    const u = sessionUser;
    ensureProfile(u);
    const p = u.profile;
    const isStudent = u.role === 'student';

    let html = '';

    // --- avatar + name ---
    html += '<div class="card profile-main-card">';
    html += '<button type="button" class="card-edit-btn" data-open-profile-editor>編集</button>';
    html += '<div class="avatar-area">';
    if (p.avatarDataUrl) {
      html += '<div class="avatar-circle" id="avatarCircle"><img src="' + p.avatarDataUrl + '" alt="avatar" /></div>';
    } else {
      html += '<div class="avatar-circle" id="avatarCircle"><span class="avatar-placeholder">👤</span></div>';
    }
    html += '<button type="button" class="avatar-change" id="btnChangeAvatar">写真を変更</button>';
    html += '<input type="file" id="avatarFileInput" accept="image/*" style="display:none;" />';
    html += '</div>';
    html += '<p style="margin:0;text-align:center;font-size:1.15rem;font-weight:700;">' + escapeHtml(u.name) + '</p>';
    html += '<p style="margin:4px 0 0;text-align:center;font-size:0.8rem;color:var(--muted);">' + escapeHtml(u.email) + '</p>';
    html += '<p style="margin:6px 0 0;text-align:center;"><span class="role-chip" style="color:var(--text);background:#e0f2fe;">' + ROLE_LABELS[u.role] + '</span></p>';
    if (isStudent && p.className) {
      html += '<p style="margin:6px 0 0;text-align:center;font-size:0.8rem;color:var(--muted);">所属: ' + escapeHtml(p.className) + '</p>';
    }
    if (isStudent) {
      var gradMain = graduationDateOf(u);
      if (p.startDate) {
        html += '<p class="profile-period-line">開始: ' + shortDate(p.startDate) + '　卒業: ' + shortDate(gradMain) + '</p>';
      }
      var snsLinks = [
        { key: 'instagram', label: 'Instagram', icon: '📸', val: p.instagram },
        { key: 'tiktok', label: 'TikTok', icon: '🎵', val: p.tiktok },
        { key: 'youtube', label: 'YouTube', icon: '▶️', val: p.youtube },
      ];
      var hasSns = snsLinks.some(function (l) {
        return !!l.val;
      });
      html += '<div class="profile-sns-block">';
      if (hasSns) {
        html += '<p class="profile-sns-lead">登録したアカウント（タップで開く）</p>';
        html += '<div class="sns-links">';
        snsLinks.forEach(function (l) {
          if (!l.val) return;
          var url = snsUrl(l.val, l.key);
          var display = snsDisplayName(l.val);
          html += '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="sns-link-row">';
          html += '<span class="sns-icon">' + l.icon + '</span>';
          html += '<span class="sns-handle"><span class="sns-handle-platform">' + escapeHtml(l.label) + '</span>';
          html += '<span class="sns-handle-url">' + escapeHtml(url) + '</span></span>';
          html += '<span class="sns-arrow">→</span></a>';
        });
        html += '</div>';
      } else {
        html += '<p class="profile-sns-empty">SNSのURL・IDは右上の「編集」から登録できます。</p>';
      }
      html += '</div>';
    }
    html += '</div>';

    // --- 目標カード（常時表示） ---
    if (isStudent) {
      html += visionCardHtml(u);
    }

    // --- stats + dates (student) ---
    if (isStudent) {
      var me = monthsElapsed(p.startDate);
      html += '<div class="card"><p class="card-title">これまでの実績</p>';
      html += '<div class="stat-banner">';
      html += '<div class="stat-box"><div class="num">' + (me !== null ? me : '-') + '</div><div class="lbl">ヶ月目</div></div>';
      html += '<div class="stat-box"><div class="num">' + totalPostCount(u.id) + '</div><div class="lbl">累計投稿</div></div>';
      html += '<div class="stat-box"><div class="num">' + totalSessionCount(u.id) + '</div><div class="lbl">コーチング</div></div>';
      html += '<div class="stat-box"><div class="num">' + totalLectureCount(u.id) + '</div><div class="lbl">講義</div></div>';
      html += '</div>';
      html += '</div>';
    }

    // --- ペース設定 (student) ---
    if (isStudent) {
      html += paceSettingsHtml();
    }

    // --- 定期タスク (student) ---
    if (isStudent) {
      html += recurringTasksHtml();
    }

    // --- メモへのリンク ---
    if (isStudent) {
      html += '<div class="card" style="text-align:center;">';
      html += '<button type="button" class="btn btn-secondary" id="btnGoToMemo" style="width:100%;">🗒️ メモを見る・書く</button>';
      html += '</div>';
    }

    html += '<button type="button" class="btn btn-secondary" id="btnLogout" style="margin-top:8px;">ログアウト</button>';
    el.innerHTML = html;

    // --- bindings ---
    document.getElementById('btnLogout').addEventListener('click', logout);

    document.getElementById('btnChangeAvatar').addEventListener('click', function () {
      document.getElementById('avatarFileInput').click();
    });
    document.getElementById('avatarCircle').addEventListener('click', function () {
      document.getElementById('avatarFileInput').click();
    });
    document.getElementById('avatarFileInput').addEventListener('change', handleAvatarUpload);

    el.querySelectorAll('[data-open-goals-editor]').forEach(function (btn) {
      btn.addEventListener('click', function () { openGoalsEditor(); });
    });
    el.querySelectorAll('[data-open-profile-editor]').forEach(function (btn) {
      btn.addEventListener('click', function () { openProfileEditor(); });
    });

    if (isStudent) {
      bindPaceButtons(el);
      bindRecurringButtons(el);
    }

    var btnGoToMemo = document.getElementById('btnGoToMemo');
    if (btnGoToMemo) {
      btnGoToMemo.addEventListener('click', function () {
        scheduleSubTab = 'memo';
        setTab('schedule');
      });
    }

  }

  function handleAvatarUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500000) {
      alert('画像が大きすぎます（500KB以下にしてください）');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var canvas = document.createElement('canvas');
      var img = new Image();
      img.onload = function () {
        var size = 200;
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        var s = Math.min(img.width, img.height);
        var sx = (img.width - s) / 2;
        var sy = (img.height - s) / 2;
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        ensureProfile(sessionUser);
        sessionUser.profile.avatarDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        saveDb();
        renderMypage();
        updateHeader();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function openGoalsEditor() {
    setTab('goals');
    renderGoalsEditor();
  }

  function openProfileEditor() {
    setTab('profile');
    renderProfileEditor();
  }

  function renderGoalsEditor() {
    var el = document.getElementById('goalsContent');
    if (!el || !sessionUser || sessionUser.role !== 'student') return;
    ensureProfile(sessionUser);
    var p = sessionUser.profile;
    var goalCount = parseInt(p.goalPostCount, 10);
    if (isNaN(goalCount) || goalCount < 0) goalCount = 0;
    var pacePlan = buildPostPacePlan(goalCount);

    var html = '<button type="button" class="chat-back" id="goalsBack">← マイページに戻る</button>';
    html += '<div class="card" id="goalEditCard"><p class="card-title">目標の編集</p>';
    html += '<label class="label">🌟 将来なりたい姿（人生のビジョン）</label>';
    html += '<textarea id="editVisionLife" class="input" rows="3" placeholder="例：家族と過ごす時間を自由にコントロールできる生活">' + escapeHtml(p.visionLife || '') + '</textarea>';
    html += '<label class="label">🎯 この半年間で成し遂げたいこと</label>';
    html += '<textarea id="editGoalHalfYear" class="input" rows="4" placeholder="・100投稿完了し、万垢達成する!!!&#10;・卒業するときに、発信力が身についたと自信持てる状態にする！">' + escapeHtml(p.goalHalfYear || '') + '</textarea>';
    html += '<label class="label">📊 半年で達成したい投稿数（投稿）</label>';
    html += '<input type="number" id="editGoalPostCount" class="input" min="1" value="' + (goalCount > 0 ? goalCount : '') + '" placeholder="例：100" />';
    html += '<button type="button" class="btn btn-primary" id="btnSaveGoals" style="margin-bottom:8px;">目標を保存</button>';
    html += '</div>';

    if (pacePlan) {
      html += '<div class="card"><p class="card-title">投稿ペースの目安</p>';
      html += '<p style="margin:0 0 8px;font-size:0.9rem;">1ヶ月目は <strong>' + pacePlan.month1 + '投稿</strong> を目標に、2ヶ月目以降は徐々に投稿数を増やします。</p>';
      html += '<div class="vp-grid">';
      pacePlan.monthly.forEach(function (row) {
        html += '<span class="vp-chip">' + row.label + ': ' + row.count + '投稿</span>';
      });
      html += '</div></div>';
    }

    el.innerHTML = html;
    document.getElementById('goalsBack').addEventListener('click', function () { setTab('mypage'); });
    document.getElementById('btnSaveGoals').addEventListener('click', saveGoals);
  }

  function saveGoals() {
    var u = sessionUser;
    ensureProfile(u);
    var v1 = document.getElementById('editVisionLife');
    var v2 = document.getElementById('editGoalHalfYear');
    var v3 = document.getElementById('editGoalPostCount');
    if (v1) u.profile.visionLife = v1.value.trim();
    if (v2) u.profile.goalHalfYear = v2.value.trim();
    if (v3) {
      var n = parseInt(v3.value, 10);
      u.profile.goalPostCount = !isNaN(n) && n > 0 ? String(n) : '';
    }
    saveDb();
    renderAll();
  }

  function renderProfileEditor() {
    var el = document.getElementById('profileContent');
    if (!el || !sessionUser) return;
    ensureProfile(sessionUser);
    var u = sessionUser;
    var p = u.profile;
    var isStudent = u.role === 'student';

    var html = '<button type="button" class="chat-back" id="profileBack">← マイページに戻る</button>';
    html += '<div class="card"><p class="card-title">プロフィール編集</p>';
    html += '<label class="label">表示名</label><input type="text" id="editName" class="input" value="' + escapeHtml(u.name) + '" maxlength="40" />';
    if (isStudent) {
      html += '<label class="label">所属クラス</label><input type="text" id="editClass" class="input" value="' + escapeHtml(p.className || '') + '" placeholder="例: 4期生" maxlength="30" />';
      html += '<label class="label">Instagram（IDまたはURL）</label><input type="text" id="editIG" class="input" value="' + escapeHtml(p.instagram || '') + '" placeholder="@username" />';
      html += '<label class="label">TikTok（IDまたはURL）</label><input type="text" id="editTT" class="input" value="' + escapeHtml(p.tiktok || '') + '" placeholder="@username" />';
      html += '<label class="label">YouTube（IDまたはURL）</label><input type="text" id="editYT" class="input" value="' + escapeHtml(p.youtube || '') + '" placeholder="@channel" />';
      html += '<label class="label">プログラム開始日</label><input type="date" id="editStart" class="input" value="' + escapeHtml(p.startDate || '') + '" />';
    }
    html += '<button type="button" class="btn btn-primary" id="btnSaveProfile">プロフィールを保存</button>';
    html += '</div>';

    el.innerHTML = html;
    document.getElementById('profileBack').addEventListener('click', function () { setTab('mypage'); });
    document.getElementById('btnSaveProfile').addEventListener('click', function () {
      saveProfile();
      setTab('mypage');
    });
  }

  function saveProfile() {
    var u = sessionUser;
    ensureProfile(u);
    var nameEl = document.getElementById('editName');
    if (nameEl && nameEl.value.trim()) u.name = nameEl.value.trim();
    if (u.role === 'student') {
      var clsEl = document.getElementById('editClass');
      var igEl = document.getElementById('editIG');
      var ttEl = document.getElementById('editTT');
      var ytEl = document.getElementById('editYT');
      var sdEl = document.getElementById('editStart');
      if (clsEl) u.profile.className = clsEl.value.trim();
      if (igEl) u.profile.instagram = igEl.value.trim();
      if (ttEl) u.profile.tiktok = ttEl.value.trim();
      if (ytEl) u.profile.youtube = ytEl.value.trim();
      if (sdEl) u.profile.startDate = sdEl.value;
    }
    saveDb();
    updateHeader();
    renderAll();
  }

  // === Chat ===

  function getManagerForStudent(studentUser) {
    if (!studentUser || !studentUser.links) return null;
    return getUserById(studentUser.links.managerId) || null;
  }

  function openChat(partnerId) {
    chatPartnerId = partnerId;
    setTab('chat');
    renderChat();
  }

  function chatMessages(userA, userB) {
    return db.messages.filter(function (m) {
      return (m.fromUserId === userA && m.toUserId === userB) ||
             (m.fromUserId === userB && m.toUserId === userA);
    }).sort(function (a, b) {
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });
  }

  function chatMessageCount(userA, userB) {
    return chatMessages(userA, userB).length;
  }

  // === 相談（ボイスメモ → 要約 → カテゴリ） ===

  var CONSULT_CATEGORIES = [
    { key: 'time',       label: '⏰ 時間が作れない',       keywords: ['時間', 'じかん', '忙しい', '余裕', 'バタバタ', '仕事', 'パート', '子供', '子ども', '家事', '育児'] },
    { key: 'idea',       label: '💡 ネタ・テーマに悩む',    keywords: ['ネタ', 'テーマ', '何を書', '何を投稿', '内容', 'アイデア', '思いつかない', '浮かばない'] },
    { key: 'motivation', label: '😔 モチベーション低下',    keywords: ['やる気', 'モチベ', 'つらい', '辛い', '不安', '続かない', '自信', '比較', '落ち込'] },
    { key: 'howto',      label: '🔧 投稿の作り方がわからない', keywords: ['やり方', '方法', '作り方', 'わからない', '分からない', 'どうやって', '操作', '編集', 'ツール'] },
    { key: 'review',     label: '📝 添削・フィードバック',  keywords: ['添削', 'フィードバック', '修正', '直し', 'ダメ', 'やり直'] },
    { key: 'growth',     label: '📈 伸び・フォロワー',      keywords: ['伸び', 'フォロワー', 'いいね', '反応', 'リーチ', 'バズ', '増えない', 'PV'] },
    { key: 'tool',       label: '🛠 ツールの使い方',       keywords: ['使い方', 'ツール', 'アプリ', '操作', 'ボタン', '設定', 'ログイン', '画面', 'どこ', '見方', '入力'] },
    { key: 'other',      label: '❓ その他',               keywords: [] },
  ];

  function categorizeConsultation(text) {
    if (!text) return [{ key: 'other', label: '❓ その他' }];
    var found = [];
    CONSULT_CATEGORIES.forEach(function (cat) {
      if (cat.key === 'other') return;
      var match = cat.keywords.some(function (kw) { return text.indexOf(kw) >= 0; });
      if (match) found.push({ key: cat.key, label: cat.label });
    });
    if (found.length === 0) found.push({ key: 'other', label: '❓ その他' });
    return found;
  }

  function summarizeConsultation(text) {
    if (!text || text.length < 10) return text || '（内容なし）';
    var sentences = text.replace(/([。！？\n])/g, '$1|').split('|').filter(function (s) { return s.trim().length > 0; });
    if (sentences.length <= 2) return text;
    return sentences.slice(0, 3).join('').trim() + (sentences.length > 3 ? '…' : '');
  }

  var consultRecording = false;
  var consultRecognition = null;
  var consultTranscript = '';

  function openConsultation(toUserId) {
    chatPartnerId = toUserId;
    consultTranscript = '';
    consultRecording = false;
    setTab('consult');
    renderConsultation();
  }

  function renderConsultation() {
    var el = document.getElementById('consultContent');
    if (!el) return;
    var partner = chatPartnerId ? getUserById(chatPartnerId) : null;

    var html = '<button type="button" class="chat-back" id="consultBack">← 戻る</button>';
    html += '<div class="card"><p class="card-title">MGに相談する</p>';
    if (partner) {
      html += '<p style="margin:0 0 12px;font-size:0.9rem;">💬 <strong>' + escapeHtml(partner.name) + '</strong> への相談</p>';
    }
    html += '<p style="margin:0 0 14px;font-size:0.85rem;color:var(--muted);line-height:1.5;">悩んでいることを声で話してください。文字に起こして要約します。テキストで入力もOKです。</p>';

    html += '<button type="button" class="consult-record-btn' + (consultRecording ? ' recording' : '') + '" id="consultRecordBtn">';
    html += consultRecording ? '🔴 録音中… タップして停止' : '🎙 タップして話す';
    html += '</button>';

    html += '<div class="consult-or">または</div>';
    html += '<textarea id="consultTextInput" class="input" rows="4" placeholder="テキストで相談内容を入力…">' + escapeHtml(consultTranscript) + '</textarea>';

    if (consultTranscript) {
      var cats = categorizeConsultation(consultTranscript);
      var summary = summarizeConsultation(consultTranscript);
      html += '<div class="consult-summary-card">';
      html += '<p class="cs-label">📋 自動要約</p>';
      html += '<p class="cs-text">' + escapeHtml(summary) + '</p>';
      html += '<p class="cs-label">🏷 カテゴリ</p>';
      html += '<div class="consult-categories">';
      cats.forEach(function (c) {
        html += '<span class="consult-cat-chip">' + c.label + '</span>';
      });
      html += '</div></div>';
    }

    html += '<button type="button" class="btn btn-primary" id="consultSendBtn" style="margin-top:14px;"' + (consultTranscript ? '' : ' disabled') + '>この内容でMGに送る</button>';
    html += '</div>';

    var prevConsults = (db.consultations || []).filter(function (c) { return c.studentUserId === sessionUser.id; }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    if (prevConsults.length > 0) {
      html += '<div class="card"><p class="card-title">過去の相談</p>';
      prevConsults.slice(0, 5).forEach(function (c) {
        var d = c.createdAt ? new Date(c.createdAt) : null;
        var dateStr = d ? (d.getMonth() + 1) + '/' + d.getDate() : '';
        html += '<div style="padding:10px 0;border-bottom:1px solid #f1f5f9;">';
        html += '<div style="font-size:0.75rem;color:var(--muted);">' + dateStr + '</div>';
        html += '<div style="font-size:0.85rem;font-weight:600;margin-top:2px;">' + escapeHtml(c.summary || '') + '</div>';
        if (c.categories && c.categories.length) {
          html += '<div class="consult-categories" style="margin-top:4px;">';
          c.categories.forEach(function (cat) {
            html += '<span class="consult-cat-chip">' + escapeHtml(cat.label) + '</span>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    el.innerHTML = html;

    document.getElementById('consultBack').addEventListener('click', function () {
      consultTranscript = '';
      consultRecording = false;
      setTab('home');
    });

    document.getElementById('consultRecordBtn').addEventListener('click', toggleVoiceRecording);

    document.getElementById('consultTextInput').addEventListener('input', function () {
      consultTranscript = this.value;
      var sendBtn = document.getElementById('consultSendBtn');
      if (sendBtn) sendBtn.disabled = !consultTranscript.trim();
    });

    document.getElementById('consultSendBtn').addEventListener('click', sendConsultation);
  }

  function toggleVoiceRecording() {
    if (consultRecording) {
      stopVoiceRecording();
      return;
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('お使いのブラウザでは音声入力に対応していません。テキストで入力してください。');
      return;
    }
    consultRecognition = new SpeechRecognition();
    consultRecognition.lang = 'ja-JP';
    consultRecognition.continuous = true;
    consultRecognition.interimResults = true;
    var finalText = consultTranscript;

    consultRecognition.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      consultTranscript = finalText + interim;
      var textEl = document.getElementById('consultTextInput');
      if (textEl) textEl.value = consultTranscript;
    };

    consultRecognition.onerror = function (e) {
      if (e.error !== 'aborted') {
        console.warn('Speech error:', e.error);
      }
      stopVoiceRecording();
    };

    consultRecognition.onend = function () {
      consultTranscript = finalText;
      stopVoiceRecording();
    };

    try {
      consultRecognition.start();
      consultRecording = true;
      renderConsultation();
    } catch (err) {
      alert('音声入力を開始できませんでした。');
    }
  }

  function stopVoiceRecording() {
    consultRecording = false;
    if (consultRecognition) {
      try { consultRecognition.stop(); } catch (e) {}
      consultRecognition = null;
    }
    renderConsultation();
  }

  function sendConsultation() {
    var text = consultTranscript.trim();
    if (!text) return;
    var cats = categorizeConsultation(text);
    var summary = summarizeConsultation(text);
    var consultation = {
      id: uid('consult'),
      studentUserId: sessionUser.id,
      toUserId: chatPartnerId,
      transcript: text,
      summary: summary,
      categories: cats,
      createdAt: new Date().toISOString(),
    };
    if (!Array.isArray(db.consultations)) db.consultations = [];
    db.consultations.push(consultation);

    db.messages.push({
      id: uid('msg'),
      fromUserId: sessionUser.id,
      toUserId: chatPartnerId,
      text: '【相談】\n' + summary + '\n\nカテゴリ: ' + cats.map(function (c) { return c.label; }).join(', '),
      createdAt: new Date().toISOString(),
    });

    saveDb();
    consultTranscript = '';
    consultRecording = false;
    alert('相談を送信しました！');
    setTab('home');
    renderAll();
  }

  function renderChat() {
    var el = document.getElementById('chatContent');
    if (!el) return;
    if (!chatPartnerId) {
      el.innerHTML = '<div class="empty-state">連絡先が選ばれていません</div>';
      return;
    }
    var partner = getUserById(chatPartnerId);
    if (!partner) {
      el.innerHTML = '<div class="empty-state">相手が見つかりません</div>';
      return;
    }
    var msgs = chatMessages(sessionUser.id, chatPartnerId);
    var html = '<button type="button" class="chat-back" id="chatBack">← 戻る</button>';
    html += '<div class="card" style="padding:12px;"><div style="display:flex;align-items:center;gap:10px;">';
    ensureProfile(partner);
    if (partner.profile.avatarDataUrl) {
      html += '<div class="avatar-circle" style="width:36px;height:36px;border-width:2px;font-size:1rem;cursor:default;"><img src="' + partner.profile.avatarDataUrl + '" alt="" /></div>';
    } else {
      html += '<div class="avatar-circle" style="width:36px;height:36px;border-width:2px;font-size:1rem;cursor:default;"><span class="avatar-placeholder" style="font-size:1rem;">👤</span></div>';
    }
    html += '<div><div style="font-weight:700;font-size:0.95rem;">' + escapeHtml(partner.name) + '</div>';
    html += '<div style="font-size:0.7rem;color:var(--muted);">' + ROLE_LABELS[partner.role] + '</div></div>';
    html += '</div></div>';

    html += '<div class="chat-messages" id="chatMsgList">';
    if (msgs.length === 0) {
      html += '<div class="empty-state" style="padding:16px 0;">メッセージはまだありません</div>';
    } else {
      msgs.forEach(function (m) {
        var mine = m.fromUserId === sessionUser.id;
        var t = m.createdAt ? new Date(m.createdAt) : null;
        var timeStr = t ? (t.getMonth() + 1) + '/' + t.getDate() + ' ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) : '';
        html += '<div class="chat-bubble ' + (mine ? 'mine' : 'theirs') + '">';
        html += escapeHtml(m.text);
        if (timeStr) html += '<span class="chat-time">' + timeStr + '</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    html += '<div class="chat-input-row">';
    html += '<input type="text" id="chatInput" placeholder="メッセージ…" maxlength="500" />';
    html += '<button type="button" class="chat-send-btn" id="chatSend">↑</button>';
    html += '</div>';

    el.innerHTML = html;

    document.getElementById('chatBack').addEventListener('click', function () {
      chatPartnerId = null;
      setTab('mypage');
    });

    var msgList = document.getElementById('chatMsgList');
    if (msgList) msgList.scrollTop = msgList.scrollHeight;

    var sendBtn = document.getElementById('chatSend');
    var inputEl = document.getElementById('chatInput');
    function doSend() {
      var text = inputEl.value.trim();
      if (!text) return;
      db.messages.push({
        id: uid('msg'),
        fromUserId: sessionUser.id,
        toUserId: chatPartnerId,
        text: text,
        createdAt: new Date().toISOString(),
      });
      saveDb();
      inputEl.value = '';
      renderChat();
    }
    sendBtn.addEventListener('click', doSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });
  }

  function bindEvents() {
    document.getElementById('formLogin').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      tryLogin(email, password);
    });

    document.querySelectorAll('.quick-login').forEach((btn) => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        const password = btn.getAttribute('data-password');
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = password;
        tryLogin(email, password);
      });
    });

    var linkForgot = document.getElementById('linkForgotPassword');
    if (linkForgot) {
      linkForgot.addEventListener('click', function () {
        var panel = document.getElementById('loginPasswordResetPanel');
        var step2 = document.getElementById('pwResetStep2');
        var le = document.getElementById('loginEmail');
        var re = document.getElementById('pwResetEmail');
        if (panel) panel.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
        if (re && le && le.value) re.value = le.value;
        if (re) {
          try {
            re.focus();
          } catch (err) { /* ignore */ }
        }
      });
    }
    var btnPwResetCancel = document.getElementById('btnPwResetCancel');
    if (btnPwResetCancel) {
      btnPwResetCancel.addEventListener('click', function () {
        resetLoginPasswordResetPanel();
      });
    }
    var btnPwResetRequest = document.getElementById('btnPwResetRequest');
    if (btnPwResetRequest) {
      btnPwResetRequest.addEventListener('click', function () {
        var emailEl = document.getElementById('pwResetEmail');
        var email = emailEl ? emailEl.value : '';
        var result = issuePasswordResetToken(email);
        if (!result) return;
        var step2 = document.getElementById('pwResetStep2');
        var disp = document.getElementById('pwResetCodeDisplay');
        if (disp) disp.textContent = result.token;
        if (step2) step2.classList.remove('hidden');
        var codeInp = document.getElementById('pwResetCode');
        if (codeInp) {
          codeInp.value = '';
          try {
            codeInp.focus();
          } catch (err) { /* ignore */ }
        }
      });
    }
    var btnPwResetComplete = document.getElementById('btnPwResetComplete');
    if (btnPwResetComplete) {
      btnPwResetComplete.addEventListener('click', function () {
        var emailEl = document.getElementById('pwResetEmail');
        var codeEl = document.getElementById('pwResetCode');
        var n1 = document.getElementById('pwResetNew');
        var n2 = document.getElementById('pwResetNew2');
        var ok = completePasswordResetWithToken(
          emailEl ? emailEl.value : '',
          codeEl ? codeEl.value : '',
          n1 ? n1.value : '',
          n2 ? n2.value : ''
        );
        if (!ok) return;
        alert('パスワードを更新しました。新しいパスワードでログインしてください。');
        resetLoginPasswordResetPanel();
        var le = document.getElementById('loginEmail');
        var lp = document.getElementById('loginPassword');
        if (le && emailEl) le.value = emailEl.value;
        if (lp) lp.value = '';
        if (lp) {
          try {
            lp.focus();
          } catch (err) { /* ignore */ }
        }
      });
    }

    document.querySelectorAll('.bottom-nav button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.getAttribute('data-tab')));
    });
  }

  function init() {
    loadDb();
    bindEvents();
    sessionUser = loadSession();
    if (sessionUser && db.users.some((u) => u.id === sessionUser.id)) {
      showApp();
    } else {
      setSession(null);
      sessionUser = null;
      applyBrandTheme();
      document.getElementById('loginScreen').classList.add('active');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
