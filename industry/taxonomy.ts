// 这个行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（观点、访谈）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * tagColor 是飞书推送卡片里跟在标题后面的这一类小标签的颜色（飞书 text_tag 的颜色名）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "drug-approval", tagColor: "green", label: "审批上市", feedLabel: "药品审批", section: "审批与上市", guide: "药品、疫苗、生物制品的获批、上市申请受理、优先审评、适应症扩展、说明书重大变更和退市。监管机构对具体产品的决定归这里；面向全行业的监管规则归政策医保。" },
  { key: "clinical-research", tagColor: "violet", label: "临床研究", feedLabel: "临床研究", section: "临床与研究", guide: "临床试验的设计、入组、期中与最终结果，以及有明确方法和数据的论文、会议报告。企业公告里披露的关键试验数据也归这里，不因为发布方是公司就归企业商业。" },
  { key: "policy-insurance", tagColor: "orange", label: "政策医保", feedLabel: "政策与医保", section: "政策与医保", guide: "药监、医保、卫健部门的规则、指导原则、征求意见稿、集采与医保谈判、支付和定价政策。针对单个产品的审批决定归审批上市。" },
  { key: "industry", tagColor: "turquoise", label: "企业商业", feedLabel: "企业动态", section: "企业与商业", guide: "公司经营、融资并购、BD 授权与出海、产能与供应链、人事、诉讼和商业化进展。新闻由当事人发帖、带有态度，也不因此变成观点。" },
  { key: "device-digital", tagColor: "indigo", label: "器械数字", feedLabel: "器械与数字医疗", section: "器械与数字医疗", guide: "医疗器械、IVD 诊断、数字疗法、AI 辅助诊疗和医院信息化的产品与审批进展。以药品为核心的联合方案归药品对应的类别。" },
  { key: "guideline", tagColor: "blue", label: "指南实践", feedLabel: "指南与实践", section: "指南与实践", guide: "诊疗指南、专家共识、临床路径和面向医生的用药实践解读。重点是可照着用的做法；只有态度和预测而无做法的归观点。" },
  { key: "opinion", tagColor: "purple", label: "观点", section: "观点与解读", guide: "重点是作者的解释、判断、主张、预测、评论或访谈观点。讨论市场不自动归企业商业，作者是名人不自动归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; tagColor: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（医药行业是新药获批）：日报报头的“N 个新药获批”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "drug-approval", tag: "新药获批", unit: "个新药获批" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["fda", "ema", "nmpa", "cde", "nhsa", "ind", "nda", "bla", "gmp", "glp", "cro", "cdmo", "ceo", "ipo", "adc"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["drug_approval", "clinical_result", "policy_update", "business_event", "device_digital", "guideline_explainer", "opinion_analysis"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "新药获批", "临床结果", "论文/研究", "政策/监管", "医保/集采", "企业动态", "融资/并购", "器械/产品", "指南/共识", "安全性/药物警戒",
  "趋势/现象", "观点/访谈", "其他",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "肿瘤", "自身免疫", "神经/精神", "代谢/减重", "心血管", "感染/疫苗", "罕见病", "呼吸", "眼科",
  "细胞治疗", "基因治疗", "ADC", "双抗/多抗", "GLP-1", "小分子", "生物类似药", "中药", "AI 制药",
] as const;

