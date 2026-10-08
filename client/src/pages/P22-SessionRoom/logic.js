// client: hand-edited (session number/date follow the bookingId route param)
// Ported verbatim from the Claude Design artboard P22-SessionRoom (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, role:null, screen:null, cam:true, mic:true, share:false, chat:false, el:754, spk:0, leave:false, fb:false, fbDone:false, rating:0, att:'', cmt:'', fbTried:false, msgs:null, draft:'', joining:false, toast:'' }; }
  componentDidMount(){
    this.iv = setInterval(() => {
      const s = this.state.screen || this.props.screen || 'ready';
      if (s === 'meeting') this.setState({ el: this.state.el + 1, spk: Math.floor((this.state.el + 1) / 4) % 3 === 0 ? 1 : 0 });
    }, 1000);
  }
  componentWillUnmount(){ clearInterval(this.iv); clearTimeout(this.tj); clearTimeout(this.tw); clearTimeout(this.tt); }
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
    const role = this.state.role || this.props.role || 'learner';
    const mentor = role === 'mentor';
    const scr0 = this.state.screen || this.props.screen || 'ready';
    const fbOpen = this.state.fb || (scr0 === 'feedback' && !this.state.fbClosed);
    const scr = scr0 === 'feedback' ? 'closed' : scr0;
    const st = this.state;
    const P = { saeed:{ ini:'SA', c:'#3B2F92', name:L('Saeed Al Hammadi','سعيد الحمادي'), short:L('Saeed','سعيد') }, hessa:{ ini:'HN', c:'#CD3151', name:L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'), short:L('Dr. Hessa','د. حصة') } };
    /* booking from the route param (/mentoring/session/:bookingId); unknown ids fall back to B2 */
    const BK = { B1:{ n:1, dd:['Monday 28 Sep 2026','الإثنين 28 سبتمبر 2026'], ds:['Mon 28 Sep','الإثنين 28 سبتمبر'] }, B2:{ n:2, dd:['Monday 12 Oct 2026','الإثنين 12 أكتوبر 2026'], ds:['Mon 12 Oct','الإثنين 12 أكتوبر'] }, B3:{ n:3, dd:['Wednesday 14 Oct 2026','الأربعاء 14 أكتوبر 2026'], ds:['Wed 14 Oct','الأربعاء 14 أكتوبر'] } };
    const pathId = typeof window !== 'undefined' ? (window.location.pathname.match(/\/session\/([^/?#]+)/) || [])[1] : '';
    const bid0 = String(this.props.bookingId || pathId || 'B2').toUpperCase();
    const bid = BK[bid0] ? bid0 : 'B2'; const bk = BK[bid]; const sn = String(bk.n);
    const me = mentor ? P.hessa : P.saeed; const other = mentor ? P.saeed : P.hessa;
    const t = {
      spec: L('Session room','غرفة الجلسة'), ey: L('Session room · ' + bid,'غرفة الجلسة · ' + bid), when: L(bk.dd[0] + ' · 11:00–12:00 Gulf · 60 minutes · Session ' + sn + ' of 6', bk.dd[1] + ' · 11:00–12:00 بتوقيت الخليج · 60 دقيقة · الجلسة ' + sn + ' من 6'),
      whenShort: L(bk.ds[0] + ' · 11:00–12:00 Gulf', bk.ds[1] + ' · 11:00–12:00 بتوقيت الخليج'),
      pvTitle: L('Camera and microphone check','فحص الكاميرا والميكروفون'), you: L('You','أنت'), camOff: L('Camera off','الكاميرا مغلقة'), level: L('Mic level','مستوى الصوت'),
      camera: L('Camera','الكاميرا'), microphone: L('Microphone','الميكروفون'), speaker: L('Speaker','السماعة'), micDev: L('MacBook Pro Microphone','ميكروفون MacBook Pro'), spkDev: L('MacBook Pro Speakers','سماعات MacBook Pro'),
      earlyP: L('The room opens 10 minutes before the start, at 10:50 Gulf time. You can test your camera and microphone now.','تفتح الغرفة قبل البدء بعشر دقائق، أي الساعة 10:50 بتوقيت الخليج. يمكنك اختبار الكاميرا والميكروفون الآن.'),
      cdAria: L('Opens in 5 days, 21 hours, 50 minutes','تفتح خلال 5 أيام و21 ساعة و50 دقيقة'), days: L('days','أيام'), hours: L('hours','ساعة'), mins: L('min','دقيقة'),
      ics: L('Add to calendar','أضف إلى التقويم'), manage: L('Manage booking','إدارة الحجز'),
      join: L('Join session','انضم إلى الجلسة'), sdk: L('Video runs inside DCT Learn with the Zoom Video SDK — no Zoom account or app needed.','يعمل الفيديو داخل DCT Learn عبر Zoom Video SDK، دون حاجة إلى حساب أو تطبيق Zoom.'),
      waitCap: L('Most sessions start within 5 minutes of the booked time.','تبدأ معظم الجلسات خلال 5 دقائق من الموعد المحجوز.'), leaveWait: L('Leave waiting room','مغادرة غرفة الانتظار'),
      agTitle: L('Session focus','محور الجلسة'), mentee: L('Mentee','المتدرّب'), saeed: L('Saeed Al Hammadi','سعيد الحمادي'), saeedT: L('Specialist, DCT Culture · 1–3 years at DCT','أخصائي، قطاع الثقافة · 1–3 سنوات في الدائرة'),
      topic: L('Topic','الموضوع'), topicV: L('Review my one-page project brief','مراجعة ملخص المشروع من صفحة واحدة'), lastWay: L('Way forward from session 1','الخطوة التالية من الجلسة 1'),
      lastWayV: L('Enrol in C16 this week; draft a one-page project brief before session 2.','التسجيل في الدورة C16 هذا الأسبوع، وإعداد ملخص مشروع من صفحة واحدة قبل الجلسة 2.'),
      fbSent: L('Feedback sent','تم إرسال التقييم'), giveFb: L('Give feedback','قيّم الجلسة'), writeGrow: L('Write GROW log','اكتب سجل GROW'),
      elapsed: L('Time in session','مدة الجلسة'), sdkShort: L('Zoom Video SDK · encrypted','Zoom Video SDK · مشفّر'), stage: L('Video','الفيديو'),
      shareAria: L('Shared screen','الشاشة المشتركة'), sharingNote: L('Only this window is shared','تتم مشاركة هذه النافذة فقط'), docEy: L('Project brief · draft 2','ملخص المشروع · المسودة 2'),
      docH: L('Threads of Al Sadu — a small exhibition','خيوط السدو — معرض صغير'), docP: L('A 6-week pop-up on Emirati weaving for Qasr Al Hosn visitors, Q2 2027.','معرض مؤقت لستة أسابيع عن النسيج الإماراتي لزوار قصر الحصن، الربع الثاني 2027.'),
      docA: L('Goals and audience','الأهداف والجمهور'), docB: L('Budget and partners','الميزانية والشركاء'),
      chat: L('Chat','المحادثة'), closeChat: L('Close chat','إغلاق المحادثة'), msg: L('Message','الرسالة'), msgPh: L('Message Dr. Hessa…','اكتب رسالة…'), send: L('Send','إرسال'),
      controls: L('Meeting controls','أدوات الاجتماع'), people: L('2 people','شخصان'), leave: L('Leave','مغادرة'),
      leaveH: L('Leave the session?','مغادرة الجلسة؟'), stay: L('Stay','البقاء'), stayClose: L('Stay — close dialog','البقاء — إغلاق النافذة'),
      fbEy: L('Session ' + sn + ' · feedback','الجلسة ' + sn + ' · التقييم'), attQ: L('Attendance','الحضور'), optional: L('(optional)','(اختياري)'),
      rErr: L('Choose a rating from 1 to 5.','اختر تقييماً من 1 إلى 5.'), aErr: L('Tell us who attended.','أخبرنا بمن حضر.'), later: L('Later','لاحقاً'), sendFb: L('Send feedback','إرسال التقييم'),
      thanks: L('Thank you — feedback sent','شكراً، تم إرسال التقييم'), close: L('Close','إغلاق'),
      growEy: L('Next step','الخطوة التالية'), growH: L('Write the GROW log for session ' + sn,'اكتب سجل GROW للجلسة ' + sn), gG: L('Goal','الهدف'), gR: L('Reality','الواقع'), gO: L('Options','الخيارات'), gW: L('Way forward','الخطوة التالية')
    };
    const title = mentor ? L('Session ' + sn + ' with Saeed Al Hammadi','الجلسة ' + sn + ' مع سعيد الحمادي') : L('Session ' + sn + ' with Dr. Hessa','الجلسة ' + sn + ' مع د. حصة');
    const sh = mentor
      ? this.shell(ar, 'mentor', 'sessions', null, [ { label: L('Sessions','الجلسات'), href:'/mentor/sessions' }, { label: L('Session room','غرفة الجلسة') } ])
      : this.shell(ar, 'learner', 'mentoring', 'elevate', [ { label: L('Elevate 2026','إرتقاء 2026'), href:'/elevate/dashboard' }, { label: L('Mentoring','الإرشاد'), href:'/elevate/mentoring' }, { label: L('Session room','غرفة الجلسة') } ]);
    const TAG = { early:[L('Opens 10:50 Gulf','تفتح 10:50'),'mut'], ready:[L('Room open','الغرفة مفتوحة'),'ok'], waiting:[L('Waiting','بانتظار الطرف الآخر'),'warn'], closed:[L('Ended','انتهت'),'mut'], cancelled:[L('Cancelled','ملغاة'),'bad'] };
    const STT = { early: L('Not open yet','لم تُفتح بعد'), ready: L('Ready when you are','جاهز للانضمام'), waiting: L('You’re in the waiting room','أنت في غرفة الانتظار') };
    const CHK = 'M20 6 9 17l-5-5'; const XX = 'M18 6 6 18M6 6l12 12';
    const checks = [ { l: st.cam ? L('Camera working','الكاميرا تعمل') : L('Camera is off — you can still join','الكاميرا مغلقة، ويمكنك الانضمام'), cls: st.cam ? '' : 'no', d: st.cam ? CHK : XX },
      { l: st.mic ? L('Microphone picking up sound','الميكروفون يلتقط الصوت') : L('Microphone muted','الميكروفون مكتوم'), cls: st.mic ? '' : 'no', d: st.mic ? CHK : XX },
      { l: L('Connection good · 24 Mbps','الاتصال جيد · 24 ميغابت/ث'), cls:'', d: CHK } ];
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const elapsed = pad(Math.floor(st.el / 3600)) + ':' + pad(Math.floor(st.el / 60) % 60) + ':' + pad(st.el % 60);
    const flash = (m) => { this.setState({ toast:m }); clearTimeout(this.tt); this.tt = setTimeout(() => this.setState({ toast:'' }), 2400); };
    const join = () => {
      this.setState({ joining:true });
      clearTimeout(this.tj); this.tj = setTimeout(() => { this.setState({ joining:false, screen:'waiting' }); clearTimeout(this.tw); this.tw = setTimeout(() => { const s = this.state.screen; if (s === 'waiting') this.setState({ screen:'meeting' }); }, 2600); }, 900);
    };
    const MSG0 = [ { who:'hessa', at:'11:01', tx:L('Welcome back, Saeed! Did you get a chance to draft the project brief?','أهلاً بعودتك يا سعيد! هل تمكنت من إعداد مسودة ملخص المشروع؟') },
                   { who:'saeed', at:'11:02', tx:L('Yes — I’ll share my screen in a moment.','نعم، سأشارك شاشتي بعد لحظة.') },
                   { who:'hessa', at:'11:09', tx:L('Great. Let’s look at the budget section first.','رائع، لنبدأ بقسم الميزانية.') } ];
    const msgs0 = st.msgs || MSG0;
    const msgs = msgs0.map(m => ({ cls: (m.who === 'hessa') === mentor ? 'me' : '', who: m.who === 'hessa' ? P.hessa.short : P.saeed.short, at:m.at, tx:m.tx }));
    const send = (e) => { if (e && e.preventDefault) e.preventDefault(); const v = (st.draft || '').trim(); if (!v) return; this.setState({ msgs: msgs0.concat([{ who: mentor ? 'hessa' : 'saeed', at:'11:' + pad(Math.floor(st.el / 60) % 60), tx:v }]), draft:'' }); };
    const rBad = st.fbTried && !st.rating; const aBad = st.fbTried && !st.att;
    const RL = [L('Poor','ضعيفة'), L('Fair','مقبولة'), L('Good','جيدة'), L('Very good','جيدة جداً'), L('Excellent','ممتازة')];
    const starBtns = [1,2,3,4,5].map(n => ({ cls: n <= st.rating ? 'on' : '', chk: n === st.rating ? 'true' : 'false', aria: n + ' / 5 · ' + RL[n - 1], pick: () => this.setState({ rating:n }) }));
    const ATT = mentor ? [['attended', L('Mentee attended','حضر المتدرّب'), L('We met for the session','عُقدت الجلسة')], ['no_show', L('Mentee didn’t show','لم يحضر المتدرّب'), L('Marks the booking no-show','تُسجَّل الجلسة كغياب')]]
                       : [['attended', L('We both attended','حضرنا كلانا'), L('The session took place','عُقدت الجلسة')], ['mentor_absent', L('Mentor didn’t show','لم تحضر المرشدة'), L('The programme team follows up','يتابع فريق البرنامج')], ['i_missed', L('I missed it','فاتتني الجلسة'), L('You can book another time','يمكنك حجز موعد آخر')]];
    const sendFb = () => { if (!st.rating || !st.att) { this.setState({ fbTried:true }); return; } this.setState({ fbDone:true, fbTried:false }); };
    const go = (v) => { clearTimeout(this.tj); clearTimeout(this.tw); this.setState({ screen:v, fb:false, fbClosed:false, fbDone:false, rating:0, att:'', cmt:'', fbTried:false, leave:false, share:false, chat:false, cam:true, mic:true, msgs:null, joining:false }); };
    const inMeeting = scr === 'meeting';
    const isEnd = scr === 'closed' || scr === 'cancelled';
    return { ...base, t, sh, me, other, title, checks, msgs, elapsed, starBtns,
      specName: t.spec + ' · ' + (mentor ? L('mentor','مرشد') : L('learner','متعلّم')), route: '/mentoring/session/' + bid,
      inLobby: !inMeeting, inMeeting, hasPrev: !isEnd, isEnd,
      stTag: (TAG[scr] || TAG.ready)[0], stTagCls: (TAG[scr] || TAG.ready)[1], stTitle: STT[scr] || '',
      isEarly: scr === 'early', isReady: scr === 'ready', isWaiting: scr === 'waiting', isLearner: !mentor, isMentor: mentor,
      readyP: mentor ? L('Saeed is in the waiting room. Join to let him in.','سعيد في غرفة الانتظار، انضمي للسماح له بالدخول.') : L('The room is open — starts in 8 minutes. Dr. Hessa hasn’t joined yet.','الغرفة مفتوحة وتبدأ خلال 8 دقائق، ولم تنضم د. حصة بعد.'),
      waitP: mentor ? L('Connecting you with Saeed…','جارٍ توصيلك بسعيد…') : L('Waiting for Dr. Hessa to join. We’ll let you in as soon as she arrives.','بانتظار انضمام د. حصة، وسندخلك فور وصولها.'),
      join, joinCls: st.joining ? 'is-loading' : '', leaveWait: () => { clearTimeout(this.tw); this.setState({ screen:'ready' }); },
      ics: () => flash(L('Calendar file downloaded (.ics)','تم تنزيل ملف التقويم (.ics)')),
      camOff: !st.cam, micOff: !st.mic, camP: st.cam ? 'true' : 'false', micP: st.mic ? 'true' : 'false', camLbl: st.cam ? L('Camera on','الكاميرا تعمل') : L('Camera off','الكاميرا مغلقة'), micLbl: st.mic ? L('Mic on','الميكروفون يعمل') : L('Mic muted','الميكروفون مكتوم'), meterCls: st.mic ? '' : 'mute',
      togCam: () => this.setState({ cam: !st.cam }), togMic: () => this.setState({ mic: !st.mic }),
      micCls: st.mic ? '' : 'offc', camCls: st.cam ? '' : 'offc', micOffP: st.mic ? 'false' : 'true', camOffP: st.cam ? 'false' : 'true',
      micBtn: st.mic ? L('Mute','كتم') : L('Unmute','إلغاء الكتم'), camBtn: st.cam ? L('Stop video','إيقاف الفيديو') : L('Start video','تشغيل الفيديو'),
      micIcon: st.mic ? 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8' : 'M1 1l22 22M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V4a3 3 0 0 0-5.9-.6M17 16.9A7 7 0 0 1 5 12v-2M19 10v2a7 7 0 0 1-.1 1.2M12 19v4M8 23h8',
      camIcon: st.cam ? 'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z' : 'M1 1l22 22M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.7 0H14a2 2 0 0 1 2 2v3.3l1 1L23 7v10',
      shareP: st.share ? 'true' : 'false', shareBtn: st.share ? L('Stop sharing','إيقاف المشاركة') : L('Share screen','مشاركة الشاشة'), togShare: () => this.setState({ share: !st.share }),
      sharing: st.share, noShare: !st.share, stageCls: st.share ? 'sh' : '', shareBanner: L('You are sharing your screen','أنت تشارك شاشتك'),
      chat: st.chat, chatP: st.chat ? 'true' : 'false', togChat: () => this.setState({ chat: !st.chat }), unread: st.chat || st.msgs ? '' : '1',
      draft: st.draft, onDraft: (e) => this.setState({ draft: e.target.value }), send,
      otherSpk: st.spk ? '' : 'spk', meSpk: st.spk && st.mic ? 'spk' : '', langLbl: ar ? 'EN' : 'عربي',
      leave: st.leave, askLeave: () => this.setState({ leave:true }), cancelLeave: () => this.setState({ leave:false }), stop: (e) => e.stopPropagation(),
      leaveP: mentor ? L('Ending the session closes the room for Saeed too. You’ll be asked for quick feedback and then your GROW log.','إنهاء الجلسة يغلق الغرفة لسعيد أيضاً، وسيُطلب منك تقييم سريع ثم كتابة سجل GROW.') : L('You can rejoin until 12:00 Gulf. After you leave we’ll ask for quick feedback.','يمكنك العودة حتى الساعة 12:00 بتوقيت الخليج، وسنطلب منك تقييماً سريعاً بعد المغادرة.'),
      leaveBtn: mentor ? L('End for everyone','إنهاء للجميع') : L('Leave session','مغادرة الجلسة'),
      doLeave: () => this.setState({ leave:false, screen:'closed', fb:true, fbClosed:false, share:false, chat:false }),
      endTitle: scr === 'cancelled' ? L('This session was cancelled','تم إلغاء هذه الجلسة') : L('This session has ended','انتهت هذه الجلسة'),
      endP: scr === 'cancelled' ? (mentor ? L('You cancelled it on 10 Oct · reason: travel. Saeed was notified by e-mail and the slot is free again.','ألغيتِها في 10 أكتوبر · السبب: سفر. أُبلغ سعيد بالبريد الإلكتروني وأصبح الموعد متاحاً.') : L('Dr. Hessa cancelled it on 10 Oct · reason: travel. Pick another time from her calendar.','ألغت د. حصة الجلسة في 10 أكتوبر · السبب: سفر. اختر موعداً آخر من تقويمها.'))
            : L(bk.ds[0] + ' · 11:00–11:58 Gulf · 58 minutes. ', bk.ds[1] + ' · 11:00–11:58 بتوقيت الخليج · 58 دقيقة. ') + (mentor ? L('Rate the session, then capture the GROW log while it’s fresh.','قيّمي الجلسة ثم دوّني سجل GROW وهي حاضرة في ذهنك.') : L('Your feedback helps the Elevate team and Dr. Hessa.','تقييمك يساعد فريق إرتقاء ود. حصة.')),
      fbThanks: scr === 'closed' && st.fbDone, showFbBtn: scr === 'closed' && !st.fbDone, isClosedMentor: scr === 'closed' && mentor,
      openFb: () => this.setState({ fb:true, fbClosed:false }), nextHref: mentor ? '/mentor/sessions' : '/elevate/mentoring/book', nextLbl: mentor ? L('Back to sessions','العودة إلى الجلسات') : (scr === 'cancelled' ? L('Book another time','احجز موعداً آخر') : L('Book next session','احجز الجلسة التالية')),
      fb: fbOpen && scr === 'closed', fbForm: !st.fbDone, fbDone: st.fbDone, closeFb: () => this.setState({ fb:false, fbClosed:true }),
      fbTitle: mentor ? L('How did session ' + sn + ' with Saeed go?','كيف كانت الجلسة ' + sn + ' مع سعيد؟') : L('How was session ' + sn + ' with Dr. Hessa?','كيف كانت الجلسة ' + sn + ' مع د. حصة؟'),
      rateQ: L('Your rating','تقييمك'), rateLbl: st.rating ? RL[st.rating - 1] : L('Not rated yet','لم يتم التقييم'), rBad, aBad,
      attGrid: mentor ? 'l2' : 'l3', attOpts: ATT.map(a => ({ l:a[1], d:a[2], on: st.att === a[0], pick: () => this.setState({ att:a[0] }) })),
      cmtLbl: mentor ? L('Private note for the programme team','ملاحظة خاصة لفريق البرنامج') : L('Comment','تعليق'), cmtPh: mentor ? L('Not shown to Saeed','لا تظهر لسعيد') : L('What was most useful?','ما الأكثر فائدة؟'),
      cmt: st.cmt, onCmt: (e) => this.setState({ cmt: e.target.value }), cmtCount: (st.cmt || '').length + ' / 500', sendFb,
      thanksP: mentor ? L('Session ' + sn + ' is marked as completed.','تم تسجيل الجلسة ' + sn + ' كمكتملة.') : L('Dr. Hessa sees your rating; comments go to the Elevate team.','ترى د. حصة تقييمك، وتصل التعليقات إلى فريق إرتقاء.'),
      doneHref: mentor ? '/mentor' : '/elevate/mentoring/book', doneLbl: mentor ? L('Open GROW log','افتح سجل GROW') : L('Book next session','احجز الجلسة التالية'),
      hasToast: !!st.toast, toast: st.toast,
      segs: [ this.seg('Role', role, [['learner','Learner'],['mentor','Mentor']], v => this.setState({ role:v })),
              this.seg('State', scr0, [['early','Early'],['ready','Ready'],['waiting','Waiting'],['meeting','In meeting'],['closed','Closed'],['cancelled','Cancelled'],['feedback','Feedback']], go) ]
    };
  }
}
