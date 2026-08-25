import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import config from '../src/mikro-orm.config';
import { CropStatus } from '../src/modules/agriculture/agriculture.enums';
import { CropAlias } from '../src/modules/agriculture/entities/crop-alias.entity';
import { Crop } from '../src/modules/agriculture/entities/crop.entity';
import { normalizeCropAlias } from '../src/modules/agriculture/services/crop-normalization';

const seed = [
  { code: 'wheat', name: '小麦', aliases: ['麦子', 'wheat'] },
  { code: 'corn', name: '玉米', aliases: ['苞米', 'corn'] },
  { code: 'rice', name: '水稻', aliases: ['稻子', 'rice'] },
  { code: 'soybean', name: '大豆', aliases: ['黄豆', 'soybean'] },
  { code: 'peanut', name: '花生', aliases: ['落花生', 'peanut'] },
  { code: 'cotton', name: '棉花', aliases: ['皮棉', 'cotton'] },
  { code: 'rapeseed', name: '油菜', aliases: ['油菜籽', 'rapeseed'] },
  { code: 'sesame', name: '芝麻', aliases: ['胡麻', 'sesame'] },
  { code: 'sorghum', name: '高粱', aliases: ['蜀黍', 'sorghum'] },
  { code: 'millet', name: '谷子', aliases: ['小米', 'millet'] },
  { code: 'potato', name: '马铃薯', aliases: ['土豆', 'potato'] },
  { code: 'sweet-potato', name: '甘薯', aliases: ['红薯', '地瓜'] },
  { code: 'mung-bean', name: '绿豆', aliases: ['青小豆', 'mung bean'] },
  { code: 'cowpea', name: '豇豆', aliases: ['长豆角', 'cowpea'] },
  { code: 'tomato', name: '番茄', aliases: ['西红柿', 'tomato'] },
  { code: 'cucumber', name: '黄瓜', aliases: ['胡瓜', 'cucumber'] },
  { code: 'pepper', name: '辣椒', aliases: ['尖椒', 'chili'] },
  { code: 'eggplant', name: '茄子', aliases: ['矮瓜', 'eggplant'] },
  { code: 'cabbage', name: '甘蓝', aliases: ['包菜', '圆白菜'] },
  { code: 'chinese-cabbage', name: '大白菜', aliases: ['白菜', 'chinese cabbage'] },
  { code: 'cauliflower', name: '花椰菜', aliases: ['菜花', 'cauliflower'] },
  { code: 'radish', name: '萝卜', aliases: ['白萝卜', 'radish'] },
  { code: 'carrot', name: '胡萝卜', aliases: ['红萝卜', 'carrot'] },
  { code: 'onion', name: '洋葱', aliases: ['圆葱', 'onion'] },
  { code: 'garlic', name: '大蒜', aliases: ['蒜头', 'garlic'] },
  { code: 'ginger', name: '生姜', aliases: ['姜', 'ginger'] },
  { code: 'watermelon', name: '西瓜', aliases: ['夏瓜', 'watermelon'] },
  { code: 'melon', name: '甜瓜', aliases: ['香瓜', 'melón'] },
  { code: 'strawberry', name: '草莓', aliases: ['洋莓', 'strawberry'] },
  { code: 'grape', name: '葡萄', aliases: ['蒲桃', 'grape'] },
  { code: 'apple', name: '苹果', aliases: ['平果', 'apple'] },
  { code: 'pear', name: '梨', aliases: ['梨子', 'pear'] },
  { code: 'peach', name: '桃', aliases: ['桃子', 'peach'] },
  { code: 'citrus', name: '柑橘', aliases: ['橘子', '桔子'] },
  { code: 'broccoli', name: '西兰花', aliases: ['青花菜', 'broccoli'] },
  { code: 'banana', name: '香蕉', aliases: ['甘蕉', 'banana'] },
  { code: 'mango', name: '芒果', aliases: ['檬果', 'mango'] },
  { code: 'tea', name: '茶树', aliases: ['茶叶', 'tea'] },
  { code: 'sugarcane', name: '甘蔗', aliases: ['糖蔗', 'sugarcane'] },
  { code: 'spinach', name: '菠菜', aliases: ['菠薐菜', 'spinach'] },
  { code: 'lettuce', name: '生菜', aliases: ['叶用莴苣', 'lettuce'] },
  { code: 'celery', name: '芹菜', aliases: ['香芹', 'celery'] },
  { code: 'pumpkin', name: '南瓜', aliases: ['倭瓜', 'pumpkin'] },
  { code: 'zucchini', name: '西葫芦', aliases: ['角瓜', 'zucchini'] },
  { code: 'green-bean', name: '菜豆', aliases: ['四季豆', '芸豆'] },
  { code: 'chives', name: '韭菜', aliases: ['韭黄', 'chives'] },
  { code: 'plum', name: '李', aliases: ['李子', 'plum'] },
  { code: 'cherry', name: '樱桃', aliases: ['甜樱桃', 'cherry'] },
  { code: 'kiwi', name: '猕猴桃', aliases: ['奇异果', 'kiwifruit'] },
  { code: 'litchi', name: '荔枝', aliases: ['离枝', 'litchi'] },
];

const main = async (): Promise<void> => {
  const orm = await MikroORM.init(config);
  try {
    const em = orm.em.fork();
    const crops = em.getRepository(Crop);
    const aliases = em.getRepository(CropAlias);
    for (const item of seed) {
      let crop = await crops.findOne({ code: item.code });
      if (!crop) {
        crop = crops.create({ code: item.code, name: item.name, status: CropStatus.Active }, { partial: true });
      }
      for (const alias of item.aliases) {
        const normalizedAlias = normalizeCropAlias(alias);
        if (!(await aliases.findOne({ normalizedAlias }))) {
          aliases.create({ crop, alias, normalizedAlias }, { partial: true });
        }
      }
    }
    await em.flush();
    process.stdout.write('Agriculture crop seed completed.\n');
  } finally {
    await orm.close(true);
  }
};
void main().catch((error: unknown) => {
  process.stderr.write(`Failed to seed agriculture crops: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  process.exitCode = 1;
});
