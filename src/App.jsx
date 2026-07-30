import { useState, useEffect, useRef } from "react";
import { TAROT_SYSTEM_PROMPT } from "./tarotPrompt";

const CATEGORIES = {
  "综合运势": { color: "#c8c0e0", bg: "rgba(200,192,224,0.12)" },
  "恋爱":     { color: "#cc8899", bg: "rgba(204,136,153,0.12)" },
  "事业":     { color: "#7799cc", bg: "rgba(119,153,204,0.12)" },
  "学业":     { color: "#7ab890", bg: "rgba(122,184,144,0.12)" },
  "人际关系": { color: "#a080cc", bg: "rgba(160,128,204,0.12)" },
};

const MAJOR_ARCANA = [
  "愚者","魔术师","女祭司","女皇","皇帝","教皇","恋人","战车",
  "力量","隐者","命运之轮","正义","倒吊人","死神","节制","恶魔",
  "高塔","星星","月亮","太阳","审判","世界"
];
const MINOR_SUITS = {
  "权杖": ["Ace","2","3","4","5","6","7","8","9","10","侍从","骑士","王后","国王"],
  "圣杯": ["Ace","2","3","4","5","6","7","8","9","10","侍从","骑士","王后","国王"],
  "宝剑": ["Ace","2","3","4","5","6","7","8","9","10","侍从","骑士","王后","国王"],
  "星币": ["Ace","2","3","4","5","6","7","8","9","10","侍从","骑士","王后","国王"],
};
const ALL_CARDS = [
  ...MAJOR_ARCANA.map(n => ({ name: n, suit: "大阿尔卡那" })),
  ...Object.entries(MINOR_SUITS).flatMap(([suit, nums]) =>
    nums.map(n => ({ name: `${suit}${n}`, suit }))
  )
];

const SPREADS = {
  "单张牌": [{ label: "核心牌", key: "c0" }],
  "万能牌阵": [
    { label: "1/我方主体盘（自身状态与能力）", key: "c0" },
    { label: "2/客观环境盘（外部环境与阻力）", key: "c1" },
    { label: "3/结局指引盘（走向+优化建议）",  key: "c2" },
  ],
  "时间流运势牌阵": [
    { label: "1/过往遗留（影响当前的往期因素）", key: "c0" },
    { label: "2/时段现状（指定周期内整体底色）", key: "c1" },
    { label: "3/时段末尾（周期结束时的走势）",   key: "c2" },
  ],
  "维纳斯爱之牌阵": [
    { label: "1/自己的真心",       key: "c0" },
    { label: "2/对方的真心",       key: "c1" },
    { label: "3/对方对自己的影响", key: "c2" },
    { label: "4/自己对对方的影响", key: "c3" },
    { label: "5/阻碍",             key: "c4" },
    { label: "6/感情的结果",       key: "c5" },
    { label: "7/未来自己的心态",   key: "c6" },
    { label: "8/未来对方的形态",   key: "c7" },
  ],
  "双选项抉择": [
    { label: "1/问询者自身状态",               key: "c0"  },
    { label: "2/当下实际状况",                 key: "c1"  },
    { label: "3/选项1整体概况",                key: "c2"  },
    { label: "4/选项2整体概况",                key: "c3"  },
    { label: "5/选项1短期影响①",              key: "c4"  },
    { label: "6/选项1短期影响②",              key: "c5"  },
    { label: "7/选项1短期影响③",              key: "c6"  },
    { label: "8/选项2短期影响①",              key: "c7"  },
    { label: "9/选项2短期影响②",              key: "c8"  },
    { label: "10/选项2短期影响③/选项1长期影响①",    key: "c9"  },
    { label: "11/选项1长期影响②",             key: "c10" },
    { label: "12/选项1长期影响③",             key: "c11" },
    { label: "13/选项1长期影响④",             key: "c12" },
    { label: "14/选项2长期影响①",             key: "c13" },
    { label: "15/选项2长期影响②",             key: "c14" },
    { label: "16/选项2长期影响③",             key: "c15" },
    { label: "17/选项1最终结果",               key: "c16" },
    { label: "18/选项2最终结果",               key: "c17" },
  ],
  "二选一牌阵": [
    { label: "1/当下整体现状",         key: "c0" },
    { label: "2/选择A的事态发展",      key: "c1" },
    { label: "3/选择B的事态发展",      key: "c2" },
    { label: "4/选择A的最终结局",      key: "c3" },
    { label: "5/选择B的最终结局",      key: "c4" },
  ],
  "凯尔特十字": [
    { label: "0/指示牌·问卜者本人（可选）", key: "c0"  },
    { label: "1/当下整体状况",               key: "c1"  },
    { label: "2/阻碍因素·横压在1上",         key: "c2"  },
    { label: "3/问题根源·隐藏动机",          key: "c3"  },
    { label: "4/不久前的过往状况",           key: "c4"  },
    { label: "5/个人主观想法·计划",          key: "c5"  },
    { label: "6/即将发生的事态",             key: "c6"  },
    { label: "7/自己对他人环境的看法",       key: "c7"  },
    { label: "8/客观外部环境",               key: "c8"  },
    { label: "9/对未来的心态·期许",          key: "c9"  },
    { label: "10/整件事最终结果",            key: "c10" },
  ],
  "质点牌阵": [
    { label: "10/现状",             key: "c0"  },
    { label: "9/事件基础·现状成因", key: "c1"  },
    { label: "6/对未来初步预测",    key: "c2"  },
    { label: "11/必修知识",         key: "c3"  },
    { label: "1/最高指引",          key: "c4"  },
    { label: "8/固有思维·被塑造的观念", key: "c5" },
    { label: "5/需要清除的观念",    key: "c6"  },
    { label: "3/需要接纳的观念",    key: "c7"  },
    { label: "7/初心·行动动力来源", key: "c8"  },
    { label: "4/需要落地执行的事",  key: "c9"  },
    { label: "2/需要长期遵守的方案",key: "c10" },
  ],
  "无意识之山": [
    { label: "1/未知·需被揭露的真相", key: "c0" },
    { label: "2/恐惧·最担心的结局",   key: "c1" },
    { label: "3/欲望·最渴求的结局",   key: "c2" },
    { label: "4/需要回避的事",         key: "c3" },
    { label: "5/需要主动争取的事",     key: "c4" },
    { label: "6/最终指引",             key: "c5" },
  ],
  "画像牌阵": [
    { label: "1/第一印象·外在特征上",   key: "c0" },
    { label: "2/搭配1·外在特征下",       key: "c1" },
    { label: "3/搭配4·隐秘特征上",       key: "c2" },
    { label: "4/搭配3·隐秘特征下",       key: "c3" },
    { label: "5/总体印象·核心主题",       key: "c4" },
  ],
  "时间线分支": [
    { label: "1/来自过去的影响",               key: "c0" },
    { label: "2/现在的情况",                   key: "c1" },
    { label: "3/即将到来的影响",               key: "c2" },
    { label: "4/建议·最佳行动方案",            key: "c3" },
    { label: "5/来自他人的影响",               key: "c4" },
    { label: "6/可能的阻碍",                   key: "c5" },
    { label: "7/原始结果（不采纳建议的走向）", key: "c6" },
    { label: "8/分支结果（采纳建议的走向）",   key: "c7" },
  ],
  "宠物牌阵": [
    { label: "1/宠物身体状况", key: "c0" },
    { label: "2/宠物心理状况", key: "c1" },
    { label: "3/宠物近期需求", key: "c2" },
    { label: "4/宠物想说的话", key: "c3" },
    { label: "5/你们的相处关系", key: "c4" },
    { label: "6/养护建议", key: "c5" },
  ],
  "四季牌阵": [
    { label: "4/星币·物质财运", key: "c0" },
    { label: "1/权杖·行动事业", key: "c1" },
    { label: "5/大阿尔卡那·主线", key: "c2" },
    { label: "2/圣杯·情感人际", key: "c3" },
    { label: "3/宝剑·思维压力", key: "c4" },
  ],
  "自定义牌阵": null,
};

