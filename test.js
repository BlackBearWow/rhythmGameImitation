const fs = require('fs');
const AO = require('./analyzeOsu');

let data = fs.readFileSync('./songs/2007371 FIFTY FIFTY - Cupid/FIFTY FIFTY - Cupid (homwu) [Easy].osu', { encoding: 'utf8' });
data = AO.analyseOsuData(data);

console.log(data);