// client: hand-edited (signed-in user instead of the seed's Ahmed/Sara; round status follows the screen)
// Ported verbatim from the Claude Design artboard P29-CompetitionDashboard (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'
import { readSession } from '@/session/SessionProvider'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, left:1249140 }; }
  componentDidMount(){ this.iv = setInterval(() => this.setState({ left: Math.max(0, this.state.left - 1) }), 1000); }
  componentWillUnmount(){ clearInterval(this.iv); }
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
    const scr = this.state.screen || this.props.screen || 'judging';
    const closed = scr === 'closed';
    const t = {
      spec: L('Competition dashboard','لوحة المسابقة'), ey: L('ZU 24-Hour Challenge · Round R1','تحدي جامعة زايد · الجولة R1'), h1: L('Competition dashboard','لوحة المسابقة'),
      round: L('Round details','تفاصيل الجولة'), ach: L('Achievements','الإنجازات'),
      points: L('Points','النقاط'), pts: L('pts','نقطة'), ptsN: L('ZU 24-Hour Challenge','تحدي جامعة زايد'), units: L('Units completed','الوحدات المكتملة'), unitsN: L('C13 · 100 %','C13 · 100%'),
      dd: L('days','يوم'), hh: L('hrs','ساعة'), mm: L('min','دقيقة'), ss: L('sec','ثانية'), closedV: L('Closed','أُغلقت'), closesOn: L('Closes Tue 20 Oct · 23:59 Gulf','تُغلق الثلاثاء 20 أكتوبر · 23:59 بتوقيت الخليج'),
      status: L('Your entry','مشاركتك'), score: L('Score and rank','الدرجة والترتيب'),
      lockH: L('Your score is on its way','درجتك في الطريق'), lockP: L('Judges are scoring entries now. Your score out of 100 and your rank appear here when the round closes on 20 Oct.','يقيّم المحكّمون المشاركات الآن، وستظهر هنا درجتك من 100 وترتيبك عند إغلاق الجولة في 20 أكتوبر.'),
      lockCap: L('Scores stay hidden until the round is closed, so every entry is judged the same way.','تبقى الدرجات مخفية حتى إغلاق الجولة لضمان تقييم جميع المشاركات بالطريقة نفسها.'),
      scoreAria: L('Score 72 out of 100','الدرجة 72 من 100'), outOf: L('out of 100','من 100'), rank: L('Rank #1','الترتيب الأول'), rankN: L('of 1 scored entry in round R1','من بين مشاركة واحدة مقيّمة في الجولة R1'),
      fbH: L('Judge feedback · Noura Al Kaabi','ملاحظات المحكّمة · نورة الكعبي'), fb: L('A strong, original idea with a clear audience. Make the call to action more specific to lift participation.','فكرة قوية وأصيلة وجمهورها واضح. اجعل الدعوة إلى المشاركة أكثر تحديداً لرفع نسبة التفاعل.'),
      tl: L('Round timeline','مراحل الجولة')
    };
    const sh = this.shell(ar, 'learner', 'competition', 'zu', [ { label: L('ZU 24-Hour Challenge','تحدي جامعة زايد'), href:'/zu/dashboard' }, { label: L('Competition','المسابقة'), href:'/zu/competition' }, { label: L('Dashboard','اللوحة') } ]);
    Object.assign(sh, ZU_USER());
    const sec = this.state.left; const pad = (n) => (n < 10 ? '0' : '') + n;
    const cd = { d: String(Math.floor(sec / 86400)), h: pad(Math.floor(sec / 3600) % 24), m: pad(Math.floor(sec / 60) % 60), s: pad(sec % 60) };
    const SC = [8, 8, 6, 7]; const COL = ['#1D1650','#3B2F92','#CD3151','#D63539'];
    const crit = RUBRIC.map((r, i) => { const pts = r.w * SC[i] / 10; return { t: L(r.t[0], r.t[1]), w: String(r.w), pts: String(pts), p: (SC[i] * 10) + '%', c: COL[i] }; });
    const steps = [
      [L('Round opened','بدء الجولة'), L('15 Sep 2026','15 سبتمبر 2026'), 'ok'], [L('You submitted','قدّمت مشاركتك'), L('30 Sep 2026 · 14:20 Gulf','30 سبتمبر 2026 · 14:20 بتوقيت الخليج'), 'ok'],
      [L('Judging','التحكيم'), closed ? L('Scored by the judging panel','قيّمتها لجنة التحكيم') : L('In progress · 2 judges assigned','جارٍ · محكّمان معيّنان'), closed ? 'ok' : 'on'],
      [L('Round closes','إغلاق الجولة'), L('Tue 20 Oct 2026 · 23:59 Gulf','الثلاثاء 20 أكتوبر 2026 · 23:59 بتوقيت الخليج'), closed ? 'ok' : ''],
      [L('Results published','نشر النتائج'), closed ? L('Score 72 / 100 · rank #1','الدرجة 72 / 100 · الترتيب الأول') : L('Score and rank appear here','تظهر الدرجة والترتيب هنا'), closed ? 'on' : ''] ]
      .map(x => ({ h:x[0], d:x[1], cls:x[2], cur: x[2] === 'on' ? 'step' : 'false' }));
    return { ...base, t, sh, cd, crit, steps,
      specName: t.spec + ' · ' + firstName, route: '/zu/competition/dashboard',
      sub: closed ? L('Round R1 is closed — here’s how your entry scored.','أُغلقت الجولة R1، وإليك نتيجة مشاركتك.') : L('Your entry is in. Track the round until results are published.','تم استلام مشاركتك. تابع الجولة حتى نشر النتائج.'),
      open: !closed, closed, cdLbl: closed ? L('Round','الجولة') : L('Closes in','تُغلق خلال'),
      cdAria: L(cd.d + ' days ' + cd.h + ' hours ' + cd.m + ' minutes left', 'متبقٍ ' + cd.d + ' يوم و' + cd.h + ' ساعة و' + cd.m + ' دقيقة'),
      statusV: closed ? L('Scored','مقيّمة') : L('Submitted','مقدّمة'), statusN: closed ? L('Final · 2 judges','نهائية · محكّمان') : L('With the judges since 30 Sep','لدى المحكّمين منذ 30 سبتمبر'),
      scTag: closed ? L('Published','منشورة') : L('Hidden until close','مخفية حتى الإغلاق'), scTagCls: closed ? 'ok' : 'mut',
      dash: (2 * Math.PI * 96 * 0.72).toFixed(1),
      segs: [ this.seg('Round', scr, [['judging','Judging (open)'],['closed','Closed (results)']], v => this.setState({ screen:v })) ]
    };
  }
}
