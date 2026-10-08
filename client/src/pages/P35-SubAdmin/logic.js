// client: hand-edited (shell identity from the session, not a hard-coded ZU override)
// Ported verbatim from the Claude Design artboard P35-SubAdmin (DCLogic class).
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


  landingSeed(site){
    const B = (id) => '/_blob/' + id;
    const S = {
      elevate:{ hEn:'Are you ready to accelerate your growth and career at DCT Abu Dhabi?', hAr:'هل أنت مستعد لتسريع نموك ومسيرتك المهنية في دائرة الثقافة والسياحة – أبوظبي؟',
        sEn:'Elevate pairs you with a senior DCT mentor for structured one-to-one sessions, clear GROW goals and a cohort of colleagues growing alongside you.', sAr:'يربطك برنامج إرتقاء بمرشد أول في الدائرة لجلسات فردية منظمة وأهداف GROW واضحة ودفعة من الزملاء ينمون معك.',
        img:'9842ff4b5522772462642e07bfb6d8c1', acc:'#CD3151', cEn:'Sign in to Elevate', cAr:'ادخل إلى إرتقاء', copy:'© 2026 Department of Culture and Tourism – Abu Dhabi',
        pop:true, popKind:'image_text', pEn:'Mentee registration is open', pAr:'التسجيل للمتدربين مفتوح', pbEn:'Register now', pbAr:'سجّل الآن',
        sec:'partners', partners:['dct','fm','rmn','inp'], soc:{ instagram:'', x:'', linkedin:'', youtube:'' }, cust:'' },
      znm:{ hEn:'Welcome to the onboarding programme of Zayed National Museum', hAr:'مرحباً بك في برنامج التهيئة في متحف زايد الوطني',
        sEn:'Everything you need before your first shift on Saadiyat: the museum, your role, ticketing and operational readiness — in English and Arabic.', sAr:'كل ما تحتاجه قبل مناوبتك الأولى في السعديات: المتحف ودورك والتذاكر والجاهزية التشغيلية — بالعربية والإنجليزية.',
        img:'6a330c17598da2f1e81b82711e1c5e9a', acc:'#3B2F92', cEn:'Sign in to start', cAr:'سجّل الدخول للبدء', copy:'© 2026 Zayed National Museum · Department of Culture and Tourism – Abu Dhabi',
        pop:false, popKind:'text', pEn:'', pAr:'', pbEn:'Learn more', pbAr:'اعرف المزيد',
        sec:'social', partners:[], soc:{ instagram:'https://www.instagram.com/zayednationalmuseum', x:'https://x.com/zayednationalmuseum', linkedin:'https://www.linkedin.com/company/zayed-national-museum', youtube:'https://www.youtube.com/@zayednationalmuseum' }, cust:'' },
      zu:{ hEn:'Zayed University 24-Hour Challenge', hAr:'تحدي جامعة زايد في 24 ساعة',
        sEn:'Complete “Introduction to Cultural Heritage”, then pitch your idea in 24 hours. The best ideas are scored by DCT judges.', sAr:'أكمل دورة «مقدمة في التراث الثقافي» ثم قدّم فكرتك خلال 24 ساعة. يقيّم محكّمو الدائرة أفضل الأفكار.',
        img:'006f6b748b68e46ce2d045fcc3d92aea', acc:'#F7C337', cEn:'Sign in to compete', cAr:'ادخل للمشاركة', copy:'© 2026 Zayed University · Department of Culture and Tourism – Abu Dhabi',
        pop:false, popKind:'text', pEn:'', pAr:'', pbEn:'See the rules', pbAr:'اطّلع على القواعد',
        sec:'none', partners:[], soc:{ instagram:'', x:'', linkedin:'', youtube:'' }, cust:'' }
    };
    return JSON.parse(JSON.stringify(S[site] || S.elevate));
  }
  preset(s){
    const base = { tab:'overview', dlg:null, ld:null, pub:null, errs:false, published:false, pvLang:null, pvDev:'desk', pvPopHidden:false, heroFile:null, rqName:'', rqPur:'', rqErr:false, extraReq:[], loading:false };
    if (s === 'landing') return { ...base, tab:'landing' };
    if (s === 'edited') return { ...base, tab:'landing', _edit:true };
    if (s === 'errors') return { ...base, tab:'landing', _bad:true, errs:true };
    if (s === 'confirm') return { ...base, tab:'landing', _edit:true, dlg:'confirm' };
    if (s === 'published') return { ...base, tab:'landing', published:true };
    if (s === 'request') return { ...base, dlg:'request', rqName:'Elevate Alumni 2026', rqPur:'' };
    return base;
  }
  renderVals(){
    const scr = this._screen('overview');
    const { lang, ar, site, L, sh, fmt, siteName } = this._base('elevate', 'dashboard', 'Admin dashboard', 'لوحة الإدارة');
    const st = this.state;
    const B = (id) => '/_blob/' + id;
    if (!st.pub || st._site !== site) { st._site = site; st.pub = this.landingSeed(site); st.ld = this.landingSeed(site); }
    if (st._edit) { st._edit = false; st.ld.pEn = st.ld.pop ? 'Mentee registration closes 15 Oct' : st.ld.pEn; st.ld.pAr = st.ld.pop ? 'يُغلق تسجيل المتدربين في 15 أكتوبر' : st.ld.pAr; st.ld.sEn = st.ld.sEn.replace('.', '. Sessions run on Zoom in Gulf time.'); st.ld.sAr = st.ld.sAr.replace('.', '. تُعقد الجلسات عبر Zoom بتوقيت الخليج.'); }
    if (st._bad) { st._bad = false; st.ld.hAr = ''; st.ld.acc = '#CD31'; if (site === 'znm') st.ld.soc.x = 'http://x.com/zayednationalmuseum'; else st.ld.pEn = ''; }
    const ld = st.ld, pub = st.pub;
    const dirty = JSON.stringify(ld) !== JSON.stringify(pub);
    const t = ar ? {
      spec:'لوحة المشرف الفرعي', ey: siteName + ' · مشرف فرعي', h1:'لوحة الموقع المصغّر', sub:'الحالة والأرقام الرئيسية وما يحتاج إلى انتباهك، وإعدادات الصفحة الرئيسية مع معاينة مباشرة.', viewLanding:'عرض الصفحة الرئيسية', publish:'نشر التغييرات', tabsAria:'أقسام اللوحة', tabOv:'نظرة عامة', tabLd:'إعدادات الصفحة الرئيسية', unpubShort:'تغييرات غير منشورة',
      live:'مباشر', signIn:'تسجيل الدخول', lastPub:'آخر نشر', landing:'الصفحة الرئيسية', editLanding:'تعديل الصفحة الرئيسية', actTitle:'النشاط الأخير', actNote:'آخر 30 يوماً', attTitle:'يحتاج إلى انتباهك', reqTitle:'طلب موقع مصغّر', reqSub:'تحتاج إلى برنامج جديد؟ يراجع مسؤول المنصة طلبك ويقرره.', reqBtn:'طلب موقع مصغّر جديد',
      pubOkT:'نُشرت الصفحة الرئيسية', errBody:'صحّح الحقول المحددة أدناه. لم يُحفظ أو يُنشر أي شيء.',
      heroT:'الواجهة الرئيسية', heroN:'تظهر أعلى الصفحة الرئيسية', heading:'العنوان', subheading:'العنوان الفرعي', heroImg:'صورة الواجهة', upload:'رفع صورة', replace:'استبدال', imgRule:'PNG أو JPG أو WebP · حتى 5 ميغابايت', copyright:'سطر حقوق النشر', optional:'(اختياري)',
      brandT:'اللون والدعوة إلى الإجراء', accent:'لون التمييز', hex:'رمز اللون', ctaOut:'زر الزائر غير المسجّل', ctaIn:'يرى الزائر المسجّل دخوله زر «انتقل إلى لوحتك» تلقائياً.',
      popT:'النافذة المنبثقة', popKind:'نوع النافذة', popImgAlt:'صورة النافذة المنبثقة', popText:'النص', popBtn:'نص الزر', popSan:'يُنقّى نص النافذة عند الحفظ (وسوم مسموحة فقط).', popOffNote:'لا تظهر نافذة منبثقة للزوار. فعّلها للإعلان عن تسجيل أو فعالية.',
      lowT:'القسم السفلي', custom:'محتوى مخصص', custHint:'يُنقّى HTML عند الحفظ: عناوين وفقرات وروابط https فقط.', noneNote:'لا يظهر قسم سفلي. تنتقل الصفحة من الواجهة إلى التذييل مباشرة.',
      modeT:'وضع تسجيل الدخول', readOnly:'للقراءة فقط', modeName:'بالدعوة فقط', modeNote:'يحدده مسؤول منصة DCT Learn. تواصل معه لتغييره.', mMode:'الوضع', mCta:'زر الصفحة (غير مسجّل)', mSignup:'نموذج التسجيل',
      discard:'تجاهل التغييرات', saveDraft:'حفظ كمسودة', pvT:'معاينة مباشرة', pvLang:'لغة المعاينة', pvDev:'الجهاز', desk:'حاسوب', mob:'جوال', pvHidePop:'إخفاء النافذة في المعاينة', pvShowPop:'إظهار النافذة في المعاينة',
      cfT:'نشر الصفحة الرئيسية؟', cfChanges:'ما الذي سيتغيّر', cfNote:'تتحدّث الصفحة المباشرة فوراً للجميع. يُسجَّل النشر في سجل التدقيق.', cancel:'إلغاء', cfBtn:'نشر الآن',
      reqDlg:'طلب موقع مصغّر جديد', reqDlgSub:'يصل الطلب إلى مسؤول المنصة على صفحة المواقع المصغّرة.', reqName:'اسم الموقع المقترح', reqPurpose:'الغرض والجمهور', reqSend:'إرسال الطلب'
    } : {
      spec:'Sub-admin dashboard', ey: siteName + ' · Sub admin', h1:'Microsite dashboard', sub:'Status, key numbers and what needs you — plus landing settings with a live preview.', viewLanding:'View landing', publish:'Publish changes', tabsAria:'Dashboard sections', tabOv:'Overview', tabLd:'Landing settings', unpubShort:'Unpublished changes',
      live:'Live', signIn:'Sign-in', lastPub:'Last published', landing:'Landing', editLanding:'Edit landing', actTitle:'Recent activity', actNote:'Last 30 days', attTitle:'Needs your attention', reqTitle:'Microsite requests', reqSub:'Need a new programme? The platform admin reviews and decides on your request.', reqBtn:'Request a new microsite',
      pubOkT:'Landing published', errBody:'Fix the highlighted fields below. Nothing was saved or published.',
      heroT:'Hero', heroN:'Top of the landing page', heading:'Heading', subheading:'Subheading', heroImg:'Hero image', upload:'Upload image', replace:'Replace', imgRule:'PNG, JPG or WebP · up to 5 MB', copyright:'Copyright line', optional:'(optional)',
      brandT:'Accent and call to action', accent:'Accent colour', hex:'Colour code', ctaOut:'Button for signed-out visitors', ctaIn:'Signed-in visitors automatically see “Go to your dashboard”.',
      popT:'Popup', popKind:'Popup type', popImgAlt:'Popup image', popText:'Text', popBtn:'Button label', popSan:'Popup text is sanitised on save (allow-listed tags only).', popOffNote:'Visitors see no popup. Turn it on to announce a registration or an event.',
      lowT:'Lower section', custom:'Custom content', custHint:'HTML is sanitised on save: headings, paragraphs and https links only.', noneNote:'No lower section. The page goes from the hero straight to the footer.',
      modeT:'Sign-in mode', readOnly:'Read-only', modeName:'Invite-only', modeNote:'Set by the DCT Learn platform admin. Ask them to change it.', mMode:'Mode', mCta:'Landing button (signed out)', mSignup:'Sign-up form',
      discard:'Discard changes', saveDraft:'Save draft', pvT:'Live preview', pvLang:'Preview language', pvDev:'Device', desk:'Desktop', mob:'Mobile', pvHidePop:'Hide popup in preview', pvShowPop:'Show popup in preview',
      cfT:'Publish the landing page?', cfChanges:'What changes', cfNote:'The live page updates for everyone straight away. Publishing is recorded in the audit log.', cancel:'Cancel', cfBtn:'Publish now',
      reqDlg:'Request a new microsite', reqDlgSub:'Your request goes to the platform admin on the Microsites page.', reqName:'Proposed microsite name', reqPurpose:'Purpose and audience', reqSend:'Send request'
    };
    const MON = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const D = (iso) => { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MON[m-1] + ' ' + y; };
    const PUBD = { elevate:'2026-09-14', znm:'2026-07-01', zu:'2026-09-10' }[site];
    const pubWhen = st.published ? L('6 Oct 2026 · 13:00 Gulf', '6 أكتوبر 2026 · 13:00 بتوقيت الخليج') : D(PUBD);
    const subAdmin = sh.userName;

    /* ---------- overview ---------- */
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', act:'M22 12h-4l-3 9L9 3l-3 9H2', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1M12 6.5l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3z', mail:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6', folder:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v5M9.5 13.5h5' };
    const K = { elevate:[1,1,0,0,1,0], znm:[2,2,4,3,0,1], zu:[2,2,1,1,1,0] }[site];
    const KN = {
      elevate:[['1 mentee matched','متدرّب واحد تمت مطابقته'],['signed in since 6 Sep','سجّلوا الدخول منذ 6 سبتمبر'],['no courses on Elevate','لا دورات في إرتقاء'],['none issued yet','لم تُصدر بعد'],['expires 15 Oct','تنتهي في 15 أكتوبر'],['all reviewed','تمت مراجعتها كلها']],
      znm:[['ZNM onboarding cohort','دفعة تهيئة المتحف'],['signed in since 6 Sep','سجّلوا الدخول منذ 6 سبتمبر'],['course completions','دورات مكتملة'],['issued on ZNM courses','صادرة لدورات المتحف'],['nothing waiting','لا شيء معلّق'],['Ticketing FAQ sheet','ملف أسئلة التذاكر']],
      zu:[['ZU students','طلاب جامعة زايد'],['signed in since 6 Sep','سجّلوا الدخول منذ 6 سبتمبر'],['24 Hour Challenge course','دورة تحدي 24 ساعة'],['issued on C13','صادرة لدورة التحدي'],['judge: Daniel Osei','المحكّم: دانيال أوسي'],['nothing waiting','لا شيء معلّق']]
    }[site];
    const kpis = [ [L('Members','الأعضاء'),'k-ink',KI.users], [L('Active in 30 days','نشطون خلال 30 يوماً'),'k-rasp',KI.act], [L('Completions','الإكمالات'),'k-indigo',KI.done], [L('Certificates','الشهادات'),'k-yel',KI.award], [L('Pending invites','دعوات معلقة'),'k-red',KI.mail], [L('Pending resources','موارد قيد المراجعة'),'k-coral',KI.folder] ]
      .map((x, i) => ({ l:x[0], cls:x[1], d:x[2], v:fmt(K[i]), n:L(KN[i][0], KN[i][1]) }));
    const AI = { mail:'M4 4h16v16H4zM4 6l8 7 8-7', user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20', check:'M20 6 9 17l-5-5', file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', flag:'M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1', star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' };
    const ACT = {
      elevate:[ ['c5',AI.globe,'You requested a new microsite: Elevate Alumni','طلبتَ موقعاً مصغّراً جديداً: إرتقاء للخريجين','2026-10-02','',''],
        ['c4',AI.mail,'Invitation sent to new.member@dctlearn.example','أُرسلت دعوة إلى new.member@dctlearn.example','2026-10-01','/members','Members'],
        ['c2',AI.chat,'Saeed Al Hammadi completed Session 1 with Dr. Hessa Al Nuaimi','أكمل سعيد الحمادي الجلسة 1 مع د. حصة النعيمي','2026-09-28','',''],
        ['c1',AI.user,'Saeed Al Hammadi registered as a mentee and was matched (87 %)','سجّل سعيد الحمادي كمتدرّب وتمت مطابقته (87 %)','2026-09-20','',''],
        ['c3',AI.globe,'Landing published by Layla Haddad','نشرت ليلى حداد الصفحة الرئيسية','2026-09-14','',''] ],
      znm:[ ['c2',AI.cal,'Museum Safety Briefing is live today','إحاطة السلامة في المتحف مباشرة اليوم','2026-10-06','',''],
        ['c4',AI.file,'You submitted “Ticketing FAQ sheet” for review','أرسلتَ «ملف أسئلة التذاكر» للمراجعة','2026-10-05','/resources','Resources'],
        ['c1',AI.check,'Yousef Al Zaabi completed VS Knowledge Assessment','أكمل يوسف الزعابي تقييم المعرفة','2026-10-03','',''],
        ['c5',AI.star,'Reem Al Shamsi earned the Introduction to Ticketing certificate','حصلت ريم الشامسي على شهادة مقدمة في التذاكر','2026-09-22','',''] ],
      zu:[ ['c4',AI.mail,'Judge invitation sent to Daniel Osei','أُرسلت دعوة تحكيم إلى دانيال أوسي','2026-10-03','/judges','Judges'],
        ['c2',AI.star,'Noura Al Kaabi scored Ahmed Khan: 72.0','قيّمت نورة الكعبي أحمد خان: 72.0','2026-10-02','/scores','Scores'],
        ['c1',AI.file,'Ahmed Khan submitted his action plan','قدّم أحمد خان خطة العمل','2026-09-30','',''],
        ['c5',AI.flag,'Round “24-Hour Challenge 2026” opened','فُتحت جولة «تحدي 24 ساعة 2026»','2026-09-15','/rounds','Rounds'] ]
    }[site];
    const activity = ACT.map(a => ({ c:a[0], d:a[1], title:L(a[2], a[3]), when:D(a[4]), href: a[5] ? '/' + site + '/admin' + a[5] : '', cta: a[6] ? L(a[6], { Members:'الأعضاء', Resources:'الموارد', Judges:'المحكّمون', Scores:'الدرجات', Rounds:'الجولات' }[a[6]]) : '' }));
    const ATT = {
      elevate:[ ['1','Pending invitation','دعوة معلقة','new.member@dctlearn.example · expires 15 Oct','new.member@dctlearn.example · تنتهي 15 أكتوبر','/members'], ['0','Resources awaiting review','موارد بانتظار المراجعة','Nothing waiting for the admin','لا شيء بانتظار المسؤول','/resources'] ],
      znm:[ ['1','Resource awaiting review','مورد بانتظار المراجعة','Ticketing FAQ sheet · since 5 Oct','ملف أسئلة التذاكر · منذ 5 أكتوبر','/resources'], ['0','Pending invitations','دعوات معلقة','Everyone invited has joined','انضم كل من تمت دعوته','/members'] ],
      zu:[ ['1','Judge invite pending','دعوة تحكيم معلقة','Daniel Osei · since 3 Oct','دانيال أوسي · منذ 3 أكتوبر','/judges'], ['1','Submission still in progress','مشاركة قيد الإعداد','Sara Haddad · round closes 20 Oct','سارة حداد · تُغلق الجولة 20 أكتوبر','/rounds'] ]
    }[site];
    const attention = ATT.map(a => ({ n:fmt(a[0]), title:L(a[1], a[2]), sub:L(a[3], a[4]), href:'/' + site + '/admin' + a[5] }));
    const requests = [ ...(site === 'elevate' ? [ { name:L('Elevate Alumni','إرتقاء للخريجين'), sub:L('Keep the 2025 cohort engaged · requested 2 Oct 2026','إبقاء دفعة 2025 على تواصل · طُلب في 2 أكتوبر 2026'), st:L('Requested','مطلوب') } ] : []),
      ...(st.extraReq || []).map(r => ({ name:r.name, sub:L(r.pur + ' · requested 6 Oct 2026', r.pur + ' · طُلب في 6 أكتوبر 2026'), st:L('Requested','مطلوب') })) ];
    const w = { h: L(siteName + ' is live', siteName + ' مباشر الآن'), p: L('Members sign in through invitations. Your landing page is what visitors see first — keep it current.', 'ينضم الأعضاء عبر الدعوات. الصفحة الرئيسية هي أول ما يراه الزوار — حافظ على تحديثها.'),
      mode: L('Invite-only','بالدعوة فقط'), pub: pubWhen, state: dirty ? L('Unpublished changes','تغييرات غير منشورة') : L('Up to date','محدّثة'), img: B(pub.img) };

    /* ---------- landing editor ---------- */
    const errs = {};
    const req = (k, max, en, a) => { const v = (ld[k] || '').trim(); if (!v) errs[k] = L(en + ' is required.', a + ' مطلوب.'); else if (v.length > max) errs[k] = L('Keep it under ' + max + ' characters.', 'اجعله أقل من ' + max + ' حرفاً.'); };
    req('hEn', 160, 'English heading', 'العنوان بالإنجليزية'); req('hAr', 160, 'Arabic heading', 'العنوان بالعربية');
    if ((ld.sEn || '').length > 240) errs.sEn = L('Keep it under 240 characters.','اجعله أقل من 240 حرفاً.');
    if ((ld.sAr || '').length > 240) errs.sAr = L('Keep it under 240 characters.','اجعله أقل من 240 حرفاً.');
    req('cEn', 40, 'English button label', 'نص الزر بالإنجليزية'); req('cAr', 40, 'Arabic button label', 'نص الزر بالعربية');
    const hexOk = /^#[0-9a-f]{6}$/i.test(ld.acc || '');
    if (!hexOk) errs.acc = L('Use a 6-digit colour code like #CD3151.','استخدم رمز لون من 6 خانات مثل ‎#CD3151‎.');
    const popText = ld.pop && ld.popKind !== 'image';
    if (popText) { req('pEn', 120, 'English popup text', 'نص النافذة بالإنجليزية'); req('pAr', 120, 'Arabic popup text', 'نص النافذة بالعربية'); }
    const socErr = {};
    if (ld.sec === 'social') Object.keys(ld.soc).forEach(k => { const v = (ld.soc[k] || '').trim(); if (v && !this._isHttps(v)) socErr[k] = L('Use a full https:// link.','استخدم رابطاً كاملاً يبدأ بـ https://.'); });
    const nErr = Object.keys(errs).length + Object.keys(socErr).length;
    const showErr = !!st.errs;
    const set = (k) => (e) => { const v = e.target.value; this.setState({ ld:{ ...this.state.ld, [k]:v }, published:false }); };
    const F = {};
    [['hEn',160],['hAr',160],['sEn',240],['sAr',240],['cEn',40],['cAr',40],['pEn',120],['pAr',120],['pbEn',40],['pbAr',40],['copy',240],['cust',20000],['acc',7]].forEach(([k, max]) => {
      const v = ld[k] || ''; const e = showErr && errs[k] ? errs[k] : '';
      F[k] = { v, on:set(k), n: fmt(v.length) + ' / ' + fmt(max), cc: v.length > max ? 'over' : '', err:e, ec: e ? 'is-error' : '', inv: e ? 'true' : 'false' };
    });
    /* contrast */
    const lum = (hex) => { const c = [1,3,5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const accentSafe = hexOk ? ld.acc : pub.acc;
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const rW = ratio(accentSafe, '#FFFFFF'), rI = ratio(accentSafe, '#1D1650');
    const whiteOk = rW >= 4.5;
    const accentFg = whiteOk ? '#FFFFFF' : '#1D1650';
    const accentText = ratio(accentSafe, '#F1EDE8') >= 4.5 ? accentSafe : '#1D1650';
    const ctr = hexOk ? (whiteOk ? { cls:'ok', text:L('White button text ' + rW.toFixed(1) + ':1 · passes AA', 'نص أبيض ' + rW.toFixed(1) + ':1 · يجتاز AA') } : { cls:'warn', text:L('White text only ' + rW.toFixed(1) + ':1 — buttons use indigo text (' + rI.toFixed(1) + ':1)', 'النص الأبيض ' + rW.toFixed(1) + ':1 فقط — تستخدم الأزرار نصاً نيلياً (' + rI.toFixed(1) + ':1)') }) : { cls:'warn', text:'' };
    const sw = ['#CD3151','#D63539','#EE3E43','#3B2F92','#1D1650','#F77860','#E35E3C','#F7C337','#2FC4DB'];
    const swatches = sw.map(c => ({ c, pr: (ld.acc || '').toUpperCase() === c ? 'true' : 'false', pick: () => this.setState({ ld:{ ...this.state.ld, acc:c }, published:false }) }));
    const HERO = [ [this.landingSeed(site).img, L('Programme hero','صورة البرنامج')], ['eb80e68b5f407df8f3c317956007a5a2', L('Colleagues at a table','زملاء حول طاولة')], ['1309cd48586ad6e5374578ed63abc172', L('Abu Dhabi cultural landmark','معلم ثقافي في أبوظبي')], ['880a72d5794fad0ac73793c03f37c852', L('Al Ayyala performance','عرض العيالة')] ];
    const heroOpts = HERO.map(h => ({ src:B(h[0]), alt:h[1], on: ld.img === h[0], cls: ld.img === h[0] ? 'on' : '', pick: () => this.setState({ ld:{ ...this.state.ld, img:h[0] }, heroFile:null, published:false }) }));
    const onHeroFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const okT = /^image\/(png|jpeg|webp)$/.test(f.type); const okS = f.size <= 5 * 1024 * 1024;
      this.setState({ heroFile: okT && okS ? { ok:true, name:f.name } : { ok:false, msg: !okT ? L(f.name + ' is not a PNG, JPG or WebP image.', 'الملف ' + f.name + ' ليس صورة PNG أو JPG أو WebP.') : L(f.name + ' is larger than 5 MB.', 'الملف ' + f.name + ' أكبر من 5 ميغابايت.') } }); };
    const hf = st.heroFile;
    const heroFileMsg = hf ? (hf.ok ? L(hf.name + ' uploaded · it replaces the image after you publish (mockup keeps the current preview).', 'رُفع ' + hf.name + ' · يحل محل الصورة بعد النشر (يحتفظ النموذج بالمعاينة الحالية).') : hf.msg) : '';
    const popKinds = [['image',L('Image','صورة')],['text',L('Text','نص')],['image_text',L('Image + text','صورة + نص')]].map(k => ({ label:k[1], pr: ld.popKind === k[0] ? 'true' : 'false', pick: () => this.setState({ ld:{ ...this.state.ld, popKind:k[0] }, published:false }) }));
    const secKinds = [['partners',L('Partner logos','شعارات الشركاء')],['social',L('Social links','روابط التواصل')],['custom',L('Custom','مخصص')],['none',L('None','بدون')]].map(k => ({ label:k[1], pr: ld.sec === k[0] ? 'true' : 'false', pick: () => this.setState({ ld:{ ...this.state.ld, sec:k[0] }, published:false }) }));
    const PART = [ ['dct','dc0ae6d896d4a402350748dffd80b8f1','DCT Abu Dhabi','دائرة الثقافة والسياحة'], ['fm','eee73c9704c8c5b98897e4e5e08055cd','France Muséums','فرانس ميوزيم'], ['rmn','6d0f8fa77d9e90d93ff89e579a1ea0f7','Réunion des Musées','اتحاد المتاحف الوطنية'], ['inp','ac08204f06196439c00888e3dca1d62d','Institut national du patrimoine','المعهد الوطني للتراث'] ];
    const partners = PART.map(p => { const on = ld.partners.includes(p[0]); return { src:B(p[1]), name:L(p[2], p[3]), on, cls: on ? 'on' : '', tog: () => { const cur = this.state.ld.partners; this.setState({ ld:{ ...this.state.ld, partners: on ? cur.filter(x => x !== p[0]) : [ ...cur, p[0] ] }, published:false }); } }; });
    const SOC = [['instagram','Instagram'],['x','X'],['linkedin','LinkedIn'],['youtube','YouTube']];
    const socials = SOC.map(s => { const e = showErr && socErr[s[0]] ? socErr[s[0]] : ''; return { id:'soc-' + s[0], label:s[1], v:ld.soc[s[0]] || '', err:e, ec: e ? 'is-error' : '', on: (ev) => { const v = ev.target.value; this.setState({ ld:{ ...this.state.ld, soc:{ ...this.state.ld.soc, [s[0]]:v } }, published:false }); } }; });
    const modes = [ ['open',L('Open','مفتوح'),L('Sign in / Join','تسجيل الدخول / انضم'),L('Shown','ظاهر')], ['invite_only',L('Invite-only (this microsite)','بالدعوة فقط (هذا الموقع)'),L('Sign in','تسجيل الدخول'),L('Hidden — “access by invitation”','مخفي — «الوصول بالدعوة»')], ['landing_only',L('Landing-only','الصفحة الرئيسية فقط'),L('Register interest','سجّل اهتمامك'),'—'] ]
      .map(m => ({ a:m[1], b:m[2], c:m[3], cls: m[0] === 'invite_only' ? 'cur' : '' }));

    /* preview */
    const pl = st.pvLang || lang; const pa = pl === 'ar';
    const P = (en, a) => pa ? a : en;
    const SNP = { elevate:['Elevate 2026','إرتقاء 2026'], znm:['Zayed National Museum','متحف زايد الوطني'], zu:['ZU 24-Hour Challenge','تحدي جامعة زايد'] }[site];
    const pv = {
      dir: pa ? 'rtl' : 'ltr', lang:pl, url:'dctlearn.ae/' + site, site:P(SNP[0], SNP[1]), signIn:P('Sign in','تسجيل الدخول'),
      chip: P({ elevate:'Mentorship programme', znm:'Onboarding programme', zu:'Competition' }[site], { elevate:'برنامج إرشاد', znm:'برنامج التهيئة', zu:'مسابقة' }[site]),
      h: P(ld.hEn, ld.hAr) || P('Heading','العنوان'), s: P(ld.sEn, ld.sAr), cta: P(ld.cEn, ld.cAr), img: B(ld.img),
      showLow: ld.sec !== 'none', lowT: ld.sec === 'partners' ? P('In partnership with','بالشراكة مع') : ld.sec === 'social' ? P('Follow us','تابعنا') : '',
      partners: PART.filter(p => ld.partners.includes(p[0])).map(p => ({ src:B(p[1]), name:p[2] })),
      socials: SOC.filter(s => (ld.soc[s[0]] || '').trim()).map(s => s[1]),
      custom: (ld.cust || '').replace(/<[^>]*>/g, ' ').trim() || P('Your custom content appears here.','يظهر المحتوى المخصص هنا.'),
      copy: ld.copy || '© 2026', pop: ld.pop && !st.pvPopHidden, popHidden: ld.pop && st.pvPopHidden, popText: P(ld.pEn, ld.pAr), popBtn: P(ld.pbEn, ld.pbAr)
    };
    const fields = { hEn:L('English heading','العنوان بالإنجليزية'), hAr:L('Arabic heading','العنوان بالعربية'), sEn:L('English subheading','العنوان الفرعي بالإنجليزية'), sAr:L('Arabic subheading','العنوان الفرعي بالعربية'), img:L('Hero image','صورة الواجهة'), acc:L('Accent colour','لون التمييز'), cEn:L('Button label (EN)','نص الزر (EN)'), cAr:L('Button label (AR)','نص الزر (AR)'), copy:L('Copyright line','سطر حقوق النشر'), pop:L('Popup on/off','تشغيل النافذة'), popKind:L('Popup type','نوع النافذة'), pEn:L('Popup text (EN)','نص النافذة (EN)'), pAr:L('Popup text (AR)','نص النافذة (AR)'), pbEn:L('Popup button (EN)','زر النافذة (EN)'), pbAr:L('Popup button (AR)','زر النافذة (AR)'), sec:L('Lower section type','نوع القسم السفلي'), partners:L('Partner logos','شعارات الشركاء'), soc:L('Social links','روابط التواصل'), cust:L('Custom content','المحتوى المخصص') };
    const changes = Object.keys(fields).filter(k => JSON.stringify(ld[k]) !== JSON.stringify(pub[k])).map(k => fields[k]);
    const tryPublish = () => {
      if (nErr) return this.setState({ errs:true, tab:'landing', published:false });
      if (!dirty) return this._toast('Nothing to publish — the live landing is already up to date.', 'لا يوجد ما يُنشر — الصفحة المباشرة محدّثة.');
      this.setState({ dlg:'confirm', errs:false });
    };
    const doPublish = () => { this.setState({ loading:true }); setTimeout(() => { this.setState({ loading:false, dlg:null, pub:JSON.parse(JSON.stringify(this.state.ld)), published:true, errs:false }); this._toast('Landing published · recorded in the audit log', 'نُشرت الصفحة الرئيسية · سُجّل في سجل التدقيق'); }, 700); };
    const saveDraft = () => { if (nErr) return this.setState({ errs:true }); this.setState({ errs:false, savedAt:true }); this._toast('Draft saved. Visitors still see the published version.', 'حُفظت المسودة. يرى الزوار النسخة المنشورة.'); };
    const draftTag = dirty ? L('Draft · unpublished','مسودة · غير منشورة') : L('Live · up to date','مباشر · محدّث');
    const draftNote = dirty ? (st.savedAt ? L('Saved as draft at 13:04 Gulf', 'حُفظت كمسودة 13:04 بتوقيت الخليج') : L(changes.length + ' change(s) since ' + pubWhen, changes.length + ' تغيير منذ ' + pubWhen)) : L('Published ' + pubWhen + ' by ' + subAdmin, 'نُشرت ' + pubWhen + ' بواسطة ' + subAdmin);

    /* request */
    const rqNameErr = st.rqErr && !(st.rqName || '').trim() ? L('Enter a name.','أدخل اسماً.') : '';
    const rqPurErr = st.rqErr && !(st.rqPur || '').trim() ? L('Tell the admin who it is for and why.','أخبر المسؤول لمن الموقع ولماذا.') : '';
    const sendReq = () => { if (!(st.rqName || '').trim() || !(st.rqPur || '').trim()) return this.setState({ rqErr:true }); this.setState({ dlg:null, rqErr:false, extraReq:[ ...(st.extraReq || []), { name:st.rqName.trim(), pur:st.rqPur.trim() } ], rqName:'', rqPur:'' }); this._toast('Request sent to the platform admin', 'أُرسل الطلب إلى مسؤول المنصة'); };

    const SCR = [['overview','Overview'],['landing','Landing'],['edited','Edited'],['errors','Errors'],['confirm','Publish confirm'],['published','Published'],['request','Request']];
    const isLanding = st.tab === 'landing';
    return {
      lang, t, sh, ...this._common(ar), route:'/' + site + '/admin',
      siteBtns: [['elevate','Elevate'],['znm','ZNM'],['zu','ZU']].map(x => ({ label:x[1], cls: x[0] === site ? 'is-on' : '', pick: () => this.setState({ site:x[0], pub:null, ld:null, published:false, errs:false, dlg:null }) })),
      scrBtns: this._seg(SCR, scr, ar), landingHref:'/' + site,
      isOverview: !isLanding, isLanding, tabOvCls: isLanding ? '' : 'on', tabLdCls: isLanding ? 'on' : '', tabOvSel: isLanding ? 'false' : 'true', tabLdSel: isLanding ? 'true' : 'false', tabId: isLanding ? 'tab-ld' : 'tab-ov',
      goOverview: () => this.setState({ tab:'overview' }), goLanding: () => this.setState({ tab:'landing' }), dirty,
      w, kpis, activity, attention, requests, openReq: () => this.setState({ dlg:'request', rqErr:false }),
      justPublished: !!st.published && !dirty, pubOkB: L('Visitors now see the new version at dctlearn.ae/' + site + ' · ' + pubWhen + '.', 'يرى الزوار الآن النسخة الجديدة على dctlearn.ae/' + site + ' · ' + pubWhen + '.'),
      hasErrors: showErr && nErr > 0, errTitle: L(nErr + (nErr === 1 ? ' field needs' : ' fields need') + ' attention before publishing', nErr + ' حقول تحتاج إلى تصحيح قبل النشر'),
      F, heroOpts, onHeroFile, heroFileMsg, heroFileCls: hf && !hf.ok ? 'err' : 'ok-msg',
      swatches, accentSafe, accentFg, accentText, accentSoft: accentSafe + '22', ctr,
      popOn: !!ld.pop, popOff: !ld.pop, popOnS: ld.pop ? 'true' : 'false', popOnLabel: ld.pop ? L('On','مفعّلة') : L('Off','متوقفة'), togglePop: () => this.setState({ ld:{ ...this.state.ld, pop:!this.state.ld.pop, popKind: this.state.ld.popKind || 'text' }, published:false, pvPopHidden:false }),
      popKinds, popHasImg: ld.popKind !== 'text', popHasText: ld.popKind !== 'image', popImg: B('aab2393ef63c633ea3a973ddf7f970a3'),
      secKinds, secPartners: ld.sec === 'partners', secSocial: ld.sec === 'social', secCustom: ld.sec === 'custom', secNone: ld.sec === 'none', partners, socials, modes,
      draftTag, draftTagCls: dirty ? 'warn' : 'ok', draftNote, discard: () => this.setState({ ld:JSON.parse(JSON.stringify(pub)), errs:false, savedAt:false }), saveDraft, tryPublish,
      pv, frameCls: st.pvDev === 'mob' ? 'mob' : '', pvEnCls: pa ? '' : 'is-on', pvArCls: pa ? 'is-on' : '', pvEn: () => this.setState({ pvLang:'en' }), pvAr: () => this.setState({ pvLang:'ar' }),
      pvDeskCls: st.pvDev === 'mob' ? '' : 'is-on', pvMobCls: st.pvDev === 'mob' ? 'is-on' : '', pvDesk: () => this.setState({ pvDev:'desk' }), pvMob: () => this.setState({ pvDev:'mob' }),
      pvNote: dirty ? L('Showing your draft. Visitors see the published version until you publish.', 'تعرض المعاينة مسودتك. يرى الزوار النسخة المنشورة حتى تنشر.') : L('Matches the published page.', 'مطابقة للصفحة المنشورة.'),
      hidePvPop: () => this.setState({ pvPopHidden:true }), showPvPop: () => this.setState({ pvPopHidden:false }),
      dConfirm: st.dlg === 'confirm', cfSub: L(siteName + ' · dctlearn.ae/' + site, siteName + ' · dctlearn.ae/' + site), changes, doPublish, pubLoading: st.loading ? 'is-loading' : '',
      dReq: st.dlg === 'request', rqName: st.rqName || '', rqPur: st.rqPur || '', onRqName: (e) => this.setState({ rqName:e.target.value }), onRqPur: (e) => this.setState({ rqPur:e.target.value }), rqNameErr, rqPurErr, rqNameCls: rqNameErr ? 'is-error' : '', rqPurCls: rqPurErr ? 'is-error' : '', sendReq,
      closeDlg: () => this.setState({ dlg:null }), stop: (e) => e.stopPropagation()
    };
  }
}
