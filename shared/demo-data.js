// Demo dataset ported from the Kinwell v2 design (Claude Design).
// Used by the server seeder and by Storybook fixtures, so both show the same family.
/* eslint-disable */
const ST={normal:{label:'Normal',fg:'#1d6a42',bg:'#e1f0e6',tint:'#eef7f1'},watch:{label:'Watch',fg:'#7a4d00',bg:'#fbeccb',tint:'#fdf5e3'},attention:{label:'Needs attention',fg:'#a1241b',bg:'#fadfdb',tint:'#fcefec'}};
const M=(name,value,unit,status,series,trend,range,plain)=>({name,value,unit,status,series,trend,range,plain});
const PARENTS={
 ammi:{key:'ammi',short:'Ammi',age:72,city:'Lahore',overall:'watch',overallTitle:'Mostly steady',
  overallText:'Blood sugar is lower for the fifth month running. Vitamin D is still low, so Hina has started a daily tablet.',
  lastVisit:'Mon 28 Sep',nextVisit:'Mon 12 Oct, 11 am',nextIn:'In 3 days',nextVisitLong:'Monday, 12 October at 11 in the morning',
  note:'Ammi is doing well. Her morning daliya and evening walks are working — her blood sugar has come down again. Her vitamin D is still low, so I\'ve started a small tablet with breakfast. She said she\'s been a bit tired; her blood iron is slightly low, so I\'ve added palak and chana to lunch.',
  changes:[{k:'Keep going',v:'Daliya breakfast and a 20-minute walk after Maghrib'},{k:'New this visit',v:'Vitamin D3 every morning with food'},{k:'Next visit',v:'Re-check blood pressure and weight'}],
  markers:[
   M('Fasting blood sugar','118','mg/dL','watch',[134,129,126,121,120,118],'Down 16 since May','70–99','How much sugar is in the blood before breakfast. Lower is better for diabetes.'),
   M('HbA1c','6.4','%','watch',[6.9,6.8,6.7,6.6,6.5,6.4],'Down from 6.9','under 5.7','Average blood sugar over the last 3 months — the bigger picture, not just one day.'),
   M('Vitamin D','18','ng/mL','attention',[24,22,21,19,17,18],'Low for 4 months','30–100','Keeps bones strong and muscles working. Most of it comes from sunlight.'),
   M('Vitamin B12','410','pg/mL','normal',[380,395,402,398,405,410],'Steady','200–900','Keeps nerves and memory healthy and helps make blood.'),
   M('Hemoglobin','11.6','g/dL','watch',[11.9,11.8,11.5,11.4,11.5,11.6],'Slightly low','12–15.5','The part of blood that carries oxygen. When low, people often feel tired.'),
   M('LDL cholesterol','112','mg/dL','normal',[128,124,119,117,114,112],'Down 16 since May','under 130','The “sticky” cholesterol that can build up in blood vessels. Lower is better.'),
   M('Blood pressure','132/84','mmHg','watch',[138,136,135,134,131,132],'Slightly high','under 130/80','How hard blood pushes on the vessel walls. The top number is when the heart beats.'),
   M('Weight','64.0','kg','normal',[65.5,65.2,64.8,64.5,64.2,64.0],'Down 1.5 kg, as planned','BMI 24','A steady, healthy weight helps blood sugar and knees.')],
  items:[
   {id:'s1',kind:'supp',title:'Vitamin D3 · 2,000 IU',simple:'Vitamin D tablet',dose:'1 small tablet',time:'Morning, with breakfast',done:true},
   {id:'s2',kind:'supp',title:'Calcium · 500 mg',simple:'Calcium tablet',dose:'1 tablet',time:'Afternoon, with lunch',done:false},
   {id:'s3',kind:'supp',title:'Iron (gentle) · 25 mg',simple:'Iron tablet',dose:'1 tablet, not with tea',time:'Evening',done:false},
   {id:'m1',kind:'meal',title:'Daliya with milk & almonds',simple:'Daliya with milk and almonds',time:'Breakfast',done:true},
   {id:'m2',kind:'meal',title:'Moong dal, palak & 1 chapati',simple:'Moong dal, palak and one chapati',time:'Lunch',done:true},
   {id:'m3',kind:'meal',title:'Grilled rohu, brown rice & salad',simple:'Grilled fish with brown rice',time:'Dinner',done:false}],
  alerts:[
   {status:'attention',type:'Flagged result',title:'Vitamin D is low (18)',text:'Hina started a daily tablet on 28 Sep. Re-test in December.',action:'See result'},
   {status:'watch',type:'Missed',title:'Calcium missed yesterday',text:'Ammi didn\'t tick off her afternoon tablet on Thursday.',action:'Send Ammi a reminder'},
   {status:'watch',type:'Test due',title:'HbA1c re-test due by 20 Oct',text:'Hina can take the sample at Monday\'s visit.',action:'Add to visit'}]},
 abbu:{key:'abbu',short:'Abbu',age:76,city:'Lahore',overall:'attention',overallTitle:'Blood sugar needs attention',
  overallText:'His fasting sugar has gone up four months in a row. Hina is changing his dinners and wants a kidney test before the next step.',
  lastVisit:'Mon 28 Sep',nextVisit:'Mon 12 Oct, 12 pm',nextIn:'In 3 days',nextVisitLong:'Monday, 12 October at 12 noon',
  note:'Abbu\'s sugar has crept up again. He told me about extra mithai at a wedding and skipping walks in the heat — very normal, and fixable. I\'ve swapped white rice for brown at dinner and kept lunch to one chapati. His B12 is slowly dropping, so please help him remember the morning tablet.',
  changes:[{k:'Keep going',v:'Besan chilla breakfast — he enjoys it'},{k:'New this visit',v:'Brown rice at dinner; one chapati at lunch'},{k:'Next visit',v:'Kidney function test before any new supplement'}],
  markers:[
   M('Fasting blood sugar','142','mg/dL','attention',[128,131,135,138,140,142],'Up 14 since May','70–99','How much sugar is in the blood before breakfast. Lower is better for diabetes.'),
   M('HbA1c','7.2','%','attention',[6.8,6.9,7.0,7.0,7.1,7.2],'Up from 6.8','under 7.0','Average blood sugar over the last 3 months — the bigger picture, not just one day.'),
   M('Vitamin D','31','ng/mL','normal',[22,25,27,29,30,31],'Back in range','30–100','Keeps bones strong and muscles working. Most of it comes from sunlight.'),
   M('Vitamin B12','220','pg/mL','watch',[310,290,270,250,232,220],'Dropping slowly','200–900','Keeps nerves and memory healthy and helps make blood.'),
   M('Hemoglobin','13.4','g/dL','normal',[13.2,13.3,13.1,13.4,13.3,13.4],'Steady','13.5–17','The part of blood that carries oxygen. When low, people often feel tired.'),
   M('LDL cholesterol','138','mg/dL','watch',[130,132,135,134,137,138],'Up 8 since May','under 130','The “sticky” cholesterol that can build up in blood vessels. Lower is better.'),
   M('Blood pressure','128/80','mmHg','normal',[134,132,131,130,129,128],'Improving','under 130/80','How hard blood pushes on the vessel walls. The top number is when the heart beats.'),
   M('Weight','71.0','kg','normal',[72.4,72.0,71.8,71.5,71.2,71.0],'Steady','BMI 25','A steady, healthy weight helps blood sugar and knees.')],
  items:[
   {id:'s1',kind:'supp',title:'Vitamin B12 · 1,000 mcg',simple:'Vitamin B12 tablet',dose:'1 tablet under the tongue',time:'Morning, before breakfast',done:false},
   {id:'s2',kind:'supp',title:'Omega-3 · 1 g',simple:'Fish oil capsule',dose:'1 capsule',time:'Afternoon, with lunch',done:false},
   {id:'s3',kind:'supp',title:'Magnesium · 200 mg',simple:'Magnesium tablet',dose:'1 tablet',time:'Night, before sleep',done:false},
   {id:'m1',kind:'meal',title:'Besan chilla & mint chutney',simple:'Besan chilla with mint chutney',time:'Breakfast',done:true},
   {id:'m2',kind:'meal',title:'Chana salad & 1 chapati',simple:'Chana salad and one chapati',time:'Lunch',done:false},
   {id:'m3',kind:'meal',title:'Chicken shorba & brown rice',simple:'Chicken shorba with brown rice',time:'Dinner',done:false}],
  alerts:[
   {status:'attention',type:'Flagged result',title:'Fasting blood sugar is high (142)',text:'Up for the fourth month in a row. Hina has changed his dinners.',action:'See trend'},
   {status:'attention',type:'Missed',title:'B12 tablet missed 2 days',text:'Tuesday and Wednesday weren\'t ticked off.',action:'Send Abbu a reminder'},
   {status:'watch',type:'Overdue test',title:'Kidney function test overdue',text:'Was due 25 Sep. Hina needs it before changing his plan.',action:'Book test'}]}
};
const PROFILE={
 ammi:{full:'Fatima Rahman',born:'14 March 1954',langs:'Urdu, Punjabi',lives:'Lives with Abbu in Model Town, Lahore',
  conditions:[{name:'Prediabetes',since:'2023',plain:'Blood sugar is higher than normal, but not diabetes. Food and walking can bring it down.'},{name:'High blood pressure',since:'2019',plain:'Slightly high, kept in check with one tablet a day.'},{name:'Osteopenia',since:'2024',plain:'Bones are a little thinner than ideal. Vitamin D and calcium help.'}],
  allergies:[{name:'Penicillin',reaction:'Skin rash'},{name:'Prawns & shellfish',reaction:'Lip swelling'}],
  meds:[{name:'Amlodipine',dose:'5 mg',when:'Morning',for:'Blood pressure',by:'Dr. Aslam, Ittefaq Hospital'},{name:'Atorvastatin',dose:'10 mg',when:'Night',for:'Cholesterol',by:'Dr. Aslam'}],
  diet:['Halal','Low sodium','Soft foods (dentures)','No shellfish','Prefers desi food']},
 abbu:{full:'Tariq Rahman',born:'2 July 1950',langs:'Urdu, Punjabi, English',lives:'Lives with Ammi in Model Town, Lahore',
  conditions:[{name:'Type 2 diabetes',since:'2016',plain:'The body doesn\'t use sugar well, so blood sugar runs high. Managed with food, walking and metformin.'},{name:'High blood pressure',since:'2015',plain:'Kept in check with one tablet a day.'},{name:'Knee arthritis',since:'2021',plain:'Wear and tear in the knees, which makes long walks harder.'}],
  allergies:[{name:'Sulfa medicines',reaction:'Hives'}],
  meds:[{name:'Metformin',dose:'500 mg',when:'Twice a day, with meals',for:'Diabetes',by:'Dr. Aslam'},{name:'Losartan',dose:'50 mg',when:'Morning',for:'Blood pressure',by:'Dr. Aslam'},{name:'Aspirin',dose:'75 mg',when:'After lunch',for:'Heart protection',by:'Dr. Naveed, cardiologist'}],
  diet:['Halal','Diabetic-friendly','Low sodium','Sugar-free sweetener in chai']}
};
const CONTACTS=[{name:'Sana Rahman',ini:'S',rel:'Daughter · main contact',where:'London, UK',phone:'+44 7700 900412'},{name:'Bilal Rahman',ini:'B',rel:'Son',where:'Dubai, UAE',phone:'+971 50 123 4567'},{name:'Khalid Mehmood',ini:'K',rel:'Neighbour · has a spare key',where:'Model Town, Lahore',phone:'+92 300 555 0192'}];
const BAND={'Fasting blood sugar':[70,99],'HbA1c':[0,5.7],'Vitamin D':[30,100],'Vitamin B12':[200,900],'Hemoglobin':[12,15.5],'LDL cholesterol':[0,130],'Blood pressure':[0,130],'Weight':null};
const BAND_ABBU={'HbA1c':[0,7],'Hemoglobin':[13.5,17]};
const MONTHS=['Apr','May','Jun','Jul','Aug','Sep'],VISIT_IDX=[3,4,5],VISIT_LBL=['2 Jul','3 Aug','28 Sep'];
const MEANING={
 ammi:{'Vitamin D':{means:'Ammi\'s vitamin D is well below the healthy range. Low vitamin D can weaken bones and make muscles ache. It\'s common in people who spend most of their day indoors.',doing:'Vitamin D3 2,000 IU with breakfast every day since 28 Sep. Re-test in December.',you:'Encourage 15 minutes of morning sun on the veranda, with her arms uncovered.'},
  'Fasting blood sugar':{means:'Still above the healthy range, but it has fallen steadily for five months.',doing:'Keeping the daliya breakfast and walks after Maghrib.',you:'Ask about her walk when you call. It helps her stick to it.'},
  'HbA1c':{means:'Her 3-month blood sugar average is in the prediabetes range, and getting better.',doing:'Re-testing at the 12 Oct visit.',you:'Nothing extra for now.'},
  'Hemoglobin':{means:'Slightly low, which may explain why she feels tired in the afternoon.',doing:'Added palak and chana at lunch, plus a gentle iron tablet in the evening.',you:'Remind her to wait an hour after the iron tablet before having tea.'},
  'Blood pressure':{means:'A little above target. Not dangerous, but worth watching.',doing:'Less salt: fewer achaar and papad.',you:'Next time someone visits, check that the home BP machine still works.'}},
 abbu:{'Fasting blood sugar':{means:'Above the healthy range and rising for four months. Not an emergency, but his plan needs adjusting.',doing:'Brown rice at dinner, one chapati at lunch, sugar-free chai. Shared the trend with Dr. Aslam.',you:'Ask Abbu about his walks. A short one after dinner helps most.'},
  'HbA1c':{means:'His 3-month average is just above his target of 7.',doing:'Re-test in December, after the food changes have had time to work.',you:'Nothing extra for now.'},
  'Vitamin B12':{means:'Still in range but falling. Metformin can lower B12 over time.',doing:'Started vitamin B12 1,000 mcg every morning.',you:'Help him remember. He missed it on Tuesday and Wednesday.'},
  'LDL cholesterol':{means:'Slightly above target.',doing:'Fewer fried snacks; more oats and fish.',you:'Nothing extra for now.'}},
 fallback:{means:'This is in the healthy range. No change needed.',doing:'Checking it again at each visit.',you:'Nothing to do. It\'s going well.'}
};
const REPORTS=[{lab:'Chughtai Lab, Lahore',date:'26 Sep 2026',file:'PDF · 8 results',by:'Uploaded by Hina'},{lab:'Excel Labs',date:'24 Jun 2026',file:'Photo · 6 results',by:'Uploaded by Sana'},{lab:'Shaukat Khanum Lab',date:'12 Apr 2026',file:'PDF · 9 results',by:'Uploaded by Bilal'}];
const DISHES={
 daliya:{n:'Daliya with milk & almonds',nut:['Fibre 6 g','Protein 12 g','Slow sugar'],why:'Releases sugar slowly, so mornings stay steady.',link:'Fasting blood sugar'},
 chilla:{n:'Besan chilla & mint chutney',nut:['Protein 14 g','Low GI'],why:'Gram flour is rich in protein and stops sugar from spiking.',link:'Fasting blood sugar'},
 eggs:{n:'Boiled egg & whole-wheat toast',nut:['Vitamin D','Protein 13 g'],why:'Egg yolk adds a little vitamin D.',link:'Vitamin D'},
 oats:{n:'Masala oats with vegetables',nut:['Fibre 5 g','Low salt'],why:'Oat fibre helps lower cholesterol.',link:'LDL cholesterol'},
 dal:{n:'Moong dal, palak & 1 chapati',nut:['Iron 4 mg','Fibre 8 g'],why:'Spinach and lentils add iron for energy.',link:'Hemoglobin'},
 chana:{n:'Chana salad & 1 chapati',nut:['Protein 15 g','Fibre 10 g'],why:'Chickpeas fill you up without raising sugar quickly.',link:'Fasting blood sugar'},
 raita:{n:'Lauki sabzi, raita & 1 chapati',nut:['Calcium 200 mg','Soft'],why:'Yoghurt adds calcium for bones; lauki is soft and light.',link:'Vitamin D'},
 fish:{n:'Grilled rohu, brown rice & salad',nut:['Vitamin D','Omega-3'],why:'Oily fish is one of the few foods with vitamin D.',link:'Vitamin D'},
 shorba:{n:'Chicken shorba & brown rice',nut:['Protein 24 g','Low fat'],why:'Brown rice raises sugar more slowly than white.',link:'Fasting blood sugar'},
 karela:{n:'Karela with daal & 1 chapati',nut:['Fibre 7 g','Low GI'],why:'Bitter gourd may help bring blood sugar down.',link:'HbA1c'},
 khichdi:{n:'Soft vegetable khichdi & dahi',nut:['Soft','Protein 11 g'],why:'Easy to chew and gentle on the stomach.',link:'Weight'},
 guava:{n:'Guava with chaat masala',nut:['Vitamin C','Fibre 5 g'],why:'Vitamin C helps the body absorb iron.',link:'Hemoglobin'},
 nuts:{n:'Walnuts & almonds, a handful',nut:['Healthy fats','Magnesium'],why:'Good fats support the heart.',link:'LDL cholesterol'},
 lassi:{n:'Lassi, lightly salted',nut:['Calcium 250 mg'],why:'Calcium for bones without added sugar.',link:'Vitamin D'},
 sprouts:{n:'Moong sprouts chaat',nut:['Protein 7 g','Fibre 4 g'],why:'A light snack that keeps sugar steady.',link:'Fasting blood sugar'}
};
const WEEK={
 ammi:[['daliya','dal','fish','guava'],['eggs','raita','khichdi','lassi'],['daliya','dal','shorba','guava'],['oats','chana','fish','nuts'],['eggs','raita','shorba','guava'],['daliya','dal','khichdi','lassi'],['chilla','chana','fish','nuts']],
 abbu:[['chilla','chana','shorba','sprouts'],['oats','karela','fish','nuts'],['eggs','chana','shorba','guava'],['chilla','karela','fish','sprouts'],['oats','dal','shorba','nuts'],['eggs','chana','fish','guava'],['chilla','karela','shorba','sprouts']]
};
const DAYS=[['Mon','5','Monday 5 Oct'],['Tue','6','Tuesday 6 Oct'],['Wed','7','Wednesday 7 Oct'],['Thu','8','Thursday 8 Oct'],['Fri','9','Friday 9 Oct'],['Sat','10','Saturday 10 Oct'],['Sun','11','Sunday 11 Oct']].map(([s,d,long])=>({s,d,long}));
const FAVOR={
 ammi:{favor:[{n:'Palak, methi & sarson',why:'Iron for energy'},{n:'Daliya, oats & brown rice',why:'Slow, steady sugar'},{n:'Dahi & lassi',why:'Calcium for bones'},{n:'Eggs & oily fish',why:'Some vitamin D'},{n:'Guava, oranges & amla',why:'Help the body absorb iron'}],
  limit:[{n:'Achaar, papad & salty snacks',why:'Raise blood pressure'},{n:'Mithai & sweet chai',why:'Spike blood sugar'},{n:'Tea within an hour of meals',why:'Blocks iron'},{n:'Fried pakoray & samosay',why:'Raise cholesterol'},{n:'Maida: naan & white bread',why:'Sugar rises fast'}]},
 abbu:{favor:[{n:'Karela, lauki & tori',why:'Low in sugar'},{n:'Chana, moong & masoor',why:'Protein that keeps sugar steady'},{n:'Brown rice & whole-wheat chapati',why:'Slower sugar rise'},{n:'Fish twice a week',why:'Good for the heart'},{n:'Walnuts & almonds',why:'Healthy fats'}],
  limit:[{n:'Mithai, jalebi & sweet chai',why:'Spike blood sugar'},{n:'White rice & naan',why:'Sugar rises fast'},{n:'Mango & banana: small portions',why:'Very sugary fruit'},{n:'Fried snacks & paratha',why:'Raise cholesterol'},{n:'Salty achaar',why:'Raises blood pressure'}]}
};
const SUPPX={
 ammi:{s1:{slot:'Morning',chips:['Morning','With food'],reason:'Low vitamin D',link:'Vitamin D',start:'28 Sep 2026',review:'Re-test in December',week:[1,1,1,1,null,null,null]},
  s2:{slot:'Afternoon',chips:['Afternoon','With lunch'],reason:'Thinner bones (osteopenia)',link:'Vitamin D',start:'12 Apr 2026',review:'12 Oct visit',week:[1,1,1,0,null,null,null]},
  s3:{slot:'Evening',chips:['Evening','Not with tea'],reason:'Slightly low iron',link:'Hemoglobin',start:'28 Sep 2026',review:'Blood test in November',week:[1,1,1,1,null,null,null]}},
 abbu:{s1:{slot:'Morning',chips:['Morning','Before breakfast'],reason:'B12 falling; metformin lowers it',link:'Vitamin B12',start:'28 Sep 2026',review:'Re-test in December',week:[1,0,0,1,null,null,null]},
  s2:{slot:'Afternoon',chips:['Afternoon','With lunch'],reason:'Cholesterol slightly high',link:'LDL cholesterol',start:'3 Aug 2026',review:'12 Oct visit',week:[1,1,1,1,null,null,null]},
  s3:{slot:'Night',chips:['Night','Before sleep'],reason:'Leg cramps at night',link:'',start:'31 Aug 2026',review:'November visit',week:[1,1,1,1,null,null,null]}}
};
const INTERACT={
 ammi:[{level:'watch',title:'Iron and calcium block each other',text:'Taken together, the body absorbs less of both. Hina has put them six hours apart: calcium at lunch, iron in the evening.',by:'Flagged by Hina · 28 Sep'},{level:'normal',title:'Checked against Amlodipine and Atorvastatin',text:'No known problems with Ammi\'s current medicines.',by:'Checked by Hina · 28 Sep'}],
 abbu:[{level:'attention',title:'Omega-3 together with aspirin',text:'Together they can make bruising a little more likely. Hina checked with Dr. Naveed and this low dose is fine. Tell Hina if Abbu bruises easily or has nosebleeds.',by:'Flagged by Hina · 3 Aug'},{level:'watch',title:'Metformin lowers B12 over time',text:'That\'s why vitamin B12 was added. It will be re-checked in December.',by:'Flagged by Hina · 28 Sep'}]
};
const VISITS={
 ammi:{next:{date:'Monday, 12 October',time:'11:00 am',plan:['Re-check blood pressure and weight','Take a blood sample for HbA1c','Go through next week\'s meals with Nasreen (cook)']},past:[
  {id:'a4',date:'Monday 28 September 2026',short:'28 Sep',title:'Vitamin D started',summary:'Blood sugar down again; vitamin D still low.',dur:'55 min',obs:['In good spirits; walking after Maghrib 5 days a week','Feels tired by late afternoon','Good appetite, finishing lunch'],meas:[['Blood pressure','132/84 mmHg','watch'],['Weight','64.0 kg','normal'],['Fasting sugar (finger prick)','118 mg/dL','watch'],['Pulse','74 bpm','normal']],tests:['HbA1c re-test at the 12 Oct visit','Vitamin D re-test in December'],recs:['Vitamin D3 2,000 IU with breakfast','Iron tablet in the evening, away from tea','Palak or chana at lunch, 4 days a week'],next:['Sana: order a pill box with morning and evening compartments','Hina: bring the new meal plan for Nasreen']},
  {id:'a3',date:'Monday 31 August 2026',short:'31 Aug',title:'Evening walks begin',summary:'Blood pressure a little better; walking routine agreed.',dur:'45 min',obs:['Walking only 1–2 days a week because of the heat','Sleeping well','Wants more variety at breakfast'],meas:[['Blood pressure','131/83 mmHg','watch'],['Weight','64.2 kg','normal'],['Fasting sugar (finger prick)','120 mg/dL','watch']],tests:['None this time'],recs:['20-minute walk after Maghrib, with Abbu','Eggs instead of daliya twice a week'],next:['Bilal: send a step counter']},
  {id:'a2',date:'Monday 3 August 2026',short:'3 Aug',title:'Less salt',summary:'Blood pressure slightly high; cutting back on salty foods.',dur:'50 min',obs:['Has achaar with most meals','Ankles a little puffy in the evening'],meas:[['Blood pressure','134/86 mmHg','watch'],['Weight','64.5 kg','normal']],tests:['Full blood count'],recs:['Achaar only twice a week','Lemon and herbs instead of extra salt'],next:['Hina: talk to Nasreen about salt in cooking']},
  {id:'a1',date:'Thursday 2 July 2026',short:'2 Jul',title:'First visit',summary:'Got to know Ammi and set first goals.',dur:'75 min',obs:['Wears dentures and prefers soft foods','Main meal is lunch'],meas:[['Blood pressure','136/86 mmHg','watch'],['Weight','64.8 kg','normal']],tests:['Vitamin D','Vitamin B12','Cholesterol'],recs:['Daliya breakfast 4 days a week'],next:['Sana: upload the April lab report']}]},
 abbu:{next:{date:'Monday, 12 October',time:'12:00 pm',plan:['Check blood sugar and feet','Review kidney test result','Adjust dinners if sugar is still high']},past:[
  {id:'b4',date:'Monday 28 September 2026',short:'28 Sep',title:'Dinner swap',summary:'Sugar up again after a month of weddings.',dur:'60 min',obs:['Ate mithai most days at family weddings','Skipped walks in the heat','Some tingling in his feet in the mornings'],meas:[['Blood pressure','128/80 mmHg','normal'],['Weight','71.0 kg','normal'],['Fasting sugar (finger prick)','142 mg/dL','attention'],['Pulse','70 bpm','normal']],tests:['Kidney function: overdue, please book','HbA1c in December'],recs:['Brown rice instead of white at dinner','One chapati at lunch','Vitamin B12 every morning'],next:['Sana or Bilal: book the kidney test at Chughtai','Hina: share the sugar trend with Dr. Aslam']},
  {id:'b3',date:'Monday 31 August 2026',short:'31 Aug',title:'Leg cramps',summary:'Cramps at night; started magnesium.',dur:'45 min',obs:['Leg cramps at night 3–4 times a week','Drinking only 4 glasses of water'],meas:[['Blood pressure','129/80 mmHg','normal'],['Fasting sugar (finger prick)','140 mg/dL','attention']],tests:['Kidney function'],recs:['Magnesium 200 mg at night','8 glasses of water: a jug on his table'],next:['Bilal: order a 2-litre water jug']},
  {id:'b2',date:'Monday 3 August 2026',short:'3 Aug',title:'Omega-3 started',summary:'Cholesterol slightly high.',dur:'50 min',obs:['Fried snacks with evening chai most days'],meas:[['Blood pressure','131/81 mmHg','watch'],['Weight','71.5 kg','normal']],tests:['Cholesterol'],recs:['Omega-3 with lunch','Roasted chana instead of pakoray'],next:['Hina: check omega-3 with his cardiologist']},
  {id:'b1',date:'Thursday 2 July 2026',short:'2 Jul',title:'First visit',summary:'Got to know Abbu and set first goals.',dur:'75 min',obs:['Loves sweet chai, 4 cups a day','Knees hurt on long walks'],meas:[['Blood pressure','134/82 mmHg','watch'],['Weight','72.4 kg','normal']],tests:['HbA1c','Vitamin D','Vitamin B12'],recs:['Sugar-free sweetener in chai','Two 10-minute walks a day'],next:['Sana: upload the April lab report']}]}
};
const BOOK_DAYS=[['Mon','12 Oct','Monday 12 October'],['Tue','13 Oct','Tuesday 13 October'],['Wed','14 Oct','Wednesday 14 October'],['Thu','15 Oct','Thursday 15 October'],['Sat','17 Oct','Saturday 17 October']].map(([s,d,long])=>({s,d,long}));
const BOOK_SLOTS=[{t:'10:00 am',ok:true},{t:'11:00 am',ok:true},{t:'12:00 pm',ok:false},{t:'3:00 pm',ok:true},{t:'4:30 pm',ok:true}];
const PEOPLE={hina:{name:'Hina Qureshi',role:'Nutritionist',ini:'H',bg:'#c7ddd6',fg:'#1f544b'},sana:{name:'Sana',role:'You',ini:'S',bg:'#2c6e63',fg:'#fff'},bilal:{name:'Bilal',role:'Son · Dubai',ini:'B',bg:'#f6d3c4',fg:'#7a3a22'}};
const MSGS={
 ammi:[{from:'hina',t:'Mon 28 Sep · 2:14 pm',text:'Assalam-o-Alaikum Sana and Bilal. I\'ve just finished Ammi\'s visit. The summary is below.'},{card:'a4'},{from:'sana',t:'Mon 28 Sep · 10:40 am London',text:'Thank you Hina! Should we be worried about the vitamin D?'},{from:'hina',t:'Mon 28 Sep · 3:02 pm',text:'Not worried. It\'s very common. The tablet and some morning sun should bring it up by December.'},{from:'bilal',t:'Tue 29 Sep · 7:20 pm Dubai',text:'I\'ve ordered her a pill box from Daraz. It arrives Friday.'},{from:'hina',t:'Yesterday · 6:30 pm',text:'Small thing: Ammi missed her afternoon calcium yesterday. Could one of you give her a gentle reminder?'}],
 abbu:[{from:'hina',t:'Mon 28 Sep · 2:40 pm',text:'Abbu\'s visit summary is below. His sugar is up, but we have a clear plan.'},{card:'b4'},{from:'bilal',t:'Mon 28 Sep · 6:15 pm Dubai',text:'Thanks Hina. Can you send the kidney test details? I\'ll book it for Saturday.'},{from:'hina',t:'Mon 28 Sep · 6:40 pm',text:'Kidney function test (creatinine and eGFR) at Chughtai. No fasting needed.'},{from:'sana',t:'Wed 7 Oct · 9:12 am London',text:'He missed his B12 on Tuesday and today. I\'ll call him tonight.'}]
};
const DOCS={
 ammi:[{n:'Chughtai Lab, 26 Sep 2026',t:'Lab report',f:'PDF · 412 KB',by:'Hina · 28 Sep'},{n:'Prescription, Dr. Aslam',t:'Prescription',f:'Photo · 1.2 MB',by:'Sana · 14 Aug'},{n:'Meal plan, week of 5 Oct',t:'Nutrition plan',f:'PDF · 180 KB',by:'Hina · 28 Sep'},{n:'Excel Labs, 24 Jun 2026',t:'Lab report',f:'Photo · 2.1 MB',by:'Sana · 25 Jun'},{n:'Bone density scan, 2024',t:'Scan',f:'PDF · 3.4 MB',by:'Bilal · 2 Jul'}],
 abbu:[{n:'Chughtai Lab, 26 Sep 2026',t:'Lab report',f:'PDF · 398 KB',by:'Hina · 28 Sep'},{n:'Prescription, Dr. Aslam',t:'Prescription',f:'Photo · 1.4 MB',by:'Sana · 14 Aug'},{n:'Heart scan (echo), Dr. Naveed',t:'Heart report',f:'PDF · 2.8 MB',by:'Bilal · 2 Jul'},{n:'Meal plan, week of 5 Oct',t:'Nutrition plan',f:'PDF · 176 KB',by:'Hina · 28 Sep'}]
};
const CLIENTS=[{name:'Fatima Rahman (Ammi)',age:72,area:'Model Town',family:'Sana R. · London',status:'watch',last:'28 Sep',next:'Mon 12 Oct, 11 am'},{name:'Tariq Rahman (Abbu)',age:76,area:'Model Town',family:'Sana R. · London',status:'attention',last:'28 Sep',next:'Mon 12 Oct, 12 pm'},{name:'Mumtaz Hussain',age:69,area:'DHA Phase 5',family:'Ayesha H. · Riyadh',status:'attention',last:'6 Oct',next:'Tomorrow, 4 pm'},{name:'Zubaida Khan',age:81,area:'Gulberg',family:'Imran K. · Toronto',status:'normal',last:'2 Oct',next:'Fri 16 Oct, 10 am'},{name:'Rehana Butt',age:77,area:'Cantt',family:'Saima B. · Houston',status:'watch',last:'1 Oct',next:'Mon 19 Oct, 3 pm'},{name:'Nasir Ali',age:74,area:'Johar Town',family:'Faisal A. · Manchester',status:'normal',last:'30 Sep',next:'Wed 21 Oct, 11 am'}];
const LIB_SUPPS=[{id:'vitd',n:'Vitamin D3 · 2,000 IU',link:'Vitamin D'},{id:'cal',n:'Calcium · 500 mg',link:'Vitamin D'},{id:'iron',n:'Iron · 25 mg',link:'Hemoglobin'},{id:'b12',n:'Vitamin B12 · 1,000 mcg',link:'Vitamin B12'},{id:'omega',n:'Omega-3 · 1 g',link:'LDL cholesterol'},{id:'mag',n:'Magnesium · 200 mg',link:'General health'}];
const MARKER_NAMES=['Fasting blood sugar','HbA1c','Vitamin D','Vitamin B12','Hemoglobin','LDL cholesterol','Blood pressure','Weight','General health'];
const OBS=['Good appetite','Low appetite','A bit tired','Good mood','Low mood','Swollen ankles','Trouble chewing','Drinking enough water','Walking daily'];
const TESTS=['HbA1c','Vitamin D','Iron & ferritin','Kidney function','Cholesterol','Vitamin B12'];
const VITALS_IN=[{label:'Blood pressure',ph:'130/80',last:'132/84',unit:'mmHg'},{label:'Pulse',ph:'72',last:'74',unit:'bpm'},{label:'Weight',ph:'64.0',last:'64.0',unit:'kg'},{label:'Fasting sugar',ph:'110',last:'118',unit:'mg/dL'},{label:'Oxygen',ph:'97',last:'97',unit:'%'},{label:'Water today',ph:'6',last:'5',unit:'glasses'}];
const DEFAULT_UPD='Ammi\'s visit went well today. Her blood pressure was 128/82, better than last time. I\'ve added grilled fish twice this week for vitamin D, and Nasreen has the new meal plan.';
const NUTS=[{id:'hina',name:'Hina Qureshi',cred:'Registered dietitian · 9 years',langs:'Urdu, Punjabi, English',areas:'Model Town, Gulberg, Johar Town',next:'Next opening: Mon 12 Oct'},{id:'amna',name:'Amna Sheikh',cred:'Clinical nutritionist · 12 years',langs:'Urdu, English',areas:'DHA, Cantt',next:'Next opening: Wed 14 Oct'},{id:'usman',name:'Usman Tariq',cred:'Registered dietitian · 6 years',langs:'Urdu, Punjabi',areas:'Gulberg, Garden Town',next:'Next opening: Tue 13 Oct'}];
const ONB_STEPS=['Your details','Add parents','Invite family','Choose a nutritionist','Health basics'];
const ONB_CONDS=['Diabetes','Prediabetes','High blood pressure','Heart condition','Kidney problems','Thyroid','Arthritis','Thin bones (osteoporosis)','None that I know of'];
const ONB_DIET=['Halal','Vegetarian','Low sodium','Soft foods','Diabetic-friendly','No dairy','Fasts in Ramadan'];
const CHILDREN=[{key:'sana',name:'Sana',rel:'Your daughter',city:'London'},{key:'bilal',name:'Bilal',rel:'Your son',city:'Dubai'}];

export { ST, PARENTS, PROFILE, CONTACTS, BAND, BAND_ABBU, MONTHS, VISIT_IDX, VISIT_LBL, MEANING, REPORTS, DISHES, WEEK, DAYS, FAVOR, SUPPX, INTERACT, VISITS, BOOK_DAYS, BOOK_SLOTS, PEOPLE, MSGS, DOCS, CLIENTS, LIB_SUPPS, MARKER_NAMES, OBS, TESTS, VITALS_IN, DEFAULT_UPD, NUTS, ONB_STEPS, ONB_CONDS, ONB_DIET, CHILDREN };
