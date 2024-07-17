const DB = require("./DB");
const fs = require('node:fs');
const { getAudioDurationInSeconds } = require('get-audio-duration')

function getDuration(path) {
    return new Promise(function (resolve, reject){
        getAudioDurationInSeconds(path).then((duration) => {
            resolve(Math.ceil(duration));
        })
    })
}
async function main() {
    try {
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

        // bitmap table이 있는지 확인. 없다면 생성
        await DB.queryPromise(
            'CREATE TABLE IF NOT EXISTS bitmap ( '
            + 'id INT NOT NULL AUTO_INCREMENT, '
            + 'songId INT NOT NULL, '
            + 'bitmapName VARCHAR(200) NOT NULL, '
            + 'level FLOAT, '
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
                    for (let bitmapName of songListData) {
                        // 비트맵마다 level 계산: hitobject수/duration 소수점 3째 자리까지
                        let bitmapFile = fs.readFileSync(`../songs/${songName}/${bitmapName}`, {encoding: 'utf8'});
                        let HitObjects = bitmapFile.match(/(?<=\[HitObjects\])([\s\S]*)/);
                        HitObjects = HitObjects[0].trim();
                        const level = (HitObjects.match(/\n/g).length/duration).toFixed(3);
                        await DB.queryPromise(`INSERT INTO bitmap (songId, bitmapName, level) VALUES ((select id from songs where songName = "${songName}"), "${bitmapName}", ${level})`, false);
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