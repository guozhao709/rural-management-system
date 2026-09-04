import type { CreateHealthKnowledgeDto } from './dto/health-knowledge.dto';

/** Official-source drafts only. Publication still requires an accountable professional review. */
export const OFFICIAL_HEALTH_KNOWLEDGE_DRAFTS: CreateHealthKnowledgeDto[] = [
  {
    topic: '科学就医与紧急求助',
    title: '出现紧急情况时及时寻求医疗帮助',
    body: '如出现突发意识异常、呼吸困难、胸部明显不适或抽搐等紧急情况，应立即拨打 120 或前往急诊。本内容用于健康科普和就医引导，不构成诊断。',
    sourceName: '国家卫生健康委员会《中国公民健康素养——基本知识与技能（2024年版）》',
    sourceUrl: 'https://www.nhc.gov.cn/xcs/c100123/202405/73a4927142f34152abed875634a3c13b.shtml',
  },
];
