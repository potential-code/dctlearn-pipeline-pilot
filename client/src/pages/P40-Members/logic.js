// Ported verbatim from the Claude Design artboard P40-Members (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null, screen:null, toast:null }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  /* ===== builder-E helpers (sub-admin pages) ===== */
  _base(defSite, active, crumbEn, crumbAr){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const site = this.state.site || this.props.site || defSite;
    const L = (en, a) => ar ? a : en;
    const SN = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'], museopro:['MuseoPro','ميوزيو برو'], nibras:['Nibras','نبراس'] }[site] || ['Elevate 2026','إرتقاء 2026'];
    const crumbs = active === 'dashboard'
      ? [ { label: L(SN[0], SN[1]), href:'/platforms' }, { label: L(crumbEn, crumbAr) } ]
      : [ { label: L(SN[0], SN[1]), href:'/'+site+'/admin' }, { label: L(crumbEn, crumbAr) } ];
    const sh = this.shell(ar, 'sub_admin', active, site, crumbs);
    if (site === 'zu') { /* SEED §1/§4.1: ZU has no sub admin — platform admin Aisha covers it */
      sh.userSub = L('Platform admin · covering ZU','مسؤولة المنصة · تغطي جامعة زايد'); sh.roleLabel = L('Admin','مسؤولة'); sh.profileHref = '/admin';
    }
    const fmt = (n, d) => Number(n).toLocaleString('en-US', d == null ? {} : { minimumFractionDigits:d, maximumFractionDigits:d });
    return { lang, ar, site, L, sh, fmt, siteName: L(SN[0], SN[1]) };
  }
  _common(ar){
    const tt = this.state.toast;
    return {
      dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }),
      hasToast: !!tt, toastText: tt ? (ar ? tt[1] : tt[0]) : '', closeToast: () => this.setState({ toast:null }),
      t0: { close: ar ? 'إغلاق' : 'Close' }
    };
  }
  _toast(en, a){ this.setState({ toast:[en, a] }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:null }), 5000); }
  _screen(def){ /* specbar / prop driven presets */
    const ps = this.props.screen || def;
    if (this._ps !== ps) { this._ps = ps; Object.assign(this.state, this.preset(ps)); }
    return this.state.screen || ps;
  }
  _go(s){ this.setState({ toast:null, ...this.preset(s), screen:s }); }
  _seg(list, cur, ar){ return list.map(x => ({ label: x[1], cls: x[0] === cur ? 'is-on' : '', pick: () => this._go(x[0]) })); }
  _ltr(s){ return '\u2066' + s + '\u2069'; }
  _isEmail(e){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254; }
  _isHttps(u){ return /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(u); }
  /* ===== end builder-E helpers ===== */


  seed(site){
    const M = {
      elevate:[ ['saeed','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','active',17,'2026-09-14',['1 of 6 sessions','جلسة من 6'],'#D63539'] ],
      employees:[ ['saeed','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','active',33,'2024-03-10',['2 of 8 courses · 2 certificates','دورتان من 8 · شهادتان'],'#D63539'],
        ['reem','Reem Al Shamsi','ريم الشامسي','RS','reem.s@dctlearn.example','active',13,'2025-11-02',['1 of 8 courses','دورة من 8'],'#3B2F92'],
        ['hamad','Hamad Al Mazrouei','حمد المزروعي','HM','hamad.m@dctlearn.example','active',13,'2025-06-15',['1 of 8 courses','دورة من 8'],'#CD3151'],
        ['mona','Mona Al Ameri','منى العامري','MA','mona.a@dctlearn.example','active',3,'2026-08-03',['DCT World 25 %','عالم الدائرة 25 %'],'#E35E3C'],
        ['former','Former staff','موظف سابق','FS','former.staff@dctlearn.example','disabled',0,'2024-01-08',['Account disabled','الحساب معطّل'],'#6D7782'] ],
      znm:[ ['yousef','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','active',57,'2026-07-01',['3 of 6 courses · 2 certificates','3 من 6 دورات · شهادتان'],'#3B2F92'],
        ['reem','Reem Al Shamsi','ريم الشامسي','RS','reem.s@dctlearn.example','active',33,'2026-07-01',['2 of 6 courses','دورتان من 6'],'#CD3151'] ]
    }[site] || [];
    const inv = site === 'elevate' ? [ { id:'i1', email:'new.member@dctlearn.example', role:'learner', status:'sent', sent:'2026-10-01', exp:'2026-10-15' } ] : [];
    return { members: M.map(x => ({ id:x[0], en:x[1], ar:x[2], ini:x[3], email:x[4], status:x[5], pct:x[6], joined:x[7], note:x[8], c:x[9] })), invites: inv };
  }
  sampleCsv(){
    return { file:'team-invites.csv', rows:[ ['aaliyah.r@dctlearn.example','Aaliyah Al Rumaithi'], ['khalifa.o@dctlearn.example','Khalifa Al Obaidli'], ['saeed.h@dctlearn.example','Saeed Al Hammadi'], ['new.member@dctlearn.example',''], ['noura.k@example','Noura K'], ['maitha.s@dctlearn.example','Maitha Al Suwaidi'], ['aaliyah.r@dctlearn.example','Aaliyah Al Rumaithi'] ] };
  }
  /* server-side style checks → { created:[emails], skipped:[{email, code}] } */
  check(emails, members, invites){
    const seen = {}; const created = [], skipped = [];
    emails.forEach(e => {
      const m = e.trim().toLowerCase();
      if (!this._isEmail(m)) skipped.push({ email:m, code:'invalid' });
      else if (seen[m]) skipped.push({ email:m, code:'dup' });
      else if (members.some(x => x.email === m)) skipped.push({ email:m, code:'member' });
      else if (invites.some(x => x.email === m && x.status === 'sent')) skipped.push({ email:m, code:'pending' });
      else created.push(m);
      seen[m] = true;
    });
    return { created, skipped };
  }
  ensure(site){
    if (!this.state.data || this.state.data.site !== site) { const d = this.seed(site); this.state.data = { site, members:d.members, invites:d.invites }; }
    return this.state.data;
  }
  preset(s){
    const base = { dlg:null, q:'', st:'all', invEmails:'', invRole:'learner', invMsg:'', invErr:'', invStep:'form', invRes:null, csvStep:'up', csvErr:'', csv:null, csvRole:'learner', csvRes:null, rm:null, rv:null, data:null };
    if (s === 'invite') return { ...base, dlg:'invite', invEmails:'aaliyah.r@dctlearn.example, khalifa.o@dctlearn.example' };
    if (s === 'invited') return { ...base, dlg:'invite', invStep:'done', invEmails:'aaliyah.r@dctlearn.example, saeed.h@dctlearn.example', _autoInvite:true };
    if (s === 'csv') return { ...base, dlg:'csv' };
    if (s === 'csvPreview') return { ...base, dlg:'csv', csvStep:'pv', csv:this.sampleCsv() };
    if (s === 'csvDone') return { ...base, dlg:'csv', csvStep:'pv', csv:this.sampleCsv(), _autoCsv:true };
    if (s === 'remove') return { ...base, dlg:'remove', rm:'saeed' };
    return base;
  }
  renderVals(){
    const scr = this._screen('list');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('elevate', 'members', 'Members', 'الأعضاء');
    const data = this.ensure(site);
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const D = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m-1] + ' ' + y; };
    const t = ar ? {
      spec:'الأعضاء والدعوات', ey: siteName + ' · الأعضاء', h1:'الأعضاء والدعوات', sub:'ادعُ الأشخاص بالبريد الإلكتروني أو بملف CSV، وتابع تقدمهم، وأدر الدعوات المعلقة.', csvBtn:'استيراد CSV', invBtn:'دعوة أعضاء',
      memTitle:'الأعضاء', search:'ابحث بالاسم أو البريد الإلكتروني', statusF:'تصفية حسب الحالة', privacy:'يرى المشرف الفرعي الاسم والبريد الإلكتروني والحالة والتقدم فقط. الرقم الوظيفي والهاتف وتفاصيل الملف الشخصي تبقى خاصة.',
      cMember:'العضو', cEmail:'البريد الإلكتروني', cStatus:'الحالة', cProg:'التقدم', cJoined:'تاريخ الانضمام', cAct:'إجراءات', noneT:'لا يوجد أعضاء مطابقون', noneB:'جرّب اسماً آخر أو أزل عامل التصفية.', clear:'مسح البحث والتصفية',
      invTitle:'الدعوات المعلقة', invNote:'تنتهي صلاحية الروابط بعد 14 يوماً', sent:'أُرسلت', resend:'إعادة الإرسال', revoke:'إلغاء الدعوة', noInvT:'لا توجد دعوات معلقة', noInvB:'الدعوات التي ترسلها تظهر هنا حتى تُقبل.',
      invDlg:'دعوة أعضاء', invDlgSub:'يتلقى كل شخص رابطاً شخصياً صالحاً لمدة 14 يوماً.', emails:'عناوين البريد الإلكتروني', emailsHint:'افصل بين العناوين بفاصلة أو بسطر جديد.', role:'الدور', learner:'متعلّم', learnerD:'يصل إلى الدورات والإرشاد في هذا الموقع.', judge:'محكّم', judgeD:'يقيّم المشاركات في جولات المسابقة فقط.', msg:'رسالة شخصية', optional:'(اختياري)', msgPh:'مثال: أهلاً بك في البرنامج — نلتقي في جلسة الانطلاق.', msgErr:'الرسالة أطول من 240 حرفاً.', cancel:'إلغاء', inviteMore:'دعوة المزيد', done:'تم',
      csvDlg:'استيراد دعوات من ملف CSV', stepsAria:'خطوات الاستيراد', dzT:'اسحب ملف CSV هنا أو اختر ملفاً', dzB:'حتى 2 ميغابايت و5,000 صف · الأعمدة: email، name (اختياري)', cols:'الصف الأول عناوين الأعمدة. يُتجاهل أي عمود آخر.', sample:'استخدم الملف النموذجي', back:'رجوع', cRow:'الصف', cName:'الاسم', cResult:'النتيجة', pvNote:'لن يُرسل أي شيء قبل التأكيد. الصفوف المتخطاة لا تُدعى ولا توقف الاستيراد.',
      rmKeep:'يُزال الانتماء إلى هذا الموقع فقط. يحتفظ الشخص بحسابه وتقدمه وشهاداته.', rmBtn:'إزالة العضو', rvTitle:'إلغاء الدعوة؟'
    } : {
      spec:'Members & invitations', ey: siteName + ' · Members', h1:'Members & invitations', sub:'Invite people by e-mail or CSV, follow their progress and manage pending invitations.', csvBtn:'Import CSV', invBtn:'Invite members',
      memTitle:'Members', search:'Search by name or e-mail', statusF:'Filter by status', privacy:'Sub admins see name, e-mail, status and progress only. Employee ID, phone and profile details stay private.',
      cMember:'Member', cEmail:'E-mail', cStatus:'Status', cProg:'Progress', cJoined:'Joined', cAct:'Actions', noneT:'No matching members', noneB:'Try another name or clear the filter.', clear:'Clear search and filter',
      invTitle:'Pending invitations', invNote:'Links expire after 14 days', sent:'Sent', resend:'Resend', revoke:'Revoke', noInvT:'No pending invitations', noInvB:'Invitations you send appear here until they are accepted.',
      invDlg:'Invite members', invDlgSub:'Each person gets a personal link that is valid for 14 days.', emails:'E-mail addresses', emailsHint:'Separate addresses with a comma or a new line.', role:'Role', learner:'Learner', learnerD:'Gets this microsite’s courses and mentoring.', judge:'Judge', judgeD:'Only scores submissions in competition rounds.', msg:'Personal message', optional:'(optional)', msgPh:'e.g. Welcome to the programme — see you at the kick-off session.', msgErr:'The message is longer than 240 characters.', cancel:'Cancel', inviteMore:'Invite more', done:'Done',
      csvDlg:'Import invitations from CSV', stepsAria:'Import steps', dzT:'Drop a CSV file here or choose a file', dzB:'Up to 2 MB and 5,000 rows · columns: email, name (optional)', cols:'First row is the header. Any other column is ignored.', sample:'Use the sample file', back:'Back', cRow:'Row', cName:'Name', cResult:'Result', pvNote:'Nothing is sent until you confirm. Skipped rows are not invited and do not stop the import.',
      rmKeep:'Only the membership of this microsite is removed. The person keeps their account, progress and certificates.', rmBtn:'Remove member', rvTitle:'Revoke invitation?'
    };
    const REASON = { invalid:['Not a valid e-mail address','عنوان بريد غير صالح'], dup:['Duplicate in this list','مكرر في هذه القائمة'], member:['Already a member','عضو بالفعل'], pending:['Invitation already pending','توجد دعوة معلقة بالفعل'] };
    const st = this.state;
    const members = data.members;
    const q = (st.q || '').trim().toLowerCase();
    const cnt = (k) => members.filter(m => k === 'all' || m.status === k).length;
    const filtered = members.filter(m => (st.st === 'all' || m.status === st.st) && (!q || m.en.toLowerCase().includes(q) || m.ar.includes(q) || m.email.includes(q)));
    const rows = filtered.map(m => ({
      name: L(m.en, m.ar), ini:m.ini, c:m.c, email:m.email, st: m.status === 'active' ? L('Active','نشط') : L('Disabled','معطّل'), stCls: m.status === 'active' ? 'ok' : 'mut',
      pct: m.pct + '%', pctT: fmt(m.pct) + '%', bar: m.pct >= 50 ? '#15801A' : '#D63539', progNote: L(m.note[0], m.note[1]), joined: D(m.joined),
      removeAria: L('Remove ', 'إزالة ') + L(m.en, m.ar), remove: () => this.setState({ dlg:'remove', rm:m.id })
    }));
    const invites = data.invites.map(v => ({
      email:v.email, role: v.role === 'judge' ? L('Judge','محكّم') : L('Learner','متعلّم'), roleCls: v.role === 'judge' ? 'yel' : 'info',
      sent: D(v.sent), exp: D(v.exp), expLbl: v.status === 'revoked' ? L('Revoked','أُلغيت') : L('Expires','تنتهي'),
      st: v.status === 'sent' ? L('Sent','مُرسلة') : L('Revoked','ملغاة'), stCls: v.status === 'sent' ? 'warn' : 'mut', canRevoke: v.status === 'sent',
      resend: () => { const n = data.invites.map(x => x.id === v.id ? { ...x, status:'sent', sent:'2026-10-06', exp:'2026-10-20' } : x); this.setState({ data:{ ...data, invites:n } }); this._toast('New link sent to ' + v.email + '. The previous link no longer works.', 'أُرسل رابط جديد إلى ' + v.email + '. الرابط السابق لم يعد يعمل.'); },
      revoke: () => this.setState({ dlg:'revoke', rv:v.id })
    }));
    const pending = data.invites.filter(v => v.status === 'sent').length;
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', act:'M22 12h-4l-3 9L9 3l-3 9H2', mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6' };
    const active = cnt('active');
    const kpis = [
      { l:L('Members','الأعضاء'), v:fmt(members.length), n: L(fmt(active) + ' active · ' + fmt(cnt('disabled')) + ' disabled', fmt(active) + ' نشط · ' + fmt(cnt('disabled')) + ' معطّل'), cls:'k-ink', d:KI.users },
      { l:L('Active in 30 days','نشطون خلال 30 يوماً'), v:fmt(active), n:L('signed in since 6 Sep','سجّلوا الدخول منذ 6 سبتمبر'), cls:'k-rasp', d:KI.act },
      { l:L('Pending invitations','الدعوات المعلقة'), v:fmt(pending), n:L('awaiting acceptance','بانتظار القبول'), cls:'k-yel', d:KI.mail }
    ];
    const chips = [['all',L('All','الكل')],['active',L('Active','نشط')],['disabled',L('Disabled','معطّل')]].map(c => ({ label:c[1] + ' ', n:fmt(cnt(c[0])), cls: st.st === c[0] ? 'on' : '', pr: st.st === c[0] ? 'true' : 'false', pick: () => this.setState({ st:c[0] }) }));

    /* invite dialog */
    const list = (st.invEmails || '').split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
    const parsed = list.map(e => ({ v:e, cls: this._isEmail(e.toLowerCase()) ? '' : 'bad' }));
    const doInvite = (emails, role) => {
      const r = this.check(emails, members, data.invites);
      const added = r.created.map((e, i) => ({ id:'n' + Date.now() + i, email:e, role, status:'sent', sent:'2026-10-06', exp:'2026-10-20' }));
      return { invStep:'done', invRes:{ created:r.created.length, skipped:r.skipped }, data:{ ...data, invites:[ ...data.invites, ...added ] } };
    };
    if (st._autoInvite) { st._autoInvite = false; Object.assign(st, doInvite(list, 'learner')); }
    const sendInvites = () => {
      if (!list.length) return this.setState({ invErr: L('Enter at least one e-mail address.','أدخل عنوان بريد إلكتروني واحداً على الأقل.') });
      const bad = list.filter(e => !this._isEmail(e.toLowerCase()));
      if (bad.length) return this.setState({ invErr: L('Fix ' + bad.length + ' invalid address' + (bad.length > 1 ? 'es' : '') + ': ' + bad.join(', '), 'صحّح العناوين غير الصالحة (' + bad.length + '): ' + bad.join('، ')) });
      if ((st.invMsg || '').length > 240) return;
      const p = doInvite(list, st.invRole);
      this.setState(p);
      if (p.invRes.created) this._toast(p.invRes.created + ' invitation(s) sent · logged in the audit trail', 'أُرسلت ' + p.invRes.created + ' دعوة · سُجّلت في سجل التدقيق');
    };
    const ir = st.invRes || { created:0, skipped:[] };
    const res = { created: fmt(ir.created), title: L(ir.created === 1 ? 'invitation sent' : 'invitations sent', 'دعوات أُرسلت'), sub: L(ir.skipped.length + ' skipped · each person gets an e-mail with a personal link', 'تم تخطي ' + ir.skipped.length + ' · يتلقى كل شخص رسالة برابط شخصي'),
      hasSkipped: ir.skipped.length > 0, skTitle: L('Skipped','تم تخطيها'), skipped: ir.skipped.map(s => ({ email:s.email, reason: L(REASON[s.code][0], REASON[s.code][1]) })) };

    /* csv */
    const csv = st.csv;
    const pv = csv ? (() => { const seen = {}; return csv.rows.map((r, i) => { const e = (r[0] || '').trim().toLowerCase(); const one = this.check([e], members, data.invites); let code = one.skipped.length ? one.skipped[0].code : null; if (!code && seen[e]) code = 'dup'; seen[e] = true; return { row:i + 2, email:e, name:r[1] || '—', valid:!code, code }; }); })() : [];
    if (st._autoCsv) { st._autoCsv = false; const ok = pv.filter(r => r.valid); const added = ok.map((r, i) => ({ id:'c' + i, email:r.email, role:st.csvRole, status:'sent', sent:'2026-10-06', exp:'2026-10-20' })); Object.assign(st, { csvStep:'done', csvRes:{ created:ok.length, skipped:pv.filter(r => !r.valid) }, data:{ ...data, invites:[ ...data.invites, ...added ] } }); }
    const onFile = (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      if (!/\.csv$/i.test(f.name)) return this.setState({ csvErr: L('Choose a .csv file. ' + f.name + ' is not a CSV.','اختر ملفاً بصيغة ‎.csv‎. الملف ' + f.name + ' ليس CSV.') });
      if (f.size > 2 * 1024 * 1024) return this.setState({ csvErr: L('The file is larger than 2 MB.','حجم الملف أكبر من 2 ميغابايت.') });
      const rd = new FileReader();
      rd.onload = () => {
        const lines = String(rd.result).split(/\r?\n/).filter(x => x.trim());
        if (lines.length < 2) return this.setState({ csvErr: L('The file has no rows under the header.','لا يحتوي الملف على صفوف تحت العناوين.') });
        if (lines.length - 1 > 5000) return this.setState({ csvErr: L('The file has more than 5,000 rows.','يحتوي الملف على أكثر من 5,000 صف.') });
        const hdr = lines[0].toLowerCase().split(',').map(x => x.trim().replace(/"/g, ''));
        const ei = hdr.indexOf('email'), ni = hdr.indexOf('name');
        if (ei < 0) return this.setState({ csvErr: L('No “email” column found in the header row.','لم يُعثر على عمود «email» في صف العناوين.') });
        const rows = lines.slice(1).map(l => { const c = l.split(',').map(x => x.trim().replace(/"/g, '')); return [c[ei] || '', ni >= 0 ? c[ni] || '' : '']; });
        this.setState({ csv:{ file:f.name, rows }, csvStep:'pv', csvErr:'' });
      };
      rd.readAsText(f);
    };
    const nValid = pv.filter(r => r.valid).length;
    const csvConfirm = () => {
      if (!nValid) return;
      const ok = pv.filter(r => r.valid);
      const added = ok.map((r, i) => ({ id:'c' + Date.now() + i, email:r.email, role:st.csvRole, status:'sent', sent:'2026-10-06', exp:'2026-10-20' }));
      this.setState({ csvStep:'done', csvRes:{ created:ok.length, skipped:pv.filter(r => !r.valid) }, data:{ ...data, invites:[ ...data.invites, ...added ] } });
      this._toast('CSV import finished: ' + ok.length + ' invited · logged in the audit trail', 'اكتمل الاستيراد: ' + ok.length + ' دعوات · سُجّل في سجل التدقيق');
    };
    const cr = st.csvRes || { created:0, skipped:[] };
    const stepIdx = { up:0, pv:1, done:2 }[st.csvStep];
    const csvSteps = [L('Upload','الرفع'), L('Preview','المعاينة'), L('Result','النتيجة')].map((x, i) => ({ n:fmt(i + 1), label:x, cls: i < stepIdx ? 'done' : i === stepIdx ? 'on' : '', cur: i === stepIdx ? 'step' : 'false', ln: i < 2 }));

    /* remove / revoke */
    const rmM = members.find(m => m.id === st.rm) || members[0] || { en:'', ar:'' };
    const rvI = data.invites.find(v => v.id === st.rv) || { email:'' };
    const closeDlg = () => this.setState({ dlg:null, invStep:'form', invRes:null, invErr:'', invEmails:'', invMsg:'', csvStep:'up', csv:null, csvErr:'', csvRes:null });

    const SCR = [['list','List','القائمة'],['invite','Invite','دعوة'],['invited','Invite result','نتيجة الدعوة'],['csv','CSV upload','رفع CSV'],['csvPreview','CSV preview','معاينة CSV'],['csvDone','CSV result','نتيجة CSV'],['remove','Remove','إزالة']];
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/members',
      siteBtns: [['elevate','Elevate'],['employees','Employees'],['znm','ZNM']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', pick: () => this.setState({ site:x[0], data:null, dlg:null, q:'', st:'all' }) })),
      scrBtns: this._seg(SCR, scr, ar),
      kpis, chips, q: st.q || '', onQ: (e) => this.setState({ q:e.target.value }), rows, hasRows: rows.length > 0, noRows: rows.length === 0, clearF: () => this.setState({ q:'', st:'all' }),
      memCount: L(fmt(members.length) + ' total', 'المجموع ' + fmt(members.length)),
      invites, noInvites: invites.length === 0,
      openInvite: () => this.setState({ dlg:'invite', invStep:'form' }), openCsv: () => this.setState({ dlg:'csv', csvStep:'up' }),
      stop: (e) => e.stopPropagation(), bgClose: () => closeDlg(), closeDlg,
      dInvite: st.dlg === 'invite', invForm: st.invStep !== 'done', invDone: st.invStep === 'done',
      invEmails: st.invEmails || '', onInvEmails: (e) => this.setState({ invEmails:e.target.value, invErr:'' }), invErr: st.invErr || '', invErrCls: st.invErr ? 'is-error' : '',
      parsed, hasParsed: parsed.length > 0,
      rLearn: st.invRole === 'learner', rJudge: st.invRole === 'judge', rLearnCls: st.invRole === 'learner' ? 'on' : '', rJudgeCls: st.invRole === 'judge' ? 'on' : '',
      setLearn: () => this.setState({ invRole:'learner' }), setJudge: () => this.setState({ invRole:'judge' }),
      invMsg: st.invMsg || '', onInvMsg: (e) => this.setState({ invMsg:e.target.value }), msgCount: fmt((st.invMsg || '').length) + ' / ' + fmt(240), msgCls: (st.invMsg || '').length > 240 ? 'over' : '', msgErr: (st.invMsg || '').length > 240,
      sendLabel: list.length ? L('Send ' + list.length + ' invitation' + (list.length > 1 ? 's' : ''), 'إرسال ' + fmt(list.length) + ' دعوة') : L('Send invitations','إرسال الدعوات'),
      sendInvites, res, inviteMore: () => this.setState({ invStep:'form', invEmails:'', invRes:null }),
      dCsv: st.dlg === 'csv', csvUp: st.csvStep === 'up', csvPv: st.csvStep === 'pv', csvRes: st.csvStep === 'done', csvSteps,
      csvErr: st.csvErr || '', csvErrCls: st.csvErr ? 'is-error' : '', onFile, useSample: () => this.setState({ csv:this.sampleCsv(), csvStep:'pv', csvErr:'' }),
      csvRole: st.csvRole, onCsvRole: (e) => this.setState({ csvRole:e.target.value }),
      csvFile: csv ? csv.file : '', pvValid: L(nValid + ' to invite', fmt(nValid) + ' للدعوة'), pvSkip: L((pv.length - nValid) + ' skipped', 'تخطي ' + fmt(pv.length - nValid)), pvRoleNote: L('Role: ', 'الدور: ') + (st.csvRole === 'judge' ? L('Judge','محكّم') : L('Learner','متعلّم')),
      pvRows: pv.map(r => ({ row:fmt(r.row), email:r.email, name:r.name, st: r.valid ? L('Invite','دعوة') : L('Skip','تخطي'), cls: r.valid ? 'ok' : 'warn', reason: r.code ? L(REASON[r.code][0], REASON[r.code][1]) : '' })),
      csvBack: () => this.setState({ csvStep:'up', csv:null }), csvConfirm, csvConfirmLabel: L('Invite ' + nValid + ' people', 'دعوة ' + fmt(nValid) + ' أشخاص'),
      csvR: { created:fmt(cr.created), title:L('invitations created','دعوات أُنشئت'), sub:L(cr.skipped.length + ' rows skipped · e-mails are on their way', 'تم تخطي ' + fmt(cr.skipped.length) + ' صفوف · الرسائل في طريقها'), skTitle:L('Skipped rows','الصفوف المتخطاة'), skipped: cr.skipped.map(s => ({ email: L('Row ', 'الصف ') + fmt(s.row) + ' · ' + s.email, reason: L(REASON[s.code][0], REASON[s.code][1]) })) },
      dRemove: st.dlg === 'remove' && !!members.length, rmTitle: L('Remove ' + rmM.en + '?', 'إزالة ' + rmM.ar + '؟'), rmBody: L(rmM.en + ' will lose access to ' + siteName + ' straight away.', 'سيفقد ' + rmM.ar + ' الوصول إلى ' + siteName + ' فوراً.'),
      confirmRemove: () => { this.setState({ dlg:null, data:{ ...data, members: members.filter(m => m.id !== rmM.id) } }); this._toast(rmM.en + ' removed from ' + siteName + ' · logged in the audit trail', 'أُزيل ' + rmM.ar + ' من ' + siteName + ' · سُجّل في سجل التدقيق'); },
      dRevoke: st.dlg === 'revoke', rvBody: L('The link sent to ' + rvI.email + ' stops working immediately. You can send a new one later.', 'سيتوقف الرابط المرسل إلى ' + rvI.email + ' فوراً. يمكنك إرسال رابط جديد لاحقاً.'),
      confirmRevoke: () => { this.setState({ dlg:null, data:{ ...data, invites: data.invites.map(v => v.id === rvI.id ? { ...v, status:'revoked' } : v) } }); this._toast('Invitation revoked · logged in the audit trail', 'أُلغيت الدعوة · سُجّلت في سجل التدقيق'); }
    };
  }
}
