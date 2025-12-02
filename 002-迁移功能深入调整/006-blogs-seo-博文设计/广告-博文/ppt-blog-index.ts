export type PptCategoryName =
  | '通用'
  | '商务汇报'
  | '教育培训'
  | '培训课件'
  | '产品营销'
  | '营销方案'
  | '年终总结'
  | '项目提案'
  | '述职报告'
  | '付费与搜索';

export interface PptBlogIndexItem {
  /**
   * 相对 `广告-博文` 目录的路径，例如 `通用与混合场景/如何选择合适的PPT分类.zh.mdx`
   */
  file: string;
  /**
   * 与 PPT 资源站 UI 对齐的大类，用于前端筛选
   */
  pptCategory: PptCategoryName;
  /**
   * 辅助筛选的主题标签（可多选）
   */
  tags: string[];
}

/**
 * 说明：
 * - 本索引只维护「文件路径 → 大类 + 标签」的映射；
 * - 标题、描述等信息仍以 MDX frontmatter 为准；
 * - 后续在前端可按 `pptCategory` 及 `tags` 做筛选和推荐。
 */
export const pptBlogIndex: PptBlogIndexItem[] = [
  // 通用与混合场景
  {
    file: '通用与混合场景/PPT模板选错分类的5个典型坑.zh.mdx',
    pptCategory: '通用',
    tags: ['分类选择', '踩坑案例'],
  },
  {
    file: '通用与混合场景/PPT模板设计风格大盘点.zh.mdx',
    pptCategory: '通用',
    tags: ['风格', '视觉'],
  },
  {
    file: '通用与混合场景/每个PPT分类大概多少页最合适.zh.mdx',
    pptCategory: '通用',
    tags: ['页数规划'],
  },
  {
    file: '通用与混合场景/一份PPT能兼顾年终总结和项目复盘吗.zh.mdx',
    pptCategory: '通用',
    tags: ['混合场景', '结构设计'],
  },
  {
    file: '通用与混合场景/一份PPT兼顾领导同事和合作方三类受众的结构取舍.zh.mdx',
    pptCategory: '通用',
    tags: ['多受众', '结构设计'],
  },
  {
    file: '通用与混合场景/新手做PPT先从哪一类开始.zh.mdx',
    pptCategory: '通用',
    tags: ['入门', '分类选择'],
  },
  {
    file: '通用与混合场景/如何规划PPT页数按汇报时长和信息密度估算.zh.mdx',
    pptCategory: '通用',
    tags: ['页数规划', '时间控制'],
  },
  {
    file: '通用与混合场景/线下汇报vs线上发送同一份PPT该怎么调整.zh.mdx',
    pptCategory: '通用',
    tags: ['多终端', '线上线下'],
  },
  {
    file: '通用与混合场景/办公人常见12种汇报场景与PPT分类匹配.zh.mdx',
    pptCategory: '通用',
    tags: ['场景映射', '分类选择'],
  },
  {
    file: '通用与混合场景/可以在一个PPT里混用多个分类模板吗.zh.mdx',
    pptCategory: '通用',
    tags: ['混合场景', '分类选择'],
  },
  {
    file: '通用与混合场景/在年终总结PPT里复用商务汇报和项目提案页面的策略.zh.mdx',
    pptCategory: '通用',
    tags: ['复用页面', '年终总结', '商务汇报'],
  },
  {
    file: '通用与混合场景/设计师视角看PPT分类与风格拆解.zh.mdx',
    pptCategory: '通用',
    tags: ['风格', '设计思路'],
  },
  {
    file: '通用与混合场景/如何自查一份PPT的结构和页数是否合理.zh.mdx',
    pptCategory: '通用',
    tags: ['结构自查', '页数规划'],
  },
  {
    file: '通用与混合场景/如何选择合适的PPT分类.zh.mdx',
    pptCategory: '通用',
    tags: ['分类选择'],
  },
  {
    file: '通用与混合场景/从使用场景出发选PPT分类.zh.mdx',
    pptCategory: '通用',
    tags: ['场景映射', '分类选择'],
  },
  {
    file: '通用与混合场景/用常见问题法规划PPT结构.zh.mdx',
    pptCategory: '通用',
    tags: ['结构设计', 'FAQ思路'],
  },
  {
    file: '通用与混合场景/线上路演和线下路演PPT应该怎么区分准备.zh.mdx',
    pptCategory: '通用',
    tags: ['路演', '线上线下'],
  },
  {
    file: '通用与混合场景/页数不够用怎么办压缩PPT内容的七个策略.zh.mdx',
    pptCategory: '通用',
    tags: ['页数规划', '内容压缩'],
  },
  {
    file: '通用与混合场景/如何根据时间和听众裁剪PPT内容.zh.mdx',
    pptCategory: '通用',
    tags: ['时间控制', '结构裁剪'],
  },
  {
    file: '通用与混合场景/从项目提案到年终复盘两套PPT结构应该怎么改写.zh.mdx',
    pptCategory: '通用',
    tags: ['项目提案', '年终复盘', '结构改写'],
  },
  {
    file: '通用与混合场景/年终总结还是述职报告怎么选.zh.mdx',
    pptCategory: '通用',
    tags: ['年终总结', '述职报告', '分类选择'],
  },
  {
    file: '通用与混合场景/根据投影录屏和文件发送选择PPT模板.zh.mdx',
    pptCategory: '通用',
    tags: ['多终端', '模板选型'],
  },
  {
    file: '通用与混合场景/页数太多讲不完怎么办拆分和删减PPT内容的实战案例.zh.mdx',
    pptCategory: '通用',
    tags: ['页数规划', '内容拆分'],
  },
  {
    file: '通用与混合场景/如何用一份商务汇报模板改写出项目提案和年终总结三种版本.zh.mdx',
    pptCategory: '通用',
    tags: ['模板复用', '商务汇报', '年终总结', '项目提案'],
  },

  // 商务汇报
  {
    file: '商务汇报PPT/商务汇报PPT推荐页数按15-30-60分钟场景拆分.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['页数规划', '时间控制'],
  },
  {
    file: '商务汇报PPT/商务汇报PPT推荐字体和配色.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['字体与配色'],
  },
  {
    file: '商务汇报PPT/商务汇报PPT一般包含哪些内容.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['结构设计'],
  },
  {
    file: '商务汇报PPT/商务汇报PPT实战案例从杂乱需求到清晰故事线.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['实战案例', '故事线'],
  },
  {
    file: '商务汇报PPT/给老板看的商务汇报PPT如何用10页讲清一年.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['高层汇报', '页数规划'],
  },
  {
    file: '商务汇报PPT/商务汇报里的数据怎么展示更清楚.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['数据与图表'],
  },
  {
    file: '商务汇报PPT/不同行业的商务汇报结构有什么差异.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['行业差异', '结构设计'],
  },
  {
    file: '商务汇报PPT/下载商务汇报模板后如何在30分钟内改成自己的内容.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['模板改稿'],
  },
  {
    file: '商务汇报PPT/如何让商务汇报PPT更专业.zh.mdx',
    pptCategory: '商务汇报',
    tags: ['专业感', '结构设计'],
  },

  // 年终总结
  {
    file: '年终总结PPT/年终总结PPT一般该写些什么.zh.mdx',
    pptCategory: '年终总结',
    tags: ['结构设计'],
  },
  {
    file: '年终总结PPT/年终总结PPT推荐页数是多少.zh.mdx',
    pptCategory: '年终总结',
    tags: ['页数规划'],
  },
  {
    file: '年终总结PPT/年终总结PPT里的数据篇怎么写.zh.mdx',
    pptCategory: '年终总结',
    tags: ['数据与图表'],
  },
  {
    file: '年终总结PPT/年终总结PPT的风格与配图怎么选.zh.mdx',
    pptCategory: '年终总结',
    tags: ['风格', '配图'],
  },
  {
    file: '年终总结PPT/年终总结PPT里的失败与复盘怎么写.zh.mdx',
    pptCategory: '年终总结',
    tags: ['复盘', '表达方式'],
  },
  {
    file: '年终总结PPT/一套可复用的年终总结PPT骨架怎么设计.zh.mdx',
    pptCategory: '年终总结',
    tags: ['骨架', '结构设计'],
  },
  {
    file: '年终总结PPT/什么时候值得为年终总结PPT买一份模板.zh.mdx',
    pptCategory: '年终总结',
    tags: ['付费模板'],
  },
  {
    file: '年终总结PPT/职场新人和资深主管的年终总结PPT有什么不一样.zh.mdx',
    pptCategory: '年终总结',
    tags: ['角色差异', '结构设计'],
  },
  {
    file: '年终总结PPT/年终总结PPT里同时写总结和新年计划怎么设计结构.zh.mdx',
    pptCategory: '年终总结',
    tags: ['结构设计', '年终+计划'],
  },
  {
    file: '年终总结PPT/下载年终总结模板后如何快速修改从目录到图表的完整流程.zh.mdx',
    pptCategory: '年终总结',
    tags: ['模板改稿'],
  },

  // 项目提案
  {
    file: '项目提案PPT/项目提案PPT一般包含哪些内容.zh.mdx',
    pptCategory: '项目提案',
    tags: ['结构设计'],
  },
  {
    file: '项目提案PPT/项目提案PPT里如何说服决策层.zh.mdx',
    pptCategory: '项目提案',
    tags: ['说服决策层', '结构设计'],
  },
  {
    file: '项目提案PPT/技术项目和商业项目的提案PPT结构有什么不同.zh.mdx',
    pptCategory: '项目提案',
    tags: ['技术项目', '商业项目', '结构设计'],
  },
  {
    file: '项目提案PPT/如何让项目提案PPT更专业.zh.mdx',
    pptCategory: '项目提案',
    tags: ['专业感', '结构设计'],
  },
  {
    file: '项目提案PPT/项目提案PPT推荐页数是多少不同评审场景的拆分建议.zh.mdx',
    pptCategory: '项目提案',
    tags: ['页数规划', '评审场景'],
  },
  {
    file: '项目提案PPT/项目提案PPT推荐字体和配色如何兼顾技术感和商务感.zh.mdx',
    pptCategory: '项目提案',
    tags: ['字体与配色', '技术感', '商务感'],
  },
  {
    file: '项目提案PPT/下载项目提案模板后如何快速改成自己的BP.zh.mdx',
    pptCategory: '项目提案',
    tags: ['模板改稿', 'BP'],
  },

  // 教育培训与课件
  {
    file: '教育培训与课件PPT/教育培训PPT一般包含哪些内容.zh.mdx',
    pptCategory: '教育培训',
    tags: ['结构设计', '课件'],
  },
  {
    file: '教育培训与课件PPT/教育培训PPT推荐页数.zh.mdx',
    pptCategory: '教育培训',
    tags: ['页数规划', '课件'],
  },
  {
    file: '教育培训与课件PPT/教学培训PPT模板选型与互动设计.zh.mdx',
    pptCategory: '教育培训',
    tags: ['模板选型', '互动设计'],
  },
  {
    file: '教育培训与课件PPT/教育培训PPT分类和模板推荐清单.zh.mdx',
    pptCategory: '教育培训',
    tags: ['分类选择', '模板推荐'],
  },
  {
    file: '教育培训与课件PPT/教育培训PPT里的互动页怎么设计.zh.mdx',
    pptCategory: '教育培训',
    tags: ['互动设计'],
  },
  {
    file: '教育培训与课件PPT/一份PPT同时兼顾现场授课和课后复习的结构设计.zh.mdx',
    pptCategory: '教育培训',
    tags: ['课前课后', '结构设计'],
  },
  {
    file: '教育培训与课件PPT/用PPTAI搭建课程系列模板库的思路.zh.mdx',
    pptCategory: '教育培训',
    tags: ['课程体系', '模板库'],
  },
  {
    file: '教育培训与课件PPT/如何让教育培训PPT更专业又不无聊.zh.mdx',
    pptCategory: '教育培训',
    tags: ['专业感', '互动设计'],
  },
  {
    file: '教育培训与课件PPT/线下课堂和线上直播教育培训PPT应该怎么区别设计.zh.mdx',
    pptCategory: '教育培训',
    tags: ['线下课堂', '线上直播'],
  },
  {
    file: '教育培训与课件PPT/什么时候适合购买付费培训课件PPT模板企业内训的典型场景.zh.mdx',
    pptCategory: '培训课件',
    tags: ['付费模板', '企业内训'],
  },
  {
    file: '教育培训与课件PPT/下载培训课件模板后如何快速替换成自己的课程.zh.mdx',
    pptCategory: '培训课件',
    tags: ['模板改稿', '课件'],
  },

  // 产品营销与营销方案
  {
    file: '产品营销与营销方案PPT/产品营销PPT一般包含哪些内容.zh.mdx',
    pptCategory: '产品营销',
    tags: ['结构设计'],
  },
  {
    file: '产品营销与营销方案PPT/产品营销PPT推荐页数按三种场景拆分.zh.mdx',
    pptCategory: '产品营销',
    tags: ['页数规划', '场景拆分'],
  },
  {
    file: '产品营销与营销方案PPT/产品营销PPT用什么字体和配色打造记忆点.zh.mdx',
    pptCategory: '产品营销',
    tags: ['字体与配色', '记忆点'],
  },
  {
    file: '产品营销与营销方案PPT/如何让产品营销PPT更专业避免功能堆砌.zh.mdx',
    pptCategory: '产品营销',
    tags: ['专业感', '结构设计'],
  },
  {
    file: '产品营销与营销方案PPT/营销方案PPT一般怎么写.zh.mdx',
    pptCategory: '营销方案',
    tags: ['结构设计'],
  },
  {
    file: '产品营销与营销方案PPT/营销方案PPT里如何讲清创意和数据.zh.mdx',
    pptCategory: '营销方案',
    tags: ['创意', '数据与图表'],
  },
  {
    file: '产品营销与营销方案PPT/想提升转化率的营销方案PPT该怎么选.zh.mdx',
    pptCategory: '营销方案',
    tags: ['模板选型', '转化率'],
  },
  {
    file: '产品营销与营销方案PPT/适合小团队的轻量级营销方案PPT模板长什么样.zh.mdx',
    pptCategory: '营销方案',
    tags: ['轻量方案', '小团队'],
  },
  {
    file: '产品营销与营销方案PPT/用PPTAI搜索营销方案模板的实战指南.zh.mdx',
    pptCategory: '营销方案',
    tags: ['搜索', '模板选型'],
  },
  {
    file: '产品营销与营销方案PPT/下载产品营销模板后如何改成自家品牌风格.zh.mdx',
    pptCategory: '产品营销',
    tags: ['模板改稿', '品牌化'],
  },

  // 述职报告
  {
    file: '述职报告PPT/述职报告PPT一般包含哪些内容.zh.mdx',
    pptCategory: '述职报告',
    tags: ['结构设计'],
  },
  {
    file: '述职报告PPT/述职报告PPT推荐页数是多少.zh.mdx',
    pptCategory: '述职报告',
    tags: ['页数规划'],
  },
  {
    file: '述职报告PPT/初入职场的述职PPT写作与模板选择指南.zh.mdx',
    pptCategory: '述职报告',
    tags: ['入门', '模板选型'],
  },
  {
    file: '述职报告PPT/如何让述职报告PPT更专业从影响说起.zh.mdx',
    pptCategory: '述职报告',
    tags: ['专业感', '成果呈现'],
  },
  {
    file: '述职报告PPT/述职报告PPT推荐字体和配色如何传达信任感.zh.mdx',
    pptCategory: '述职报告',
    tags: ['字体与配色', '信任感'],
  },
  {
    file: '述职报告PPT/述职报告PPT里如何处理成绩不够好的情况.zh.mdx',
    pptCategory: '述职报告',
    tags: ['表达方式', '困难成绩'],
  },
  {
    file: '述职报告PPT/从日报周报到述职如何构建证据链.zh.mdx',
    pptCategory: '述职报告',
    tags: ['证据链', '数据与素材'],
  },
  {
    file: '述职报告PPT/下载述职模板后如何细致地填入业绩.zh.mdx',
    pptCategory: '述职报告',
    tags: ['模板改稿', '业绩呈现'],
  },
  {
    file: '述职报告PPT/用PPTAI为不同岗位生成个性化述职模板的思路.zh.mdx',
    pptCategory: '述职报告',
    tags: ['模板生成', '岗位差异'],
  },
  {
    file: '述职报告PPT/关键述职节点为什么值得用付费PPT模板.zh.mdx',
    pptCategory: '述职报告',
    tags: ['付费模板', '关键节点'],
  },

  // 付费模板 / 搜索 / 产品视角
  {
    file: '付费模板搜索与产品视角/免费PPT模板-vs-付费PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['付费模板', '对比'],
  },
  {
    file: '付费模板搜索与产品视角/下载PPT模板后怎么改最快通用流程.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['模板改稿', '通用流程'],
  },
  {
    file: '付费模板搜索与产品视角/免费vs付费商务汇报PPT模板什么时候该掏钱.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['付费模板', '商务汇报'],
  },
  {
    file: '付费模板搜索与产品视角/使用PPTAI搜索年终总结和项目提案模板的实战教程.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['搜索', '年终总结', '项目提案'],
  },
  {
    file: '付费模板搜索与产品视角/从用户常见问题反推PPT内容和分类.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['产品视角', '分类设计'],
  },
  {
    file: '付费模板搜索与产品视角/用常见问题规划整站PPT模板库的内容分类.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['产品视角', '分类设计'],
  },
  {
    file: '付费模板搜索与产品视角/如何快速找到自己要的PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['搜索', '筛选'],
  },
  {
    file: '付费模板搜索与产品视角/为了未来搜索和复用写PPT时如何设计结构和命名.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['结构设计', '可复用'],
  },
  {
    file: '付费模板搜索与产品视角/一句话关键词搜索怎么写.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['搜索', '关键词'],
  },
  {
    file: '付费模板搜索与产品视角/路演为什么更适合使用付费PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['付费模板', '路演'],
  },
  {
    file: '付费模板搜索与产品视角/如何根据实际内容删减和合并PPT模板中的章节.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['模板改稿', '结构裁剪'],
  },
  {
    file: '付费模板搜索与产品视角/为什么营销场景更适合使用付费PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['付费模板', '营销'],
  },
  {
    file: '付费模板搜索与产品视角/用分类关键词和页数组合精准搜索PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['搜索', '筛选'],
  },
  {
    file: '付费模板搜索与产品视角/如何用查找替换和母版快速批量修改PPT模板.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['模板改稿', '效率'],
  },
  {
    file: '付费模板搜索与产品视角/从常见问题看用户真实需求我们是如何设计PPT分类和页数推荐的.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['产品视角', '页数推荐'],
  },
  {
    file: '付费模板搜索与产品视角/为什么在常见问题里反复强调付费模板的价值.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['付费模板', '产品视角'],
  },
  {
    file: '付费模板搜索与产品视角/下载到好模板却改废了怎么办一次改稿失败的复盘.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['模板改稿', '踩坑案例'],
  },
  {
    file: '付费模板搜索与产品视角/产品视角看常见问题理解不同用户画像和使用场景.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['产品视角', '用户画像'],
  },
  {
    file: '付费模板搜索与产品视角/从用户问题到产品功能如何把页数风格分类变成产品设计.zh.mdx',
    pptCategory: '付费与搜索',
    tags: ['产品视角', '功能设计'],
  },
];
