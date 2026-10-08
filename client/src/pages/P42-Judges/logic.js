// client: hand-edited (shell identity from the session, not a hard-coded ZU override)
// Ported verbatim from the Claude Design artboard P42-Judges (DCLogic class).
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
    /* client: the shell identity comes from the signed-in session in shellHelper (a platform admin
       viewing a microsite admin, e.g. ZU which has no sub admin, shows as "Platform admin · covering …"). */
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


  seed(){
    return {
      judges:[ { id:'noura', en:'Noura Al Kaabi', ar:'نورة الكعبي', ini:'NK', c:'#CD3151', email:'noura.k@example.com', status:'active', since:'' }, { id:'daniel', en:'Daniel Osei', ar:'دانيال أوسي', ini:'DO', c:'#3B2F92', email:'daniel.o@example.com', status:'invited', since:'2026-10-03' } ],
      subs:[ { id:'ahmed', en:'Ahmed Khan', ar:'أحمد خان', ini:'AK', c:'#1D1650', st:'submitted', at:'2026-09-30' }, { id:'sara', en:'Sara Haddad', ar:'سارة حداد', ini:'SH', c:'#E35E3C', st:'in_progress', at:'' } ],
      asg:{ 'ahmed|noura':true, 'ahmed|daniel':true, 'sara|noura':true }, scored:{ 'ahmed|noura':true }
    };
  }
  preset(s){
    const d = this.seed();
    const base = { ...d, saved:JSON.parse(JSON.stringify(d.asg)), tab:'manual', dlg:null, invEmails:'', invErr:'', autoN:'2', keep:true, res:null, nTried:false };
    if (s === 'invite') return { ...base, dlg:'invite', invEmails:'mariam.k@example.com' };
    if (s === 'edited') return { ...base, asg:{ ...base.asg, 'sara|daniel':true } };
    if (s === 'auto') return { ...base, tab:'auto' };
    if (s === 'autoResult') return { ...base, tab:'auto', _run:true };
    if (s === 'autoError') return { ...base, tab:'auto', autoN:'3', nTried:true };
    return base;
  }
  renderVals(){
    const scr = this._screen('manual');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('zu', 'judges', 'Judges', 'المحكّمون');
    const st = this.state;
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const D = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m-1]; };
    const t = ar ? {
      spec:'المحكّمون', ey: siteName + ' · المسابقة', h1:'المحكّمون والتعيينات', sub:'ادعُ المحكّمين إلى هذا الموقع وحدّد المشاركات التي يقيّمها كل منهم — يدوياً أو تلقائياً.', invite:'دعوة محكّمين',
      jTitle:'المحكّمون', jNote:'مدعوون إلى تحدي جامعة زايد فقط', cJudge:'المحكّم', cEmail:'البريد الإلكتروني', cStatus:'الحالة', cAssigned:'المعيّنة', cGraded:'المقيّمة', cAct:'إجراءات', resend:'إعادة الإرسال', revoke:'إلغاء الدعوة', seeScores:'الدرجات',
      aTitle:'التعيينات', aRound:'تحدي 24 ساعة 2026', manual:'يدوي', auto:'تلقائي', mxCap:'مصفوفة تعيين المشاركات للمحكّمين', cSub:'المشاركة', scored:'تم التقييم', perJudge:'لكل محكّم', mxNote:'لا يمكن إلغاء تعيين قُيّم بالفعل.', discard:'تجاهل', saveMx:'حفظ التعيينات',
      nLbl:'عدد المحكّمين لكل مشاركة', perSub:'لكل مشاركة', keep:'الإبقاء على التعيينات الحالية', autoNote:'يوزّع النظام المشاركات بالتساوي على المحكّمين المدعوين. التعيينات التي قُيّمت تبقى دائماً.', run:'تشغيل التعيين التلقائي', resT:'النتيجة', review:'مراجعة في المصفوفة', noResT:'لم يُشغّل بعد', noResB:'اختر العدد ثم شغّل التعيين لرؤية النتيجة هنا.',
      invT:'دعوة محكّمين', invSub:'يتلقى المحكّم رابطاً لإنشاء حسابه في هذا الموقع.', emails:'عناوين البريد الإلكتروني', emailsHint:'افصل بين العناوين بفاصلة أو بسطر جديد.', privacy:'يرى المحكّمون أسماء المشاركين وإجاباتهم في المشاركات المعيّنة لهم فقط — لا البريد ولا الهاتف.', cancel:'إلغاء', send:'إرسال الدعوات'
    } : {
      spec:'Judges', ey: siteName + ' · Competition', h1:'Judges & assignments', sub:'Invite judges to this microsite and decide who scores which submission — by hand or automatically.', invite:'Invite judges',
      jTitle:'Judges', jNote:'Invited to ZU 24-Hour Challenge only', cJudge:'Judge', cEmail:'E-mail', cStatus:'Status', cAssigned:'Assigned', cGraded:'Graded', cAct:'Actions', resend:'Resend', revoke:'Revoke', seeScores:'Scores',
      aTitle:'Assignments', aRound:'24-Hour Challenge 2026', manual:'Manual', auto:'Automatic', mxCap:'Submission to judge assignment matrix', cSub:'Submission', scored:'Scored', perJudge:'Per judge', mxNote:'Assignments that already have a score can’t be removed.', discard:'Discard', saveMx:'Save assignments',
      nLbl:'Judges per submission', perSub:'per submission', keep:'Keep existing assignments', autoNote:'Submissions are spread evenly across the invited judges. Assignments that already have a score are always kept.', run:'Run automatic assignment', resT:'Result', review:'Review in the matrix', noResT:'Not run yet', noResB:'Pick a number and run the assignment to see the result here.',
      invT:'Invite judges', invSub:'Judges get a link to set up their account on this microsite.', emails:'E-mail addresses', emailsHint:'Separate addresses with a comma or a new line.', privacy:'Judges only see names and answers of the submissions assigned to them — never e-mail or phone.', cancel:'Cancel', send:'Send invitations'
    };
    const judges = st.judges, subs = st.subs, asg = st.asg, scored = st.scored;
    const key = (s, j) => s + '|' + j;
    /* automatic */
    const runAutoCalc = (N, keep) => {
      const next = {}; Object.keys(scored).forEach(k => next[k] = true);
      if (keep) Object.keys(asg).forEach(k => { if (asg[k]) next[k] = true; });
      const load = {}; judges.forEach(j => load[j.id] = subs.filter(s => next[key(s.id, j.id)]).length);
      let added = [];
      subs.forEach(s => { let have = judges.filter(j => next[key(s.id, j.id)]).length;
        const order = judges.slice().sort((a, b) => load[a.id] - load[b.id]);
        for (const j of order) { if (have >= N) break; if (!next[key(s.id, j.id)]) { next[key(s.id, j.id)] = true; load[j.id]++; have++; added.push([s, j]); } } });
      return { next, added };
    };
    const nVal = Number(st.autoN);
    const nErrText = (st.autoN === '' || isNaN(nVal) || nVal < 1 || Math.round(nVal) !== nVal) ? L('Enter a whole number of at least 1.','أدخل عدداً صحيحاً لا يقل عن 1.') : nVal > judges.length ? L('Only ' + judges.length + ' judges are invited to this microsite — choose 1 to ' + judges.length + ', or invite more judges.', 'دُعي ' + judges.length + ' محكّمَين فقط إلى هذا الموقع — اختر من 1 إلى ' + judges.length + ' أو ادعُ محكّمين آخرين.') : '';
    if (st._run) { st._run = false; const r = runAutoCalc(nVal, st.keep); st.asg = r.next; st.saved = JSON.parse(JSON.stringify(r.next)); st.res = { N:nVal, added:r.added.map(a => [a[0].id, a[1].id]) }; }
    const runAuto = () => {
      if (nErrText) return this.setState({ nTried:true });
      const r = runAutoCalc(nVal, st.keep);
      this.setState({ asg:r.next, saved:JSON.parse(JSON.stringify(r.next)), res:{ N:nVal, added:r.added.map(a => [a[0].id, a[1].id]) }, nTried:false });
      this._toast('Automatic assignment done · recorded in the audit log', 'اكتمل التعيين التلقائي · سُجّل في سجل التدقيق');
    };
    const A = st.asg;
    const cnt = (jid) => subs.filter(s => A[key(s.id, jid)]).length;
    const gradedOf = (jid) => subs.filter(s => scored[key(s.id, jid)]).length;
    const totalAsg = Object.keys(A).filter(k => A[k]).length;
    const KI = { scale:'M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z', link:'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3' };
    const nAct = judges.filter(j => j.status === 'active').length;
    const kpis = [
      { l:L('Judges','المحكّمون'), v:fmt(judges.length), n:L(nAct + ' active · ' + (judges.length - nAct) + ' invited', nAct + ' نشط · ' + (judges.length - nAct) + ' مدعو'), cls:'k-ink', d:KI.scale },
      { l:L('Assignments','التعيينات'), v:fmt(totalAsg), n:L('across ' + subs.length + ' submissions', 'على ' + subs.length + ' مشاركات'), cls:'k-rasp', d:KI.link },
      { l:L('Scores in','التقييمات المستلمة'), v:this._ltr(fmt(Object.keys(scored).length) + ' / ' + fmt(totalAsg)), n:L('Daniel’s invite still pending','دعوة دانيال ما زالت معلقة'), cls:'k-yel', d:KI.done }
    ];
    const jrows = judges.map(j => { const a = cnt(j.id), g = gradedOf(j.id); return {
      name:L(j.en, j.ar), ini:j.ini, c:j.c, email:j.email, st: j.status === 'active' ? L('Active','نشط') : j.status === 'revoked' ? L('Revoked','ملغاة') : L('Invited','مدعو'), stCls: j.status === 'active' ? 'ok' : j.status === 'revoked' ? 'mut' : 'warn',
      since: j.status === 'invited' ? L('pending since ' + D(j.since), 'معلقة منذ ' + D(j.since)) : '', assigned:fmt(a), graded: this._ltr(fmt(g) + ' / ' + fmt(a)), pct: a ? Math.round(g / a * 100) + '%' : '0%',
      invited: j.status === 'invited', active: j.status === 'active',
      resend: () => { this.setState({ judges: judges.map(x => x.id === j.id ? { ...x, since:'2026-10-06' } : x) }); this._toast('New invitation link sent to ' + j.email, 'أُرسل رابط دعوة جديد إلى ' + j.email); },
      revoke: () => { this.setState({ judges: judges.map(x => x.id === j.id ? { ...x, status:'revoked' } : x) }); this._toast('Invitation revoked · recorded in the audit log', 'أُلغيت الدعوة · سُجّلت في سجل التدقيق'); }
    }; });
    const activeJ = judges.filter(j => j.status !== 'revoked');
    const cols = activeJ.map(j => ({ name:L(j.en, j.ar), ini:j.ini, c:j.c, st: j.status === 'active' ? L('Active','نشط') : L('Invited','مدعو'), stCls: j.status === 'active' ? 'ok' : 'warn', count:fmt(cnt(j.id)) }));
    const saved = st.saved;
    const nChg = Object.keys({ ...A, ...saved }).filter(k => !!A[k] !== !!saved[k]).length;
    const mrows = subs.map(s => ({ name:L(s.en, s.ar), ini:s.ini, c:s.c, sub: s.st === 'submitted' ? L('Submitted ' + D(s.at), 'قُدّمت ' + D(s.at)) : L('In progress · not submitted yet','قيد الإعداد · لم تُقدّم بعد'),
      cells: activeJ.map(j => { const k = key(s.id, j.id); return { on: !!A[k], scored: !!scored[k], cls: !!A[k] !== !!saved[k] ? 'chg' : '', aria: L('Assign ' + j.en + ' to ' + s.en, 'تعيين ' + j.ar + ' لمشاركة ' + s.ar), tog: () => this.setState({ asg:{ ...this.state.asg, [k]:!this.state.asg[k] } }) }; }) }));
    const res = st.res ? { total: fmt(Object.keys(A).filter(k => A[k]).length), line: L('assignments · ' + st.res.N + ' judge(s) per submission · ' + st.res.added.length + ' new', 'تعيينات · ' + st.res.N + ' لكل مشاركة · ' + st.res.added.length + ' جديد'),
      items: [ ...activeJ.map(j => ({ a:L(j.en, j.ar), b:L(cnt(j.id) + ' submissions', cnt(j.id) + ' مشاركات') })), ...st.res.added.map(a => { const s = subs.find(x => x.id === a[0]), j = judges.find(x => x.id === a[1]); return { a:L('New: ' + s.en, 'جديد: ' + s.ar), b:L('→ ' + j.en, '← ' + j.ar) }; }) ] } : null;
    /* invite */
    const list = (st.invEmails || '').split(/[\s,;]+/).filter(Boolean).map(x => x.toLowerCase());
    const sendInv = () => {
      if (!list.length) return this.setState({ invErr:L('Enter at least one e-mail address.','أدخل عنوان بريد إلكتروني واحداً على الأقل.') });
      const bad = list.filter(e => !this._isEmail(e)); if (bad.length) return this.setState({ invErr:L('Not valid: ' + bad.join(', '), 'غير صالح: ' + bad.join('، ')) });
      const dup = list.filter(e => judges.some(j => j.email === e && j.status !== 'revoked'));
      const fresh = list.filter(e => !dup.includes(e));
      const COLS = ['#E35E3C','#1D1650','#F77860','#2FC4DB'];
      const add = fresh.map((e, i) => { const nm = e.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, m => m.toUpperCase()); return { id:'j' + Date.now() + i, en:nm, ar:nm, ini:nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), c:COLS[i % 4], email:e, status:'invited', since:'2026-10-06' }; });
      this.setState({ judges:[ ...judges, ...add ], dlg:null, invEmails:'', invErr:'' });
      this._toast(add.length + ' judge invitation(s) sent' + (dup.length ? ' · ' + dup.length + ' skipped (already a judge)' : ''), 'أُرسلت ' + add.length + ' دعوة تحكيم' + (dup.length ? ' · تخطي ' + dup.length + ' (محكّم بالفعل)' : ''));
    };
    const SCR = [['manual','Manual matrix'],['invite','Invite'],['edited','Unsaved changes'],['auto','Automatic'],['autoResult','Auto result'],['autoError','Auto N too high']];
    const isManual = st.tab !== 'auto';
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin/judges', scrBtns:this._seg(SCR, scr, ar),
      kpis, judges:jrows, cols, mrows,
      isManual, isAuto: !isManual, tabManCls: isManual ? 'on' : '', tabAutoCls: isManual ? '' : 'on', tabManSel: isManual ? 'true' : 'false', tabAutoSel: isManual ? 'false' : 'true',
      goManual: () => this.setState({ tab:'manual' }), goAuto: () => this.setState({ tab:'auto' }),
      hasChanges: nChg > 0, chgTag: nChg ? L(nChg + ' unsaved change(s)', nChg + ' تغيير غير محفوظ') : L('All saved','كل شيء محفوظ'), chgCls: nChg ? 'warn' : 'ok',
      discard: () => this.setState({ asg:JSON.parse(JSON.stringify(saved)) }),
      saveMx: () => { if (!nChg) return this._toast('No changes to save.','لا توجد تغييرات للحفظ.'); this.setState({ saved:JSON.parse(JSON.stringify(A)) }); this._toast('Assignments saved · judges are notified by e-mail', 'حُفظت التعيينات · أُبلغ المحكّمون بالبريد'); },
      autoN: st.autoN, onN: (e) => this.setState({ autoN:e.target.value, nTried:false }), nErr: st.nTried ? nErrText : '', nErrCls: st.nTried && nErrText ? 'is-error' : '', nHint: L('1 to ' + judges.length + ' — the number of judges invited to ZU.', 'من 1 إلى ' + judges.length + ' — عدد المحكّمين المدعوين إلى جامعة زايد.'),
      keep: st.keep, togKeep: () => this.setState({ keep:!st.keep }), runAuto, hasRes: !!res, noRes: !res, res: res || { total:'', line:'', items:[] },
      dInvite: st.dlg === 'invite', openInvite: () => this.setState({ dlg:'invite', invErr:'' }), invEmails: st.invEmails, onInv: (e) => this.setState({ invEmails:e.target.value, invErr:'' }), invErr: st.invErr, invErrCls: st.invErr ? 'is-error' : '', sendInv,
      closeDlg: () => this.setState({ dlg:null }), stop: (e) => e.stopPropagation()
    };
  }
}
