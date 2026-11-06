import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await fs.readFile('app/content.ts','utf8');
const js={code:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
const {lessons,lessonCategories,featuredLessonIds,pairMissions,dailyNudges}=await import('data:text/javascript;base64,'+Buffer.from(js.code).toString('base64'));
assert.equal(lessons.length,24);assert.equal(new Set(lessons.map(l=>l.id)).size,24);
assert.equal(lessons.reduce((n,l)=>n+l.phrases.length,0),120);
assert.ok(lessons.filter(l=>l.category!=='In viaggio').length>=18);
for(const l of lessons){assert.ok(lessonCategories.includes(l.category),l.id);assert.equal(l.phrases.length,5);assert.equal(l.dialogue.length,4);for(const q of [l.listen,l.choice]){assert.equal(q.options.length,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.why.length>20)}assert.ok(l.gap.includes('___'));assert.ok(l.gapAnswer.trim());assert.ok(l.order.trim());assert.ok(l.speakModel.trim())}
for(const id of ['start','airport','hotel','food','directions','transport','shopping','plans','smalltalk','problem','health','story',...featuredLessonIds,...dailyNudges.map(n=>n.lesson)])assert.ok(lessons.some(l=>l.id===id),id);
assert.equal(pairMissions.length,8);assert.ok(pairMissions.every(m=>m.question&&m.model&&m.role));assert.equal(dailyNudges.length,7);
console.log('PASS: 24 unique lessons, 120 phrases, 8 categories, 8 pair missions, original lesson IDs, notification lesson links and exercise structure.');
