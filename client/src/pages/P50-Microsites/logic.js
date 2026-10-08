// Ported verbatim from the Claude Design artboard P50-Microsites (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = {"locale": null, "tab": null, "ovl": null, "editId": "elevate", "draft": null, "saved": {}, "errs": {}, "q": "", "fm": "all", "req": "requested", "slug": "elevate-alumni", "tpl": "mentorship", "notify": true, "note": "", "reqErr": "", "addC": "", "toastMsg": ""}; }

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

    const tab = st('tab') || 'live';
    const ovl = st('ovl') || 'none';
    const saved = this.state.saved || {};
    const cur = (m) => Object.assign({}, m, saved[m.id] || {});
    const t = ar ? {
      spec:'المواقع المصغّرة', ey:'المنصة', h1:'المواقع المصغّرة', sub:'المواقع المنشورة والطلبات الجديدة. عدّل الدورات والتبويبات ووضع الدخول لكل موقع، أو وافق على الطلبات وارفضها.', templates:'قوالب الصفحات', create:'إنشاء موقع مصغّر',
      pendTitle:'طلب موقع جديد بانتظار قرارك', pendBody:'طلبت ليلى حداد «Elevate Alumni» في 2 أكتوبر 2026.', review:'مراجعة الطلب', search:'بحث', searchPh:'ابحث بالاسم أو المعرّف', modeLbl:'وضع الدخول',
      tabsK:'التبويبات:', saK:'المشرف الفرعي', viewLanding:'عرض الصفحة', edit:'تعديل', noMatch:'لا مواقع مطابقة', noMatchP:'جرّب بحثاً آخر أو امسح المرشّح.',
      reqOn:'طُلب في 2 أكتوبر 2026', purpose:'«الحفاظ على تفاعل دفعة 2025»', reqBy:'مقدّم الطلب', layla:'ليلى حداد', laylaSub:'مشرفة فرعية · إرتقاء', related:'مرتبط بـ', elevate:'إرتقاء 2026', next:'عند الموافقة', nextV:'يُنشأ موقع بحالة «مسودة»', nextS:'يُنشر بعد اعتماد الصفحة وتفعيل تبويب',
      rejT:'تم رفض الطلب', decide:'القرار', decideP:'الموافقة تنشئ موقعاً مصغّراً بحالة مسودة وتُبلغ مقدّمة الطلب. الرفض يتطلب ملاحظة تُرسل إليها. يُسجَّل القرار في سجل التدقيق.', approve:'موافقة…', reject:'رفض…', contSetup:'متابعة الإعداد', undo:'التراجع (للعرض)',
      archH:'لا مواقع مؤرشفة', archP:'المواقع المؤرشفة تبقى قابلة للاسترجاع مع بيانات أعضائها وتقدّمهم.',
      editMs:'تعديل الموقع المصغّر', close:'إغلاق', signIn:'وضع الدخول', domain:'قاعدة نطاق البريد', optional:'اختياري', domainH:'يسمح بالتسجيل الذاتي لهذا النطاق فقط.', domainE:'أدخل نطاقاً صحيحاً مثل dctabudhabi.ae',
      tabsH:'تبويبات المتعلّم', tab:'التبويب', labelEn:'التسمية (EN)', labelAr:'التسمية (AR)', coursesH:'الدورات', mand:'إلزامية', noCourses:'لا دورات بعد.', addCourse:'إضافة دورة', pickCourse:'اختر دورة…', add:'إضافة',
      features:'الميزات', mentoring:'الإرشاد', mentoringD:'المطابقة والحجز وسجلات GROW', competition:'المسابقة', competitionD:'الجولات ومعايير التقييم والمحكّمون',
      popup:'النافذة المنبثقة', popupOn:'عرض نافذة على الصفحة', popupD:'صورة ونص وزر', popText:'النص', popBtn:'نص الزر', req:'هذا الحقل مطلوب.',
      statusH:'الحالة', subAdmin:'المشرف الفرعي', auditNote:'تُسجَّل التغييرات في سجل التدقيق.', fixErr:'صحّح الحقول المعلّمة قبل الحفظ.', cancel:'إلغاء', save:'حفظ التغييرات',
      reqEy:'طلب موقع · Elevate Alumni', apTitle:'الموافقة وإنشاء مسودة', apBody:'سيُنشأ موقع «Elevate Alumni» بحالة مسودة، وتصبح ليلى حداد مشرفته الفرعية. لن يكون مرئياً حتى تنشره.', slug:'المعرّف (رابط الموقع)', slugH:'أحرف إنجليزية صغيرة وأرقام وشرطات، من 2 إلى 40 حرفاً.', tplL:'قالب الصفحة', notify:'إبلاغ ليلى حداد بالبريد الإلكتروني', apCta:'موافقة وإنشاء مسودة',
      rjTitle:'رفض الطلب', rjBody:'ستتلقى ليلى حداد ملاحظتك بالبريد الإلكتروني. يمكنها تقديم طلب جديد لاحقاً.', noteL:'ملاحظة لمقدّمة الطلب', notePh:'مثال: استخدمي تبويب «الجلسات» في إرتقاء لدفعة الخريجين بدلاً من موقع جديد.', noteE:'اكتب سبب الرفض.', rjCta:'رفض الطلب'
    } : {
      spec:'Microsites', ey:'Platform', h1:'Microsites', sub:'Live microsites and new requests. Edit each microsite’s courses, learner tabs and sign-in mode, or approve and reject requests.', templates:'Landing templates', create:'Create microsite',
      pendTitle:'A microsite request is waiting for you', pendBody:'Layla Haddad requested “Elevate Alumni” on 2 Oct 2026.', review:'Review request', search:'Search', searchPh:'Search name or slug', modeLbl:'Sign-in',
      tabsK:'Tabs:', saK:'Sub admin', viewLanding:'View landing', edit:'Edit', noMatch:'No microsites match', noMatchP:'Try another search or clear the filter.',
      reqOn:'Requested 2 Oct 2026', purpose:'“Keep the 2025 cohort engaged”', reqBy:'Requested by', layla:'Layla Haddad', laylaSub:'Sub admin · Elevate', related:'Related to', elevate:'Elevate 2026', next:'On approval', nextV:'A draft microsite is created', nextS:'Goes live once its landing is published and a tab is on',
      rejT:'Request rejected', decide:'Decision', decideP:'Approving creates a draft microsite and notifies the requester. Rejecting needs a note, which is sent to her. Both are recorded in the audit log.', approve:'Approve…', reject:'Reject…', contSetup:'Continue setup', undo:'Undo (demo)',
      archH:'No archived microsites', archP:'Archived microsites can be restored with their members and progress intact.',
      editMs:'Edit microsite', close:'Close', signIn:'Sign-in mode', domain:'E-mail domain rule', optional:'optional', domainH:'Only this domain may self-register.', domainE:'Enter a valid domain, e.g. dctabudhabi.ae',
      tabsH:'Learner tabs', tab:'Tab', labelEn:'Label (EN)', labelAr:'Label (AR)', coursesH:'Courses', mand:'Mandatory', noCourses:'No courses yet.', addCourse:'Add a course', pickCourse:'Choose a course…', add:'Add',
      features:'Features', mentoring:'Mentoring', mentoringD:'Matching, booking and GROW logs', competition:'Competition', competitionD:'Rounds, rubrics and judges',
      popup:'Popup', popupOn:'Show a popup on the landing', popupD:'Image, text and a button', popText:'Text', popBtn:'Button label', req:'This field is required.',
      statusH:'Status', subAdmin:'Sub admin', auditNote:'Changes are written to the audit log.', fixErr:'Fix the highlighted fields before saving.', cancel:'Cancel', save:'Save changes',
      reqEy:'Microsite request · Elevate Alumni', apTitle:'Approve and create a draft', apBody:'“Elevate Alumni” will be created as a draft with Layla Haddad as its sub admin. Nobody can see it until you publish it.', slug:'Id (URL slug)', slugH:'Lower-case letters, numbers and hyphens, 2–40 characters.', tplL:'Landing template', notify:'E-mail Layla Haddad about the decision', apCta:'Approve and create draft',
      rjTitle:'Reject request', rjBody:'Layla Haddad receives your note by e-mail. She can send a new request later.', noteL:'Note to the requester', notePh:'e.g. Use a “Sessions” tab on Elevate for the alumni cohort instead of a new microsite.', noteE:'Write a reason for rejecting.', rjCta:'Reject request'
    };
    const MODED = { open:[L('Anyone may sign up','يمكن لأي شخص التسجيل')], invite_only:[L('Access by invitation','الدخول بدعوة')], landing_only:[L('Only the landing page','الصفحة التعريفية فقط')] };
    const modeCls = { open:'ok', invite_only:'info', landing_only:'warn' };
    /* ---- cards ---- */
    const q = (this.state.q || '').trim().toLowerCase(); const fm = this.state.fm || 'all';
    const list = MS.map(cur).filter(m => (fm === 'all' || m.mode === fm) && (!q || (m.en + ' ' + m.ar + ' ' + m.id).toLowerCase().includes(q)));
    const tabsTxt = (m) => m.lo ? L('Landing page only','الصفحة التعريفية فقط') : (m.tabs.length ? m.tabs.map(k => { const lb = (m.labels && m.labels[k]) || TABN[k]; return ar ? lb[1] : lb[0]; }).join(' · ') : L('None','لا شيء'));
    const openEdit = (id) => S({ ovl:'edit', editId:id, draft:null, errs:{}, addC:'' });
    const cards = list.map(m => ({ id:m.id, hid:'ms-' + m.id, c:m.c, img:B(m.hero), name: ar ? m.ar : m.en, mode: ar ? MODE[m.mode][1] : MODE[m.mode][0], modeCls: modeCls[m.mode], domain: m.domain && !m.lo ? '@' + m.domain : '',
      feats: [].concat(m.mentoring ? [L('Mentoring','الإرشاد')] : [], m.competition ? [L('Competition','المسابقة')] : [], m.popup ? [L('Popup','نافذة')] : []),
      tabs: tabsTxt(m), st: m.status === 'archived' ? L('Archived','مؤرشف') : L('Live','منشور'), stCls: m.status === 'archived' ? 'mut' : 'ok',
      sa: m.sa ? (ar ? m.saAr : m.sa) : L('Platform admin covers','يغطيه مسؤول المنصة'), saIni: m.saIni || 'AM', saC: m.sa ? '#3B2F92' : '#6D7782', saCls:'',
      memK: m.lo ? L('Interest','الاهتمام') : L('Members','الأعضاء'), mem: fmt(m.lo ? m.interest : m.members), href:'/' + m.id, edit: () => openEdit(m.id), editLbl: t.edit + ' ' + (ar ? m.ar : m.en) }));
    /* ---- request ---- */
    const req = this.state.req || 'requested';
    const rq = { isPending: req === 'requested', isApproved: req === 'approved', isRejected: req === 'rejected', done: req !== 'requested',
      tag: req === 'requested' ? L('Requested','مطلوب') : req === 'approved' ? L('Approved · draft','موافق عليه · مسودة') : L('Rejected','مرفوض'), tagCls: req === 'requested' ? 'warn' : req === 'approved' ? 'ok' : 'bad',
      okT: L('Draft microsite created','تم إنشاء موقع مسودة'), okP: L('/' + (this.state.slug || 'elevate-alumni') + ' is a draft. Layla Haddad is its sub admin' + (this.state.notify !== false ? ' and has been notified.' : '.'),'/' + (this.state.slug || 'elevate-alumni') + ' بحالة مسودة، وليلى حداد مشرفته الفرعية' + (this.state.notify !== false ? ' وتم إبلاغها.' : '.')),
      note: this.state.note || '' };
    const slug = this.state.slug === undefined ? 'elevate-alumni' : this.state.slug;
    const slugErr = !/^[a-z0-9-]{2,40}$/.test(slug) ? L('Use 2–40 lower-case letters, numbers or hyphens.','استخدم من 2 إلى 40 حرفاً إنجليزياً صغيراً أو رقماً أو شرطة.') : MSI[slug] ? L('“' + slug + '” is already used by another microsite.','المعرّف «' + slug + '» مستخدم لموقع آخر.') : '';
    const slugShow = !!(this.state.errs && this.state.errs.slug) || (slug !== 'elevate-alumni' && !!slugErr);
    const note = this.state.note || '';
    const noteBad = !!(this.state.errs && this.state.errs.note);
    const TPL = [['programme',L('Programme','برنامج')],['mentorship',L('Mentorship','إرشاد')],['onboarding',L('Onboarding','تأهيل')],['competition',L('Competition','مسابقة')],['forum',L('Open forum','منتدى مفتوح')],['interest',L('Landing-only interest','اهتمام — صفحة فقط')]];
    /* ---- edit sheet draft ---- */
    const em = cur(MSI[this.state.editId] || MSI.elevate);
    const mkDraft = (m) => ({ mode:m.mode, domain:m.domain || '', tabs: TABKEYS.map(k => { const lb = (m.labels && m.labels[k]) || TABN[k]; return { k, on: m.tabs.includes(k), en:lb[0], ar:lb[1] }; }),
      courses: m.courses.map(k => ({ k, mand: m.mand.includes(k) })), mentoring:m.mentoring, competition:m.competition, popup:m.popup, popText: m.popText || (m.id === 'elevate' ? 'Mentee registration is open' : ''), popBtn: m.popBtn || (m.id === 'elevate' ? 'Register now' : ''), status: m.status || 'live' });
    const d = this.state.draft || mkDraft(em);
    const setD = (o) => S({ draft: Object.assign({}, d, o) });
    const errs = this.state.errs || {};
    const lo = d.mode === 'landing_only';
    const domBad = !!d.domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(d.domain);
    const tabErrs = d.tabs.map(x => x.on && (!x.en.trim() || !x.ar.trim()));
    const noTab = !lo && !d.tabs.some(x => x.on);
    const popBad = d.popup && !d.popText.trim();
    const mvC = (i, dir) => { const c = d.courses.slice(); const j = i + dir; if (j < 0 || j >= c.length) return; const x = c[i]; c[i] = c[j]; c[j] = x; setD({ courses:c }); };
    const ed = { id:em.id, c:em.c, name: ar ? em.ar : em.en, st: d.status === 'archived' ? L('Archived','مؤرشف') : L('Live','منشور'), notLo: !lo, sa: em.sa ? (ar ? em.saAr : em.sa) : L('Platform admin covers','يغطيه مسؤول المنصة'),
      modes: ['open','invite_only','landing_only'].map(k => ({ l: ar ? MODE[k][1] : MODE[k][0], d: MODED[k][0], on: d.mode === k, pick: () => setD({ mode:k }) })),
      domain: d.domain, domErr: errs.on && domBad, domCls: errs.on && domBad ? 'is-error' : '', onDom: (e) => setD({ domain: e.target.value.trim() }),
      tabs: d.tabs.map((x, i) => ({ name: ar ? TABN[x.k][1] : TABN[x.k][0], on: x.on, en: x.en, ar: x.ar, errCls: errs.on && tabErrs[i] ? 'is-error' : '', aEn: (ar ? TABN[x.k][1] : TABN[x.k][0]) + ' — ' + t.labelEn, aAr: (ar ? TABN[x.k][1] : TABN[x.k][0]) + ' — ' + t.labelAr,
        tog: () => setD({ tabs: d.tabs.map((y, j) => j === i ? Object.assign({}, y, { on: !y.on }) : y) }), onEn: (e) => setD({ tabs: d.tabs.map((y, j) => j === i ? Object.assign({}, y, { en: e.target.value }) : y) }), onAr: (e) => setD({ tabs: d.tabs.map((y, j) => j === i ? Object.assign({}, y, { ar: e.target.value }) : y) }) })),
      tabErr: errs.on ? (noTab ? L('Turn on at least one tab, or switch the microsite to landing-only.','فعّل تبويباً واحداً على الأقل، أو حوّل الموقع إلى صفحة تعريفية فقط.') : tabErrs.some(Boolean) ? L('Every enabled tab needs an English and an Arabic label.','كل تبويب مفعّل يحتاج تسمية بالإنجليزية والعربية.') : '') : '',
      cCount: fmt(d.courses.length) + L(' courses · ',' دورات · ') + fmt(d.courses.filter(c => c.mand).length) + L(' mandatory',' إلزامية'), hasC: d.courses.length > 0, noC: d.courses.length === 0,
      courses: d.courses.map((c, i) => ({ n: fmt(i + 1), k:c.k, title: crs(c.k), mand: c.mand, togM: () => setD({ courses: d.courses.map((y, j) => j === i ? { k:y.k, mand: !y.mand } : y) }), up: () => mvC(i, -1), down: () => mvC(i, 1), rm: () => setD({ courses: d.courses.filter((_, j) => j !== i) }),
        upL: L('Move up: ','نقل لأعلى: ') + crs(c.k), downL: L('Move down: ','نقل لأسفل: ') + crs(c.k), rmL: L('Remove: ','إزالة: ') + crs(c.k) })),
      avail: Object.keys(CRS).filter(k => !d.courses.some(c => c.k === k)).map(k => ({ k, l: k + ' · ' + crs(k) })),
      mentoring: d.mentoring, competition: d.competition, togMent: () => setD({ mentoring: !d.mentoring }), togComp: () => setD({ competition: !d.competition }),
      popup: d.popup, togPop: () => setD({ popup: !d.popup }), popText: d.popText, popBtn: d.popBtn, popErr: errs.on && popBad, popCls: errs.on && popBad ? 'is-error' : '', onPopText: (e) => setD({ popText: e.target.value }), onPopBtn: (e) => setD({ popBtn: e.target.value }),
      stats: [['live',L('Live','منشور'),L('Visible to members','مرئي للأعضاء')],['archived',L('Archived','مؤرشف'),L('Hidden; data kept','مخفي مع حفظ البيانات')]].map(s => ({ l:s[1], d:s[2], on: d.status === s[0], pick: () => setD({ status:s[0] }) })),
      anyErr: errs.on && (domBad || noTab || tabErrs.some(Boolean) || popBad) };
    const saveEdit = () => {
      if (domBad || (!lo && (noTab || tabErrs.some(Boolean))) || popBad) { S({ errs:{ on:true } }); return; }
      const on = d.tabs.filter(x => x.on);
      const labels = {}; on.forEach(x => { const def = TABN[x.k]; if (x.en !== def[0] || x.ar !== def[1]) labels[x.k] = [x.en, x.ar]; });
      const nv = { mode:d.mode, lo, domain: lo ? '' : d.domain, tabs: lo ? [] : on.map(x => x.k), labels, courses: d.courses.map(c => c.k), mand: d.courses.filter(c => c.mand).map(c => c.k), mentoring:d.mentoring, competition:d.competition, popup:d.popup, popText:d.popText, popBtn:d.popBtn, status:d.status };
      S({ saved: Object.assign({}, saved, { [em.id]: nv }), ovl:'none', draft:null, errs:{} });
      toast(L((em.short[0]) + ' saved · change recorded in the audit log','تم حفظ ' + em.short[1] + ' · سُجّل التغيير في سجل التدقيق'));
    };
    const closeOvl = () => S({ ovl:'none', draft:null, errs:{} });
    const sh = this.shell(ar, 'admin', 'microsites', null, [ { label:L('Admin','الإدارة'), href:'/admin' }, { label:L('Microsites','المواقع المصغّرة') } ]);
    if (req !== 'requested') sh.nav = sh.nav.map(n => n.key === 'microsites' ? Object.assign({}, n, { cnt:false }) : n);
    return Object.assign(base, {
      t, sh, route:'/admin/platforms',
      tabs: [['live',L('Live','منشورة'),MS.filter(m => cur(m).status !== 'archived').length],['requested',L('Requested','الطلبات'), req === 'requested' ? 1 : 0],['archived',L('Archived','مؤرشفة'),MS.filter(m => cur(m).status === 'archived').length]].map(x => ({ label:x[1], n:fmt(x[2]), cls: x[0] === tab ? 'on' : '', on: x[0] === tab, pick: () => S({ tab:x[0] }) })),
      isLive: tab === 'live', isReq: tab === 'requested', isArch: tab === 'archived', reqPending: req === 'requested', goReq: () => S({ tab:'requested' }),
      q: this.state.q || '', onQ: (e) => S({ q: e.target.value }),
      fms: [['all',L('All','الكل')],['open',L('Open','مفتوح')],['invite_only',L('Invite-only','بالدعوة')],['landing_only',L('Landing-only','تعريفية فقط')]].map(f => ({ label:f[1], cls: f[0] === fm ? 'on' : '', on: f[0] === fm, pick: () => S({ fm:f[0] }) })),
      cards, hasCards: cards.length > 0, noCards: cards.length === 0, rq,
      openApprove: () => S({ ovl:'approve', errs:{} }), openReject: () => S({ ovl:'reject', errs:{} }), undoReq: () => S({ req:'requested', note:'' }),
      showEdit: ovl === 'edit', showApprove: ovl === 'approve', showReject: ovl === 'reject', ed, saveEdit, closeOvl, bgClose: (e) => { if (e.target === e.currentTarget) closeOvl(); },
      addC: this.state.addC || '', onAddC: (e) => S({ addC: e.target.value }), addCourse: () => { const k = this.state.addC; if (!k) return; setD({ courses: d.courses.concat([{ k, mand:false }]) }); S({ addC:'' }); },
      slug, slugBad: slugShow && !!slugErr, slugErr, slugCls: slugShow && slugErr ? 'is-error' : '', onSlug: (e) => S({ slug: e.target.value.trim().toLowerCase(), errs:{} }),
      tpl: this.state.tpl || 'mentorship', tpls: TPL.map(x => ({ k:x[0], l:x[1] })), onTpl: (e) => S({ tpl: e.target.value }), notify: this.state.notify !== false, togNotify: () => S({ notify: this.state.notify === false }),
      doApprove: () => { if (slugErr) { S({ errs:{ slug:true } }); return; } S({ req:'approved', ovl:'none' }); toast(L('Request approved · draft /' + slug + ' created','تمت الموافقة · أُنشئت مسودة /' + slug)); },
      note, noteBad, noteCls: noteBad ? 'is-error' : '', noteCount: fmt(note.length) + ' / ' + fmt(1000), onNote: (e) => S({ note: e.target.value, errs:{} }),
      doReject: () => { if (!note.trim()) { S({ errs:{ note:true } }); return; } S({ req:'rejected', ovl:'none' }); toast(L('Request rejected · Layla Haddad notified','تم رفض الطلب · أُبلغت ليلى حداد')); },
      specSegs: [ seg('Tab','tab',[['live','Live'],['requested','Requested'],['archived','Archived']]), seg('Overlay','ovl',[['none','None'],['edit','Edit sheet'],['approve','Approve'],['reject','Reject']], { draft:null, errs:{}, editId:'elevate', tab: 'live' }) ]
    });
  }

}
