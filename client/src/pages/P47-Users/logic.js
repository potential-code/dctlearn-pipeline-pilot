// Ported verbatim from the Claude Design artboard P47-Users (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "tab": null, "ovl": null, "q": "", "fr": "all", "fm": "all", "fs": "all", "editId": "saeed", "dr": null, "derr": "", "resetSent": false, "edits": {}, "added": [], "auditX": [], "fa": "all", "file": "", "welcome": true, "toastMsg": ""}; }

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

    const tab = st('tab') || 'users';
    const ovl = st('ovl') || 'none';
    const t = ar ? {
      spec:'المستخدمون والأدوار', ey:'المنصة', h1:'المستخدمون والأدوار', sub:'دور واحد لكل حساب، وعضويات متعددة في المواقع. التعطيل وتغيير الدور يسريان فوراً ويُسجَّلان في سجل التدقيق.', import:'استيراد مستخدمين (CSV)',
      allUsers:'كل المستخدمين', oneRole:'دور واحد لكل حساب', search:'بحث', searchPh:'ابحث بالاسم أو البريد', role:'الدور', ms:'المواقع', status:'الحالة', clear:'مسح المرشّحات', user:'المستخدم', last:'آخر دخول', actions:'إجراءات', edit:'تعديل',
      noMatch:'لا مستخدمين مطابقين', noMatchP:'جرّب بحثاً آخر أو امسح المرشّحات.', prev:'السابق', next:'التالي',
      auditT:'سجل التدقيق', auditRO:'للقراءة فقط — لا يمكن تعديل الإدخالات أو حذفها', actionLbl:'النوع', when:'الوقت (الخليج)', actor:'المنفّذ', action:'الإجراء', target:'الهدف', platform:'المنصة', auditNote:'يشمل إجراءات المسؤول والمشرفين الفرعيين.',
      editUser:'تعديل المستخدم', close:'إغلاق', account:'الحساب', fullName:'الاسم الكامل', reqName:'هذا الحقل مطلوب.', email:'البريد الإلكتروني', emailH:'يغيّر المستخدم بريده من ملفه الشخصي بعد التحقق.', roleH:'دور واحد لكل حساب. يسري التغيير من الطلب التالي.', selfRole:'لا يمكنك إزالة دور المسؤول عن حسابك.',
      memberships:'العضويات', msH:'إزالة العضوية تُبقي التقدّم والشهادات.', access:'الوصول', invPend:'الدعوة بانتظار القبول', disT:'سيُسجَّل خروج المستخدم فوراً', disP:'يُرفض أي طلب من حساب معطّل. يمكن إعادة التفعيل في أي وقت.',
      profile:'الملف', trail:'سجل هذا المستخدم', noTrail:'لا إجراءات مسجّلة لهذا المستخدم.', fixErr:'صحّح الحقول المعلّمة.', cancel:'إلغاء', save:'حفظ التغييرات',
      importT:'استيراد مستخدمين من CSV', drop:'اسحب ملف CSV هنا أو انقر للاختيار', dropH:'حتى 2 ميغابايت أو 5,000 صف · UTF-8', useSample:'استخدم ملف العرض hr-october.csv', dlSample:'تنزيل ملف نموذجي', colsT:'الأعمدة', colsH:'الأعمدة الملوّنة مطلوبة. افصل المواقع بفاصلة منقوطة.',
      rows6:'6 صفوف', another:'اختر ملفاً آخر', create:'إنشاء', update:'تحديث', skip:'تخطي', row:'الصف', result:'النتيجة', welcome:'إرسال بريد ترحيبي للمستخدمين الجدد', welcomeH:'يتضمن رابط تعيين كلمة المرور (صالح 14 يوماً).', back:'رجوع', confirm:'تأكيد الاستيراد',
      doneT:'اكتمل الاستيراد', doneNote:'سُجّل الاستيراد في سجل التدقيق. يظهر المستخدمون الجدد بحالة «مدعو» حتى يعيّنوا كلمة المرور.', viewAudit:'عرض سجل التدقيق', done:'تم'
    } : {
      spec:'Users & roles', ey:'Platform', h1:'Users & roles', sub:'One role per account, many microsite memberships. Disabling and role changes apply on the next request and are written to the audit log.', import:'Import users (CSV)',
      allUsers:'All users', oneRole:'One role per account', search:'Search', searchPh:'Search name or e-mail', role:'Role', ms:'Microsites', status:'Status', clear:'Clear filters', user:'User', last:'Last sign-in', actions:'Actions', edit:'Edit',
      noMatch:'No users match', noMatchP:'Try another search or clear the filters.', prev:'Previous', next:'Next',
      auditT:'Audit log', auditRO:'Read-only — entries can’t be edited or deleted', actionLbl:'Type', when:'When (Gulf)', actor:'Actor', action:'Action', target:'Target', platform:'Platform', auditNote:'Covers admin and sub-admin actions.',
      editUser:'Edit user', close:'Close', account:'Account', fullName:'Full name', reqName:'This field is required.', email:'E-mail', emailH:'Users change their e-mail from their profile, after verification.', roleH:'One role per account. The change applies on the next request.', selfRole:'You can’t remove the admin role from your own account.',
      memberships:'Memberships', msH:'Removing a membership keeps progress and certificates.', access:'Access', invPend:'Invitation pending', disT:'The user is signed out immediately', disP:'Every request from a disabled account is refused. You can re-enable it any time.',
      profile:'Profile', trail:'Audit trail for this user', noTrail:'No recorded actions for this user.', fixErr:'Fix the highlighted fields.', cancel:'Cancel', save:'Save changes',
      importT:'Import users from CSV', drop:'Drop a CSV file here or click to choose', dropH:'Up to 2 MB or 5,000 rows · UTF-8', useSample:'Use demo file hr-october.csv', dlSample:'Download sample CSV', colsT:'Columns', colsH:'Highlighted columns are required. Separate microsites with semicolons.',
      rows6:'6 rows', another:'Choose another file', create:'create', update:'update', skip:'skip', row:'Row', result:'Result', welcome:'Send a welcome e-mail to new users', welcomeH:'Includes a set-password link (valid 14 days).', back:'Back', confirm:'Confirm import',
      doneT:'Import complete', doneNote:'The import is recorded in the audit log. New users show as “invited” until they set a password.', viewAudit:'View audit log', done:'Done'
    };
    const ROLE = { learner:[L('Learner','متعلّم'),'mut'], mentor:[L('Mentor','مرشد'),'info'], judge:[L('Judge','محكّم'),'warn'], sub_admin:[L('Sub admin','مشرف فرعي'),'red'], admin:[L('Admin','مسؤول'),'yel'] };
    const STAT = { active:[L('Active','نشط'),'ok'], invited:[L('Invited','مدعو'),'warn'], disabled:[L('Disabled','معطّل'),'bad'] };
    /* SEED §4 people */
    const U0 = [
      ['aisha','Aisha Al Marzouqi','عائشة المرزوقي','AM','aisha.admin@dctlearn.example','admin',[],'active','2026-10-06 08:52','#1D1650',{ pos:['Platform admin','مسؤولة المنصة'] }],
      ['omar','Omar Al Mansoori','عمر المنصوري','OM','omar.m@dctlearn.example','sub_admin',['employees'],'active','2026-10-05 17:10','#EE3E43',{}],
      ['layla','Layla Haddad','ليلى حداد','LH','layla.h@dctlearn.example','sub_admin',['elevate'],'active','2026-10-05 12:31','#CD3151',{}],
      ['khalid','Khalid Al Dhaheri','خالد الظاهري','KD','khalid.d@dctlearn.example','sub_admin',['znm'],'active','2026-10-05 16:22','#3B2F92',{}],
      ['camille','Camille Rousseau','كاميل روسو','CR','camille.r@example.com','sub_admin',['museopro'],'active','2026-10-02 10:05','#E35E3C',{}],
      ['fatima','Fatima Al Suwaidi','فاطمة السويدي','FS','fatima.s@dctlearn.example','sub_admin',['nibras'],'active','2026-10-04 09:47','#0E7C8C',{}],
      ['hessa','Dr. Hessa Al Nuaimi','د. حصة النعيمي','HN','hessa.n@example.com','mentor',['elevate'],'active','2026-10-03 14:02','#CD3151',{ kind:'mentor' }],
      ['rashid','Rashid Al Blooshi','راشد البلوشي','RB','rashid.b@example.com','mentor',['elevate'],'active','2026-09-30 15:40','#CD3151',{ kind:'mentor' }],
      ['mariam','Mariam Khoury','مريم خوري','MK','mariam.k@example.com','mentor',['elevate','employees'],'active','2026-10-01 09:12','#CD3151',{ kind:'mentor' }],
      ['jl','Jean-Luc Morel','جان لوك موريل','JM','jl.morel@example.com','mentor',['museopro'],'active','2026-09-26 11:20','#E35E3C',{ kind:'trainer' }],
      ['newmentor','new.mentor@example.com','new.mentor@example.com','NM','new.mentor@example.com','mentor',['elevate'],'invited','','#6D7782',{ inv:'2026-10-04', exp:'2026-10-18' }],
      ['noura','Noura Al Kaabi','نورة الكعبي','NK','noura.k@example.com','judge',['zu'],'active','2026-10-05 19:15','#C99A12',{}],
      ['daniel','Daniel Osei','دانيال أوسي','DO','daniel.o@example.com','judge',['zu'],'invited','','#C99A12',{ inv:'2026-10-03', exp:'2026-10-17' }],
      ['saeed','Saeed Al Hammadi','سعيد الحمادي','SA','saeed.h@dctlearn.example','learner',['employees','elevate'],'active','2026-10-06 08:40','#D63539',{ emp:'EMP-•••218', pos:['Specialist, DCT Culture','أخصائي، قطاع الثقافة'], hire:'2024-03-03', pts:280, certs:2, legacy:'WP-10418' }],
      ['mona','Mona Al Ameri','منى العامري','MA','mona.a@dctlearn.example','learner',['employees'],'active','2026-09-28 13:05','#E35E3C',{ emp:'EMP-•••077', pos:['Section Head, Support Services','رئيسة قسم، الخدمات المساندة'], hire:'2019-11-10', pts:40, certs:0, legacy:'WP-2291' }],
      ['yousef','Yousef Al Zaabi','يوسف الزعابي','YZ','yousef.z@dctlearn.example','learner',['znm'],'active','2026-10-04 07:58','#3B2F92',{ emp:'EMP-•••530', pos:['Gallery Host, ZNM','مضيف قاعة، المتحف'], hire:'2026-08-24', pts:310, certs:2 }],
      ['reem','Reem Al Shamsi','ريم الشامسي','RS','reem.s@dctlearn.example','learner',['znm','employees'],'active','2026-10-03 18:20','#3B2F92',{ emp:'EMP-•••612', pos:['Ticketing Host, ZNM','مضيفة التذاكر، المتحف'], hire:'2025-12-14', pts:200, certs:2 }],
      ['ahmed','Ahmed Khan','أحمد خان','AK','ahmed.k@example.com','learner',['zu'],'active','2026-10-01 21:44','#C99A12',{ pos:['ZU student','طالب في جامعة زايد'], pts:130, certs:1 }],
      ['sara','Sara Haddad','سارة حداد','SH','sara.h@example.com','learner',['zu'],'active','2026-10-05 22:10','#C99A12',{ pos:['ZU student','طالبة في جامعة زايد'], pts:90, certs:0 }],
      ['elise','Élise Martin','إليز مارتن','EM','elise.m@example.com','learner',['museopro'],'active','2026-10-02 16:35','#E35E3C',{ pos:['Collections officer','مسؤولة مجموعات'], pts:140, certs:1 }],
      ['hamad','Hamad Al Mazrouei','حمد المزروعي','HM','hamad.m@dctlearn.example','learner',['nibras','employees'],'active','2026-10-05 10:02','#0E7C8C',{ emp:'EMP-•••349', pos:['Data analyst','محلل بيانات'], hire:'2022-06-01', pts:150, certs:2, legacy:'WP-7720' }],
      ['newmember','new.member@dctlearn.example','new.member@dctlearn.example','NM','new.member@dctlearn.example','learner',['elevate'],'invited','','#6D7782',{ inv:'2026-10-01', exp:'2026-10-15' }],
      ['former','former.staff@dctlearn.example','former.staff@dctlearn.example','FS','former.staff@dctlearn.example','learner',['employees'],'disabled','2026-08-14 12:00','#6D7782',{ legacy:'WP-1193' }]
    ];
    const edits = this.state.edits || {};
    const added = (this.state.added || []);
    const USERS = U0.concat(added).map(r => { const u = { id:r[0], en:r[1], ar:r[2], ini:r[3], email:r[4], role:r[5], ms:r[6], status:r[7], last:r[8], c:r[9], x:r[10] }; return Object.assign(u, edits[u.id] || {}); });
    const uname = (u) => ar ? u.ar : u.en;
    const lastTxt = (s) => { if (!s) return L('Never','لم يسجّل'); const [d, tm] = s.split(' '); return (d === '2026-10-06' ? L('Today','اليوم') : dts(d)) + ' · ' + tm; };
    /* filters */
    const q = (this.state.q || '').trim().toLowerCase(), fr = this.state.fr || 'all', fm = this.state.fm || 'all', fs = this.state.fs || 'all';
    const list = USERS.filter(u => (fr === 'all' || u.role === fr) && (fs === 'all' || u.status === fs) && (fm === 'all' || u.ms.includes(fm) || (u.role === 'admin')) && (!q || (u.en + ' ' + u.ar + ' ' + u.email).toLowerCase().includes(q)));
    const openEdit = (id) => S({ ovl:'edit', editId:id, dr:null, derr:'', resetSent:false });
    const rows = list.map(u => ({ name: uname(u), ini:u.ini, c:u.c, iniCls:'', email: u.en.includes('@') ? (u.status === 'disabled' ? L('Former employee · name removed','موظف سابق · حُذف الاسم') : L('Name added on acceptance','يُضاف الاسم عند القبول')) : u.email, role: ROLE[u.role][0], roleCls: ROLE[u.role][1], kind: u.x.kind === 'trainer' ? L('Trainer · courses C14, C15','مدرّب · الدورتان C14 وC15') : '',
      ms: u.role === 'admin' ? [{ n:L('All microsites','كل المواقع'), c:'#1D1650', e:'' }] : u.ms.slice(0, 2).map(m => ({ n:msShort(m), c:MSI[m].c, e:'' })), more: u.ms.length > 2 ? '+' + fmt(u.ms.length - 2) : '',
      st: STAT[u.status][0], stCls: STAT[u.status][1], rowCls: u.status === 'disabled' ? 'dis' : '', last: u.status === 'invited' ? L('Invited ','دُعي في ') + dts(u.x.inv || '2026-10-06') : lastTxt(u.last), edit: () => openEdit(u.id), editL: t.edit + ' ' + uname(u) }));
    /* audit */
    const A0 = [
      ['2026-10-05 16:20','khalid','resource.submit',L('Submitted a resource for review','قدّم مورداً للمراجعة'),L('“Ticketing FAQ sheet”','«Ticketing FAQ sheet»'),'znm','content',''],
      ['2026-10-04 11:05','aisha','mentor.invite',L('Invited a mentor','دعا مرشداً'),'new.mentor@example.com','elevate','members','newmentor'],
      ['2026-10-03 10:12','aisha','judge.invite',L('Invited a judge','دعا محكّماً'),L('Daniel Osei','دانيال أوسي'),'zu','members','daniel'],
      ['2026-10-02 14:37','layla','microsite.request',L('Requested a new microsite','طلبت موقعاً مصغّراً جديداً'),L('“Elevate Alumni” — keep 2025 cohort engaged','«Elevate Alumni» — الحفاظ على تفاعل دفعة 2025'),'elevate','sites',''],
      ['2026-10-01 09:30','layla','invitation.create',L('Invited a member','دعت عضواً'),'new.member@dctlearn.example','elevate','members','newmember'],
      ['2026-09-30 15:02','aisha','user.disable',L('Disabled an account','عطّلت حساباً'),'former.staff@dctlearn.example','employees','roles','former'],
      ['2026-09-29 12:44','aisha','resource.reject',L('Rejected a resource with a note','رفضت مورداً مع ملاحظة'),L('“Internal SharePoint link” — use a public https link','«Internal SharePoint link» — استخدم رابط https عاماً'),'employees','content',''],
      ['2026-09-25 10:18','aisha','external_cert.approve',L('Approved an external certificate','اعتمدت شهادة خارجية'),L('Hamad Al Mazrouei — Introduction to Generative AI','حمد المزروعي — مقدمة في الذكاء الاصطناعي التوليدي'),'nibras','content','hamad'],
      ['2026-09-22 09:05','aisha','users.import',L('Imported users from CSV','استوردت مستخدمين من CSV'),L('hr-september.csv — 41 created, 6 updated, 2 skipped','hr-september.csv — إنشاء 41، تحديث 6، تخطي 2'),'employees','members',''],
      ['2026-09-20 13:40','aisha','user.role_change',L('Changed a role','غيّرت دوراً'),L('Camille Rousseau: learner → sub admin','كاميل روسو: متعلّم ← مشرف فرعي'),'museopro','roles','camille'],
      ['2026-09-20 10:02','aisha','membership.add',L('Added a membership','أضافت عضوية'),L('Saeed Al Hammadi → Elevate','سعيد الحمادي ← إرتقاء'),'elevate','members','saeed'],
      ['2026-09-18 11:00','omar','landing.publish',L('Published the landing page','نشر الصفحة التعريفية'),L('DCT Employees landing · version 4','الصفحة التعريفية للموظفين · الإصدار 4'),'employees','sites',''],
      ['2026-09-15 08:00','aisha','round.open',L('Opened a competition round','فتحت جولة مسابقة'),L('R1 “24-Hour Challenge 2026”','الجولة الأولى «تحدي 24 ساعة 2026»'),'zu','sites','']
    ];
    const AX = (this.state.auditX || []);
    const byId = {}; USERS.forEach(u => { byId[u.id] = u; });
    const AUD = AX.concat(A0);
    const fa = this.state.fa || 'all';
    const audit = AUD.filter(a => fa === 'all' || a[6] === fa).map(a => { const u = byId[a[1]]; const m = MSI[a[5]]; return { at: (a[0].startsWith('2026-10-06') ? L('Today','اليوم') + ' · ' + a[0].slice(11) : dt(a[0].slice(0,10)) + ' · ' + a[0].slice(11)), actor: uname(u), ini:u.ini, c:u.c, code:a[2], desc:a[3], target:a[4], hasMs: !!m, noMs: !m, ms: m ? msShort(a[5]) : '', mc: m ? m.c : '', e: a[5] === 'csmd' ? 'edge' : '', cls: a[8] ? 'new' : '' }; });
    /* edit sheet */
    const eu = byId[this.state.editId] || byId.saeed;
    const dr = this.state.dr || { name: eu.en, role: eu.role, ms: eu.ms.slice(), status: eu.status };
    const setDr = (o) => S({ dr: Object.assign({}, dr, o), derr:'' });
    const derr = this.state.derr || '';
    const self = eu.id === 'aisha';
    const nmBad = !dr.name.trim();
    const prof = [];
    if (eu.x.pos) prof.push({ k:L('Position','المنصب'), v: ar ? eu.x.pos[1] : eu.x.pos[0] });
    if (eu.x.emp) prof.push({ k:L('Employee ID','الرقم الوظيفي'), v: eu.x.emp });
    if (eu.x.hire) prof.push({ k:L('Hire date','تاريخ التعيين'), v: dt(eu.x.hire) });
    if (eu.x.pts !== undefined) prof.push({ k:L('Points · certificates','النقاط · الشهادات'), v: fmt(eu.x.pts) + ' · ' + fmt(eu.x.certs) });
    if (eu.x.legacy) prof.push({ k:L('Legacy id','المعرّف القديم'), v: eu.x.legacy });
    const trail = AUD.filter(a => a[7] === eu.id).map(a => ({ desc: a[3] + (a[4] && a[7] ? '' : ''), at: dt(a[0].slice(0,10)) + ' · ' + a[0].slice(11), actor: uname(byId[a[1]]) }));
    const nowStamp = '2026-10-06 09:' + String(10 + AX.length).padStart(2,'0');
    const ed = { name: uname(eu), ini: eu.ini, c: eu.c, iniCls:'', email: eu.email, st: STAT[eu.status][0], stCls: STAT[eu.status][1],
      nameIn: dr.name, onName: (e) => setDr({ name: e.target.value }), nErr: derr === 'v' && nmBad, nCls: derr === 'v' && nmBad ? 'is-error' : '',
      roles: ['learner','mentor','judge','sub_admin','admin'].map(r => ({ l: ROLE[r][0], on: dr.role === r, pick: () => { if (self && r !== 'admin') { S({ derr:'self' }); return; } setDr({ role:r }); } })), roleErr: derr === 'self',
      ms: MS.filter(m => !m.lo).map(m => ({ n: msShort(m.id), c: m.c, e:'', on: dr.ms.includes(m.id), cls: dr.ms.includes(m.id) ? 'on' : '', tog: () => setDr({ ms: dr.ms.includes(m.id) ? dr.ms.filter(x => x !== m.id) : dr.ms.concat([m.id]) }) })),
      isInvited: eu.status === 'invited', notInvited: eu.status !== 'invited', invTxt: L('Sent ' + dt(eu.x.inv || '2026-10-06') + ' · expires ' + dt(eu.x.exp || '2026-10-20') + '. Resending creates a new link; the old one stops working.','أُرسلت في ' + dt(eu.x.inv || '2026-10-06') + ' · تنتهي في ' + dt(eu.x.exp || '2026-10-20') + '. إعادة الإرسال تنشئ رابطاً جديداً ويتوقف القديم.'),
      stats: [['active',L('Active','نشط'),L('Can sign in','يمكنه الدخول')],['disabled',L('Disabled','معطّل'),L('Access revoked','الوصول ملغى')]].map(s => ({ l:s[1], d:s[2], on: dr.status === s[0], pick: () => { if (self && s[0] === 'disabled') { S({ derr:'self' }); return; } setDr({ status:s[0] }); } })),
      disWarn: dr.status === 'disabled' && eu.status !== 'disabled',
      reset: () => { S({ resetSent:true }); }, resetL: eu.status === 'invited' ? L('Resend invitation','إعادة إرسال الدعوة') : L('Send password reset','إرسال إعادة تعيين كلمة المرور'),
      sent: !!this.state.resetSent, sentTxt: eu.status === 'invited' ? L('New invitation sent to ' + eu.email,'أُرسلت دعوة جديدة إلى ' + eu.email) : L('Set-password e-mail sent to ' + eu.email + ' · logged','أُرسل بريد تعيين كلمة المرور إلى ' + eu.email + ' · مسجّل'),
      hasProfile: prof.length > 0, prof, trail, hasTrail: trail.length > 0, noTrail: trail.length === 0, anyErr: derr === 'v' && nmBad };
    const saveUser = () => {
      if (nmBad) { S({ derr:'v' }); return; }
      const ch = []; const msTxt = (a) => a.map(m => msShort(m)).join(', ') || '—';
      if (dr.role !== eu.role) ch.push([nowStamp,'aisha','user.role_change',L('Changed a role','غيّرت دوراً'), uname(eu) + ': ' + ROLE[eu.role][0] + ' → ' + ROLE[dr.role][0], dr.ms[0] || '', 'roles', eu.id]);
      if (dr.status !== eu.status) ch.push([nowStamp,'aisha', dr.status === 'disabled' ? 'user.disable' : 'user.enable', dr.status === 'disabled' ? L('Disabled an account','عطّلت حساباً') : L('Re-enabled an account','أعادت تفعيل حساب'), eu.email, eu.ms[0] || '', 'roles', eu.id]);
      if (dr.ms.slice().sort().join() !== eu.ms.slice().sort().join()) ch.push([nowStamp,'aisha','membership.update',L('Changed memberships','غيّرت العضويات'), uname(eu) + ': ' + msTxt(eu.ms) + ' → ' + msTxt(dr.ms), dr.ms[0] || '', 'members', eu.id]);
      const ne = Object.assign({}, edits, { [eu.id]: { role: dr.role, ms: dr.ms, status: dr.status, en: eu.id === 'former' || eu.status === 'invited' ? eu.en : dr.name } });
      S({ edits: ne, auditX: ch.concat(AX), ovl:'none', dr:null, derr:'' });
      toast(ch.length ? L(uname(eu) + ' updated · ' + ch.length + ' change' + (ch.length > 1 ? 's' : '') + ' written to the audit log','تم تحديث ' + uname(eu) + ' · سُجّلت ' + fmt(ch.length) + ' تغييرات في سجل التدقيق') : L('No changes to save','لا تغييرات للحفظ'));
    };
    /* import */
    const PRE = [
      [2,'khalid.r@dctlearn.example','Khalid Al Romaithi','employees','create',''],
      [3,'noor.a@dctlearn.example','Noor Al Ali','employees;znm','create',''],
      [4,'mona.a@dctlearn.example','Mona Al Ameri','employees;nibras','update',L('Adds Nibras membership','يضيف عضوية نبراس')],
      [5,'latifa.k@dctlearn.example','Latifa Al Ketbi','museopro','create',''],
      [6,'hamdan@gmail','Hamdan Al Shehhi','employees','skip',L('Invalid e-mail address','بريد إلكتروني غير صالح')],
      [7,'saeed.h@dctlearn.example','Saeed Al Hammadi','znm-gwh','skip',L('Unknown microsite “znm-gwh”','موقع غير معروف «znm-gwh»')]
    ];
    const prev = PRE.map(r => ({ row: fmt(r[0]), email:r[1], name:r[2], ms:r[3], act: r[4] === 'create' ? L('Create','إنشاء') : r[4] === 'update' ? L('Update','تحديث') : L('Skip','تخطي'), tagCls: r[4] === 'create' ? 'ok' : r[4] === 'update' ? 'info' : 'bad', reason:r[5], cls: r[4] === 'skip' ? 'skp' : '' }));
    const file = this.state.file || 'hr-october.csv';
    const welcome = this.state.welcome !== false;
    const confirmImport = () => {
      const nu = [['khalid_r','Khalid Al Romaithi','خالد الرميثي','KR','khalid.r@dctlearn.example','learner',['employees'],'invited','','#EE3E43',{ inv:'2026-10-06', exp:'2026-10-20' }],['noor','Noor Al Ali','نور العلي','NA','noor.a@dctlearn.example','learner',['employees','znm'],'invited','','#3B2F92',{ inv:'2026-10-06', exp:'2026-10-20' }],['latifa','Latifa Al Ketbi','لطيفة الكتبي','LK','latifa.k@dctlearn.example','learner',['museopro'],'invited','','#E35E3C',{ inv:'2026-10-06', exp:'2026-10-20' }]];
      const ne = Object.assign({}, edits, { mona: Object.assign({}, edits.mona || {}, { ms:['employees','nibras'] }) });
      S({ ovl:'importDone', added: added.length ? added : nu, edits: ne, auditX: [[nowStamp,'aisha','users.import',L('Imported users from CSV','استوردت مستخدمين من CSV'), file + L(' — 3 created, 1 updated, 2 skipped',' — إنشاء 3، تحديث 1، تخطي 2') + (welcome ? L(' · welcome e-mails sent',' · أُرسلت رسائل ترحيب') : ''),'employees','members','']].concat(AX) });
    };
    const imStage = ovl === 'import' ? 1 : ovl === 'importPreview' ? 2 : 3;
    const closeOvl = () => S({ ovl:'none', dr:null, derr:'', resetSent:false });
    const sh = this.shell(ar, 'admin', 'users', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Users','المستخدمون') } ]);
    const total = 3672 + added.length;
    const opt = (v, l) => ({ v, l });
    return Object.assign(base, {
      t, sh, route:'/admin/users',
      tabs: [['users',L('Users','المستخدمون'),fmt(total)],['audit',L('Audit trail','سجل التدقيق'),fmt(AUD.length)]].map(x => ({ label:x[1], n:x[2], cls: x[0] === tab ? 'on' : '', on: x[0] === tab, pick: () => S({ tab:x[0] }) })),
      isUsers: tab === 'users', isAudit: tab === 'audit',
      q: this.state.q || '', onQ: (e) => S({ q: e.target.value }), fr, fm, fs, onFr: (e) => S({ fr: e.target.value }), onFm: (e) => S({ fm: e.target.value }), onFs: (e) => S({ fs: e.target.value }),
      roleOpts: [opt('all',L('All roles','كل الأدوار'))].concat(['learner','mentor','judge','sub_admin','admin'].map(r => opt(r, ROLE[r][0]))),
      msOpts: [opt('all',L('All microsites','كل المواقع'))].concat(MS.filter(m => !m.lo).map(m => opt(m.id, msShort(m.id)))),
      stOpts: [opt('all',L('All statuses','كل الحالات')), opt('active',STAT.active[0]), opt('invited',STAT.invited[0]), opt('disabled',STAT.disabled[0])],
      filtered: !!(q || fr !== 'all' || fm !== 'all' || fs !== 'all'), clearF: () => S({ q:'', fr:'all', fm:'all', fs:'all' }),
      rows, hasRows: rows.length > 0, noRows: rows.length === 0,
      pgTxt: L('Showing ' + fmt(rows.length) + ' seed accounts · ' + fmt(total) + ' users in total','عرض ' + fmt(rows.length) + ' من حسابات العرض · ' + fmt(total) + ' مستخدم إجمالاً'),
      pgPrev: () => toast(L('You are on the first page.','أنت في الصفحة الأولى.')), pgNext: () => toast(L('Other pages hold migrated accounts — not part of this prototype.','الصفحات الأخرى تضم الحسابات المنقولة — خارج هذا النموذج.')),
      fas: [['all',L('All','الكل')],['roles',L('Roles & status','الأدوار والحالة')],['members',L('Members & imports','الأعضاء والاستيراد')],['sites',L('Microsites','المواقع')],['content',L('Content review','مراجعة المحتوى')]].map(f => ({ label:f[1], cls: f[0] === fa ? 'on' : '', on: f[0] === fa, pick: () => S({ fa:f[0] }) })),
      audit, auditTxt: fmt(audit.length) + L(' entries',' إدخالاً'),
      showEdit: ovl === 'edit', ed, saveUser, closeOvl,
      showImport: imStage && ['import','importPreview','importDone'].includes(ovl), imUpload: imStage === 1, imPreview: imStage === 2, imDone: imStage === 3,
      imStep: L('Step ','الخطوة ') + fmt(imStage) + L(' of 3 · ',' من 3 · ') + [L('Upload','الرفع'),L('Preview','المعاينة'),L('Done','تم')][imStage - 1],
      openImport: () => S({ ovl:'import' }), bgClose: (e) => { if (e.target === e.currentTarget) closeOvl(); },
      onFile: (e) => { const fl = e.target.files && e.target.files[0]; S({ ovl:'importPreview', file: fl ? fl.name : 'hr-october.csv' }); }, useSample: () => S({ ovl:'importPreview', file:'hr-october.csv' }), reupload: () => S({ ovl:'import' }),
      dlSample: () => toast(L('users-sample.csv downloaded','تم تنزيل users-sample.csv')),
      csvCols: [['email',1],['first_name',1],['last_name',1],['microsites',1],['employee_id',0],['position',0],['sector',0],['department',0],['hire_date',0],['role',0]].map(c => ({ n:c[0], cls: c[1] ? 'info' : 'mut' })),
      file, prev, fmt3: fmt(3), fmt1: fmt(1), fmt2: fmt(2), welcome, togWelcome: () => S({ welcome: !welcome }), confirmImport,
      doneP: L('3 users created, 1 updated, 2 skipped.' + (welcome ? ' Welcome e-mails with a set-password link were sent to the 3 new users.' : ' No welcome e-mails were sent.'),'تم إنشاء 3 مستخدمين وتحديث 1 وتخطي 2.' + (welcome ? ' أُرسلت رسائل ترحيب برابط تعيين كلمة المرور إلى المستخدمين الجدد.' : ' لم تُرسل رسائل ترحيب.')),
      viewAudit: () => S({ ovl:'none', tab:'audit' }),
      specSegs: [ seg('Tab','tab',[['users','Users'],['audit','Audit trail']]), seg('Overlay','ovl',[['none','None'],['edit','Edit Saeed'],['import','Import'],['importPreview','Import preview'],['importDone','Import done']], { editId:'saeed', dr:null, derr:'', resetSent:false }) ]
    });
  }

}
