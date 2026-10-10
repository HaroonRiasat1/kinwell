#!/usr/bin/env bash
# Quick manual check of the API. Expects a freshly seeded database (npm run seed);
# results depend on the data, so prefer `npm test` (the self-seeding e2e suite).
# Usage: bash test/smoke.sh   or   API=https://…/api bash test/smoke.sh
B=${API:-http://localhost:4000/api}
j(){ python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
post(){ curl -s -XPOST "$B$1" -H 'content-type: application/json' ${3:+-H "$3"} -d "$2"; }
T=$(post /auth/login '{"email":"sana.rahman@gmail.com","password":"kinwell-demo","role":"family"}' | j 'd["token"]')
H="Authorization: Bearer $T"
P=$(curl -s $B/parents -H "$H" | j 'd[0]["id"]')
for e in dashboard profile labs nutrition supplements visits documents messages home; do printf "%-12s" $e; curl -s $B/parents/$P/$e -H "$H" | head -c 140; echo; done
echo "-- checklist"; curl -s -XPATCH $B/parents/$P/checklist/s2 -H "$H" -H 'content-type: application/json' -d '{"done":true}' | head -c 150; echo
echo "-- bad password"; post /auth/login '{"email":"sana.rahman@gmail.com","password":"x"}'; echo
echo "-- family hitting admin"; curl -s $B/admin/overview -H "$H"; echo
NT=$(post /auth/login '{"email":"hina.qureshi@kinwell.pk","password":"kinwell-demo"}' | j 'd["token"]')
echo "-- clients"; curl -s $B/workspace/clients -H "Authorization: Bearer $NT" | head -c 300; echo
AT=$(post /auth/login '{"email":"zara.ahmed@kinwell.pk","password":"kinwell-demo"}' | j 'd["token"]')
echo "-- admin overview"; curl -s $B/admin/overview -H "Authorization: Bearer $AT" | head -c 900; echo
echo "-- team"; curl -s $B/admin/nutritionists -H "Authorization: Bearer $AT" | head -c 500; echo
echo "-- families"; curl -s $B/admin/families -H "Authorization: Bearer $AT" | head -c 300; echo
CODE=$(post /auth/parent-code '{"phone":"+923001112233"}' | j 'd["devCode"]')
echo "-- parent code"; post /auth/parent-code/verify "{\"phone\":\"+923001112233\",\"code\":\"$CODE\"}" | head -c 200; echo
echo "-- family makes a parent sign-in code, parent signs in with it (spaces in number)"
FC=$(curl -s -XPOST $B/parents/$P/sign-in-code -H "$H" | j 'd["code"]')
post /auth/parent-code/verify "{\"phone\":\"+92 300 111 2233\",\"code\":\"$FC\"}" | head -c 60; echo
echo "-- same code twice is rejected"; post /auth/parent-code/verify "{\"phone\":\"0300 1112233\",\"code\":\"$FC\"}"; echo
echo "-- nutritionist: empty visit refused, typo refused, high readings graded"
NP=$(curl -s $B/workspace/clients -H "Authorization: Bearer $NT" | j '[c["id"] for c in d if "Ammi" in c["name"]][0]')
post /workspace/clients/$NP/visits '{}' "Authorization: Bearer $NT"; echo
post /workspace/clients/$NP/visits '{"vitals":[{"label":"Blood pressure","value":"1650/100"}]}' "Authorization: Bearer $NT"; echo
post /workspace/clients/$NP/visits '{"vitals":[{"label":"Blood pressure","value":"165/100"},{"label":"Fasting sugar","value":"186"}]}' "Authorization: Bearer $NT" | j '[(r["label"], r["status"]) for r in d["readings"]]'
echo "-- nutritionist: today, inbox"; curl -s $B/workspace/today -H "Authorization: Bearer $NT" | j '(len(d["today"]), d["clashes"])'; curl -s $B/workspace/inbox -H "Authorization: Bearer $NT" | j 'd["needsReply"]'
