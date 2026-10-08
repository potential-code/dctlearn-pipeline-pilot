// Ported verbatim from the Claude Design artboard Main (DCLogic class).
// Runs on the DCLogic shim in src/dc/runtime.ts.
import { DCLogic } from '@/dc/runtime'

export default class Component extends DCLogic {
  constructor(p){ super(p); this.state = { locale: null }; }
  lum(hex){
    const n = hex.replace('#',''); const c = [0,2,4].map((i) => parseInt(n.substr(i,2),16)/255).map((v) => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
  }
  ratio(a,b){ const l1 = this.lum(a), l2 = this.lum(b); const hi = Math.max(l1,l2), lo = Math.min(l1,l2); return (hi+0.05)/(lo+0.05); }
  renderVals(){
    const lang = this.state.locale || this.props.locale || 'en';
    const ar = lang === 'ar';
    const EN = { sys:'Design system · Foundations', light:'Light', foundationsEyebrow:'Foundations', h1:'One system. Two languages. Every role.', intro:'Tokens, type and accessibility rules shared by every DCT Learn microsite. Each microsite overrides only its accent, logo and hero — everything else comes from here.', ready:'ready', colours:'Colours', coloursNote:'Brand tokens from SPEC §7. “Ink” variants are the AA-safe shades used wherever the colour carries text.', accents:'Microsite accents', shape:'Radius, shadow, spacing', radius:'Radius', controls:'controls', buttons:'buttons', panels:'panels', cards:'cards', chips:'chips', shadow:'Shadow and focus', rest:'rest', lift:'hover lift', focus:'focus ring', spacing:'Spacing scale (px)', type:'Type scale', typeNote:'Corporate S CT for English headings, Inter for UI and body, GE SS Text for Arabic. Web licence confirmed by the client; Inter and Noto Sans Arabic remain the fallbacks. Arabic gets a taller line height so marks never collide.', contrast:'Contrast — WCAG 2.1 AA', contrastNote:'Computed live from the token values. Normal text needs 4.5:1; large text (≥ 24 px, or ≥ 18.66 px bold) and UI components need 3:1.', pair:'Pair', sample:'Sample', ratio:'Ratio', aaText:'AA text', aaLarge:'AA large / UI', verdict:'Where it is used', devTitle:'Confirmed deviation', devBody:'#EE3E43 on white reaches 3.9:1, so it fails AA for button labels and body links. The system keeps #EE3E43 for underlines, progress, focus rings, icons and large headings, and uses --primary-ink #D63539 (the spec’s hover shade) for button fills and link text. Hover then steps to #BF2E32. Confirmed with the client on 7 Oct 2026.', ruleTitle:'House rule', ruleBody:'White text only on primary-ink, indigo, raspberry and text; dark text only on sand, yellow, coral and the soft tints. Muted grey never sits on sand.', motion:'Motion', motionNote:'Animation choreography is part of the system. Every rule below collapses to an instant change when the visitor prefers reduced motion.', mMicro:'Micro-interactions', mMicroNote:'Buttons, chips, inputs, nav items. Transform + colour only, never layout.', mCard:'Cards and surfaces', mCardNote:'4 px lift with the deep shadow on hover; image zoom 1.04 inside course cards.', mReveal:'Scroll reveal', mRevealNote:'20 px rise and fade, staggered 70 ms per sibling, once per element.', mEase:'Easing', mEaseNote:'One ease for everything: fast start, long settle. Spinners stay linear.' };
    const AR = { sys:'نظام التصميم · الأساسيات', light:'فاتح', foundationsEyebrow:'الأساسيات', h1:'نظام واحد. لغتان. كل الأدوار.', intro:'الرموز والخطوط وقواعد الوصول المشتركة بين جميع المواقع الفرعية لمنصة DCT Learn. يغيّر كل موقع فرعي لونه المميز وشعاره وصورته الرئيسية فقط، وكل ما عدا ذلك يأتي من هنا.', ready:'جاهز', colours:'الألوان', coloursNote:'رموز العلامة من المواصفة §7. درجات «الحبر» هي الدرجات الآمنة لمعيار AA حيثما يحمل اللون نصاً.', accents:'ألوان المواقع الفرعية', shape:'الزوايا والظلال والمسافات', radius:'نصف القطر', controls:'عناصر التحكم', buttons:'الأزرار', panels:'اللوحات', cards:'البطاقات', chips:'الشرائح', shadow:'الظل والتركيز', rest:'الحالة العادية', lift:'عند التمرير', focus:'حلقة التركيز', spacing:'مقياس المسافات (بكسل)', type:'مقياس الخطوط', typeNote:'خط Corporate S CT للعناوين الإنجليزية، وInter للواجهة والنصوص، وGE SS Text للعربية. أكّد العميل ترخيص الويب؛ ويبقى Inter وNoto Sans Arabic كخطوط احتياطية. تحصل العربية على ارتفاع سطر أكبر حتى لا تتداخل الحركات.', contrast:'التباين — WCAG 2.1 AA', contrastNote:'تُحسب القيم مباشرة من الرموز. يحتاج النص العادي إلى 4.5:1، والنص الكبير (24 بكسل فأكثر، أو 18.66 بكسل عريض) وعناصر الواجهة إلى 3:1.', pair:'الزوج', sample:'عينة', ratio:'النسبة', aaText:'نص AA', aaLarge:'كبير / واجهة', verdict:'أين يُستخدم', devTitle:'انحراف مؤكَّد', devBody:'يصل #EE3E43 على الأبيض إلى 3.9:1 فيفشل في معيار AA لنصوص الأزرار والروابط. يحتفظ النظام بـ #EE3E43 للخطوط السفلية وشريط التقدم وحلقة التركيز والأيقونات والعناوين الكبيرة، ويستخدم --primary-ink ‏#D63539 (درجة التمرير في المواصفة) لتعبئة الأزرار ونص الروابط، ثم يتدرج التمرير إلى #BF2E32. تم التأكيد مع العميل في 7 أكتوبر 2026.', ruleTitle:'قاعدة ثابتة', ruleBody:'النص الأبيض فقط على الحبر الأساسي والنيلي والتوتي ولون النص؛ والنص الداكن فقط على الرملي والأصفر والمرجاني والدرجات الفاتحة. الرمادي الباهت لا يوضع على الرملي أبداً.', motion:'الحركة', motionNote:'تصميم الحركة جزء من النظام. تتحول كل قاعدة أدناه إلى تغيير فوري عندما يفضّل الزائر تقليل الحركة.', mMicro:'التفاعلات الدقيقة', mMicroNote:'الأزرار والشرائح والحقول وعناصر التنقل. تحويل ولون فقط، لا تغيير في التخطيط.', mCard:'البطاقات والأسطح', mCardNote:'ارتفاع 4 بكسل مع الظل العميق عند التمرير؛ تكبير الصورة 1.04 داخل بطاقات الدورات.', mReveal:'الظهور عند التمرير', mRevealNote:'صعود 20 بكسل مع تلاشٍ، بتأخير 70 مللي ثانية لكل عنصر، مرة واحدة فقط.', mEase:'منحنى التسارع', mEaseNote:'منحنى واحد للجميع: بداية سريعة واستقرار طويل. المؤشرات الدوّارة تبقى خطية.' };
    const t = ar ? AR : EN;
    const d = ['','d1','d2','d3','d4','d5'];
    const brand = [
      { name:'Primary', hex:'#EE3E43', use: ar?'الخطوط السفلية، التقدم، التركيز، الأيقونات':'underlines, progress, focus, icons' },
      { name:'Primary ink', hex:'#D63539', use: ar?'تعبئة الأزرار، الروابط، التبويب النشط':'button fill, links, active tab' },
      { name:'Primary deep', hex:'#BF2E32', use: ar?'تمرير الأزرار':'button hover' },
      { name:'Primary soft', hex:'#FFF5F5', use: ar?'خلفيات ناعمة، تنبيهات':'soft backgrounds, alerts' },
      { name:'Sand', hex:'#E3DCD3', use: ar?'لوحات جانبية، أزرار ثانوية':'side panels, secondary buttons' },
      { name:'Indigo', hex:'#3B2F92', use: ar?'إجراءات الفعاليات':'event / workshop actions' },
      { name:'Indigo hover', hex:'#2D2470', use: ar?'تمرير النيلي':'indigo hover' },
      { name:'Success', hex:'#1A9F1F', use: ar?'شريط الإكمال، الأيقونات':'completion bar, icons' },
      { name:'Success ink', hex:'#15801A', use: ar?'نص الحالة «مكتمل»':'“Completed” text' },
      { name:'Text', hex:'#333333', use: ar?'نص الجسم':'body text' },
      { name:'Text muted', hex:'#6D7782', use: ar?'نص ثانوي':'secondary text' },
      { name:'Background', hex:'#F8F9FA', use: ar?'خلفية الصفحة':'page background' }
    ].map((c,i) => ({ ...c, delay: d[i % 6] }));
    const accents = [
      { name:'Yellow', hex:'#F7C337', use: ar?'تحدي جامعة زايد · نص داكن':'ZU Challenge · dark text', delay:'' },
      { name:'Coral', hex:'#F77860', use: ar?'رواد · نص داكن':'Ruwaad · dark text', delay:'d1' },
      { name:'Orange', hex:'#E35E3C', use: ar?'ميوزيو برو · زخرفي':'MuseoPro · decorative', delay:'d2' },
      { name:'Raspberry', hex:'#CD3151', use: ar?'إرتقاء · نص أبيض':'Elevate · white text', delay:'d3' }
    ];
    const spacing = [4,8,12,16,24,32,48,64].map((px,i) => ({ px: px, w: Math.round(px/64*100)+'%', delay: (i*0.06)+'s' }));
    const defs = [
      ['Text on white','#333333','#FFFFFF', ar?'نص الجسم':'body text'],
      ['Text on background','#333333','#F8F9FA', ar?'نص على خلفية الصفحة':'text on page bg'],
      ['Muted on white','#6D7782','#FFFFFF', ar?'تعليقات، وصف':'captions, descriptions'],
      ['Muted on sand','#6D7782','#E3DCD3', ar?'ممنوع — استخدم لون النص':'forbidden — use text instead'],
      ['Text on sand','#333333','#E3DCD3', ar?'زر ثانوي، لوحات':'secondary button, panels'],
      ['White on primary','#FFFFFF','#EE3E43', ar?'عناوين كبيرة فوق الأحمر فقط':'large headings over red only'],
      ['White on primary ink','#FFFFFF','#D63539', ar?'زر أساسي':'primary button'],
      ['Primary ink on white','#D63539','#FFFFFF', ar?'روابط، تبويب نشط':'links, active tab'],
      ['White on indigo','#FFFFFF','#3B2F92', ar?'زر الفعاليات':'event button'],
      ['Success ink on white','#15801A','#FFFFFF', ar?'نص «مكتمل»':'“Completed” text'],
      ['White on success','#FFFFFF','#1A9F1F', ar?'شريط إكمال، أيقونات فقط':'completion ribbon icon only'],
      ['Success ink on success soft','#15801A','#EAF7EA', ar?'شريحة الحالة':'status chip'],
      ['Primary ink on primary soft','#D63539','#FFF5F5', ar?'ممنوع للنص — استخدم الأعمق':'not for text — use deep'],
      ['Primary deep on primary soft','#BF2E32','#FFF5F5', ar?'شريحة، تنبيه':'chip, alert'],
      ['Indigo on indigo soft','#3B2F92','#EEEBF8', ar?'شريحة الفعالية':'event chip'],
      ['Text on yellow','#333333','#F7C337', ar?'لون تحدي جامعة زايد':'ZU accent'],
      ['Text on coral','#333333','#F77860', ar?'لون رواد':'Ruwaad accent'],
      ['White on raspberry','#FFFFFF','#CD3151', ar?'لون إرتقاء':'Elevate accent'],
      ['White on orange','#FFFFFF','#E35E3C', ar?'زخرفي فقط':'decorative only'],
      ['Warning text on warning','#7A5A00','#FFF4D6', ar?'شريحة «معلّق»':'“Pending” chip']
    ];
    const pass = ar?'ناجح':'Pass', fail = ar?'فاشل':'Fail';
    const pairs = defs.map((x) => { const r = this.ratio(x[1],x[2]); const n = r >= 4.5, l = r >= 3; return { label:x[0], fg:x[1], bg:x[2], ratio:r.toFixed(2), normal: n?pass:fail, normalCls: n?'chip-success':'chip-primary', large: l?pass:fail, largeCls: l?'chip-success':'chip-primary', note:x[3] }; });
    return {
      lang: lang, dir: ar?'rtl':'ltr', t: t,
      enCls: ar?'':'is-on', arCls: ar?'is-on':'',
      setEn: () => this.setState({ locale:'en' }), setAr: () => this.setState({ locale:'ar' }),
      brand: brand, accents: accents, spacing: spacing, pairs: pairs
    };
  }
}
