// client: hand-edited (route hrefs for screen links, register validation + focus, demo password check)
// Ported verbatim from the Claude Design artboard Auth (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale:null, screen:null, stage:'form', tried:false, err:false, pwShown:false, tenure:1, resent:0, lvl:'', f:{ email:'', pw:'', pw2:'', name:'', terms:false } }; }
  lum(hex){ const n = hex.replace('#',''); const c = [0,2,4].map((i) => parseInt(n.substr(i,2),16)/255).map((v) => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4)); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; }
  shade(hex, k){ const n = hex.replace('#',''); return '#' + [0,2,4].map((i) => Math.round(parseInt(n.substr(i,2),16)*k).toString(16).padStart(2,'0')).join(''); }
  tint(hex){ const n = hex.replace('#',''); return '#' + [0,2,4].map((i) => Math.round(255 - (255-parseInt(n.substr(i,2),16))*0.1).toString(16).padStart(2,'0')).join(''); }
  ink(hex){ let x = hex, g = 0; while (1.05/(this.lum(x)+0.05) < 4.6 && g < 20) { x = this.shade(x, 0.92); g++; } return x; }
  focusInvalid(){ requestAnimationFrame(() => { const el = document.querySelector('.pgs-Auth [aria-invalid="true"]'); if (el && el.focus) el.focus(); }); }
  go(s){ this.setState({ screen:s, lvl:'', stage:'form', tried:false, err:false, pwShown:false, f:{ email:'', pw:'', pw2:'', name:'', terms:false } }); }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const scr = this.state.screen || this.props.screen || 'login';
    const EN = { demoTitle:'Demo accounts', demoSub:'Pick an account to open its portal. In the live platform people sign in with their own e-mail and password.', dct:'Department of Culture and Tourism – Abu Dhabi', elevate:'Elevate 2026', email:'E-mail', workEmail:'Work e-mail', password:'Password', newPw:'New password', confirmPw:'Confirm new password', forgot:'Forgot password?', remember:'Keep me signed in on this device', signIn:'Sign in', newHere:'New to DCT Learn?', empRegister:'DCT employee? Create an account', invitedHint:'Invited to a programme? Use the link in your invitation e-mail.', inviteOnly:'Access by invitation', inviteOnlyB:'Elevate is invite-only. If you were invited, open the link in your e-mail to set your password first.', badCreds:'E-mail or password is incorrect', badCredsB:'Check both and try again, or reset your password.', reqMail:'Enter an e-mail like name@dctabudhabi.ae.', reqPw:'Enter your password.', reqLevel:'Select your job level.', welcomeBack:'Welcome back', restart:'Restart demo', regTitle:'Create your DCT Learn account', regSub:'For DCT employees with an @dctabudhabi.ae e-mail. Partners and students join by invitation.', fullName:'Full name', reqName:'Enter your full name as it appears on your staff ID.', domainHint:'Use your @dctabudhabi.ae address.', domainErr:'Use your @dctabudhabi.ae e-mail. Partners join by invitation.', domainOk:'DCT e-mail recognised', level:'Job level', lvl0:'Select your level', lvl1:'Officer', lvl2:'Specialist', lvl3:'Senior specialist', lvl4:'Section head', lvl5:'Manager and above', timeAt:'Time at DCT', ten0:'Under 6 months', ten1:'1–2 years', ten2:'Over 2 years', terms:'I agree to the', termsLink:'terms of use and privacy notice', reqTerms:'Accept the terms to create your account.', createAccount:'Create account', haveAccount:'Already have an account?', checkInbox:'Check your inbox', verifySentA:'We sent a verification link to', verifySentB:'. Open it to activate your account.', verifyFirst:'You can sign in once your e-mail is verified. The link works once.', resend:'Resend e-mail', resent:'Sent again', backToSignIn:'Back to sign in', resetTitle:'Reset your password', resetSub:'Enter the e-mail you use for DCT Learn and we’ll send you a link to set a new password.', sendLink:'Send reset link', resetSentA:'If an account exists for', resetSentB:', a reset link is on its way. It works once.', setTitle:'Set a new password', setSub:'Choose a password you don’t use anywhere else.', r1:'At least 10 characters', r2:'A number', r3:'An upper-case and a lower-case letter', match:'Passwords match', noMatch:'Passwords don’t match yet.', weak:'Your password doesn’t meet all the rules above yet.', savePw:'Save password', pwSaved:'Password updated', pwSavedB:'Use your new password the next time you sign in.', continueSignIn:'Continue to sign in', invTitle:'Join Elevate 2026', invSub:'Set your name and password to accept your invitation.', invBy:'Layla Haddad invited you to Elevate 2026', invRole:'Role: Learner (mentee)', invExpires:'Invitation expires 15 Oct 2026 — in 8 days', accept:'Accept invitation', invDoneT:'You’re in', invDoneB:'Your account is ready. Sign in to complete your mentee registration and see your mentor suggestions.', help:'Need help?', show:'Show password', hide:'Hide password', home:'DCT Learn home', elevateHome:'Elevate 2026', redirectHub:'Taking you to Choose your learning hub…', redirectElevate:'Taking you to your Elevate dashboard…', s_login:'Sign in', s_ms:'Microsite sign-in', s_reg:'Register', s_reset:'Reset', s_set:'Set password', s_inv:'Invitation', sideH1:'One account for every programme you’re part of', sideP1:'Sign in once to reach your courses, sessions and certificates across DCT Learn.', sideT1:['Courses in English and Arabic','Mentoring and live sessions','Certificates you can share'], sideH2:'Grow with a mentor from DCT leadership', sideP2:'Elevate pairs you with a senior mentor for structured one-to-one sessions.', sideT2:['AI matching on your goals and areas','GROW goals logged after every session','Sessions booked in Gulf time'], sideH3:'Learning for everyone at DCT', sideP3:'Create your account with your work e-mail to start your mandatory courses.', sideT3:['DCT World and DCTLEARN to start','Progress saved across devices','Certificates on completion'] };
    const AR = { demoTitle:'حسابات تجريبية', demoSub:'اختر حساباً لفتح البوابة الخاصة به. في المنصة الفعلية يسجّل كل شخص الدخول ببريده وكلمة مروره.', dct:'دائرة الثقافة والسياحة – أبوظبي', elevate:'إرتقاء 2026', email:'البريد الإلكتروني', workEmail:'البريد الإلكتروني للعمل', password:'كلمة المرور', newPw:'كلمة المرور الجديدة', confirmPw:'تأكيد كلمة المرور الجديدة', forgot:'نسيت كلمة المرور؟', remember:'ابقَ مسجلاً على هذا الجهاز', signIn:'تسجيل الدخول', newHere:'جديد في DCT Learn؟', empRegister:'موظف في الدائرة؟ أنشئ حساباً', invitedHint:'تمت دعوتك إلى برنامج؟ استخدم الرابط في رسالة الدعوة.', inviteOnly:'الوصول بالدعوة', inviteOnlyB:'برنامج إرتقاء بالدعوة فقط. إذا تمت دعوتك، افتح الرابط في بريدك لتعيين كلمة المرور أولاً.', badCreds:'البريد الإلكتروني أو كلمة المرور غير صحيحة', badCredsB:'تحقق منهما وحاول مجدداً، أو أعد تعيين كلمة المرور.', reqMail:'أدخل بريداً مثل name@dctabudhabi.ae.', reqPw:'أدخل كلمة المرور.', reqLevel:'اختر مستواك الوظيفي.', welcomeBack:'مرحباً بعودتك', restart:'إعادة العرض', regTitle:'أنشئ حسابك في DCT Learn', regSub:'لموظفي الدائرة ببريد @dctabudhabi.ae. ينضم الشركاء والطلاب بالدعوة.', fullName:'الاسم الكامل', reqName:'أدخل اسمك الكامل كما يظهر في بطاقة الموظف.', domainHint:'استخدم بريدك @dctabudhabi.ae.', domainErr:'استخدم بريدك @dctabudhabi.ae. ينضم الشركاء بالدعوة.', domainOk:'تم التعرف على بريد الدائرة', level:'المستوى الوظيفي', lvl0:'اختر مستواك', lvl1:'موظف', lvl2:'أخصائي', lvl3:'أخصائي أول', lvl4:'رئيس قسم', lvl5:'مدير فما فوق', timeAt:'مدة العمل في الدائرة', ten0:'أقل من 6 أشهر', ten1:'1–2 سنة', ten2:'أكثر من سنتين', terms:'أوافق على', termsLink:'شروط الاستخدام وإشعار الخصوصية', reqTerms:'وافق على الشروط لإنشاء حسابك.', createAccount:'إنشاء الحساب', haveAccount:'لديك حساب؟', checkInbox:'تحقق من بريدك', verifySentA:'أرسلنا رابط التحقق إلى', verifySentB:'. افتحه لتفعيل حسابك.', verifyFirst:'يمكنك تسجيل الدخول بعد التحقق من بريدك. الرابط صالح لمرة واحدة.', resend:'إعادة الإرسال', resent:'أُعيد الإرسال', backToSignIn:'العودة إلى تسجيل الدخول', resetTitle:'إعادة تعيين كلمة المرور', resetSub:'أدخل البريد الذي تستخدمه في DCT Learn وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.', sendLink:'إرسال رابط الاستعادة', resetSentA:'إذا كان هناك حساب لـ', resetSentB:'، فرابط الاستعادة في الطريق إليك. صالح لمرة واحدة.', setTitle:'تعيين كلمة مرور جديدة', setSub:'اختر كلمة مرور لا تستخدمها في أي مكان آخر.', r1:'10 أحرف على الأقل', r2:'رقم واحد', r3:'حرف كبير وحرف صغير', match:'كلمتا المرور متطابقتان', noMatch:'كلمتا المرور غير متطابقتين بعد.', weak:'كلمة المرور لا تستوفي كل القواعد أعلاه بعد.', savePw:'حفظ كلمة المرور', pwSaved:'تم تحديث كلمة المرور', pwSavedB:'استخدم كلمة المرور الجديدة في المرة القادمة.', continueSignIn:'متابعة إلى تسجيل الدخول', invTitle:'انضم إلى إرتقاء 2026', invSub:'حدّد اسمك وكلمة المرور لقبول دعوتك.', invBy:'دعتك ليلى حداد إلى إرتقاء 2026', invRole:'الدور: متعلم (متدرب)', invExpires:'تنتهي الدعوة في 15 أكتوبر 2026 — بعد 8 أيام', accept:'قبول الدعوة', invDoneT:'تم انضمامك', invDoneB:'حسابك جاهز. سجّل الدخول لإكمال تسجيل المتدرب ورؤية اقتراحات المرشدين.', help:'تحتاج مساعدة؟', show:'إظهار كلمة المرور', hide:'إخفاء كلمة المرور', home:'الرئيسية', elevateHome:'إرتقاء 2026', redirectHub:'ننقلك إلى اختيار مركز التعلم…', redirectElevate:'ننقلك إلى لوحة إرتقاء…', s_login:'الدخول', s_ms:'دخول الموقع', s_reg:'التسجيل', s_reset:'الاستعادة', s_set:'كلمة المرور', s_inv:'الدعوة', sideH1:'حساب واحد لكل برنامج تنتمي إليه', sideP1:'سجّل الدخول مرة واحدة للوصول إلى دوراتك وجلساتك وشهاداتك في DCT Learn.', sideT1:['دورات بالعربية والإنجليزية','إرشاد وجلسات مباشرة','شهادات يمكنك مشاركتها'], sideH2:'انمُ مع مرشد من قيادات الدائرة', sideP2:'يربطك إرتقاء بمرشد أول لجلسات فردية منظمة.', sideT2:['مطابقة بالذكاء الاصطناعي حسب أهدافك','أهداف GROW تُسجَّل بعد كل جلسة','جلسات بتوقيت الخليج'], sideH3:'تعلّم لكل من في الدائرة', sideP3:'أنشئ حسابك ببريد العمل لتبدأ دوراتك الإلزامية.', sideT3:['ابدأ بعالم الدائرة ومنصة DCT Learn','تقدمك محفوظ على كل الأجهزة','شهادات عند الإكمال'] };
    const t = ar ? AR : EN;
    const META = { login:['P06','/login',t.s_login], msignin:['P07','/elevate/sign-in',t.s_ms], register:['P08','/employee-registration',t.s_reg], reset:['P09','/reset-password',t.s_reset], setpw:['P10','/set-password',t.s_set], invite:['P11','/elevate/invite',t.s_inv] };
    const branded = scr === 'msignin' || scr === 'invite';
    const accent = branded ? '#CD3151' : '#EE3E43';
    const side = branded ? { h:t.sideH2, p:t.sideP2, ticks:t.sideT2 } : scr === 'register' ? { h:t.sideH3, p:t.sideP3, ticks:t.sideT3 } : { h:t.sideH1, p:t.sideP1, ticks:t.sideT1 };
    const f = this.state.f, tried = this.state.tried, stage = this.state.stage;
    const setF = (p) => this.setState({ f:{ ...this.state.f, ...p }, err:false });
    const mailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email);
    const dctOk = /^[^@\s]+@dctabudhabi\.ae$/i.test(f.email);
    const r = [f.pw.length >= 10, /\d/.test(f.pw), /[a-z]/.test(f.pw) && /[A-Z]/.test(f.pw)];
    const score = r.filter(Boolean).length + (f.pw.length >= 14 ? 1 : 0);
    const mcol = ['#E9ECEF','#D63539','#F7C337','#1A9F1F','#15801A'];
    const meter = [0,1,2,3].map((i) => i < score ? mcol[Math.min(score,4)] : '#E9ECEF');
    const rules = [t.r1, t.r2, t.r3].map((l, i) => ({ label:l, cls: r[i] ? 'ok' : '' }));
    const allRules = r.every(Boolean);
    const busy = stage === 'loading';
    const load = (cb) => { this.setState({ stage:'loading' }); setTimeout(cb, 1300); };
    const screens = [['login',t.s_login],['msignin',t.s_ms],['register',t.s_reg],['reset',t.s_reset],['setpw',t.s_set],['invite',t.s_inv]].map((x) => ({ label:x[1], cls: x[0] === scr ? 'is-on' : '', pick: () => this.go(x[0]) }));
    const isSet = scr === 'setpw' || scr === 'invite';
    const pm = (typeof window !== 'undefined' ? window.location.pathname : '').match(/^\/([^/]+)\/(login|invite|sign-in)\/?$/);
    const msite = pm ? pm[1] : null;
    const loginHref = (scr === 'msignin' || scr === 'invite') && msite ? '/' + msite + '/login' : '/login';
    const demoMails = ['saeed.h@dctlearn.example','hessa.n@example.com','noura.k@example.com','layla.h@dctlearn.example','aisha.admin@dctlearn.example'];
    const weLive = (tried || f.email.includes('@')) && f.email.length > 3 && f.email.split('@')[1] !== undefined && (tried || f.email.split('@')[1].includes('.'));
    const weErr = (weLive && !dctOk) || (tried && !dctOk);
    return {
      protoCls: this.props.proto ? 'proto' : '',
      lang: lang, dir: ar?'rtl':'ltr', t: t, f: f, side: side,
      code: META[scr][0], url: META[scr][1], scrName: META[scr][2], screens: screens,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      toggleLang: () => this.setState({ locale: ar ? 'en' : 'ar' }), langLabel: ar ? 'EN' : 'عربي',
      accent: accent, accentInk: this.ink(accent), accentSoft: this.tint(accent),
      branded: branded,
      sideImg: branded ? '/_blob/9842ff4b5522772462642e07bfb6d8c1' : '/_blob/eb80e68b5f407df8f3c317956007a5a2', sideEy: branded ? t.elevate : (ar ? 'دائرة الثقافة والسياحة – أبوظبي' : 'DCT Learn'), facts: [{ b:'9', l: ar?'برامج':'programmes' }, { b:'23', l: ar?'دورة':'courses' }, { b:'EN · ع', l: ar?'العربية والإنجليزية':'Arabic and English' }],
      sideOverlay: branded ? (ar ? 'linear-gradient(270deg,rgba(29,22,80,.95) 0%,rgba(29,22,80,.8) 55%,rgba(205,49,81,.6) 100%)' : 'linear-gradient(90deg,rgba(29,22,80,.95) 0%,rgba(29,22,80,.8) 55%,rgba(205,49,81,.6) 100%)') : 'linear-gradient(180deg,rgba(29,22,80,.55) 0%,rgba(29,22,80,.72) 40%,rgba(29,22,80,.94) 100%)',
      backHref: branded ? '/elevate' : '/', backLabel: branded ? t.elevateHome : t.home,
      demo: [
        ['SA','Saeed Al Hammadi','سعيد الحمادي','saeed.h@dctlearn.example','Learner','متعلّم','#D63539','/platforms'],
        ['HN','Dr. Hessa Al Nuaimi','د. حصة النعيمي','hessa.n@example.com','Mentor','مرشدة','#CD3151','/mentor'],
        ['NK','Noura Al Kaabi','نورة الكعبي','noura.k@example.com','Judge','محكّمة','#3B2F92','/judge'],
        ['LH','Layla Haddad','ليلى حداد','layla.h@dctlearn.example','Sub admin','مشرفة فرعية','#E35E3C','/elevate/admin'],
        ['AM','Aisha Al Marzouqi','عائشة المرزوقي','aisha.admin@dctlearn.example','Admin','مسؤولة المنصة','#1D1650','/admin']
      ].map(d => ({ ini:d[0], name: ar ? d[2] : d[1], mail:d[3], role: ar ? d[5] : d[4], c:d[6], aria: (ar ? d[2] : d[1]) + ' — ' + (ar ? d[5] : d[4]),
        pick: () => { this.setState({ f: { ...this.state.f, email:d[3], pw:'Dct!2026demo' }, tried:false, err:false, stage:'loading' }); setTimeout(() => { this.setState({ stage:'done' }); /* client: start the mock session */ window.dispatchEvent(new CustomEvent('dct-signin', { detail: d[3] })); if (this.props.proto) setTimeout(() => { window.dispatchEvent(new CustomEvent('dct-nav', { detail: String(d[7]).replace(/^#/, '') })); }, 900); }, 900); } })),
      isSignIn: scr === 'login' || scr === 'msignin', isLogin: scr === 'login', isMsignin: scr === 'msignin',
      isRegister: scr === 'register', isReset: scr === 'reset', isSetPw: isSet, isInvite: scr === 'invite',
      formStage: stage !== 'done', doneStage: stage === 'done',
      signTitleA: scr === 'msignin' ? (ar?'ادخل إلى':'Sign in to') : (ar?'ادخل إلى':'Sign in to'), signTitleB: scr === 'msignin' ? t.elevate : 'DCT Learn',
      signSub: scr === 'msignin' ? (ar?'استخدم الحساب الذي فعّلته من رسالة الدعوة.':'Use the account you activated from your invitation e-mail.') : (ar?'استخدم البريد الذي سجّلت أو دُعيت به.':'Use the e-mail you registered or were invited with.'),
      onEmail: (e) => setF({ email: e.target.value }), onPw: (e) => setF({ pw: e.target.value }), onPw2: (e) => setF({ pw2: e.target.value }), onName: (e) => setF({ name: e.target.value }), togTerms: () => setF({ terms: !f.terms }),
      pwShown: this.state.pwShown, pwType: this.state.pwShown ? 'text' : 'password', pwLabel: this.state.pwShown ? t.hide : t.show, togPw: () => this.setState({ pwShown: !this.state.pwShown }),
      eErr: tried && !mailOk, eCls: tried && !mailOk ? 'is-error' : '',
      pErr: tried && !f.pw, pCls: tried && !f.pw ? 'is-error' : '',
      nErr: tried && !f.name.trim(), nCls: tried && !f.name.trim() ? 'is-error' : '',
      weErr: weErr, weMsg: mailOk ? t.domainErr : t.reqMail, weOk: dctOk, weIdle: !dctOk && !weErr,
      weCls: dctOk ? 'is-valid' : ((tried && !dctOk) ? 'is-error' : ''),
      npCls: allRules ? 'is-valid' : (tried && scr === 'register' ? 'is-error' : ''), npErr: tried && scr === 'register' && !allRules,
      lvl: this.state.lvl, onLvl: (e) => this.setState({ lvl: e.target.value }), lErr: tried && scr === 'register' && !this.state.lvl, lCls: tried && scr === 'register' && !this.state.lvl ? 'is-error' : '',
      cErr: (tried || f.pw2.length >= f.pw.length) && f.pw2.length > 0 && f.pw2 !== f.pw, cOk: f.pw2.length > 0 && f.pw2 === f.pw, cCls: f.pw2.length > 0 ? (f.pw2 === f.pw ? 'is-valid' : 'is-error') : '',
      weakErr: tried && isSet && !allRules,
      tErr: tried && !f.terms,
      meter: meter, rules: rules,
      tenure: [t.ten0, t.ten1, t.ten2].map((l, i) => ({ label:l, on: i === this.state.tenure, pick: () => this.setState({ tenure:i }) })),
      authErr: this.state.err, busy: busy ? 'true' : 'false', busyCls: busy ? 'is-loading' : '',
      submitSignIn: () => { if (!mailOk || !f.pw) { this.setState({ tried:true }); this.focusInvalid(); return; } load(() => { const known = demoMails.indexOf(f.email.trim().toLowerCase()) >= 0; if (known ? f.pw !== 'Dct!2026demo' : f.pw.length < 8) this.setState({ stage:'form', err:true }); else { this.setState({ stage:'done' }); /* client: start the mock session */ window.dispatchEvent(new CustomEvent('dct-signin', { detail: f.email })); if (this.props.proto) { const e = (f.email || '').toLowerCase(); const dest = scr === 'msignin' ? '/elevate/dashboard' : /^hessa|^rashid|^mariam/.test(e) ? '/mentor' : /^noura|^daniel/.test(e) ? '/judge' : /^aisha/.test(e) ? '/admin' : /^layla/.test(e) ? '/elevate/admin' : /^omar/.test(e) ? '/employees/admin' : /^khalid/.test(e) ? '/znm/admin' : '/platforms'; setTimeout(() => { window.dispatchEvent(new CustomEvent('dct-nav', { detail: String(dest).replace(/^#/, '') })); }, 2200); } } }); },
      redirectMsg: scr === 'msignin' ? t.redirectElevate : t.redirectHub,
      submitRegister: () => { if (!f.name.trim() || !dctOk || !allRules || !this.state.lvl || !f.terms) { this.setState({ tried:true }); this.focusInvalid(); return; } load(() => this.setState({ stage:'done' })); },
      submitReset: () => { if (!mailOk) { this.setState({ tried:true }); this.focusInvalid(); return; } load(() => this.setState({ stage:'done' })); },
      submitSet: () => { if (!allRules || f.pw !== f.pw2 || (scr === 'invite' && !f.name.trim())) { this.setState({ tried:true }); return; } load(() => { this.setState({ stage:'done' }); /* client: an accepted invitation signs the invitee in */ if (scr === 'invite') window.dispatchEvent(new CustomEvent('dct-signin', { detail: 'saeed.h@dctlearn.example' })); if (this.props.proto) setTimeout(() => { window.dispatchEvent(new CustomEvent('dct-nav', { detail: String(scr === 'invite' ? '/elevate/dashboard' : '/login').replace(/^#/, '') })); }, 2200); }); },
      shownEmail: f.email || 'name@dctabudhabi.ae',
      resend: () => { this.setState({ resent:1 }); setTimeout(() => this.setState({ resent:2 }), 900); },
      resendLabel: this.state.resent === 2 ? t.resent : t.resend, resendCls: this.state.resent === 1 ? 'is-loading' : '',
      setTitle: scr === 'invite' ? t.invTitle : t.setTitle, setSub: scr === 'invite' ? t.invSub : t.setSub,
      setCta: scr === 'invite' ? t.accept : t.savePw, setBtnCls: scr === 'invite' ? 'btn-accent' : 'btn-primary',
      setDoneT: scr === 'invite' ? t.invDoneT : t.pwSaved, setDoneB: scr === 'invite' ? t.invDoneB : t.pwSavedB,
      resetHref: '/reset-password', registerHref: '/employee-registration', loginHref: loginHref, signInAfterHref: scr === 'invite' ? (msite ? '/' + msite + '/login' : '/elevate/login') : '/login',
      goReset: () => this.go('reset'), goRegister: () => this.go('register'), goLogin: () => this.go('login'),
      goSignInAfter: () => this.go(scr === 'invite' ? 'msignin' : 'login'),
      resetAll: () => this.go(scr)
    };
  }
}
