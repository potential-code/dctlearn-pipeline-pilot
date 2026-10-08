// Ported verbatim from the Claude Design artboard Landing (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, open:0 }; }
  shade(hex, k){ const n = hex.replace('#',''); const c = [0,2,4].map((i) => parseInt(n.substr(i,2),16)); return '#' + c.map((v) => Math.round(v*k).toString(16).padStart(2,'0')).join(''); }
  tint(hex){ const n = hex.replace('#',''); const c = [0,2,4].map((i) => parseInt(n.substr(i,2),16)); return '#' + c.map((v) => Math.round(255 - (255-v)*0.1).toString(16).padStart(2,'0')).join(''); }
  lum(hex){ const n = hex.replace('#',''); const c = [0,2,4].map((i) => parseInt(n.substr(i,2),16)/255).map((v) => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4)); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const accent = this.props.accent || '#CD3151';
    let ink = accent; let guard = 0;
    while ((1.05) / (this.lum(ink) + 0.05) < 4.5 && guard < 12) { ink = this.shade(ink, 0.9); guard += 1; }
    const EN = { sys:'Design system · Landing blocks', specNote:'Structure from the landing references; copy and brand from SEED and SPEC §7. Shown as the Elevate microsite.', site:'Elevate 2026', navAbout:'About', navHow:'How it works', navFaq:'FAQ', navPartners:'Partners', signIn:'Sign in', register:'Register', heroChip:'Mentee registration is open', h1a:'Are you ready to accelerate your growth and career at', h1b:'DCT Abu Dhabi?', sub:'Elevate pairs you with a senior DCT mentor for six months of structured one-to-one sessions, GROW goals and a community of peers who are growing alongside you.', cta1:'Register as a mentee', cta2:'How it works', mentors:'mentors', areas:'mentoring areas', cohort:'Cohort starts 12 Oct', featEyebrow:'About the programme', featTitle:'A mentoring journey that starts with you', featSub:'Four things every participant gets, from the first session to the closing showcase.', faqTitle:'Frequently asked questions', faqSub:'Everything you need to know before you register.', partners:'In partnership with', ftrBlurb:'DCT Learn is the Department of Culture and Tourism – Abu Dhabi’s learning platform for employees, partners and the wider cultural community.', ftrProg:'Programme', ftrAccount:'Account', ftrCourses:'Browse courses', ftrContact:'Contact', privacy:'Privacy', access:'Accessibility', copyright:'Department of Culture and Tourism – Abu Dhabi. All rights reserved.', powered:'Powered by' };
    const AR = { sys:'نظام التصميم · مكوّنات الصفحة الرئيسية', specNote:'البنية من مراجع الصفحات الرئيسية؛ النصوص والعلامة من SEED والمواصفة §7. معروضة كموقع إرتقاء الفرعي.', site:'إرتقاء 2026', navAbout:'عن البرنامج', navHow:'كيف يعمل', navFaq:'الأسئلة الشائعة', navPartners:'الشركاء', signIn:'تسجيل الدخول', register:'التسجيل', heroChip:'التسجيل للمتدربين مفتوح', h1a:'هل أنت مستعد لتسريع نموك ومسيرتك المهنية في', h1b:'دائرة الثقافة والسياحة – أبوظبي؟', sub:'يربطك برنامج إرتقاء بمرشد أول في الدائرة لستة أشهر من الجلسات الفردية المنظمة وأهداف GROW ومجتمع من الزملاء الذين ينمون معك.', cta1:'سجّل كمتدرب', cta2:'كيف يعمل', mentors:'مرشدون', areas:'مجال إرشاد', cohort:'تبدأ الدفعة في 12 أكتوبر', featEyebrow:'عن البرنامج', featTitle:'رحلة إرشاد تبدأ بك', featSub:'أربعة أمور يحصل عليها كل مشارك، من الجلسة الأولى إلى العرض الختامي.', faqTitle:'الأسئلة الشائعة', faqSub:'كل ما تحتاج معرفته قبل التسجيل.', partners:'بالشراكة مع', ftrBlurb:'DCT Learn هي منصة التعلم التابعة لدائرة الثقافة والسياحة – أبوظبي للموظفين والشركاء والمجتمع الثقافي الأوسع.', ftrProg:'البرنامج', ftrAccount:'الحساب', ftrCourses:'تصفح الدورات', ftrContact:'تواصل معنا', privacy:'الخصوصية', access:'إمكانية الوصول', copyright:'دائرة الثقافة والسياحة – أبوظبي. جميع الحقوق محفوظة.', powered:'بدعم من' };
    const t = ar ? AR : EN;
    const I = { users:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', target:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', cal:'M3 6h18v15H3zM16 2v4M8 2v4M3 10h21', award:'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12' };
    const feats = ar ? [
      { title:'مرشد يناسبك', items:['مطابقة بالذكاء الاصطناعي حسب مجالك وأهدافك','مرشدون من قيادات الدائرة','تأكيد خلال 48 ساعة'], cls:'fc-sand', color:'#D63539', d:I.users, delay:'' },
      { title:'أهداف GROW واضحة', items:['هدف، واقع، خيارات، طريق للمضي','سجل مشترك بعد كل جلسة','تقدم مرئي في لوحتك'], cls:'fc-indigo', color:'#3B2F92', d:I.target, delay:'d1' },
      { title:'جلسات منظمة', items:['6 جلسات على مدى 6 أشهر','حجز بتوقيت الخليج عبر Zoom','تذكير قبل 24 ساعة'], cls:'fc-accent', color: ink, d:I.cal, delay:'d2' },
      { title:'شهادة ومجتمع', items:['شهادة إرتقاء عند الإكمال','نقاط وشارات في الإنجازات','عرض ختامي مع الدفعة'], cls:'fc-sand', color:'#15801A', d:I.award, delay:'d3' }
    ] : [
      { title:'A mentor who fits', items:['AI match on your area and goals','Mentors from DCT leadership','Confirmed within 48 hours'], cls:'fc-sand', color:'#D63539', d:I.users, delay:'' },
      { title:'Clear GROW goals', items:['Goal, Reality, Options, Way forward','Shared log after every session','Visible progress on your dashboard'], cls:'fc-indigo', color:'#3B2F92', d:I.target, delay:'d1' },
      { title:'Structured sessions', items:['6 sessions over 6 months','Book in Gulf time, meet on Zoom','Reminder 24 h before'], cls:'fc-accent', color: ink, d:I.cal, delay:'d2' },
      { title:'Certificate and community', items:['Elevate certificate on completion','Points and badges in Achievements','Closing showcase with your cohort'], cls:'fc-sand', color:'#15801A', d:I.award, delay:'d3' }
    ];
    const faqData = ar ? [
      ['من يمكنه التسجيل في إرتقاء؟','موظفو الدائرة المدعوون إلى الموقع الفرعي. سجّل الدخول ببريد العمل ثم أكمل نموذج التسجيل للمتدربين.'],
      ['كيف يتم اختيار مرشدي؟','نقترح ثلاثة مرشدين بناءً على مجالاتك المفضلة ولغتك وأهدافك. يمكنك قبول الاقتراح الأول أو اختيار بديل.'],
      ['هل الجلسات بالعربية أم بالإنجليزية؟','كلاهما. اختر لغتك في نموذج التسجيل وسنطابقك مع مرشد يتحدثها.'],
      ['ماذا يحدث إذا فوّت جلسة؟','يمكنك إعادة الجدولة حتى 24 ساعة قبل الموعد. الجلسات الفائتة بدون إشعار تُحتسب ضمن حد الغياب.'],
      ['هل أحصل على شهادة؟','نعم. بعد إكمال الجلسات الست وسجل GROW الختامي، تصدر شهادة إرتقاء في صفحة الإنجازات.']
    ] : [
      ['Who can register for Elevate?','DCT employees invited to the microsite. Sign in with your work e-mail, then complete the mentee registration form.'],
      ['How is my mentor chosen?','We suggest three mentors based on your preferred areas, language and goals. Accept the first suggestion or pick an alternative.'],
      ['Are sessions in Arabic or English?','Both. Choose your language on the registration form and we match you with a mentor who speaks it.'],
      ['What if I miss a session?','You can reschedule up to 24 hours ahead. Sessions missed without notice count towards your no-show limit.'],
      ['Do I get a certificate?','Yes. After six sessions and a closing GROW log, your Elevate certificate is issued in Achievements.']
    ];
    const faqs = faqData.map((x, i) => ({ q:x[0], a:x[1], cls: i === this.state.open ? 'is-open' : '', exp: i === this.state.open ? 'true' : 'false', pick: () => this.setState({ open: this.state.open === i ? -1 : i }) }));
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      accent: accent, accentInk: ink, accentSoft: this.tint(accent),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      feats: feats, faqs: faqs
    };
  }
}
