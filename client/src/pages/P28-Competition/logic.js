// client: hand-edited (signed-in user instead of the seed's Ahmed/Sara; round status follows the screen)
// Ported verbatim from the Claude Design artboard P28-Competition (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'
import { readSession } from '@/session/SessionProvider'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, sub:null, dlg:null, ack:false, ackErr:false, elErr:false, busy:false }; }
  componentWillUnmount(){ clearTimeout(this.tb); }
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
    /* ---- seed: competition (SEED §6) ---- */
    const RUBRIC = [ { k:'name', w:15, t:['Name / tagline captures the essence','الاسم والشعار يعبّران عن الجوهر'] }, { k:'desc', w:25, t:['Short description communicates the key message','الوصف المختصر يوصل الرسالة الأساسية'] },
                     { k:'crea', w:20, t:['Creativity and originality','الإبداع والأصالة'] }, { k:'grab', w:40, t:['Will it grab attention and drive participation','قدرته على جذب الانتباه وتحفيز المشاركة'] } ];
    /* the signed-in learner (name + initials); the rest of the user card comes from the shell */
    const acct = readSession();
    const ZU_USER = () => acct ? { userName: L(acct.name.en, acct.name.ar), initials: acct.initials } : {};
    const firstName = acct ? acct.name.en.replace(/^Dr\.\s+/, '').split(' ')[0] : 'Learner';
    const scr = this.state.screen || this.props.screen || 'draft';
    const sara = scr === 'noteligible';
    const submitted = this.state.sub !== null ? this.state.sub : scr === 'submitted';
    const dlg = this.state.dlg !== null ? this.state.dlg : scr === 'confirm';
    const t = {
      spec: L('Competition','المسابقة'), ey: L('ZU 24-Hour Challenge · Round R1','تحدي جامعة زايد · الجولة R1'), h1: L('24-Hour Challenge 2026','تحدي 24 ساعة 2026'),
      sub: L('Complete the course, then submit your action plan — a campaign pitch that brings young people closer to cultural heritage.','أكمل الدورة ثم قدّم خطة العمل: فكرة حملة تقرّب الشباب من التراث الثقافي.'), dash: L('Competition dashboard','لوحة المسابقة'),
      round: L('Current round','الجولة الحالية'), roundName: L('24-Hour Challenge 2026','تحدي 24 ساعة 2026'), roundP: L('Course C13 · 24 Hour Challenge – Introduction to Cultural Heritage. Your action plan in the last unit is your entry.','الدورة C13 · تحدي 24 ساعة – مقدمة في التراث الثقافي. خطة العمل في الوحدة الأخيرة هي مشاركتك.'),
      status: L('Status','الحالة'), judging: L('Judging','قيد التحكيم'), opened: L('Opened','بدأت'), openedV: L('15 Sep 2026','15 سبتمبر 2026'), closes: L('Closes','تُغلق'), closesV: L('Tue 20 Oct 2026','الثلاثاء 20 أكتوبر 2026'), left: L('Time left','الوقت المتبقي'), leftV: L('14 days','14 يوماً'),
      elTitle: L('Eligibility','الأهلية'), rule: L('Rule:','الشرط:'), ruleP: L('complete at least 80 % of the competition course (C13) before you submit.','إكمال 80% على الأقل من دورة المسابقة (C13) قبل التقديم.'),
      c13: L('C13 · 24 Hour Challenge – Introduction to Cultural Heritage','C13 · تحدي 24 ساعة – مقدمة في التراث الثقافي'), min80: L('80 % needed','المطلوب 80%'),
      apTitle: L('Your action plan','خطة العمل'), edit: L('Edit in course','التعديل في الدورة'), submit: L('Submit entry','تقديم المشاركة'),
      neH: L('You can’t submit yet','لا يمكنك التقديم بعد'), neP: L('Reach 80 % in C13 first — you’re at 75 %. Finish unit 4 to unlock submission.','عليك بلوغ 80% في الدورة C13 أولاً، ونسبتك الآن 75%. أكمل الوحدة 4 لفتح التقديم.'),
      rubric: L('How entries are scored','معايير التقييم'), of100: L('Total 100','المجموع 100'), how: L('Judging','التحكيم'),
      dEy: L('Submit entry','تقديم المشاركة'), dH: L('Submit your action plan?','هل تريد تقديم خطة العمل؟'), dP: L('Your four answers will be sent to the judges of round R1 exactly as they are now.','ستُرسل إجاباتك الأربع إلى محكّمي الجولة R1 كما هي الآن.'),
      oneWay: L('Submitting is final','التقديم نهائي'), oneWayP: L('You can’t edit or withdraw your action plan after you submit.','لا يمكنك تعديل خطة العمل أو سحبها بعد التقديم.'),
      ack: L('I understand that I can’t change my entry after submitting.','أفهم أنه لا يمكنني تغيير مشاركتي بعد التقديم.'), ackErr: L('Tick the box to confirm.','ضع علامة في المربع للتأكيد.'),
      notYet: L('Not yet','ليس الآن'), submitFinal: L('Submit final entry','تقديم المشاركة النهائية'), close: L('Close','إغلاق')
    };
    const sh = this.shell(ar, 'learner', 'competition', 'zu', [ { label: L('ZU 24-Hour Challenge','تحدي جامعة زايد'), href:'/zu/dashboard' }, { label: t.spec } ]);
    Object.assign(sh, ZU_USER());
    const pctN = sara ? 75 : 100;
    const KI = { book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M9 7h7M9 11h5', clip:'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6', star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z' };
    /* round status chip: the round is open while the entry is a draft; once submitted the entry is with the judges */
    const roundStatus = submitted ? L('Submitted · judging','مقدّمة · قيد التحكيم') : sara ? L('Open · not eligible yet','مفتوحة · غير مؤهل بعد') : L('Open · draft','مفتوحة · مسودة');
    const roundStatusCls = submitted ? 'ok' : sara ? 'warn' : 'yel';
    const apStatus = submitted ? L('Submitted','مقدّمة') : L('Draft','مسودة');
    const kpis = [ { l:L('C13 progress','تقدّم C13'), v: pctN + '', u:'%', n: sara ? L('3 of 4 units','3 من 4 وحدات') : L('4 of 4 units','4 من 4 وحدات'), cls:'k-ink', d:KI.book },
                   { l:L('Action plan','خطة العمل'), v: apStatus, u:'', n: this.state.sub ? L('6 Oct 2026 · locked','6 أكتوبر 2026 · مقفلة') : submitted ? L('30 Sep 2026 · locked','30 سبتمبر 2026 · مقفلة') : L('Saved as you type','تُحفظ أثناء الكتابة'), cls: submitted ? 'k-rasp' : 'k-yel', d:KI.clip },
                   { l:L('Points','النقاط'), v: sara ? '90' : '130', u: L('pts','نقطة'), n: L('ZU 24-Hour Challenge','تحدي جامعة زايد'), cls:'k-red', d:KI.star } ];
    const A = sara ? [ L('Heritage Hunters','صيّادو التراث'), L('A weekend scavenger hunt across Al Ain’s oases where teams unlock stories at each falaj.','مسابقة بحث في عطلة نهاية الأسبوع عبر واحات العين، تكشف فيها الفرق قصة عند كل فلج.'), '', '' ]
                     : [ L('Sadu Stories — every thread tells a tale','حكايات السدو — لكل خيط حكاية'), L('Students film 60-second stories with Emirati weavers and share them as a campus series.','يصوّر الطلاب قصصاً مدتها 60 ثانية مع النسّاجات الإماراتيات وينشرونها سلسلةً في الحرم الجامعي.'),
                         L('Each video ends with a live weaving pattern that viewers can remix into their own design.','ينتهي كل فيديو بنقشة نسيج يمكن للمشاهدين تحويلها إلى تصميمهم الخاص.'), L('A weekly campus vote and a pop-up stall where the top designs are woven for real.','تصويت أسبوعي في الحرم الجامعي وركن مؤقت تُنسج فيه أفضل التصاميم فعلياً.') ];
    const answers = RUBRIC.map((r, i) => ({ n: String(i + 1), q: L(r.t[0], r.t[1]), v: A[i] || L('Not answered yet','لم تتم الإجابة بعد'), cls: A[i] ? '' : 'em' }));
    const doSubmit = () => {
      if (!this.state.ack) { this.setState({ ackErr:true }); return; }
      this.setState({ busy:true }); clearTimeout(this.tb); this.tb = setTimeout(() => this.setState({ busy:false, dlg:false, sub:true, ack:false }), 900);
    };
    const go = (v) => { clearTimeout(this.tb); this.setState({ screen:v, sub:null, dlg:null, ack:false, ackErr:false, elErr:false, busy:false }); };
    return { ...base, t, sh, kpis, answers, roundStatus, roundStatusCls,
      specName: t.spec + ' · ' + firstName, route: '/zu/competition',
      pctN: String(pctN), pct: pctN + '%', units: sara ? L('3 of 4 units','3 من 4 وحدات') : L('4 of 4 units','4 من 4 وحدات'), barC: sara ? '#E0A800' : '#15801A',
      courseCta: sara ? L('Continue course','تابع الدورة') : L('Review course','راجع الدورة'),
      elCls: sara ? 'no' : 'ok', elIcon: sara ? 'M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' : 'M20 6 9 17l-5-5',
      elH: sara ? L('Not eligible yet · 75 %','غير مؤهلة بعد · 75%') : L('Eligible · 100 %','مؤهل · 100%'),
      elP: sara ? L('One more unit to go. Finish unit 4 (the action plan) to reach 100 %.','بقيت وحدة واحدة. أكملي الوحدة 4 (خطة العمل) للوصول إلى 100%.') : L('You’ve completed every unit of C13.','أكملت جميع وحدات الدورة C13.'),
      apTag: apStatus, apTagCls: submitted ? 'ok' : 'warn', canEdit: !submitted, isSub: submitted,
      subNote: this.state.sub ? L('Submitted just now · Tue 6 Oct 2026, 13:00 Gulf. Your entry is locked and with the judges.','قُدّمت الآن · الثلاثاء 6 أكتوبر 2026، 13:00 بتوقيت الخليج. مشاركتك مقفلة ولدى المحكّمين.') : submitted ? L('Submitted 30 Sep 2026 · 14:20 Gulf. Your entry is locked and with the judges.','قُدّمت في 30 سبتمبر 2026 · 14:20 بتوقيت الخليج. مشاركتك مقفلة ولدى المحكّمين.') : L('Answers are saved as you type in unit 4. Submitting is one-way.','تُحفظ الإجابات أثناء الكتابة في الوحدة 4، والتقديم نهائي.'),
      trySubmit: () => { if (sara) this.setState({ elErr:true }); else this.setState({ dlg:true, ackErr:false }); }, elErr: this.state.elErr,
      rubric: RUBRIC.map(r => ({ t: L(r.t[0], r.t[1]), w: String(r.w), p: (r.w * 2.5) + '%' })),
      how: [ L('Two judges score each entry against the rubric.','يقيّم محكّمان كل مشاركة وفق المعايير.'), L('Entries are judged while the round is open.','تُحكَّم المشاركات أثناء فتح الجولة.'), L('Your score and rank appear when the round closes.','تظهر درجتك وترتيبك عند إغلاق الجولة.') ],
      dlg, closeDlg: () => this.setState({ dlg:false }), stop: (e) => e.stopPropagation(), ack: this.state.ack, togAck: () => this.setState({ ack: !this.state.ack, ackErr:false }),
      ackErr: this.state.ackErr, ackErrA: this.state.ackErr ? 'true' : 'false', doSubmit, busyCls: this.state.busy ? 'is-loading' : '',
      segs: [ this.seg('State', scr, [['noteligible','Not eligible'],['draft','Draft'],['confirm','Confirm dialog'],['submitted','Submitted']], go) ]
    };
  }
}
