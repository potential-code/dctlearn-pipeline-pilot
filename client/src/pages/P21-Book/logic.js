// Ported verbatim from the Claude Design artboard P21-Book (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, init:false, week:0, sel:null, topic:'', phase:'pick', err:false, nb:null, b2:'confirmed', cdlg:null, reason:'', note:'', toast:'', busyC:false }; }
  setup(scr){
    const s = { screen:scr, init:true, week:0, sel:null, topic:'', phase:'pick', err:false, nb:null, b2:'confirmed', cdlg:null, reason:'', note:'', toast:'', busyC:false };
    if (scr === 'selected' || scr === 'requested' || scr === 'confirmed') { s.week = 1; s.sel = { day:14, h:11 }; s.topic = 'Review my one-page project brief before I share it with my manager'; }
    if (scr === 'requested') { s.phase = 'requested'; s.nb = { day:14, h:11, status:'requested' }; }
    if (scr === 'confirmed') { s.phase = 'confirmed'; s.nb = { day:14, h:11, status:'confirmed' }; }
    if (scr === 'cancel') s.cdlg = 'B2';
    return s;
  }
  componentWillUnmount(){ clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); }
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
    const scr = this.state.screen || this.props.screen || 'pick';
    if (!this.state.init) Object.assign(this.state, this.setup(scr));
    const st = this.state;
    const DN = [['Sun','الأحد'],['Mon','الإثنين'],['Tue','الثلاثاء'],['Wed','الأربعاء'],['Thu','الخميس'],['Fri','الجمعة'],['Sat','السبت']];
    const DL = [['Sunday','الأحد'],['Monday','الإثنين'],['Tuesday','الثلاثاء'],['Wednesday','الأربعاء'],['Thursday','الخميس'],['Friday','الجمعة'],['Saturday','السبت']];
    const OCT = L('Oct','أكتوبر');
    const hh = (h) => (h < 10 ? '0' : '') + h + ':00';
    const range = (h) => hh(h) + '–' + hh(h + 1);
    const dayOf = (n) => (n - 4) % 7; // 4 Oct 2026 is a Sunday
    const dateLbl = (n, h, long) => L((long ? DL : DN)[dayOf(n)][0] + ' ' + n + ' Oct · ' + range(h) + ' Gulf', (long ? DL : DN)[dayOf(n)][1] + ' ' + n + ' أكتوبر · ' + range(h) + ' بتوقيت الخليج');
    const TAKEN = { '8-10':1, '11-12':1, '14-10':1, '20-11':1, '22-12':1 };
    const t = {
      spec: L('Book a session','حجز جلسة'), ey: L('Elevate 2026 · Mentoring','إرتقاء 2026 · الإرشاد'), h1: L('Book a session','احجز جلسة'),
      sub: L('Pick a 60-minute slot from Dr. Hessa’s availability — Sunday to Thursday, 10:00–13:00 Gulf time.','اختر موعداً مدته 60 دقيقة من أوقات توفر د. حصة — من الأحد إلى الخميس، 10:00–13:00 بتوقيت الخليج.'),
      mentorProfile: L('Mentor profile','ملف المرشدة'), calLbl: L('Dr. Hessa’s availability','أوقات توفر د. حصة'), prevW: L('Previous week','الأسبوع السابق'), nextW: L('Next week','الأسبوع التالي'),
      calAria: L('Available 60-minute slots','المواعيد المتاحة لمدة 60 دقيقة'), time: L('Time','الوقت'),
      lgFree: L('Free','متاح'), lgSel: L('Selected','محدد'), lgMine: L('Your session','جلستك'), lgTaken: L('Booked','محجوز'), tz: L('All times Gulf (UTC+4)','جميع الأوقات بتوقيت الخليج (UTC+4)'),
      myTitle: L('My bookings','حجوزاتي'), mySub: L('Programme: 6 sessions','البرنامج: 6 جلسات'), room: L('Session room','غرفة الجلسة'), cancel: L('Cancel','إلغاء'),
      sumTitle: L('Your booking','حجزك'), hessa: L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'), hessaT: L('Your mentor · Museums Strategy','مرشدتك · استراتيجية المتاحف'),
      selected: L('Selected time','الموعد المحدد'), dur: L('60 minutes · Session room (Zoom)','60 دقيقة · غرفة الجلسة (Zoom)'), pickHint: L('Pick a free time on the calendar.','اختر موعداً متاحاً من التقويم.'),
      errSlot: L('Choose a time slot before you confirm.','اختر موعداً قبل التأكيد.'), topic: L('What would you like to focus on?','ما الذي تريد التركيز عليه؟'), optional: L('(optional)','(اختياري)'),
      topicPh: L('e.g. Review my project brief','مثال: مراجعة ملخص مشروعي'), confirmBtn: L('Request this session','اطلب هذه الجلسة'),
      policy: L('Slots inside your mentor’s availability are confirmed automatically. You can cancel up to 2 hours before the start.','تُؤكَّد المواعيد ضمن أوقات توفر المرشد تلقائياً، ويمكنك الإلغاء حتى ساعتين قبل البدء.'),
      st1: L('Request sent','تم إرسال الطلب'), st2: L('Checking Dr. Hessa’s calendar…','جارٍ التحقق من تقويم د. حصة…'), st3: L('Confirmed — added to both calendars','تم التأكيد وأُضيفت إلى التقويمين'),
      confH: L('Session 3 is confirmed','تم تأكيد الجلسة 3'), ics: L('Add to calendar','أضف إلى التقويم'), again: L('Book another','احجز جلسة أخرى'),
      grTitle: L('From your GROW log','من سجل GROW'), grSub: L('Session 1 · 28 Sep','الجلسة 1 · 28 سبتمبر'), gG: L('Goal:','الهدف:'), gGv: L('Lead a small exhibition project by Q2 2027.','قيادة مشروع معرض صغير بحلول الربع الثاني 2027.'),
      gW: L('Way forward:','الخطوة التالية:'), gWv: L('Enrol in C16 this week; draft a one-page project brief before session 2.','التسجيل في الدورة C16 هذا الأسبوع، وإعداد ملخص مشروع من صفحة واحدة قبل الجلسة 2.'),
      cEy: L('Cancel booking','إلغاء الحجز'), cReason: L('Reason','السبب'), cNote: L('Message to Dr. Hessa (optional)','رسالة إلى د. حصة (اختياري)'),
      cWarn: L('Cancelling frees the slot for other mentees and e-mails Dr. Hessa. This can’t be undone.','يتيح الإلغاء الموعد لمتدرّبين آخرين ويُرسل بريداً إلى د. حصة، ولا يمكن التراجع عنه.'),
      keep: L('Keep booking','الإبقاء على الحجز'), cBtn: L('Cancel booking','إلغاء الحجز'), close: L('Close','إغلاق')
    };
    const sh = this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد'), href:'/elevate/mentoring' }, { label: L('Book a session','حجز جلسة') } ]);
    const w = st.week;
    const picking = st.phase === 'pick';
    const days = DN.map((d, i) => { const n = 4 + 7 * w + i; return { dn: L(d[0], d[1]), n: String(n), cls: (n === 6 ? 'today ' : '') + (i >= 5 ? 'off' : '') }; });
    const rows = [10, 11, 12].map(h => ({ l: hh(h), cells: DN.map((d, i) => {
      const n = 4 + 7 * w + i; const key = n + '-' + h;
      const base2 = { btn:false, info:false, dash:false, ccls:'', cls:'', on:'false', time: hh(h), sub:'', aria:'', pick: () => {} };
      if (i >= 5) return { ...base2, ccls:'off', dash:true };
      if (n <= 6) return { ...base2, dash:true };
      if (n === 12 && h === 11 && st.b2 !== 'cancelled') return { ...base2, info:true, cls:'mine', sub: L('Session 2','الجلسة 2'), aria: L('Your session 2, ','جلستك 2، ') + dateLbl(n, h, true) };
      if (st.nb && st.nb.day === n && st.nb.h === h && st.nb.status !== 'cancelled') return { ...base2, info:true, cls: st.nb.status === 'requested' ? 'req' : 'mine', sub: st.nb.status === 'requested' ? L('Requested','مطلوبة') : L('Session 3','الجلسة 3'), aria: L('Your session 3, ','جلستك 3، ') + dateLbl(n, h, true) };
      if (TAKEN[key]) return { ...base2, info:true, cls:'taken', sub: L('Booked','محجوز'), aria: L('Booked, ','محجوز، ') + dateLbl(n, h, true) };
      const on = picking && st.sel && st.sel.day === n && st.sel.h === h;
      return { ...base2, btn:true, cls: on ? 'sel' : 'free', on: on ? 'true' : 'false', sub: on ? L('Selected','محدد') : L('Free','متاح'), aria: dateLbl(n, h, true),
        pick: () => { if (picking) this.setState({ sel: on ? null : { day:n, h }, err:false }); } };
    }) }));
    const weekLabel = L((4 + 7 * w) + '–' + (10 + 7 * w) + ' October 2026', (4 + 7 * w) + '–' + (10 + 7 * w) + ' أكتوبر 2026');
    const selLabel = st.sel ? dateLbl(st.sel.day, st.sel.h, true) : '';
    const confirm = () => {
      if (!st.sel) { this.setState({ err:true }); return; }
      const nb = { day: st.sel.day, h: st.sel.h, status:'requested' };
      this.setState({ phase:'requested', nb, err:false });
      clearTimeout(this.t1); this.t1 = setTimeout(() => { this.setState({ phase:'confirmed', nb: { ...nb, status:'confirmed' }, toast: L('Session 3 confirmed','تم تأكيد الجلسة 3') }); clearTimeout(this.t2); this.t2 = setTimeout(() => this.setState({ toast:'' }), 2600); }, 1600);
    };
    const flash = (msg) => { this.setState({ toast: msg }); clearTimeout(this.t2); this.t2 = setTimeout(() => this.setState({ toast:'' }), 2400); };
    const stars = [1,2,3,4,5].map(() => ({}));
    const bookings = [];
    if (st.nb) bookings.push({ day: String(st.nb.day), mon: OCT, title: L('Session 3 with Dr. Hessa','الجلسة 3 مع د. حصة'), when: dateLbl(st.nb.day, st.nb.h, false) + (st.topic ? ' · ' + st.topic : ''), hasFb:false, stars,
      tag: st.nb.status === 'requested' ? L('Requested','مطلوبة') : st.nb.status === 'cancelled' ? L('Cancelled','ملغاة') : L('Confirmed','مؤكدة'), tagCls: st.nb.status === 'requested' ? 'warn' : st.nb.status === 'cancelled' ? 'bad' : 'ok',
      canJoin:false, canCancel: st.nb.status === 'confirmed', cancel: () => this.setState({ cdlg:'NB', reason:'', note:'' }), room:'' });
    bookings.push({ day:'12', mon: OCT, title: L('Session 2 with Dr. Hessa','الجلسة 2 مع د. حصة'), when: dateLbl(12, 11, false) + L(' · B2',' · B2'), hasFb:false, stars,
      tag: st.b2 === 'cancelled' ? L('Cancelled','ملغاة') : L('Confirmed','مؤكدة'), tagCls: st.b2 === 'cancelled' ? 'bad' : 'ok', canJoin: st.b2 !== 'cancelled', canCancel: st.b2 !== 'cancelled', room:'/mentoring/session/B2', cancel: () => this.setState({ cdlg:'B2', reason:'', note:'' }) });
    bookings.push({ day:'28', mon: L('Sep','سبتمبر'), title: L('Session 1 with Dr. Hessa','الجلسة 1 مع د. حصة'), when: L('Mon 28 Sep · 11:00–12:00 Gulf · B1','الإثنين 28 سبتمبر · 11:00–12:00 بتوقيت الخليج · B1'), hasFb:true, stars, fb: L('You rated 5 / 5 · attended','قيّمتها 5 / 5 · حضرت'),
      tag: L('Completed','مكتملة'), tagCls:'mut', canJoin:false, canCancel:false, room:'', cancel: () => {} });
    const REASONS = [['', 'Choose a reason…','اختر سبباً…'], ['conflict','Schedule conflict','تعارض في المواعيد'], ['work','Urgent work commitment','التزام عمل طارئ'], ['unwell','Feeling unwell','وعكة صحية'], ['other','Other','سبب آخر']];
    const cIsNb = st.cdlg === 'NB';
    const doCancel = () => {
      this.setState({ busyC:true });
      clearTimeout(this.t3); this.t3 = setTimeout(() => {
        if (cIsNb) this.setState({ busyC:false, cdlg:null, nb: { ...st.nb, status:'cancelled' }, phase:'pick', sel:null });
        else this.setState({ busyC:false, cdlg:null, b2:'cancelled' });
        flash(L('Booking cancelled — Dr. Hessa has been notified','تم إلغاء الحجز وإبلاغ د. حصة'));
      }, 700);
    };
    const statusLbl = st.phase === 'requested' ? L('Requested','مطلوبة') : L('Confirmed','مؤكدة');
    const go = (v) => { clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); this.setState(this.setup(v)); };
    return { ...base, t, sh, days, rows, bookings, weekLabel,
      specName: t.spec, route: '/elevate/mentoring/book',
      prevW: () => { if (w > 0) this.setState({ week: w - 1 }); }, nextW: () => { if (w < 2) this.setState({ week: w + 1 }); }, prevDis: w === 0 ? 'true' : 'false', nextDis: w === 2 ? 'true' : 'false',
      picking, isReq: st.phase === 'requested', isConf: st.phase === 'confirmed', hasStatus: st.phase !== 'pick', statusLbl, statusCls: st.phase === 'requested' ? 'warn' : 'ok',
      hasSel: !!st.sel, noSel: !st.sel, selLabel, pickCls: st.sel ? 'has' : (st.err ? 'bad' : ''), err: st.err,
      topic: st.topic, onTopic: (e) => this.setState({ topic: e.target.value }), topicCount: (st.topic || '').length + ' / 300', topicShow: st.topic || L('No topic added','لم يُحدد موضوع'),
      confirm, confP: st.nb ? dateLbl(st.nb.day, st.nb.h, true) + L('. The room opens 10 minutes before the start.','. تفتح الغرفة قبل البدء بعشر دقائق.') : '',
      ics: () => flash(L('Calendar file downloaded (.ics)','تم تنزيل ملف التقويم (.ics)')), again: () => this.setState({ phase:'pick', sel:null, topic:'' }),
      cdlg: !!st.cdlg, cTitle: cIsNb ? L('Cancel session 3?','إلغاء الجلسة 3؟') : L('Cancel session 2?','إلغاء الجلسة 2؟'),
      cWhen: (cIsNb && st.nb ? dateLbl(st.nb.day, st.nb.h, true) : dateLbl(12, 11, true)) + L(' with Dr. Hessa Al Nuaimi.',' مع د. حصة النعيمي.'),
      reasons: REASONS.map(r => ({ v:r[0], l:L(r[1], r[2]) })), reason: st.reason, note: st.note, onReason: (e) => this.setState({ reason: e.target.value }), onNote: (e) => this.setState({ note: e.target.value }),
      closeC: () => this.setState({ cdlg:null }), stop: (e) => e.stopPropagation(), doCancel, busyCls: st.busyC ? 'is-loading' : '',
      hasToast: !!st.toast, toast: st.toast,
      segs: [ this.seg('State', scr, [['pick','Pick slot'],['selected','Slot selected'],['requested','Requested'],['confirmed','Confirmed'],['cancel','Cancel dialog']], go) ]
    };
  }
}
