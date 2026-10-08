// Ported verbatim from the Claude Design artboard P24-AICoach (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, coach:null, screen:null, msgs:null, typing:false, draft:'', err:false }; }
  componentWillUnmount(){ clearTimeout(this.tr); }
  componentDidMount(){ setTimeout(() => this.scrollEnd(), 60); }
  componentDidUpdate(){ this.scrollEnd(); }
  scrollEnd(){ try { document.querySelectorAll('.chat .lst').forEach(el => { el.scrollTop = el.scrollHeight; }); } catch (e) {} }
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
    const key = this.state.coach || this.props.coach || 'career-coach';
    const scr = this.state.screen || this.props.screen || 'conversation';
    const A = AI[key] || AI['career-coach'];
    const site = 'employees';
    const t = {
      spec: L('AI coach','المدرّب الذكي'), ey: L('DCT Employees · AI coach','موظفو الدائرة · مدرّب ذكي'), all: L('All AI coaches','كل المدربين'), newChat: L('New chat','محادثة جديدة'),
      online: L('Online · English or Arabic','متصل · بالعربية أو الإنجليزية'), embedTag: L('Embedded · Potential.com','مضمّن · Potential.com'), conv: L('Conversation','المحادثة'),
      helloP: L('Ask anything, or start with one of the suggestions below.','اسأل ما تشاء، أو ابدأ بأحد الاقتراحات أدناه.'), suggLbl: L('Suggested prompts','أسئلة مقترحة'),
      msgLbl: L('Your message','رسالتك'), ph: L('Type your question…','اكتب سؤالك…'), send: L('Send','إرسال'), errEmpty: L('Type a question first.','اكتب سؤالاً أولاً.'),
      disc: L('AI can make mistakes — check important details. Conversations aren’t used to train models.','قد يخطئ الذكاء الاصطناعي، فتحقّق من التفاصيل المهمة. لا تُستخدم المحادثات لتدريب النماذج.'),
      helps: L('What it can help with','بماذا يساعدك'), provH: L('Embedded provider','مزوّد مضمّن'),
      provP: L('This coach runs on Potential.com inside DCT Learn. It receives a short-lived token with your user ID and language only. Provider ID:','يعمل هذا المدرّب عبر Potential.com داخل DCT Learn، ويتلقى رمزاً قصير الصلاحية يتضمن معرّف المستخدم واللغة فقط. معرّف المزوّد:'),
      other: L('Other coach','مدرّب آخر'), you: L('You','أنت')
    };
    const sh = this.shell(ar, 'learner', 'hub_ai_coaches', site, [ { label: L('DCT Employees','موظفو الدائرة'), href:'/employees/dashboard' }, { label: L('AI coaches','المدربون الأذكياء'), href:'/employees/ai' }, { label: L(A.name[0], A.name[1]) } ]);
    const R = (en, a) => (ar ? a : en);
    const C = {
      'culture-bot': {
        conv: [
          { me:true, p:[R('What can I see at Qasr Al Hosn this weekend?','ماذا يمكنني أن أشاهد في قصر الحصن نهاية هذا الأسبوع؟')], tm:'09:02' },
          { p:[R('Qasr Al Hosn is Abu Dhabi’s oldest stone building and makes a good half-day visit. This weekend you could:','قصر الحصن أقدم مبنى حجري في أبوظبي، وزيارته مناسبة لنصف يوم. يمكنك في نهاية هذا الأسبوع:')],
            li:[R('Walk through the fort and its exhibition on the story of the city','التجول في الحصن ومعرضه عن قصة المدينة'), R('Watch craftspeople at the House of Artisans — Al Sadu weaving and Talli embroidery','مشاهدة الحرفيين في بيت الحرفيين — نسيج السدو وتطريز التلي'), R('See what’s on at the Cultural Foundation next door','الاطلاع على فعاليات المجمّع الثقافي المجاور')],
            p2:R('Opening hours change by season, so check the visitor page before you go. Would you like ideas for a family visit?','تتغير مواعيد الزيارة حسب الموسم، فتحقق من صفحة الزوار قبل الذهاب. هل تريد أفكاراً لزيارة عائلية؟'), tm:'09:02' },
          { me:true, p:[R('Yes — we’ll have two children with us.','نعم، سيكون معنا طفلان.')], tm:'09:03' },
          { p:[R('Here’s an easy plan of about two hours:','إليك خطة سهلة لنحو ساعتين:')],
            li:[R('Start at the House of Artisans — children can watch the weaving up close','ابدأ ببيت الحرفيين، حيث يشاهد الأطفال النسيج عن قرب'), R('Explore the fort’s courtyards in the late afternoon, when it’s cooler','تجوّلوا في ساحات الحصن عصراً حين يكون الجو ألطف'), R('Finish at the Cultural Foundation’s children’s library or a workshop if one is running','اختتموا بمكتبة الأطفال في المجمّع الثقافي أو بورشة إن وُجدت')],
            p2:R('Tip: the main paths are fine for strollers.','نصيحة: الممرات الرئيسية مناسبة لعربات الأطفال.'), tm:'09:03' } ],
        ans: [
          { p:[R('A relaxed day in Al Ain could look like this:','يمكن أن يكون يومك الهادئ في العين على النحو التالي:')], li:[R('Morning · Al Ain Oasis — walk the shaded falaj paths','صباحاً · واحة العين والتجول في ممرات الأفلاج المظللة'), R('Midday · Al Jahili Fort and its exhibition','ظهراً · قلعة الجاهلي ومعرضها'), R('Afternoon · Qasr Al Muwaiji','عصراً · قصر المويجعي')], p2:R('Al Ain’s cultural sites are on the UNESCO World Heritage List — start early and bring water.','المواقع الثقافية في العين مدرجة على قائمة التراث العالمي لليونسكو، فابدأ مبكراً واصطحب الماء.') },
          { p:[R('Al Sadu is a traditional Bedouin weaving craft, made mostly by women from sheep, camel and goat hair. Its geometric patterns and strong colours reflect desert life.','السدو حرفة نسيج بدوية تقليدية تمارسها النساء غالباً باستخدام صوف الأغنام ووبر الإبل وشعر الماعز، وتعكس زخارفها الهندسية وألوانها القوية حياة الصحراء.')], li:[], p2:R('In 2011 it was inscribed on UNESCO’s list of Intangible Cultural Heritage in Need of Urgent Safeguarding. You can watch it live at the House of Artisans.','أُدرج السدو عام 2011 على قائمة اليونسكو للتراث الثقافي غير المادي الذي يحتاج إلى صون عاجل، ويمكنك مشاهدته مباشرة في بيت الحرفيين.') },
          null ],
        gen: (q) => ({ p:[R('I can help with sites, heritage and events across Abu Dhabi, Al Ain and Al Dhafra.','يمكنني المساعدة في المواقع والتراث والفعاليات في أبوظبي والعين والظفرة.')], li:[], p2:R('Which place or date do you have in mind for “' + q + '”?','ما المكان أو التاريخ الذي تقصده في «' + q + '»؟') }),
        helps: [R('Cultural sites in Abu Dhabi, Al Ain and Al Dhafra','المواقع الثقافية في أبوظبي والعين والظفرة'), R('Emirati heritage, crafts and traditions','التراث والحرف والتقاليد الإماراتية'), R('Planning visits with guests or family','تخطيط الزيارات مع الضيوف أو العائلة'), R('Answers in English or Arabic','إجابات بالعربية أو الإنجليزية')]
      },
      'career-coach': {
        conv: [
          { me:true, p:[R('I’m a Specialist in DCT Culture. How do I move into leading exhibition projects?','أعمل أخصائياً في قطاع الثقافة. كيف أنتقل إلى قيادة مشاريع المعارض؟')], tm:'09:10' },
          { p:[R('That’s a clear goal — and it matches the one in your mentoring plan. Three steps that work well:','هدف واضح، ويتوافق مع هدفك في خطة الإرشاد. إليك ثلاث خطوات فعّالة:')],
            li:[R('Build the knowledge: take Curating an Exhibition: From Concept to Production (C16)','ابنِ المعرفة: التحق بدورة «تنظيم المعارض: من الفكرة إلى التنفيذ» (C16)'), R('Get practice: offer to own one part of an upcoming exhibition, such as the interpretation text','اكتسب الخبرة: تطوّع لتولّي جزء من معرض قادم، مثل نصوص التفسير'), R('Use your mentor: bring a one-page project brief to your session with Dr. Hessa on 12 Oct','استفد من مرشدتك: أحضر ملخص مشروع من صفحة واحدة إلى جلستك مع د. حصة في 12 أكتوبر')],
            p2:R('Shall I turn this into a 6-month plan?','هل أحوّل ذلك إلى خطة لستة أشهر؟'), tm:'09:10' },
          { me:true, p:[R('Yes, please.','نعم، من فضلك.')], tm:'09:11' },
          { p:[R('Here’s a 6-month starting plan:','إليك خطة مبدئية لستة أشهر:')],
            li:[R('Months 1–2 · Finish C16 and shadow the finance lead in one budget review','الشهران 1–2 · أكمل الدورة C16 ورافق مسؤول المالية في مراجعة ميزانية واحدة'), R('Months 3–4 · Draft and refine your project brief with Dr. Hessa','الشهران 3–4 · أعدّ ملخص مشروعك وحسّنه مع د. حصة'), R('Months 5–6 · Pitch the small exhibition to your manager with a budget and timeline','الشهران 5–6 · اعرض فكرة المعرض الصغير على مديرك مع الميزانية والجدول الزمني')],
            p2:R('Add this to your GROW goal so your mentor can follow your progress.','أضف ذلك إلى هدفك في سجل GROW لتتابع مرشدتك تقدّمك.'), tm:'09:11' } ],
        ans: [
          { p:[R('For a project lead path at DCT, these courses fit well:','لمسار قائد المشاريع في الدائرة، تناسبك هذه الدورات:')], li:[R('Curating an Exhibition: From Concept to Production (C16) · 70 min','تنظيم المعارض: من الفكرة إلى التنفيذ (C16) · 70 دقيقة'), R('The World of Curation (C06) · 55 min','عالم التقييم الفني (C06) · 55 دقيقة'), R('Data Protection for People and Performance (C08) · 30 min — useful once you lead a team','حماية البيانات (C08) · 30 دقيقة، مفيدة عند قيادة فريق')], p2:R('All three give a certificate you can add to your profile.','تمنحك الدورات الثلاث شهادة يمكنك إضافتها إلى ملفك.') },
          { p:[R('Your session 2 with Dr. Hessa is on Monday 12 Oct at 11:00 Gulf. Bring:','جلستك الثانية مع د. حصة يوم الإثنين 12 أكتوبر الساعة 11:00 بتوقيت الخليج. أحضر معك:')], li:[R('Your one-page project brief — the way forward from session 1','ملخص مشروعك من صفحة واحدة، وهو الخطوة التالية من الجلسة 1'), R('One question about budgeting, the gap you named last time','سؤالاً واحداً عن الميزانية، وهي الفجوة التي حددتها سابقاً'), R('A short update on C16','تحديثاً موجزاً عن الدورة C16')], p2:R('Open the session room 10 minutes early to test your camera.','افتح غرفة الجلسة قبل عشر دقائق لاختبار الكاميرا.') },
          null ],
        gen: (q) => ({ p:[R('Good question. To give you a useful answer about “' + q + '”, tell me the role you’re aiming for and your timeline.','سؤال جيد. لأقدّم إجابة مفيدة عن «' + q + '»، أخبرني بالدور الذي تطمح إليه والإطار الزمني.')], li:[], p2:R('I’ll suggest courses, practice and a next step you can take this week.','سأقترح دورات وتطبيقاً عملياً وخطوة يمكنك اتخاذها هذا الأسبوع.') }),
        helps: [R('Planning your next role at DCT','التخطيط لدورك القادم في الدائرة'), R('Choosing courses for the skills you need','اختيار الدورات للمهارات التي تحتاجها'), R('Preparing for mentoring sessions and reviews','التحضير لجلسات الإرشاد والتقييمات'), R('Turning goals into a 6-month plan','تحويل الأهداف إلى خطة لستة أشهر')]
      }
    };
    const D = C[A.key] || C['career-coach'];
    D.ans[2] = D.conv[3];
    const initial = scr === 'empty' ? [] : (scr === 'typing' ? D.conv.slice(0, 3) : D.conv);
    const list = this.state.msgs || initial;
    const typing = this.state.msgs ? this.state.typing : (scr === 'typing' || this.state.typing);
    const name = L(A.name[0], A.name[1]);
    const msgs = list.map(m => ({ cls: m.me ? 'me' : '', who: m.me ? t.you : name, p: m.p, li: m.li || [], hasLi: !!(m.li && m.li.length), p2: m.p2 || '', tm: m.tm }));
    const ask = (q, ans) => {
      const now = '09:' + String(12 + Math.floor(list.length / 2)).padStart(2, '0');
      const next = list.concat([{ me:true, p:[q], tm: now }]);
      this.setState({ msgs: next, typing:true, draft:'', err:false });
      clearTimeout(this.tr); this.tr = setTimeout(() => this.setState({ msgs: next.concat([{ ...ans, tm: now }]), typing:false }), 1500);
    };
    const send = (e) => { if (e && e.preventDefault) e.preventDefault(); const q = (this.state.draft || '').trim(); if (!q) { this.setState({ err:true }); return; } ask(q, D.gen(q)); };
    const sugg = A.asks.map((x, i) => ({ l: L(x[0], x[1]), ask: () => ask(L(x[0], x[1]), D.ans[i]) }));
    const OK = A.key === 'culture-bot' ? AI['career-coach'] : AI['culture-bot'];
    const go = (v) => { clearTimeout(this.tr); this.setState({ screen:v, msgs:null, typing:false, draft:'', err:false }); };
    return { ...base, t, sh, msgs, sugg, typing,
      specName: t.spec + ' · ' + A.key, route: '/employees/ai/coach/' + A.key,
      b: { name, desc: L(A.desc[0], A.desc[1]), c: A.c, provider: A.provider },
      helloH: L('Hi Saeed, how can I help?','مرحباً سعيد، كيف أساعدك؟'), isEmpty: msgs.length === 0 && !typing,
      typingLbl: L(name + ' is typing…', name + ' يكتب…'), helps: D.helps,
      o: { name: L(OK.name[0], OK.name[1]), desc: L(OK.desc[0], OK.desc[1]), c: OK.c, href:'/employees/ai/coach/' + OK.key },
      backHref:'/employees/ai', newChat: () => { clearTimeout(this.tr); this.setState({ msgs:[], typing:false, draft:'', err:false }); },
      draft: this.state.draft, onDraft: (e) => this.setState({ draft: e.target.value, err:false }), send,
      onKey: (e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); },
      err: this.state.err, errCls: this.state.err ? 'is-error' : '', errA: this.state.err ? 'true' : 'false',
      segs: [ this.seg('Coach', A.key, [['culture-bot','Culture Bot'],['career-coach','Career Coach']], v => { clearTimeout(this.tr); this.setState({ coach:v, msgs:null, typing:false }); }),
              this.seg('State', scr, [['conversation','Conversation'],['empty','New chat'],['typing','Typing']], go) ]
    };
  }
}
