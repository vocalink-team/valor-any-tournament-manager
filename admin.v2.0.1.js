(()=>{
  const VERSION_URL='VERSION.json?v=2.0.1';
  const SUPABASE_URL='https://qvxoxrzvxyyribqjnpkb.supabase.co';
  const SUPABASE_KEY='sb_publishable_1zOA0YpTtJkNYsmm4zXxsA_wSJpdHKe';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const $=id=>document.getElementById(id);
  async function isSuperAdmin(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return false;
    const {data,error}=await sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
    return !error&&data?.role==='super_admin';
  }
  async function syncNav(){
    const nav=$('admin-nav');
    if(!nav)return;
    nav.classList.toggle('hidden',!(await isSuperAdmin()));
  }
  async function loadVersion(){
    const res=await fetch(VERSION_URL,{cache:'no-store'});
    if(!res.ok)throw new Error('VERSION.jsonを取得できません');
    return await res.json();
  }
  async function renderAdmin(){
    if(!(await isSuperAdmin()))return;
    const app=$('app'),title=$('page-title');
    title.textContent='管理者管理';
    document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.remove('active'));
    $('admin-nav')?.classList.add('active');
    let version;
    try{version=await loadVersion()}catch(e){version={version:'取得失敗',product:'VALORANT management system',changes:[]}}
    app.innerHTML=`
      <div class="section-head"><div><span class="eyebrow">SUPER ADMIN</span><h2>管理者管理</h2><p class="muted">大会管理者アカウントとシステムバージョンを管理します。</p></div></div>
      <div class="panel form-panel">
        <h3>大会管理者アカウントを作成</h3>
        <p class="muted">作成されたアカウントは <strong>organizer</strong> 権限になります。</p>
        <form id="organizer-form" class="form">
          <label>表示名<input id="org-name" required placeholder="大会管理者"></label>
          <label>メールアドレス<input id="org-email" type="email" required placeholder="organizer@example.com"></label>
          <label>初期パスワード<input id="org-password" type="password" minlength="6" required placeholder="6文字以上"></label>
          <button class="primary" id="org-submit" type="submit">管理者アカウントを発行</button>
        </form><div id="org-result" class="result" style="margin-top:14px"></div>
      </div>
      <div class="panel form-panel" style="margin-top:18px">
        <h3>バージョン管理</h3>
        <div class="live">現在のバージョン：<strong>${version.version||'—'}</strong></div>
        <p class="muted" style="margin-top:8px">${version.product||'VALORANT management system'}</p>
        ${Array.isArray(version.changes)&&version.changes.length?`<ul>${version.changes.map(x=>`<li>${String(x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</li>`).join('')}</ul>`:''}
      </div>`;
    $('organizer-form').onsubmit=async e=>{
      e.preventDefault();
      const button=$('org-submit'),result=$('org-result');
      const display_name=$('org-name').value.trim(),email=$('org-email').value.trim(),password=$('org-password').value;
      if(!display_name||!email||password.length<6){result.textContent='表示名・メールアドレス・6文字以上のパスワードを入力してください';return}
      button.disabled=true;result.textContent='発行中…';
      try{const {data,error}=await sb.functions.invoke('create-organizer',{body:{email,password,display_name}});if(error)throw error;if(!data?.ok)throw new Error(data?.error||'アカウント発行に失敗しました');result.textContent=`発行完了: ${data.email} / organizer`;$('organizer-form').reset()}catch(err){console.error(err);result.textContent='発行エラー: '+(err.message||err)}finally{button.disabled=false}
    };
  }
  document.addEventListener('click',e=>{const b=e.target.closest('.nav-item[data-view="admin"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();renderAdmin()},true);
  sb.auth.onAuthStateChange(()=>setTimeout(syncNav,0));
  setTimeout(syncNav,0);
})();