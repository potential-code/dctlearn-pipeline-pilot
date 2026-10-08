// Ported verbatim from the Claude Design artboard PX-Notifications (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'
import { shellHelper } from '@/components/shell/shellHelper'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, who:null, read:{}, filter:'all', toast:'' }; }

  /* ===== SHELL HELPER (copy verbatim into every signed-in page) =====
     role: learner | mentor | judge | sub_admin | admin
     active: key of the current nav item; site: microsite id (learner, sub_admin)
     crumbs: [{label, href?}] — the last item is the current page */
  shell(ar, role, active, site, crumbs) {
    return shellHelper(ar, role, active, site, crumbs)
  }
  /* ===== END SHELL HELPER ===== */

  flash(msg){ this.setState({ toast: msg }); clearTimeout(this._tt); this._tt = setTimeout(() => this.setState({ toast:'' }), 2400); }

  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const who = this.state.who || this.props.who || 'learner';
    const L = (en, a) => ar ? a : en;
    const t = ar ? { spec:'الإشعارات', ey:'كل المراكز', h1:'الإشعارات', prefs:'تفضيلات الإشعارات', show:'عرض', markAll:'تعليم الكل كمقروء', markRead:'تعليم كمقروء', emptyH:'لا جديد', emptyP:'قرأت كل إشعاراتك.', showAll:'عرض كل الإشعارات', sumH:'حسب النوع', emH:'نسخة بالبريد', allRead:'تم تعليم كل الإشعارات كمقروءة', unreadSr:'غير مقروء', readSr:'مقروء' }
                 : { spec:'Notifications', ey:'Across your hubs', h1:'Notifications', prefs:'Notification preferences', show:'Show', markAll:'Mark all as read', markRead:'Mark as read', emptyH:'You’re all caught up', emptyP:'You’ve read every notification.', showAll:'Show all notifications', sumH:'By type', emH:'Copies by e-mail', allRead:'All notifications marked as read', unreadSr:'unread', readSr:'read' };
    const sh = who === 'sub_admin' ? this.shell(ar, 'sub_admin', '', 'znm', [ { label:L('Zayed National Museum','متحف زايد الوطني'), href:'/znm/admin' }, { label:L('Notifications','الإشعارات') } ])
                                   : this.shell(ar, 'learner', '', 'employees', [ { label:L('Learning hubs','مراكز التعلّم'), href:'/platforms' }, { label:L('Notifications','الإشعارات') } ]);
    const TY = {
      remind:[L('Session reminder','تذكير بجلسة'),'#3B2F92','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2','info'],
      grow:[L('GROW log added','ملاحظات GROW'),'#CD3151','M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5','red'],
      cert:[L('Certificate issued','إصدار شهادة'),'#15801A','M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1','ok'],
      invite:[L('Invitation','دعوة'),'#E35E3C','M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6','warn'],
      booking:[L('Booking confirmed','تأكيد حجز'),'#1D1650','M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 15l2 2 4-4','info'],
      resok:[L('Resource approved','اعتماد مورد'),'#15801A','M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 14l2 2 4-4','ok'],
      respend:[L('Resource pending','مورد قيد المراجعة'),'#8A5A00','M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v3l2 1','warn'],
      rec:[L('Recording available','تسجيل متاح'),'#6D7782','M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z','mut']
    };
    // id, type, grp(0 today,1 this week,2 earlier), when, site, title, body, href, unread
    const N = who === 'sub_admin' ? [
      ['k1','remind',0,L('08:00','08:00'),L('Zayed National Museum','متحف زايد الوطني'),L('Museum Safety Briefing starts in 1 hour','إحاطة السلامة في المتحف تبدأ بعد ساعة'),L('Today · 09:00–10:00 Gulf · Zayed National Museum, Saadiyat. 2 members registered.','اليوم · 09:00–10:00 بتوقيت الخليج · متحف زايد الوطني، السعديات. عضوان مسجلان.'),'/znm/hub/workshops',true],
      ['k2','respend',1,L('Mon 5 Oct','الإثنين 5 أكتوبر'),L('Zayed National Museum','متحف زايد الوطني'),L('Ticketing FAQ sheet is waiting for review','ورقة الأسئلة الشائعة للتذاكر بانتظار المراجعة'),L('You submitted it on 5 Oct. The DCT Learn team usually reviews links within 2 working days.','أرسلتها في 5 أكتوبر. يراجع فريق DCT Learn الروابط عادة خلال يومي عمل.'),'/znm/admin/resources',true],
      ['k3','resok',2,L('Mon 28 Sep','الإثنين 28 سبتمبر'),L('Zayed National Museum','متحف زايد الوطني'),L('Resource approved: ZNM Visitor Code of Conduct','تم اعتماد المورد: مدونة سلوك زوار المتحف'),L('It is now visible to members on the Resources tab.','أصبح ظاهراً للأعضاء في قسم الموارد.'),'/znm/admin/resources',false],
      ['k4','invite',2,L('Wed 16 Sep','الأربعاء 16 سبتمبر'),L('Zayed National Museum','متحف زايد الوطني'),L('Reem Al Shamsi accepted your invitation','قبلت ريم الشامسي دعوتك'),L('She joined Zayed National Museum as a learner.','انضمت إلى متحف زايد الوطني كمتعلّمة.'),'/znm/admin/members',false]
    ] : [
      ['n1','remind',0,L('08:00','08:00'),L('Elevate 2026','إرتقاء 2026'),L('Mentoring Kick-off Session is on Thursday','جلسة انطلاق الإرشاد يوم الخميس'),L('Thu 8 Oct · 10:00–11:00 Gulf · Zoom. The join link opens 15 minutes before.','الخميس 8 أكتوبر · 10:00–11:00 بتوقيت الخليج · Zoom. يفتح الرابط قبل 15 دقيقة.'),'/elevate/hub/workshops',true],
      ['n2','grow',2,L('Mon 28 Sep','الإثنين 28 سبتمبر'),L('Elevate 2026','إرتقاء 2026'),L('Dr. Hessa Al Nuaimi added notes from session 1','أضافت د. حصة النعيمي ملاحظات الجلسة 1'),L('Way forward: enrol in Curating an Exhibition this week and draft a one-page project brief before session 2.','الخطوة التالية: التسجيل في دورة تنظيم المعارض هذا الأسبوع وكتابة موجز للمشروع قبل الجلسة 2.'),'/elevate/mentoring',true],
      ['n3','booking',2,L('Mon 28 Sep','الإثنين 28 سبتمبر'),L('Elevate 2026','إرتقاء 2026'),L('Session 2 with Dr. Hessa is confirmed','تم تأكيد الجلسة 2 مع د. حصة'),L('Mon 12 Oct · 11:00–12:00 Gulf · online session room.','الإثنين 12 أكتوبر · 11:00–12:00 بتوقيت الخليج · غرفة الجلسات.'),'/mentoring/session/B2',false],
      ['n4','invite',2,L('Tue 15 Sep','الثلاثاء 15 سبتمبر'),L('Elevate 2026','إرتقاء 2026'),L('You’re invited to Elevate 2026','أنت مدعو إلى إرتقاء 2026'),L('Layla Haddad invited you as a mentee. You accepted on 20 Sep.','دعتك ليلى حداد كمتدرّب، وقبلت الدعوة في 20 سبتمبر.'),'/elevate/dashboard',false],
      ['n5','rec',2,L('Fri 11 Sep','الجمعة 11 سبتمبر'),L('DCT Employees','موظفو الدائرة'),L('Recording available: Creative Economy Masterclass','التسجيل متاح: الصف المتقدم في الاقتصاد الإبداعي'),L('Watch the 2-hour session any time from Workshops.','شاهد الجلسة (ساعتان) في أي وقت من ورش العمل.'),'/employees/hub/workshops',false],
      ['n6','cert',2,L('Tue 25 Aug','الثلاثاء 25 أغسطس'),L('DCT Employees','موظفو الدائرة'),L('Your DCT World certificate is ready','شهادة عالم الدائرة جاهزة'),L('Serial DCT-2026-C01-000184. Download it or share it on LinkedIn.','الرقم DCT-2026-C01-000184. نزّلها أو شاركها على LinkedIn.'),'/employees/achievements',false]
    ];
    const read = this.state.read;
    const isUnread = (x) => x[8] && !read[x[0]];
    const filter = this.state.filter;
    const vis = N.filter(x => filter === 'all' || isUnread(x));
    const GR = [L('Today','اليوم'), L('This week','هذا الأسبوع'), L('Earlier','سابقاً')];
    const items = []; let g = -1;
    vis.forEach(x => { if (x[2] !== g) { g = x[2]; items.push({ isGrp:true, isRow:false, grp:GR[g] }); }
      const ty = TY[x[1]], u = isUnread(x);
      items.push({ isGrp:false, isRow:true, grp:'', type:ty[0], c:ty[1], d:ty[2], tagCls:ty[3], when:x[3], site:x[4], title:x[5], body:x[6], href:x[7], unread:u, cls: u ? 'unread' : '', srState: u ? ' (' + t.unreadSr + ')' : '',
        open: () => { const r = Object.assign({}, read); r[x[0]] = true; this.setState({ read:r }); }, mark: () => { const r = Object.assign({}, read); r[x[0]] = true; this.setState({ read:r }); } }); });
    const nUnread = N.filter(isUnread).length;
    const fmt = (n) => Number(n).toLocaleString(ar ? 'ar-AE' : 'en-US');
    const counts = {}; N.forEach(x => { counts[x[1]] = (counts[x[1]] || 0) + 1; });
    const legend = Object.keys(counts).map(k => ({ l:TY[k][0], c:TY[k][1], n:fmt(counts[k]) }));
    const allRead = () => { const r = {}; N.forEach(x => { r[x[0]] = true; }); return r; };
    return {
      lang, dir: ar?'rtl':'ltr', t, sh, protoCls: this.props.proto ? 'proto' : '', items, empty: vis.length === 0, legend,
      subL: nUnread ? fmt(nUnread) + L(' unread · reminders, mentor notes, certificates and invitations from all your hubs.',' غير مقروءة · تذكيرات وملاحظات المرشدين والشهادات والدعوات من كل مراكزك.') : L('Reminders, mentor notes, certificates and invitations from all your hubs.','تذكيرات وملاحظات المرشدين والشهادات والدعوات من كل مراكزك.'),
      prefHref: who === 'sub_admin' ? '/znm/admin' : '/employees/profile',
      emP: who === 'sub_admin' ? L('Resource reviews, register-interest forms and member updates are also sent to khalid.d@dctlearn.example.','تُرسل مراجعات الموارد ونماذج الاهتمام وتحديثات الأعضاء أيضاً إلى khalid.d@dctlearn.example.') : L('Session reminders, mentor notes and certificates are also e-mailed to saeed.h@dctlearn.example. Choose which ones in your profile.','تُرسل تذكيرات الجلسات وملاحظات المرشد والشهادات أيضاً إلى saeed.h@dctlearn.example. اختر ما يناسبك من ملفك الشخصي.'),
      filters: [['all',L('All','الكل') + ' · ' + fmt(N.length)],['unread',L('Unread','غير المقروءة') + ' · ' + fmt(nUnread)]].map(x => ({ label:x[1], cls: filter === x[0] ? 'is-on' : '', on: filter === x[0] ? 'true' : 'false', pick: () => this.setState({ filter:x[0] }) })),
      markAll: () => { this.setState({ read:allRead() }); this.flash(t.allRead); }, showAll: () => this.setState({ filter:'all' }),
      toast: this.state.toast || false,
      whoBtns: [['learner','Learner · Saeed'],['sub_admin','Sub admin · Khalid']].map(x => ({ label:x[1], cls: x[0] === who ? 'is-on' : '', pick: () => this.setState({ who:x[0], read:{}, filter:'all' }) })),
      stUnreadCls: nUnread ? 'is-on' : '', stAllReadCls: nUnread ? '' : 'is-on', stUnread: () => this.setState({ read:{} }), stAllRead: () => this.setState({ read:allRead() }),
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }), toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' })
    };
  }
}
