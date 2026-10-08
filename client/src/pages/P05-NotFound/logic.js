// Ported verbatim from the Claude Design artboard P05-NotFound (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null }; }
  chrome(ar, active){
    const N = ar ? [['home','/','الرئيسية'],['professionals','/professionals','الموظفون'],['students','/students','الطلاب'],['faq','/faq','الأسئلة الشائعة']]
                 : [['home','/','Home'],['professionals','/professionals','Employees'],['students','/students','Students'],['faq','/faq','FAQ']];
    const T = ar ? { homeAria:'الصفحة الرئيسية لـ DCT Learn', navAria:'التنقل الرئيسي', langAria:'التبديل إلى الإنجليزية', signIn:'تسجيل الدخول', register:'موظف في الدائرة؟ سجّل', forgot:'إعادة تعيين كلمة المرور', skip:'انتقل إلى المحتوى',
        blurb:'DCT Learn هي منصة التعلم التابعة لدائرة الثقافة والسياحة – أبوظبي للموظفين والشركاء والمجتمع الثقافي الأوسع.', explore:'استكشف', account:'الحساب', contact:'تواصل معنا', emp:'الموظفون', stu:'الطلاب', prog:'البرامج', faq:'الأسئلة الشائعة', privacy:'الخصوصية', access:'إمكانية الوصول', copyright:'دائرة الثقافة والسياحة – أبوظبي. جميع الحقوق محفوظة.', powered:'بدعم من' }
               : { homeAria:'DCT Learn home', navAria:'Main', langAria:'Switch to Arabic', signIn:'Sign in', register:'DCT employee? Register', forgot:'Reset password', skip:'Skip to content',
        blurb:'DCT Learn is the learning platform of the Department of Culture and Tourism – Abu Dhabi for employees, partners and the wider cultural community.', explore:'Explore', account:'Account', contact:'Contact', emp:'Employees', stu:'Students', prog:'Programmes', faq:'FAQ', privacy:'Privacy', access:'Accessibility', copyright:'Department of Culture and Tourism – Abu Dhabi. All rights reserved.', powered:'Powered by' };
    T.nav = N.map((x) => ({ href:x[1], l:x[2], cur: x[0] === active ? 'page' : 'false' }));
    return T;
  }
  scrollTo(id){
    return (e) => { if (e && e.preventDefault) e.preventDefault(); const root = e && e.currentTarget && e.currentTarget.closest ? e.currentTarget.closest('.ds') : document; const el = (root || document).querySelector('#' + id); if (!el) return; const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block:'start' }); if (el.focus) { el.focus({ preventScroll:true }); } };
  }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (e, a) => ar ? a : e;
    const t = ar ? { spec:'الصفحة غير موجودة', ey:'خطأ 404', h1:'لم نعثر على هذه الصفحة', sub:'ربما يكون الرابط قديماً أو نُقلت الصفحة إلى مكان آخر. إليك بعض الطرق للعودة إلى مسارك.', badPath:'elevate/sessions-2025', home:'العودة إلى الرئيسية', aria404:'خطأ 404 — الصفحة غير موجودة',
        lEy:'روابط مفيدة', lTitle:'إلى أين تريد الذهاب؟', lSub:'هذه أكثر الصفحات زيارة. وإن كنت تبحث عن برنامج بعينه، فابدأ من الصفحة الرئيسية.', alsoT:'أو انتقل إلى:' }
             : { spec:'Not found', ey:'Error 404', h1:'We couldn’t find that page', sub:'The link may be old, or the page may have moved. Here are a few ways back on track.', badPath:'elevate/sessions-2025', home:'Back to home', aria404:'Error 404 — page not found',
        lEy:'Helpful links', lTitle:'Where would you like to go?', lSub:'These are the pages people visit most. Looking for a programme? Start from the home page.', alsoT:'Or go to:' };
    const links = [
      { k:'k1', n:'01', href:'/', t:L('Home','الصفحة الرئيسية'), b:L('Programmes, featured courses and what’s on across DCT Learn.','البرامج والدورات المختارة وأحدث ما في DCT Learn.'), cta:L('Go to home','اذهب إلى الرئيسية') },
      { k:'k2', n:'02', href:'/login', t:L('Sign in','تسجيل الدخول'), b:L('Pick up your courses, sessions and certificates where you left off.','تابع دوراتك وجلساتك وشهاداتك من حيث توقفت.'), cta:L('Sign in','سجّل الدخول') },
      { k:'k3', n:'03', href:'/faq', t:L('FAQ','الأسئلة الشائعة'), b:L('Answers about accounts, invitations, mentoring and certificates.','إجابات عن الحسابات والدعوات والإرشاد والشهادات.'), cta:L('Read the FAQ','اقرأ الأسئلة الشائعة') }
    ];
    const also = [ ['/professionals', L('DCT employees','موظفو الدائرة')], ['/students', L('Students','الطلاب')], ['/elevate', L('Elevate 2026','إرتقاء 2026')], ['/reset-password', L('Reset password','إعادة تعيين كلمة المرور')] ].map((x) => ({ href:x[0], l:x[1] }));
    return {
      lang, dir: ar?'rtl':'ltr', t, ch: this.chrome(ar, ''), links, also,
      protoCls: this.props.proto ? 'proto' : '',
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      skipMain: this.scrollTo('main')
    };
  }
}
