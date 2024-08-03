const DB = require("./DB");
const fs = require('node:fs');
const { getAudioDurationInSeconds } = require('get-audio-duration')

function getDuration(path) {
    return new Promise(function (resolve, reject) {
        getAudioDurationInSeconds(path).then((duration) => {
            resolve(Math.ceil(duration));
        })
    })
}
async function main() {
    try {
        // rhythm DB 삭제.
        await DB.queryPromise('DROP DATABASE rhythm', false);
        // rhythm DB가 있는지 확인. 없다면 생성
        await DB.queryPromise('CREATE DATABASE IF NOT EXISTS rhythm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', false);

        // rhythm DB로 사용 변경
        await DB.useRhythmDB();

        // songs table이 있는지 확인. 없다면 생성
        await DB.queryPromise(
            'CREATE TABLE IF NOT EXISTS songs ( '
            + 'id INT NOT NULL AUTO_INCREMENT, '
            + 'songName VARCHAR(200) NOT NULL, '
            + 'bg VARCHAR(50) NOT NULL, '
            + 'Audio VARCHAR(50) NOT NULL, '
            + 'duration INT NOT NULL, '
            + 'tags VARCHAR(100), '
            + 'youtubeId VARCHAR(20), '
            + 'PRIMARY KEY(id)'
            + ');'
            , false);

        // beatmap table이 있는지 확인. 없다면 생성
        await DB.queryPromise(
            'CREATE TABLE IF NOT EXISTS beatmap ( '
            + 'id INT NOT NULL AUTO_INCREMENT, '
            + 'songId INT NOT NULL, '
            + 'beatmapName VARCHAR(200) NOT NULL, '
            + 'level FLOAT NOT NULL, '
            + 'keySize INT NOT NULL, '
            + 'PRIMARY KEY(id)'
            + ');'
            , false);

        // 디렉토리를 읽은 후 table에 정보 추가 해야됨.
        let songList = fs.readdirSync('../songs');
        //디렉토리만 필터
        songList = songList.filter((val) => fs.statSync(`../songs/${val}`).isDirectory());
        // 곡마다 정보를 db에 추가.
        for (let songName of songList) {
            // 곡이 db에 있는지 확인.
            let [rows] = await DB.queryPromise(`select * from songs where songName = "${songName}"`);
            // 곡이 이미 db에 있다면 기존 정보와 비교해 다른 점이 있으면 업데이트 한다.
            // 구지 비교를 해야하나? 음... 비교하는 시간과 새로 넣는 시간이 비슷하지 않을까?
            // 내가 컴퓨터에서 곡을 넣지 않고 웹에서만 한다면 이 기능이 필요하지는 않다. 하지만 이 기능은 필요함.
            // 나중에 넣어도 되긴 함.
            // 태그 기능도 info에 넣어두자.
            if (rows.length != 0) {

            }
            // 곡이 db에 없다면 새로 정보 저장
            else {
                //info.txt에서 정보를 읽어 db에 저장
                if (fs.existsSync(`../songs/${songName}/info.txt`)) {
                    let info = fs.readFileSync(`../songs/${songName}/info.txt`, { encoding: 'utf8' });
                    info = JSON.parse(info);
                    // 곡 지속시간 얻기
                    const duration = await getDuration(`../songs/${songName}/${info.Audio}`);
                    if (info.youtubeId)
                        await DB.queryPromise(`INSERT INTO songs (songName, bg, Audio, duration, youtubeId) VALUES ("${songName}", "${info.bg}", "${info.Audio}", "${duration}", "${info.youtubeId}")`, false);
                    else
                        await DB.queryPromise(`INSERT INTO songs (songName, bg, Audio, duration) VALUES ("${songName}", "${info.bg}", "${info.Audio}", "${duration}")`, false);
                    if (info.tags)
                        await DB.queryPromise(`UPDATE songs SET tags = "${info.tags}" WHERE songName = "${songName}"`);

                    //곡마다 비트맵 추가
                    let songListData = fs.readdirSync(`../songs/${songName}`);
                    songListData = songListData.filter((val) => val.endsWith('.osu'));
                    for (let beatmapName of songListData) {
                        let beatmapFile = fs.readFileSync(`../songs/${songName}/${beatmapName}`, { encoding: 'utf8' });
                        // general의 mode가 3이 아니면 고려하지 않음. 3만 매니아모드이다.
                        let General = beatmapFile.match(/(?<=\[General\])([\s\S]*?)(?=\[Editor\]|\[Metadata\]|\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
                        General = General[0].trim();
                        let temp = {};
                        General.split('\n').forEach((val, index) => {
                            temp[val.split(':')[0].trim()] = val.split(':')[1].trim();
                        })
                        General = temp;
                        if (General.Mode != 3)
                            continue;
                        // osu!mania에서 circlesize는 키 개수를 의미한다. 키 개수를 구함.
                        let Difficulty = beatmapFile.match(/(?<=\[Difficulty\])([\s\S]*?)(?=\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
                        Difficulty = Difficulty[0].trim();
                        temp = {};
                        Difficulty.split('\n').forEach((val, index) => {
                            temp[val.split(':')[0].trim()] = val.split(':')[1].trim();
                        })
                        Difficulty = temp;
                        let keySize = Difficulty.CircleSize;
                        // 비트맵마다 level 계산: hitobject수/duration 소수점 2째 자리까지
                        let HitObjects = beatmapFile.match(/(?<=\[HitObjects\])([\s\S]*)/);
                        HitObjects = HitObjects[0].trim();
                        const level = (HitObjects.match(/\n/g).length / duration).toFixed(2);
                        // 키 개수와 HitObjects의 종류 개수가 일치하는지 확인한다.
                        temp = {};
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
                        if (Object.keys(temp).length != keySize) {
                            console.log(`${Object.keys(temp).length}와 ${keySize}가 일치하지 않습니다.`);
                            continue;
                        }
                        // db에 삽입
                        await DB.queryPromise(`INSERT INTO beatmap (songId, beatmapName, level, keySize) VALUES ((select id from songs where songName = "${songName}"), "${beatmapName}", ${level}, ${keySize})`, false);
                    }
                }
                else {
                    console.error(`${songName}/info.txt가 존재하지 않습니다.`);
                }
            }
        }

        DB.end();
    }
    catch (err) {
        if (err instanceof Error) {
            console.log('error:', err);
        }
        DB.end();
    }
}
main();