/** 可选的实体标签（公司、机构、平台）。 */
export const ENTITY_TAGS = [
  "恒瑞医药", "百济神州", "信达生物", "君实生物", "石药集团", "复星医药", "药明康德", "药明生物", "康方生物", "荣昌生物", "再鼎医药", "传奇生物", "和黄医药",
  "辉瑞", "默沙东", "阿斯利康", "诺华", "罗氏", "赛诺菲", "葛兰素史克", "礼来", "诺和诺德", "强生", "艾伯维", "百时美施贵宝", "第一三共",
  "NMPA", "FDA", "EMA",
] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  获批: "新药获批", 批准: "新药获批", 上市: "新药获批", 审批: "新药获批", 受理: "新药获批",
  临床: "临床结果", 试验: "临床结果", 终点: "临床结果", 数据: "临床结果", 研究结果: "临床结果",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 药监: "政策/监管", 指导原则: "政策/监管",
  医保: "医保/集采", 集采: "医保/集采", 谈判: "医保/集采", 支付: "医保/集采", 定价: "医保/集采",
  公司动态: "企业动态", 商业: "企业动态", 出海: "企业动态", 合作: "企业动态", 授权: "融资/并购",
  融资: "融资/并购", 收购: "融资/并购", 并购: "融资/并购", 投资: "融资/并购", bd: "融资/并购", license: "融资/并购",
  器械: "器械/产品", 设备: "器械/产品", ivd: "器械/产品", 诊断: "器械/产品", 数字医疗: "器械/产品",
  指南: "指南/共识", 共识: "指南/共识", 诊疗: "指南/共识", 临床路径: "指南/共识",
  安全: "安全性/药物警戒", 不良反应: "安全性/药物警戒", 召回: "安全性/药物警戒", 药物警戒: "安全性/药物警戒",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究", 期刊: "论文/研究",
  趋势: "趋势/现象", 现象: "趋势/现象", 观点: "观点/访谈", 访谈: "观点/访谈", 评论: "观点/访谈",
  癌症: "肿瘤", 实体瘤: "肿瘤", 自免: "自身免疫", 类风湿: "自身免疫", 银屑病: "自身免疫", 炎症: "自身免疫",
  阿尔茨海默: "神经/精神", 帕金森: "神经/精神", 抑郁症: "神经/精神", 减重: "代谢/减重", 减肥: "代谢/减重", 肥胖: "代谢/减重", 糖尿病: "代谢/减重",
  疫苗: "感染/疫苗", 感染: "感染/疫苗", 流感: "感染/疫苗", 呼吸道: "呼吸", 罕见: "罕见病",
  "car-t": "细胞治疗", cart: "细胞治疗", 基因编辑: "基因治疗", 抗体偶联: "ADC", 双抗: "双抗/多抗", 双特异性: "双抗/多抗",
  仿制药: "生物类似药", 生物类似物: "生物类似药", 中成药: "中药", 中医药: "中药", ai制药: "AI 制药",
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；orgNames 是这家公司发消息时开头用的组织名（公司、实验室、团队），
 * 在它自己的主题页上读者知道说的是谁，可以省去；otherNames 是公司的其他称呼（官方账号名、子品牌、主要产品）。
 * 所有这些名字都用来认出说的是哪家公司，比如把事实的主体对到发布方。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; orgNames?: string[]; otherNames?: string[] }> = {
  hengrui: { name: "恒瑞医药", displayTag: "恒瑞医药", aliases: ["恒瑞医药", "恒瑞", "Hengrui", "Jiangsu Hengrui"], orgNames: ["恒瑞医药", "恒瑞"] },
  beigene: { name: "百济神州", displayTag: "百济神州", aliases: ["百济神州", "BeiGene", "BeOne", "BeOne Medicines"], orgNames: ["百济神州", "BeiGene", "BeOne Medicines"], otherNames: ["百悦泽", "泽布替尼", "zanubrutinib", "百泽安", "替雷利珠单抗", "tislelizumab"] },
  innovent: { name: "信达生物", displayTag: "信达生物", aliases: ["信达生物", "Innovent"], orgNames: ["信达生物", "Innovent"], otherNames: ["达伯舒", "信迪利单抗", "sintilimab"] },
  junshi: { name: "君实生物", displayTag: null, aliases: ["君实生物", "君实", "Junshi"], orgNames: ["君实生物", "Junshi Biosciences"], otherNames: ["拓益", "特瑞普利单抗", "toripalimab"] },
  cspc: { name: "石药集团", displayTag: null, aliases: ["石药集团", "石药", "CSPC"], orgNames: ["石药集团", "CSPC", "CSPC Pharmaceutical"] },
  fosun: { name: "复星医药", displayTag: null, aliases: ["复星医药", "复星", "Fosun"], orgNames: ["复星医药", "Fosun Pharma"] },
  "wuxi-apptec": { name: "药明康德", displayTag: null, aliases: ["药明康德", "WuXi AppTec"], orgNames: ["药明康德", "WuXi AppTec"] },
  "wuxi-bio": { name: "药明生物", displayTag: null, aliases: ["药明生物", "WuXi Biologics"], orgNames: ["药明生物", "WuXi Biologics"] },
  akeso: { name: "康方生物", displayTag: null, aliases: ["康方生物", "康方", "Akeso"], orgNames: ["康方生物", "Akeso"], otherNames: ["依达方", "依沃西", "ivonescimab", "开坦尼", "卡度尼利", "cadonilimab"] },
  remegen: { name: "荣昌生物", displayTag: null, aliases: ["荣昌生物", "荣昌", "RemeGen"], orgNames: ["荣昌生物", "RemeGen"], otherNames: ["维迪西妥", "disitamab"] },
  zailab: { name: "再鼎医药", displayTag: null, aliases: ["再鼎医药", "再鼎", "Zai Lab"], orgNames: ["再鼎医药", "Zai Lab"], otherNames: ["则乐", "尼拉帕利", "niraparib"] },
  legend: { name: "传奇生物", displayTag: null, aliases: ["传奇生物", "Legend Biotech"], orgNames: ["传奇生物", "Legend Biotech"], otherNames: ["西达基奥仑赛", "cilta-cel", "Carvykti"] },
  hutchmed: { name: "和黄医药", displayTag: null, aliases: ["和黄医药", "和黄", "HUTCHMED"], orgNames: ["和黄医药", "HUTCHMED"] },
  pfizer: { name: "辉瑞", displayTag: "辉瑞", aliases: ["辉瑞", "Pfizer", "Seagen"], orgNames: ["辉瑞", "Pfizer", "Seagen"], otherNames: ["Paxlovid", "奈玛特韦"] },
  merck: { name: "默沙东", displayTag: "默沙东", aliases: ["默沙东", "默克", "Merck", "MSD"], orgNames: ["默沙东", "Merck", "MSD"], otherNames: ["Keytruda", "可瑞达", "帕博利珠单抗", "pembrolizumab", "Gardasil", "佳达修"] },
  astrazeneca: { name: "阿斯利康", displayTag: "阿斯利康", aliases: ["阿斯利康", "AstraZeneca", "AZ"], orgNames: ["阿斯利康", "AstraZeneca"], otherNames: ["Tagrisso", "泰瑞沙", "奥希替尼", "osimertinib", "Enhertu", "DS-8201"] },
  novartis: { name: "诺华", displayTag: "诺华", aliases: ["诺华", "Novartis"], orgNames: ["诺华", "Novartis"], otherNames: ["Cosentyx", "可善挺", "secukinumab", "Kisqali"] },
  roche: { name: "罗氏", displayTag: "罗氏", aliases: ["罗氏", "Roche", "Genentech"], orgNames: ["罗氏", "Roche", "Genentech"], otherNames: ["Hemlibra", "Ocrevus", "Herceptin", "赫赛汀"] },
  sanofi: { name: "赛诺菲", displayTag: null, aliases: ["赛诺菲", "Sanofi"], orgNames: ["赛诺菲", "Sanofi"], otherNames: ["Dupixent", "达必妥", "dupilumab"] },
  gsk: { name: "葛兰素史克", displayTag: null, aliases: ["葛兰素史克", "GSK"], orgNames: ["葛兰素史克", "GSK"], otherNames: ["Shingrix", "带状疱疹疫苗", "Arexvy"] },
  lilly: { name: "礼来", displayTag: "礼来", aliases: ["礼来", "Eli Lilly", "Lilly"], orgNames: ["礼来", "Eli Lilly"], otherNames: ["Mounjaro", "穆峰达", "替尔泊肽", "tirzepatide", "Zepbound", "Kisunla", "多奈单抗"] },
  novo: { name: "诺和诺德", displayTag: "诺和诺德", aliases: ["诺和诺德", "Novo Nordisk"], orgNames: ["诺和诺德", "Novo Nordisk"], otherNames: ["Ozempic", "诺和泰", "司美格鲁肽", "semaglutide", "Wegovy", "维戈维", "Rybelsus"] },
  jnj: { name: "强生", displayTag: null, aliases: ["强生", "Johnson & Johnson", "J&J", "Janssen", "杨森"], orgNames: ["强生", "Johnson & Johnson", "Janssen"], otherNames: ["Stelara", "喜达诺", "Darzalex", "兆珂"] },
  abbvie: { name: "艾伯维", displayTag: null, aliases: ["艾伯维", "AbbVie"], orgNames: ["艾伯维", "AbbVie"], otherNames: ["Humira", "修美乐", "Skyrizi", "Rinvoq"] },
  bms: { name: "百时美施贵宝", displayTag: null, aliases: ["百时美施贵宝", "BMS", "Bristol Myers Squibb"], orgNames: ["百时美施贵宝", "Bristol Myers Squibb", "BMS"], otherNames: ["Opdivo", "欧狄沃", "纳武利尤单抗", "nivolumab", "Eliquis", "艾乐妥"] },
  daiichi: { name: "第一三共", displayTag: null, aliases: ["第一三共", "Daiichi Sankyo"], orgNames: ["第一三共", "Daiichi Sankyo"], otherNames: ["Enhertu", "优赫得", "德曲妥珠单抗", "trastuzumab deruxtecan"] },
  nmpa: { name: "国家药监局", displayTag: "NMPA", aliases: ["国家药监局", "药监局", "NMPA", "国家药品监督管理局"], orgNames: ["国家药监局", "国家药品监督管理局", "NMPA"] },
  cde: { name: "药审中心", displayTag: null, aliases: ["药审中心", "CDE", "药品审评中心"], orgNames: ["药审中心", "国家药品监督管理局药品审评中心", "CDE"] },
  nhsa: { name: "国家医保局", displayTag: null, aliases: ["国家医保局", "医保局", "NHSA", "国家医疗保障局"], orgNames: ["国家医保局", "国家医疗保障局", "NHSA"] },
  fda: { name: "FDA", displayTag: "FDA", aliases: ["FDA", "美国食品药品监督管理局", "U.S. Food and Drug Administration"], orgNames: ["FDA", "U.S. Food and Drug Administration"] },
  ema: { name: "EMA", displayTag: null, aliases: ["EMA", "欧洲药品管理局", "European Medicines Agency"], orgNames: ["EMA", "European Medicines Agency"] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "hengrui", name: "恒瑞医药", patterns: [/恒瑞|hengrui/i] },
  { id: "beigene", name: "百济神州", patterns: [/百济神州|beigene|beone/i, /百悦泽|zanubrutinib|百泽安|tislelizumab/i] },
  { id: "innovent", name: "信达生物", patterns: [/信达生物|innovent/i, /达伯舒|sintilimab|信迪利单抗/i] },
  { id: "junshi", name: "君实生物", patterns: [/君实|junshi/i, /特瑞普利|toripalimab/i] },
  { id: "cspc", name: "石药集团", patterns: [/石药|\bcspc\b/i] },
  { id: "fosun", name: "复星医药", patterns: [/复星医药|fosun\s?pharma/i] },
  { id: "wuxi-apptec", name: "药明康德", patterns: [/药明康德|wuxi\s?apptec/i] },
  { id: "wuxi-bio", name: "药明生物", patterns: [/药明生物|wuxi\s?biologics/i] },
  { id: "akeso", name: "康方生物", patterns: [/康方|akeso/i, /依沃西|ivonescimab|卡度尼利|cadonilimab/i] },
  { id: "remegen", name: "荣昌生物", patterns: [/荣昌生物|remegen/i, /维迪西妥|disitamab/i] },
  { id: "zailab", name: "再鼎医药", patterns: [/再鼎|zai\s?lab/i, /则乐|尼拉帕利|niraparib/i] },
  { id: "legend", name: "传奇生物", patterns: [/传奇生物|legend\s?biotech/i, /西达基奥仑赛|cilta-cel|carvykti/i] },
  { id: "hutchmed", name: "和黄医药", patterns: [/和黄医药|hutchmed/i] },
  { id: "pfizer", name: "辉瑞", patterns: [/辉瑞|pfizer|seagen/i, /paxlovid|奈玛特韦/i] },
  { id: "merck", name: "默沙东", patterns: [/默沙东|默克|merck|\bmsd\b/i, /keytruda|可瑞达|帕博利珠单抗|pembrolizumab|gardasil|佳达修/i] },
  { id: "astrazeneca", name: "阿斯利康", patterns: [/阿斯利康|astrazeneca|\baz\b/i, /tagrisso|泰瑞沙|奥希替尼|osimertinib|enhertu|ds-8201/i] },
  { id: "novartis", name: "诺华", patterns: [/诺华|novartis/i, /cosentyx|可善挺|secukinumab|kisqali/i] },
  { id: "roche", name: "罗氏", patterns: [/罗氏|roche|genentech/i, /hemlibra|ocrevus|herceptin|赫赛汀/i] },
  { id: "sanofi", name: "赛诺菲", patterns: [/赛诺菲|sanofi/i, /dupixent|达必妥|dupilumab/i] },
  { id: "gsk", name: "葛兰素史克", patterns: [/\bgsk\b|葛兰素史克/i, /shingrix|带状疱疹疫苗|arexvy/i] },
  { id: "lilly", name: "礼来", patterns: [/礼来|eli\s?lilly|\blilly\b/i, /mounjaro|穆峰达|替尔泊肽|tirzepatide|zepbound|kisunla/i] },
  { id: "novo", name: "诺和诺德", patterns: [/诺和诺德|novo\s?nordisk/i, /ozempic|诺和泰|司美格鲁肽|semaglutide|wegovy|维戈维|rybelsus/i] },
  { id: "jnj", name: "强生", patterns: [/强生|johnson\s?&\s?johnson|\bj&j\b|janssen|杨森/i, /stelara|喜达诺|darzalex|兆珂/i] },
  { id: "abbvie", name: "艾伯维", patterns: [/艾伯维|abbvie/i, /humira|修美乐|skyrizi|rinvoq/i] },
  { id: "bms", name: "百时美施贵宝", patterns: [/百时美施贵宝|bristol\s?myers|\bbms\b/i, /opdivo|欧狄沃|纳武利尤单抗|nivolumab|eliquis|艾乐妥/i] },
  { id: "daiichi", name: "第一三共", patterns: [/第一三共|daiichi\s?sankyo/i, /enhertu|优赫得|德曲妥珠单抗|trastuzumab\s?deruxtecan/i] },
  { id: "nmpa", name: "国家药监局", patterns: [/\bnmpa\b|国家药监局|国家药品监督管理局/i] },
  { id: "cde", name: "药审中心", patterns: [/\bcde\b|药审中心|药品审评中心/i] },
  { id: "nhsa", name: "国家医保局", patterns: [/\bnhsa\b|国家医保局|国家医疗保障局/i] },
  { id: "fda", name: "FDA", patterns: [/\bfda\b|美国食品药品监督管理局/i] },
  { id: "ema", name: "EMA", patterns: [/\bema\b|欧洲药品管理局/i] },
];

