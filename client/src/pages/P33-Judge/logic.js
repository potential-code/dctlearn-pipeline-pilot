// Ported verbatim from the Claude Design artboard P33-Judge (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, round:null }; }

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
    const round = this.state.round || this.props.round || 'judging';
    const closed = round === 'closed';
    const t = ar ? {
      spec:'لوحة المحكّم', ey:'بوابة المحكّمين · تحدي جامعة زايد', h1:'لوحة المحكّم', sub:'الجولات المسندة إليك، وما قيّمته، وما ينتظر تقييمك.', goApp:'الانتقال إلى المتقدمين',
      rdTitle:'الجولات المسندة إليك', rdSub:'جولة واحدة', site:'تحدي جامعة زايد', rdName:'تحدي الـ24 ساعة 2026', deadline:'آخر موعد: الثلاثاء 20 أكتوبر 2026 · 23:59 بتوقيت الخليج', course:'دورة C13 · تحدي 24 ساعة', prog:'تم تقييم 1 من 2',
      acTitle:'قائمة التقييم', all:'كل المتقدمين',
      rbTitle:'معايير التقييم', rbSum:'المجموع 100%', fT:'المجموع المرجّح = Σ (الدرجة ÷ 10 × الوزن)', fP:'مثال: 8، 8، 6، 7 ← 12.0 + 20.0 + 12.0 + 28.0 = 72.0 من 100',
      gdTitle:'إرشادات التحكيم', guide:['اقرأ الإجابات الثلاث وملف العرض كاملاً قبل وضع الدرجات.','قيّم كل معيار من 1 إلى 10 بشكل مستقل؛ المجموع يُحسب تلقائياً.','اكتب ملاحظة قصيرة ومحددة — يراها المشرف الفرعي وتساعد في المراجعة.','يمكنك تعديل درجاتك حتى تُغلق الجولة؛ بعدها تُقفل.'],
      privacy:'يظهر المتقدمون بالاسم والموقع المصغّر فقط. لا تحاول التعرّف عليهم أو التواصل معهم خارج المنصة.',
      closedT:'أُغلقت الجولة', closedP:'أُقفلت الدرجات وأصبحت النتائج والترتيب مرئية للمتعلمين. يمكنك عرض تقييماتك فقط.'
    } : {
      spec:'Judge dashboard', ey:'Judge portal · ZU 24-Hour Challenge', h1:'Judge dashboard', sub:'Rounds assigned to you, what you’ve scored and what’s still waiting.', goApp:'Go to applicants',
      rdTitle:'Rounds assigned to you', rdSub:'1 round', site:'ZU 24-Hour Challenge', rdName:'24-Hour Challenge 2026', deadline:'Deadline: Tue 20 Oct 2026 · 23:59 Gulf', course:'Course C13 · 24 Hour Challenge', prog:'1 of 2 graded',
      acTitle:'Your queue', all:'All applicants',
      rbTitle:'Rubric', rbSum:'Totals 100%', fT:'Weighted total = Σ (score ÷ 10 × weight)', fP:'Example: 8, 8, 6, 7 → 12.0 + 20.0 + 12.0 + 28.0 = 72.0 out of 100',
      gdTitle:'Judging guidance', guide:['Read all three answers and the full pitch PDF before you score.','Score each criterion from 1 to 10 on its own; the total is calculated for you.','Add a short, specific note — the sub admin sees it and it helps in review.','You can change your scores until the round closes; then they lock.'],
      privacy:'Applicants are shown by name and microsite only. Don’t try to identify or contact them outside the platform.',
      closedT:'This round is closed', closedP:'Scores are locked and results and ranks are now visible to learners. You can view your scores only.'
    };
    const sh = this.shell(ar, 'judge', 'dashboard', null, [ { label: L('Judge portal','بوابة المحكّمين'), href:'/judge' }, { label: L('Dashboard','لوحة التحكم') } ]);
    if (closed) sh.nav = sh.nav.map(n => ({ ...n, cnt:false }));
    const KI = { clip:'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', hour:'M6 2h12M6 22h12M7 2v4l5 6-5 6v4M17 2v4l-5 6 5 6v4', flag:'M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1' };
    const kpis = [
      { l:L('Assigned','المسندة'), v:'2', u:'', n:L('in 1 round','في جولة واحدة'), cls:'k-ink', d:KI.clip },
      { l:L('Graded','المقيّمة'), v:'1', u:'', n:L('Ahmed Khan · 72.0','أحمد خان · 72.0'), cls:'k-rasp', d:KI.done },
      { l:L('Pending','بانتظار التقييم'), v: closed ? '0' : '1', u:'', n: closed ? L('round closed','أُغلقت الجولة') : L('Sara Haddad','سارة حداد'), cls:'k-yel', d:KI.hour },
      { l:L('Days left','الأيام المتبقية'), v: closed ? '0' : '14', u: closed ? '' : L('days','يوماً'), n:L('deadline 20 Oct 2026','آخر موعد 20 أكتوبر 2026'), cls:'k-red', d:KI.flag }
    ];
    const w = closed ? { ey:L('Round closed','أُغلقت الجولة'), h:L('Thank you, Noura','شكراً لكِ، نورة'), p:L('Judging for the 24-Hour Challenge 2026 has closed. Your scores have been sent to the ZU programme team.','أُغلق التحكيم في تحدي الـ24 ساعة 2026، وأُرسلت درجاتك إلى فريق برنامج جامعة زايد.'), cta:L('View your scores','عرض درجاتك'), prog:L('1 of 2 graded','تم تقييم 1 من 2') }
      : { ey:L('Judging is open','التحكيم مفتوح'), h:L('Good morning, Noura','صباح الخير، نورة'), p:L('One submission is waiting for your score. Judging closes Tuesday 20 Oct 2026 at 23:59 Gulf time.','هناك مشاركة واحدة بانتظار تقييمك. يُغلق التحكيم الثلاثاء 20 أكتوبر 2026 الساعة 23:59 بتوقيت الخليج.'), cta:L('Score Sara Haddad','قيّمي سارة حداد'), prog:L('Your progress · 1 of 2 graded','تقدّمك · تم تقييم 1 من 2') };
    const queue = [
      { name:L('Sara Haddad','سارة حداد'), ini:'SH', c:'#3B2F92', sub:L('ZU 24-Hour Challenge · “Threads of Sadu”','تحدي جامعة زايد · «خيوط السدو»'), tag: closed ? L('Not scored','لم تُقيَّم') : L('Pending','بانتظار التقييم'), tagCls: closed ? 'mut' : 'warn', scored:false, score:'', cta: closed ? L('View','عرض') : L('Grade','تقييم'), btnCls: closed ? 'btn-line' : 'btn-primary' },
      { name:L('Ahmed Khan','أحمد خان'), ini:'AK', c:'#E35E3C', sub:L('ZU 24-Hour Challenge · submitted Wed 30 Sep · scored Thu 1 Oct','تحدي جامعة زايد · قُدّمت الأربعاء 30 سبتمبر · قُيّمت الخميس 1 أكتوبر'), tag:L('Graded','مقيّمة'), tagCls:'ok', scored:true, score:'72.0', cta: closed ? L('View','عرض') : L('Edit score','تعديل الدرجة'), btnCls:'btn-line' }
    ];
    const crit = [ [L('Name/tagline captures the essence','الاسم/الشعار يعبّر عن الجوهر'),15,'#1D1650'], [L('Short description communicates the key message','الوصف المختصر يوصل الرسالة الأساسية'),25,'#CD3151'], [L('Creativity and originality','الإبداع والأصالة'),20,'#E35E3C'], [L('Will it grab attention and drive participation','هل سيجذب الانتباه ويحفّز المشاركة'),40,'#D63539'] ]
      .map(x => ({ q:x[0], w:x[1] + '%', pct:(x[1] / 40 * 100) + '%', c:x[2] }));
    return {
      lang, dir: ar ? 'rtl' : 'ltr', t, sh, kpis, w, queue, crit, closed,
      rd: { tag: closed ? L('Closed','مغلقة') : L('Judging','قيد التحكيم'), tagCls: closed ? 'mut' : 'yel' },
      rSeg: [['judging','Judging'],['closed','Closed']].map(x => ({ label:x[1], cls: round === x[0] ? 'is-on' : '', pick: () => this.setState({ round:x[0] }) })),
      protoCls: this.props.proto ? 'proto' : '',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
