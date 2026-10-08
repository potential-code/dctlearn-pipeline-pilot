// Shared app-shell helper, ported verbatim from the Claude Design artboards ("SHELL HELPER, copy
// verbatim into every signed-in page"). Every signed-in page's logic calls it through this.shell().
// role: learner | mentor | judge | sub_admin | admin; active: current nav key; site: microsite id;
// crumbs: [{ label, href? }], the last item is the current page.
export function shellHelper(ar, role, active, site, crumbs) {
    const I = {
      home:'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
      book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
      cal:'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
      bot:'M12 8V4H8M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 13v2M15 13v2',
      spark:'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
      folder:'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      chat:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
      trophy:'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
      award:'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9 7 23l5-3 5 3-1.2-9.1',
      user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
      video:'M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
      clip:'M9 2h6v4H9zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6',
      flag:'M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1',
      sliders:'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
      scale:'M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z',
      chart:'M3 3v18h18M7 15v2M11 11v6M15 7v10M19 13v4',
      eye:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
      layout:'M3 3h18v18H3zM3 9h18M9 21V9',
      list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      form:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
      shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
      star:'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
      lang:'M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6'
    };
    const SITES = {
      employees:{ c:'#EE3E43', en:'DCT Employees', ar:'موظفو الدائرة', tabs:['courses','workshops','mentors','ai_coaches','ai_tools'], mentoring:false, competition:false },
      elevate:{ c:'#CD3151', en:'Elevate 2026', ar:'إرتقاء 2026', tabs:['mentors','workshops'], mentoring:true, competition:false, labels:{ workshops:['Sessions','الجلسات'] } },
      znm:{ c:'#3B2F92', en:'Zayed National Museum', ar:'متحف زايد الوطني', tabs:['courses','resources','workshops'], mentoring:false, competition:false, labels:{ courses:['ZNM Courses','دورات المتحف'], workshops:['Assessments','التقييمات'] } },
      zu:{ c:'#F7C337', en:'ZU 24-Hour Challenge', ar:'تحدي جامعة زايد', tabs:['courses'], mentoring:false, competition:true },
      museopro:{ c:'#E35E3C', en:'MuseoPro', ar:'ميوزيو برو', tabs:['courses','resources','mentors'], mentoring:false, competition:false, labels:{ mentors:['Trainers','المدربون'] } },
      nibras:{ c:'#2FC4DB', en:'Nibras — AI Champions', ar:'نبراس', tabs:['courses'], mentoring:false, competition:false },
      chkforum:{ c:'#6D7782', en:'Cultural Heritage Forum', ar:'منتدى التراث الثقافي', tabs:['courses'], mentoring:false, competition:false }
    };
    const TAB = { courses:['Courses','الدورات','book'], workshops:['Workshops','ورش العمل','cal'], mentors:['Mentors','المرشدون','users'], ai_coaches:['AI Coaches','المدربون الأذكياء','bot'], ai_tools:['AI Tools','أدوات الذكاء الاصطناعي','spark'], resources:['Resources','الموارد','folder'] };
    const L = (en, a) => ar ? a : en;
    const s = SITES[site] || SITES.employees;
    const p = site || 'employees';
    let nav = [], user = {}, hasSite = false, siteLabel = '';
    const it = (key, en, a, icon, href, cnt) => ({ link:true, group:false, key, label:L(en,a), d:I[icon], href, cnt: cnt || false });
    const grp = (en, a) => ({ link:false, group:true, label:L(en,a), href:'', d:'', cnt:false, key:'' });
    if (role === 'learner') {
      hasSite = true; siteLabel = L('Learning hub','مركز التعلم');
      user = { name: L('Saeed Al Hammadi','سعيد الحمادي'), ini:'SA', sub: L('Specialist, DCT Culture','أخصائي، قطاع الثقافة'), role: L('Learner','متعلّم') };
      nav.push(it('dashboard','Dashboard','لوحة التحكم','home','/'+p+'/dashboard'));
      nav.push(grp('Learn','تعلّم'));
      s.tabs.forEach(k => { const lb = (s.labels && s.labels[k]) || TAB[k]; nav.push(it('hub_'+k, lb[0], lb[1], TAB[k][2], '/'+p+'/hub/'+k)); });
      if (s.mentoring) nav.push(it('mentoring','Mentoring','الإرشاد','chat','/'+p+'/mentoring'));
      if (s.competition) nav.push(it('competition','Competition','المسابقة','trophy','/'+p+'/competition'));
      nav.push(grp('You','حسابك'));
      nav.push(it('achievements','Achievements','الإنجازات','award','/'+p+'/achievements'));
      nav.push(it('profile','Profile','الملف الشخصي','user','/'+p+'/profile'));
    } else if (role === 'mentor') {
      user = { name: L('Dr. Hessa Al Nuaimi','د. حصة النعيمي'), ini:'HN', sub: L('Director, Museums Strategy','مديرة استراتيجية المتاحف'), role: L('Mentor','مرشدة') };
      nav = [ it('dashboard','Dashboard','لوحة التحكم','home','/mentor'), it('mentees','Mentees','المتدربون','users','/mentor/mentees', '1'), it('sessions','Sessions','الجلسات','video','/mentor/sessions', '2'), it('grow','GROW logs','سجلات GROW','clip','/mentor/grow', '1'), it('availability','Availability','أوقات التوفر','clock','/mentor/availability'), it('profile','Profile','الملف الشخصي','user','/mentor/profile') ];
    } else if (role === 'judge') {
      user = { name: L('Noura Al Kaabi','نورة الكعبي'), ini:'NK', sub: L('Judge · ZU 24-Hour Challenge','محكّمة · تحدي جامعة زايد'), role: L('Judge','محكّمة') };
      nav = [ it('dashboard','Dashboard','لوحة التحكم','home','/judge'), it('applicants','Applicants','المتقدمون','clip','/judge/applicants', '1') ];
    } else if (role === 'sub_admin') {
      hasSite = true; siteLabel = L('Managing','تدير');
      const SA = { employees:['Omar Al Mansoori','عمر المنصوري','OM'], elevate:['Layla Haddad','ليلى حداد','LH'], znm:['Khalid Al Dhaheri','خالد الظاهري','KD'], museopro:['Camille Rousseau','كاميل روسو','CR'], nibras:['Fatima Al Suwaidi','فاطمة السويدي','FS'], zu:['Aisha Al Marzouqi','عائشة المرزوقي','AM'] }[p] || ['Layla Haddad','ليلى حداد','LH'];
      user = { name: L(SA[0],SA[1]), ini:SA[2], sub: L('Sub admin','مشرف فرعي'), role: L('Sub admin','مشرف فرعي') };
      const b = '/'+p+'/admin';
      nav.push(it('dashboard','Dashboard','لوحة التحكم','home',b));
      nav.push(it('members','Members','الأعضاء','users',b+'/members'));
      if (s.competition) { nav.push(grp('Competition','المسابقة')); nav.push(it('rounds','Rounds','الجولات','flag',b+'/rounds')); nav.push(it('rubrics','Rubrics','معايير التقييم','sliders',b+'/rubrics')); nav.push(it('judges','Judges','المحكّمون','scale',b+'/judges')); nav.push(it('scores','Scores','الدرجات','chart',b+'/scores')); nav.push(grp('Content','المحتوى')); }
      nav.push(it('resources','Resources','الموارد','folder',b+'/resources'));
      nav.push(it('view','View as learner','العرض كمتعلّم','eye','/'+p+'/dashboard'));
    } else {
      user = { name: L('Aisha Al Marzouqi','عائشة المرزوقي'), ini:'AM', sub: L('Platform admin','مسؤولة المنصة'), role: L('Admin','مسؤول') };
      nav = [ it('dashboard','Dashboard','لوحة التحكم','home','/admin'), it('reports','Reports','التقارير','chart','/admin/microsites'),
        grp('Platform','المنصة'), it('microsites','Microsites','المواقع المصغّرة','globe','/admin/platforms','1'), it('templates','Landing templates','قوالب الصفحات','layout','/admin/templates'), it('users','Users','المستخدمون','users','/admin/users'),
        grp('Learning','التعلّم'), it('catalog','Catalog','الكتالوج','book','/admin/catalog'), it('events','Events','الفعاليات','cal','/admin/events'), it('forms','Forms','النماذج','form','/admin/surveys'), it('resources','Resources','الموارد','shield','/admin/resources','1'), it('mentors','Mentor pool','مجموعة المرشدين','chat','/admin/mentors'), it('achievements','Achievements','الإنجازات','star','/admin/achievements'),
        grp('Settings','الإعدادات'), it('translations','Translations','الترجمات','lang','/admin/translations'), it('ai','AI embeds','أدوات الذكاء الاصطناعي','spark','/admin/ai-embeds') ];
    }
    nav = nav.map(n => ({ ...n, cls: n.key === active ? 'on' : '', cur: n.key === active ? 'page' : 'false' }));
    const cr = (crumbs || []).map((c, i, a) => ({ label:c.label, href: i < a.length - 1 ? (c.href || '#') : '', last: i === a.length - 1 }));
    const profileHref = role === 'learner' ? '/'+p+'/profile' : role === 'mentor' ? '/mentor/profile' : role === 'judge' ? '/judge' : role === 'sub_admin' ? '/'+p+'/admin' : '/admin';
    return { nav, crumbs: cr, hasSite, siteLabel, siteName: L(s.en, s.ar), siteColor: s.c, userName: user.name, initials: user.ini, userSub: user.sub, roleLabel: user.role,
      navLabel: L('Main navigation','التنقل الرئيسي'), langLabel: ar ? 'EN' : 'عربي', langAria: L('Switch to Arabic','التبديل إلى الإنجليزية'), notifAria: L('Notifications','الإشعارات'), meProfile: L('My profile','ملفي الشخصي'), meOut: L('Sign out','تسجيل الخروج'), meAria: L('Account menu','قائمة الحساب'), menuAria: L('Menu','القائمة'), notifHref:'/notifications', profileHref };
}