// 各牌阵的位置关系说明，注入 AI 提示词帮助解读空间关系
const SPREAD_LAYOUTS = {
  "双选项抉择": `【双选项抉择牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：中间两张牌（1号自身状态在上，2号当下状况在下）构成中轴基准；左侧板块（选项1）和右侧板块（选项2）完全对称分布，每侧从上到下依次是总况→短期三牌横排→长期三牌横排→最终结果。10号牌是两侧共用的衔接牌，同时是选项2短期影响的第3张和选项1长期影响的第1张。

【核心原则：平等呈现，不替问卜者做决定】
两侧必须均等篇幅、均等深度解读，不能因某侧牌面更积极就多写一侧。呈现两个选项各自的优势和代价，让问卜者看清两条路的全貌后自行权衡。

【解读优先逻辑：先评估基准，再分析选项】
一、1号和2号是整组牌的基准，先解这两张说明问询者当前的状态和实际处境——这组基准牌本身要判断：当前处境是否理性到足以做出这个选择？如果1或2出现高压牌（宝剑逆位、月亮、塔），需先指出当前状态是否适合此刻做重大决策。
二、3号（选项1概况）和4号（选项2概况）在两侧各自最顶端，平行对比解读，说明两个选项的整体能量方向有何本质不同，这是两侧分析的总括。
三、选项1短期（5/6/7）和选项2短期（8/9/10左端）在同一水平层，横向对比，说明两个选项在近期各自会经历什么不同的过程。
四、10号牌是两侧共用的衔接节点，同时作为选项2短期的最后一张和选项1长期的第一张解读，说明它在两侧各自意味着什么能量转折。
五、选项1长期（10/11/12/13）和选项2长期（14/15/16）横向对比，说明两个选项在长期内的不同走向。

【短期 vs 长期的对比逻辑】
若某个选项短期舒适但长期消耗，须明确指出；若某个选项短期代价大但长期收益高，同样须指出。不主动判断哪个更好，而是让问卜者自行评估短期代价和长期收益哪个更符合自己的核心诉求。

六、17号（选项1最终结果）和18号（选项2最终结果）是两侧最终结局，必须做明确对比：说明两种走向终点的本质差异，以及哪个终点更符合问卜者在当下问题中的核心诉求——这个判断依据来自牌面，呈现给问卜者参考，最终选择权在问卜者。`,

  "二选一牌阵": `【二选一牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：底部单点1号，向上分出左右两条对称竖线（左竖：2→4；右竖：3→5），整体呈底部汇聚、上方分叉的倒V对称结构。

【核心原则：塔罗牌不代替问卜者做选择】
本牌阵的职责是客观呈现两个选项各自的过程和走向，让问卜者在充分看清两条路之后自行判断。解读必须保持双侧平等——不主动推荐"选A"或"选B"，不替问卜者决定，即使一侧牌面更积极，也只陈述牌面信息，由问卜者结合自身情况做决定。

【解读位置关系】
一、1号（当下现状）在整组牌最底部，是两条分支线的共同出发点。解读1号时必须说明当事人当前的实际处境，因为这是做出选择的基础条件，直接影响两个选项的可行性。
二、左侧竖线（2→4）是选择A的完整路径：2号是走选择A后的近期事态发展，4号是选择A的最终结局。必须作为一个因果链解读，说明选A之后会经历什么过程，以及最终走向哪里。
三、右侧竖线（3→5）是选择B的完整路径：3号是走选择B后的近期事态发展，5号是选择B的最终结局。同样作为因果链解读，说明选B的过程和终点。
四、2号和3号在同一水平线上（同为第二层），必须横向对比解读，说明两个选项在短期内的走向有何本质不同。
五、4号和5号在同一水平线上（同为第三层），必须横向对比解读，说明两个选项最终结局的核心差异。这组对比是整个牌阵最重要的结论——说清楚两条路各自通向哪里，两侧都呈现完整，让问卜者自行权衡。`,

  "凯尔特十字": `【凯尔特十字牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：中心是标准十字（0/1/2/3/4/5/6），十字右侧搭配一条从下往上的竖直长列（7/8/9/10）。

【凯尔特十字固定规则——2号阻碍牌只看正位含义，逆位不解】
2号横压于1号之上，是凯尔特十字的专属规则：无论2号是否逆位，一律按正位含义解读。这是该牌阵设计的固定规则，解读时直接按正位阐述阻碍内容，不额外说明此规则。

【解读顺序与位置关系】
一、0号（指示牌）在1号正下方，代表问卜者本人的基本能量底色，如有填写须作为解读整组牌的背景基准；如未填写则跳过。
二、1号（当下状况）是整组牌的核心，在画面正中央竖放，是一切解读的出发点。
三、2号（阻碍）横置压在1号上方，与1号形成十字交叉，是当下正在与核心状况对抗或制约的力量。1号和2号必须作为一个整体单元先解读，说明当前处境和它面临的阻力之间的关系。
四、中心十字四个方向的牌：3号（下/根源）、4号（左/过去）、5号（上/主观想法）、6号（右/即将发生）。从这四个方向理解核心处境的来龙去脉：根源来自哪里（3）、过去发生了什么（4）、当事人自己想怎么做（5）、外部事态往哪里走（6）。5号（主观想法）和6号（即将发生）必须对比，指出当事人的主观意愿和外部走向是否一致。
五、右侧竖列是结果预测柱，从下往上读：7号（自己对外部的主观看法）→8号（客观外部环境）→9号（对未来的心态期许）→10号（最终结果）。7号和8号必须对比解读，指出主观判断和客观环境之间的出入。9号（恐惧/期许）通常暗示了当事人最担心的事，有时这件事正在逐渐成真，不能轻描淡写。
六、整体解读逻辑：先解1+2（核心vs阻碍），再结合3/4/5/6理解十字处境，最后沿7→8→9→10看结果走向，以10号收尾给出最终判断。不能只聚焦10号给结论，必须让整条竖列的逻辑相互呼应。
七、若问卜者未在问题中说明时间范围，解读时须主动指出牌阵对时间有感应局限，建议问题中附带预期时间节点以提升准确度。`,

  "质点牌阵": `【质点牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：三列平行竖线。中轴线从上到下依次是1、11、6、9、10；左侧竖线从上到下依次是3、5、8；右侧竖线从上到下依次是2、4、7。

【严格硬性规则：必须自下而上解读，从底部往顶端方向读，绝对禁止从上往下读。从下往上读代表能量的因果累积和层层递进；如果从上往下读，所有的因果逻辑和推演方向将完全逆反，解读结论将失去准确性。】

【中轴线：事件主干（自下而上）10→9→6→11→1】
10（现状根基）→9（形成现状的成因）→6（近期预测）→11（必须掌握的关键知识/转折点）→1（最高指引/终点方向）。解读时必须沿这条轴线说明事件的因果推演，从当前现状一路向上追溯成因和走向。

【左列：思维/信念层（自下而上）8→5→3】
8号（固有观念/被过去塑造的思维底色）是基底，5号（自我限制/阻碍当事人的思维壁垒）是中段，3号（需要主动接纳和整合的新观念）是顶端。从下往上代表当事人需要完成的认知转变过程——先看清什么根深蒂固的观念在束缚自己（8→5），再看需要接纳什么（3）。

【右列：行动/执行层（自下而上）7→4→2】
7号（初心与行动动力来源）是基底，4号（需要落地执行的具体事项）是中段，2号（需要长期坚守的方案与承诺）是顶端。从下往上代表从动机到行动再到长期承诺的执行链条。

【横向对比（每层高度必须联动）】
8/7（固有思维底色 vs 初心动力）、5/4（需要清除的限制 vs 需要落地的行动）、3/2（接纳的新观念 vs 长期坚守的方案）。解读时必须指出至少一组横向对比，说明思维层和行动层在同一高度上的联动关系——它们往往互为镜像或互相制约。

11号（必修知识/关键节点）在中轴线中央，是三列能量在中间高度的交汇点，连接现状推演与最高指引，解读时需说明它承上启下的作用。`,

  "无意识之山": `【无意识之山牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：以底部1号为山脚基点，向上分出左右两列（左列2→4，右列3→5），顶端6号为山峰，整体是对称金字塔式结构。

【解读方向：自下而上（山脚→山腰→山顶），顺着能量上升的方向走。】

【板块一：1号（真相/根基）——山脚，整组牌的出发点】
1号在最底部，是整座山的基石，代表潜意识底层尚未被完全揭露的真相核心。解读1号时必须说明它作为"未被直视的根本状况"意味着什么——这是整组牌所有判断的底层依据。

【板块二：2号（恐惧）vs 3号（欲望）——山腰左右，必须对比解读】
2号和3号分列1号左右两侧，构成直接的心理两极对比。必须对比解读，说明当事人最恐惧什么、最渴望什么，以及两者之间是否形成内在张力——恐惧与欲望是否在拉扯当事人的判断和行动。

【板块三：4号（回避的事）和5号（需争取的事）——山腰上层，与下方纵向呼应】
4号在2号正上方，恐惧推动回避行为，解读时必须联动2号说明：当事人因为恐惧什么，所以回避了什么。
5号在3号正上方，欲望指向争取方向，解读时必须联动3号说明：当事人渴望什么，所以应该主动争取什么具体的方向或行动。

【板块四：6号（最终指引）——山峰，全牌阵收尾】
6号在4号和5号正中间的顶端，是整组牌能量汇聚的终点。解读6号时必须回收4号和5号的内容，说明这张指引牌如何整合回避方向和争取方向，给出最终的行动指引或心态方向。

【特别注意：山顶方向出现高压牌（宝剑系列、塔、月亮逆位等）时，代表潜意识发出的预警信号，而非已经发生的坏事。不要将其渲染为灾难性结论，应解读为当事人需要提前察觉和处理的内在议题。】`,

  "画像牌阵": `【画像牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：1（左上）、2（右上）、3（左下）、4（右下）围成外框正方形，5号牌在正中心，构成田字格中央内嵌牌的结构。

【核心定位——这是人物画像牌阵，不是事件牌阵】
本牌阵的唯一任务是勾勒被问者的人物画像：性格气质、给人的感觉、待人处事的方式、内在特质。问卜者对被问者的认知往往是模糊而直觉性的，更多是一种印象和感觉，而非具体事件上的判断。输出必须是性格描述和气质画像，绝对禁止将牌义往事件走向、关系进展、或决策建议方向解读。

【5号中心牌——全牌阵优先级最高，最先建立基调】
5号是被问者整体人物印象的核心锚点，代表这个人最本质的气质标签和人格底色。解读时须先确立5号的人物底色，再以此为基准解读外围四张的细节。5号统摄一切，外围四张是细化与补充。

【四组组合解读规则，每组必须在解读中覆盖】
一、1+2 = 被问者在社交场合、初见面时呈现的外部特征和第一印象。解读时描述这个人给陌生人或初识者的气质感、风格和表达方式。
二、3+4 = 被问者内在深处真实运作的特质，旁人不易察觉的一面。解读时描述他内心深处的性格逻辑、处事方式、以及只有亲近的人才能感受到的特质。
三、1+3（左侧纵向）= 被问者自己能意识到的一面，以及他已察觉但倾向回避或否认的特质。左侧代表自我认知层，解读时说明哪一面他清楚承认，哪一面他知道但不愿面对。
四、2+4（右侧纵向）= 被问者难以自知的盲区，以及他内心渴望被人看见、被人说到的部分。右侧代表自我盲区，解读时说明哪一面他自己意识不到，哪一面他希望有人帮他指出。

【禁止事项】
一、绝对禁止用这组牌分析事件走向、感情发展概率、对方会不会主动、关系会不会好转等事件性问题。
二、不能仅凭5号一张牌定义被问者的全部性格，必须结合外围四张的组合细节呈现立体画像。
三、如果问卜者问的是事件性问题，须在解读开头说明本牌阵只能描述人物画像，然后直接进行画像解读，不拒绝解读。`,

  "时间线分支": `【时间线分支牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：整体呈开口朝右上方的U型弧线。1号在左上角为起点，沿弧线向右下排布2、3、4（弧线底部），再沿右侧向右上排布5、6、7，8号落在7号正下方补齐分支点位。能量由左上流向底部4号方案位，再向右分流至7号，8号在右侧分叉。

【严格硬性规则：必须完整解读完1至7号所有牌，才能翻开并解读第8张分支结果牌。提前看8号会打乱能量逻辑，此规则不得跳过。】
【解读顺序：必须顺着U型弧线走——1→2→3→4→5→6→7，不得跳牌。完成1-7后再解8。】

【板块一：1过去→2现在→3即将到来（完整时间因果主干）】
这三张牌顺着弧线梳理完整时间线，找到当下麻烦的历史遗留成因。很多当下的问题根源在过去未处理的事件，必须从1号出发说明事件的来龙，才能理解2号的现状为何形成。

【板块二：5来自他人的影响 + 6潜在阻碍（外部干扰因素）】
5号是旁人、环境、圈子对这件事的助力或阻力；6号是推进过程中隐藏的坑或突发变故。必须区分：阻碍是客观外部因素存在，还是问卜者自身行为引发的问题——这影响应对方式的解读方向。

【板块三：4号方案——全牌阵核心锚点（最重要）】
4号是整条弧线的转折点，也是两条结果线的分叉原点。优先解析4号的具体执行含义——建议做什么、需要规避什么行为。然后对比7号（放任现状不执行建议的走向）和8号（遵从建议后的优化走向），直观说明执行与否的利弊差距。

【板块四：7原始结果 vs 8分支结果（最终核心对比）】
7和8必须做明确对比，说明两条走向的本质不同。若7和8的结局差距极小，必须告知问卜者：即便遵从建议，事态上限有限，不强行拉大差距，如实呈现。`,

  "维纳斯爱之牌阵": `【维纳斯爱之牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
本牌阵专属一对一亲密关系（恋爱、暧昧、夫妻），不适用于多人纠葛或群体友情。

整体结构：3（顶端）→4→5→6（底端）构成中轴竖线；1（左）与2（右）在4号牌左右平齐，和中轴组成正十字；5号牌左右延伸出7（左下）和8（右下）。

【推荐解读顺序】1&2 → 3&4 → 7&8 → 5阻碍 → 6最终结果，由浅入深，先看双方本心和互动底色，再看双方未来走向，然后才定位阻碍成因，最后由6号收尾。

【板块一：1号和2号——双方真心对标（必须联动对比，不能分开解读）】
1号和2号左右正面相对，同一水平线，是双方真心的直接镜像。必须对比两牌的正逆位和元素，判断情感基调是否同频：一张积极一张消极=情感需求错位；双方都出现封闭类牌（宝剑系列、高塔、隐士）=双向内耗、沟通隔绝；同频正向牌=双方投入意愿匹配。

【板块二：3号和4号——关系底色（互相治愈 vs 彼此拖累）】
3号从顶端俯视全局，代表对方对这段关系的客观影响力，能量方向由上往下；4号在十字中心，代表自己对对方的作用，能量由内向外。两张牌联动决定关系底色：双向正向影响（圣杯、星币正位）=关系有长期存续基础；一方正向一方负面=单方面付出压榨；双向负面=这段关系持续内耗，需要在结果环节明确说明。

【板块三：5号——全牌阵核心卡点】
5号是最关键的阻碍位，禁止简单归结为第三方或吵架。阻碍必须分类解析：两人性格矛盾、现实物质问题、原生情绪创伤、沟通模式漏洞。必须结合前四张牌说明这个阻碍是从哪里催生出来的，它不是凭空出现的。5号左右下方的7和8说明双方各自如何应对这个阻碍。

【板块四：6号结果 + 7号自己未来心态 + 8号对方未来形态（结局三位一体）】
绝对禁止单独以6号结果下定论。必须三张联动：即使6号是坏牌，如果7和8双方心态都趋于释怀和成长，代表分开是解脱；如果6号尚可，但7和8显示双方未来心态压抑煎熬，说明关系勉强维持、没有幸福感。1号（真心）与7号（未来心态）必须对比，说明自己心意是否有变化；2号（真心）与8号（未来形态）必须对比，说明对方状态是否延续或转向。

【全牌阵禁止事项】
一、禁止给出"注定分开"的宿命论定论。牌阵的结果是当下行为模式延续的被动推演，人主动改变相处方式，阻碍可以化解，结局可以变动。
二、本牌阵只适合一对一亲密关系。`,

  "宠物牌阵": `【宠物牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体布局：上层左右2张（1号身体、2号心理）横向并排；中层左中右3张（3号需求、4号心里话、5号相处关系）横向并排；底部1张（6号养护建议）居中。整体是上二、中三、下一的三层阶梯式矩形排布。

【1身体+2心理必须联动解读】
身体牌出现宝剑、高塔、逆位星币/权杖，代表躯体存在不适、劳损或隐性病痛；心理牌出现月亮、逆位圣杯、宝剑多为焦虑、害怕、孤单、缺乏安全感。宠物很多行为反常源于身体难受引发情绪变差，先区分是生理问题还是单纯心理问题。

【3近期需求+4宠物心里话是沟通核心】
3号偏物质/生活层面：饮食、玩耍、陪伴时长、作息、环境。4号偏情感层面：对主人的依赖、委屈、感激、害怕被冷落、抗拒陌生人或其他宠物。

【5相处关系】
正向圣杯、太阳、星币代表双向信任、亲密依恋；逆位圣杯、宝剑代表存在隔阂、相处模式失衡。

【6养护建议落地解读】
结合前5张的问题，对应说明：是需要就医体检、增加陪伴、更换饮食、改善居住环境、增加运动玩耍等实操方式。

【专属注意事项】
只能解读自家饲养的宠物；宠物近期已生病，塔罗只作情绪参考，身体不适优先就医；解读拟人化贴合宠物视角，宠物诉求大多简单：温饱、安全、陪伴、舒适环境。`,

  "四季牌阵": `【四季牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体布局：4号星币在最上方、1号权杖在左侧、2号圣杯在右侧、3号宝剑在最下方，四张牌构成正方形四角；5号大阿尔卡那安放在正方形正中心。四方围合中心的方正十字布局。

【使用时间限制】只在每年四个节气交替当天及前后几天抽取（春分、夏至、秋分、冬至），非换季时间能量不准。

【解读顺序：先中心大牌定基调，再依次星币→权杖→圣杯→宝剑】

【5号大阿尔卡那（中心）——季度主线，整张牌阵灵魂】
先解中心大牌定整体基调：正向大牌（太阳、星星、女皇）代表整季收获成长；考验大牌（月亮、高塔、死神）代表整季迎来蜕变清算，各板块围绕这个主线发生变化。

【4号星币（上方）——物质财运】
财运、薪资、副业收入、消费支出、职场待遇。正位收入稳定；逆位易破财、花销失控。

【1号权杖（左侧）——行动事业】
执行力、新项目、跳槽求职、出行、竞争。全正位主动性强；大量逆位易拖延疲惫、计划受阻。

【2号圣杯（右侧）——情感人际】
恋爱感情、亲友相处、职场人际、内心幸福感。顺遂则人际和睦；逆位易内耗吵架、孤单压抑。

【3号宝剑（下方）——思维压力】
考试、沟通谈判、是非纠纷、精神压力、失眠焦虑。正位思路清晰；逆位扎堆易遭非议、精神紧绷。

【四元素联动分析】
看四个板块的正逆位均衡：星币好但宝剑全凶=有钱但精神极度内耗；权杖充足但圣杯极差=忙碌打拼但情感空虚。各板块互相影响，不单独拆开看。`,

  "万能牌阵": `【万能牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：三张牌横向一字等距并排。左1号—中2号—右3号，聚焦问题本身，无时间属性。

【核心解读框架：绝对禁止使用时间轴语言】
绝对禁止出现"过去、以前、曾经、未来、接下来、当下、现在"等时间轴词汇。三个位置对应问题的三个维度而非时间。

1号（左）我方主体盘：提问人自身状态、主观想法、自身具备的条件或短板。感情类=我方真实心态与能力；事业办事类=自身是否具备条件。

2号（中）客观环境盘：外部环境、第三方人物、现实阻力或助力——是整件事的核心矛盾所在，优先解析。感情类=对方真实状态；办事类=外部客观阻力与助力。

3号（右）结局指引盘：事件自然走向+优化改良建议，两层信息都必须给出，不只预判结局，必须附带落地建议。

【正逆位快速判定】三正→整体向好/答案是；三逆→阻力极大/答案否；两正一逆→大体向好有阻碍；一正两逆→整体偏负面变数大。判定后必须结合牌意补充原因，不只给吉凶结论。`,

  "时间流运势牌阵": `【时间流运势牌阵·位置关系与解读指引（内部参考，解读时无痕融入，不对客人报位置编号）】
整体结构：三张牌横向一字等距并排，强制时间轴逻辑，左→中→右严格对应遗留→现状→末尾。

1号（左）过往遗留：造成本次时段运势底色的往期积累因素，是2号现状的成因解释。
2号（中）时段现状：指定时间区间内整体运势主体基调，是整组牌的核心，优先解析。
3号（右）时段末尾：该时段结束时的走势结果与最终运势收获或损耗。

【运势维度分析】结合四张元素综合分析：权杖=行动力/事业；圣杯=情感/人际；宝剑=思维/压力/是非；星币=财运/物质。给出该时段适配的具体行事建议。`,
};

