import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   adaptateur de stockage local (remplace l'API window.storage
   propre aux artefacts Claude par le localStorage du navigateur,
   pour que l'app fonctionne en dehors de claude.ai, ex: sur GitHub Pages)
   ============================================================ */

const storage = {
  get: async (key) => {
    const v = localStorage.getItem("kanji-note:" + key);
    if (v === null) throw new Error("not found");
    return { key, value: v };
  },
  set: async (key, value) => {
    localStorage.setItem("kanji-note:" + key, value);
    return { key, value };
  },
};

/* ============================================================
   données de départ
   ============================================================ */

const SEED_WORDS = [
  { jp: "いち", fr: "un, 1" },
  { jp: "に", fr: "deux, 2" },
  { jp: "さん", fr: "trois, 3" },
  { jp: "よん, し", fr: "quatre, 4" },
  { jp: "ご", fr: "cinq, 5" },
  { jp: "ろく", fr: "six, 6" },
  { jp: "なな, しち", fr: "sept, 7" },
  { jp: "はち", fr: "huit, 8" },
  { jp: "きゅう, く", fr: "neuf, 9" },
  { jp: "じゅう", fr: "dix, 10" },
  { jp: "かぞく", fr: "famille" },
  { jp: "おとうさん", fr: "père" },
  { jp: "おかあさん", fr: "mère" },
  { jp: "おにいさん", fr: "grand frère" },
  { jp: "おねえさん", fr: "grande sœur" },
  { jp: "おとうと", fr: "petit frère" },
  { jp: "いもうと", fr: "petite sœur" },
  { jp: "こんにちは", fr: "bonjour" },
  { jp: "おはようございます", fr: "bonjour (matin)" },
  { jp: "こんばんは", fr: "bonsoir" },
  { jp: "さようなら", fr: "au revoir" },
  { jp: "ありがとう", fr: "merci" },
  { jp: "すみません", fr: "pardon, excusez-moi" },
  { jp: "はい", fr: "oui" },
  { jp: "いいえ", fr: "non" },
  { jp: "おねがいします", fr: "s'il vous plaît" },
  { jp: "げんきですか", fr: "comment ça va" },
];

const SEED_KANJI = [
  { char: "一", on: "イチ、イツ", kun: "ひと(つ)", meaning: "un, 1", example: "一人 (ひとり) - une personne, seul", mnemonic: "Un seul trait horizontal, comme le chiffre 1 posé à plat." },
  { char: "二", on: "ニ", kun: "ふた(つ)", meaning: "deux, 2", example: "二人 (ふたり) - deux personnes", mnemonic: "Deux traits empilés, aussi simple que 1+1." },
  { char: "三", on: "サン", kun: "みっ(つ)", meaning: "trois, 3", example: "三日 (みっか) - trois jours", mnemonic: "Trois traits l'un sous l'autre, comme un petit escalier." },
  { char: "四", on: "シ", kun: "よん、よっ(つ)", meaning: "quatre, 4", example: "四月 (しがつ) - avril", mnemonic: "Un carré fermé avec des jambes à l'intérieur, une table à 4 pieds." },
  { char: "五", on: "ゴ", kun: "いつ(つ)", meaning: "cinq, 5", example: "五分 (ごふん) - cinq minutes", mnemonic: "Deux traits qui se croisent entre deux barres, comme 5 doigts repliés." },
  { char: "六", on: "ロク", kun: "むっ(つ)", meaning: "six, 6", example: "六月 (ろくがつ) - juin", mnemonic: "Un petit toit posé sur deux jambes, une cabane à 6 faces." },
  { char: "七", on: "シチ", kun: "なな(つ)", meaning: "sept, 7", example: "七月 (しちがつ) - juillet", mnemonic: "Une croix penchée, comme un 7 dessiné vite fait." },
  { char: "八", on: "ハチ", kun: "やっ(つ)", meaning: "huit, 8", example: "八月 (はちがつ) - août", mnemonic: "Deux traits qui s'écartent, comme deux jambes ouvertes à 8h10." },
  { char: "九", on: "キュウ、ク", kun: "ここの(つ)", meaning: "neuf, 9", example: "九月 (くがつ) - septembre", mnemonic: "Un crochet qui se recourbe, presque un 9 manuscrit." },
  { char: "十", on: "ジュウ", kun: "とお", meaning: "dix, 10", example: "十分 (じゅっぷん) - dix minutes", mnemonic: "Une croix simple, les deux mains croisées quand on a fini de compter jusqu'à 10." },
  { char: "百", on: "ヒャク", kun: "―", meaning: "cent, 100", example: "百円 (ひゃくえん) - cent yens", mnemonic: "十 (10) coiffé d'un chapeau, dix fois plus grand." },
  { char: "千", on: "セン", kun: "―", meaning: "mille, 1000", example: "千円 (せんえん) - mille yens", mnemonic: "Une personne (人) traversée d'un trait, imagine mille personnes en file." },
  { char: "万", on: "マン、バン", kun: "―", meaning: "dix mille, 10000", example: "一万円 (いちまんえん) - dix mille yens", mnemonic: "Une forme ancienne de scorpion, symbole porte-bonheur pour un très grand nombre." },
  { char: "日", on: "ニチ、ジツ", kun: "ひ、か", meaning: "jour, soleil", example: "日曜日 (にちようび) - dimanche", mnemonic: "Un carré avec un trait au milieu, le soleil vu de loin." },
  { char: "月", on: "ゲツ、ガツ", kun: "つき", meaning: "mois, lune", example: "一月 (いちがつ) - janvier", mnemonic: "Un croissant de lune stylisé et penché." },
  { char: "年", on: "ネン", kun: "とし", meaning: "année", example: "今年 (ことし) - cette année", mnemonic: "Une personne qui porte une gerbe de riz, la récolte annuelle." },
  { char: "時", on: "ジ", kun: "とき", meaning: "heure, temps", example: "時間 (じかん) - le temps, une heure", mnemonic: "Le soleil (日) à côté d'un temple (寺), on y mesurait le temps à l'ombre." },
  { char: "分", on: "フン、ブン", kun: "わ(ける)", meaning: "minute, partie, comprendre", example: "五分 (ごふん) - cinq minutes", mnemonic: "Un couteau (刀) qui partage (八) quelque chose en morceaux." },
  { char: "半", on: "ハン", kun: "なか(ば)", meaning: "moitié, demi", example: "半分 (はんぶん) - la moitié", mnemonic: "Une vache (牛) coupée en deux (八), exactement la moitié." },
  { char: "今", on: "コン", kun: "いま", meaning: "maintenant", example: "今日 (きょう) - aujourd'hui", mnemonic: "Une bouche fermée sous un petit toit : on se tait, c'est maintenant." },
  { char: "週", on: "シュウ", kun: "―", meaning: "semaine", example: "今週 (こんしゅう) - cette semaine", mnemonic: "Tourner en rond (周) en marchant (辶), le cycle d'une semaine." },
  { char: "曜", on: "ヨウ", kun: "―", meaning: "jour de la semaine", example: "何曜日 (なんようび) - quel jour de la semaine", mnemonic: "Le soleil (日) à côté d'ailes qui brillent, les jours portent le nom des astres." },
  { char: "人", on: "ジン、ニン", kun: "ひと", meaning: "personne, humain", example: "日本人 (にほんじん) - un(e) japonais(e)", mnemonic: "Deux jambes qui marchent, vues de profil : une personne debout." },
  { char: "私", on: "シ", kun: "わたし", meaning: "je, moi", example: "私は学生です - je suis étudiant(e)", mnemonic: "Le riz (禾) que je garde pour moi (厶) : je, moi." },
  { char: "男", on: "ダン、ナン", kun: "おとこ", meaning: "homme", example: "男の子 (おとこのこ) - un garçon", mnemonic: "Un champ (田) travaillé avec la force (力) : un homme." },
  { char: "女", on: "ジョ、ニョ", kun: "おんな", meaning: "femme", example: "女の子 (おんなのこ) - une fille", mnemonic: "Une silhouette agenouillée, dessin ancien d'une femme." },
  { char: "子", on: "シ", kun: "こ", meaning: "enfant", example: "子供 (こども) - un enfant", mnemonic: "Un bébé emmailloté, bras levés : l'enfant." },
  { char: "友", on: "ユウ", kun: "とも", meaning: "ami", example: "友達 (ともだち) - un ami, une amie", mnemonic: "Deux mains qui se tiennent : les amis." },
  { char: "父", on: "フ", kun: "ちち", meaning: "père", example: "お父さん (おとうさん) - père", mnemonic: "Une main qui tient un outil, le père au travail." },
  { char: "母", on: "ボ", kun: "はは", meaning: "mère", example: "お母さん (おかあさん) - mère", mnemonic: "Une femme (女) avec deux points, les seins qui nourrissent : la mère." },
  { char: "兄", on: "ケイ", kun: "あに", meaning: "grand frère", example: "お兄さん (おにいさん) - grand frère", mnemonic: "Une bouche (口) au-dessus de jambes, celui qui parle en premier dans la fratrie." },
  { char: "姉", on: "シ", kun: "あね", meaning: "grande sœur", example: "お姉さん (おねえさん) - grande sœur", mnemonic: "Une femme (女) qui montre le marché (市), la grande sœur qui guide." },
  { char: "先", on: "セン", kun: "さき", meaning: "avant, précédent", example: "先生 (せんせい) - professeur", mnemonic: "Des jambes qui avancent devant les autres : celui qui va en premier." },
  { char: "生", on: "セイ、ショウ", kun: "い(きる)、う(まれる)", meaning: "vie, naître, élève", example: "学生 (がくせい) - étudiant(e)", mnemonic: "Une pousse qui sort de la terre : naître, vivre." },
  { char: "学", on: "ガク", kun: "まな(ぶ)", meaning: "étudier, apprendre", example: "学校 (がっこう) - école", mnemonic: "Un enfant (子) sous un toit rempli de connaissances : étudier." },
  { char: "校", on: "コウ", kun: "―", meaning: "école", example: "学校 (がっこう) - école", mnemonic: "Le bois (木) où l'on compare (交) ses idées : l'école." },
  { char: "会", on: "カイ、エ", kun: "あ(う)", meaning: "rencontrer, association", example: "会社 (かいしゃ) - une entreprise", mnemonic: "Un couvercle qui rejoint une base : se rencontrer, se réunir." },
  { char: "社", on: "シャ", kun: "やしろ", meaning: "société, sanctuaire", example: "会社 (かいしゃ) - une entreprise", mnemonic: "Un autel (示) planté dans la terre (土) : le lieu sacré devient la société." },
  { char: "山", on: "サン", kun: "やま", meaning: "montagne", example: "富士山 (ふじさん) - le mont Fuji", mnemonic: "Trois pics dessinés côte à côte : une montagne." },
  { char: "川", on: "セン", kun: "かわ", meaning: "rivière", example: "川 (かわ) - une rivière", mnemonic: "Trois traits verticaux qui coulent comme un courant." },
  { char: "田", on: "デン", kun: "た", meaning: "rizière, champ", example: "田んぼ (たんぼ) - une rizière", mnemonic: "Un champ vu du ciel, découpé en parcelles." },
  { char: "天", on: "テン", kun: "あめ", meaning: "ciel", example: "天気 (てんき) - la météo", mnemonic: "Un homme (大) avec un trait au-dessus de la tête : ce qui le surplombe, le ciel." },
  { char: "気", on: "キ、ケ", kun: "―", meaning: "énergie, esprit", example: "元気 (げんき) - en forme, énergique", mnemonic: "Une marmite de riz qui dégage de la vapeur : l'énergie qui s'échappe." },
  { char: "空", on: "クウ", kun: "そら、あ(く)", meaning: "ciel, vide", example: "空 (そら) - le ciel", mnemonic: "Un trou (穴) façonné par le travail (工) du vent : le ciel vide." },
  { char: "雨", on: "ウ", kun: "あめ", meaning: "pluie", example: "雨 (あめ) - la pluie", mnemonic: "Des gouttes qui tombent sous un toit : la pluie." },
  { char: "花", on: "カ", kun: "はな", meaning: "fleur", example: "花 (はな) - une fleur", mnemonic: "Une plante (艹) qui change (化) de forme en éclosant : la fleur." },
  { char: "木", on: "モク、ボク", kun: "き", meaning: "arbre", example: "木 (き) - un arbre", mnemonic: "Un tronc avec des branches qui s'étendent : l'arbre." },
  { char: "林", on: "リン", kun: "はやし", meaning: "bosquet", example: "林 (はやし) - un petit bois", mnemonic: "Deux arbres côte à côte : un petit bois." },
  { char: "森", on: "シン", kun: "もり", meaning: "forêt", example: "森 (もり) - une forêt", mnemonic: "Trois arbres empilés : une forêt dense." },
  { char: "石", on: "セキ", kun: "いし", meaning: "pierre", example: "石 (いし) - une pierre", mnemonic: "Une falaise (厂) avec un caillou (口) en dessous : la pierre." },
  { char: "土", on: "ド、ト", kun: "つち", meaning: "terre", example: "土曜日 (どようび) - samedi", mnemonic: "Une pousse qui sort du sol : la terre." },
  { char: "火", on: "カ", kun: "ひ", meaning: "feu", example: "火曜日 (かようび) - mardi", mnemonic: "Des flammes qui dansent vers le haut : le feu." },
  { char: "水", on: "スイ", kun: "みず", meaning: "eau", example: "水曜日 (すいようび) - mercredi", mnemonic: "Un courant qui serpente entre deux rives : l'eau." },
  { char: "金", on: "キン", kun: "かね", meaning: "or, argent, métal", example: "金曜日 (きんようび) - vendredi", mnemonic: "De la terre (土) avec des pépites qui brillent à l'intérieur." },
  { char: "上", on: "ジョウ", kun: "うえ、あ(げる)", meaning: "haut, sur", example: "上手 (じょうず) - habile, doué", mnemonic: "Un trait posé au-dessus d'une ligne : en haut." },
  { char: "下", on: "カ、ゲ", kun: "した、さ(げる)", meaning: "bas, sous", example: "下手 (へた) - maladroit", mnemonic: "Un trait posé en dessous d'une ligne : en bas." },
  { char: "中", on: "チュウ", kun: "なか", meaning: "milieu, dans", example: "中 (なか) - dedans, milieu", mnemonic: "Une ligne qui transperce un carré en son centre." },
  { char: "外", on: "ガイ", kun: "そと", meaning: "dehors, extérieur", example: "外国 (がいこく) - un pays étranger", mnemonic: "La lune (夕) qui sort dans la nuit, à l'extérieur." },
  { char: "右", on: "ウ、ユウ", kun: "みぎ", meaning: "droite", example: "右 (みぎ) - la droite", mnemonic: "Une bouche (口) que la main droite porte à la bouche pour manger." },
  { char: "左", on: "サ", kun: "ひだり", meaning: "gauche", example: "左 (ひだり) - la gauche", mnemonic: "Un outil tenu par la main gauche qui travaille." },
  { char: "東", on: "トウ", kun: "ひがし", meaning: "est", example: "東京 (とうきょう) - Tokyo", mnemonic: "Le soleil (日) qui se lève derrière un arbre (木) : l'est." },
  { char: "西", on: "セイ", kun: "にし", meaning: "ouest", example: "西 (にし) - l'ouest", mnemonic: "Un nid où l'oiseau se pose au coucher du soleil : l'ouest." },
  { char: "南", on: "ナン", kun: "みなみ", meaning: "sud", example: "南 (みなみ) - le sud", mnemonic: "Une plante à l'abri dans une tente, tournée vers la chaleur du sud." },
  { char: "北", on: "ホク", kun: "きた", meaning: "nord", example: "北海道 (ほっかいどう) - Hokkaido", mnemonic: "Deux personnes dos à dos, tournées vers le froid du nord." },
  { char: "内", on: "ナイ", kun: "うち", meaning: "intérieur", example: "家内 (かない) - mon épouse (litt. intérieur de la maison)", mnemonic: "Entrer (入) dans une enceinte (冂) : l'intérieur." },
  { char: "前", on: "ゼン", kun: "まえ", meaning: "devant, avant", example: "前 (まえ) - devant, avant", mnemonic: "Une proue de bateau qui avance : ce qui est devant." },
  { char: "後", on: "ゴ、コウ", kun: "うし(ろ)、あと", meaning: "derrière, après", example: "後で (あとで) - plus tard", mnemonic: "Des pas qui traînent en arrière : derrière, après." },
  { char: "間", on: "カン", kun: "あいだ", meaning: "intervalle, entre", example: "時間 (じかん) - le temps", mnemonic: "La lumière du soleil (日) qui filtre entre les battants d'une porte (門)." },
  { char: "行", on: "コウ、ギョウ", kun: "い(く)", meaning: "aller", example: "銀行 (ぎんこう) - une banque", mnemonic: "Le dessin d'un carrefour vu du dessus : on y va, on s'y déplace." },
  { char: "来", on: "ライ", kun: "く(る)", meaning: "venir", example: "来週 (らいしゅう) - la semaine prochaine", mnemonic: "Des épis de blé qui poussent vers soi : venir." },
  { char: "見", on: "ケン", kun: "み(る)", meaning: "voir", example: "見物 (けんぶつ) - visiter, observer", mnemonic: "Un œil posé sur des jambes : voir, regarder." },
  { char: "聞", on: "ブン、モン", kun: "き(く)", meaning: "écouter, entendre", example: "新聞 (しんぶん) - un journal", mnemonic: "Une oreille (耳) collée à une porte (門) : écouter." },
  { char: "読", on: "ドク", kun: "よ(む)", meaning: "lire", example: "読書 (どくしょ) - la lecture", mnemonic: "La parole (言) qui se vend (売) comme une histoire : lire." },
  { char: "書", on: "ショ", kun: "か(く)", meaning: "écrire", example: "辞書 (じしょ) - un dictionnaire", mnemonic: "Un pinceau (聿) tenu au-dessus d'une page comme un soleil : écrire." },
  { char: "話", on: "ワ", kun: "はな(す)", meaning: "parler", example: "電話 (でんわ) - un téléphone", mnemonic: "La parole (言) qui devient langue vivante (舌) : parler." },
  { char: "食", on: "ショク", kun: "た(べる)", meaning: "manger", example: "食べ物 (たべもの) - la nourriture", mnemonic: "Un couvercle posé sur un bol de nourriture : manger." },
  { char: "飲", on: "イン", kun: "の(む)", meaning: "boire", example: "飲み物 (のみもの) - une boisson", mnemonic: "Manger (食) en ouvrant grand la bouche (欠) : boire." },
  { char: "買", on: "バイ", kun: "か(う)", meaning: "acheter", example: "買い物 (かいもの) - les courses, le shopping", mnemonic: "Un filet (网) qui capture des coquillages (貝, ancienne monnaie) : acheter." },
  { char: "立", on: "リツ", kun: "た(つ)", meaning: "se tenir debout", example: "立場 (たちば) - la position, le point de vue", mnemonic: "Une personne debout, bras écartés, plantée sur le sol." },
  { char: "出", on: "シュツ", kun: "で(る)、だ(す)", meaning: "sortir", example: "出口 (でぐち) - une sortie", mnemonic: "Une pousse qui dépasse de son pot : sortir." },
  { char: "入", on: "ニュウ", kun: "はい(る)、い(れる)", meaning: "entrer", example: "入り口 (いりぐち) - une entrée", mnemonic: "Une flèche qui pointe vers l'intérieur : entrer." },
  { char: "大", on: "ダイ、タイ", kun: "おお(きい)", meaning: "grand", example: "大学 (だいがく) - une université", mnemonic: "Une personne les bras grands ouverts : grand." },
  { char: "小", on: "ショウ", kun: "ちい(さい)", meaning: "petit", example: "小学校 (しょうがっこう) - école primaire", mnemonic: "Trois petits traits fins et serrés : petit." },
  { char: "高", on: "コウ", kun: "たか(い)", meaning: "haut, cher", example: "高い (たかい) - haut, cher", mnemonic: "Une tour à étages qui s'élève : haut." },
  { char: "安", on: "アン", kun: "やす(い)", meaning: "tranquille, bon marché", example: "安い (やすい) - bon marché", mnemonic: "Une femme (女) en sécurité sous un toit : tranquille, sans souci de prix." },
  { char: "新", on: "シン", kun: "あたら(しい)", meaning: "nouveau", example: "新聞 (しんぶん) - un journal", mnemonic: "Un arbre (木) fraîchement coupé (斤) : tout neuf." },
  { char: "古", on: "コ", kun: "ふる(い)", meaning: "vieux, ancien", example: "古い (ふるい) - vieux, ancien", mnemonic: "Une bouche (口) qui raconte dix (十) générations d'histoires : vieux." },
  { char: "長", on: "チョウ", kun: "なが(い)", meaning: "long", example: "社長 (しゃちょう) - le président d'entreprise", mnemonic: "De longs cheveux flottants dessinés d'un trait : long." },
  { char: "多", on: "タ", kun: "おお(い)", meaning: "nombreux", example: "多い (おおい) - nombreux", mnemonic: "Deux lunes (夕) empilées, comme si les nuits se multipliaient." },
  { char: "少", on: "ショウ", kun: "すく(ない)、すこ(し)", meaning: "peu", example: "少し (すこし) - un peu", mnemonic: "Un tout petit trait de moins que 小 (petit) : encore moins, peu." },
  { char: "白", on: "ハク", kun: "しろ(い)", meaning: "blanc", example: "白い (しろい) - blanc", mnemonic: "Un rayon de lumière qui sort d'un soleil : blanc, pur." },
  { char: "黒", on: "コク", kun: "くろ(い)", meaning: "noir", example: "黒い (くろい) - noir", mnemonic: "De la suie qui s'accumule sous un feu : noir." },
  { char: "赤", on: "セキ", kun: "あか(い)", meaning: "rouge", example: "赤い (あかい) - rouge", mnemonic: "Un homme (大) debout devant un feu (火) : le rouge des flammes." },
  { char: "青", on: "セイ", kun: "あお(い)", meaning: "bleu, vert", example: "青い (あおい) - bleu", mnemonic: "Une plante (生) qui pousse pure au-dessus d'un puits : le bleu-vert de la nature." },
  { char: "車", on: "シャ", kun: "くるま", meaning: "voiture", example: "電車 (でんしゃ) - un train", mnemonic: "Une roue vue de dessus, avec son essieu au centre : la voiture." },
  { char: "電", on: "デン", kun: "―", meaning: "électricité", example: "電気 (でんき) - l'électricité", mnemonic: "La pluie (雨) traversée d'un éclair : l'électricité." },
  { char: "語", on: "ゴ", kun: "かた(る)", meaning: "langue, mot", example: "日本語 (にほんご) - la langue japonaise", mnemonic: "La parole (言) qui vient de moi (吾) : ma langue, mes mots." },
  { char: "国", on: "コク", kun: "くに", meaning: "pays", example: "外国 (がいこく) - un pays étranger", mnemonic: "Un joyau (玉) protégé par une enceinte : le pays et ses richesses." },
  { char: "名", on: "メイ、ミョウ", kun: "な", meaning: "nom", example: "名前 (なまえ) - un nom", mnemonic: "Le soir (夕) où l'on crie son nom (口) pour se reconnaître dans le noir." },
  { char: "何", on: "カ", kun: "なに、なん", meaning: "quoi", example: "何ですか (なんですか) - qu'est-ce que c'est ?", mnemonic: "Une personne (イ) qui porte un fardeau et demande ce que c'est." },
  { char: "毎", on: "マイ", kun: "―", meaning: "chaque", example: "毎日 (まいにち) - chaque jour", mnemonic: "Une mère (母) qui se répète, jour après jour : chaque fois." },
  { char: "円", on: "エン", kun: "まる(い)", meaning: "yen, cercle", example: "百円 (ひゃくえん) - cent yens", mnemonic: "Une pièce de monnaie ronde, stylisée en quelques traits." },
  { char: "力", on: "リョク、リキ", kun: "ちから", meaning: "force", example: "力 (ちから) - la force", mnemonic: "Un bras musclé, plié pour montrer sa force." },
  { char: "休", on: "キュウ", kun: "やす(む)", meaning: "se reposer", example: "休み (やすみ) - un jour de repos, des vacances", mnemonic: "Une personne (イ) adossée à un arbre (木) qui se repose." },
  { char: "好", on: "コウ", kun: "す(き)、この(む)", meaning: "aimer", example: "好き (すき) - aimer", mnemonic: "Une femme (女) et un enfant (子) blottis l'un contre l'autre : l'amour, l'affection." },
  { char: "早", on: "ソウ", kun: "はや(い)", meaning: "tôt, rapide", example: "早い (はやい) - tôt, rapide", mnemonic: "Le soleil (日) qui se lève tôt au-dessus d'une tige." },
  { char: "近", on: "キン", kun: "ちか(い)", meaning: "proche", example: "近い (ちかい) - proche", mnemonic: "Une hache (斤) que l'on porte (辶) sur une petite distance : proche." },
  { char: "遠", on: "エン", kun: "とお(い)", meaning: "loin", example: "遠い (とおい) - loin", mnemonic: "Un habit (袁) que l'on porte (辶) en marchant longtemps : loin." },
];

/* ============================================================
   utilitaires
   ============================================================ */

const normalize = (s) =>
  (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const splitAnswers = (s) =>
  (s || "")
    .split(/[,、/]/)
    .map((x) => x.trim())
    .filter(Boolean);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const withStats = (item) => ({
  correct: 0,
  wrong: 0,
  streak: 0,
  id: uid(),
  ...item,
});

const weightOf = (item) => {
  const w = 1 + item.wrong * 2 - Math.min(item.streak, 3);
  return Math.max(1, w);
};

const pickWeighted = (list, excludeId) => {
  const pool = list.length > 1 ? list.filter((i) => i.id !== excludeId) : list;
  const source = pool.length ? pool : list;
  const total = source.reduce((sum, i) => sum + weightOf(i), 0);
  let r = Math.random() * total;
  for (const item of source) {
    r -= weightOf(item);
    if (r <= 0) return item;
  }
  return source[source.length - 1];
};

/* ============================================================
   composant principal
   ============================================================ */

export default function App() {
  const [words, setWords] = useState(null);
  const [kanjis, setKanjis] = useState(null);
  const [tab, setTab] = useState("quiz");
  const [quizType, setQuizType] = useState("mots");
  const [direction, setDirection] = useState("jp-fr");
  const [current, setCurrent] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const inputRef = useRef(null);

  const [wordForm, setWordForm] = useState({ jp: "", fr: "" });
  const [kanjiForm, setKanjiForm] = useState({ char: "", meaning: "", on: "", kun: "", example: "", mnemonic: "" });
  const [wordFilter, setWordFilter] = useState("");
  const [kanjiFilter, setKanjiFilter] = useState("");
  const [saveHint, setSaveHint] = useState("");

  /* chargement initial depuis le stockage persistant */
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("words", false);
        setWords(JSON.parse(res.value));
      } catch {
        const seeded = SEED_WORDS.map(withStats);
        setWords(seeded);
        try { await storage.set("words", JSON.stringify(seeded), false); } catch {}
      }
      try {
        const res = await storage.get("kanjis", false);
        setKanjis(JSON.parse(res.value));
      } catch {
        const seeded = SEED_KANJI.map(withStats);
        setKanjis(seeded);
        try { await storage.set("kanjis", JSON.stringify(seeded), false); } catch {}
      }
    })();
  }, []);

  const persist = useCallback(async (key, value) => {
    try { await storage.set(key, JSON.stringify(value), false); } catch {}
  }, []);

  useEffect(() => { if (words) persist("words", words); }, [words, persist]);
  useEffect(() => { if (kanjis) persist("kanjis", kanjis); }, [kanjis, persist]);

  /* ---------------- quiz ---------------- */

  const nextQuestion = useCallback((type, dir) => {
    const t = type || quizType;
    const d = dir || direction;
    const list = t === "mots" ? words : kanjis;
    if (!list || list.length === 0) { setCurrent(null); return; }
    const item = pickWeighted(list, current ? current.id : null);
    setCurrent({ ...item, __direction: d });
    setAnswer("");
    setFeedback(null);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
  }, [quizType, direction, words, kanjis, current]);

  useEffect(() => {
    if (tab === "quiz" && words && kanjis && !current) {
      nextQuestion(quizType, direction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, words, kanjis]);

  const switchQuizType = (t) => {
    setQuizType(t);
    setCurrent(null);
    setFeedback(null);
    setTimeout(() => nextQuestion(t, direction), 0);
  };

  const switchDirection = (d) => {
    setDirection(d);
    setCurrent(null);
    setFeedback(null);
    setTimeout(() => nextQuestion(quizType, d), 0);
  };

  const submitAnswer = () => {
    if (!current || feedback) return;
    const setList = quizType === "mots" ? setWords : setKanjis;
    let isCorrect = false;
    let correctDisplay = "";

    if (quizType === "mots") {
      if (current.__direction === "jp-fr") {
        const accepted = splitAnswers(current.fr).map(normalize);
        isCorrect = accepted.includes(normalize(answer));
        correctDisplay = current.fr;
      } else {
        const accepted = splitAnswers(current.jp).map(normalize);
        isCorrect = accepted.includes(normalize(answer));
        correctDisplay = current.jp;
      }
    } else {
      const accepted = splitAnswers(current.meaning).map(normalize);
      isCorrect = accepted.includes(normalize(answer));
      correctDisplay = current.meaning;
    }

    setFeedback({ isCorrect, correctDisplay });
    setSession((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));

    setList((prev) =>
      prev.map((it) =>
        it.id === current.id
          ? {
              ...it,
              correct: it.correct + (isCorrect ? 1 : 0),
              wrong: it.wrong + (isCorrect ? 0 : 1),
              streak: isCorrect ? it.streak + 1 : 0,
            }
          : it
      )
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (feedback) nextQuestion();
      else submitAnswer();
    }
  };

  /* ---------------- ajout / gestion ---------------- */

  const addWord = () => {
    if (!wordForm.jp.trim() || !wordForm.fr.trim()) return;
    setWords((prev) => [withStats({ jp: wordForm.jp.trim(), fr: wordForm.fr.trim() }), ...prev]);
    setWordForm({ jp: "", fr: "" });
    flashSave("Mot ajouté au lexique.");
  };

  const addKanji = () => {
    if (!kanjiForm.char.trim() || !kanjiForm.meaning.trim()) return;
    setKanjis((prev) => [
      withStats({
        char: kanjiForm.char.trim(),
        meaning: kanjiForm.meaning.trim(),
        on: kanjiForm.on.trim() || "―",
        kun: kanjiForm.kun.trim() || "―",
        example: kanjiForm.example.trim(),
        mnemonic: kanjiForm.mnemonic.trim(),
      }),
      ...prev,
    ]);
    setKanjiForm({ char: "", meaning: "", on: "", kun: "", example: "", mnemonic: "" });
    flashSave("Kanji ajouté au lexique.");
  };

  const flashSave = (msg) => {
    setSaveHint(msg);
    setTimeout(() => setSaveHint(""), 2200);
  };

  const deleteWord = (id) => setWords((prev) => prev.filter((w) => w.id !== id));
  const deleteKanji = (id) => setKanjis((prev) => prev.filter((k) => k.id !== id));

  const [narrow, setNarrow] = useState(typeof window !== "undefined" ? window.innerWidth < 680 : false);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 680);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loading = !words || !kanjis;

  const filteredWords = (words || []).filter((w) =>
    normalize(w.jp + " " + w.fr).includes(normalize(wordFilter))
  );
  const filteredKanjis = (kanjis || []).filter((k) =>
    normalize(k.char + " " + k.meaning + " " + k.on + " " + k.kun).includes(normalize(kanjiFilter))
  );

  const stats = (() => {
    const all = [...(words || []), ...(kanjis || [])];
    const totalAttempts = all.reduce((s, i) => s + i.correct + i.wrong, 0);
    const totalCorrect = all.reduce((s, i) => s + i.correct, 0);
    const accuracy = totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : null;
    const seen = all.filter((i) => i.correct + i.wrong > 0);
    const weakest = [...seen]
      .sort((a, b) => a.correct / (a.correct + a.wrong) - b.correct / (b.correct + b.wrong))
      .slice(0, 6);
    return { totalAttempts, totalCorrect, accuracy, weakest };
  })();

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap');
        .jn-root * { box-sizing: border-box; }
        .jn-root { font-family: 'Zen Kaku Gothic New', sans-serif; }
        .jn-display { font-family: 'Shippori Mincho', serif; }
        .jn-tab { transition: color .15s ease, border-color .15s ease; }
        .jn-btn { transition: transform .12s ease, background .15s ease, opacity .15s ease; }
        .jn-btn:active { transform: scale(0.97); }
        .jn-card { animation: jn-fade-in .25s ease; }
        @keyframes jn-fade-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
        .jn-stamp { animation: jn-stamp-in .35s cubic-bezier(.34,1.56,.64,1); }
        @keyframes jn-stamp-in { from { opacity: 0; transform: scale(2) rotate(-18deg);} to { opacity: 1; transform: scale(1) rotate(-8deg);} }
        .jn-cross { animation: jn-cross-in .3s ease; }
        @keyframes jn-cross-in { from { opacity: 0; transform: scale(1.6);} to { opacity: 1; transform: scale(1);} }
        .jn-input:focus { outline: none; border-color: var(--jn-indigo) !important; box-shadow: 0 0 0 3px rgba(43,69,112,0.12); }
        .jn-scroll::-webkit-scrollbar { width: 6px; }
        .jn-scroll::-webkit-scrollbar-thumb { background: var(--jn-line); border-radius: 4px; }
      `}</style>

      <div className="jn-root" style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerBar}></div>
          <div>
            <h1 className="jn-display" style={styles.title}>漢字ノート</h1>
            <p style={styles.subtitle}>ton carnet de vocabulaire japonais, personnel et évolutif</p>
          </div>
        </header>

        <nav style={styles.tabs}>
          {[
            ["quiz", "révision"],
            ["mots", "語彙 · mots"],
            ["kanji", "漢字 · kanji"],
            ["stats", "統計 · stats"],
          ].map(([key, label]) => (
            <button
              key={key}
              className="jn-tab"
              onClick={() => setTab(key)}
              style={{
                ...styles.tabBtn,
                color: tab === key ? "var(--jn-indigo)" : "var(--jn-ink-soft)",
                borderBottom: tab === key ? "2px solid var(--jn-indigo)" : "2px solid transparent",
                fontWeight: tab === key ? 700 : 500,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div style={styles.loading}>chargement du lexique…</div>
        ) : (
          <main style={styles.main}>
            {tab === "quiz" && (
              <QuizPanel
                quizType={quizType}
                direction={direction}
                switchQuizType={switchQuizType}
                switchDirection={switchDirection}
                current={current}
                answer={answer}
                setAnswer={setAnswer}
                feedback={feedback}
                submitAnswer={submitAnswer}
                nextQuestion={nextQuestion}
                handleKeyDown={handleKeyDown}
                inputRef={inputRef}
                session={session}
                hasWords={words.length > 0}
                hasKanjis={kanjis.length > 0}
              />
            )}

            {tab === "mots" && (
              <LexiconPanel
                type="mots"
                form={wordForm}
                setForm={setWordForm}
                onAdd={addWord}
                filter={wordFilter}
                setFilter={setWordFilter}
                items={filteredWords}
                onDelete={deleteWord}
                saveHint={saveHint}
                narrow={narrow}
              />
            )}

            {tab === "kanji" && (
              <LexiconPanel
                type="kanji"
                form={kanjiForm}
                setForm={setKanjiForm}
                onAdd={addKanji}
                filter={kanjiFilter}
                setFilter={setKanjiFilter}
                items={filteredKanjis}
                onDelete={deleteKanji}
                saveHint={saveHint}
                narrow={narrow}
              />
            )}

            {tab === "stats" && <StatsPanel words={words} kanjis={kanjis} stats={stats} />}
          </main>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   panneau quiz
   ============================================================ */

function QuizPanel({
  quizType, direction, switchQuizType, switchDirection,
  current, answer, setAnswer, feedback, submitAnswer, nextQuestion,
  handleKeyDown, inputRef, session, hasWords, hasKanjis,
}) {
  const empty = quizType === "mots" ? !hasWords : !hasKanjis;

  const promptLabel =
    quizType === "kanji"
      ? "quel est le sens de ce kanji ?"
      : direction === "jp-fr"
      ? "traduis ce mot en français"
      : "écris ce mot en japonais";

  const promptText = current
    ? quizType === "kanji"
      ? current.char
      : direction === "jp-fr"
      ? current.jp
      : splitAnswers(current.fr)[0]
    : "";

  return (
    <div>
      <div style={styles.controlsRow}>
        <Segmented
          value={quizType}
          onChange={switchQuizType}
          options={[["mots", "Mots"], ["kanji", "Kanji"]]}
        />
        {quizType === "mots" && (
          <Segmented
            value={direction}
            onChange={switchDirection}
            options={[["jp-fr", "日本語 → français"], ["fr-jp", "français → 日本語"]]}
          />
        )}
        <div style={styles.scoreBadge}>
          {session.total > 0 ? `${session.correct} / ${session.total} cette session` : "aucune réponse encore"}
        </div>
      </div>

      {empty ? (
        <div style={styles.emptyState}>
          Ton lexique {quizType === "mots" ? "de mots" : "de kanji"} est vide. Ajoute des entrées dans l'onglet correspondant pour commencer à réviser.
        </div>
      ) : current ? (
        <div key={current.id + direction} className="jn-card" style={styles.quizCard}>
          <div style={styles.tanzakuLine}></div>
          <div style={styles.promptLabel}>{promptLabel}</div>
          <div className="jn-display" style={quizType === "kanji" ? styles.kanjiDisplay : styles.wordDisplay}>
            {promptText}
          </div>

          {!feedback ? (
            <div style={styles.answerRow}>
              <input
                ref={inputRef}
                className="jn-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ta réponse…"
                style={styles.answerInput}
                autoFocus
              />
              <button className="jn-btn" onClick={submitAnswer} style={styles.primaryBtn}>
                valider
              </button>
            </div>
          ) : (
            <div>
              <div style={styles.feedbackRow}>
                {feedback.isCorrect ? (
                  <div className="jn-stamp" style={styles.stampCorrect}>正解</div>
                ) : (
                  <div className="jn-cross" style={styles.stampWrong}>✕</div>
                )}
                <div style={styles.feedbackText}>
                  <div style={{ fontWeight: 700, color: feedback.isCorrect ? "var(--jn-hanko)" : "var(--jn-ink)" }}>
                    {feedback.isCorrect ? "Correct !" : "Pas tout à fait."}
                  </div>
                  <div style={{ color: "var(--jn-ink-soft)", fontSize: 14 }}>
                    réponse : <strong>{feedback.correctDisplay}</strong>
                  </div>
                </div>
              </div>

              {quizType === "kanji" && (current.on !== "―" || current.kun !== "―" || current.example || current.mnemonic) && (
                <div style={styles.detailBox}>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>onyomi</span>{current.on}</div>
                  <div style={styles.detailRow}><span style={styles.detailLabel}>kunyomi</span>{current.kun}</div>
                  {current.example && <div style={styles.detailRow}><span style={styles.detailLabel}>exemple</span>{current.example}</div>}
                  {current.mnemonic && <div style={styles.detailRow}><span style={styles.detailLabel}>mémo</span>{current.mnemonic}</div>}
                </div>
              )}

              <button className="jn-btn" onClick={() => nextQuestion()} style={{ ...styles.primaryBtn, marginTop: 16, width: "100%" }}>
                question suivante →
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={styles.segmented}>
      {options.map(([key, label]) => (
        <button
          key={key}
          className="jn-btn"
          onClick={() => onChange(key)}
          style={{
            ...styles.segmentedBtn,
            background: value === key ? "var(--jn-indigo)" : "transparent",
            color: value === key ? "#fff" : "var(--jn-ink)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   panneau lexique (mots / kanji)
   ============================================================ */

function LexiconPanel({ type, form, setForm, onAdd, filter, setFilter, items, onDelete, saveHint, narrow }) {
  const isWord = type === "mots";
  return (
    <div style={{ ...styles.lexiconGrid, gridTemplateColumns: narrow ? "1fr" : styles.lexiconGrid.gridTemplateColumns }}>
      <div style={styles.formCard}>
        <h2 className="jn-display" style={styles.panelTitle}>
          {isWord ? "ajouter un mot" : "ajouter un kanji"}
        </h2>

        {isWord ? (
          <>
            <Field label="mot japonais (kana / kanji)">
              <input className="jn-input" style={styles.textInput} value={form.jp}
                onChange={(e) => setForm({ ...form, jp: e.target.value })}
                placeholder="ex : ありがとう" />
            </Field>
            <Field label="traduction(s) française(s) — séparées par une virgule si plusieurs">
              <input className="jn-input" style={styles.textInput} value={form.fr}
                onChange={(e) => setForm({ ...form, fr: e.target.value })}
                placeholder="ex : merci" />
            </Field>
          </>
        ) : (
          <>
            <Field label="caractère kanji">
              <input className="jn-input" style={{ ...styles.textInput, fontSize: 22 }} value={form.char}
                onChange={(e) => setForm({ ...form, char: e.target.value })}
                placeholder="ex : 猫" />
            </Field>
            <Field label="signification(s) — séparées par une virgule si plusieurs">
              <input className="jn-input" style={styles.textInput} value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                placeholder="ex : chat" />
            </Field>
            <div style={styles.twoCol}>
              <Field label="onyomi">
                <input className="jn-input" style={styles.textInput} value={form.on}
                  onChange={(e) => setForm({ ...form, on: e.target.value })} placeholder="ex : ビョウ" />
              </Field>
              <Field label="kunyomi">
                <input className="jn-input" style={styles.textInput} value={form.kun}
                  onChange={(e) => setForm({ ...form, kun: e.target.value })} placeholder="ex : ねこ" />
              </Field>
            </div>
            <Field label="exemple d'utilisation">
              <input className="jn-input" style={styles.textInput} value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
                placeholder="ex : 猫 (ねこ) - chat" />
            </Field>
            <Field label="moyen mnémotechnique">
              <textarea className="jn-input" style={{ ...styles.textInput, minHeight: 64, resize: "vertical" }} value={form.mnemonic}
                onChange={(e) => setForm({ ...form, mnemonic: e.target.value })}
                placeholder="décris comment t'en souvenir…" />
            </Field>
          </>
        )}

        <button className="jn-btn" onClick={onAdd} style={{ ...styles.primaryBtn, width: "100%", marginTop: 4 }}>
          ajouter au lexique
        </button>
        {saveHint && <div style={styles.saveHint}>{saveHint}</div>}
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeader}>
          <h2 className="jn-display" style={styles.panelTitle}>
            {isWord ? "tes mots" : "tes kanji"} <span style={{ color: "var(--jn-ink-soft)", fontWeight: 400, fontSize: 14 }}>({items.length})</span>
          </h2>
          <input className="jn-input" style={{ ...styles.textInput, maxWidth: 180 }}
            placeholder="rechercher…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <div className="jn-scroll" style={styles.listScroll}>
          {items.length === 0 && <div style={styles.emptyState}>rien à afficher.</div>}
          {items.map((item) => (
            <div key={item.id} style={styles.listRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isWord ? (
                  <>
                    <div style={styles.listPrimary}>{item.jp}</div>
                    <div style={styles.listSecondary}>{item.fr}</div>
                  </>
                ) : (
                  <>
                    <div style={styles.listPrimary}>
                      <span className="jn-display" style={{ fontSize: 20, marginRight: 8 }}>{item.char}</span>
                      {item.meaning}
                    </div>
                    <div style={styles.listSecondary}>on : {item.on} · kun : {item.kun}</div>
                  </>
                )}
                <div style={styles.listStats}>
                  {item.correct + item.wrong > 0
                    ? `${item.correct}✓ / ${item.wrong}✕`
                    : "pas encore révisé"}
                </div>
              </div>
              <button className="jn-btn" onClick={() => onDelete(item.id)} style={styles.deleteBtn} title="supprimer">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* ============================================================
   panneau statistiques
   ============================================================ */

function StatsPanel({ words, kanjis, stats }) {
  return (
    <div>
      <div style={styles.statsGrid}>
        <StatCard label="mots dans le lexique" value={words.length} />
        <StatCard label="kanji dans le lexique" value={kanjis.length} />
        <StatCard label="réponses données" value={stats.totalAttempts} />
        <StatCard label="taux de réussite" value={stats.accuracy !== null ? `${stats.accuracy}%` : "—"} />
      </div>

      <h2 className="jn-display" style={{ ...styles.panelTitle, marginTop: 28 }}>points à retravailler</h2>
      {stats.weakest.length === 0 ? (
        <div style={styles.emptyState}>fais quelques révisions pour voir apparaître tes points faibles ici.</div>
      ) : (
        <div style={styles.listCard}>
          <div style={styles.listScroll}>
            {stats.weakest.map((item) => (
              <div key={item.id} style={styles.listRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.listPrimary}>
                    {item.char ? (
                      <>
                        <span className="jn-display" style={{ fontSize: 18, marginRight: 8 }}>{item.char}</span>
                        {item.meaning}
                      </>
                    ) : (
                      <>{item.jp} <span style={{ color: "var(--jn-ink-soft)", fontWeight: 400 }}>— {item.fr}</span></>
                    )}
                  </div>
                  <div style={styles.listStats}>{item.correct}✓ / {item.wrong}✕</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div className="jn-display" style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ============================================================
   styles (tokens : ai-zome indigo + encre + hanko rouge sur washi)
   ============================================================ */

const styles = {
  app: {
    "--jn-paper": "#EFE9DD",
    "--jn-ink": "#211F1C",
    "--jn-ink-soft": "#6B6558",
    "--jn-indigo": "#2B4570",
    "--jn-hanko": "#C1443C",
    "--jn-line": "#D8D0BE",
    "--jn-card": "#F7F4EC",
    background: "var(--jn-paper)",
    minHeight: 600,
    padding: "0",
    color: "var(--jn-ink)",
  },
  container: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "28px 20px 48px",
  },
  header: {
    display: "flex",
    alignItems: "stretch",
    gap: 16,
    marginBottom: 22,
  },
  headerBar: {
    width: 4,
    borderRadius: 2,
    background: "linear-gradient(180deg, var(--jn-indigo), var(--jn-hanko))",
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "var(--jn-ink)",
    letterSpacing: "0.02em",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13.5,
    color: "var(--jn-ink-soft)",
  },
  tabs: {
    display: "flex",
    gap: 22,
    borderBottom: "1px solid var(--jn-line)",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "8px 2px 12px",
    fontSize: 14.5,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  loading: {
    padding: 40,
    textAlign: "center",
    color: "var(--jn-ink-soft)",
  },
  main: {},
  controlsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  segmented: {
    display: "inline-flex",
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  segmentedBtn: {
    border: "none",
    borderRadius: 6,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 500,
  },
  scoreBadge: {
    fontSize: 12.5,
    color: "var(--jn-ink-soft)",
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 20,
    padding: "6px 14px",
  },
  emptyState: {
    padding: "28px 20px",
    textAlign: "center",
    color: "var(--jn-ink-soft)",
    background: "var(--jn-card)",
    border: "1px dashed var(--jn-line)",
    borderRadius: 10,
    fontSize: 14,
  },
  quizCard: {
    position: "relative",
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 14,
    padding: "36px 28px 28px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(33,31,28,0.06)",
    overflow: "hidden",
  },
  tanzakuLine: {
    position: "absolute",
    top: 0,
    left: 18,
    width: 2,
    height: "100%",
    background: "linear-gradient(180deg, var(--jn-hanko), transparent 70%)",
    opacity: 0.35,
  },
  promptLabel: {
    fontSize: 12.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--jn-ink-soft)",
    marginBottom: 14,
  },
  kanjiDisplay: {
    fontSize: 76,
    lineHeight: 1,
    marginBottom: 26,
    color: "var(--jn-ink)",
  },
  wordDisplay: {
    fontSize: 36,
    lineHeight: 1.3,
    marginBottom: 26,
    color: "var(--jn-ink)",
    wordBreak: "break-word",
  },
  answerRow: {
    display: "flex",
    gap: 10,
    maxWidth: 420,
    margin: "0 auto",
  },
  answerInput: {
    flex: 1,
    padding: "12px 14px",
    fontSize: 15,
    borderRadius: 8,
    border: "1px solid var(--jn-line)",
    background: "#fff",
    fontFamily: "inherit",
  },
  primaryBtn: {
    background: "var(--jn-indigo)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  feedbackRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 6,
  },
  stampCorrect: {
    width: 56,
    height: 56,
    minWidth: 56,
    borderRadius: "50%",
    border: "3px solid var(--jn-hanko)",
    color: "var(--jn-hanko)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    transform: "rotate(-8deg)",
  },
  stampWrong: {
    width: 56,
    height: 56,
    minWidth: 56,
    borderRadius: "50%",
    border: "3px solid var(--jn-ink-soft)",
    color: "var(--jn-ink-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 700,
  },
  feedbackText: {
    textAlign: "left",
  },
  detailBox: {
    marginTop: 20,
    background: "#fff",
    border: "1px solid var(--jn-line)",
    borderRadius: 10,
    padding: "14px 16px",
    textAlign: "left",
    fontSize: 13.5,
  },
  detailRow: {
    padding: "4px 0",
    color: "var(--jn-ink)",
    borderBottom: "1px solid var(--jn-line)",
  },
  detailLabel: {
    display: "inline-block",
    minWidth: 72,
    color: "var(--jn-ink-soft)",
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  lexiconGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)",
    gap: 20,
  },
  formCard: {
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 12,
    padding: 20,
    alignSelf: "start",
  },
  listCard: {
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 12,
    padding: 16,
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    display: "block",
    fontSize: 12,
    color: "var(--jn-ink-soft)",
    marginBottom: 5,
  },
  textInput: {
    width: "100%",
    padding: "9px 11px",
    fontSize: 14,
    borderRadius: 7,
    border: "1px solid var(--jn-line)",
    background: "#fff",
    fontFamily: "inherit",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  saveHint: {
    marginTop: 10,
    fontSize: 12.5,
    color: "var(--jn-hanko)",
    textAlign: "center",
  },
  listScroll: {
    maxHeight: 480,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingRight: 4,
  },
  listRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid var(--jn-line)",
    borderRadius: 8,
    padding: "9px 12px",
  },
  listPrimary: {
    fontSize: 14.5,
    fontWeight: 600,
  },
  listSecondary: {
    fontSize: 12.5,
    color: "var(--jn-ink-soft)",
    marginTop: 2,
  },
  listStats: {
    fontSize: 11,
    color: "var(--jn-ink-soft)",
    marginTop: 3,
  },
  deleteBtn: {
    background: "none",
    border: "1px solid var(--jn-line)",
    borderRadius: 6,
    width: 28,
    height: 28,
    color: "var(--jn-ink-soft)",
    cursor: "pointer",
    fontSize: 13,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 14,
  },
  statCard: {
    background: "var(--jn-card)",
    border: "1px solid var(--jn-line)",
    borderRadius: 12,
    padding: "18px 16px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--jn-indigo)",
  },
  statLabel: {
    fontSize: 12,
    color: "var(--jn-ink-soft)",
    marginTop: 4,
  },
};
