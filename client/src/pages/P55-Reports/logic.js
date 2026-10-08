// Ported verbatim from the Claude Design artboard P55-Reports (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "site": null, "range": "30d", "q": "", "fst": "all", "hb": null, "toastMsg": ""}; }

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
    const seg = (label, key, opts) => ({ label, btns: opts.map(o => ({ label:o[1], cls: String(st(key)) === String(o[0]) ? 'is-on' : '', pick: () => S(Object.assign({ [key]: o[0] }, o[2] || {})) })) });
    const toast = (msg) => { S({ toastMsg: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toastMsg: '' }), 4200); };
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => S({ locale:'en' }), setAr: () => S({ locale:'ar' }), toggleLang: () => S({ locale: ar ? 'en' : 'ar' }),
      toastMsg: this.state.toastMsg || '', hasToast: !!this.state.toastMsg, closeToast: () => S({ toastMsg:'' }) };

    /* ---- SEED (SEED.md §1, §4) ---- */
    const MS = [
      { id:'employees', en:'DCT Employees', ar:'موظفو الدائرة', short:['Employees','الموظفون'], c:'#EE3E43', hero:'92c83a667e1befe5661dab8c7ebca349', mode:'invite_only', domain:'dctabudhabi.ae', lo:false, tabs:['courses','workshops','mentors','ai_coaches','ai_tools'], labels:{}, courses:['C01','C02','C03','C04','C05','C06','C07','C08'], mand:['C01','C03'], mentoring:false, competition:false, sa:'Omar Al Mansoori', saAr:'عمر المنصوري', saIni:'OM', members:2964, tpl:'programme', popup:false },
      { id:'elevate', en:'Elevate 2026 Mentorship Programme', ar:'برنامج إرتقاء 2026', short:['Elevate','إرتقاء'], c:'#CD3151', hero:'9842ff4b5522772462642e07bfb6d8c1', mode:'invite_only', domain:'', lo:false, tabs:['mentors','workshops'], labels:{ workshops:['Sessions','الجلسات'] }, courses:[], mand:[], mentoring:true, competition:false, sa:'Layla Haddad', saAr:'ليلى حداد', saIni:'LH', members:46, tpl:'mentorship', popup:true },
      { id:'znm', en:'Zayed National Museum', ar:'متحف زايد الوطني', short:['ZNM','المتحف'], c:'#3B2F92', hero:'6a330c17598da2f1e81b82711e1c5e9a', mode:'invite_only', domain:'', lo:false, tabs:['courses','resources','workshops'], labels:{ courses:['ZNM Courses','دورات المتحف'], workshops:['Assessments','التقييمات'] }, courses:['C09','C10','C11','C12','C02','C01'], mand:['C09','C10','C11','C12','C02','C01'], mentoring:false, competition:false, sa:'Khalid Al Dhaheri', saAr:'خالد الظاهري', saIni:'KD', members:418, tpl:'onboarding', popup:false },
      { id:'zu', en:'Zayed University 24-Hour Challenge', ar:'تحدي جامعة زايد', short:['ZU','جامعة زايد'], c:'#F7C337', hero:'006f6b748b68e46ce2d045fcc3d92aea', mode:'invite_only', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C13'], mand:[], mentoring:false, competition:true, sa:'', saAr:'', saIni:'', members:58, tpl:'competition', popup:false },
      { id:'museopro', en:'MuseoPro', ar:'ميوزيو برو', short:['MuseoPro','ميوزيو برو'], c:'#E35E3C', hero:'2ff5095865986643708258995c8a0113', mode:'invite_only', domain:'', lo:false, tabs:['courses','resources','mentors'], labels:{ mentors:['Trainers','المدربون'] }, courses:['C14','C15','C16','C17'], mand:['C14','C15'], mentoring:false, competition:false, sa:'Camille Rousseau', saAr:'كاميل روسو', saIni:'CR', members:74, tpl:'onboarding', popup:false },
      { id:'nibras', en:'Nibras — DCT AI Champions', ar:'نبراس', short:['Nibras','نبراس'], c:'#2FC4DB', hero:'7430eed874cd248e04160ae211dc6b79', mode:'invite_only', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C18','C19','C20','C21'], mand:[], mentoring:false, competition:false, sa:'Fatima Al Suwaidi', saAr:'فاطمة السويدي', saIni:'FS', members:126, tpl:'programme', popup:false },
      { id:'chkforum', en:'Cultural Heritage & Knowledge Development Forum', ar:'منتدى التراث الثقافي', short:['Heritage Forum','منتدى التراث'], c:'#6D7782', hero:'a39ca3b3c0fdaf9dcd07000a3da4c090', mode:'open', domain:'', lo:false, tabs:['courses'], labels:{}, courses:['C22','C23'], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:163, tpl:'forum', popup:false },
      { id:'ruwaad', en:'Ruwaad — Careers in Hospitality', ar:'رواد', short:['Ruwaad','رواد'], c:'#F77860', hero:'3e5eadfa4450ed50cc8f8900fdc8e3e3', mode:'landing_only', domain:'', lo:true, tabs:[], labels:{}, courses:[], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:0, interest:38, tpl:'interest', popup:false },
      { id:'csmd', en:'Cultural Sites Management Department', ar:'إدارة المواقع الثقافية', short:['CSMD','المواقع الثقافية'], c:'#E3DCD3', hero:'a39ca3b3c0fdaf9dcd07000a3da4c090', mode:'landing_only', domain:'', lo:true, tabs:[], labels:{}, courses:[], mand:[], mentoring:false, competition:false, sa:'', saAr:'', saIni:'', members:0, interest:12, tpl:'interest', popup:false }
    ];
    const MSI = {}; MS.forEach(m => { MSI[m.id] = m; });
    const msName = (id) => { const m = MSI[id]; return m ? (ar ? m.ar : m.en) : id; };
    const msShort = (id) => { const m = MSI[id]; return m ? (ar ? m.short[1] : m.short[0]) : id; };
    const TABN = { courses:['Courses','الدورات'], workshops:['Workshops','ورش العمل'], mentors:['Mentors','المرشدون'], ai_coaches:['AI Coaches','المدربون الأذكياء'], ai_tools:['AI Tools','أدوات الذكاء الاصطناعي'], resources:['Resources','الموارد'] };
    const TABKEYS = ['courses','workshops','mentors','ai_coaches','ai_tools','resources'];
    const MODE = { open:['Open','مفتوح'], invite_only:['Invite-only','بالدعوة فقط'], landing_only:['Landing-only','صفحة تعريفية فقط'] };
    const CRS = {
      C01:['DCT World','عالم الدائرة'], C02:['Museum 101','المتاحف 101'], C03:['DCTLEARN','منصة DCT Learn'], C04:['Understanding Cultural Heritage','فهم التراث الثقافي'],
      C05:['Sustainable Tourism','السياحة المستدامة'], C06:['The World of Curation','عالم التقييم الفني'], C07:['Creative Tourism: What is it?','السياحة الإبداعية'], C08:['Data Protection for People and Performance','حماية البيانات'],
      C09:['Introduction to Ticketing','مقدمة في التذاكر'], C10:['Operational Readiness – Induction','الجاهزية التشغيلية – التعريف'], C11:['Operational Readiness – Role-Specific','الجاهزية التشغيلية – حسب الدور'], C12:['VS Knowledge Assessment','تقييم المعرفة'],
      C13:['24 Hour Challenge – Introduction to Cultural Heritage','تحدي 24 ساعة'], C14:['Condition Report: General Presentation','تقرير الحالة'], C15:['Conservation and Exhibition of Artefacts','صون وعرض القطع'], C16:['Curating an Exhibition: From Concept to Production','تنظيم المعارض'],
      C17:['Written and Oral Interpretation Tools in Heritage','أدوات التفسير'], C18:['Introduction to Generative AI','مقدمة في الذكاء الاصطناعي التوليدي'], C19:['Ethics of AI','أخلاقيات الذكاء الاصطناعي'], C20:['Foundations of Prompt Engineering','أساسيات هندسة الأوامر'],
      C21:['LLMOps','عمليات نماذج اللغة'], C22:['UNESCO: Implementation of the Convention on Diversity of Cultural Expressions','اتفاقية اليونسكو'], C23:['Abu Dhabi Creative City and Its Cooperation with Other Cities','أبوظبي مدينة مبدعة']
    };
    const crs = (k) => CRS[k] ? (ar ? CRS[k][1] : CRS[k][0]) : k;
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dt = (s) => { if (!s) return '—'; const p = s.split('-'); return fmt(+p[2]) + ' ' + MON[+p[1]-1] + ' ' + (ar ? fmt(+p[0]).replace(/[٬,]/g,'') : p[0]); };
    const dts = (s) => { const p = s.split('-'); return fmt(+p[2]) + ' ' + MON[+p[1]-1]; };

    const sid = st('site') || 'employees';
    const m = MSI[sid] || MSI.employees;
    const range = this.state.range || '30d';
    const t = ar ? {
      spec:'تقارير المواقع', ey:'التقارير', h1:'تقارير المواقع المصغّرة', sub:'تقرير لكل موقع: الأعضاء والنشاط ونسبة الإكمال والشهادات وأكثر الدورات إقبالاً، مع تصدير التقدّم بصيغة CSV.', dash:'لوحة المنصة', export:'تصدير التقدّم (CSV)', pickLbl:'اختر الموقع',
      rangeLbl:'الفترة', asOf:'البيانات حتى 6 أكتوبر 2026 · 13:00 بتوقيت الخليج', loTitle:'موقع بصفحة تعريفية فقط', topTitle:'أكثر الدورات إقبالاً', course:'الدورة', started:'بدأ', completed:'أكمل', sc:'بدأ · أكمل', rate:'نسبة الإكمال', noTopH:'لا توجد دورات',
      last8:'آخر 8 أسابيع', week:'الأسبوع', progTitle:'تقدّم المتعلّمين', csv:'CSV', search:'بحث', searchPh:'ابحث بالاسم أو البريد أو الدورة', status:'الحالة', learner:'المتعلّم', progress:'التقدّم', completedAt:'تاريخ الإكمال', cert:'الشهادة',
      exportNote:'كل عملية تصدير تُسجَّل في سجل التدقيق.', close:'إغلاق'
    } : {
      spec:'Microsite reports', ey:'Reports', h1:'Microsite reports', sub:'One report per microsite — members, activity, completion rate, certificates and top courses — with a CSV export of learner progress.', dash:'Platform dashboard', export:'Export progress CSV', pickLbl:'Choose a microsite',
      rangeLbl:'Range', asOf:'Data as of 6 Oct 2026 · 13:00 Gulf', loTitle:'Landing-only microsite', topTitle:'Top courses', course:'Course', started:'Started', completed:'Completed', sc:'Started · done', rate:'Completion', noTopH:'No courses',
      last8:'Last 8 weeks', week:'Week', progTitle:'Learner progress', csv:'CSV', search:'Search', searchPh:'Search name, e-mail or course', status:'Status', learner:'Learner', progress:'Progress', completedAt:'Completed', cert:'Certificate',
      exportNote:'Every export is recorded in the audit log.', close:'Close'
    };
    const RL = { '7d':L('7 days','7 أيام'), '30d':L('30 days','30 يوماً'), '90d':L('90 days','90 يوماً'), '12m':L('12 months','12 شهراً') };
    const rangeTxt = L('Last ','آخر ') + RL[range];
    const rf = { '7d':.23, '30d':1, '90d':2.7, '12m':8.05 }[range];
    const ACT = { employees:1002, znm:167, elevate:31, zu:26, museopro:32, nibras:58, chkforum:39, ruwaad:0, csmd:0 };
    const AF = { '7d':.48, '30d':1, '90d':1.42, '12m':1.8 }[range];
    const COMP = { employees:41, znm:54, elevate:0, zu:29, museopro:31, nibras:38, chkforum:33 };
    const CERT = { employees:2618, znm:512, elevate:0, zu:14, museopro:61, nibras:84, chkforum:47 };
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', pulse:'M22 12h-4l-3 9L9 3l-3 9H2', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1M12 6.5l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z', form:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5', chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5' };
    let kpis;
    if (m.lo) kpis = [
      { l:L('Members','الأعضاء'), v:'0', u:'', n:L('landing page only','صفحة تعريفية فقط'), cls:'k-ink', d:KI.users },
      { l:L('Interest submissions','طلبات الاهتمام'), v:fmt(Math.max(1, Math.round(m.interest * { '7d':.12, '30d':.45, '90d':1, '12m':1 }[range]))), u:'', n:rangeTxt, cls:'k-rasp', d:KI.form },
      { l:L('Completion rate','نسبة الإكمال'), v:'—', u:'', n:L('no courses','لا دورات'), cls:'k-yel', d:KI.done },
      { l:L('Certificates','الشهادات'), v:'—', u:'', n:L('no courses','لا دورات'), cls:'k-red', d:KI.award } ];
    else kpis = [
      { l:L('Members','الأعضاء'), v:fmt(m.members), u:'', n:L('current memberships','عضوية حالية'), cls:'k-ink', d:KI.users },
      { l:L('Active','النشطون'), v:fmt(Math.min(Math.round(ACT[sid]*AF), Math.round(m.members*.86))), u:'', n:L('signed in · ','سجّلوا الدخول · ') + rangeTxt, cls:'k-rasp', d:KI.pulse },
      m.id === 'elevate' ? { l:L('Mentoring matches','مطابقات الإرشاد'), v:'1', u:'', n:L('2 bookings · 1 completed','حجزان · جلسة مكتملة'), cls:'k-yel', d:KI.chat }
                         : { l:L('Completion rate','نسبة الإكمال'), v:fmt(COMP[sid]), u:'%', n:L('of started enrolments','من التسجيلات التي بدأت'), cls:'k-yel', d:KI.done },
      { l:L('Certificates','الشهادات'), v:fmt(CERT[sid]), u:'', n:L('issued to date','صدرت حتى الآن'), cls:'k-red', d:KI.award } ];
    /* top courses */
    const TOP = { employees:[['C01',361,152],['C03',248,116],['C02',160,41],['C08',196,43],['C05',54,14]], znm:[['C09',88,52],['C10',71,40],['C12',52,49],['C11',64,18],['C02',54,17]],
      zu:[['C13',41,12]], museopro:[['C14',22,9],['C15',17,5],['C16',9,2]], nibras:[['C18',41,22],['C19',25,6],['C20',12,3]], chkforum:[['C22',30,11],['C23',21,7]] };
    const top = (TOP[sid] || []).map(x => { const s = Math.max(1, Math.round(x[1]*rf)), c = Math.round(x[2]*rf); const p = Math.round(c/s*100); return { title:crs(x[0]), key:x[0], s:fmt(s), c:fmt(c), w:p+'%', pct:fmt(p)+'%' }; });
    /* engagement: weekly active, last 8 weeks */
    const wk = [0,1,2,3,4,5,6,7].map(i => { const d = new Date(Date.UTC(2026,9,5) - (7-i)*7*864e5); return d; });
    const baseW = m.lo ? m.interest/6 : ACT[sid] * .62;
    const ev = wk.map((d, i) => Math.max(0, Math.round(baseW * (0.8 + .18*Math.sin(i*1.4 + sid.length) + .03*i))));
    const emx = Math.max(...ev, 1); const raw = emx*1.08/4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); const stp = [1,2,2.5,5,10].map(x=>x*mag).find(x=>x>=raw) || 1; const emax = Math.max(4, Math.ceil(stp)*4);
    const hb = (this.state.hb === null || this.state.hb === undefined) ? 7 : this.state.hb;
    const eunit = m.lo ? L('Interest submissions','طلبات الاهتمام') : L('Weekly active learners','المتعلّمون النشطون أسبوعياً');
    const eng = { title: m.lo ? L('Interest by week','الاهتمام أسبوعياً') : L('Weekly active learners','النشطون أسبوعياً'), unit:eunit,
      grid:[0,1,2,3,4].map(i => ({ top:(100-i*25)+'%', label:fmt(Math.round(emax*i/4)), cls: i===0 ? 'base' : '' })),
      bars: ev.map((v, i) => ({ h:(v/emax*100).toFixed(1)+'%', v:fmt(v), x: fmt(wk[i].getUTCDate()) + ' ' + MON[wk[i].getUTCMonth()], l: L('Week of ','أسبوع ') + fmt(wk[i].getUTCDate()) + ' ' + MON[wk[i].getUTCMonth()], on: i === hb, cls: (i === hb ? 'on' : '') + (i >= 6 ? ' end' : ''), enter: () => S({ hb:i }) })),
      leave: () => S({ hb:null }),
      aria: eunit + ': ' + ev.map((v,i) => fmt(wk[i].getUTCDate()) + ' ' + MON[wk[i].getUTCMonth()] + ' ' + fmt(v)).join(', '),
      note: m.lo ? L('Submissions from the register-interest form on the landing page.','طلبات نموذج التسجيل في الاهتمام على الصفحة التعريفية.') : L('Distinct learners who opened at least one unit that week.','متعلّمون مختلفون فتحوا درساً واحداً على الأقل في ذلك الأسبوع.') };
    /* progress rows (SEED §4.4) */
    const P = [
      ['employees','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','C01',100,'2024-03-21','cert'],
      ['employees','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','C02',60,'',''],
      ['employees','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','C03',100,'2024-03-18','cert'],
      ['employees','Mona Al Ameri','منى العامري','MA','mona.a@dctlearn.example','C01',25,'',''],
      ['employees','Mona Al Ameri','منى العامري','MA','mona.a@dctlearn.example','C08',0,'',''],
      ['employees','Reem Al Shamsi','ريم الشامسي','RS','reem.s@dctlearn.example','C01',100,'2026-02-11','cert'],
      ['employees','Hamad Al Mazrouei','حمد المزروعي','HM','hamad.m@dctlearn.example','C01',100,'2026-05-06','cert'],
      ['znm','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','C09',100,'2026-09-10','cert'],
      ['znm','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','C10',100,'2026-09-17','cert'],
      ['znm','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','C11',40,'',''],
      ['znm','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','C12',100,'2026-09-18','none'],
      ['znm','Reem Al Shamsi','ريم الشامسي','RS','reem.s@dctlearn.example','C09',100,'2026-01-27','cert'],
      ['zu','Ahmed Khan','أحمد خان','AK','ahmed.k@example.com','C13',100,'2026-09-29','cert'],
      ['zu','Sara Haddad','سارة حداد','SH','sara.h@example.com','C13',75,'',''],
      ['museopro','Élise Martin','إليز مارتن','EM','elise.m@example.com','C14',100,'2026-09-25','cert'],
      ['museopro','Élise Martin','إليز مارتن','EM','elise.m@example.com','C15',30,'',''],
      ['nibras','Hamad Al Mazrouei','حمد المزروعي','HM','hamad.m@dctlearn.example','C18',100,'2026-09-25','ext'],
      ['nibras','Hamad Al Mazrouei','حمد المزروعي','HM','hamad.m@dctlearn.example','C19',0,'','pend']
    ];
    const q = (this.state.q || '').trim().toLowerCase();
    const fst = this.state.fst || 'all';
    const stOf = (p) => p === 100 ? 'done' : p > 0 ? 'prog' : 'not';
    const all = P.filter(r => r[0] === sid);
    const rows = all.filter(r => (fst === 'all' || stOf(r[6]) === fst) && (!q || (r[1]+' '+r[2]+' '+r[4]+' '+CRS[r[5]][0]+' '+CRS[r[5]][1]+' '+r[5]).toLowerCase().includes(q)))
      .map(r => { const s = stOf(r[6]); return { name: ar ? r[2] : r[1], ini:r[3], email:r[4], c:m.c === '#F7C337' ? '#C99A12' : m.c, course:crs(r[5]), key:r[5], p:r[6], w:r[6]+'%', pct:fmt(r[6])+'%', bar: s==='done' ? '#15801A' : '#CD3151',
        tag: s==='done' ? L('Completed','مكتملة') : s==='prog' ? L('In progress','قيد التقدّم') : L('Not started','لم تبدأ'), tagCls: s==='done' ? 'ok' : s==='prog' ? 'info' : 'mut', done: r[7] ? dt(r[7]) : '—',
        cert: r[8]==='cert' ? L('Issued','صدرت') : r[8]==='ext' ? L('External · approved','خارجية · معتمدة') : r[8]==='pend' ? L('Awaiting upload','بانتظار الرفع') : r[8]==='none' ? L('Survey — no certificate','استبيان — بلا شهادة') : '—',
        certC: r[8]==='cert'||r[8]==='ext' ? '#15801A' : r[8]==='pend' ? '#8A5A00' : '#5B636C' }; });
    const hasRows = rows.length > 0;
    const emptyH = all.length === 0 ? (m.lo ? L('No learners on a landing-only microsite','لا متعلّمين في موقع بصفحة تعريفية فقط') : m.id === 'elevate' ? L('Elevate has no courses','لا دورات في إرتقاء') : L('No progress yet','لا تقدّم بعد')) : L('No rows match these filters','لا نتائج مطابقة');
    const emptyP = all.length === 0 ? (m.lo ? L('Register-interest submissions are exported from Forms.','تُصدَّر طلبات الاهتمام من صفحة النماذج.') : m.id === 'elevate' ? L('Mentoring progress (matches, sessions, GROW log counts) is in the mentor pool.','تقدّم الإرشاد (المطابقات والجلسات وعدد سجلات GROW) في مجموعة المرشدين.') : L('Learners on this microsite haven’t started a course in the seed data.','لم يبدأ متعلّمو هذا الموقع أي دورة في بيانات العرض.')) : L('Clear the search or choose another status.','امسح البحث أو اختر حالة أخرى.');
    const fsts = [['all',L('All','الكل')],['prog',L('In progress','قيد التقدّم')],['done',L('Completed','مكتملة')],['not',L('Not started','لم تبدأ')]].map(f => ({ label:f[1], cls: f[0]===fst ? 'on' : '', on: f[0]===fst, pick: () => S({ fst:f[0] }) }));
    const from = { '7d':'2026-09-29', '30d':'2026-09-06', '90d':'2026-07-08', '12m':'2025-10-06' }[range];
    const exportCsv = () => toast(L('progress-' + sid + '_' + from + '_2026-10-06.csv exported · recorded in the audit log','تم تصدير progress-' + sid + '_' + from + '_2026-10-06.csv · سُجّل في سجل التدقيق'));
    const ms = { c:m.c, name: ar ? m.ar : m.en, img: B(m.hero), ey: (ar ? MODE[m.mode][1] : MODE[m.mode][0]) + ' · ' + L('Live','منشور'),
      facts:[ { k:L('Sub admin','المشرف الفرعي'), v: m.sa ? (ar ? m.saAr : m.sa) : L('Platform admin','مسؤول المنصة') }, { k:L('Courses','الدورات'), v: fmt(m.courses.length) }, { k:L('Slug','المعرّف'), v:'/' + m.id } ] };
    const picks = MS.map(x => ({ name: ar ? x.short[1] : x.short[0], c:x.c, meta: x.lo ? L('Landing only','تعريفية فقط') : fmt(x.members) + L(' members',' عضو'), on: x.id === sid, pick: () => S({ site:x.id, q:'', fst:'all', hb:null }) }));
    const sh = this.shell(ar, 'admin', 'reports', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Reports','التقارير'), href:'/admin/microsites' }, { label: ar ? m.short[1] : m.short[0] } ]);
    return Object.assign(base, {
      t, sh, route:'/admin/microsites', picks, ms, kpis, top, hasTop: top.length > 0, noTop: top.length === 0, eng, rows, hasRows, noRows: !hasRows, emptyH, emptyP,
      noTopP: m.id === 'elevate' ? L('Elevate is a mentoring programme without courses.','إرتقاء برنامج إرشاد بلا دورات.') : L('Landing-only microsites have no learner area.','المواقع ذات الصفحة التعريفية فقط بلا مساحة للمتعلّمين.'),
      isLanding: m.lo, loBody: L('Only the landing page exists. ' + fmt(m.interest) + ' register-interest submissions so far.','توجد الصفحة التعريفية فقط. ' + fmt(m.interest) + ' طلب اهتمام حتى الآن.'),
      rangeTxt, ranges: ['7d','30d','90d','12m'].map(r => ({ label:RL[r], cls: r===range ? 'on' : '', on: r===range, pick: () => S({ range:r }) })),
      q: this.state.q || '', onQ: (e) => S({ q: e.target.value }), fsts, exportCsv,
      rowsNote: L('Showing ' + fmt(rows.length) + ' seed rows · the export includes all ' + fmt(m.members) + ' members','عرض ' + fmt(rows.length) + ' صفوف من بيانات العرض · يشمل التصدير كل الأعضاء (' + fmt(m.members) + ')'),
      specSegs: [ seg('Microsite','site',[['employees','Employees'],['znm','ZNM'],['elevate','Elevate'],['ruwaad','Ruwaad']], { q:'', fst:'all' }) ]
    });
  }

}
