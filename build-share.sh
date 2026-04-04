#!/bin/bash
# Build a single self-contained HTML file for sharing with backend engineers.
# All roles can log in via demo buttons.

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/jouzu-demo-share.html"

CSS=$(cat "$DIR/styles.css")
JS=$(cat "$DIR/app.js")

# Patch: remove student-only login restriction
JS_PATCHED=$(echo "$JS" | sed "s/if (u.role !== 'student') {/if (false) {/")

cat > "$OUT" << 'HTMLHEAD'
<!DOCTYPE html>
<html lang="ja" data-brand="snsclub">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#1a3a6e" id="metaThemeColor" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <link rel="manifest" href="manifest.webmanifest" />
  <title>じょーず – デモ共有版</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
HTMLHEAD

echo "$CSS" >> "$OUT"

cat >> "$OUT" << 'HTMLMID'
  </style>
</head>
<body>
  <section id="loginScreen" class="screen active">
    <div style="text-align:center;padding:24px 16px 8px;">
      <div style="font-size:2.5rem;margin-bottom:8px;">🦈</div>
      <h2 style="margin:0;font-size:1.35rem;">じょーず – デモ共有版</h2>
      <p style="margin:8px 0 0;font-size:0.9rem;color:var(--muted);line-height:1.5;">各ロールのUI/UXを確認できます</p>
    </div>
    <div class="card" style="max-width:400px;margin:0 auto;">
      <p class="card-title" style="margin-top:4px;">ロールを選んでログイン</p>
      <div class="demo-grid" style="gap:8px;">
        <button type="button" class="quick-login" data-email="student@demo.local" data-password="demo123" style="border-left:4px solid #1a3a6e;">
          <strong>👩‍🎓 生徒（エンドユーザー）</strong>
          <span>投稿・ロードマップ・スケジュール</span>
        </button>
        <button type="button" class="quick-login" data-email="manager@demo.local" data-password="demo123" style="border-left:4px solid #e5553a;">
          <strong>👔 マネージャー（MG）</strong>
          <span>生徒のタスク管理・記録</span>
        </button>
        <button type="button" class="quick-login" data-email="leader@demo.local" data-password="demo123" style="border-left:4px solid #e5553a;">
          <strong>👑 リーダー</strong>
          <span>チーム全体の管理</span>
        </button>
        <button type="button" class="quick-login" data-email="admin@demo.local" data-password="demo123" style="border-left:4px solid #e5553a;">
          <strong>🛡️ 管理者（Admin）</strong>
          <span>全ユーザー・全データ閲覧</span>
        </button>
        <button type="button" class="quick-login" data-email="coach@demo.local" data-password="demo123" style="border-left:4px solid #e5553a;">
          <strong>🎯 コーチ</strong>
          <span>担当生徒の確認</span>
        </button>
      </div>
      <form id="formLogin" style="margin-top:16px;">
        <label class="label">メール</label>
        <input type="email" id="loginEmail" class="input" autocomplete="username" placeholder="example@email.com" />
        <label class="label">パスワード（すべて demo123）</label>
        <input type="password" id="loginPassword" class="input" autocomplete="current-password" placeholder="demo123" />
        <button type="submit" class="btn btn-primary">ログイン</button>
      </form>
      <p class="login-forgot-wrap"><button type="button" class="btn-text-link" id="linkForgotPassword">パスワードを忘れた場合</button></p>
      <div id="loginPasswordResetPanel" class="login-pwreset-panel hidden">
        <p class="card-title login-pwreset-title">パスワードの再設定</p>
        <p class="login-pwreset-hint">本番では登録メールにリセット用のリンクやコードが届きます。このデモでは確認コードが下に表示されます。</p>
        <label class="label" for="pwResetEmail">登録メールアドレス</label>
        <input type="email" id="pwResetEmail" class="input" autocomplete="email" placeholder="example@email.com" />
        <button type="button" class="btn btn-secondary btn-small" id="btnPwResetRequest" style="margin-top:8px;width:100%;">確認コードを発行</button>
        <div id="pwResetStep2" class="login-pwreset-step2 hidden">
          <p class="login-pwreset-demo-banner">（デモ）確認コード: <strong id="pwResetCodeDisplay" class="pw-reset-code-disp"></strong>（本番ではメール内のみ）</p>
          <label class="label" for="pwResetCode">確認コード</label>
          <input type="text" id="pwResetCode" class="input" inputmode="numeric" autocomplete="one-time-code" placeholder="6桁" maxlength="8" />
          <label class="label" for="pwResetNew">新しいパスワード（8文字以上）</label>
          <input type="password" id="pwResetNew" class="input" autocomplete="new-password" />
          <label class="label" for="pwResetNew2">新しいパスワード（確認）</label>
          <input type="password" id="pwResetNew2" class="input" autocomplete="new-password" />
          <button type="button" class="btn btn-primary btn-small" id="btnPwResetComplete" style="margin-top:12px;width:100%;">パスワードを再設定</button>
        </div>
        <button type="button" class="btn-text-link login-pwreset-back" id="btnPwResetCancel">ログイン画面に戻る</button>
      </div>
      <p style="font-size:0.75rem;color:var(--muted);margin:16px 0 0;line-height:1.5;">
        ※ この共有版はlocalStorageにデータを保存します。ブラウザを変えるとデータはリセットされます。<br>
        ※ 初回アクセス時にサンプルデータが投入されます。
      </p>
    </div>
  </section>

  <div id="appShell" class="hidden">
    <header class="app-header">
      <h1 id="headerTitle">タスク</h1>
      <p id="headerSub" class="sub"></p>
      <span id="roleChip" class="role-chip"></span>
      <button type="button" id="quickConsultBtn" class="quick-consult-btn hidden" aria-label="タスク入力">入力</button>
    </header>
    <main>
      <section class="screen active" data-screen="home" id="screenHome"><div id="homeContent"></div></section>
      <section class="screen" data-screen="posts" id="screenPosts"><div id="postsContent"></div></section>
      <section class="screen" data-screen="roadmap" id="screenRoadmap"><div id="roadmapContent"></div></section>
      <section class="screen" data-screen="tasks" id="screenTasks"><div id="tasksContent"></div></section>
      <section class="screen" data-screen="team" id="screenTeam"><div id="teamContent"></div></section>
      <section class="screen" data-screen="log" id="screenLog"><div id="logContent"></div></section>
      <section class="screen" data-screen="memo" id="screenMemo"><div id="memoContent"></div></section>
      <section class="screen" data-screen="schedule" id="screenSchedule"><div id="scheduleContent"></div></section>
      <section class="screen" data-screen="mypage" id="screenMypage"><div id="mypageContent"></div></section>
      <section class="screen" data-screen="goals" id="screenGoals"><div id="goalsContent"></div></section>
      <section class="screen" data-screen="profile" id="screenProfile"><div id="profileContent"></div></section>
    </main>
    <nav class="bottom-nav" aria-label="メインメニュー">
      <button type="button" data-tab="home" class="active" aria-current="page"><span class="icon" aria-hidden="true">🏠</span>ホーム</button>
      <button type="button" data-tab="posts" data-nav="studentOnly"><span class="icon" aria-hidden="true">📊</span>投稿</button>
      <button type="button" data-tab="tasks" data-nav="staffOnly"><span class="icon" aria-hidden="true">☑️</span>タスク</button>
      <button type="button" class="hidden" data-nav="team" data-tab="team"><span class="icon" aria-hidden="true">👥</span>チーム</button>
      <button type="button" data-tab="log" data-nav="staffOnly"><span class="icon" aria-hidden="true">➕</span>記録</button>
      <button type="button" data-tab="roadmap" data-nav="studentOnly"><span class="icon" aria-hidden="true">🗺️</span>ロードマップ</button>
      <button type="button" data-tab="schedule" data-nav="studentOnly"><span class="icon" aria-hidden="true">🗓️</span>スケジュール</button>
      <button type="button" data-tab="mypage"><span class="icon" aria-hidden="true">👤</span>マイページ</button>
    </nav>
  </div>
  <script>
HTMLMID

echo "$JS_PATCHED" >> "$OUT"

cat >> "$OUT" << 'HTMLEND'
  </script>
</body>
</html>
HTMLEND

echo "✅ Built: $OUT"
echo "   Size: $(du -h "$OUT" | cut -f1)"
