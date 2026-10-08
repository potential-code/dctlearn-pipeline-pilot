// Ported verbatim from the Claude Design artboard P13-Hubs (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const B = (id) => '/_blob/' + id;
    const t = {
      spec:L('Choose your learning hub','اختر مركز التعلّم'), hubs:L('Learning hubs','مراكز التعلّم'), langAria:L('Switch to Arabic','التبديل إلى الإنجليزية'), langLabel: ar ? 'EN' : 'عربي', notif:L('Notifications','الإشعارات'), meProfile:L('My profile','ملفي الشخصي'), meOut:L('Sign out','تسجيل الخروج'), meAria:L('Account menu','قائمة الحساب'),
      name:L('Saeed Al Hammadi','سعيد الحمادي'), role:L('Specialist, DCT Culture','أخصائي، قطاع الثقافة'), signOut:L('Sign out','تسجيل الخروج'),
      ey:L('Welcome back, Saeed','مرحباً بعودتك يا سعيد'), h1:L('Choose your learning hub','اختر مركز التعلّم'), p:L('You belong to two programmes. Pick one to continue — you can switch any time from the sidebar without signing in again.','أنت عضو في برنامجين. اختر أحدهما للمتابعة — ويمكنك التبديل في أي وقت من الشريط الجانبي دون تسجيل دخول جديد.'),
      featL:L('What’s inside','ما يتضمنه'), enter:L('Enter hub','ادخل المركز'),
      othEy:L('Across DCT Learn','في DCT Learn'), othH:L('Other programmes','برامج أخرى'), allProg:L('All programmes','كل البرامج'),
      help:L('Expecting another programme? Your invitation e-mail has the link — or ask the programme’s sub admin to invite you.','تنتظر برنامجاً آخر؟ ستجد الرابط في رسالة الدعوة، أو اطلب من المشرف الفرعي للبرنامج دعوتك.')
    };
    const hubs = [
      { hid:'h-emp', ac:'#EE3E43', img:B('92c83a667e1befe5661dab8c7ebca349'), kind:L('Learning hub','مركز تعلّم'), name:L('DCT Employees','موظفو الدائرة'), last:L('Last visited today, 08:42','آخر زيارة اليوم 08:42'),
        sub:L('Courses, workshops and AI coaches for colleagues across DCT Abu Dhabi.','دورات وورش عمل ومدربون أذكياء لزملاء دائرة الثقافة والسياحة – أبوظبي.'),
        feats:[L('Courses','الدورات'),L('Workshops','ورش العمل'),L('Mentors','المرشدون'),L('AI Coaches','المدربون الأذكياء'),L('AI Tools','أدوات الذكاء الاصطناعي')],
        pct:'33%', pctN:'33', pctL:'33%', progL:L('2 of 8 courses complete · 280 pts','دورتان من 8 مكتملتان · 280 نقطة'), next:L('Next: Museum 101, unit 4','التالي: المتاحف 101، الدرس 4'), href:'/employees/dashboard' },
      { hid:'h-elv', ac:'#CD3151', img:B('9842ff4b5522772462642e07bfb6d8c1'), kind:L('Mentorship programme','برنامج إرشاد'), name:L('Elevate 2026','إرتقاء 2026'), last:L('Last visited Sun 4 Oct','آخر زيارة الأحد 4 أكتوبر'),
        sub:L('Are you ready to accelerate your growth and career at DCT Abu Dhabi?','هل أنت مستعد لتسريع نموك ومسيرتك المهنية في الدائرة؟'),
        feats:[L('Mentors','المرشدون'),L('Sessions','الجلسات'),L('Mentoring','الإرشاد'),L('GROW notes','ملاحظات GROW')],
        pct:'17%', pctN:'17', pctL:'17%', progL:L('1 of 6 sessions · matched with Dr. Hessa','جلسة من 6 · مع د. حصة'), next:L('Next: Mon 12 Oct · 11:00 Gulf','التالي: الإثنين 12 أكتوبر · 11:00'), href:'/elevate/dashboard' }
    ];
    const others = [
      { name:L('Zayed National Museum','متحف زايد الوطني'), sub:L('Onboarding · invite only','التهيئة · بالدعوة فقط'), go:L('Learn more','اعرف المزيد'), href:'/znm', img:B('6a330c17598da2f1e81b82711e1c5e9a'), ac:'#3B2F92' },
      { name:L('Ruwaad','رواد'), sub:L('Careers in Hospitality','وظائف في الضيافة'), go:L('Register interest','سجّل اهتمامك'), href:'/ruwaad', img:B('3e5eadfa4450ed50cc8f8900fdc8e3e3'), ac:'#F77860' },
      { name:L('Cultural Heritage Forum','منتدى التراث الثقافي'), sub:L('Open to everyone','مفتوح للجميع'), go:L('Join','انضم'), href:'/login', img:B('a39ca3b3c0fdaf9dcd07000a3da4c090'), ac:'#6D7782' }
    ];
    return { lang, dir: ar?'rtl':'ltr', t, hubs, others, protoCls: this.props.proto ? 'proto' : '',
      enCls: ar?'':'is-on', arCls: ar?'is-on':'', setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }) };
  }
}
