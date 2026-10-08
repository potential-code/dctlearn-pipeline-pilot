// Ported verbatim from the Claude Design artboard P30-Mentor (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){
    super(p);
    this.state = {
      locale:null, tab:null, dlg:undefined, target:null,
      apps:{ fatima:'pending', khalifa:'pending' },
      bk:{ B1:{ st:'completed', rating:5, att:'attended', log:true }, B2:{ st:'confirmed' }, B4:{ st:'requested' } },
      sesFilter:'all', selMentee:'saeed', selLog:'g1', logs:null,
      reason:'', rTried:false,
      fb:{ att:'attended', rating:0, note:'', tried:false },
      gw:null, toast:null, pf:null
    };
  }

    /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  componentDidUpdate(prev){ if (prev.tab !== this.props.tab && this.state.tab) this.setState({ tab:null }); }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const L = (en, a) => ar ? a : en;
    const S = this.state;
    const tab = S.tab || this.props.tab || 'overview';
    const dlgKind = S.dlg === undefined ? (this.props.dialog || 'none') : S.dlg;
    const ROUTES = { overview:'/mentor', mentees:'/mentor/mentees', sessions:'/mentor/sessions', grow:'/mentor/grow', profile:'/mentor/profile' };
    const set = (o) => { this.setState(o); if (o && o.tab && this.props.proto && ROUTES[o.tab]) { try { window.dispatchEvent(new CustomEvent('dct-nav', { detail: ROUTES[o.tab] })); } catch(e){} } };
    const fmtLen = (n, max) => n.toLocaleString('en-US') + ' / ' + max.toLocaleString('en-US');

    const t = ar ? {
      spec:'لوحة المرشد', ey:'بوابة المرشدين · إرتقاء 2026', setAvail:'أوقات التوفر', room:'غرفة الجلسة', tabsAria:'أقسام لوحة المرشد',
      tabs:['نظرة عامة','المتدرّبون','الجلسات','سجلات GROW','الملف الشخصي'],
      apTitle:'طلبات الإرشاد', qGoals:'الأهداف', qYears:'سنوات الخدمة في الدائرة', qAreas:'المجالات المفضّلة', qLang:'لغة الإرشاد', accept:'قبول', decline:'اعتذار', apHint:'يُبلَّغ المتدرّب بقرارك عبر البريد الإلكتروني.',
      upTitle:'الجلسات القادمة', allSessions:'كل الجلسات', join:'انضمام', confirm:'تأكيد', pastTitle:'جلسات سابقة', readLog:'قراءة السجل', writeLog:'كتابة سجل GROW', write:'اكتب الآن',
      noUp:'لا توجد جلسات قادمة', noUpSub:'يحجز المتدرّبون من أوقاتك المتاحة؛ ستظهر الحجوزات هنا.',
      meTitle:'متدرّبوك', open:'فتح', msDone:'جلسات مكتملة', msLast:'آخر جلسة', msPend:'سجلات معلّقة', msUp:'قادمة', msLogs:'سجلات GROW',
      avTitle:'أوقات توفرك', edit:'تعديل', avNote:'جلسات مدتها 60 دقيقة بتوقيت الخليج (Asia/Dubai).',
      privacy:'تظهر لك أسماء المتدرّبين وجلساتهم فقط. لا تُعرض عناوين البريد الإلكتروني أو أرقام الهواتف أو الأرقام الوظيفية للمرشدين.',
      privacyShort:'البريد الإلكتروني والهاتف والرقم الوظيفي لا تُشارَك مع المرشدين. تواصل مع متدرّبك عبر الجلسات.',
      regTitle:'إجابات التسجيل', tlTitle:'الجلسات', slots:'إدارة الأوقات', growTitle:'سجلات GROW', readOnly:'للقراءة فقط', noLogs:'لم تُكتب سجلات بعد.', noSes:'لا توجد جلسات بعد',
      filterAria:'تصفية الجلسات', chips:['الكل','القادمة','طلبات الحجز','السابقة'], tzNote:'جميع الأوقات بتوقيت الخليج (UTC+4)', cancelRule:'يمكن الإلغاء حتى ساعتين قبل البدء',
      declineReq:'رفض', outcome:'تسجيل النتيجة', noShow:'لم يحضر', cancel:'إلغاء', noSesList:'لا توجد جلسات هنا',
      sesInfo:'بعد كل جلسة: سجّل الحضور والتقييم، ثم اكتب سجل GROW. تُكمَل الجلسات المؤكدة تلقائياً بعد ساعتين من انتهائها إذا انضم الطرفان.',
      growList:'كل السجلات', pending:'معلّق', locked:'مقفل · غير قابل للتعديل',
      pfTitle:'ملفك كمرشدة', pfSub:'يظهر للمتدرّبين في إرتقاء 2026', photo:'الصورة الشخصية', upload:'رفع صورة', remove:'إزالة', fTitle:'المسمّى الوظيفي', bioEn:'النبذة (بالإنجليزية)', bioAr:'النبذة (بالعربية)',
      cats:'مجالات الإرشاد', catsHint:'اختر من 1 إلى 3 مجالات؛ تُستخدم في المطابقة.', linkedin:'رابط LinkedIn', liHint:'مثال: https://www.linkedin.com/in/hessa-alnuaimi', liErr:'أدخل رابط ملف LinkedIn يبدأ بـ https://', reqTitle:'المسمّى الوظيفي مطلوب (حتى 160 حرفاً).',
      discard:'تجاهل التغييرات', saveProfile:'حفظ الملف', pvTitle:'كما يراك المتدرّبون', pvRating:'متوسط التقييم', pvSessions:'جلسة مكتملة', pfErrSub:'راجع الحقول المحددة بالأحمر ثم احفظ مرة أخرى.',
      pfPrivacy:'لا يظهر بريدك الإلكتروني أو رقم هاتفك في ملفك العام.',
      dcSub:'سيُبلَّغ المتدرّب ويمكنه اختيار مرشد آخر.', reason:'السبب', optional:'(اختياري)', reasonPh:'مثلاً: أهدافك أقرب إلى خبرة مرشد آخر في مجال تجربة الزوار.', reasonErr:'الحد الأقصى 500 حرف.',
      dcNote:'يصل السبب إلى فريق برنامج إرتقاء فقط، ولا يُعرض للمتدرّب حرفياً.', back:'رجوع', declineBtn:'تأكيد الاعتذار', close:'إغلاق',
      cnPh:'مثلاً: سفر عمل طارئ', cnWarnT:'سيُبلَّغ المتدرّب', cnWarn:'يُرسل بريد إلكتروني فوراً ويُتاح الموعد للحجز مجدداً. لا يمكن التراجع عن الإلغاء.', keep:'الإبقاء على الجلسة',
      fbTitle:'ملاحظات ما بعد الجلسة', attendance:'الحضور', rating:'تقييم الجلسة', rateErr:'اختر تقييماً من 1 إلى 5.', fbNote:'ملاحظة', fbNotePh:'ما الذي نجح؟ ما الذي ستركز عليه في المرة القادمة؟', noteErr:'الحد الأقصى 1,000 حرف.', fbSave:'حفظ الملاحظات',
      gwTitle:'كتابة سجل GROW', gwSub:'الهدف، الواقع، الخيارات، الطريق إلى الأمام', gwWarnT:'لا يمكن تعديل السجل بعد حفظه', mentee:'المتدرّب', sessionNo:'رقم الجلسة', sessionDate:'تاريخ الجلسة', dateErr:'اختر تاريخ الجلسة.', gwSave:'حفظ وإقفال السجل',
      nmSaeed:'سعيد الحمادي', nmFatima:'فاطمة الحوسني', nmKhalifa:'خليفة الكتبي'
    } : {
      spec:'Mentor dashboard', ey:'Mentor portal · Elevate 2026', setAvail:'Availability', room:'Session room', tabsAria:'Mentor dashboard sections',
      tabs:['Overview','Mentees','Sessions','GROW logs','Profile'],
      apTitle:'Mentee applications', qGoals:'Goals', qYears:'Years at DCT', qAreas:'Preferred areas', qLang:'Mentoring language', accept:'Accept', decline:'Decline', apHint:'The mentee is told your decision by e-mail.',
      upTitle:'Upcoming sessions', allSessions:'All sessions', join:'Join', confirm:'Confirm', pastTitle:'Past sessions', readLog:'Read log', writeLog:'Write GROW log', write:'Write now',
      noUp:'No upcoming sessions', noUpSub:'Mentees book from your free slots; bookings will appear here.',
      meTitle:'Your mentees', open:'Open', msDone:'sessions done', msLast:'last session', msPend:'logs pending', msUp:'upcoming', msLogs:'GROW logs',
      avTitle:'Your availability', edit:'Edit', avNote:'60-minute sessions, Gulf time (Asia/Dubai).',
      privacy:'You see mentees’ names and sessions only. E-mail addresses, phone numbers and employee IDs are never shown to mentors.',
      privacyShort:'E-mail, phone and employee ID are not shared with mentors. Reach your mentee through sessions.',
      regTitle:'Registration answers', tlTitle:'Sessions', slots:'Manage slots', growTitle:'GROW logs', readOnly:'Read-only', noLogs:'No logs written yet.', noSes:'No sessions yet',
      filterAria:'Filter sessions', chips:['All','Upcoming','Requests','Past'], tzNote:'All times in Gulf time (UTC+4)', cancelRule:'Cancel up to 2 hours before start',
      declineReq:'Decline', outcome:'Record outcome', noShow:'Mark no-show', cancel:'Cancel', noSesList:'Nothing here',
      sesInfo:'After each session: record attendance and a rating, then write the GROW log. Confirmed sessions complete automatically 2 hours after the end if both of you joined.',
      growList:'All logs', pending:'Pending', locked:'Locked · immutable',
      pfTitle:'Your mentor profile', pfSub:'Shown to mentees in Elevate 2026', photo:'Profile photo', upload:'Upload photo', remove:'Remove', fTitle:'Title', bioEn:'Bio (English)', bioAr:'Bio (Arabic)',
      cats:'Mentoring areas', catsHint:'Choose 1 to 3 areas; they are used for matching.', linkedin:'LinkedIn URL', liHint:'e.g. https://www.linkedin.com/in/hessa-alnuaimi', liErr:'Enter a LinkedIn profile link starting with https://', reqTitle:'Title is required (up to 160 characters).',
      discard:'Discard changes', saveProfile:'Save profile', pvTitle:'How mentees see you', pvRating:'average rating', pvSessions:'completed session', pfErrSub:'Check the fields marked in red, then save again.',
      pfPrivacy:'Your e-mail and phone number are never shown on your public profile.',
      dcSub:'The mentee is notified and can choose another mentor.', reason:'Reason', optional:'(optional)', reasonPh:'e.g. Your goals match another mentor’s visitor-experience background more closely.', reasonErr:'Keep it under 500 characters.',
      dcNote:'Your reason goes to the Elevate programme team only; it is not shown to the mentee word for word.', back:'Back', declineBtn:'Decline application', close:'Close',
      cnPh:'e.g. Urgent business travel', cnWarnT:'The mentee will be notified', cnWarn:'An e-mail goes out straight away and the slot opens for booking again. This can’t be undone.', keep:'Keep session',
      fbTitle:'Post-session feedback', attendance:'Attendance', rating:'Rate the session', rateErr:'Choose a rating from 1 to 5.', fbNote:'Note', fbNotePh:'What worked? What will you focus on next time?', noteErr:'Keep it under 1,000 characters.', fbSave:'Save feedback',
      gwTitle:'Write GROW log', gwSub:'Goal, Reality, Options, Way forward', gwWarnT:'Logs are immutable once saved', mentee:'Mentee', sessionNo:'Session no.', sessionDate:'Session date', dateErr:'Choose the session date.', gwSave:'Save and lock log',
      nmSaeed:'Saeed Al Hammadi', nmFatima:'Fatima Al Hosani', nmKhalifa:'Khalifa Al Ketbi'
    };
    const activeKey = tab === 'overview' ? 'dashboard' : tab;
    const tabName = t.tabs[['overview','mentees','sessions','grow','profile'].indexOf(tab)];
    const sh = this.shell(ar, 'mentor', activeKey, null, [ { label: L('Mentor portal','بوابة المرشدين'), href:'/mentor' }, { label: tab === 'overview' ? L('Dashboard','لوحة التحكم') : tabName } ]);

    /* ---------- data ---------- */
    const CATS = [['Strategy and Planning','الاستراتيجية والتخطيط'],['Culture and Heritage','الثقافة والتراث'],['Museums and Curation','المتاحف والتقييم الفني'],['Marketing and Communications','التسويق والاتصال'],['People and Performance','الموارد البشرية والأداء'],['Finance and Revenue','المالية والإيرادات'],['Visitor Experience and Events','تجربة الزوار والفعاليات'],['Libraries and Publishing','المكتبات والنشر'],['Tourism and International Operations','السياحة والعمليات الدولية'],['Legal and Governance','الشؤون القانونية والحوكمة'],['Sustainability','الاستدامة'],['Business Excellence and Quality','التميّز المؤسسي والجودة'],['Youth and Community Engagement','الشباب والمشاركة المجتمعية'],['Research','البحث']];
    const cat = (i) => L(CATS[i][0], CATS[i][1]);
    const APPS = {
      fatima:{ name:t.nmFatima, ini:'FH', c:'#3B2F92', sub:L('Exhibitions Coordinator','منسّقة معارض'), submitted:L('Applied Sat 3 Oct 2026','قدّمت الطلب السبت 3 أكتوبر 2026'),
        goals:L('Move from exhibition coordination into a curatorial role within two years. I want to learn how to build an exhibition narrative and work confidently with lenders and conservators.','الانتقال من تنسيق المعارض إلى دور تقييم فني خلال سنتين. أريد أن أتعلم بناء السرد القصصي للمعرض والعمل بثقة مع الجهات المُعيرة وأخصائيي الصون.'),
        years:L('3–5 years','3–5 سنوات'), areas:[cat(2), cat(13)], lang:L('Arabic and English','العربية والإنجليزية') },
      khalifa:{ name:t.nmKhalifa, ini:'KK', c:'#E35E3C', sub:L('Senior Officer, Heritage Sites','مسؤول أول، المواقع التراثية'), submitted:L('Applied Mon 5 Oct 2026','قدّم الطلب الإثنين 5 أكتوبر 2026'),
        goals:L('Build a five-year visitor programme for Al Ain’s heritage sites and present it to leadership with confidence. I need help structuring a strategy and making a strong business case.','بناء برنامج زوار لخمس سنوات لمواقع العين التراثية وعرضه على القيادة بثقة. أحتاج مساعدة في هيكلة الاستراتيجية وإعداد دراسة جدوى مقنعة.'),
        years:L('6–10 years','6–10 سنوات'), areas:[cat(0), cat(1)], lang:L('English','الإنجليزية') }
    };
    const BK = {
      B1:{ no:1, day:'28', mon:L('Sep','سبتمبر'), date:'2026-09-28', when:L('Mon 28 Sep · 11:00–12:00 Gulf · Zoom','الإثنين 28 سبتمبر · 11:00–12:00 بتوقيت الخليج · Zoom') },
      B2:{ no:2, day:'12', mon:L('Oct','أكتوبر'), date:'2026-10-12', when:L('Mon 12 Oct · 11:00–12:00 Gulf · Zoom','الإثنين 12 أكتوبر · 11:00–12:00 بتوقيت الخليج · Zoom') },
      B4:{ no:3, day:'14', mon:L('Oct','أكتوبر'), date:'2026-10-14', when:L('Wed 14 Oct · 10:00–11:00 Gulf · Zoom','الأربعاء 14 أكتوبر · 10:00–11:00 بتوقيت الخليج · Zoom'), topic:L('Topic: “Review my one-page project brief” · requested Mon 5 Oct','الموضوع: «مراجعة موجز المشروع» · طُلبت الإثنين 5 أكتوبر') }
    };
    const SEEDLOG = { id:'g1', booking:'B1', mentee:'saeed', no:1, date:'2026-09-28', saved:L('Saved Mon 28 Sep 2026 · 13:10 Gulf','حُفظ الإثنين 28 سبتمبر 2026 · 13:10 بتوقيت الخليج'),
      goal:L('Lead a small exhibition project by Q2 2027','قيادة مشروع معرض صغير بحلول الربع الثاني من 2027'),
      reality:L('Strong content skills, limited budget experience','مهارات قوية في المحتوى، وخبرة محدودة في الميزانيات'),
      options:L('Shadow the finance lead; take C16','مرافقة مسؤول المالية؛ والالتحاق بالدورة C16'),
      way:L('Enrol in C16 this week; draft a one-page project brief before session 2','التسجيل في C16 هذا الأسبوع؛ وكتابة موجز مشروع من صفحة واحدة قبل الجلسة 2') };
    const logs = [SEEDLOG].concat(S.logs || []);
    const GC = ['#1D1650','#CD3151','#E35E3C','#D63539'];
    const GK = [L('Goal','الهدف'), L('Reality','الواقع'), L('Options','الخيارات'), L('Way forward','الطريق إلى الأمام')];
    const GL = ar ? ['ه','و','خ','ط'] : ['G','R','O','W'];
    const qOf = (g) => [g.goal, g.reality, g.options, g.way].map((v, i) => ({ v, k:GK[i], L:GL[i], c:GC[i] }));
    const mName = { saeed:t.nmSaeed, fatima:t.nmFatima, khalifa:t.nmKhalifa };
    const dShort = (iso) => { const d = new Date(iso + 'T00:00:00Z'); const M = ar ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return { day: String(d.getUTCDate()).padStart(2,'0'), mon: M[d.getUTCMonth()], full: d.getUTCDate() + ' ' + M[d.getUTCMonth()] + ' ' + d.getUTCFullYear() }; };

    const bk = S.bk;
    const accepted = Object.keys(S.apps).filter(k => S.apps[k] === 'accepted');
    const stTag = (st) => ({ requested:[L('Requested','بانتظار التأكيد'),'warn'], confirmed:[L('Confirmed','مؤكدة'),'info'], completed:[L('Completed','مكتملة'),'ok'], cancelled:[L('Cancelled','ملغاة'),'bad'], no_show:[L('No-show','لم يحضر'),'mut'] })[st];
    const hasLogFor = (id) => logs.some(l => l.booking === id);
    const STARS = (n) => [1,2,3,4,5].map(i => i <= n ? 'currentColor' : 'none');
    const openDlg = (k, target) => this.setState({ dlg:k, target: target || null, reason:'', rTried:false, fb:{ att: k === 'noshow' ? 'no_show' : 'attended', rating:0, note:'', tried:false }, gw:null });
    const showToast = (title, msg, act, actLabel) => { this.setState({ toast:{ title, msg, act, actLabel } }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:null }), 6000); };
    const sessTitle = (id) => L('Session ' + BK[id].no + ' · Saeed Al Hammadi', 'الجلسة ' + BK[id].no + ' · سعيد الحمادي');
    const mkRow = (id) => {
      const b = bk[id], tg = stTag(b.st);
      return { id, day:BK[id].day, mon:BK[id].mon, title:sessTitle(id), when:BK[id].when, topic: b.st === 'requested' ? BK[id].topic : '', tag:tg[0], tagCls:tg[1],
        isReq: b.st === 'requested', canJoin: b.st === 'confirmed', joinHref:'/mentoring/session/' + id,
        rated: !!b.rating, stars: STARS(b.rating || 0), rateAria: L('Rated ' + b.rating + ' of 5', 'التقييم ' + b.rating + ' من 5'),
        hasLog: hasLogFor(id), needLog: b.st === 'completed' && !hasLogFor(id),
        confirm: () => { set({ bk:{ ...bk, [id]:{ ...b, st:'confirmed' } } }); showToast(L('Session confirmed','تم تأكيد الجلسة'), L('Saeed has been notified. Wed 14 Oct · 10:00 Gulf.','تم إبلاغ سعيد. الأربعاء 14 أكتوبر · 10:00 بتوقيت الخليج.')); },
        cancel: () => openDlg('cancel', id), feedback: () => openDlg('feedback', id), noshow: () => openDlg('noshow', id),
        readLog: () => { const lg = logs.find(l => l.booking === id); set({ tab:'grow', selLog: lg ? lg.id : 'g1' }); },
        writeLog: () => openDlg('grow', id) };
    };
    const upIds = ['B2','B4'].filter(id => bk[id].st === 'confirmed' || bk[id].st === 'requested');
    const pastIds = ['B4','B2','B1'].filter(id => ['completed','no_show','cancelled'].includes(bk[id].st));
    const upcomingRows = upIds.map(mkRow), pastRows = pastIds.map(mkRow);
    const completed = Object.keys(bk).filter(k => bk[k].st === 'completed');
    const pendingIds = completed.filter(k => !hasLogFor(k));
    const nUp = Object.keys(bk).filter(k => bk[k].st === 'confirmed').length;
    const nReq = Object.keys(bk).filter(k => bk[k].st === 'requested').length;

    /* ---------- header ---------- */
    const HD = {
      overview:[L('Good morning, Dr. Hessa','صباح الخير، د. حصة'), L('Your mentees, applications and sessions across Elevate 2026.','متدرّبوك وطلبات الإرشاد وجلساتك في إرتقاء 2026.')],
      mentees:[L('Mentees','المتدرّبون'), L('Everyone you mentor, their registration answers, sessions and GROW logs.','كل من ترشدينهم: إجابات التسجيل والجلسات وسجلات GROW.')],
      sessions:[L('Sessions','الجلسات'), L('Confirm requests, join sessions and record the outcome afterwards.','أكّدي الطلبات، وانضمي إلى الجلسات، وسجّلي النتيجة بعدها.')],
      grow:[L('GROW logs','سجلات GROW'), L('One log per session — Goal, Reality, Options, Way forward. Locked once saved.','سجل واحد لكل جلسة — الهدف، الواقع، الخيارات، الطريق إلى الأمام. يُقفل بعد الحفظ.')],
      profile:[L('Profile','الملف الشخصي'), L('What mentees see when they browse and match with mentors.','ما يراه المتدرّبون عند تصفّح المرشدين والمطابقة معهم.')]
    };
    const hd = { h: HD[tab][0], p: HD[tab][1] };
    const tabKeys = ['overview','mentees','sessions','grow','profile'];
    const tabCnt = { mentees: String(1 + accepted.length), sessions: String(nUp + nReq), grow: String(logs.length) };
    const tabs = tabKeys.map((k, i) => ({ label:t.tabs[i], cls: k === tab ? 'on' : '', sel: k === tab ? 'true' : 'false', cnt: tabCnt[k] || false, pick: () => set({ tab:k }) }));

    /* ---------- overview ---------- */
    const w = { ey: L('Next session · in 6 days','الجلسة القادمة · بعد 6 أيام'), h: L('Session 2 with Saeed is confirmed','الجلسة 2 مع سعيد مؤكدة'),
      p: L('Monday 12 Oct, 11:00–12:00 Gulf. His way forward from session 1: enrol in C16 and draft a one-page project brief.','الإثنين 12 أكتوبر، 11:00–12:00 بتوقيت الخليج. خطته من الجلسة الأولى: التسجيل في C16 وكتابة موجز مشروع من صفحة واحدة.'),
      cta: t.room, cta2: L('Read session 1 GROW log','اقرأ سجل GROW للجلسة 1') };
    const KI = { users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8', cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 14h3v3H8z', done:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3', pen:'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' };
    const kpis = [
      { l:L('Mentees','المتدرّبون'), v:String(1 + accepted.length), n:L('Elevate 2026','إرتقاء 2026'), cls:'k-ink', d:KI.users },
      { l:L('Upcoming','القادمة'), v:String(nUp), n: nReq ? L('+ ' + nReq + ' request to confirm','+ ' + nReq + ' طلب بانتظار التأكيد') : L('all confirmed','كلها مؤكدة'), cls:'k-rasp', d:KI.cal },
      { l:L('Completed sessions','الجلسات المكتملة'), v:String(completed.length), n:L('average rating 5.0','متوسط التقييم 5.0'), cls:'k-yel', d:KI.done },
      { l:L('Pending logs','السجلات المعلّقة'), v:String(pendingIds.length), n: pendingIds.length ? L('write within 48 hours','اكتبيها خلال 48 ساعة') : L('all GROW logs written','كل سجلات GROW مكتوبة'), cls:'k-red', d:KI.pen }
    ];
    const apps = Object.keys(APPS).map(k => { const a = APPS[k], st = S.apps[k]; return { ...a, meta: a.sub + ' · ' + a.submitted, site:L('Elevate 2026','إرتقاء 2026'), pending: st === 'pending', accepted: st === 'accepted', declined: st === 'declined',
      resTx: st === 'accepted' ? L(a.name + ' is now your mentee. They can book from your free slots.', a.name + ' أصبح ضمن متدرّبيك ويمكنه الحجز من أوقاتك المتاحة.') : L('Declined — the mentee has been notified.','تم الاعتذار — أُبلغ المتدرّب.'),
      accept: () => { set({ apps:{ ...S.apps, [k]:'accepted' } }); showToast(L('Application accepted','تم قبول الطلب'), L(a.name + ' has been added to your mentees.','أُضيف ' + a.name + ' إلى متدرّبيك.')); },
      decline: () => openDlg('decline', k) }; });
    const nPend = Object.values(S.apps).filter(s => s === 'pending').length;
    const apTag = nPend ? L(nPend + ' awaiting you', nPend + ' بانتظارك') : L('All answered','تم الرد على الكل');

    const SAEED = { key:'saeed', name:t.nmSaeed, ini:'SA', c:'#CD3151', sub:L('Elevate 2026 · matched 20 Sep','إرتقاء 2026 · مطابقة 20 سبتمبر'), site:L('Elevate 2026','إرتقاء 2026'), matchTag:L('AI match · 87%','مطابقة ذكية · 87%'),
      matched:L('Specialist, DCT Culture · matched Sun 20 Sep 2026','أخصائي، قطاع الثقافة · تمت المطابقة الأحد 20 سبتمبر 2026'), regDate:L('Submitted Sun 20 Sep 2026','أُرسل الأحد 20 سبتمبر 2026'),
      goals:L('Lead a small exhibition project by Q2 2027 and get better at planning budgets and timelines with partners.','قيادة مشروع معرض صغير بحلول الربع الثاني من 2027، وتحسين التخطيط للميزانيات والجداول الزمنية مع الشركاء.'),
      years:L('1–2 years','1–2 سنة'), areas:[cat(2), cat(0)], lang:L('Arabic and English','العربية والإنجليزية') };
    const lastDone = completed.includes('B2') ? L('12 Oct','12 أكتوبر') : completed.includes('B1') ? L('28 Sep','28 سبتمبر') : '—';
    const mentees = [SAEED].concat(accepted.map(k => ({ key:k, name:APPS[k].name, ini:APPS[k].ini, c:APPS[k].c, sub:L('Elevate 2026 · matched today','إرتقاء 2026 · مطابقة اليوم'), site:L('Elevate 2026','إرتقاء 2026'), matchTag:L('Accepted application','طلب مقبول'),
      matched:APPS[k].sub + ' · ' + L('accepted Tue 6 Oct 2026','قُبل الثلاثاء 6 أكتوبر 2026'), regDate:APPS[k].submitted, goals:APPS[k].goals, years:APPS[k].years, areas:APPS[k].areas, lang:APPS[k].lang })));
    const selM = mentees.find(m => m.key === S.selMentee) || mentees[0];
    const menteeCards = mentees.map(m => { const isS = m.key === 'saeed'; return { ...m, done: isS ? String(completed.length) : '0', last: isS ? lastDone : '—', pend: isS ? String(pendingIds.length) : '0', cls: m.key === selM.key ? 'on' : '', sel: m.key === selM.key ? 'true' : 'false', pick: () => set({ selMentee:m.key }) }; });
    const isSaeed = selM.key === 'saeed';
    const smSessions = isSaeed ? ['B1','B2','B4'].map(id => { const r = mkRow(id); const c = { completed:'#15801A', confirmed:'#3B2F92', requested:'#E0A800', cancelled:'#B42318', no_show:'#6B6259' }[bk[id].st]; return { ...r, c, title: L('Session ' + BK[id].no, 'الجلسة ' + BK[id].no), tag: r.tag }; }) : [];
    const smLogs = logs.filter(l => l.mentee === selM.key).map(g => ({ title: L('Session ' + g.no + ' · ' + dShort(g.date).full, 'الجلسة ' + g.no + ' · ' + dShort(g.date).full), saved:g.saved, q:qOf(g) }));
    const sm = { ...selM, done: isSaeed ? String(completed.length) : '0', up: isSaeed ? String(nUp + nReq) : '0', pend: isSaeed ? String(pendingIds.length) : '0',
      hasSessions: smSessions.length > 0, noSessions: smSessions.length === 0, sessions: smSessions, noSesSub: L(selM.name + ' can now book from your free slots.','يمكن لـ ' + selM.name + ' الآن الحجز من أوقاتك المتاحة.'),
      logsN: String(smLogs.length), noLogs: smLogs.length === 0 };
    sm.logs = smLogs;

    const DAYS = ar ? ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'] : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const availRows = DAYS.map((d, i) => ({ day:d, hrs: i <= 4 ? '10:00–13:00' : L('Unavailable','غير متاحة'), cls: i <= 4 ? '' : 'off' }));

    /* ---------- sessions ---------- */
    const chipDefs = [['all', upIds.concat(pastIds)], ['upcoming', upIds.filter(i => bk[i].st === 'confirmed')], ['requests', upIds.filter(i => bk[i].st === 'requested')], ['past', pastIds]];
    const sesChips = chipDefs.map((c, i) => ({ label:t.chips[i], n:String(c[1].length), cls: S.sesFilter === c[0] ? 'on' : '', sel: S.sesFilter === c[0] ? 'true' : 'false', pick: () => set({ sesFilter:c[0] }) }));
    const curIds = chipDefs.find(c => c[0] === S.sesFilter)[1];
    const sesRows = curIds.map(mkRow);
    const sesTitle = { all:L('All sessions','كل الجلسات'), upcoming:L('Upcoming sessions','الجلسات القادمة'), past:L('Past sessions','الجلسات السابقة'), requests:L('Booking requests','طلبات الحجز') }[S.sesFilter];

    /* ---------- GROW ---------- */
    const logRows = logs.map(g => { const d = dShort(g.date); return { day:d.day, mon:d.mon, title: L('Session ' + g.no + ' · ', 'الجلسة ' + g.no + ' · ') + mName[g.mentee], sub: g.saved, cls: g.id === S.selLog ? 'on' : '', sel: g.id === S.selLog ? 'true' : 'false', pick: () => set({ selLog:g.id }) }; });
    const cur = logs.find(g => g.id === S.selLog) || logs[0];
    const lv = { title: L('Session ' + cur.no + ' · ', 'الجلسة ' + cur.no + ' · ') + mName[cur.mentee], sub: dShort(cur.date).full + ' · ' + cur.saved, q:qOf(cur),
      notified: L(mName[cur.mentee] + ' was notified when this log was saved and can read it in their mentoring page. Admins see log counts only.','أُبلغ ' + mName[cur.mentee] + ' عند حفظ هذا السجل ويمكنه قراءته في صفحة الإرشاد. يرى المسؤولون عدد السجلات فقط.') };
    const pendingLogs = pendingIds.map(id => ({ title: L('Session ' + BK[id].no + ' · Saeed Al Hammadi · ' + dShort(BK[id].date).full, 'الجلسة ' + BK[id].no + ' · سعيد الحمادي · ' + dShort(BK[id].date).full), write: () => openDlg('grow', id) }));

    /* ---------- profile ---------- */
    const PF0 = { title:L('Director, Museums Strategy','مديرة استراتيجية المتاحف'),
      bioEn:'Hessa leads museum strategy at DCT Abu Dhabi, shaping how the emirate’s new museums plan collections, audiences and partnerships. She has mentored more than 40 emerging museum professionals and enjoys turning big ideas into practical project plans.',
      bioAr:'تقود د. حصة استراتيجية المتاحف في دائرة الثقافة والسياحة – أبوظبي، وتسهم في رسم خطط المقتنيات والجماهير والشراكات لمتاحف الإمارة الجديدة. أرشدت أكثر من 40 من المهنيين الناشئين في قطاع المتاحف، وتحب تحويل الأفكار الكبيرة إلى خطط مشاريع عملية.',
      cats:[2,0], li:'https://www.linkedin.com/in/hessa-alnuaimi', photo:'', tried:false };
    const P = S.pf || PF0;
    const setP = (o) => set({ pf:{ ...P, ...o } });
    const BIO_MAX = 600;
    const tErr = P.tried && (!P.title.trim() || P.title.length > 160);
    const beErr = P.tried && (!P.bioEn.trim() || P.bioEn.length > BIO_MAX);
    const baErr = P.tried && (!P.bioAr.trim() || P.bioAr.length > BIO_MAX);
    const cErr = P.tried && (P.cats.length < 1 || P.cats.length > 3);
    const lErr = P.tried && !/^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]{3,100}\/?$/.test(P.li.trim());
    const nErrs = [tErr, beErr, baErr, cErr, lErr].filter(Boolean).length;
    const cntCls = (n, max) => n > max ? 'over' : n > max * 0.9 ? 'warn' : '';
    const pf = {
      name: L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'), title:P.title, bioEn:P.bioEn, bioAr:P.bioAr, li:P.li,
      tErr, tCls: tErr ? 'is-error' : '', beErr, beCls: beErr ? 'is-error' : '', baErr, baCls: baErr ? 'is-error' : '', cErr, lErr, lCls: lErr ? 'is-error' : '',
      beMsg: !P.bioEn.trim() ? L('Add a short English bio.','أضيفي نبذة قصيرة بالإنجليزية.') : L('Keep the bio under 600 characters.','اجعلي النبذة أقل من 600 حرف.'),
      baMsg: !P.bioAr.trim() ? L('Add a short Arabic bio.','أضيفي نبذة قصيرة بالعربية.') : L('Keep the bio under 600 characters.','اجعلي النبذة أقل من 600 حرف.'),
      cMsg: P.cats.length < 1 ? L('Choose at least one area.','اختاري مجالاً واحداً على الأقل.') : L('Choose up to 3 areas.','اختاري 3 مجالات كحد أقصى.'),
      beLen: fmtLen(P.bioEn.length, BIO_MAX), beCnt: cntCls(P.bioEn.length, BIO_MAX), baLen: fmtLen(P.bioAr.length, BIO_MAX), baCnt: cntCls(P.bioAr.length, BIO_MAX),
      catCnt: P.cats.length + ' / 3',
      cats: CATS.map((c, i) => { const on = P.cats.includes(i); return { label: L(c[0], c[1]), cls: on ? 'on' : '', sel: on ? 'true' : 'false', tog: () => setP({ cats: on ? P.cats.filter(x => x !== i) : P.cats.concat(i) }) }; }),
      selCats: P.cats.map(i => cat(i)), pvBio: (ar ? P.bioAr : P.bioEn) || '—',
      hasPhoto: !!P.photo, photoNote: P.photo ? L(P.photo + ' selected · cropped to the brand shape on save','تم اختيار ' + P.photo + ' · تُقصّ بالشكل المعتمد عند الحفظ') : L('JPG or PNG, up to 2 MB. Until you add one, mentees see your initials.','JPG أو PNG بحجم أقصى 2 ميغابايت. يرى المتدرّبون الأحرف الأولى من اسمك حتى تضيفي صورة.'),
      onPhoto: (e) => { const f = e.target.files && e.target.files[0]; setP({ photo: f ? f.name : '' }); }, rmPhoto: () => setP({ photo:'' }),
      onTitle: (e) => setP({ title:e.target.value }), onBioEn: (e) => setP({ bioEn:e.target.value }), onBioAr: (e) => setP({ bioAr:e.target.value }), onLi: (e) => setP({ li:e.target.value }),
      showErr: nErrs > 0, errTitle: L(nErrs + (nErrs === 1 ? ' field needs attention' : ' fields need attention'), (nErrs === 1 ? 'حقل واحد يحتاج' : nErrs + ' حقول تحتاج') + ' إلى مراجعة'),
      reset: () => set({ pf:null }),
      save: () => { const n = { ...P, tried:true }; const ok = n.title.trim() && n.title.length <= 160 && n.bioEn.trim() && n.bioEn.length <= BIO_MAX && n.bioAr.trim() && n.bioAr.length <= BIO_MAX && n.cats.length >= 1 && n.cats.length <= 3 && /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]{3,100}\/?$/.test(n.li.trim());
        if (ok) { set({ pf:{ ...n, tried:false } }); showToast(L('Profile saved','تم حفظ الملف'), L('Mentees in Elevate 2026 now see your updated profile.','يرى متدرّبو إرتقاء 2026 ملفك المحدّث الآن.')); } else set({ pf:n }); }
    };

    /* ---------- dialogs ---------- */
    const close = () => set({ dlg:'none' });
    const target = S.target;
    const R_MAX = 500, N_MAX = 1000, G_MAX = 2000;
    const rLong = S.reason.length > R_MAX;
    const fbBk = (dlgKind === 'feedback' || dlgKind === 'noshow' || dlgKind === 'cancel') ? (target || 'B2') : 'B2';
    const F = S.fb;
    const rateWords = ar ? ['','ضعيفة','مقبولة','جيدة','جيدة جداً','ممتازة'] : ['','Poor','Fair','Good','Very good','Excellent'];
    const gwBk = dlgKind === 'grow' ? (target || 'B2') : 'B2';
    const G0 = { mentee:'saeed', no: String(BK[gwBk] ? BK[gwBk].no : 2), date: BK[gwBk] ? BK[gwBk].date : '2026-10-12', goal:'', reality:'', options:'', way:'', tried:false };
    const G = S.gw || G0;
    const setG = (o) => set({ gw:{ ...G, ...o } });
    const noN = parseInt(G.no, 10);
    const dup = logs.some(l => l.mentee === G.mentee && String(l.no) === String(noN));
    const noErr = G.tried && (!(noN >= 1 && noN <= 20) || dup);
    const dErr = G.tried && !G.date;
    const GF = [['goal', L('What does the mentee want to achieve?','ما الذي يريد المتدرّب تحقيقه؟')], ['reality', L('Where are they now? Strengths, gaps, constraints.','أين هو الآن؟ نقاط القوة والفجوات والقيود.')], ['options', L('What could they do? List the routes you discussed.','ما الذي يمكنه فعله؟ اذكري الخيارات التي ناقشتماها.')], ['way', L('What will they do next, and by when?','ما الخطوة التالية، ومتى؟')]];
    const gf = GF.map((f, i) => { const v = G[f[0]]; const err = G.tried && (!v.trim() || v.length > G_MAX); return { id:'gw-' + f[0], k:GK[i], L:GL[i], c:GC[i], hint:f[1], v, len:fmtLen(v.length, G_MAX), cnt:cntCls(v.length, G_MAX), err, cls: err ? 'is-error' : '', msg: !v.trim() ? L(GK[i] + ' is required.','حقل «' + GK[i] + '» مطلوب.') : L('Keep it under 2,000 characters.','الحد الأقصى 2,000 حرف.'), on: (e) => setG({ [f[0]]: e.target.value }) }; });
    const dl = {
      decline: dlgKind === 'decline', cancel: dlgKind === 'cancel', feedback: dlgKind === 'feedback' || dlgKind === 'noshow', grow: dlgKind === 'grow',
      dcTitle: L('Decline ' + APPS[target && APPS[target] ? target : 'fatima'].name + '’s application?', 'الاعتذار عن طلب ' + APPS[target && APPS[target] ? target : 'fatima'].name + '؟'),
      reason:S.reason, rLen:fmtLen(S.reason.length, R_MAX), rCnt:cntCls(S.reason.length, R_MAX), rErr: S.rTried && rLong, rCls: S.rTried && rLong ? 'is-error' : '',
      onReason: (e) => set({ reason:e.target.value }),
      doDecline: () => { if (rLong) return set({ rTried:true }); const k = target && APPS[target] ? target : 'fatima'; set({ apps:{ ...S.apps, [k]:'declined' }, dlg:'none' }); showToast(L('Application declined','تم الاعتذار عن الطلب'), L(APPS[k].name + ' has been notified and can choose another mentor.','أُبلغ ' + APPS[k].name + ' ويمكنه اختيار مرشد آخر.')); },
      cnTitle: bk[fbBk] && bk[fbBk].st === 'requested' ? L('Decline this booking request?','رفض طلب الحجز هذا؟') : L('Cancel session ' + BK[fbBk].no + '?','إلغاء الجلسة ' + BK[fbBk].no + '؟'),
      cnSub: L('Saeed Al Hammadi · ', 'سعيد الحمادي · ') + BK[fbBk].when,
      cnBtn: bk[fbBk] && bk[fbBk].st === 'requested' ? L('Decline request','رفض الطلب') : L('Cancel session','إلغاء الجلسة'),
      doCancel: () => { if (rLong) return set({ rTried:true }); set({ bk:{ ...bk, [fbBk]:{ ...bk[fbBk], st:'cancelled' } }, dlg:'none' }); showToast(L('Session cancelled','أُلغيت الجلسة'), L('Saeed has been notified and the slot is free again.','أُبلغ سعيد وأصبح الموعد متاحاً من جديد.')); },
      fbSub: sessTitle(fbBk) + ' · ' + BK[fbBk].when,
      att: [['attended', L('Attended','حضر'), L('The session took place','عُقدت الجلسة')], ['no_show', L('No-show','لم يحضر'), L('The mentee didn’t join','لم ينضم المتدرّب')]].map(o => ({ label:o[1], sub:o[2], cls: F.att === o[0] ? 'on' : '', sel: F.att === o[0] ? 'true' : 'false', pick: () => set({ fb:{ ...F, att:o[0] } }) })),
      rate: [1,2,3,4,5].map(i => ({ cls: i <= F.rating ? 'on' : '', fill: i <= F.rating ? 'currentColor' : 'none', sel: i === F.rating ? 'true' : 'false', aria: L(i + ' of 5 — ' + rateWords[i], i + ' من 5 — ' + rateWords[i]), pick: () => set({ fb:{ ...F, rating:i } }) })),
      rateTx: F.rating ? rateWords[F.rating] : L('Not rated yet','لم تُقيَّم بعد'), rateErr: F.tried && !F.rating,
      note:F.note, nLen:fmtLen(F.note.length, N_MAX), nCnt:cntCls(F.note.length, N_MAX), nErr: F.tried && F.note.length > N_MAX, nCls: F.tried && F.note.length > N_MAX ? 'is-error' : '',
      onNote: (e) => set({ fb:{ ...F, note:e.target.value } }),
      doFeedback: () => { if (!F.rating || F.note.length > N_MAX) return set({ fb:{ ...F, tried:true } });
        const st = F.att === 'attended' ? 'completed' : 'no_show';
        set({ bk:{ ...bk, [fbBk]:{ ...bk[fbBk], st, rating:F.rating, att:F.att } }, dlg:'none', sesFilter:'past' });
        if (st === 'completed') showToast(L('Feedback saved','تم حفظ الملاحظات'), L('Session ' + BK[fbBk].no + ' is complete. Write the GROW log while it’s fresh.','اكتملت الجلسة ' + BK[fbBk].no + '. اكتبي سجل GROW والتفاصيل حاضرة في ذهنك.'), () => openDlg('grow', fbBk), t.writeLog);
        else showToast(L('Marked as no-show','سُجّلت كعدم حضور'), L('Saeed has been notified. The programme team can see this.','أُبلغ سعيد. يمكن لفريق البرنامج الاطلاع على ذلك.')); },
      gwWarn: L('Once you save, this log can’t be edited or deleted. ' + mName[G.mentee] + ' is notified by e-mail and can read it in their mentoring page.','بعد الحفظ لا يمكن تعديل هذا السجل أو حذفه. يُبلَّغ ' + mName[G.mentee] + ' عبر البريد الإلكتروني ويمكنه قراءته في صفحة الإرشاد.'),
      gMentee:G.mentee, noFatima: !accepted.includes('fatima'), noKhalifa: !accepted.includes('khalifa'),
      onMentee: (e) => setG({ mentee:e.target.value }), gNo:G.no, onNo: (e) => setG({ no:e.target.value }), gDate:G.date, onDate: (e) => setG({ date:e.target.value }),
      noErr, noCls: noErr ? 'is-error' : '', noMsg: dup ? L('A log for session ' + noN + ' already exists and can’t be changed.','يوجد سجل للجلسة ' + noN + ' ولا يمكن تغييره.') : L('Enter a session number from 1 to 20.','أدخلي رقم جلسة من 1 إلى 20.'),
      dErr, dCls: dErr ? 'is-error' : '', gf,
      doGrow: () => { const ok = noN >= 1 && noN <= 20 && !dup && G.date && GF.every(f => G[f[0]].trim() && G[f[0]].length <= G_MAX);
        if (!ok) return setG({ tried:true });
        const id = 'g' + (logs.length + 1); const now = L('Saved Tue 6 Oct 2026 · 13:05 Gulf','حُفظ الثلاثاء 6 أكتوبر 2026 · 13:05 بتوقيت الخليج');
        const bid = Object.keys(BK).find(k => BK[k].no === noN) || null;
        const nl = { id, booking: G.mentee === 'saeed' ? bid : null, mentee:G.mentee, no:noN, date:G.date, saved:now, goal:G.goal.trim(), reality:G.reality.trim(), options:G.options.trim(), way:G.way.trim() };
        set({ logs:(S.logs || []).concat(nl), selLog:id, tab:'grow', dlg:'none', gw:null });
        showToast(L('GROW log saved and locked','حُفظ سجل GROW وأُقفل'), L(mName[G.mentee] + ' has been notified and can read it now.','أُبلغ ' + mName[G.mentee] + ' ويمكنه قراءته الآن.')); }
    };

    const toast = S.toast ? { on:true, title:S.toast.title, msg:S.toast.msg, hasAct: !!S.toast.act, act: () => { const a = S.toast.act; set({ toast:null }); a && a(); }, actLabel:S.toast.actLabel || '', close: () => set({ toast:null }) } : { on:false, title:'', msg:'', hasAct:false, act:null, actLabel:'', close:null };

    const tabSeg = tabKeys.map((k, i) => ({ label:['Overview','Mentees','Sessions','GROW','Profile'][i], cls: k === tab ? 'is-on' : '', pick: () => set({ tab:k }) }));
    const dlgSeg = [['none','No dialog'],['decline','Decline'],['feedback','Feedback'],['cancel','Cancel'],['grow','GROW log']].map(x => ({ label:x[1], cls: (dlgKind === x[0] || (x[0] === 'feedback' && dlgKind === 'noshow')) ? 'is-on' : '', pick: () => x[0] === 'none' ? set({ dlg:'none' }) : openDlg(x[0], x[0] === 'decline' ? 'fatima' : 'B2') }));

    return {
      lang, dir: ar ? 'rtl' : 'ltr', t, sh, hd, tabs, w, kpis, apps, apTag, apTagCls: nPend ? 'warn' : 'ok',
      upcomingRows, pastRows, noUpcoming: upcomingRows.length === 0, menteeCards, menteeCount: String(mentees.length), sm, availRows,
      sesChips, sesRows, sesTitle, noSesRows: sesRows.length === 0, logRows, lv, pendingLogs, pf, dl, toast,
      isOverview: tab === 'overview', isMentees: tab === 'mentees', isSessions: tab === 'sessions', isGrow: tab === 'grow', isProfile: tab === 'profile',
      goGrow: () => set({ tab:'grow', selLog:'g1' }), goSessions: () => set({ tab:'sessions' }), goMentees: () => set({ tab:'mentees' }),
      openGrowNew: () => openDlg('grow', pendingIds[0] || 'B2'), closeDlg: close,
      tabSeg, dlgSeg,
      protoCls: this.props.proto ? 'proto' : '', route: ROUTES[tab] || '/mentor',
      enCls: ar ? '' : 'is-on', arCls: ar ? 'is-on' : '',
      setEn: () => set({ locale:'en' }), setAr: () => set({ locale:'ar' }), toggleLang: () => set({ locale: ar ? 'en' : 'ar' })
    };
  }
}
