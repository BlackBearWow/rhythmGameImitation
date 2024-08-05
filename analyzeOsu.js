function analyseOsuData(data) {
    let General = data.match(/(?<=\[General\])([\s\S]*?)(?=\[Editor\]|\[Metadata\]|\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
    General = analyseGeneral(General);
    let Editor = data.match(/(?<=\[Editor\])([\s\S]*?)(?=\[Metadata\]|\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
    Editor = analyseEditor(Editor);
    let Metadata = data.match(/(?<=\[Metadata\])([\s\S]*?)(?=\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
    Metadata = analyseMetadata(Metadata);
    let Difficulty = data.match(/(?<=\[Difficulty\])([\s\S]*?)(?=\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
    Difficulty = analyseDifficulty(Difficulty);
    let Events = data.match(/(?<=\[Events\])([\s\S]*?)(?=\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
    Events = analyseEvents(Events);
    let TimingPoints = data.match(/(?<=\[TimingPoints\])([\s\S]*?)(?=\[Colours\]|\[HitObjects\])/);
    TimingPoints = analyseTimingPoints(TimingPoints);
    let Colours = data.match(/(?<=\[Colours\])([\s\S]*?)(?=\[HitObjects\])/);
    Colours = analyseColours(Colours);
    let HitObjects = data.match(/(?<=\[HitObjects\])([\s\S]*)/);
    HitObjects = analyseHitObjects(HitObjects);
    return {General, Editor, Metadata, Difficulty, Events, TimingPoints, Colours, HitObjects};
}
function analyseGeneral(General) {
    if (General) {
        General = General[0].trim();
        let temp = {};
        General.split('\n').forEach((val, index) => {
            temp[val.split(':')[0].trim()] = val.substr(val.indexOf(':')+1).trim();
        })
        General = temp;
        return General;
    }
}
function analyseEditor(Editor) {
    if (Editor) {
        Editor = Editor[0].trim();
        let temp = {};
        Editor.split('\n').forEach((val, index) => {
            temp[val.split(':')[0].trim()] = val.substr(val.indexOf(':')+1).trim();
        })
        Editor = temp;
        return Editor;
    }
}
function analyseMetadata(Metadata) {
    if (Metadata) {
        Metadata = Metadata[0].trim();
        let temp = {};
        Metadata.split('\n').forEach((val, index) => {
            temp[val.split(':')[0].trim()] = val.substr(val.indexOf(':')+1).trim();
        })
        Metadata = temp;
        return Metadata;
    }
}
function analyseDifficulty(Difficulty) {
    if (Difficulty) {
        Difficulty = Difficulty[0].trim();
        let temp = {};
        Difficulty.split('\n').forEach((val, index) => {
            temp[val.split(':')[0].trim()] = val.substr(val.indexOf(':')+1).trim();
        })
        Difficulty = temp;
        return Difficulty;
    }
}
function analyseEvents(Events) {
    if (Events) {
        Events = Events[0].trim();
        let temp = {};
        Events.match(/\/\/[^\/]+/g).forEach((val, index) => {
            if (val.split('\r\n')[2])
                temp[val.split('\r\n')[0].replaceAll('/', '')] = [val.split('\r\n')[1], val.split('\r\n')[2]];
            else
                temp[val.split('\r\n')[0].replaceAll('/', '')] = val.split('\r\n')[1];
        })
        Events = temp;
        return Events;
    }
}
function analyseTimingPoints(TimingPoints) {
    if (TimingPoints) {
        TimingPoints = TimingPoints[0].trim();
        return TimingPoints;
    }
}
function analyseColours(Colours) {
    if (Colours) {
        Colours = Colours[0].trim();
        return Colours;
    }
}
function analyseHitObjects(HitObjects) {
    if (HitObjects) {
        HitObjects = HitObjects[0].trim();
        let temp = {};
        HitObjects.split('\n').forEach((val, index) => {
            if (!temp[val.split(',')[0]])
                temp[val.split(',')[0]] = [];
            if (/[0-9]+:[0-9]+:[0-9]+:[0-9]+:[0-9]+:/.test(val.split(',')[5])) {
                //hold 타입
                temp[val.split(',')[0]].push([val.split(',')[2], val.split(',')[5].match(/[^:]+/)[0]]);
            }
            else {
                //normal 타입
                temp[val.split(',')[0]].push([val.split(',')[2], 0]);
            }
        })
        HitObjects = temp;
        return HitObjects;
    }
}

module.exports = {analyseOsuData}