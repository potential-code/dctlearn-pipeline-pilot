// Ported verbatim from the Claude Design artboard P23-AICoaches (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, site:null }; }

  /* spec-bar segment helper (mockup chrome only) */
  seg(label, cur, opts, fn){ return { label, btns: opts.map(o => ({ label:o[1], cls: o[0] === cur ? 'is-on' : '', pick: () => fn(o[0]) })) }; }

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
    const fmt = (n) => Number(n).toLocaleString('en-US');
    const base = { lang, dir: ar ? 'rtl' : 'ltr', protoCls: this.props.proto ? 'proto' : '', enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }) };
    /* ---- seed: AI embeds (SEED §9) ---- */
    const AI = {
      'culture-bot':{ key:'culture-bot', ini:'CB', name:['Abu Dhabi Culture Bot','روبوت ثقافة أبوظبي'], kind:'chat', provider:'bot_culture_demo', c:'#A39089', sites:['employees'], login:true,
        desc:['Ask about Abu Dhabi’s cultural sites, heritage and what’s on this month.','اسأل عن المواقع الثقافية في أبوظبي وتراثها وفعاليات هذا الشهر.'],
        asks:[['Plan a culture day in Al Ain','خطّط ليوم ثقافي في العين'],['What is Al Sadu weaving?','ما هو نسيج السدو؟'],['Ideas for visiting Qasr Al Hosn with family','أفكار لزيارة قصر الحصن مع العائلة']] },
      'career-coach':{ key:'career-coach', ini:'CC', name:['Career Coach','مدرّب المسار المهني'], kind:'chat', provider:'bot_career_demo', c:'#CE3F3F', sites:['employees','elevate'], login:true,
        desc:['Plan your next role at DCT and the skills and courses to get there.','خطّط لدورك القادم في الدائرة والمهارات والدورات التي توصلك إليه.'],
        asks:[['Which courses fit a project lead role?','ما الدورات المناسبة لدور قائد مشروع؟'],['Help me prepare for my mentoring session','ساعدني في التحضير لجلسة الإرشاد'],['Draft my 6-month development plan','اكتب خطة تطويري لستة أشهر']] },
      'lesson-planner':{ key:'lesson-planner', ini:'LP', name:['AI Lesson Planner','مخطِّط الدروس الذكي'], kind:'iframe', provider:'tool_lesson_demo', c:'#EE3E43', sites:['employees'], login:true,
        desc:['Turn a topic into a timed lesson plan with objectives, activities and a check for understanding.','حوّل أي موضوع إلى خطة درس موقّتة بأهداف وأنشطة وتقييم للفهم.'], asks:[] },
      'voice-hiring':{ key:'voice-hiring', ini:'VH', name:['Al Ain Museum Voice Hiring Agent','وكيل التوظيف الصوتي لمتحف العين'], kind:'voice', provider:'assistant_hiring_demo', c:'#EE3E43', sites:[], login:false,
        desc:['A public pre-screening form and short voice interview for Al Ain Museum roles.','نموذج فرز مبدئي عام ومقابلة صوتية قصيرة لوظائف متحف العين.'], asks:[] }
    };
    const SITE_NAME = { employees:['DCT Employees','موظفو الدائرة'], elevate:['Elevate 2026','إرتقاء 2026'] };
    const site = this.state.site || this.props.site || 'employees';
    const t = {
      spec: L('AI coaches and tools','المدربون والأدوات الذكية'), ey: L(SITE_NAME[site][0] + ' · AI', SITE_NAME[site][1] + ' · الذكاء الاصطناعي'), h1: L('AI coaches and tools','المدربون والأدوات الذكية'),
      sub: L('Chat with a coach or use a tool — in English or Arabic, any time.','تحدّث مع مدرّب أو استخدم أداة، بالعربية أو الإنجليزية وفي أي وقت.'),
      bEy: L('Powered by Potential.com','بدعم من Potential.com'), bH: L('Ask, plan and practise with AI','اسأل وخطّط وتدرّب مع الذكاء الاصطناعي'),
      bP: L('Coaches answer questions about culture and careers. Tools turn your ideas into ready-to-use plans. Everything opens inside DCT Learn — no extra sign-in.','يجيب المدربون عن أسئلة الثقافة والمسار المهني، وتحوّل الأدوات أفكارك إلى خطط جاهزة. كل شيء يعمل داخل DCT Learn دون تسجيل دخول إضافي.'),
      coaches: L('AI coaches','المدربون الأذكياء'), chatTag: L('Chat coach','مدرّب محادثة'), tryAsking: L('Try asking','جرّب أن تسأل'), by: L('Embedded from Potential.com','مضمّن من Potential.com'), start: L('Start a chat','ابدأ المحادثة'),
      toolsEy: L('Create with AI','أنشئ بالذكاء الاصطناعي'), tools: L('AI tools','أدوات الذكاء الاصطناعي'), lpMeta: L('Form → lesson plan · about 1 minute','نموذج ← خطة درس · نحو دقيقة'), embedded: L('Embedded view','العرض المضمّن'), open: L('Open planner','افتح المخطِّط'),
      noToolsH: L('No AI tools in this programme yet','لا توجد أدوات ذكاء اصطناعي في هذا البرنامج بعد'), noToolsP: L('Your programme team can add tools from the admin console.','يمكن لفريق البرنامج إضافة الأدوات من لوحة الإدارة.'),
      public: L('Public page · no sign-in','صفحة عامة · دون تسجيل دخول'), viewPublic: L('View public page','عرض الصفحة العامة'),
      pvTitle: L('Your data and AI','بياناتك والذكاء الاصطناعي')
    };
    const sh = this.shell(ar, 'learner', site === 'employees' ? 'hub_ai_coaches' : '', site, [ { label: L(SITE_NAME[site][0], SITE_NAME[site][1]), href:'/' + site + '/dashboard' }, { label: t.h1 } ]);
    const coaches = ['culture-bot','career-coach'].map(k => AI[k]).filter(a => a.sites.indexOf(site) >= 0).map(a => ({ hid:'c-' + a.key, c:a.c, name:L(a.name[0], a.name[1]), desc:L(a.desc[0], a.desc[1]), asks: a.asks.map(x => L(x[0], x[1])), href:'/' + site + '/ai/coach/' + a.key }));
    const LP = AI['lesson-planner']; const VH = AI['voice-hiring'];
    const priv = [ L('The coach gets a short-lived token with your user ID and language only — never your e-mail or phone.','يحصل المدرّب على رمز قصير الصلاحية يتضمن معرّف المستخدم واللغة فقط، دون البريد الإلكتروني أو الهاتف.'),
      L('Conversations are not used to train AI models.','لا تُستخدم المحادثات لتدريب نماذج الذكاء الاصطناعي.'),
      L('AI can make mistakes — check important facts with your manager or the source.','قد يخطئ الذكاء الاصطناعي، فتحقّق من المعلومات المهمة مع مديرك أو المصدر.') ];
    return { ...base, t, sh, coaches, priv,
      specName: t.spec, route: '/' + site + '/ai',
      coachCount: L(coaches.length + (coaches.length === 1 ? ' coach' : ' coaches'), coaches.length === 1 ? 'مدرّب واحد' : 'مدرّبان'),
      hasTools: LP.sites.indexOf(site) >= 0, noTools: LP.sites.indexOf(site) < 0,
      lp: { name:L(LP.name[0], LP.name[1]), desc:L(LP.desc[0], LP.desc[1]) }, vh: { name:L(VH.name[0], VH.name[1]), desc:L(VH.desc[0], VH.desc[1]) },
      lpHref:'/' + site + '/ai/lesson-planner', lpEmbed:'/' + site + '/ai/tool/lesson-planner',
      segs: [ this.seg('Microsite', site, [['employees','DCT Employees'],['elevate','Elevate']], v => this.setState({ site:v })) ]
    };
  }
}
