// Ported verbatim from the Claude Design artboard Buttons (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale: null, enrol: 'idle' }; }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Buttons', variants:'Five variants', variantsNote:'Primary carries the one main action of a view. Event (indigo) is reserved for workshops and sessions. Secondary is sand with dark text. Outline and ghost are for everything else.', primary:'Primary', event:'Event', secondary:'Secondary', outline:'Outline', ghost:'Ghost', enrol:'Enrol now', register:'Register for session', viewCourse:'View course', saveDraft:'Save draft', cancel:'Cancel', sizes:'Sizes and icons', sizesNote:'44 px is the default and the minimum touch target. Icons are 18 px stroke glyphs; directional icons mirror in Arabic.', default:'default', continue:'Continue', withIcon:'Leading icon', trailing:'Trailing, mirrors in RTL', iconOnly:'Icon only · aria-label', next:'Next unit', addCalendar:'Add to calendar', states:'States', statesNote:'Hover lifts 2 px and deepens the fill. Focus shows the 3 px red ring for keyboard users only. Loading keeps the width and swaps the label for a spinner.', sDefault:'Default', sHover:'Hover', sFocus:'Focus-visible', sDisabled:'Disabled', sLoading:'Loading', live:'Try it', liveNote:'A real click-through: press Enrol to see the loading choreography and the success state.', units:'units', beginner:'Beginner', reset:'Reset', enrolled:'Enrolled', liveHint:'Loading ≈ 1.4 s, then the chip pops in with a 450 ms scale.', rules:'Rules', rule1:'One primary button per view. Everything else is outline or ghost.', rule2:'Labels are verbs: “Enrol now”, “Book session”, never “OK” or “Submit”.', rule3:'Destructive actions use outline, then confirm in a dialog.', rule4:'Never disable a submit button to signal validation — show the error instead.' };
    const AR = { sys:'نظام التصميم · الأزرار', variants:'خمسة أنواع', variantsNote:'الأساسي يحمل الإجراء الرئيسي الوحيد في الشاشة. النيلي مخصص لورش العمل والجلسات. الثانوي رملي بنص داكن. المحدد والشفاف لكل ما عدا ذلك.', primary:'أساسي', event:'فعالية', secondary:'ثانوي', outline:'محدد', ghost:'شفاف', enrol:'سجّل الآن', register:'التسجيل في الجلسة', viewCourse:'عرض الدورة', saveDraft:'حفظ المسودة', cancel:'إلغاء', sizes:'الأحجام والأيقونات', sizesNote:'44 بكسل هو الحجم الافتراضي والحد الأدنى لمنطقة اللمس. الأيقونات بحجم 18 بكسل؛ والأيقونات الاتجاهية تنعكس في العربية.', default:'افتراضي', continue:'متابعة', withIcon:'أيقونة في البداية', trailing:'في النهاية، تنعكس في RTL', iconOnly:'أيقونة فقط · aria-label', next:'الوحدة التالية', addCalendar:'أضف إلى التقويم', states:'الحالات', statesNote:'يرتفع الزر 2 بكسل عند التمرير ويغمق لونه. يظهر التركيز كحلقة حمراء 3 بكسل لمستخدمي لوحة المفاتيح فقط. يحافظ التحميل على العرض ويستبدل النص بمؤشر دوّار.', sDefault:'افتراضي', sHover:'تمرير', sFocus:'تركيز', sDisabled:'معطّل', sLoading:'تحميل', live:'جرّب بنفسك', liveNote:'تفاعل حقيقي: اضغط «سجّل» لترى حركة التحميل ثم حالة النجاح.', units:'وحدات', beginner:'مبتدئ', reset:'إعادة', enrolled:'تم التسجيل', liveHint:'التحميل ≈ 1.4 ثانية، ثم تظهر الشريحة بتكبير 450 مللي ثانية.', rules:'القواعد', rule1:'زر أساسي واحد في كل شاشة. كل ما عداه محدد أو شفاف.', rule2:'التسميات أفعال: «سجّل الآن»، «احجز جلسة»، وليس «موافق» أو «إرسال».', rule3:'الإجراءات الحذفية تستخدم المحدد ثم التأكيد في مربع حوار.', rule4:'لا تعطّل زر الإرسال للإشارة إلى خطأ — أظهر الخطأ بدلاً من ذلك.' };
    const t = ar ? AR : EN;
    const variants = [
      { name:t.primary, cls:'btn-primary', label:t.enrol },
      { name:t.event, cls:'btn-event', label:t.register },
      { name:t.secondary, cls:'btn-secondary', label:t.viewCourse },
      { name:t.outline, cls:'btn-outline', label:t.saveDraft },
      { name:t.ghost, cls:'btn-ghost', label:t.cancel }
    ];
    const st = this.state.enrol;
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t, variants: variants,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      enrolCls: st === 'loading' ? 'is-loading' : '',
      enrolBusy: st === 'loading' ? 'true' : 'false',
      enrolLabel: st === 'done' ? (ar?'انتقل إلى الدورة':'Go to course') : t.enrol,
      enrolled: st === 'done',
      enrol: () => { if (st !== 'idle') return; this.setState({ enrol:'loading' }); setTimeout(() => this.setState({ enrol:'done' }), 1400); },
      reset: () => this.setState({ enrol:'idle' })
    };
  }
}
