// Ported verbatim from the Claude Design artboard P48-MentorPool (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "ovl": null, "q": "", "fm": "all", "fk": "all", "open": {"hessa": true}, "inv": null, "ie": "", "ims": ["elevate"], "icats": [], "ikind": "mentor", "ierr": false, "invites": null, "editId": "rashid", "edr": null, "saved": {}, "toastMsg": ""}; }

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

    const ovl = st('ovl') || 'none';
    const t = ar ? {
      spec:'مجموعة المرشدين', ey:'مجموعة المرشدين', h1:'مجموعة المرشدين', sub:'مجموعة مشتركة من المرشدين والمدربين. ادعُ مرشدين وحدّد مواقعهم وفئاتهم ونوعهم، وتابع أعداد المتدرّبين والجلسات.', users:'المستخدمون', invite:'دعوة مرشد',
      privT:'سجلات GROW خاصة بين المرشد والمتدرّب', privP:'بصفتك مسؤولاً ترى الأعداد والتواريخ فقط — لا يظهر نص الأهداف أو الملاحظات في أي شاشة أو تصدير.', countsOnly:'أعداد فقط',
      search:'بحث', searchPh:'ابحث بالاسم أو الفئة', msL:'المواقع', kindL:'النوع', edit:'تعديل', grow:'سجلات GROW', noMatch:'لا مرشدين مطابقين', noMatchP:'امسح البحث أو المرشّحات.',
      pendT:'دعوات بانتظار القبول', pendNote:'تنتهي صلاحية الدعوة بعد 14 يوماً', email:'البريد الإلكتروني', sent:'أُرسلت', status:'الحالة', actions:'إجراءات', resend:'إعادة إرسال', revoke:'إلغاء', noInv:'لا دعوات معلّقة.',
      invT:'دعوة مرشدين', close:'إغلاق', emails:'عناوين البريد الإلكتروني', emailsH:'افصل بين العناوين بفاصلة أو سطر جديد. يتلقى كل شخص رابط دعوة.', msErr:'اختر موقعاً واحداً على الأقل.', cats:'الفئات', optional:'اختياري', cancel:'إلغاء', send:'إرسال الدعوات',
      editT:'تعديل المرشد', booking:'السماح بالحجز', bookingD:'يمكن للمتدرّبين حجز جلسات من أوقات التوفر', save:'حفظ'
    } : {
      spec:'Mentor pool', ey:'Mentor pool', h1:'Mentor pool', sub:'One shared pool of mentors and trainers. Invite mentors, set their microsites, categories and kind, and follow mentee and session counts.', users:'Users', invite:'Invite mentor',
      privT:'GROW logs stay between a mentor and their mentee', privP:'As an admin you see counts and dates only — the goal and note text never appears on any screen or export.', countsOnly:'Counts only',
      search:'Search', searchPh:'Search name or category', msL:'Microsites', kindL:'Kind', edit:'Edit', grow:'GROW logs', noMatch:'No mentors match', noMatchP:'Clear the search or filters.',
      pendT:'Pending invitations', pendNote:'Invitations expire after 14 days', email:'E-mail', sent:'Sent', status:'Status', actions:'Actions', resend:'Resend', revoke:'Revoke', noInv:'No pending invitations.',
      invT:'Invite mentors', close:'Close', emails:'E-mail addresses', emailsH:'Separate addresses with commas or new lines. Each person receives an invitation link.', msErr:'Choose at least one microsite.', cats:'Categories', optional:'optional', cancel:'Cancel', send:'Send invitations',
      editT:'Edit mentor', booking:'Allow booking', bookingD:'Mentees can book sessions from their availability', save:'Save'
    };
    const CAT = { strategy:['Strategy and Planning','الاستراتيجية والتخطيط'], heritage:['Culture and Heritage','الثقافة والتراث'], museums:['Museums and Curation','المتاحف والتقييم الفني'], marketing:['Marketing and Communications','التسويق والاتصال'], people:['People and Performance','الأفراد والأداء'], finance:['Finance and Revenue','المالية والإيرادات'], vx:['Visitor Experience and Events','تجربة الزوار والفعاليات'], libraries:['Libraries and Publishing','المكتبات والنشر'], tourism:['Tourism and International Operations','السياحة والعمليات الدولية'], legal:['Legal and Governance','الشؤون القانونية والحوكمة'], sustain:['Sustainability','الاستدامة'], excellence:['Business Excellence and Quality','التميز المؤسسي والجودة'], youth:['Youth and Community Engagement','الشباب والمجتمع'], research:['Research','البحث'] };
    const catN = (k) => ar ? CAT[k][1] : CAT[k][0];
    const M0 = [
      { id:'hessa', en:'Dr. Hessa Al Nuaimi', ar:'د. حصة النعيمي', ini:'HN', c:'#CD3151', email:'hessa.n@example.com', title:['Director, Museums Strategy','مديرة استراتيجية المتاحف'], cats:['museums','strategy'], ms:['elevate'], kind:'mentor', book:true, avail:['Sun–Thu · 10:00–13:00 Gulf','الأحد–الخميس · 10:00–13:00 بتوقيت الخليج'], done:1, up:1, grow:1, rating:'5.0',
        mentees:[{ n:['Saeed Al Hammadi','سعيد الحمادي'], ms:'elevate', matched:'2026-09-20', how:['AI match · 87%','مطابقة ذكية · 87%'], sess:['1 completed · next Mon 12 Oct 11:00','جلسة مكتملة · القادمة الإثنين 12 أكتوبر 11:00'], grow:1, last:'2026-09-28' }] },
      { id:'rashid', en:'Rashid Al Blooshi', ar:'راشد البلوشي', ini:'RB', c:'#3B2F92', email:'rashid.b@example.com', title:['Head of Visitor Experience','رئيس تجربة الزوار'], cats:['vx','tourism'], ms:['elevate'], kind:'mentor', book:true, avail:['Mon, Wed · 14:00–17:00 Gulf','الإثنين والأربعاء · 14:00–17:00 بتوقيت الخليج'], done:0, up:0, grow:0,
        note:['Suggested to 1 mentee (71% match)','مقترح لمتدرّب واحد (مطابقة 71%)'], mentees:[] },
      { id:'mariam', en:'Mariam Khoury', ar:'مريم خوري', ini:'MK', c:'#E35E3C', email:'mariam.k@example.com', title:['Senior Manager, People & Performance','مديرة أولى، الأفراد والأداء'], cats:['people','marketing'], ms:['elevate','employees'], kind:'mentor', book:true, avail:['Tue, Thu · 09:00–12:00 Gulf','الثلاثاء والخميس · 09:00–12:00 بتوقيت الخليج'], done:0, up:0, grow:0,
        mentees:[{ n:['Reem Al Shamsi','ريم الشامسي'], ms:'employees', matched:'2026-09-24', how:['Chosen by mentee','اختيار المتدرّبة'], sess:['1 cancelled by mentor (travel) · 2 Oct','جلسة ألغتها المرشدة (سفر) · 2 أكتوبر'], grow:0, last:'' }] },
      { id:'jl', en:'Jean-Luc Morel', ar:'جان لوك موريل', ini:'JM', c:'#1D1650', email:'jl.morel@example.com', title:['Conservation Trainer, France Muséums','مدرّب صون، فرانس ميوزيوم'], cats:['museums'], ms:['museopro'], kind:'trainer', book:false, avail:['No booking — trainer for C14, C15','بلا حجز — مدرّب للدورتين C14 وC15'], done:0, up:0, grow:0, mentees:[] }
    ];
    const saved = this.state.saved || {};
    const MM = M0.map(m => Object.assign({}, m, saved[m.id] || {}));
    const q = (this.state.q || '').trim().toLowerCase(), fm = this.state.fm || 'all', fk = this.state.fk || 'all';
    const open = this.state.open || {};
    const list = MM.filter(m => (fm === 'all' || m.ms.includes(fm)) && (fk === 'all' || m.kind === fk) && (!q || (m.en + ' ' + m.ar + ' ' + m.cats.map(k => CAT[k].join(' ')).join(' ')).toLowerCase().includes(q)));
    const cards = list.map(m => ({ hid:'mn-' + m.id, mid:'mt-' + m.id, name: ar ? m.ar : m.en, ini:m.ini, c:m.c, title: ar ? m.title[1] : m.title[0], email:m.email,
      kind: m.kind === 'trainer' ? L('Trainer','مدرّب') : L('Mentor','مرشد'), kindCls: m.kind === 'trainer' ? 'yel' : 'info', book: m.book ? L('Booking on','الحجز مفعّل') : L('No booking','بلا حجز'), bookCls: m.book ? 'ok' : 'mut',
      ms: m.ms.map(s => ({ n:msShort(s), c:MSI[s].c })), cats: m.cats.map(catN),
      k1: m.kind === 'trainer' ? L('Courses','الدورات') : L('Mentees','المتدرّبون'), v1: fmt(m.kind === 'trainer' ? 2 : m.mentees.length), k2: L('Completed','مكتملة'), v2: fmt(m.done), k3: L('Upcoming','قادمة'), v3: fmt(m.up), v4: fmt(m.grow),
      avail: ar ? m.avail[1] : m.avail[0], note: m.note ? (ar ? m.note[1] : m.note[0]) : (m.rating ? L('Rated ' + m.rating + ' by 1 mentee','تقييم ' + m.rating + ' من متدرّب واحد') : ''),
      hasMentees: m.mentees.length > 0, noMentees: m.mentees.length === 0, noneTxt: m.kind === 'trainer' ? L('Trainers teach courses; they have no mentees.','المدربون يقدّمون الدورات ولا متدرّبين لهم.') : L('No mentees matched yet.','لا متدرّبين بعد.'),
      open: !!open[m.id], tog: () => S({ open: Object.assign({}, open, { [m.id]: !open[m.id] }) }), togL: (open[m.id] ? L('Hide mentees','إخفاء المتدرّبين') : L('Show mentees','عرض المتدرّبين')) + ' (' + fmt(m.mentees.length) + ')',
      since: L('In the pool since ','في المجموعة منذ ') + (m.id === 'hessa' ? dt('2026-08-30') : dt('2026-09-02')),
      mentees: m.mentees.map(x => ({ name: ar ? x.n[1] : x.n[0], sub: msShort(x.ms) + ' · ' + L('matched ','مطابقة في ') + dts(x.matched) + ' · ' + (ar ? x.how[1] : x.how[0]), sess: ar ? x.sess[1] : x.sess[0],
        grow: fmt(x.grow) + L(' GROW log' + (x.grow === 1 ? '' : 's') + ' · text hidden',' سجل GROW · النص مخفي'), last: x.last ? L('Last log ','آخر سجل ') + dt(x.last) : L('No logs yet','لا سجلات بعد') })),
      edit: () => S({ ovl:'edit', editId:m.id, edr:null }), editL: t.edit + ' ' + (ar ? m.ar : m.en) }));
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M9 7h7M9 11h5', link:'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7', cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 15l2 2 4-4' };
    const kpis = [ { l:L('Mentors','المرشدون'), v:fmt(MM.filter(m => m.kind === 'mentor').length), u:'', n:L('active in the pool','نشطون في المجموعة'), cls:'k-rasp', d:KI.users },
      { l:L('Trainers','المدربون'), v:fmt(MM.filter(m => m.kind === 'trainer').length), u:'', n:L('MuseoPro courses','دورات ميوزيو برو'), cls:'k-indigo', d:KI.book },
      { l:L('Matched mentees','متدرّبون مطابَقون'), v:fmt(2), u:'', n:L('Elevate & Employees','إرتقاء والموظفون'), cls:'k-yel', d:KI.link },
      { l:L('Sessions','الجلسات'), v:fmt(3), u:'', n:L('1 completed · 1 upcoming · 1 cancelled','مكتملة 1 · قادمة 1 · ملغاة 1'), cls:'k-ink', d:KI.cal } ];
    /* invitations */
    const invites = this.state.invites || [{ email:'new.mentor@example.com', ms:['elevate'], kind:'mentor', sent:'2026-10-04', st:'pending' }];
    const invs = invites.map((v, i) => ({ email:v.email, ms: v.ms.map(s => ({ n:msShort(s), c:MSI[s].c })), kind: v.kind === 'trainer' ? L('Trainer','مدرّب') : L('Mentor','مرشد'), sent: dt(v.sent) + L(' · expires ',' · تنتهي ') + dts(v.sent === '2026-10-04' ? '2026-10-18' : '2026-10-20'),
      st: v.st === 'pending' ? L('Pending','معلّقة') : L('Revoked','ملغاة'), stCls: v.st === 'pending' ? 'warn' : 'mut', live: v.st === 'pending',
      resend: () => { S({ invites: invites.map((x, j) => j === i ? Object.assign({}, x, { sent:'2026-10-06' }) : x) }); toast(L('New invitation sent to ' + v.email + ' — the old link no longer works','أُرسلت دعوة جديدة إلى ' + v.email + ' — الرابط القديم لم يعد يعمل')); },
      revoke: () => { S({ invites: invites.map((x, j) => j === i ? Object.assign({}, x, { st:'revoked' }) : x) }); toast(L('Invitation to ' + v.email + ' revoked · logged','أُلغيت دعوة ' + v.email + ' · مسجّل')); },
      resendL: t.resend + ' ' + v.email, revokeL: t.revoke + ' ' + v.email }));
    /* invite dialog */
    const ieV = this.state.ie || '';
    const emails = ieV.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    const badE = emails.filter(e => !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(e));
    const dup = emails.filter(e => MM.some(m => m.email === e.toLowerCase()) || invites.some(v => v.email === e.toLowerCase() && v.st === 'pending'));
    const ierr = !!this.state.ierr;
    const ieMsg = !emails.length ? L('Enter at least one e-mail address.','أدخل بريداً إلكترونياً واحداً على الأقل.') : badE.length ? L('Check: ','تحقق من: ') + badE.join(', ') : dup.length ? L('Already in the pool or invited: ','موجود في المجموعة أو مدعو: ') + dup.join(', ') : '';
    const imsSel = this.state.ims || [];
    const icats = this.state.icats || [];
    const ikind = this.state.ikind || 'mentor';
    const POOL_MS = MS.filter(m => !m.lo);
    const sendInvite = () => { if (ieMsg || !imsSel.length) { S({ ierr:true }); return; }
      S({ invites: emails.map(e => ({ email:e.toLowerCase(), ms:imsSel, kind:ikind, sent:'2026-10-06', st:'pending' })).concat(invites), ovl:'none', ie:'', ierr:false });
      toast(L(emails.length + ' invitation' + (emails.length > 1 ? 's' : '') + ' sent · recorded in the audit log','أُرسلت ' + fmt(emails.length) + ' دعوات · سُجّلت في سجل التدقيق')); };
    /* edit dialog */
    const em = MM.find(m => m.id === this.state.editId) || MM[1];
    const edr = this.state.edr || { ms: em.ms.slice(), cats: em.cats.slice(), kind: em.kind, book: em.book };
    const setE = (o) => S({ edr: Object.assign({}, edr, o) });
    const ed = { name: ar ? em.ar : em.en, ms: POOL_MS.map(m => ({ n:msShort(m.id), c:m.c, on: edr.ms.includes(m.id), tog: () => setE({ ms: edr.ms.includes(m.id) ? edr.ms.filter(x => x !== m.id) : edr.ms.concat([m.id]) }) })), msBad: edr.ms.length === 0,
      cats: Object.keys(CAT).map(k => ({ n:catN(k), on: edr.cats.includes(k), cls: edr.cats.includes(k) ? 'on' : '', tog: () => setE({ cats: edr.cats.includes(k) ? edr.cats.filter(x => x !== k) : edr.cats.concat([k]) }) })),
      kinds: [['mentor',L('Mentor','مرشد'),L('Mentees book sessions; writes GROW logs','يحجز المتدرّبون جلسات؛ يكتب سجلات GROW')],['trainer',L('Trainer','مدرّب'),L('Linked to courses; no booking','مرتبط بالدورات؛ بلا حجز')]].map(o => ({ l:o[1], d:o[2], on: edr.kind === o[0], pick: () => setE({ kind:o[0], book: o[0] === 'trainer' ? false : edr.book }) })),
      book: edr.book, togBook: () => setE({ book: !edr.book }) };
    const saveEdit = () => { if (!edr.ms.length) return; S({ saved: Object.assign({}, saved, { [em.id]: edr }), ovl:'none', edr:null }); toast(L((em.en) + ' updated · recorded in the audit log','تم تحديث ' + em.ar + ' · سُجّل في سجل التدقيق')); };
    const closeOvl = () => S({ ovl:'none', ierr:false, edr:null });
    const sh = this.shell(ar, 'admin', 'mentors', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Mentor pool','مجموعة المرشدين') } ]);
    return Object.assign(base, {
      t, sh, route:'/admin/mentors', kpis, cards, hasCards: cards.length > 0, noCards: cards.length === 0,
      q: this.state.q || '', onQ: (e) => S({ q: e.target.value }),
      fms: [['all',L('All','الكل')],['elevate',msShort('elevate')],['employees',msShort('employees')],['museopro',msShort('museopro')]].map(f => ({ label:f[1], cls: f[0] === fm ? 'on' : '', on: f[0] === fm, pick: () => S({ fm:f[0] }) })),
      fks: [['all',L('All','الكل')],['mentor',L('Mentors','مرشدون')],['trainer',L('Trainers','مدربون')]].map(f => ({ label:f[1], cls: f[0] === fk ? 'on' : '', on: f[0] === fk, pick: () => S({ fk:f[0] }) })),
      invs, hasInv: invs.length > 0, noInv: invs.length === 0,
      showInvite: ovl === 'invite', showEdit: ovl === 'edit', openInvite: () => S({ ovl:'invite', ierr:false }), closeOvl, bgClose: (e) => { if (e.target === e.currentTarget) closeOvl(); },
      ie: { v: ieV, bad: ierr && !!ieMsg, cls: ierr && ieMsg ? 'is-error' : '', msg: ieMsg }, onIe: (e) => S({ ie: e.target.value }),
      ims: POOL_MS.map(m => ({ n:msShort(m.id), c:m.c, on: imsSel.includes(m.id), tog: () => S({ ims: imsSel.includes(m.id) ? imsSel.filter(x => x !== m.id) : imsSel.concat([m.id]) }) })), imsBad: ierr && !imsSel.length,
      icats: Object.keys(CAT).map(k => ({ n:catN(k), on: icats.includes(k), cls: icats.includes(k) ? 'on' : '', tog: () => S({ icats: icats.includes(k) ? icats.filter(x => x !== k) : icats.concat([k]) }) })),
      ikinds: [['mentor',L('Mentor','مرشد'),L('Takes mentees and sessions','يستقبل متدرّبين وجلسات')],['trainer',L('Trainer','مدرّب'),L('Teaches linked courses','يقدّم دورات مرتبطة')]].map(o => ({ l:o[1], d:o[2], on: ikind === o[0], pick: () => S({ ikind:o[0] }) })),
      sendInvite, ed, saveEdit,
      specSegs: [ seg('Overlay','ovl',[['none','None'],['invite','Invite dialog'],['edit','Edit Rashid']], { ierr:false, edr:null, editId:'rashid' }) ]
    });
  }

}
