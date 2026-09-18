import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import { HealthKnowledge } from '../src/modules/health/entities/health-knowledge.entity';

const entries = [
  {
    title: '均衡饮食的基本原则',
    summary: '日常饮食可关注充足、平衡、适量和多样；优先选择种类丰富、少加工的食物，并根据个人情况调整。',
    content: '世界卫生组织将充足、平衡、适量和多样列为健康饮食的基本原则。日常可以逐步增加蔬菜、水果、全谷物和豆类等食物的多样性，并留意高盐、高糖和不健康脂肪的加工食品。具体饮食安排会因年龄、活动量、文化习惯和可获得食物而不同；如有特殊健康状况，请咨询专业人士。',
    category: 'healthy_lifestyle', tags: ['饮食', '生活方式'], sourceName: 'World Health Organization', sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
  },
  {
    title: '日常身体活动',
    summary: '规律活动与减少久坐有益健康；可从步行、骑行和适合自身情况的日常活动开始。',
    content: '世界卫生组织指出，身体活动包括休闲、出行、工作和家务中的身体运动。对大多数人而言，任何活动都比完全不活动更好，也应减少长时间久坐。可以选择步行、骑行、游泳或力量练习等适合自身条件的方式，循序渐进地建立规律。若运动时出现明显不适，应停止并寻求专业建议。',
    category: 'healthy_lifestyle', tags: ['运动', '生活方式'], sourceName: 'World Health Organization', sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  },
  {
    title: '认识与测量血压',
    summary: '血压读数包含收缩压和舒张压；单次读数不能替代专业评估，持续异常应咨询医疗专业人员。',
    content: '世界卫生组织说明，血压通常以两个数值表示：收缩压反映心脏收缩时血管内压力，舒张压反映心脏两次搏动之间的压力。规律记录可帮助观察变化，但不能用于自行确诊。均衡饮食、减少高盐摄入、保持身体活动、避免烟草和限制酒精摄入是一般生活方式建议；如读数持续异常或伴随明显不适，请及时寻求医疗专业人员评估。',
    category: 'health_metric', tags: ['血压', '测量', '生活方式'], sourceName: 'World Health Organization', sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
  },
] as const;

const main = async (): Promise<void> => {
  const orm = await MikroORM.init(config);
  try {
    const knowledge = orm.em.fork().getRepository(HealthKnowledge);
    let created = 0;
    for (const entry of entries) {
      if (await knowledge.findOne({ title: entry.title, sourceUrl: entry.sourceUrl })) continue;
      knowledge.create({ ...entry, isPublished: true, createdAt: new Date(), updatedAt: new Date() }, { partial: true });
      created += 1;
    }
    await knowledge.getEntityManager().flush();
    process.stdout.write(`Health knowledge seed completed: ${created} entries created, ${entries.length - created} already present.\n`);
  } finally {
    await orm.close(true);
  }
};

void main().catch((error: unknown) => {
  process.stderr.write(`Health knowledge seed failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  process.exitCode = 1;
});
