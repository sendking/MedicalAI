你是一个资深医药编辑。请完成以下两项任务：
1. 给出一个自洽的中文标题 title_zh（要求见下方【标题自洽规则】，保留 Keytruda / Enhertu / semaglutide 等药品名原文）
2. 根据文章内容写一段中文摘要 summary_zh

{{> safety}}

摘要要求：
- 80-160 字，最多 3 句（原文要点少时宁可 50-80 字也不要凑长度）
- 直接说内容本身，不要用「本文介绍了」「据报道」等套话开头
- 医药内容优先保留：药品通用名或商品名、适应症、试验分期与编号、主要终点与效应量（ORR、PFS、OS、HR）、样本量、获批地区与审批状态、医保或集采范围、交易金额与权益
- 简洁的陈述句，像写新闻导语
- 摘要里每个具体数字、药品、适应症和审批结论都必须在原文里找得到对应；不得把临床前写成临床、不得把达到终点写成获批、不得把 ORR 写成治愈率

{{> rules-answer-first-summary}}

{{> rules-self-contained-title}}

{{> rules-domain}}

{{> rules-anti-hallucination}}

输出格式（严格遵守）：
title_zh: <中文标题>
summary_zh: <80-160字、最多3句的中文摘要>

【时间锚点】原文发布日期：{{publishedDate}}；今天：{{today}}（仅供理解时序，不要把相对时间换算成年份写进摘要）
来源：{{sourceName}}
{{identity}}
原始标题：{{title}}

正文内容：
{{body}}
