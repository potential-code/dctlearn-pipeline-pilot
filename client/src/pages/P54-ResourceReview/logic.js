// Ported verbatim from the Claude Design artboard P54-ResourceReview (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null}; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  renderVals(){
    
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const S = (o) => this.setState(o);
    const st = (k) => (this.state[k] !== undefined && this.state[k] !== null) ? this.state[k] : this.props[k];
    const seg = (label, key, opts) => ({ label, btns: opts.map(o => ({ label:o[1], cls: st(key) === o[0] ? 'is-on' : '', pick: () => S(Object.assign({ [key]: o[0] }, o[2] || {})) })) });
    const flash = (msg) => { S({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast: null }), 3600); };
    const base = { toast: this.state.toast || false, lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => S({ locale:'en' }), setAr: () => S({ locale:'ar' }), toggleLang: () => S({ locale: ar ? 'en' : 'ar' }) };

    const MS = { employees:['DCT Employees','موظفو الدائرة','#EE3E43'], znm:['Zayed National Museum','متحف زايد الوطني','#3B2F92'], museopro:['MuseoPro','ميوزيو برو','#E35E3C'] };
    const t = ar ? {
      spec:'التحقق من الموارد', ey:'المحتوى · التحقق', h1:'التحقق من الموارد', sub:'يضيف المشرفون الفرعيون روابط وملفات لمواقعهم المصغّرة؛ لا تظهر للمتعلّمين إلا بعد موافقتك.', tabsLbl:'أقسام الصفحة', tabs:['قائمة المراجعة','السجل'],
      kp:['بانتظار المراجعة','معتمدة','مرفوضة','أقدم طلب'], kn:['تحتاج قرارك','ظاهرة في المراكز','أُعيدت مع ملاحظة','منذ الإرسال'], day:'يوم', days:'أيام',
      queue:'بانتظار المراجعة', reviewing:'قيد المراجعة', pending:'معلّق', kMs:'الموقع المصغّر', kType:'النوع', kBy:'أرسله', kOn:'تاريخ الإرسال', desc:'الوصف', preview:'معاينة الرابط', open:'فتح في نافذة جديدة',
      checklist:'قائمة المراجعة', chkHint:'%n من 4 — القائمة إرشادية ولا تمنع القرار.', audited:'يُسجَّل القرار في سجل التدقيق ويُبلَّغ المرسل.', reject:'رفض مع ملاحظة', approve:'اعتماد',
      clearH:'لا توجد موارد بانتظار المراجعة', clearP:'تمت مراجعة كل الطلبات. ستظهر الطلبات الجديدة من المشرفين الفرعيين هنا.', seeHistory:'عرض السجل',
      history:'سجل القرارات', all:'الكل', approved:'معتمد', rejected:'مرفوض', thRes:'المورد', thDec:'القرار', thNote:'ملاحظة المراجع', audit:'سجل التدقيق',
      rjEy:'رفض المورد', rjH:'رفض «%s»؟', rjP:'يعود المورد إلى المشرف الفرعي مع ملاحظتك ليعدّله ويعيد إرساله.', sugg:'ملاحظات مقترحة', note:'ملاحظة للمرسل', noteHint:'مطلوبة، حتى 1,000 حرف. يراها المشرف الفرعي في صفحة الموارد.', nReq:'اكتب ملاحظة توضح سبب الرفض', nLong:'1,000 حرف كحد أقصى', cancel:'إلغاء', rjBtn:'رفض المورد', close:'إغلاق',
      approvedT:'تم اعتماد «%s» — يظهر الآن في %m', rejectedT:'تم رفض «%s» وإرسال ملاحظتك إلى %w',
      chk:['يُفتح الرابط دون تسجيل دخول','المحتوى دقيق ومحدّث','مناسب لكل أعضاء الموقع','لا يحتوي بيانات شخصية'],
      sg:['الرابط يتطلب تسجيل دخول','المحتوى غير محدّث','استخدم رابطاً عاماً يبدأ بـ https']
    } : {
      spec:'Resource verification', ey:'Content · Verification', h1:'Resource verification', sub:'Sub admins add links and files for their microsites; learners only see them once you approve.', tabsLbl:'Page sections', tabs:['Review queue','History'],
      kp:['Pending review','Approved','Rejected','Oldest request'], kn:['need your decision','visible in hubs','returned with a note','since submission'], day:'day', days:'days',
      queue:'Waiting for review', reviewing:'Reviewing', pending:'Pending', kMs:'Microsite', kType:'Type', kBy:'Submitted by', kOn:'Submitted', desc:'Description', preview:'Link preview', open:'Open in new tab',
      checklist:'Reviewer checklist', chkHint:'%n of 4 — a guide only; it does not block the decision.', audited:'Your decision is written to the audit log and the submitter is notified.', reject:'Reject with note', approve:'Approve',
      clearH:'Nothing waiting for review', clearP:'Every request has been decided. New submissions from sub admins will appear here.', seeHistory:'See history',
      history:'Decision history', all:'All', approved:'Approved', rejected:'Rejected', thRes:'Resource', thDec:'Decision', thNote:'Reviewer note', audit:'Audit log',
      rjEy:'Reject resource', rjH:'Reject “%s”?', rjP:'The resource goes back to the sub admin with your note so they can fix it and resubmit.', sugg:'Suggested notes', note:'Note to the submitter', noteHint:'Required, up to 1,000 characters. The sub admin sees it on their Resources page.', nReq:'Write a note explaining why it is rejected', nLong:'1,000 characters max', cancel:'Cancel', rjBtn:'Reject resource', close:'Close',
      approvedT:'“%s” approved — now visible in %m', rejectedT:'“%s” rejected — your note was sent to %w',
      chk:['Link opens without signing in','Content is accurate and current','Suitable for every member of the microsite','Contains no personal data'],
      sg:['The link needs a sign-in','The content is out of date','Use a public https link']
    };
    const P = { khalid:['Khalid Al Dhaheri','خالد الظاهري'], camille:['Camille Rousseau','كاميل روسو'], omar:['Omar Al Mansoori','عمر المنصوري'], aisha:['Aisha Al Marzouqi','عائشة المرزوقي'] };
    const D = (d, m) => ar ? d + ' ' + ['','','','','','','','','سبتمبر','أكتوبر'][m] + ' 2026' : d + ' ' + ['','','','','','','','','Sep','Oct'][m] + ' 2026';
    const PEND = [ { id:'r3', en:'Ticketing FAQ sheet', ar:'ورقة الأسئلة الشائعة عن التذاكر', ms:'znm', ty:'link', url:'https://docs.znm.example/ticketing-faq', by:'khalid', on:D(5, 9),
      desc:L('Answers to the 20 most common ticketing questions at the museum — prices, concessions, group bookings and refunds — for front-of-house teams.','إجابات عن أكثر 20 سؤالاً شيوعاً حول التذاكر في المتحف — الأسعار والتخفيضات وحجوزات المجموعات والاسترداد — لفرق الاستقبال.'),
      pageH:L('Ticketing FAQ — front-of-house','الأسئلة الشائعة عن التذاكر — فرق الاستقبال'), lines:[L('Who qualifies for a concession ticket?','من يحق له تذكرة مخفّضة؟'), L('How do group bookings of 10+ work?','كيف تعمل حجوزات المجموعات (10 أشخاص أو أكثر)؟'), L('Refunds and date changes','الاسترداد وتغيير الموعد'), L('Accessibility and companion entry','إمكانية الوصول ودخول المرافق')] } ];
    const HIST0 = [
      { id:'r1', en:'ZNM Visitor Code of Conduct', ar:'مدونة سلوك زوار متحف زايد الوطني', ms:'znm', ty:'pdf', by:'khalid', st:'approved', on:D(14, 8), note:'' },
      { id:'r2', en:'Museum Glossary (ICOM)', ar:'مسرد المتاحف (إيكوم)', ms:'museopro', ty:'link', by:'camille', st:'approved', on:D(18, 8), note:'' },
      { id:'r4', en:'Internal SharePoint link', ar:'رابط SharePoint داخلي', ms:'employees', ty:'link', by:'omar', st:'rejected', on:D(29, 8), note:L('Use a public https link; SharePoint needs login','استخدم رابط https عاماً؛ SharePoint يتطلب تسجيل الدخول') }
    ];
    const screen = st('screen') || 'queue';
    const decided = this.state.decided || (screen === 'empty' ? { r3:{ st:'approved', note:'' } } : {});
    const pend = PEND.filter(r => !decided[r.id]);
    const hist = PEND.filter(r => decided[r.id]).map(r => Object.assign({}, r, decided[r.id], { on: D(6, 9), fresh:true })).concat(HIST0);
    const tab = this.state.tab || (screen === 'history' ? 'history' : 'queue');
    const selId = pend.find(r => r.id === this.state.sel) ? this.state.sel : (pend[0] || {}).id;
    const r0 = pend.find(r => r.id === selId) || PEND[0];
    const msN = (k) => L(MS[k][0], MS[k][1]);
    const tyL = { link:L('Link','رابط'), pdf:'PDF' };
    const queue = pend.map(r => ({ title: L(r.en, r.ar), ms: msN(r.ms), c: MS[r.ms][2], by: L(P[r.by][0], P[r.by][1]) + ' · ' + r.on, ty: r.ty === 'pdf' ? 'PDF' : 'URL', tyCls: r.ty, cls: r.id === selId ? 'on' : '', cur: r.id === selId ? 'true' : 'false', pick: () => S({ sel:r.id }) }));
    const cur = { title: L(r0.en, r0.ar), alt: ar ? r0.en : r0.ar, altLang: ar ? 'en' : 'ar', altDir: ar ? 'ltr' : 'rtl', ms: msN(r0.ms), c: MS[r0.ms][2], tyL: tyL[r0.ty], who: L(P[r0.by][0], P[r0.by][1]), on: r0.on, desc: r0.desc, url: r0.url, img: B('6a330c17598da2f1e81b82711e1c5e9a'), site: L('docs.znm.example','docs.znm.example'), pageH: r0.pageH, lines: (r0.lines || []).map(l => ({ l })) };
    const chkS = this.state.chk || {};
    const checks = t.chk.map((l, i) => ({ l, on: !!chkS[i], tog: () => S({ chk: Object.assign({}, chkS, { [i]: !chkS[i] }) }) }));
    const nChk = Object.keys(chkS).filter(k => chkS[k]).length;
    const dlg = this.state.dlg !== undefined ? this.state.dlg : (screen === 'reject' ? 'reject' : null);
    const note = this.state.note || '';
    const nTried = !!this.state.nTried, nBad = !note.trim() || note.length > 1000;
    const decide = (stt, nt) => { S({ decided: Object.assign({}, decided, { [r0.id]: { st:stt, note:nt } }), dlg:null, note:'', nTried:false, chk:{}, screen: pend.length > 1 ? 'queue' : 'empty' }); };
    const approve = () => { decide('approved', ''); flash(t.approvedT.replace('%s', cur.title).replace('%m', cur.ms)); };
    const doReject = () => { if (nBad) { S({ nTried:true }); return; } decide('rejected', note.trim()); flash(t.rejectedT.replace('%s', cur.title).replace('%w', cur.who)); };
    const hf = this.state.hf || 'all';
    const histRows = hist.filter(h => hf === 'all' || h.st === hf).map(h => ({ title: L(h.en, h.ar), by: L(P[h.by][0], P[h.by][1]) + ' · ' + tyL[h.ty], ty: h.ty === 'pdf' ? 'PDF' : 'URL', tyCls: h.ty, ms: msN(h.ms), c: MS[h.ms][2],
      dec: h.st === 'approved' ? t.approved : t.rejected, cls: h.st === 'approved' ? 'ok' : 'bad', on: h.on + ' · ' + L('Aisha Al Marzouqi','عائشة المرزوقي'), note: h.note || '—' }));
    const audit = hist.slice(0, 4).map(h => ({ who: L('Aisha Al Marzouqi','عائشة المرزوقي'), what: (h.st === 'approved' ? L('approved','اعتمدت') : L('rejected','رفضت')) + ' «' + L(h.en, h.ar) + '»', at: h.on }));
    const nAppr = hist.filter(h => h.st === 'approved').length, nRej = hist.filter(h => h.st === 'rejected').length;
    const KI = { wait:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', ok:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', no:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6', old:'M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2' };
    const kpis = [ [pend.length,'k-yel',KI.wait,''], [nAppr,'k-ink',KI.ok,''], [nRej,'k-rasp',KI.no,''], [pend.length ? 1 : '—','k-red',KI.old,pend.length ? t.day : ''] ].map((x, i) => ({ l:t.kp[i], v: x[0] === '—' ? '—' : fmt(x[0]), u:x[3], n:t.kn[i], cls:x[1], d:x[2] }));
    const sh = this.shell(ar, 'admin', 'resources', null, [ { label: L('Admin','الإدارة'), href:'/admin' }, { label: L('Resources','الموارد') } ]);
    sh.nav = sh.nav.map(n => n.key === 'resources' ? Object.assign({}, n, { cnt: pend.length ? fmt(pend.length) : false }) : n);
    const isQ = tab === 'queue';
    return Object.assign(base, {
      t, sh, kpis, queue, cur, checks, route:'/admin/resources', qCount: fmt(pend.length),
      chkHint: t.chkHint.replace('%n', fmt(nChk)),
      tabs: [['queue', t.tabs[0], pend.length], ['history', t.tabs[1], hist.length]].map(x => ({ l:x[1], n: fmt(x[2]), cls: tab === x[0] ? 'on' : '', cur: tab === x[0] ? 'page' : 'false', pick: () => S({ tab:x[0] }) })),
      showQueue: isQ && pend.length > 0, showEmpty: isQ && pend.length === 0, showHistory: tab === 'history', goHistory: () => S({ tab:'history' }),
      hChips: [['all',t.all],['approved',t.approved],['rejected',t.rejected]].map(x => ({ l:x[1], on: hf === x[0] ? 'true' : 'false', pick: () => S({ hf:x[0] }) })), hist: histRows, audit,
      approve, askReject: () => S({ dlg:'reject', note:'', nTried:false }), closeDlg: () => S({ dlg:null }), rjOpen: dlg === 'reject' && pend.length > 0, rjH: t.rjH.replace('%s', cur.title),
      sugg: t.sg.map(l => ({ l, add: () => S({ note: (note ? note.replace(/\s+$/, '') + ' ' : '') + l + '.' }) })),
      note, onNote: (e) => S({ note: e.target.value }), nErr: nTried && nBad, nCls: nTried && nBad ? 'is-error' : '', nMsg: note.length > 1000 ? t.nLong : t.nReq, nCtr: fmt(note.length) + ' / ' + fmt(1000), nCtrCls: note.length > 1000 ? 'over' : '', doReject,
      specSegs: [ seg('State','screen',[['queue','Queue',{ tab:undefined, dlg:undefined, decided:undefined }],['reject','Reject dialog',{ tab:undefined, dlg:undefined, decided:undefined, note:'', nTried:false }],['empty','Queue empty',{ tab:undefined, dlg:undefined, decided:undefined }],['history','History',{ tab:undefined, dlg:undefined, decided:undefined }]]) ]
    });
  }

}
