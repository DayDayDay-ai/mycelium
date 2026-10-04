import { PrismaClient, Edibility } from "@prisma/client";
import { hash } from "bcryptjs";
import { extendedRows } from "./curated";
import { existsSync, readFileSync } from "node:fs";
const photoPath = "src/lib/photo-credits.json";
const photos: Record<string, {url:string; author:string}> = existsSync(photoPath) ? JSON.parse(readFileSync(photoPath, "utf8")) : {};
const calendar: Record<string, number[]> = {
  "belyy-grib": [6,7,8,9,10], "lisichka": [6,7,8,9,10,11],
  "podberezovik": [7,8,9,10,11], "podosinovik": [7,8,9,10,11],
  "shampinion": [8,9,10,11], "muhomor": [8,9,10,11],
  "blednaya-poganka": [7,8,9,10,11], "zhelchnyy-grib": [8,9,10,11],
  "openok": [7,8,9,10,11], "lozhnyy-openok": [1,2,3,4,5,6,7,8,9,10,11,12],
  "lozhnaya-lisichka": [8,9,10,11], "muhomor-panternyy": [8,9,10,11],
  "svinushka": [7,8,9,10], "strochok": [3,4,5,6],
};
const places: Record<string, string[]> = {
  "belyy-grib": ["Почва под дубами и буками", "Также хвойные леса с сосной или елью"],
  "lisichka": ["Почва и мох в лиственных и хвойных лесах", "Под деревьями, а не на пнях"],
  "podberezovik": ["Под берёзами", "Берёзовые и смешанные леса"],
  "podosinovik": ["Под осинами и другими тополями", "Лиственные и смешанные леса"],
  "shampinion": ["Пастбища, луга и травянистые поляны", "Иногда парки"],
  "muhomor": ["Под берёзами, соснами и елями", "Лиственные, хвойные и смешанные леса"],
  "blednaya-poganka": ["Лиственные и смешанные леса", "Часто под дубами и буками"],
  "zhelchnyy-grib": ["Хвойные леса", "Почва под соснами и елями"],
  "openok": ["Пни, корни и основания стволов", "Живые и мёртвые лиственные деревья"],
  "lozhnyy-openok": ["Гниющие пни и брёвна", "Мёртвая древесина лиственных и хвойных деревьев"],
  "lozhnaya-lisichka": ["Хвойная подстилка", "Гниющая древесина и древесная щепа"],
};
const db = new PrismaClient();
const rows = [
  [
    "belyy-grib",
    "Белый гриб",
    "Boletus edulis",
    "EDIBLE",
    "#9b6138",
    "bolete",
    "Выпуклая коричневая шляпка.",
    "Светлая толстая ножка со светлой сеточкой.",
    "Трубчатый слой, от белого до оливкового.",
    "Хвойный лес|Смешанный лес",
    "Ель|Сосна|Берёза",
    "6,7,8,9,10",
    "https://www.first-nature.com/fungi/boletus-edulis.php",
  ],
  [
    "lisichka",
    "Лисичка настоящая",
    "Cantharellus cibarius",
    "EDIBLE",
    "#eda52b",
    "chanterelle",
    "Жёлтая, с волнистым краем, воронковидная.",
    "Жёлтая, плавно переходит в шляпку.",
    "Складки, нисходящие на ножку; не настоящие пластинки.",
    "Хвойный лес|Смешанный лес",
    "Ель|Сосна|Берёза",
    "6,7,8,9,10",
    "https://www.first-nature.com/fungi/cantharellus-cibarius.php",
  ],
  [
    "podberezovik",
    "Подберёзовик",
    "Leccinum scabrum",
    "EDIBLE",
    "#795044",
    "bolete",
    "Коричневая полушаровидная шляпка.",
    "Светлая ножка с тёмными чешуйками.",
    "Трубчатый, светлый, с возрастом сероватый.",
    "Лиственный лес|Смешанный лес",
    "Берёза",
    "6,7,8,9,10",
    "https://www.first-nature.com/fungi/leccinum-scabrum.php",
  ],
  [
    "podosinovik",
    "Подосиновик красный",
    "Leccinum aurantiacum",
    "EDIBLE",
    "#dd6e30",
    "bolete",
    "Оранжево-красная выпуклая шляпка.",
    "С чешуйками, окраска меняется с возрастом.",
    "Светлый трубчатый слой.",
    "Лиственный лес|Смешанный лес",
    "Осина|Тополь",
    "6,7,8,9,10",
    "https://www.first-nature.com/fungi/leccinum-aurantiacum.php",
  ],
  [
    "shampinion",
    "Шампиньон полевой",
    "Agaricus arvensis",
    "EDIBLE",
    "#ded4bc",
    "agaric",
    "Белая или кремовая шляпка.",
    "С кольцом; проверяйте целое основание ножки.",
    "Пластинки с возрастом темнеют до коричневых.",
    "Луг|Поляна",
    "Требует проверки",
    "6,7,8,9,10",
    "https://www.first-nature.com/fungi/agaricus-arvensis.php",
  ],
  [
    "muhomor",
    "Мухомор красный",
    "Amanita muscaria",
    "POISONOUS",
    "#ec402f",
    "amanita",
    "Красная шляпка с белыми остатками покрывала; их может смыть дождём.",
    "Белая, с кольцом и утолщённым основанием.",
    "Белые пластинки.",
    "Хвойный лес|Смешанный лес",
    "Берёза|Сосна",
    "8,9,10,11",
    "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/fly-agaric/",
  ],
  [
    "blednaya-poganka",
    "Бледная поганка",
    "Amanita phalloides",
    "DEADLY",
    "#b2b86c",
    "amanita",
    "Оливковая, желтоватая или почти белая.",
    "Белая с кольцом и мешковидной вольвой у основания.",
    "Белые пластинки.",
    "Лиственный лес|Смешанный лес",
    "Дуб|Бук",
    "7,8,9,10,11",
    "https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/fungi-and-lichens/deathcap/",
  ],
  [
    "zhelchnyy-grib",
    "Жёлчный гриб",
    "Tylopilus felleus",
    "INEDIBLE",
    "#bc8b62",
    "bolete",
    "Коричневая выпуклая шляпка.",
    "Выраженная тёмная сеточка на ножке.",
    "Трубчатый слой с возрастом розовеет.",
    "Хвойный лес|Смешанный лес",
    "Сосна|Ель",
    "7,8,9,10",
    "https://www.first-nature.com/fungi/tylopilus-felleus.php",
  ],
  [
    "openok",
    "Опёнок осенний",
    "Armillaria mellea",
    "CONDITIONAL",
    "#cba25e",
    "agaric",
    "Медово-коричневая, часто с чешуйками.",
    "Обычно с кольцом.",
    "Светлые пластинки.",
    "Древесина|Лиственный лес",
    "Требует проверки",
    "8,9,10,11",
    "https://www.first-nature.com/fungi/armillaria-mellea.php",
  ],
  [
    "lozhnyy-openok",
    "Ложноопёнок серно-жёлтый",
    "Hypholoma fasciculare",
    "POISONOUS",
    "#d6c244",
    "agaric",
    "Серно-жёлтая, центр темнее.",
    "Без выраженного кольца.",
    "Желтоватые, позднее зеленоватые и тёмные пластинки.",
    "Древесина|Смешанный лес",
    "Требует проверки",
    "4,5,6,7,8,9,10,11",
    "https://www.first-nature.com/fungi/hypholoma-fasciculare.php",
  ],
  [
    "lozhnaya-lisichka",
    "Лисичка ложная",
    "Hygrophoropsis aurantiaca",
    "INEDIBLE",
    "#ee8533",
    "chanterelle",
    "Оранжевая, часто с более ровным краем.",
    "Оранжевая, тонкая.",
    "Настоящие тонкие, часто разветвлённые пластинки.",
    "Хвойный лес|Древесина",
    "Сосна",
    "8,9,10,11",
    "https://www.first-nature.com/fungi/hygrophoropsis-aurantiaca.php",
  ],
];
async function main() {
  for (const [i, r] of [...rows, ...extendedRows].entries()) {
    const [
      slug,
      nameRu,
      nameLatin,
      edibility,
      modelColor,
      modelShape,
      capDescription,
      stemDescription,
      hymenophoreDescription,
      habitat,
      associatedTrees,
      season,
      sourceUrl,
    ] = r;
    const data = {
      nameRu,
      nameLatin,
      edibility: edibility as Edibility,
      modelColor,
      modelShape: ["blednaya-poganka", "muhomor-vonyuchiy"].includes(slug) ? "amanita-smooth" : slug === "strochok" ? "falsemorel" : modelShape,
      capDescription,
      stemDescription,
      hymenophoreDescription,
      habitat: places[slug] || habitat.split("|"),
      associatedTrees: associatedTrees && !associatedTrees.startsWith("Требует провер") ? associatedTrees.split("|") : [],
      seasonMonths: calendar[slug] || season.split(",").map(Number),
      sourceUrl: slug === "muhomor" ? "https://www.first-nature.com/fungi/amanita-muscaria.php" : slug === "blednaya-poganka" ? "https://www.first-nature.com/fungi/amanita-phalloides.php" : sourceUrl,
      description: `${nameRu} — учебная карточка вида ${nameLatin}. Сравните шляпку, ножку и нижнюю сторону. Ни один отдельный признак не подтверждает безопасность.`,
      warning:
        edibility === "DEADLY"
          ? "Смертельно ядовит. Не собирать и не употреблять."
          : edibility === "POISONOUS"
            ? "Ядовит. Не собирать и не употреблять."
            : edibility === "CONDITIONAL" ? "В сыром виде или при неправильной обработке может вызвать отравление. Эта карточка не содержит инструкции приготовления и не подтверждает безопасность найденного гриба." : edibility === "INEDIBLE" ? "Несъедобный вид. Изучайте в природе, не употребляйте." : "Не используйте эту карточку как разрешение на сбор или употребление.",
      collectionStatus: (["DEADLY", "POISONOUS", "INEDIBLE"].includes(edibility)
        ? "FORBIDDEN"
        : "REGIONAL") as "FORBIDDEN" | "REGIONAL",
      toxicityLevel: ["DEADLY", "POISONOUS"].includes(edibility)
        ? "Токсичен"
        : "Требует проверки",
      difficulty: i === 6 ? 3 : 2,
      popularity: 100 - i,
      coverImage: photos[slug]?.url || `/images/${slug}.svg`,
    };
    const item = await db.mushroom.upsert({
      where: { slug },
      create: { slug, ...data },
      update: data,
    });
    if (photos[slug] && !await db.mushroomImage.findFirst({where:{mushroomId:item.id,url:photos[slug].url}}))
      await db.mushroomImage.create({data:{mushroomId:item.id,url:photos[slug].url,alt:`${nameRu} (${nameLatin}). ${photos[slug].author}`}});
  }
  const links = [
    ["openok-letniy", "galerina", "Летний опёнок и смертельно ядовитая галерина очень похожи и растут на древесине. Макропризнаков может быть недостаточно; необходимо экспертное, иногда микроскопическое определение."],
    ["shampinion", "shampinion-zheltokozhiy", "У желтокожего шампиньона основание ножки быстро желтеет при повреждении. Проверяйте совокупность признаков; не пробуйте на вкус."],
    ["smorchok", "strochok", "У сморчка шляпка с ячейками, у строчка извилистые складки. Строчок опасен даже после обработки; не используйте один признак как основание для употребления."],
    ["syroezhka-zelenovataya", "blednaya-poganka", "Зелёная окраска не отличает эти виды надёжно. У поганки есть вольва и обычно кольцо; у сыроежки нет. Основание ножки необходимо видеть полностью."],
    [
      "belyy-grib",
      "zhelchnyy-grib",
      "У жёлчного гриба розовеющий трубчатый слой и тёмная сеточка. Не пробуйте гриб на вкус.",
    ],
    [
      "lisichka",
      "lozhnaya-lisichka",
      "У настоящей лисички складки, у ложной — тонкие пластинки.",
    ],
    [
      "shampinion",
      "blednaya-poganka",
      "У поганки белые пластинки и вольва; у зрелого шампиньона пластинки коричневые. Проверяйте все признаки с экспертом.",
    ],
    [
      "openok",
      "lozhnyy-openok",
      "Наличие кольца и цвет пластинок — лишь часть признаков; похожих видов много.",
    ],
  ];
  for (const [a, b, differences] of links) {
    const x = await db.mushroom.findUniqueOrThrow({ where: { slug: a } });
    const y = await db.mushroom.findUniqueOrThrow({ where: { slug: b } });
    for (const [mushroomId, similarId] of [
      [x.id, y.id],
      [y.id, x.id],
    ])
      await db.mushroomLookalike.upsert({
        where: { mushroomId_similarId: { mushroomId, similarId } },
        create: {
          mushroomId,
          similarId,
          differences,
          risk: "Высокий: подтверждайте определение с экспертом",
        },
        update: {},
      });
  }
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    if (!/^[a-z][a-z0-9_]{2,29}$/i.test(process.env.ADMIN_USERNAME)) throw Error("ADMIN_USERNAME: 3–30 символов латиницей, цифры и _; первый символ — буква");
    if (process.env.ADMIN_PASSWORD.length < 4)
      throw Error("ADMIN_PASSWORD: минимум 4 символа");
    await db.user.upsert({
      where: { username: process.env.ADMIN_USERNAME.toLowerCase() },
      create: {
        username: process.env.ADMIN_USERNAME.toLowerCase(),
        name: "Администратор",
        passwordHash: await hash(process.env.ADMIN_PASSWORD, 12),
        role: "ADMIN",
      },
      update: { role: "ADMIN" },
    });
  }
  console.log("Seed complete:", await db.mushroom.count(), "mushrooms");
}
main().finally(() => db.$disconnect());


