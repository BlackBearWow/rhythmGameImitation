const DB = require("./DB");
const AO = require("../analyzeOsu");
const fs = require('node:fs');
const { getAudioDurationInSeconds } = require('get-audio-duration');

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
            + 'backgroundImage VARCHAR(50) NOT NULL, '
            + 'AudioFilename VARCHAR(50) NOT NULL, '
            + 'duration INT NOT NULL, '
            + 'Tags VARCHAR(1000), '
            + 'youtubeVideoId VARCHAR(20), '
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
            // 곡이 db에 없다면 새로 정보 저장
            if (rows.length == 0) {
                // 해당 디렉토리의 첫번째 .osu파일을 읽어
                const fileList = fs.readdirSync(`../songs/${songName}`);
                const firstOsuFile = fileList.find((val) => val.endsWith(".osu"));
                let firstOsuFileData = fs.readFileSync(`../songs/${songName}/${firstOsuFile}`, { encoding: 'utf8' });
                // AudioFilename, backgroundImage, duration, Tags를 알아냄.
                firstOsuFileData = AO.analyseOsuData(firstOsuFileData);
                const AudioFilename = firstOsuFileData.General.AudioFilename;
                const duration = await getDuration(`../songs/${songName}/${AudioFilename}`);
                let backgroundImage;
                if (typeof (firstOsuFileData.Events['Background and Video events']) == "string") {
                    backgroundImage = firstOsuFileData.Events['Background and Video events'].match(/(?<=")[^"]+/)[0];
                }
                else {
                    if (firstOsuFileData.Events['Background and Video events'][0].startsWith("0,")) {
                        //0번째 index가 배경이미지일경우
                        backgroundImage = firstOsuFileData.Events['Background and Video events'][0].match(/(?<=")[^"]+/)[0];
                    }
                    else {
                        //1번째 index가 배경이미지일경우
                        backgroundImage = firstOsuFileData.Events['Background and Video events'][1].match(/(?<=")[^"]+/)[0];
                    }
                }
                //최대 990글자
                const Tags = firstOsuFileData.Metadata.Tags.substr(0, 990);
                // youtubeVideoId.txt에서 youtubeVideoId를 알아냄.
                let youtubeVideoId = "";
                if (fs.existsSync(`../songs/${songName}/youtubeVideoId.txt`)) {
                    youtubeVideoId = fs.readFileSync(`../songs/${songName}/youtubeVideoId.txt`, { encoding: 'utf8' });
                }
                // db에 insert한다.
                await DB.queryPromise(`INSERT INTO songs (songName, backgroundImage, AudioFilename, duration, Tags, youtubeVideoId) VALUES ("${songName}", "${backgroundImage}", "${AudioFilename}", "${duration}", "${Tags}", "${youtubeVideoId}")`, false);
                //곡마다 비트맵 추가
                let songListData = fs.readdirSync(`../songs/${songName}`);
                songListData = songListData.filter((val) => val.endsWith('.osu'));
                for (let beatmapName of songListData) {
                    let beatmapFileData = fs.readFileSync(`../songs/${songName}/${beatmapName}`, { encoding: 'utf8' });
                    beatmapFileData = AO.analyseOsuData(beatmapFileData);
                    // general의 mode가 3이 아니면 고려하지 않음. 3만 매니아모드이다.
                    if (beatmapFileData.General.Mode != 3)
                        continue;
                    // osu!mania에서 circlesize는 키 개수를 의미한다. 키 개수를 구함.
                    const keySize = beatmapFileData.Difficulty.CircleSize;
                    // 비트맵마다 level 계산: hitobject수/duration 소수점 2째 자리까지
                    // 쳐야하는 노트 개수 / 시간초로 계산했다.
                    let HitObjectsCount = 0;
                    Object.values(beatmapFileData.HitObjects).forEach((val)=>HitObjectsCount+=val.length);
                    const level = (HitObjectsCount / duration).toFixed(2);
                    // 키 개수와 HitObjects의 종류 개수가 일치하는지 확인한다.
                    if (Object.keys(beatmapFileData.HitObjects).length != keySize) {
                        console.log(`${Object.keys(beatmapFileData.HitObjects).length}와 ${keySize}가 일치하지 않습니다.`);
                        continue;
                    }
                    // db에 삽입
                    await DB.queryPromise(`INSERT INTO beatmap (songId, beatmapName, level, keySize) VALUES ((select id from songs where songName = "${songName}"), "${beatmapName}", ${level}, ${keySize})`, false);
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