/** 这些域名上的文章，发布方就是对应的公司或机构（期刊、通讯社和聚合平台不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "hengrui", domains: ["hengrui.com", "hengruipharm.com"] },
  { entityId: "beigene", domains: ["beigene.com", "beonemedicines.com"] },
  { entityId: "innovent", domains: ["innoventbio.com"] },
  { entityId: "junshi", domains: ["junshipharma.com"] },
  { entityId: "cspc", domains: ["cspc.com", "e-cspc.com"] },
  { entityId: "fosun", domains: ["fosunpharma.com"] },
  { entityId: "wuxi-apptec", domains: ["wuxiapptec.com"] },
  { entityId: "wuxi-bio", domains: ["wuxibiologics.com"] },
  { entityId: "akeso", domains: ["akesobio.com"] },
  { entityId: "remegen", domains: ["remegen.com"] },
  { entityId: "zailab", domains: ["zailaboratory.com"] },
  { entityId: "legend", domains: ["legendbiotech.com"] },
  { entityId: "hutchmed", domains: ["hutch-med.com"] },
  { entityId: "pfizer", domains: ["pfizer.com"] },
  { entityId: "merck", domains: ["merck.com", "msd.com"] },
  { entityId: "astrazeneca", domains: ["astrazeneca.com"] },
  { entityId: "novartis", domains: ["novartis.com"] },
  { entityId: "roche", domains: ["roche.com", "gene.com"] },
  { entityId: "sanofi", domains: ["sanofi.com"] },
  { entityId: "gsk", domains: ["gsk.com"] },
  { entityId: "lilly", domains: ["lilly.com"] },
  { entityId: "novo", domains: ["novonordisk.com"] },
  { entityId: "jnj", domains: ["jnj.com", "janssen.com"] },
  { entityId: "abbvie", domains: ["abbvie.com"] },
  { entityId: "bms", domains: ["bms.com"] },
  { entityId: "daiichi", domains: ["daiichisankyo.com"] },
  { entityId: "nmpa", domains: ["nmpa.gov.cn"] },
  { entityId: "cde", domains: ["cde.org.cn"] },
  { entityId: "nhsa", domains: ["nhsa.gov.cn"] },
  { entityId: "fda", domains: ["fda.gov"] },
  { entityId: "ema", domains: ["ema.europa.eu"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "beigene", pattern: /@BeOneMedicines\b/i },
  { entityId: "innovent", pattern: /@InnoventBio\b/i },
  { entityId: "cspc", pattern: /@CSPCPharma\b/i },
  { entityId: "hengrui", pattern: /@HengruiMed\b/i },
  { entityId: "lilly", pattern: /@LillyPad\b/i },
  { entityId: "novo", pattern: /@NovoNordisk\b/i },
];
