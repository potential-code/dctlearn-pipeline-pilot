// Ported verbatim from the Claude Design artboard Shell (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, role:null, active:0, tab:0, micro:0, microOpen:false, userOpen:false }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const role = this.state.role || this.props.role || 'learner';
    const T = ar ? { sys:'نظام التصميم · الهيكل', pickRole:'اختر الدور', microsite:'الموقع الفرعي', profile:'الملف الشخصي', settings:'الإعدادات', signOut:'تسجيل الخروج', dashboard:'لوحة التحكم' } : { sys:'Design system · Shell', pickRole:'Pick a role', microsite:'Microsite', profile:'Profile', settings:'Settings', signOut:'Sign out', dashboard:'Dashboard' };
    const I = { dash:'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', cal:'M3 6h18v15H3zM16 2v4M8 2v4M3 10h21', users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', bot:'M12 2v4M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9 17h6', tool:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8', chat:'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3', award:'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12', user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', video:'M23 7l-7 5 7 5V7zM1 5h15v14H1z', list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', chart:'M18 20V10M12 20V4M6 20v-6', grid:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z', layout:'M3 3h18v18H3zM3 9h18M9 21V9', rounds:'M21 12a9 9 0 1 1-6.2-8.6M21 3v6h-6', rubric:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', gavel:'M14 13l-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M16 16l6-6M13 7l6 6M8 2l8 8M2 8l8 8', eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', form:'M9 2h6v4H9zM4 6h16v16H4zM8 12h8M8 16h5', lang:'M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6', embed:'M16 18l6-6-6-6M8 6l-6 6 6 6', spark:'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1' };
    const navs = {
      learner: [
        { g: ar?'التعلم':'Learn' },
        { l: ar?'لوحة التحكم':'Dashboard', i:'dash' }, { l: ar?'الدورات':'Courses', i:'book', b:'2' }, { l: ar?'ورش العمل':'Workshops', i:'cal' }, { l: ar?'المرشدون':'Mentors', i:'users' }, { l: ar?'المدربون الأذكياء':'AI Coaches', i:'bot' }, { l: ar?'أدوات الذكاء الاصطناعي':'AI Tools', i:'tool' }, { l: ar?'الموارد':'Resources', i:'file' },
        { g: ar?'البرامج':'Programmes' },
        { l: ar?'الإرشاد':'Mentoring', i:'chat' }, { l: ar?'المسابقة':'Competition', i:'trophy' }, { l: ar?'الإنجازات':'Achievements', i:'award' }, { l: ar?'الملف الشخصي':'Profile', i:'user' }
      ],
      mentor: [ { g: ar?'الإرشاد':'Mentoring' }, { l: ar?'لوحة التحكم':'Dashboard', i:'dash' }, { l: ar?'التوفر':'Availability', i:'clock' }, { l: ar?'الجلسات':'Sessions', i:'video', b:'1' }, { l: ar?'الملف الشخصي':'Profile', i:'user' } ],
      judge: [ { g: ar?'التحكيم':'Judging' }, { l: ar?'لوحة التحكم':'Dashboard', i:'dash' }, { l: ar?'المتقدمون':'Applicants', i:'list', b:'2' } ],
      subadmin: [ { g: ar?'الموقع الفرعي':'Microsite' }, { l: ar?'لوحة التحكم':'Dashboard', i:'dash' }, { l: ar?'الأعضاء':'Members', i:'users' }, { l: ar?'الموارد':'Resources', i:'file' }, { g: ar?'المسابقة':'Competition' }, { l: ar?'الجولات':'Rounds', i:'rounds' }, { l: ar?'معايير التقييم':'Rubrics', i:'rubric' }, { l: ar?'المحكّمون':'Judges', i:'gavel' }, { l: ar?'الدرجات':'Scores', i:'chart' }, { g: '' }, { l: ar?'عرض كمتعلم':'View as learner', i:'eye' } ],
      admin: [ { g: ar?'نظرة عامة':'Overview' }, { l: ar?'لوحة التحكم':'Dashboard', i:'dash' }, { l: ar?'التقارير':'Reports', i:'chart' }, { g: ar?'المحتوى':'Content' }, { l: ar?'المواقع الفرعية':'Microsites', i:'grid' }, { l: ar?'قوالب الصفحات':'Landing templates', i:'layout' }, { l: ar?'المستخدمون':'Users', i:'users' }, { l: ar?'الكتالوج':'Catalog', i:'book' }, { l: ar?'الفعاليات':'Events', i:'cal' }, { l: ar?'النماذج':'Forms', i:'form' }, { l: ar?'الموارد':'Resources', i:'file', b:'1' }, { g: ar?'البرامج':'Programmes' }, { l: ar?'مجموعة المرشدين':'Mentor pool', i:'chat' }, { l: ar?'الإنجازات':'Achievements', i:'award' }, { l: ar?'الترجمات':'Translations', i:'lang' }, { l: ar?'تضمينات الذكاء الاصطناعي':'AI embeds', i:'embed' } ]
    };
    let idx = -1;
    const nav = navs[role].map((n) => {
      if (n.g !== undefined) return { group: n.g !== '', item: false, label: n.g, cls:'', d:'', badge:'', cur:'false', pick: () => {} };
      idx += 1; const k = idx;
      return { group:false, item:true, label:n.l, d:I[n.i], badge:n.b || '', cls: k === this.state.active ? 'is-active' : '', cur: k === this.state.active ? 'page' : 'false', pick: () => this.setState({ active:k, tab:0, microOpen:false, userOpen:false }) };
    });
    const people = {
      learner: { name:'Saeed Al Hammadi', title: ar?'أخصائي، قطاع الثقافة':'Specialist, DCT Culture', email:'saeed.h@dctlearn.example', chip:'chip-primary', label: ar?'متعلم':'Learner' },
      mentor: { name:'Dr. Hessa Al Nuaimi', title: ar?'مديرة استراتيجية المتاحف':'Director, Museums Strategy', email:'hessa.n@example.com', chip:'chip-indigo', label: ar?'مرشدة':'Mentor' },
      judge: { name:'Noura Al Kaabi', title: ar?'محكّمة · تحدي 24 ساعة':'Judge · 24-Hour Challenge', email:'noura.k@example.com', chip:'chip-sand', label: ar?'محكّمة':'Judge' },
      subadmin: { name:'Khalid Al Dhaheri', title: ar?'مشرف فرعي · متحف زايد الوطني':'Sub admin · ZNM', email:'khalid.d@dctlearn.example', chip:'chip-muted', label: ar?'مشرف فرعي':'Sub admin' },
      admin: { name:'Aisha Al Marzouqi', title: ar?'مديرة المنصة':'Platform admin', email:'aisha.admin@dctlearn.example', chip:'chip-success', label: ar?'مدير':'Admin' }
    };
    const pr = people[role];
    const microsList = [ { name: ar?'موظفو الدائرة':'DCT Employees', accent:'#EE3E43' }, { name: ar?'برنامج إرتقاء':'Elevate 2026', accent:'#CD3151' }, { name: ar?'متحف زايد الوطني':'Zayed National Museum', accent:'#3B2F92' } ];
    const micros = microsList.map((m, i) => ({ ...m, cls: i === this.state.micro ? 'is-on' : '', pick: () => this.setState({ micro:i, microOpen:false }) }));
    const microName = role === 'learner' ? microsList[this.state.micro].name : role === 'subadmin' ? (ar?'متحف زايد الوطني':'Zayed National Museum') : role === 'judge' ? (ar?'تحدي جامعة زايد':'ZU 24-Hour Challenge') : role === 'mentor' ? (ar?'برنامج إرتقاء':'Elevate 2026') : 'DCT Learn';
    const pages = {
      learner: { c1: ar?'الدورات':'Courses', c2:'DCT World', title: ar?'عالم الدائرة':'DCT World', desc: ar?'أربع وحدات عن الدائرة وقطاعاتها ودورك في رحلة الزائر. 45 دقيقة · شهادة عند الإكمال.':'Four units on DCT, its sectors and your role in the visitor journey. 45 min · certificate on completion.', p: ar?'متابعة الوحدة 3':'Continue unit 3', s: ar?'تنزيل المخطط':'Download outline', pc:'btn-primary', tabs: ar?['نظرة عامة','الوحدات','الموارد','خطة العمل']:['Overview','Units','Resources','Action plan'] },
      mentor: { c1: ar?'الجلسات':'Sessions', c2: ar?'سعيد الحمادي':'Saeed Al Hammadi', title: ar?'الجلسة 2 مع سعيد الحمادي':'Session 2 with Saeed Al Hammadi', desc: ar?'الأحد 12 أكتوبر · 11:00 بتوقيت الخليج · 60 دقيقة · عبر Zoom':'Sunday 12 October · 11:00 Gulf · 60 min · Zoom', p: ar?'الانضمام إلى الجلسة':'Join session', s: ar?'سجل GROW':'GROW log', pc:'btn-event', tabs: ar?['التحضير','سجل GROW','الملاحظات','السجل']:['Prepare','GROW log','Notes','History'] },
      judge: { c1: ar?'المتقدمون':'Applicants', c2:'Ahmed Khan', title: ar?'تقييم: أحمد خان':'Score: Ahmed Khan', desc: ar?'الجولة 1 · تحدي 24 ساعة 2026 · تم التقديم في 30 سبتمبر · 4 معايير من 100':'Round 1 · 24-Hour Challenge 2026 · submitted 30 Sept · 4 criteria out of 100', p: ar?'إرسال الدرجات':'Submit scores', s: ar?'حفظ المسودة':'Save draft', pc:'btn-primary', tabs: ar?['خطة العمل','بطاقة التقييم','السجل']:['Action plan','Scorecard','History'] },
      subadmin: { c1: ar?'الأعضاء':'Members', c2: ar?'الدعوات':'Invitations', title: ar?'الأعضاء':'Members', desc: ar?'42 عضواً نشطاً · 3 دعوات معلّقة · متحف زايد الوطني':'42 active members · 3 pending invitations · Zayed National Museum', p: ar?'دعوة أعضاء':'Invite members', s: ar?'استيراد CSV':'Import CSV', pc:'btn-primary', tabs: ar?['النشطون','المدعوون','المعطّلون']:['Active','Invited','Disabled'] },
      admin: { c1: ar?'المواقع الفرعية':'Microsites', c2: ar?'نبراس':'Nibras', title: ar?'نبراس — أبطال الذكاء الاصطناعي':'Nibras — DCT AI Champions', desc: ar?'4 دورات · 3 مسارات · 1 مشرف فرعي · آخر نشر في 5 أكتوبر':'4 courses · 3 tracks · 1 sub admin · last published 5 Oct', p: ar?'نشر الصفحة':'Publish landing', s: ar?'معاينة':'Preview', pc:'btn-primary', tabs: ar?['الإعدادات','الصفحة الرئيسية','الدورات','الأعضاء','الأذونات']:['Settings','Landing','Courses','Members','Permissions'] }
    };
    const pg = pages[role];
    const tabs = pg.tabs.map((l, i) => ({ label:l, cls: i === this.state.tab ? 'is-active' : '', sel: i === this.state.tab ? 'true' : 'false', pick: () => this.setState({ tab:i }) }));
    const tabBodies = ar ? 'يعيش محتوى التبويب هنا. تنزلق خطوط التبويب بسمك 3 بكسل بين العناصر خلال 300 مللي ثانية، ويتلاشى المحتوى خلال 400 مللي ثانية. تبويب واحد نشط دائماً، ولا تُستخدم التبويبات للتنقل بين الصفحات.' : 'Tab content lives here. The 3 px underline slides between items in 300 ms and the panel fades in 400 ms. One tab is always active; tabs never navigate between pages.';
    const roleDefs = [ ['learner', ar?'متعلم':'Learner'], ['mentor', ar?'مرشد':'Mentor'], ['judge', ar?'محكّم':'Judge'], ['subadmin', ar?'مشرف فرعي':'Sub admin'], ['admin', ar?'مدير':'Admin'] ];
    const roles = roleDefs.map((r) => ({ label:r[1], cls: r[0] === role ? 'is-on' : '', pick: () => this.setState({ role:r[0], active:0, tab:0, microOpen:false, userOpen:false }) }));
    const initials = pr.name.replace('Dr. ','').split(' ').map((w) => w[0]).slice(0,2).join('').toUpperCase();
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: T,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      roles: roles, nav: nav, micro: microName, micros: micros,
      showSwitch: role === 'learner', showName: role === 'subadmin',
      microOpen: this.state.microOpen, togMicro: () => this.setState({ microOpen: !this.state.microOpen, userOpen:false }),
      userOpen: this.state.userOpen, togUser: () => this.setState({ userOpen: !this.state.userOpen, microOpen:false }),
      roleChip: pr.chip, roleLabel: pr.label, initials: initials, userName: pr.name, userTitle: pr.title, userEmail: pr.email,
      crumb1: pg.c1, crumb2: pg.c2, pageTitle: pg.title, pageDesc: pg.desc, primaryAction: pg.p, secondaryAction: pg.s, primaryCls: pg.pc,
      tabs: tabs, tabTitle: pg.tabs[this.state.tab], tabBody: tabBodies
    };
  }
}