// ── 牌阵参考图映射 ────────────────────────────────────────────────────────────
const SPREAD_IMAGES = {
  "万能牌阵":       "/spreads/万能牌阵.webp",
  "时间流运势牌阵": null,
  "维纳斯爱之牌阵": "/spreads/维纳斯爱之牌阵.webp",
  "双选项抉择":     "/spreads/抉择牌阵.webp",
  "二选一牌阵":     "/spreads/二选一牌阵.webp",
  "凯尔特十字":     "/spreads/凯尔特十字.webp",
  "时间线分支":     "/spreads/时间线分支牌阵.webp",
  "质点牌阵":       "/spreads/质点牌阵.webp",
  "无意识之山":     "/spreads/无意识之山.webp",
  "画像牌阵":       "/spreads/画像牌阵.webp",
  "宠物牌阵":       "/spreads/宠物牌阵.webp",
  "四季牌阵":       "/spreads/四季牌阵.webp",
};

// ── 牌阵悬浮说明（鼠标悬停显示）────────────────────────────────────────────
const SPREAD_TOOLTIPS = {
  "单张牌":        "最简洁直接的占卜，适合是非判断、快速答疑。",
  "万能牌阵":      "80%日常问题都适用，无时间绑定。解析自身状态、客观环境、事件走向+指引，可处理感情疑问、办事成败、内心困惑等需求。",
  "时间流运势牌阵":"填写具体时间区间，时间轴逻辑解析往期影响、时段运势底色、周期末走势，综合查看财运感情事业健康整体运势。",
  "维纳斯爱之牌阵":"恋爱/暧昧专属。剖析双方真心、互相的影响关系，拆解感情现存阻碍，预判彼此未来心态与关系最终走向。",
  "二选一牌阵":    "快速对比A/B两条选择的发展过程与最终结局，直观看清每条路会经历的变化。适合难以取舍的两难选择。",
  "双选项抉择":    "重大人生抉择深度拆解（转行、婚恋、定居等），分层解析短期影响、长期代价与终极归宿，全方位对比两份选择的长远价值。",
  "凯尔特十字":    "塔罗经典万能牌阵，事业感情人际均可。覆盖现状、阻碍、根源、过往、环境、心态、最终结果，完整还原事件全貌。",
  "时间线分支":    "顺时间梳理事件前因现状，分析外界阻碍，对比「维持现状的原始结局」和「执行建议后的优化结局」两种截然不同走向。",
  "质点牌阵":      "针对长期烦恼、人际矛盾、停滞事务，由下至上逐层拆解现状根源、思维局限、行动方案，给出顶层指引。",
  "无意识之山":    "找寻焦虑内耗的底层根源，梳理欲望与恐惧冲突，告诉你需要回避与争取的方向，给予心灵和解指引。",
  "画像牌阵":      "解析人物对外印象与内在本性，区分本人自知/不自知的性格短板，客观勾勒对方当下的人格面貌。",
  "宠物牌阵":      "查看宠物身心状态，读取需求与心声，梳理你与宠物的相处关系，给出饲养安抚建议。宠物躯体不适请优先就医。",
  "四季牌阵":      "⚠仅春分/夏至/秋分/冬至使用。划分行动力/人际情感/思维压力/财运工作四大维度，中心大牌锁定本季度核心课题。",
  "自定义牌阵":    "自由设定占卜位置数量和含义。注意：自定义数量需在实体牌模式下设置，再切换虚拟抽牌使用。",
};

const SUIT_COLORS = {
  "大阿尔卡那": "#d4d0f0",
  "权杖": "#c88850",
  "圣杯": "#70a8c4",
  "宝剑": "#9898c0",
  "星币": "#70b888",
};

function uid() { return Math.random().toString(36).slice(2, 10); }

function todayStr() {
  return new Date().toLocaleDateString("zh-CN");
}

// 根据问题内容自动推断事件分类
function autoClassify(q) {
  if (/感情|喜欢|爱情|分手|复合|恋爱|心动|表白|暗恋|男友|女友|男朋友|女朋友|对象|约会|追|有感觉|喜不喜欢|爱不爱|两个人|在一起/.test(q)) return "恋爱";
  if (/工作|职业|升职|跳槽|面试|公司|老板|职场|创业|离职|薪资|业绩|项目|同事/.test(q)) return "事业";
  if (/考试|成绩|学习|考研|高考|论文|毕业|学校|课程|备考/.test(q)) return "学业";
  if (/朋友|家人|父母|亲子|同学|矛盾|冲突|友情|人际|关系|相处/.test(q)) return "人际关系";
  return "综合运势";
}

// 计算两个日期之间的天数差，用于解决AI幻觉问题
function daysDiff(dateStr) {
  try {
    const parts = dateStr.replace(/\//g, "-").split("-").map(Number);
    const past = new Date(parts[0], parts[1] - 1, parts[2]); // 本地时间午夜
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - past) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    return `${diff}天前`;
  } catch {
    return dateStr;
  }
}

async function fetchClients() {
  try {
    const r = await fetch("/api/clients", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}` },
    });
    if (r.status === 401) return { unauthorized: true };
    return await r.json();
  } catch { return []; }
}
async function saveClients(data) {
  try {
    await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}`,
      },
      body: JSON.stringify(data),
    });
  } catch {}
}

// ── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pwd.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      const data = await r.json();
      if (!r.ok) { setErr(data.error || "密码错误"); return; }
      localStorage.setItem("tarot_token", data.token);
      onLogin(data.token);
    } catch {
      setErr("连接失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif", color: "#eceaff",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,208,240,0.2)",
        borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 360,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 12, letterSpacing: 6, color: "#6e6c88", marginBottom: 8 }}>✦ THE ORACLE ✦</div>
          <div style={{ fontSize: 24, letterSpacing: 2 }}>塔罗工作台</div>
        </div>
        <form onSubmit={submit}>
          <input
            type="password"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setErr(""); }}
            placeholder="请输入管理密码"
            autoFocus
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: `1px solid ${err ? "rgba(192,64,104,0.6)" : "rgba(212,208,240,0.12)"}`,
              borderRadius: 8, color: "#eceaff", padding: "12px 14px",
              fontFamily: "inherit", fontSize: 15, outline: "none",
              boxSizing: "border-box", marginBottom: err ? 8 : 16,
            }}
          />
          {err && <div style={{ color: "#c04068", fontSize: 12, marginBottom: 14 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{
            width: "100%",
            background: loading ? "rgba(212,208,240,0.2)" : "linear-gradient(135deg, #e2deff 0%, #b8b2d8 100%)",
            border: "none", borderRadius: 8, color: "#07060f", padding: "13px",
            fontFamily: "'Cinzel', Georgia, serif", fontSize: 12, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: 3,
          }}>
            {loading ? "验证中…" : "进入"}
          </button>
        </form>
      </div>
    </div>
  );
}



// ── 牌阵位置布局（支持按实际位置摆放已选牌面）────────────────────────────
// gridItems: [[row, col, slotIdx], ...] 支持同一张牌出现在多个位置
// positions: [[row, col], ...] 按slots顺序一一对应
const SPREAD_CARD_POSITIONS = {
  "维纳斯爱之牌阵": {
    cols: 3, rows: 5,
    positions: [[1,0],[1,2],[0,1],[1,1],[2,1],[4,1],[3,0],[3,2]]
  },
  "双选项抉择": {
    cols: 4, rows: 5,
    // c9(10号)只在选项2短期③位置出现一次，不重复；18张牌 c0-c17
    gridItems: [
      [0,1,0],[0,2,1],                         // 1自身, 2当下（中间）
      [1,0,2],[1,1,4],[1,2,5],[1,3,6],          // opt1: 3概况, 5,6,7短期
      [2,0,10],[2,1,11],[2,2,12],[2,3,16],      // opt1: 11,12,13长期 + 17结果
      [3,0,3],[3,1,7],[3,2,8],[3,3,9],          // opt2: 4概况, 8,9短期 + 10衔接(短③/长①)
      [4,0,13],[4,1,14],[4,2,15],[4,3,17],      // opt2: 14,15,16长期 + 18结果
    ]
  },
  "宠物牌阵": {
    cols: 3, rows: 3,
    positions: [[0,0],[0,2],[1,0],[1,1],[1,2],[2,1]]
  },
  "二选一牌阵": {
    cols: 3, rows: 3,
    positions: [[2,1],[1,0],[1,2],[0,0],[0,2]]
  },
  "画像牌阵": {
    cols: 3, rows: 3,
    positions: [[0,0],[0,2],[2,0],[2,2],[1,1]]
  },
  "凯尔特十字": {
    cols: 4, rows: 5,
    positions: [
      [4,1],[2,1],[1,1],[3,1],[2,0],[0,1],[2,2],
      [4,3],[3,3],[2,3],[1,3],
    ]
  },
  "时间线分支": {
    cols: 3, rows: 3,
    positions: [[0,0],[1,0],[2,0],[2,1],[1,1],[0,1],[0,2],[1,2]]
  },
  "四季牌阵": {
    cols: 3, rows: 3,
    positions: [[0,1],[1,0],[1,1],[1,2],[2,1]]
  },
  "无意识之山": {
    cols: 3, rows: 4,
    positions: [[3,1],[2,0],[2,2],[1,0],[1,2],[0,1]]
  },
  "质点牌阵": {
    cols: 3, rows: 5,
    // 中轴: c0(10),c1(9),c2(6),c3(11),c4(1); 左列: c5(8),c6(5),c7(3); 右列: c8(7),c9(4),c10(2)
    // 8/7在11两侧（同行），3/2在9两侧（同行）
    positions: [
      [4,1],[3,1],[2,1],[1,1],[0,1],  // 中轴: 10,9,6,11,1
      [1,0],[2,0],[3,0],              // 左列: 8,5,3
      [1,2],[2,2],[3,2],              // 右列: 7,4,2
    ]
  },
};

