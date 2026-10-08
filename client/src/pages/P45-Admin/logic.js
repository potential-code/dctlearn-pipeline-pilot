// Ported verbatim from the Claude Design artboard P45-Admin (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "tab": null, "ai": null, "range": "30d", "metric": "active", "hi": null, "showTbl": false, "msgs": null, "q": "", "qErr": false, "busy": false, "toastMsg": ""}; }

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

    const tab = st('tab') || 'general';
    const aiMode = st('ai') || 'answer';
    const range = this.state.range || '30d';
    const metric = this.state.metric || 'active';
    const site = tab === 'general' ? null : MSI[tab];
    const isGeneral = !site, isLanding = !!(site && site.lo);
    const t = ar ? {
      spec:'لوحة تحكم المسؤول', ey:'إدارة DCT Learn', h1:'لوحة المنصة', sub:'مؤشرات المنصة بالكامل أو لكل موقع مصغّر، مع رؤى الذكاء الاصطناعي المبنية على بيانات مجمّعة فقط.', reports:'تقارير المواقع', newMs:'موقع مصغّر جديد', tabsLbl:'نطاق اللوحة',
      rangeLbl:'الفترة', asOf:'البيانات حتى 6 أكتوبر 2026 · 13:00 بتوقيت الخليج', fullReport:'التقرير الكامل', loTitle:'موقع بصفحة تعريفية فقط', loBody:'لا يملك هذا الموقع أعضاء أو دورات؛ تظهر هنا طلبات التسجيل في الاهتمام فقط.',
      actTitle:'النشاط عبر الزمن', metricLbl:'المؤشر', period:'الفترة', cbmTitle:'الإكمالات حسب الموقع', completionsWord:'إكمال', cbmNote:'إرتقاء يعتمد على الإرشاد دون دورات؛ رواد وإدارة المواقع الثقافية صفحات تعريفية فقط.',
      topTitle:'أكثر الدورات إقبالاً', catalog:'الكتالوج', course:'الدورة', startedDone:'بدأ · أكمل', rate:'نسبة الإكمال', noTopH:'لا توجد دورات في هذا الموقع',
      roleTitle:'المستخدمون حسب الدور', users:'المستخدمون', glance:'لمحة عن الموقع', edit:'تعديل', recTitle:'أحدث المنضمّين', allUsers:'كل المستخدمين', noRecent:'لا يوجد منضمّون جدد في هذه الفترة.',
      aiEy:'رؤى الذكاء الاصطناعي', aiTitle:'اسأل عن أداء منصتك', aiSub:'إجابات من أرقام مجمّعة: أعداد ونسب وإجماليات حسب الموقع والدورة والأسبوع.', aggOnly:'بيانات مجمّعة فقط',
      offTitle:'مزوّد الذكاء الاصطناعي معطّل (503)', offBody:'رؤى الذكاء الاصطناعي غير متاحة الآن لأن مزوّد الذكاء الاصطناعي مُعطّل في الإعدادات. بقية بيانات اللوحة تعمل كالمعتاد.', offCta:'إعدادات الذكاء الاصطناعي', retry:'إعادة المحاولة', offNote:'لم يُرسَل أي بيانات إلى المزوّد.',
      suggested:'أسئلة مقترحة', seesH:'ما الذي يراه الذكاء الاصطناعي', sees1:'أعداد ونسب وإجماليات حسب الموقع والدورة والفترة.', sees2:'لا أسماء ولا عناوين بريد ولا إجابات خطط العمل ولا سجلات GROW.',
      emptyH:'اطرح سؤالك الأول', emptyP:'اختر سؤالاً مقترحاً أو اكتب سؤالك عن النمو أو الإكمال أو الشهادات.', aiSays:'إجابة الذكاء الاصطناعي:', dataUsed:'البيانات المستخدمة:', thinking:'جارٍ تحليل البيانات المجمّعة…',
      yourQ:'سؤالك', qPh:'مثال: ما الموقع الأسرع نمواً هذا الربع؟', ask:'اسأل', qErr:'اكتب سؤالاً أولاً.', qHint:'لا تُدخل أسماء أو بيانات شخصية — تُرسل الأرقام المجمّعة فقط إلى المزوّد.', close:'إغلاق'
    } : {
      spec:'Admin dashboard', ey:'DCT Learn admin', h1:'Platform dashboard', sub:'Platform-wide numbers or one microsite at a time, plus AI insights built on aggregated data only.', reports:'Microsite reports', newMs:'New microsite', tabsLbl:'Dashboard scope',
      rangeLbl:'Range', asOf:'Data as of 6 Oct 2026 · 13:00 Gulf', fullReport:'Full report', loTitle:'Landing-only microsite', loBody:'This microsite has no members or courses; only register-interest submissions are counted here.',
      actTitle:'Activity over time', metricLbl:'Metric', period:'Period', cbmTitle:'Completions by microsite', completionsWord:'completions', cbmNote:'Elevate runs on mentoring without courses; Ruwaad and CSMD are landing-only.',
      topTitle:'Top courses', catalog:'Catalog', course:'Course', startedDone:'Started · completed', rate:'Completion', noTopH:'No courses on this microsite',
      roleTitle:'Users by role', users:'Users', glance:'At a glance', edit:'Edit', recTitle:'Recent sign-ups', allUsers:'All users', noRecent:'No new members in this period.',
      aiEy:'AI insights', aiTitle:'Ask about your platform', aiSub:'Answers come from aggregated figures — counts, rates and totals by microsite, course and week.', aggOnly:'Aggregated data only',
      offTitle:'AI provider disabled (503)', offBody:'AI insights are unavailable because the AI provider is switched off in settings. The rest of the dashboard works as usual.', offCta:'AI settings', retry:'Try again', offNote:'No data was sent to the provider.',
      suggested:'Suggested questions', seesH:'What the AI sees', sees1:'Counts, rates and totals by microsite, course and period.', sees2:'Never names, e-mails, action-plan answers or GROW logs.',
      emptyH:'Ask your first question', emptyP:'Pick a suggestion or type a question about growth, completions or certificates.', aiSays:'AI answer:', dataUsed:'Data used:', thinking:'Analysing aggregated data…',
      yourQ:'Your question', qPh:'e.g. Which microsite grew fastest this quarter?', ask:'Ask', qErr:'Type a question first.', qHint:'Don’t include names or personal data — only aggregated numbers are sent to the provider.', close:'Close'
    };
    const RL = { '7d':[L('7 days','7 أيام'),'7d'], '30d':[L('30 days','30 يوماً'),'30d'], '90d':[L('90 days','90 يوماً'),'90d'], '12m':[L('12 months','12 شهراً'),'12m'] };
    const rangeTxt = L('Last ','آخر ') + RL[range][0];
    /* ---- numbers ---- */
    const G = { '7d':{ nu:38, au:612, cp:118, ce:103, gr:1.0 }, '30d':{ nu:164, au:1284, cp:512, ce:446, gr:4.7 }, '90d':{ nu:472, au:1906, cp:1388, ce:1206, gr:14.8 }, '12m':{ nu:1318, au:2410, cp:4120, ce:3580, gr:56.0 } }[range];
    const SF = { employees:[.78,.78,.71], znm:[.12,.13,.14], elevate:[.03,.02,0], zu:[.025,.02,.03], museopro:[.02,.025,.03], nibras:[.05,.045,.05], chkforum:[.04,.03,.03], ruwaad:[0,0,0], csmd:[0,0,0] };
    const GR = { employees:13.4, znm:9.2, elevate:24.3, zu:18.4, museopro:7.2, nibras:31.3, chkforum:15.6, ruwaad:0, csmd:0 };
    const rf = { '7d':.08, '30d':.33, '90d':1, '12m':3.2 }[range];
    let K;
    if (!site) K = { tot:3672, nu:G.nu, au:G.au, cp:G.cp, ce:G.ce, gr:G.gr };
    else if (site.lo) K = null;
    else { const f = SF[site.id]; K = { tot:site.members, nu:Math.round(G.nu*f[0]), au:Math.round(G.au*f[1]), cp:Math.round(G.cp*f[2]), ce:Math.round(G.ce*f[2]*.88), gr:+(GR[site.id]*Math.min(rf,2.2)).toFixed(1) }; K.au = Math.min(K.au, Math.round(site.members*.86)); if (site.id==='elevate') K.ce = 0; }
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', plus:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 3v6M16 6h6', pulse:'M22 12h-4l-3 9L9 3l-3 9H2', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1M12 6.5l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z', up:'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6', form:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5', eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' };
    const pct = (x) => '\u2066' + (x > 0 ? '+' : '') + fmt(x) + '%\u2069';
    let kpis, kpiCls = 'k6';
    if (K) {
      kpis = [
        { l: site ? L('Members','الأعضاء') : L('Total users','إجمالي المستخدمين'), v:fmt(K.tot), u:'', n: site ? L('memberships on this microsite','عضوية في هذا الموقع') : L('accounts on DCT Learn','حساب على DCT Learn'), cls:'k-ink', d:KI.users },
        { l:L('New users','مستخدمون جدد'), v:fmt(K.nu), u:'', n:rangeTxt, cls:'k-rasp', d:KI.plus },
        { l:L('Active users','المستخدمون النشطون'), v:fmt(K.au), u:'', n:L('signed in during the range','سجّلوا الدخول خلال الفترة'), cls:'k-indigo', d:KI.pulse },
        { l:L('Completions','الإكمالات'), v:fmt(K.cp), u:'', n: site && site.id==='elevate' ? L('no courses — mentoring','لا دورات — إرشاد') : L('courses completed','دورة مكتملة'), cls:'k-red', d:KI.done },
        { l:L('Certificates','الشهادات'), v:fmt(K.ce), u:'', n:L('issued in the range','صدرت خلال الفترة'), cls:'k-yel', d:KI.award },
        { l:L('Growth','النمو'), v:pct(K.gr), u:'', n:L('members vs. start of range','الأعضاء مقارنة ببداية الفترة'), cls:'k-coral', d:KI.up }
      ];
    } else {
      kpiCls = 'k3';
      const ri = Math.max(1, Math.round(site.interest * { '7d':.12, '30d':.45, '90d':1, '12m':1 }[range]));
      kpis = [
        { l:L('Interest submissions','طلبات الاهتمام'), v:fmt(ri), u:'', n:rangeTxt, cls:'k-ink', d:KI.form },
        { l:L('Landing views','زيارات الصفحة'), v:fmt(ri*58), u:'', n:L('unique visitors','زائر فريد'), cls:'k-rasp', d:KI.eye },
        { l:L('Conversion','نسبة التحويل'), v:fmt(1.7), u:'%', n:L('views → submissions','زيارات ← طلبات'), cls:'k-yel', d:KI.up }
      ];
    }
    /* ---- time series ---- */
    const day = (off) => { const d = new Date(Date.UTC(2026,9,6) - off*864e5); return fmt(d.getUTCDate()) + ' ' + MON[d.getUTCMonth()]; };
    let labels = [], n;
    if (range === '7d') { n = 7; for (let i=6;i>=0;i--) labels.push(day(i)); }
    else if (range === '30d') { n = 30; for (let i=29;i>=0;i--) labels.push(day(i)); }
    else if (range === '90d') { n = 13; for (let i=12;i>=0;i--) labels.push(L('Wk of ','أسبوع ') + day(i*7+6)); }
    else { n = 12; for (let i=0;i<12;i++) { const m = (10 + i) % 12; labels.push(MON[m] + ' ' + (m >= 10 ? (ar?'٢٠٢٥':'2025') : (ar?'٢٠٢٦':'2026'))); } }
    const seed = (site ? site.id.length * 7 : 3) + { active:1, signups:5, completions:9 }[metric];
    const wv = Array.from({ length:n }, (_, i) => { const wk = (range==='7d'||range==='30d') ? ([0.55,1,1.08,1.04,0.98,0.92,0.5][(i+3)%7]) : 1; return Math.max(.15, (1 + .22*Math.sin(i*1.3 + seed) + .12*Math.cos(i*.7 + seed*2) + .25*i/n) * wk); });
    const sumw = wv.reduce((a,b)=>a+b,0);
    let tot, vals;
    const KK = K || { nu:0, au:0, cp:0 };
    if (metric === 'active') { const lvl = range==='7d'||range==='30d' ? KK.au/ (range==='7d'?2.6:5.2) : range==='90d' ? KK.au*.42 : KK.au*.58; vals = wv.map(w => Math.round(lvl * w)); tot = KK.au; }
    else { tot = metric === 'signups' ? KK.nu : KK.cp; vals = wv.map(w => Math.round(tot * w / sumw)); }
    if (isLanding) { tot = Math.max(1, Math.round(site.interest * { '7d':.12, '30d':.45, '90d':1, '12m':1 }[range])); vals = wv.map(w => Math.round(tot * w / sumw)); }
    const mx0 = Math.max(...vals, 1); const raw = mx0 * 1.08 / 4; const mag = Math.pow(10, Math.floor(Math.log10(raw))); const stp = [1,2,2.5,5,10].map(x => x*mag).find(x => x >= raw && (x >= 1)) || 1; const max = Math.max(4, (Number.isInteger(stp) ? stp : Math.ceil(stp)) * 4);
    const P = vals.map((v, i) => [ n === 1 ? 300 : i * 600 / (n - 1), 200 - v / max * 200 ]);
    const line = 'M' + P.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    const MNAME = { interest:L('Interest submissions','طلبات الاهتمام'), active:L('Active users','المستخدمون النشطون'), signups:L('Sign-ups','التسجيلات'), completions:L('Completions','الإكمالات') };
    const hi = (this.state.hi === null || this.state.hi === undefined || this.state.hi >= n) ? n - 1 : this.state.hi;
    const hx = (P[hi][0] / 6) ;
    const step = n > 12 ? Math.ceil(n / 6) : (n > 8 ? 2 : 1);
    const ch = {
      line, area: line + ' L600 200 L0 200 Z', total: fmt(tot),
      totalLbl: isLanding ? MNAME.interest + ' · ' + rangeTxt : metric === 'active' ? L('distinct active users · ','مستخدم نشط مختلف · ') + rangeTxt : MNAME[metric] + ' · ' + rangeTxt,
      metricName: isLanding ? MNAME.interest : MNAME[metric],
      grid: [0,1,2,3,4].map(i => ({ top: (100 - i*25) + '%', label: fmt(Math.round(max*i/4)), cls: i === 0 ? 'base' : '' })),
      xl: labels.filter((_, i) => i % step === 0 || i === n - 1).filter((x, i, a) => !(i === a.length - 2 && (n - 1) % step !== 0 && (n - 1) % step < step / 2)),
      hasHi: true, hx: hx.toFixed(2) + '%', hy: (P[hi][1] / 2).toFixed(2) + '%', hl: labels[hi], hv: fmt(vals[hi]),
      tx: hx.toFixed(2) + '%', tt: hx < 18 ? 'translate(8px,-100%)' : hx > 82 ? (ar ? 'translate(calc(100% - 8px),-100%)' : 'translate(calc(-100% - 8px),-100%)') : (ar ? 'translate(50%,-112%)' : 'translate(-50%,-112%)'),
      cols: vals.map((_, i) => ({ l: (n === 1 ? 0 : (i - .5) * 100 / (n - 1)).toFixed(2) + '%', w: (n === 1 ? 100 : 100 / (n - 1)).toFixed(2) + '%', enter: () => S({ hi:i }) })),
      leave: () => S({ hi:null }),
      rows: labels.map((l, i) => ({ l, v: fmt(vals[i]) })),
      aria: (isLanding ? MNAME.interest : MNAME[metric]) + ', ' + rangeTxt + ': ' + L('from ','من ') + fmt(vals[0]) + L(' to ',' إلى ') + fmt(vals[n-1]) + L(', peak ','، الذروة ') + fmt(mx0) + '.',
      note: isLanding ? (range==='90d' ? L('Per week','لكل أسبوع') : range==='12m' ? L('Per month','لكل شهر') : L('Per day','لكل يوم')) : metric === 'active' ? (range==='7d'||range==='30d' ? L('Daily active users','المستخدمون النشطون يومياً') : range==='90d' ? L('Weekly active users','المستخدمون النشطون أسبوعياً') : L('Monthly active users','المستخدمون النشطون شهرياً')) : (range==='90d' ? L('Per week','لكل أسبوع') : range==='12m' ? L('Per month','لكل شهر') : L('Per day','لكل يوم'))
    };
    /* ---- completions by microsite ---- */
    const share = [['employees',.71],['znm',.14],['nibras',.05],['zu',.03],['museopro',.03],['chkforum',.03]];
    const cbmMax = G.cp * .71;
    const cbm = share.map(x => { const v = Math.round(G.cp * x[1]); return { name: msShort(x[0]), c: MSI[x[0]].c, swCls: '', v: fmt(v), w: (v / cbmMax * 100).toFixed(1) + '%' }; });
    /* ---- top courses (30d base, scaled by range) ---- */
    const TOP = { general:[['C01',402,168],['C03',260,121],['C02',214,58],['C08',196,43],['C09',88,52],['C18',41,22]],
      employees:[['C01',361,152],['C03',248,116],['C02',160,41],['C08',196,43],['C05',54,14]], znm:[['C09',88,52],['C10',71,40],['C12',52,49],['C11',64,18],['C02',54,17]],
      zu:[['C13',41,12]], museopro:[['C14',22,9],['C15',17,5],['C16',9,2]], nibras:[['C18',41,22],['C19',25,6],['C20',12,3]], chkforum:[['C22',30,11],['C23',21,7]] };
    const sc = G.cp / 512;
    const topRaw = TOP[site ? site.id : 'general'] || [];
    const top = topRaw.map((x, i) => { const s = Math.max(1, Math.round(x[1]*sc)), c = Math.max(0, Math.round(x[2]*sc)); const p = Math.round(c / s * 100); return { rk: fmt(i+1), title: crs(x[0]), meta: x[0] + (site ? '' : ''), sd: fmt(s) + ' · ' + fmt(c), w: p + '%', pct: fmt(p) + '%' }; });
    const hasTop = top.length > 0;
    /* ---- roles, facts, recent ---- */
    const roles = [ [L('Learners','المتعلّمون'),3660,'#1D1650'], [L('Sub admins','المشرفون الفرعيون'),5,'#CD3151'], [L('Mentors & trainers','المرشدون والمدربون'),4,'#D63539'], [L('Judges','المحكّمون'),2,'#F77860'], [L('Admins','المسؤولون'),1,'#C99A12'] ].map(r => ({ l:r[0], v:fmt(r[1]), c:r[2] }));
    const tabsOn = site ? (site.lo ? L('None (landing page only)','لا شيء (صفحة تعريفية فقط)') : site.tabs.map(k => { const lb = site.labels[k] || TABN[k]; return ar ? lb[1] : lb[0]; }).join(ar ? '، ' : ', ')) : '';
    const facts = site ? [ { k:L('Microsite','الموقع'), v: ar ? site.ar : site.en }, { k:L('Sign-in mode','وضع الدخول'), v: (ar ? MODE[site.mode][1] : MODE[site.mode][0]) + (site.domain ? ' + @' + site.domain : '') }, { k:L('Learner tabs','تبويبات المتعلّم'), v:tabsOn },
      { k:L('Mentoring · Competition','الإرشاد · المسابقة'), v: (site.mentoring ? L('On','مفعّل') : L('Off','متوقف')) + ' · ' + (site.competition ? L('On','مفعّلة') : L('Off','متوقفة')) }, { k:L('Sub admin','المشرف الفرعي'), v: site.sa ? (ar ? site.saAr : site.sa) : L('Platform admin covers','يغطيه مسؤول المنصة') } ] : [];
    const REC = [
      ['new.member@dctlearn.example','new.member@dctlearn.example','NM','elevate','2026-10-01','invited'],
      ['Élise Martin','إليز مارتن','EM','museopro','2026-09-30','active'],
      ['Sara Haddad','سارة حداد','SH','zu','2026-09-24','active'],
      ['Ahmed Khan','أحمد خان','AK','zu','2026-09-22','active'],
      ['Hamad Al Mazrouei','حمد المزروعي','HM','nibras','2026-09-12','active'],
      ['Yousef Al Zaabi','يوسف الزعابي','YZ','znm','2026-09-08','active']
    ];
    const recent = REC.filter(r => !site || r[3] === site.id).slice(0, 5).map(r => ({ name: ar ? r[1] : r[0], ini: r[2], c: MSI[r[3]].c === '#F7C337' ? '#C99A12' : MSI[r[3]].c, sub: msShort(r[3]) + ' · ' + dt(r[4]), tag: r[5] === 'invited' ? L('Invited','مدعو') : L('Active','نشط'), tagCls: r[5] === 'invited' ? 'warn' : 'ok' }));
    /* ---- AI insights ---- */
    const QS = {
      grow:[L('Which microsite grew fastest this quarter?','ما الموقع المصغّر الأسرع نمواً هذا الربع؟')],
      low:[L('Which courses have the lowest completion rate?','ما الدورات الأقل في نسبة الإكمال؟')],
      cert:[L('How many certificates were issued in September?','كم شهادة صدرت في سبتمبر؟')]
    };
    const ANS = (key, qtext) => {
      const C = (l, cls) => ({ l, cls: cls || '' });
      if (key === 'grow') return { q:QS.grow[0], a:L('Nibras grew fastest over the last 90 days: memberships rose 31% (96 → 126), driven by the AI Aware track. Elevate followed at 24% after the mentee registration popup went live.','نبراس هو الأسرع نمواً خلال آخر 90 يوماً: ارتفعت العضويات 31% (من 96 إلى 126) بفضل مسار «واعٍ بالذكاء الاصطناعي». يليه إرتقاء بنسبة 24% بعد إطلاق نافذة تسجيل المتدرّبين.'),
        cols:[C(L('Microsite','الموقع')),C(L('90 days ago','قبل 90 يوماً'),'r'),C(L('Now','الآن'),'r'),C(L('Growth','النمو'),'r')],
        rows:[['nibras',96,126,31],['elevate',37,46,24],['zu',49,58,18],['chkforum',141,163,16],['employees',2612,2964,13]].map(r => ({ cells:[{v:msShort(r[0]),cls:''},{v:fmt(r[1]),cls:'r'},{v:fmt(r[2]),cls:'r'},{v:'\u2066+'+fmt(r[3])+'%\u2069',cls:'r num'}] })),
        du:[L('Members by microsite · 90 days','الأعضاء حسب الموقع · 90 يوماً'), L('Sign-ups by week','التسجيلات أسبوعياً')] };
      if (key === 'low') return { q:QS.low[0], a:L('Three courses sit below 30% completion in the last 30 days. Data Protection is lowest at 22% — most learners stop at the blocking quiz after unit 2 (pass mark 80%, one attempt).','ثلاث دورات أقل من 30% إكمالاً في آخر 30 يوماً. «حماية البيانات» هي الأدنى بنسبة 22% — يتوقف معظم المتعلّمين عند الاختبار الإلزامي بعد الدرس الثاني (نسبة النجاح 80%، محاولة واحدة).'),
        cols:[C(L('Course','الدورة')),C(L('Started','بدأ'),'r'),C(L('Completed','أكمل'),'r'),C(L('Rate','النسبة'),'r')],
        rows:[['C08',196,43,22],['C19',25,6,24],['C11',64,18,28]].map(r => ({ cells:[{v:crs(r[0]),cls:''},{v:fmt(r[1]),cls:'r'},{v:fmt(r[2]),cls:'r'},{v:fmt(r[3])+'%',cls:'r num'}] })),
        du:[L('Course progress aggregates · 30 days','مجاميع تقدّم الدورات · 30 يوماً'), L('Assessment pass rates','نسب النجاح في التقييمات')] };
      if (key === 'cert') return { q:QS.cert[0], a:L('431 certificates were issued in September 2026, up 18% on August (365). DCT World and DCTLEARN account for more than half.','صدرت 431 شهادة في سبتمبر 2026، بزيادة 18% عن أغسطس (365). يستحوذ «عالم الدائرة» و«منصة DCT Learn» على أكثر من نصفها.'),
        cols:[C(L('Course','الدورة')),C(L('Certificates','الشهادات'),'r'),C(L('Share','الحصة'),'r')],
        rows:[['C01',152],['C03',94],['C09',56],['C02',41],['other',88]].map(r => ({ cells:[{v: r[0]==='other' ? L('Other courses','دورات أخرى') : crs(r[0]),cls:''},{v:fmt(r[1]),cls:'r'},{v:fmt(Math.round(r[1]/431*100))+'%',cls:'r num'}] })),
        du:[L('Certificates issued by month','الشهادات الصادرة شهرياً'), L('Certificates by course','الشهادات حسب الدورة')] };
      return { q:qtext, a:L('Here is the completion rate by microsite for the ' + RL[range][0].toLowerCase() + ' — the closest aggregate to your question. Employees and ZNM lead; ZU is still mid-challenge.','إليك نسبة الإكمال حسب الموقع خلال ' + rangeTxt + ' — أقرب مؤشر مجمّع لسؤالك. يتصدّر الموظفون والمتحف؛ وما زال تحدي جامعة زايد جارياً.'),
        cols:[C(L('Microsite','الموقع')),C(L('Active','النشطون'),'r'),C(L('Completion rate','نسبة الإكمال'),'r')],
        rows:[['znm',54],['employees',41],['nibras',38],['chkforum',33],['museopro',31],['zu',29]].map(r => ({ cells:[{v:msShort(r[0]),cls:''},{v:fmt(Math.round(G.au*(SF[r[0]][1]))),cls:'r'},{v:fmt(r[1])+'%',cls:'r num'}] })),
        du:[L('Active users by microsite','النشطون حسب الموقع'), L('Completion rate by microsite','نسبة الإكمال حسب الموقع')] };
    };
    const msgs0 = this.state.msgs || (aiMode === 'empty' ? [] : [{ key:'grow' }]);
    const msgs = msgs0.map(m => { const a = ANS(m.key, m.text); return Object.assign({}, a, { cap: a.q }); });
    const ask = (key, text) => { if (this.state.busy) return; S({ busy:true, msgs: msgs0, q:'', qErr:false }); clearTimeout(this._bt); this._bt = setTimeout(() => this.setState({ busy:false, msgs: msgs0.concat([{ key, text }]) }), 900); };
    const sugg = ['grow','low','cert'].map(k => ({ q: QS[k][0], ask: () => ask(k) }));
    const q = this.state.q || '';
    const submitQ = (e) => { if (e && e.preventDefault) e.preventDefault(); const v = q.trim(); if (!v) { S({ qErr:true }); return; }
      const lv = v.toLowerCase(); const key = /grow|fast|نمو|أسرع/.test(lv) ? 'grow' : /lowest|low|drop|أقل|الأدنى/.test(lv) ? 'low' : /certif|شهاد/.test(lv) ? 'cert' : 'gen'; ask(key, v); };
    /* ---- tabs ---- */
    const tabs = [{ id:'general', label:L('General','عام'), c:'', hasSw:false }].concat(MS.map(m => ({ id:m.id, label: ar ? m.short[1] : m.short[0], c:m.c, hasSw:true }))).map(x => ({ ...x, swCls: x.id === 'csmd' ? 'edge' : '', cls: x.id === tab ? 'on' : '', on: x.id === tab, pick: () => S({ tab:x.id, hi:null, showTbl:false }) }));
    const crumbs = site ? [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Dashboard','لوحة التحكم'), href:'/admin' }, { label: ar ? site.short[1] : site.short[0] } ] : [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Dashboard','لوحة التحكم') } ];
    const sh = this.shell(ar, 'admin', 'dashboard', null, crumbs);
    const aiOff = aiMode === 'off';
    return Object.assign(base, {
      t, sh, route:'/admin' + (site ? ' · ' + site.id : ''), tabs, kpis, kpiCls, ch, cbm, top, hasTop, noTop: !hasTop, roles, facts, recent, noRecent: recent.length === 0,
      noTopP: site && site.id === 'elevate' ? L('Elevate is a mentoring programme. Track matches and sessions in the mentor pool.','إرتقاء برنامج إرشاد. تابع المطابقات والجلسات في مجموعة المرشدين.') : L('Landing-only microsites have no learner area.','المواقع ذات الصفحة التعريفية فقط لا تملك مساحة للمتعلّمين.'),
      noTopHref: site && site.id === 'elevate' ? '/admin/mentors' : '/admin/platforms', noTopCta: site && site.id === 'elevate' ? L('Open mentor pool','افتح مجموعة المرشدين') : L('Microsite settings','إعدادات الموقع'),
      isGeneral, isSite: !!site, isLanding, rangeTxt,
      ranges: ['7d','30d','90d','12m'].map(r => ({ label: RL[r][0], cls: r === range ? 'on' : '', on: r === range, pick: () => S({ range:r, hi:null }) })),
      metrics: (isLanding ? ['interest'] : ['active','signups','completions']).map(m => ({ label: MNAME[m], on: isLanding || m === metric, pick: () => S({ metric:m, hi:null }) })),
      showTbl: !!this.state.showTbl, togTbl: () => S({ showTbl: !this.state.showTbl }), tblLbl: this.state.showTbl ? L('Hide data table','إخفاء جدول البيانات') : L('Show as table','عرض كجدول'),
      aiOff, aiOn: !aiOff, sugg, msgs, noMsgs: msgs.length === 0 && !this.state.busy, busy: !!this.state.busy,
      q, qErr: !!this.state.qErr, qCls: this.state.qErr ? 'is-error' : '', onQ: (e) => S({ q: e.target.value, qErr:false }), submitQ,
      retry: () => toast(L('Still unavailable — the AI provider is disabled (503).','ما زال غير متاح — مزوّد الذكاء الاصطناعي معطّل (503).')),
      scopeTxt: (site ? msShort(site.id) : L('All microsites','كل المواقع')) + ' · ' + rangeTxt,
      specSegs: [ seg('Scope','tab',[['general','General'],['employees','Employees'],['elevate','Elevate'],['ruwaad','Ruwaad (landing)']], { hi:null }), seg('AI','ai',[['answer','Answer'],['empty','Empty'],['off','503 off']], { msgs:null, busy:false }) ]
    });
  }

}