function SpreadCardLayout({ spread, slots, cards: cardMap }) {
  const config = SPREAD_CARD_POSITIONS[spread];
  if (!config) return null;

  const { cols, rows } = config;
  const CW = 64; const CH = 110;
  const LH = 20; const NH = 16;
  const GAP = 8;

  // 构建渲染列表：支持gridItems（含slotIdx）和positions（按顺序）
  const items = config.gridItems
    ? config.gridItems.map(([r, c, idx]) => ({ row: r, col: c, slot: slots[idx], card: cardMap[slots[idx]?.key] }))
    : config.positions.map(([r, c], i) => ({ row: r, col: c, slot: slots[i], card: cardMap[slots[i]?.key] }));

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, ${CW}px)`,
      gridTemplateRows: `repeat(${rows}, ${LH + CH + NH}px)`,
      gap: GAP,
      margin: "0 auto",
      overflowX: "auto",
      width: Math.min(cols * (CW + GAP) - GAP, 400),
    }}>
      {items.map(({ row, col, slot, card }, idx) => {
        if (!slot) return null;
        return (
          <div key={`${idx}-${slot.key}`} style={{
            gridRow: row + 1, gridColumn: col + 1,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div style={{
              fontSize: 8, color: "#6e6c88", height: LH, lineHeight: `${LH}px`,
              width: CW, textAlign: "center",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {slot.label.slice(0, 12)}
            </div>
            {card ? (
              <div style={{ position: "relative" }}>
                <img src={cardImgSrc(card)}
                  style={{ width: CW, height: CH, objectFit: "cover", borderRadius: 5,
                           border: "1px solid rgba(210,205,245,0.4)",
                           transform: card.reversed ? "rotate(180deg)" : "none",
                           display: "block" }} />
                {card.reversed && (
                  <div style={{ position: "absolute", bottom: 2, right: 2, fontSize: 7,
                                background: "rgba(0,0,0,0.75)", color: "#d4d0f0",
                                borderRadius: 3, padding: "1px 3px" }}>逆</div>
                )}
              </div>
            ) : (
              <div style={{ width: CW, height: CH, borderRadius: 5,
                            border: "1px dashed rgba(210,205,245,0.2)",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", color: "#2e2c48", fontSize: 16 }}>✦</div>
            )}
            {card && (
              <div style={{
                fontSize: 9, color: "#c8c4de", height: NH, lineHeight: `${NH}px`,
                width: CW, textAlign: "center",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {card.name}{card.reversed ? "↑逆" : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
// ── Card selector ────────────────────────────────────────────────────────────
function CardSelector({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [rev, setRev] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => { if (value) setRev(value.reversed || false); }, []);

  const filtered = ALL_CARDS.filter(c => c.name.includes(q) || c.suit.includes(q));
  const pick = (card) => { onChange({ ...card, reversed: rev }); setOpen(false); setQ(""); };

  return (
    <div style={{ position: "relative" }}>
      <p className="section-label" style={{ marginBottom: 6 }}>{label}</p>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "10px 14px",
        background: value ? "rgba(212,208,240,0.1)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${value ? "#d4d0f0" : "rgba(210,205,245,0.12)"}`,
        borderRadius: 8, color: value ? "#eceaff" : "#6e6c88", cursor: "pointer",
        textAlign: "left", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif"
      }}>
        <span>{value ? `${value.name}${value.reversed ? " ↑逆位" : " ↓正位"}` : "选择牌…"}</span>
        <span style={{ color: "#d4d0f0", fontSize: 10 }}>▾</span>
      </button>
      {value && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: "#6e6c88", cursor: "pointer" }}>
          <input type="checkbox" checked={rev} onChange={e => { setRev(e.target.checked); onChange({ ...value, reversed: e.target.checked }); }} style={{ accentColor: "#d4d0f0" }} />
          逆位
        </label>
      )}
      {open && (
        <div style={{
          position: "absolute", zIndex: 100, top: "100%", left: 0, right: 0,
          background: "#0c0a14", border: "1px solid rgba(210,205,245,0.2)", borderRadius: 10,
          maxHeight: 240, overflowY: "auto", marginTop: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.8)"
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="搜索牌名…"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#eceaff", fontSize: 13,
                fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif" }} />
          </div>
          {filtered.map(card => (
            <div key={card.name} onClick={() => pick(card)} style={{
              padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#b0aec8",
              borderLeft: `3px solid ${SUIT_COLORS[card.suit]}`, transition: "background 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(212,208,240,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ color: "#eceaff" }}>{card.name}</span>
              <span style={{ fontSize: 10, color: "#6e6c88", marginLeft: 8 }}>{card.suit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ s, onDelete, onCategoryChange, onSaveEdit, card, btnGhost }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCat, setEditCat] = useState(s.category || "综合运势");
  const [editText, setEditText] = useState(s.aiOutput || "");

  const enterEdit = () => {
    setEditCat(s.category || "综合运势");
    setEditText(s.aiOutput || "");
    setEditMode(true);
  };
  const saveEdit = () => {
    onSaveEdit(s.id, { category: editCat, aiOutput: editText });
    setEditMode(false);
  };

  const cat = CATEGORIES[editMode ? editCat : (s.category || "综合运势")] || CATEGORIES["综合运势"];

  if (editMode) return (
    <div style={{ ...card, borderLeft: `3px solid ${cat.color}` }}>
      <div style={{ fontSize: 11, color: "#6e6c88", marginBottom: 10, letterSpacing: 1 }}>
        ✎ 编辑 · {s.date} · 「{s.question}」
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#6e6c88", marginBottom: 6 }}>分类</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(CATEGORIES).map(([name, cfg]) => (
            <button key={name} onClick={() => setEditCat(name)} style={{
              ...btnGhost, padding: "3px 12px", fontSize: 11,
              borderColor: cfg.color, color: cfg.color,
              background: editCat === name ? cfg.bg : "transparent",
            }}>{name}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#6e6c88", marginBottom: 6 }}>解读内容</div>
        <textarea value={editText} onChange={e => setEditText(e.target.value)}
          style={{ width: "100%", minHeight: 180, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(210,205,245,0.2)", color: "#c8c4de", borderRadius: 6,
            padding: "10px", fontSize: 13, lineHeight: 1.8, resize: "vertical",
            boxSizing: "border-box", fontFamily: "inherit" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={saveEdit} style={{ ...btnGhost, padding: "5px 18px", fontSize: 12, color: "#d4d0f0", borderColor: "#d4d0f0" }}>保存</button>
        <button onClick={() => setEditMode(false)} style={{ ...btnGhost, padding: "5px 12px", fontSize: 12, color: "#6e6c88" }}>取消</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...card, borderLeft: `3px solid ${cat.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span onClick={enterEdit} title="点击修改分类或解读"
            style={{ fontSize: 11, color: cat.color, background: cat.bg, padding: "2px 8px", borderRadius: 4, cursor: "pointer", userSelect: "none" }}>
            {s.category || "综合运势"} ✎
          </span>
          <span style={{ fontSize: 12, color: "#6e6c88", letterSpacing: 1 }}>
            {s.date} · {daysDiff(s.date)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6e6c88" }}>{s.spreadType}</span>
          <button onClick={onDelete} style={{ ...btnGhost, padding: "3px 10px", fontSize: 11, color: "#c04068", borderColor: "rgba(192,64,104,0.4)" }}>删除</button>
        </div>
      </div>
      <div style={{ fontSize: 15, color: "#eceaff", marginBottom: 6 }}>「{s.question}」</div>
      <div style={{ fontSize: 12, color: "#6e6c88" }}>{s.spreadDesc}</div>
      {s.aiOutput && (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setExpanded(e => !e)} style={{ ...btnGhost, padding: "4px 12px", fontSize: 11, marginBottom: expanded ? 10 : 0 }}>
            {expanded ? "▲ 收起解读" : "▼ 展开解读"}
          </button>
          {expanded && (
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#c8c4de", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
              {s.aiOutput}
            </div>
          )}
        </div>
      )}
      {s.feedback && (
        <div style={{ fontSize: 12, color: "#9090b8", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 10 }}>
          <span style={{ color: "#6e6c88" }}>占卜师注记：</span>{s.feedback}
        </div>
      )}
    </div>
  );
}



// ── 大阿尔卡那编号映射（用于构建文件名）
const MAJOR_NUM = { "愚者":0,"魔术师":1,"女祭司":2,"女皇":3,"皇帝":4,"教皇":5,"恋人":6,"战车":7,"力量":8,"隐者":9,"命运之轮":10,"正义":11,"倒吊人":12,"死神":13,"节制":14,"恶魔":15,"高塔":16,"星星":17,"月亮":18,"太阳":19,"审判":20,"世界":21 };
// 代码牌名 → 图片文件名（有差异的几张）
const CARD_FILENAME = { "女皇":"皇后", "隐者":"隐士", "倒吊人":"吊人", "王后":"皇后" };
function cardImgSrc(card) {
  if (!card) return "";
  if (card.suit === "大阿尔卡那") {
    const num = MAJOR_NUM[card.name] ?? "";
    const fname = CARD_FILENAME[card.name] || card.name;
    return `/cards/${num}${fname}.webp`;
  }
  // 小阿尔卡那：王后 → 皇后
  const name = card.name.replace("王后", "皇后");
  return `/cards/${name}.webp`;
}

// ── Tooltip Button ────────────────────────────────────────────────────────────
function TooltipButton({ label, tooltip, active, onClick, style }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <button onClick={onClick} style={style}>{label}</button>
      {show && tooltip && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(8,6,18,0.95)",
          border: "1px solid rgba(210,205,245,0.22)",
          borderRadius: 10,
          padding: "10px 14px",
          minWidth: 200,
          maxWidth: 280,
          fontSize: 12,
          color: "#a8a6c4",
          lineHeight: 1.7,
          zIndex: 9999,
          pointerEvents: "none",
          boxShadow: "0 6px 24px rgba(0,0,0,0.7)",
          whiteSpace: "normal",
          fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
          letterSpacing: 0.3,
        }}>
          {tooltip}
          <div style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(210,205,245,0.22)",
          }} />
        </div>
      )}
    </div>
  );
}

// ── 虚拟抽牌组件 ──────────────────────────────────────────────────────────────
function VirtualDraw({ slots, onConfirm, onCancel }) {
  const [deck] = useState(() =>
    [...ALL_CARDS].sort(() => Math.random() - 0.5)
      .map(c => ({ ...c, reversed: Math.random() < 0.3 }))
  );
  const [drawn, setDrawn] = useState([]);
  const [offset, setOffset] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [startOff, setStartOff] = useState(0);
  const [moved, setMoved] = useState(false);
  const [flippedCount, setFlippedCount] = useState(0);

  const CW = 52; const CH = 90; const GAP = 3;
  const STEP = CW + GAP;
  const CARDS_PER_ROW = 5;
  const containerW = CARDS_PER_ROW * STEP + 4;

  const remaining = deck.filter(c => !drawn.find(d => d.name === c.name));
  const allDone = drawn.length === slots.length;
  const VISIBLE = CARDS_PER_ROW * 2;
  const maxOff = Math.max(0, remaining.length - VISIBLE);
  const clampOff = Math.max(0, Math.min(Math.round(offset), maxOff));

  useEffect(() => {
    if (!allDone || slots.length === 0) { setFlippedCount(0); return; }
    let count = 0;
    const tick = () => { count++; setFlippedCount(count); if (count < drawn.length) setTimeout(tick, 260); };
    const t = setTimeout(tick, 700);
    return () => clearTimeout(t);
  }, [allDone, drawn.length]);

  const [flyingCard, setFlyingCard] = useState(null); // 正在飞出动画的牌名

  const canFlip = (i) => flippedCount > i;
  const allFlipped = flippedCount >= drawn.length;

  const pick = (card) => {
    if (moved || drawn.length >= slots.length || flyingCard) return;
    setFlyingCard(card.name);
    setTimeout(() => {
      setDrawn(p => [...p, card]);
      setFlyingCard(null);
    }, 320);
  };

  const onPD = (x) => { setPressing(true); setMoved(false); setDragX(x); setStartOff(offset); };
  const onPM = (x) => {
    if (!pressing) return;
    const dx = x - dragX;
    if (Math.abs(dx) > 6) setMoved(true);
    setOffset(Math.max(0, Math.min(startOff - dx / STEP, maxOff)));
  };
  const onPU = () => { setPressing(false); };

  const onWheel = (e) => { e.preventDefault(); setOffset(o => Math.max(0, Math.min(o + e.deltaY * 0.06, maxOff))); };
  const nav = (d) => setOffset(o => Math.max(0, Math.min(Math.round(o) + d * CARDS_PER_ROW, maxOff)));

  const confirm = () => {
    const r = {};
    drawn.forEach((c, i) => { r[slots[i].key] = c; });
    onConfirm(r);
  };

  const base2 = { minHeight: "100vh", fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif", color: "#eceaff", padding: "20px 16px" };
  const btnG = { background: "transparent", border: "1px solid rgba(210,205,245,0.25)", borderRadius: 8, color: "#9090b8", padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" };
  const btnP = { background: "rgba(212,208,240,0.15)", border: "1px solid rgba(210,205,245,0.4)", borderRadius: 8, color: "#eceaff", padding: "10px 22px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", letterSpacing: 1 };

  return (
    <div style={base2}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 5, color: "#6e6c88", marginBottom: 4 }}>✦ VIRTUAL DRAW ✦</div>
          <div style={{ fontSize: 16 }}>已抽 {drawn.length} / {slots.length} 张</div>
          {!allDone && <div style={{ fontSize: 11, color: "#6e6c88", marginTop: 4 }}>可点击任意牌抽取 · 拖动/滚轮/按钮翻动牌堆</div>}
          {allDone && !allFlipped && <div style={{ fontSize: 12, color: "#d4d0f0", marginTop: 4 }}>正在翻牌……</div>}
        </div>

        {/* Drawn slots */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          {slots.map((s, i) => {
            const c = drawn[i];
            return (
              <div key={s.key} style={{ textAlign: "center", width: CW + 4 }}>
                <div style={{ fontSize: 9, color: "#6e6c88", marginBottom: 3, lineHeight: 1.3 }}>
                  {s.label.replace(/^\d+\//, "").slice(0, 8)}
                </div>
                {c ? (
                  <div style={{ position: "relative" }}>
                    <img src={canFlip(i) ? cardImgSrc(c) : "/cards/背面.webp"}
                      style={{ width: CW + 4, height: CH + 6, objectFit: "cover", borderRadius: 5,
                               border: "1px solid rgba(210,205,245,0.4)",
                               transform: canFlip(i) && c.reversed ? "rotate(180deg)" : "none",
                               transition: "all 0.3s" }} />
                    {canFlip(i) && c.reversed && (
                      <div style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8,
                                    background: "rgba(0,0,0,0.75)", color: "#d4d0f0",
                                    borderRadius: 3, padding: "1px 4px" }}>逆</div>
                    )}
                  </div>
                ) : (
                  <div style={{ width: CW + 4, height: CH + 6, borderRadius: 5,
                                border: "1px dashed rgba(210,205,245,0.18)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#2e2c48", fontSize: 18 }}>✦</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Card fan - 2 rows × 5 cards */}
        {!allDone && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 8, cursor: pressing ? "grabbing" : "grab", userSelect: "none" }}
              onMouseDown={e => onPD(e.clientX)}
              onMouseMove={e => { if (pressing) onPM(e.clientX); }}
              onMouseUp={onPU}
              onMouseLeave={onPU}
              onTouchStart={e => onPD(e.touches[0].clientX)}
              onTouchMove={e => { e.preventDefault(); onPM(e.touches[0].clientX); }}
              onTouchEnd={onPU}
              onWheel={onWheel}
            >
              {[0, 1].map(rowIdx => {
                const rowCards = remaining.slice(clampOff + rowIdx * CARDS_PER_ROW, clampOff + (rowIdx + 1) * CARDS_PER_ROW);
                const mid = (CARDS_PER_ROW - 1) / 2;
                return (
                  <div key={rowIdx} style={{ position: "relative", width: containerW, height: CH + 24 }}>
                    {rowCards.map((card, i) => {
                      const dist = Math.abs(i - mid);
                      const rot = (i - mid) * 5;
                      const yOff = Math.round(dist * 4);
                      const isFlying = flyingCard === card.name;
                      return (
                        <div key={card.name}
                          onClick={() => pick(card)}
                          style={{
                            position: "absolute",
                            left: i * STEP + 2,
                            top: isFlying ? -60 : yOff + 12,
                            width: CW, height: CH,
                            transform: `rotate(${isFlying ? 0 : rot}deg)`,
                            transformOrigin: "50% 115%",
                            opacity: isFlying ? 0 : 1,
                            cursor: "pointer",
                            zIndex: isFlying ? 100 : CARDS_PER_ROW - Math.round(dist),
                            transition: isFlying ? "top 0.3s ease-out, opacity 0.3s" : "top 0.15s",
                          }}
                        >
                          <img src="/cards/背面.webp"
                            style={{ width: "100%", height: "100%", objectFit: "cover",
                                     borderRadius: 4, pointerEvents: "none",
                                     boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                                     border: "1px dashed rgba(210,205,245,0.35)" }} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* 左右翻页按钮在牌堆下方 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 4 }}>
              <button onClick={() => nav(-1)} style={{ ...btnG, padding: "5px 18px", fontSize: 16 }}>◀</button>
              <span style={{ fontSize: 10, color: "#4a4864" }}>
                {clampOff + 1}–{Math.min(clampOff + VISIBLE, remaining.length)} / {remaining.length}
              </span>
              <button onClick={() => nav(1)} style={{ ...btnG, padding: "5px 18px", fontSize: 16 }}>▶</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
          <button onClick={() => { setDrawn(p => p.slice(0, -1)); setFlippedCount(0); }}
            disabled={drawn.length === 0}
            style={{ ...btnG, opacity: drawn.length === 0 ? 0.35 : 1 }}>← 退回</button>
          <button onClick={() => { setDrawn([]); setFlippedCount(0); }}
            disabled={drawn.length === 0}
            style={{ ...btnG, opacity: drawn.length === 0 ? 0.35 : 1 }}>重置全部</button>
          <button onClick={onCancel} style={btnG}>取消</button>
          {allDone && allFlipped && <button onClick={confirm} style={btnP}>✦ 确认，开始占卜</button>}
        </div>
      </div>
    </div>
  );
}
// ── Visitor App ───────────────────────────────────────────────────────────────
function VisitorApp() {
  const [spread, setSpread] = useState("万能牌阵");
  const [cards, setCards] = useState({});
  const [question, setQuestion] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [editableOutput, setEditableOutput] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [revisionPhase, setRevisionPhase] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("visitor_sessions") || "[]"); } catch { return []; }
  });
  const [useVirtual, setUseVirtual] = useState(true);
  const [showDraw, setShowDraw] = useState(false);
  const [category, setCategory] = useState("综合运势");
  const [filterCatV, setFilterCatV] = useState("全部");
  const [editingCatId, setEditingCatId] = useState(null);
  const categoryManualRef2 = useRef(false);
  const aiRef = useRef();

  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiOutput]);

  useEffect(() => {
    if (!categoryManualRef2.current && question.trim().length > 4) {
      setCategory(autoClassify(question));
    }
  }, [question]);

  const VISITOR_SPREADS = Object.keys(SPREADS).filter(s => s !== "自定义牌阵");
  const slots = SPREADS[spread] || [];

  const generate = async () => {
    const filledCards = Object.values(cards).filter(Boolean);
    if (!filledCards.length) return;
    if (spread === "时间流运势牌阵" && !question.trim()) {
      alert("时间流运势牌阵需要填写占卜时间区间（如：未来1个月 / 接下来一季度）");
      return;
    }
    if (spread === "万能牌阵" && !question.trim()) {
      alert("万能牌阵需要填写你的具体问题");
      return;
    }
    setLoading(true);
    setAiOutput(""); setIsThinking(false); setEditableOutput("");
    let fullOutput = ""; let rawText = "";

    const spreadDesc = slots.map(s => {
      const c = cards[s.key];
      return c ? `${s.label}：${c.name}（${c.reversed ? "逆位" : "正位"}）` : null;
    }).filter(Boolean).join("，");

    const today = todayStr();
    const systemPrompt = TAROT_SYSTEM_PROMPT;
    const userPrompt = `今天的日期是${today}。

═══ 本次占卜信息 ═══

客户：访客
历史脉络：（首次占卜）

今日问题：「${question}」

牌阵（${spread}）：${spreadDesc}
${SPREAD_LAYOUTS[spread] ? `\n${SPREAD_LAYOUTS[spread]}\n` : ""}
整体输出最低字数：不低于600字（中文）。最后单独一段直接回答问的那个问题，给出明确的倾向性判断。

【本次强制执行：每张牌单独解读不少于300字，这是绝对下限，未达到必须继续补充直到达标。】`;

    try {
      const res = await fetch("/api/generate-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              if (j.error) { setAiOutput("错误：" + j.error); return; }
              if (j.type === "content_block_delta") {
                if (j.delta?.type === "thinking_delta") {
                  setIsThinking(true);
                } else if (j.delta?.type === "text_delta" && j.delta?.text) {
                  rawText += j.delta.text;
                  let clean = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                  const openIdx = clean.indexOf("<thinking>");
                  const inThink = openIdx !== -1;
                  if (inThink) clean = clean.slice(0, openIdx);
                  setIsThinking(inThink);
                  fullOutput = clean;
                  setAiOutput(clean);
                }
              }
            } catch {}
          }
        }
      }
      setEditableOutput(fullOutput || aiOutput);  // aiOutput作为备用
    } catch (e) {
      setAiOutput("生成出错：" + e.message);
    }
    setLoading(false);
  };

  const saveSession = () => {
    if (!editableOutput) return;
    const s = {
      id: uid(), date: todayStr(), question: question.trim(), spreadType: spread,
      category,
      spreadDesc: slots.map(sl => { const c = cards[sl.key]; return c ? `${sl.label}：${c.name}${c.reversed ? "逆" : ""}` : null; }).filter(Boolean).join("，"),
      aiOutput: editableOutput,
    };
    const updated = [...sessions, s];
    setSessions(updated);
    localStorage.setItem("visitor_sessions", JSON.stringify(updated));
    alert("已保存到本地历史 ✓");
  };

  const reviseOutput = async () => {
    if (!feedbackText.trim() || !editableOutput) return;
    setIsRevising(true);
    setRevisionPhase("thinking");
    const revisePrompt = `你是一位塔罗占卜师助手。以下是刚生成的解牌话术，以及使用者的反馈意见。请根据反馈调整话术：保留好的部分，只修改反馈中提到的问题，语言风格保持不变，直接输出修改后的完整话术，不要加任何前言或说明。

原始话术：
${editableOutput}

反馈意见：
${feedbackText}`;
    try {
      const res = await fetch("/api/generate-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: revisePrompt }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", revised = "", textStarted = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.type === "content_block_delta" && j.delta?.type === "text_delta" && j.delta?.text) {
              revised += j.delta.text;
              let clean = revised.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
              const openIdx = clean.indexOf("<thinking>");
              if (openIdx !== -1) clean = clean.slice(0, openIdx);
              if (!textStarted && clean.trim()) {
                textStarted = true;
                setRevisionPhase("streaming");
                setEditableOutput("");
              }
              if (textStarted) setEditableOutput(clean);
            }
          } catch {}
        }
      }
      setRevisionPhase("done");
    } catch (e) {
      setRevisionPhase(null);
    }
    setIsRevising(false);
  };

  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("visitor_sessions", JSON.stringify(updated));
  };

  const updateSessionCategory = (id, newCat) => {
    const updated = sessions.map(s => s.id !== id ? s : { ...s, category: newCat });
    setSessions(updated);
    localStorage.setItem("visitor_sessions", JSON.stringify(updated));
    setEditingCatId(null);
  };

  const base = { minHeight: "100vh", fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif", color: "#eceaff" };
  const card = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(210,205,245,0.1)", borderRadius: 12, padding: "20px 18px", marginBottom: 16 };
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(210,205,245,0.15)", borderRadius: 8, color: "#eceaff", padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const btnPrimary = { background: "rgba(212,208,240,0.12)", border: "1px solid rgba(210,205,245,0.3)", borderRadius: 8, color: "#eceaff", padding: "10px 20px", cursor: "pointer", fontSize: 14, fontFamily: "inherit", letterSpacing: 1 };
  const btnGhost = { background: "transparent", border: "1px solid rgba(210,205,245,0.2)", borderRadius: 8, color: "#9090b8", padding: "8px 16px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" };

  if (showDraw) return (
    <VirtualDraw
      slots={slots}
      onConfirm={(drawnCards) => { setCards(drawnCards); setShowDraw(false); }}
      onCancel={() => setShowDraw(false)}
    />
  );

  if (showHistory) return (
    <div style={base}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setShowHistory(false)} style={{ ...btnGhost, padding: "8px 14px", fontSize: 12 }}>← 返回</button>
          <h2 style={{ flex: 1, margin: 0, fontSize: 18, letterSpacing: 2 }}>我的占卜历史</h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {["全部", ...Object.keys(CATEGORIES)].map(cat => {
            const cfg = CATEGORIES[cat];
            const active = filterCatV === cat;
            return (
              <button key={cat} onClick={() => setFilterCatV(cat)} style={{
                ...btnGhost, padding: "5px 12px", fontSize: 12,
                borderColor: active ? (cfg ? cfg.color : "#d4d0f0") : "rgba(210,205,245,0.12)",
                color: active ? (cfg ? cfg.color : "#d4d0f0") : "#6e6c88",
                background: active ? (cfg ? cfg.bg : "rgba(212,208,240,0.12)") : "transparent",
              }}>{cat}</button>
            );
          })}
        </div>
        {sessions.length === 0 && <div style={{ textAlign: "center", color: "#6e6c88", marginTop: 60 }}>暂无历史记录</div>}
        {[...sessions].reverse()
          .filter(s => filterCatV === "全部" || (s.category || "综合运势") === filterCatV)
          .map(s => {
            const cat = CATEGORIES[s.category || "综合运势"] || CATEGORIES["综合运势"];
            return (
              <div key={s.id} style={{ ...card, borderLeft: `3px solid ${cat.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      onClick={() => setEditingCatId(editingCatId === s.id ? null : s.id)}
                      style={{ fontSize: 11, color: cat.color, background: cat.bg, padding: "2px 8px", borderRadius: 4, cursor: "pointer", userSelect: "none" }}
                      title="点击修改分类"
                    >
                      {s.category || "综合运势"} ✎
                    </span>
                    <span style={{ fontSize: 12, color: "#6e6c88" }}>{s.date} · {s.spreadType}</span>
                  </div>
                  <button onClick={() => deleteSession(s.id)} style={{ ...btnGhost, padding: "3px 10px", fontSize: 11, color: "#c04068", borderColor: "rgba(192,64,104,0.4)" }}>删除</button>
                </div>
                {editingCatId === s.id && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                    {Object.entries(CATEGORIES).map(([name, cfg]) => (
                      <button key={name} onClick={() => updateSessionCategory(s.id, name)} style={{
                        ...btnGhost, padding: "3px 10px", fontSize: 11,
                        borderColor: (s.category || "综合运势") === name ? cfg.color : "rgba(210,205,245,0.12)",
                        color: (s.category || "综合运势") === name ? cfg.color : "#6e6c88",
                        background: (s.category || "综合运势") === name ? cfg.bg : "transparent",
                      }}>{name}</button>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 15, color: "#eceaff", marginBottom: 6 }}>「{s.question}」</div>
                <div style={{ fontSize: 12, color: "#6e6c88", marginBottom: 8 }}>{s.spreadDesc}</div>
                {s.aiOutput && (
                  <details>
                    <summary style={{ fontSize: 12, color: "#6e6c88", cursor: "pointer", userSelect: "none" }}>▼ 展开解读</summary>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: "#c8c4de", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto", marginTop: 8 }}>
                      {s.aiOutput}
                    </div>
                  </details>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );

  return (
    <div style={base}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32, position: "relative" }}>
          {sessions.length > 0 && (
            <button onClick={() => setShowHistory(true)} style={{ position: "absolute", top: 0, right: 0, ...btnGhost, fontSize: 11, padding: "4px 10px" }}>
              历史 ({sessions.length})
            </button>
          )}
          <header className="oracle-header">
            <p className="oracle-header__eyebrow">✦ The Oracle ✦</p>
            <h1 className="oracle-header__title">塔罗占卜</h1>
            <p className="oracle-header__subtitle">TAROT READING</p>
          </header>
        </div>

        <div style={card}>
          <p className="section-label">今日问题</p>
          <textarea value={question} onChange={e => { setQuestion(e.target.value); categoryManualRef2.current = false; }}
            placeholder={spread === "时间流运势牌阵" ? "请填写占卜时间区间（如：未来1个月 / 接下来一季度）" : spread === "万能牌阵" ? "今天想占卜什么呢？（提一个背景详细的好问题往往事半功倍，不填也可以随便问问）（必填）" : "今天想占卜什么呢？（提一个背景详细的好问题往往事半功倍，不填也可以随便问问）"} rows={2}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {Object.entries(CATEGORIES).map(([name, cfg]) => (
              <button key={name} onClick={() => { categoryManualRef2.current = true; setCategory(name); }} style={{
                ...btnGhost, padding: "4px 10px", fontSize: 12,
                borderColor: category === name ? cfg.color : "rgba(210,205,245,0.12)",
                color: category === name ? cfg.color : "#6e6c88",
                background: category === name ? cfg.bg : "transparent",
              }}>{name}</button>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="section-label" style={{ margin: 0 }}>牌阵类型</p>
            <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(210,205,245,0.2)" }}>
              <button onClick={() => setUseVirtual(false)} style={{
                padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                background: !useVirtual ? "rgba(212,208,240,0.18)" : "transparent",
                color: !useVirtual ? "#eceaff" : "#6e6c88", border: "none", borderRight: "1px solid rgba(210,205,245,0.2)"
              }}>☉ 实体牌</button>
              <button onClick={() => setUseVirtual(true)} style={{
                padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                background: useVirtual ? "rgba(212,208,240,0.18)" : "transparent",
                color: useVirtual ? "#eceaff" : "#6e6c88", border: "none"
              }}>◎ 虚拟抽牌</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {VISITOR_SPREADS.map(s => (
              <TooltipButton key={s} label={s} tooltip={SPREAD_TOOLTIPS[s]}
                onClick={() => { setSpread(s); setCards({}); }}
                style={{
                  ...btnGhost, padding: "8px 16px", fontSize: 13,
                  borderColor: spread === s ? "#d4d0f0" : "rgba(210,205,245,0.18)",
                  color: spread === s ? "#eceaff" : "#6e6c88",
                  background: spread === s ? "rgba(212,208,240,0.08)" : "transparent"
                }} />
            ))}
          </div>
          {SPREAD_IMAGES[spread] && null /* 参考图仅内部使用，不在界面显示 */}
          {useVirtual ? (
            <div>
              <button onClick={() => setShowDraw(true)} style={{ ...btnGhost, width: "100%", padding: "12px", textAlign: "center", borderStyle: "dashed" }}>
                🎴 {Object.keys(cards).length > 0 ? "重新抽牌" : "开始虚拟抽牌"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {slots.map(s => (
                <CardSelector key={s.key} label={s.label} value={cards[s.key]}
                  onChange={c => setCards(prev => ({ ...prev, [s.key]: c }))} />
              ))}
            </div>
          )}
        </div>

        {/* 已选牌面展示 */}
        {Object.keys(cards).length > 0 && slots.filter(s => cards[s.key]).length > 0 && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>✦ 已选牌面</p>
            {SPREAD_CARD_POSITIONS[spread] ? (
              <SpreadCardLayout spread={spread} slots={slots} cards={cards} />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {slots.map(s => {
                  const c = cards[s.key];
                  if (!c) return null;
                  return (
                    <div key={s.key} style={{ textAlign: "center", width: 70 }}>
                      <div style={{ fontSize: 9, color: "#6e6c88", marginBottom: 3, lineHeight: 1.3 }}>
                        {s.label.replace(/^\d+\//, "").slice(0, 10)}
                      </div>
                      <div style={{ position: "relative" }}>
                        <img src={cardImgSrc(c)}
                          style={{ width: 70, height: 122, objectFit: "cover", borderRadius: 6,
                                   border: "1px solid rgba(210,205,245,0.3)",
                                   transform: c.reversed ? "rotate(180deg)" : "none" }} />
                        {c.reversed && (
                          <div style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8,
                                        background: "rgba(0,0,0,0.7)", color: "#d4d0f0", borderRadius: 3, padding: "1px 4px" }}>逆</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#c8c4de", marginTop: 4 }}>{c.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button onClick={generate} disabled={loading}
          className="btn-primary btn-primary--full" style={{ marginBottom: 16 }}>
          {loading ? "✦ 解读中…" : "✦ 生成解读"}
        </button>

        {(aiOutput || loading || editableOutput) && (
          <div style={{ ...card, borderColor: "rgba(210,205,245,0.22)" }}>
            <p className="section-label" style={{ margin: "0 0 14px" }}>✦ 解读参考</p>
            {loading ? (
              <div ref={aiRef} style={{ fontSize: 15, lineHeight: 1.9, color: "#dcdaee", maxHeight: 400, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {!aiOutput && (
                  <div style={{ color: "#d4d0f0", fontSize: 13, fontStyle: "italic", opacity: 0.7 }} className="thinking-pulse">
                    占卜师正在夜观星象，请稍候……
                  </div>
                )}
                {aiOutput}
                {aiOutput && <span style={{ color: "#d4d0f0" }}>▌</span>}
              </div>
            ) : (
              <div>
                <textarea ref={aiRef} value={editableOutput} onChange={e => setEditableOutput(e.target.value)}
                  style={{ ...inputStyle, minHeight: 300, resize: "vertical", lineHeight: 1.9, fontSize: 15, color: "#dcdaee", background: "transparent", border: "none", padding: 0 }} />
                {isRevising && revisionPhase === "thinking" && (
                  <div style={{ color: "#d4d0f0", fontSize: 13, fontStyle: "italic", marginBottom: 10, opacity: 0.7 }} className="thinking-pulse">
                    占卜师正在夜观星象……
                  </div>
                )}
                {!isRevising && revisionPhase === "done" && (
                  <div style={{ color: "#5ea888", fontSize: 12, marginBottom: 8 }}>✦ 修改完成，可继续调整或保存。</div>
                )}
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="有想改的地方就写在这里，留空直接保存也可以。"
                  rows={2}
                  disabled={isRevising}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: 10, fontSize: 13, opacity: isRevising ? 0.5 : 1 }}
                />
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {feedbackText.trim() && !isRevising && (
                    <button onClick={reviseOutput} style={btnPrimary}>根据反馈修改</button>
                  )}
                  <button onClick={saveSession} style={btnPrimary}>保存到历史</button>
                  <button onClick={() => { setCards({}); setQuestion(""); setAiOutput(""); setEditableOutput(""); setFeedbackText(""); setRevisionPhase(null); }} style={btnGhost}>重新开始</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ── Main App ─────────────────────────────────────────────────────────────────
function TarotApp() {
  const [token, setToken] = useState(() => localStorage.getItem("tarot_token") || "");
  const [view, setView] = useState("loading");
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [spread, setSpread] = useState("万能牌阵");
  const [customSlots, setCustomSlots] = useState(3);
  const [customLabels, setCustomLabels] = useState(["位置1","位置2","位置3"]);
  const [cards, setCards] = useState({});
  const [question, setQuestion] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [editableOutput, setEditableOutput] = useState("");
  const [outputArchived, setOutputArchived] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [category, setCategory] = useState("综合运势");
  const [newClientName, setNewClientName] = useState("");
  const [newClientNote, setNewClientNote] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [historyClient, setHistoryClient] = useState(null);
  const [filterCat, setFilterCat] = useState("全部");
  const aiRef = useRef();
  const [currentSessionId, setCurrentSessionId] = useState(null);
  // 暂存本次生成的 session，只有点「归档」才真正写入数据
  const [pendingSession, setPendingSession] = useState(null);
  const [useVirtual, setUseVirtual] = useState(false);  // 管理端默认实体牌
  const [showDraw, setShowDraw] = useState(false);

  useEffect(() => {
    fetchClients().then(data => {
      if (data?.unauthorized) { setView("login"); return; }
      setClients(data || []);
      setView("clients");
    });
  }, [token]);

  useEffect(() => {
    if (aiRef.current) aiRef.current.scrollTop = aiRef.current.scrollHeight;
  }, [aiOutput]);

  // 问题输入变化时自动推断分类（不覆盖用户手动选择）
  const categoryManualRef = useRef(false);
  useEffect(() => {
    if (!categoryManualRef.current && question.trim().length > 4) {
      setCategory(autoClassify(question));
    }
  }, [question]);

  const addClient = async () => {
    if (!newClientName.trim()) return;
    const c = { id: uid(), name: newClientName.trim(), note: newClientNote.trim(), sessions: [] };
    const updated = [...clients, c];
    setClients(updated);
    await saveClients(updated);
    setNewClientName(""); setNewClientNote(""); setShowNewClient(false);
  };

  const deleteClient = async (id) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    await saveClients(updated);
  };

  const selectClient = (c) => {
    setSelected(c); setCards({}); setQuestion(""); setAiOutput(""); setView("reading");
    setEditableOutput(""); setOutputArchived(false); setFeedbackText(""); setRevisionPhase(null);
    setCurrentSessionId(null); setPendingSession(null);
    categoryManualRef.current = false; setCategory("综合运势");
  };

  const handleLogout = () => {
    localStorage.removeItem("tarot_token");
    setToken("");
    setView("login");
  };

  const exportData = async () => {
    try {
      const r = await fetch("/api/export", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}` },
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert("导出失败：" + (err.error || r.status)); return;
      }
      const contentType = r.headers.get("content-type") || "";
      if (!contentType.includes("application/json") && !contentType.includes("text")) {
        alert("导出失败：服务器返回了非JSON内容，请检查是否已登录"); return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "tarot-backup.json"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("导出失败：" + e.message); }
  };

  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(`导入将覆盖服务器上的所有数据，确认吗？`)) { e.target.value = ""; return; }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const r = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}`,
        },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      alert(`✓ 导入成功，共 ${result.count} 位客户`);
      const fresh = await fetchClients();
      if (!fresh?.unauthorized) setClients(fresh || []);
    } catch (e) { alert("导入失败：" + e.message); }
    e.target.value = "";
  };

  const slots = spread === "自定义牌阵"
    ? Array.from({ length: customSlots }, (_, i) => ({ label: customLabels[i] || `位置${i+1}`, key: `c${i}` }))
    : SPREADS[spread];

  const generate = async () => {
    const filledCards = Object.values(cards).filter(Boolean);
    if (!filledCards.length) return;
    if (spread === "时间流运势牌阵" && !question.trim()) {
      alert("时间流运势牌阵需要填写占卜时间区间（如：未来1个月 / 接下来一季度）");
      return;
    }
    if (spread === "万能牌阵" && !question.trim()) {
      alert("万能牌阵需要填写你的具体问题");
      return;
    }

    // 预先生成 sessionId，这样生成中途导航时离开保护能拦截
    const newSessionId = uid();
    setCurrentSessionId(newSessionId);
    setLoading(true);
    setAiOutput("");
    setIsThinking(false);
    setEditableOutput("");
    setOutputArchived(false);
    setFeedbackText("");
    setPendingSession(null);
    let fullOutput = "";
    let rawText = ""; // 原始文本（含<thinking>标签），用于剥离后得到干净正文

    const spreadDesc = slots.map(s => {
      const c = cards[s.key];
      return c ? `${s.label}：${c.name}（${c.reversed ? "逆位" : "正位"}）` : null;
    }).filter(Boolean).join("，");

    // 修复时间幻觉：每条历史记录附上精确的距今天数
    const today = todayStr();
    const clientHistory = selected?.sessions?.slice(-5).map(s => {
      const base = `[${s.date} / ${daysDiff(s.date)}] ${s.question} → 牌：${s.spreadDesc}`;
      if (s.aiOutput) {
        const snippet = s.aiOutput.slice(0, 200).replace(/\n+/g, ' ');
        return `${base}\n  解读要点：${snippet}…`;
      }
      return base;
    }).join("\n") || "（首次占卜）";

    const systemPrompt = TAROT_SYSTEM_PROMPT;

    const userPrompt = `今天的日期是${today}。

═══ 本次占卜信息 ═══

客户：${selected?.name || "匿名"}
${selected?.note ? `背景备注：${selected.note}` : ""}

历史脉络（近期最多5次，括号内为距今天数）：
${clientHistory}

今日问题：「${question}」

牌阵（${spread}）：${spreadDesc}
${SPREAD_LAYOUTS[spread] ? `\n${SPREAD_LAYOUTS[spread]}\n` : ""}
【信息密度要求（单张牌必须覆盖全部要点，否则视为未完成）】
每张牌解读必须覆盖以下五项要点：
1. 牌名+正逆位（明确说出）
2. 牌面至少一个具体意象（人物姿态/视线/元素/背景光暗），并与客人处境绑定
3. 正位的基本含义一句话，以及逆位与正位的方向变化一句话（格式：正位是……，现在逆位意味着……）
4. 事实穿透与零推测翻译：这张牌在客人处境中的翻译，必须100%基于客人的已知事实，深挖该状态的心理受力机制；绝对禁止脑补任何客人的具体行为、台词或未说出的内心独白；违规示例："你现在肯定觉得不知道怎么突然就吵成这样了"（脑补心理）/"你们原本有各自运转的生活节奏被打破了"（常识延伸脑补）；正确示例：客人说"最近常争吵"，牌面是塔，正确翻译是"这说明近期的争吵不是普通的磕绊，而是像雷击一样，对你们这三年建立起来的信任底盘造成了剧烈冲击"——只用客人原话+牌面含义，不加场景还原
5. 这张牌与上一张牌的承接关系（是延续、递进还是转折，一句带过；第一张牌除外）

单张牌解读最低字数：每张牌的解读不得少于300字（中文）；这是绝对下限，不是建议值。少于300字一律视为解读不完整，必须继续补充直到达标。禁止以"精炼"为由缩减字数。

承接关系具体化规则：描述牌与牌之间的承接时，必须说明"前一张牌的什么状态，在什么条件下，变成了后一张牌的状态"；格式："[前牌状态]在[具体条件]下，走向[后牌状态]"；违规示例："星星接在宝剑八逆位后面，说明当僵持松动之后，前面有一条可以往稳走的路"（缺具体条件）；正确示例："宝剑八逆位那种僵持在松动的状态，如果你们双方都开始直面那个被冲垮的东西、不再各自躲在自己的位置里，星星的疗愈就会从可能性变成真实的路径"

整体输出最低标准：
- 总字数不低于1000字（中文）
- 三张牌的画面意象至少各描述一次
- 至少一句话说明三张牌之间的能量状态关系（并列陈述，不用因果连接词）
- 动静对比和灵数演进必须无痕编织进叙事，绝对禁止出现"三张牌的动静走向："或"三张牌灵数："这类报表式内部推演标题；灵数用"数字从X到Y到Z"自然带出，不单独成段
- 每张牌解读完成后自检：①写出来的落点换成任何客人都能用→太泛，重写；②闭眼无法根据这句话看到一个具体画面→还是抽象状态，重写。违规落点："你们之间有平等互敬的基础"；合格落点："你们还能坐下来面对面谈这件事，谁也没摔门走"

【结论直切规则（强制）】
- 结论段的任务是展示牌面的走向倾向，并给出明确判断；客人的最终决定由客人自己做，但占卜师必须先给出牌面倾向的判断，不能端水
- 结论段固定句式：回到你原来的问题上，如果一定要做一个选择的话，牌面显示更多地倾向是[明确判断词]。[一句补充说明判断依据]。你结合自己的情况来判断是否采纳这个方向
- 明确判断词示例：这个方向可以试但启动节奏要放慢；现在不适合全面启动；值得推进但前提是先完成一轮信息核实；这个机会牌面上是顺的；这段关系有修复的方向但需要双方都放下防御
- 绝对禁止只描述状态就收尾：处于积累阶段/节奏缓慢/判断点还没到——这些状态描述必须转化成判断词才能作为结论；积累阶段→"现在不适合全面启动"；判断点还没到→"还没到做最终决定的时候"
- 绝对禁止用"你可以根据这个走向来判断"作为唯一收尾句——这是推卸判断责任；必须先给出倾向判断，最后才能用"你结合自己的情况来判断是否采纳"收尾
- 绝对禁止以下万能废话收尾：整体来说这组牌的节奏是、顺其自然、浮出来是自然的、时机自然会来
- 结论段话术格式示例："回到你原来的问题上，如果一定要做一个选择的话，牌面显示更多地倾向是：这个合作值得推进，但前提是你先完成一轮信息核实。宝剑王后在当下位置说的就是这个判断动作还没完成。你结合自己的情况来判断是否采纳这个方向。"

═══ 输出格式与标点要求（必须严格遵守）═══

这份内容是给占卜师当场说话用的参考，不是书面文章。

标点规则：
禁止使用破折号
禁止使用「」书名号，如果要引用某句话就用空格隔开直接说
禁止用双引号来强调词语，要强调就直接说
禁止用冒号引出列举，改成口语的就是说或直接说出来
可以用句号逗号省略号问号
禁止使用"ta"这个写法，被询问的对象统一用"他"，提问的客人统一用"你"，就像在直接跟客人说话一样，不要用"她"来指代客人
禁止使用任何括号，包括（）()，如果要补充说明就用空格隔开直接说进句子里

结构规则：
开场极简法则：绝对禁止复读客人的来访背景（禁止"首次来访，直接从牌面走""你说有合伙人来找你……"之类的元描述）；开场第一句必须直接切入第一张牌的解说，或用不超过20字的短句概括整组牌的核心能量；不复述已知信息
整组解读是一个连续叙事，不用阵位标记开头每张牌；用客人的状态转折和时间副词推进（"这几天""复合之后""但真正让我担心的是"），把三张牌焊在一个因果链里
每张牌的意象一句带过，立刻转向客人的具体处境，不在画面上停留
段与段之间空行
每张牌都必须解完，绝对不能中途截断，宁可精简也要保证全部解完
三张牌解完后，最后一段直接回答客人问的那个问题；给出明确的倾向性判断（从牌面来看整体偏向是XX），然后补一两句说清楚现在的卡点或需要注意的地方；口语化，不需要任何标签或冒号
最后单独一段直接回答客人问的那个问题。很多客人本质上想知道的是yes还是no，或者某件事发生的概率，总结里给出一个明确的倾向性判断，比如 从牌面来看整体偏向是XX、目前偏向XX、整体来说是倾向于XX的。然后补一两句说清楚现在卡在哪里或者需要注意什么。口语化，不需要任何标签或冒号`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}`,
        },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const j = JSON.parse(data);
              if (j.error) { setAiOutput("错误：" + j.error); return; }
              if (j.type === "content_block_delta") {
                if (j.delta?.type === "thinking_delta") {
                  setIsThinking(true);
                } else if (j.delta?.type === "text_delta" && j.delta?.text) {
                  rawText += j.delta.text;
                  // 剥离 <thinking>...</thinking> 标签（API有时把思考内容混入text_delta）
                  let clean = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
                  // 如果有未闭合的 <thinking>，截掉开始标签之后的部分
                  const openIdx = clean.indexOf("<thinking>");
                  const inThink = openIdx !== -1;
                  if (inThink) clean = clean.slice(0, openIdx);
                  setIsThinking(inThink); // 在thinking块内保持"正在思考"状态
                  fullOutput = clean;
                  setAiOutput(clean);
                }
              }
            } catch {}
          }
        }
      }

      // 生成完只暂存，不自动写入数据——点「归档」才真正保存
      if (selected) {
        const snap = {
          id: newSessionId,
          date: todayStr(),
          question: question.trim(),
          spreadDesc,
          spreadType: spread,
          category,
          cards: Object.entries(cards).reduce((acc, [k, v]) => { if (v) acc[k] = v; return acc; }, {}),
          aiOutput: fullOutput,
          feedback: "",
          archivedAt: null,
        };
        setPendingSession(snap);
        setEditableOutput(fullOutput || aiOutput);  // aiOutput作为备用
      }
    } catch (e) {
      setAiOutput("生成时出现错误：" + e.message);
      setCurrentSessionId(null);
    }
    setLoading(false);
  };

  const archiveOutput = async () => {
    if (!currentSessionId || !selected || !editableOutput) return;
    const now = new Date().toLocaleString("zh-CN");

    // 判断这条 session 是否已经存入过数据
    const alreadySaved = (selected.sessions || []).some(s => s.id === currentSessionId);

    let updatedClients;
    if (alreadySaved) {
      // 重新归档：更新已有 session 的 aiOutput
      const patch = s => s.id !== currentSessionId ? s : { ...s, aiOutput: editableOutput, archivedAt: now };
      updatedClients = clients.map(c =>
        c.id !== selected.id ? c : { ...c, sessions: (c.sessions || []).map(patch) }
      );
      setSelected(prev => ({ ...prev, sessions: (prev.sessions || []).map(patch) }));
    } else {
      // 首次归档：把 pendingSession 写入
      const sessionToSave = { ...(pendingSession || {}), aiOutput: editableOutput, archivedAt: now };
      updatedClients = clients.map(c =>
        c.id !== selected.id ? c : { ...c, sessions: [...(c.sessions || []), sessionToSave] }
      );
      setSelected(prev => ({ ...prev, sessions: [...(prev.sessions || []), sessionToSave] }));
    }

    setClients(updatedClients);
    await saveClients(updatedClients);
    setOutputArchived(true);
    setFeedbackText("");
    setPendingSession(null);
  };

  const [revisionPhase, setRevisionPhase] = useState(null); // null | "thinking" | "streaming" | "done"

  const reviseOutput = async () => {
    if (!feedbackText.trim() || !editableOutput) return;
    setIsRevising(true);
    setRevisionPhase("thinking");
    setOutputArchived(false);
    const revisePrompt = `你是一位塔罗占卜师助手。以下是刚生成的解牌话术，以及占卜师的反馈意见。请根据反馈调整话术：保留好的部分，只修改反馈中提到的问题，语言风格保持不变，直接输出修改后的完整话术，不要加任何前言或说明。

原始话术：
${editableOutput}

占卜师反馈：
${feedbackText}`;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("tarot_token") || ""}`,
        },
        body: JSON.stringify({ prompt: revisePrompt }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", revised = "", textStarted = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.type === "content_block_delta" && j.delta?.type === "text_delta" && j.delta?.text) {
              revised += j.delta.text;
              // 同样剥离 <thinking>...</thinking> 标签
              let clean = revised.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
              const openIdx = clean.indexOf("<thinking>");
              if (openIdx !== -1) clean = clean.slice(0, openIdx);
              if (!textStarted && clean.trim()) {
                textStarted = true;
                setRevisionPhase("streaming");
                setEditableOutput(""); // 正文开始才清空，思考期间保留原文
              }
              if (textStarted) setEditableOutput(clean);
            }
          } catch {}
        }
      }
      setRevisionPhase("done");
    } catch (e) {
      console.error("修改失败：", e.message);
      setRevisionPhase(null);
    }
    setIsRevising(false);
  };

  // ── Styles ──
  // base/card/btnPrimary/btnGhost are kept as style objects for prop-passing;
  // visual definitions live in index.css — these are the structural/layout overrides only.
  const base = {
    minHeight: "100vh",
    fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
    color: "#eceaff", padding: "0 0 60px"
  };
  const card = {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(212,208,240,0.13)",
    borderRadius: 12, padding: "20px 22px", marginBottom: 16,
    transition: "border-color 0.25s ease"
  };
  const btnPrimary = {
    background: "linear-gradient(135deg, #e2deff 0%, #b8b2d8 100%)",
    border: "none", borderRadius: 8, color: "#07060f", padding: "12px 24px",
    fontFamily: "'Cinzel', Georgia, serif",
    fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: 3,
    transition: "opacity 0.2s ease, transform 0.2s ease"
  };
  const btnGhost = {
    background: "transparent", border: "1px solid rgba(212,208,240,0.32)",
    borderRadius: 8, color: "#d4d0f0", padding: "10px 20px",
    fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
    fontSize: 13, cursor: "pointer", letterSpacing: 1,
    transition: "background 0.2s ease, border-color 0.2s ease"
  };
  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,208,240,0.12)",
    borderRadius: 8, color: "#eceaff", padding: "10px 14px",
    fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
    fontSize: 14, outline: "none", boxSizing: "border-box"
  };

  if (view === "login") return (
    <LoginPage onLogin={(t) => { setToken(t); }} />
  );

  if (view === "loading") return (
    <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="display-title" style={{ fontSize: 16, letterSpacing: 6 }}>✦ 正在加载 ✦</div>
    </div>
  );

  if (view === "history" && historyClient) {
    const sessions = historyClient.sessions || [];
    const filteredSessions = filterCat === "全部"
      ? sessions
      : sessions.filter(s => (s.category || "综合运势") === filterCat);

    const deleteSession = async (sessionId) => {
      if (!confirm("确认删除这条记录？")) return;
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      const updatedClients = clients.map(c =>
        c.id !== historyClient.id ? c : { ...c, sessions: updatedSessions }
      );
      setClients(updatedClients);
      setHistoryClient(prev => ({ ...prev, sessions: updatedSessions }));
      await saveClients(updatedClients);
    };

    const changeCategorySession = async (sessionId, newCat) => {
      const updatedSessions = sessions.map(s =>
        s.id !== sessionId ? s : { ...s, category: newCat }
      );
      const updatedClients = clients.map(c =>
        c.id !== historyClient.id ? c : { ...c, sessions: updatedSessions }
      );
      setClients(updatedClients);
      setHistoryClient(prev => ({ ...prev, sessions: updatedSessions }));
      await saveClients(updatedClients);
    };

    const changeSessionContent = async (sessionId, updates) => {
      const updatedSessions = sessions.map(s =>
        s.id !== sessionId ? s : { ...s, ...updates }
      );
      const updatedClients = clients.map(c =>
        c.id !== historyClient.id ? c : { ...c, sessions: updatedSessions }
      );
      setClients(updatedClients);
      setHistoryClient(prev => ({ ...prev, sessions: updatedSessions }));
      await saveClients(updatedClients);
    };

    return (
      <div style={base}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "30px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <button onClick={() => setView("clients")} style={{ ...btnGhost, padding: "8px 14px" }}>← 返回</button>
            <div>
              <div style={{ fontSize: 20, color: "#eceaff" }}>{historyClient.name} 的历史记录</div>
              <div style={{ fontSize: 12, color: "#6e6c88", marginTop: 2 }}>{sessions.length} 次占卜</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {["全部", ...Object.keys(CATEGORIES)].map(cat => {
              const cfg = CATEGORIES[cat];
              const active = filterCat === cat;
              return (
                <button key={cat} onClick={() => setFilterCat(cat)} style={{
                  ...btnGhost, padding: "5px 12px", fontSize: 12,
                  borderColor: active ? (cfg ? cfg.color : "#d4d0f0") : "rgba(210,205,245,0.12)",
                  color: active ? (cfg ? cfg.color : "#d4d0f0") : "#6e6c88",
                  background: active ? (cfg ? cfg.bg : "rgba(212,208,240,0.12)") : "transparent",
                }}>{cat}</button>
              );
            })}
          </div>
          {filteredSessions.length === 0 && (
            <div style={{ color: "#6e6c88", textAlign: "center", marginTop: 60 }}>
              {sessions.length === 0 ? "暂无记录" : "该分类暂无记录"}
            </div>
          )}
          {[...filteredSessions].reverse().map(s => (
            <SessionCard key={s.id} s={s} card={card} btnGhost={btnGhost}
              onDelete={() => deleteSession(s.id)}
              onCategoryChange={changeCategorySession}
              onSaveEdit={changeSessionContent} />
          ))}
        </div>
      </div>
    );
  }

  if (view === "clients") return (
    <div style={base}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={exportData} style={{
              background: "transparent", border: "1px solid rgba(210,205,245,0.15)",
              borderRadius: 6, color: "#6e6c88", fontSize: 11, padding: "4px 10px",
              cursor: "pointer", fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
            }}>📥 导出</button>
            <label style={{
              background: "transparent", border: "1px solid rgba(210,205,245,0.15)",
              borderRadius: 6, color: "#6e6c88", fontSize: 11, padding: "4px 10px",
              cursor: "pointer", fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
            }}>
              📤 导入
              <input type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
            </label>
            {token && token !== "no-auth" && (
              <button onClick={handleLogout} style={{
                background: "transparent", border: "1px solid rgba(210,205,245,0.15)",
                borderRadius: 6, color: "#6e6c88", fontSize: 11, padding: "4px 10px",
                cursor: "pointer", fontFamily: "'Cormorant Garamond', Palatino, Georgia, serif",
                letterSpacing: 1,
              }}>退出</button>
            )}
          </div>
          <header className="oracle-header">
            <p className="oracle-header__eyebrow">✦ The Oracle ✦</p>
            <h1 className="oracle-header__title">塔罗工作台</h1>
            <p className="oracle-header__subtitle">TAROT READING ASSISTANT</p>
          </header>
        </div>

        {clients.map(c => (
          <div key={c.id} style={{
            ...card, display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "border-color 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(210,205,245,0.32)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(210,205,245,0.1)"}
          >
            <div onClick={() => selectClient(c)} style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: "#eceaff", marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#6e6c88" }}>{c.note || "无备注"} · {c.sessions?.length || 0} 次占卜</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
              <button onClick={() => { setHistoryClient(c); setFilterCat("全部"); setView("history"); }}
                style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>记录</button>
              <button onClick={() => { if (confirm(`确认删除客户 ${c.name}？`)) deleteClient(c.id); }}
                style={{ ...btnGhost, padding: "6px 10px", fontSize: 12, color: "#c04068", borderColor: "rgba(192,64,104,0.4)" }}>
                删除
              </button>
            </div>
          </div>
        ))}

        {showNewClient ? (
          <div style={card}>
            <p className="section-label">新增客户</p>
            <input value={newClientName} onChange={e => setNewClientName(e.target.value)}
              placeholder="客户姓名 / 代称" style={{ ...inputStyle, marginBottom: 10 }} />
            <input value={newClientNote} onChange={e => setNewClientNote(e.target.value)}
              placeholder="备注（星座、背景等，可选）" style={{ ...inputStyle, marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addClient} style={btnPrimary}>确认添加</button>
              <button onClick={() => setShowNewClient(false)} style={btnGhost}>取消</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewClient(true)} style={{
            ...btnGhost, width: "100%", padding: "14px", textAlign: "center", borderStyle: "dashed"
          }}>＋ 添加新客户</button>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button onClick={() => { setSelected(null); setView("reading"); }} style={{ ...btnGhost, fontSize: 12 }}>
            不选客户，直接开始占卜
          </button>
        </div>
      </div>
    </div>
  );

  if (showDraw) return (
    <VirtualDraw
      slots={slots}
      onConfirm={(drawnCards) => { setCards(drawnCards); setShowDraw(false); }}
      onCancel={() => setShowDraw(false)}
    />
  );

  return (
    <div style={base}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => {
            if (currentSessionId && !outputArchived) {
              if (!confirm("当前解读还未归档，返回后无法找回。确认返回？")) return;
            }
            setView("clients");
          }} style={{ ...btnGhost, padding: "8px 14px", fontSize: 12 }}>← 客户</button>
          <div style={{ flex: 1 }}>
            <div className="display-title" style={{ fontSize: 18 }}>{selected ? selected.name : "匿名占卜"}</div>
            {selected?.note && <div style={{ fontSize: 11, color: "#6e6c88" }}>{selected.note}</div>}
          </div>
          {selected && (
            <button onClick={() => {
              if (loading || (currentSessionId && !outputArchived)) {
                const msg = loading
                  ? "正在生成解读，离开后生成结果不会保存。确认前往历史？"
                  : "当前解读还未归档，离开后将不会保存。确认前往历史？";
                if (!confirm(msg)) return;
              }
              setHistoryClient(selected); setFilterCat("全部"); setView("history");
            }} style={{ ...btnGhost, padding: "8px 14px", fontSize: 12 }}>
              历史 ({selected.sessions?.length || 0})
            </button>
          )}
        </div>

        <div style={card}>
          <p className="section-label">今日问题</p>
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            placeholder={spread === "时间流运势牌阵" ? "请填写占卜时间区间（如：未来1个月 / 接下来一季度）" : "今天想占卜什么呢？（提一个背景详细的好问题往往事半功倍，不填也可以随便问问）"} rows={2}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
        </div>

        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="section-label" style={{ margin: 0 }}>牌阵类型</p>
            <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(210,205,245,0.2)" }}>
              <button onClick={() => setUseVirtual(false)} style={{
                padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                background: !useVirtual ? "rgba(212,208,240,0.18)" : "transparent",
                color: !useVirtual ? "#eceaff" : "#6e6c88", border: "none", borderRight: "1px solid rgba(210,205,245,0.2)"
              }}>☉ 实体牌</button>
              <button onClick={() => setUseVirtual(true)} style={{
                padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                background: useVirtual ? "rgba(212,208,240,0.18)" : "transparent",
                color: useVirtual ? "#eceaff" : "#6e6c88", border: "none"
              }}>◎ 虚拟抽牌</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {Object.keys(SPREADS).map(s => (
              <TooltipButton key={s} label={s} tooltip={SPREAD_TOOLTIPS[s]}
                onClick={() => { setSpread(s); setCards({}); }}
                style={{
                  ...btnGhost, padding: "8px 16px", fontSize: 13,
                  borderColor: spread === s ? "#d4d0f0" : "rgba(210,205,245,0.18)",
                  color: spread === s ? "#eceaff" : "#6e6c88",
                  background: spread === s ? "rgba(212,208,240,0.08)" : "transparent"
                }} />
            ))}
          </div>
          {SPREAD_IMAGES[spread] && null /* 参考图仅内部使用 */}

          {useVirtual ? (
            <div>
              <button onClick={() => setShowDraw(true)} style={{ ...btnGhost, width: "100%", padding: "12px", textAlign: "center", borderStyle: "dashed" }}>
                🎴 {Object.keys(cards).length > 0 ? "重新抽牌" : "开始虚拟抽牌"}
              </button>
            </div>
          ) : (
            <div>
              {spread === "自定义牌阵" && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#6e6c88", marginBottom: 8 }}>位置数量：{customSlots}</div>
                  <input type="range" min={1} max={10} value={customSlots}
                    onChange={e => {
                      const n = +e.target.value;
                      setCustomSlots(n);
                      setCustomLabels(l => Array.from({ length: n }, (_, i) => l[i] || `位置${i+1}`));
                      setCards({});
                    }} style={{ width: "100%", accentColor: "#d4d0f0" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {Array.from({ length: customSlots }, (_, i) => (
                      <input key={i} value={customLabels[i] || ""}
                        onChange={e => setCustomLabels(l => { const nl = [...l]; nl[i] = e.target.value; return nl; })}
                        placeholder={`位置${i+1}`}
                        style={{ ...inputStyle, width: 100, fontSize: 12, padding: "6px 10px" }} />
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: slots.length <= 2 ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
                {slots.map(slot => (
                  <CardSelector key={slot.key} label={slot.label}
                    value={cards[slot.key]}
                    onChange={c => setCards(prev => ({ ...prev, [slot.key]: c }))} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={card}>
          <p className="section-label">事件分类</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(CATEGORIES).map(([name, cfg]) => (
              <button key={name} onClick={() => { categoryManualRef.current = true; setCategory(name); }} style={{
                ...btnGhost, padding: "6px 14px", fontSize: 13,
                borderColor: category === name ? cfg.color : "rgba(210,205,245,0.12)",
                color: category === name ? cfg.color : "#6e6c88",
                background: category === name ? cfg.bg : "transparent",
              }}>{name}</button>
            ))}
          </div>
        </div>

        {/* 已选牌面展示 */}
        {Object.keys(cards).length > 0 && slots.filter(s => cards[s.key]).length > 0 && (
          <div style={{ ...card, marginBottom: 12 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>✦ 已选牌面</p>
            {SPREAD_CARD_POSITIONS[spread] ? (
              <SpreadCardLayout spread={spread} slots={slots} cards={cards} />
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {slots.map(s => {
                  const c = cards[s.key];
                  if (!c) return null;
                  return (
                    <div key={s.key} style={{ textAlign: "center", width: 70 }}>
                      <div style={{ fontSize: 9, color: "#6e6c88", marginBottom: 3, lineHeight: 1.3 }}>
                        {s.label.replace(/^\d+\//, "").slice(0, 10)}
                      </div>
                      <div style={{ position: "relative" }}>
                        <img src={cardImgSrc(c)}
                          style={{ width: 70, height: 122, objectFit: "cover", borderRadius: 6,
                                   border: "1px solid rgba(210,205,245,0.3)",
                                   transform: c.reversed ? "rotate(180deg)" : "none" }} />
                        {c.reversed && (
                          <div style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8,
                                        background: "rgba(0,0,0,0.7)", color: "#d4d0f0", borderRadius: 3, padding: "1px 4px" }}>逆</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "#c8c4de", marginTop: 4 }}>{c.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button onClick={generate} disabled={loading}
          className="btn-primary btn-primary--full"
          style={{ marginBottom: 16 }}>
          {loading ? "✦ 解读中…" : "✦ 生成解读话术"}
        </button>

        {(aiOutput || loading || editableOutput) && (
          <div style={{ ...card, borderColor: "rgba(210,205,245,0.22)", background: "rgba(212,208,240,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p className="section-label" style={{ margin: 0 }}>✦ 解读参考</p>
              {outputArchived && <span style={{ color: "#5ea888", fontSize: 11 }}>✓ 已归档</span>}
            </div>

            {loading ? (
              <div ref={aiRef} style={{ fontSize: 15, lineHeight: 1.9, color: "#dcdaee", maxHeight: 400, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {!aiOutput && (
                  <div style={{ color: "#d4d0f0", fontSize: 13, fontStyle: "italic", opacity: 0.7 }}
                    className="thinking-pulse">占卜师正在夜观星象，请稍候……</div>
                )}
                {aiOutput}
                {aiOutput && <span style={{ color: "#d4d0f0" }}>▌</span>}
              </div>
            ) : (
              <textarea
                ref={aiRef}
                value={editableOutput}
                onChange={e => setEditableOutput(e.target.value)}
                style={{ ...inputStyle, minHeight: 300, resize: "vertical", lineHeight: 1.9, fontSize: 15,
                  color: "#dcdaee", background: "transparent", border: "none", padding: 0 }}
              />
            )}

            {!loading && editableOutput && (
              <div style={{ marginTop: 16 }}>
                {isRevising && revisionPhase === "thinking" && (
                  <div style={{ color: "#d4d0f0", fontSize: 13, fontStyle: "italic", marginBottom: 10, opacity: 0.7 }}
                    className="thinking-pulse">
                    ✦ 正在思考修改方案，原文保持不变…
                  </div>
                )}
                {isRevising && revisionPhase === "streaming" && (
                  <div style={{ color: "#d4d0f0", fontSize: 12, marginBottom: 6 }}>✦ 修改中…▌</div>
                )}
                {!isRevising && revisionPhase === "done" && (
                  <div style={{ color: "#5ea888", fontSize: 12, marginBottom: 8 }}>
                    ✦ 修改完成，请检查内容，满意后点"直接归档"。
                  </div>
                )}
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="有想改的地方就写在这里，留空直接归档也可以。"
                  rows={2}
                  disabled={isRevising}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: 10, fontSize: 13, opacity: isRevising ? 0.5 : 1 }}
                />
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {feedbackText.trim() && !isRevising && (
                    <button onClick={reviseOutput} style={btnPrimary}>根据反馈修改</button>
                  )}
                  {currentSessionId && !isRevising && (
                    <button onClick={archiveOutput} style={outputArchived ? btnGhost : btnPrimary}>
                      {outputArchived ? "✓ 已归档（重新归档）" : "直接归档"}
                    </button>
                  )}
                  {!isRevising && (
                    <button
                      onClick={() => {
                        setCards({}); setQuestion(""); setAiOutput(""); setEditableOutput("");
                        setOutputArchived(false); setFeedbackText(""); setRevisionPhase(null);
                        setCurrentSessionId(null); setPendingSession(null);
                        categoryManualRef.current = false; setCategory("综合运势");
                      }}
                      style={{ ...btnGhost, fontSize: 12 }}>
                      开始新一轮
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── App Router ────────────────────────────────────────────────────────────────
// 根据 URL 路径决定显示访客模式还是管理员模式
export default function AppRouter() {
  const isAdmin = window.location.pathname === "/tarot-Chiyue-office-admin";
  return isAdmin ? <TarotApp /> : <VisitorApp />;
}
