//index.js
const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('node:fs');
const DB = require("./db/DB");
const axios = require('axios');
const AdmZip = require("adm-zip");
const AO = require("./analyzeOsu");
const { getAudioDurationInSeconds } = require('get-audio-duration');

function getDuration(path) {
    return new Promise(function (resolve, reject) {
        getAudioDurationInSeconds(path).then((duration) => {
            resolve(Math.ceil(duration));
        })
    })
}

DB.useRhythmDB();
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: 'none', // SameSite 설정
        secure: true,     // HTTPS를 사용할 경우 true로 설정
    },
}));
app.use(express.json());
app.use(express.urlencoded());
//위 2개를 추가해야 post body가 제대로 읽힌다.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Function to serve static files
app.use('/songs', express.static('songs'));
app.use('/hitNormal', express.static('hitNormal'));

app.get('/getAllSongs', async (req, res) => {
    let [songs] = await DB.queryPromise(`select * from songs;`);
    let [beatmap] = await DB.queryPromise(`select * from beatmap;`);
    res.send({ songs, beatmap });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/playRhythmGame/:songId/:beatmapId', (req, res) => {
    res.render('playRhythmGame');
});

app.get('/getFileData/:songName/:fileName', (req, res) => {
    const songName = req.params.songName;
    const fileName = req.params.fileName;
    const data = fs.readFileSync(`./songs/${songName}/${fileName}`, { encoding: 'utf8' });
    res.send({ data });
});

app.get('/addSong/:num', (req, res) => {
    const num = req.params.num;
    if (num.search(/^[0-9]+$/) == -1) {
        res.send("유효하지 않은 링크입니다.");
    }
    else {
        //다운로드한다. https://nerinyan.moe/d/444632
        axios({
            method: 'get',
            url: `https://api.nerinyan.moe/d/${num}`,
            responseType: 'stream',
        }).then(response => {
            // 성공한다면 적절한 디렉토리에 데이터를 받는다.
            const songName = response.headers['content-disposition'].match(/(?<=")[\s\S]+(?=.osz)/)[0];
            if (fs.existsSync(`./songs/${songName}`)) {
                res.send("이미 있는 노래입니다");
                return;
            }
            const writer = fs.createWriteStream(`./songs/${songName}.zip`);
            response.data.pipe(writer);
            writer.on('finish', async() => {
                //압축을 푼다.
                const zip = new AdmZip(`./songs/${songName}.zip`);
                zip.extractAllTo(`./songs/${songName}`);
                fs.unlinkSync(`./songs/${songName}.zip`);
                // 해당 디렉토리의 .osu파일을 하나 읽어 분석한다.
                const fileList = fs.readdirSync(`./songs/${songName}`);
                const firstOsuFile = fileList.find((val) => val.endsWith(".osu"));
                let firstOsuFileData = fs.readFileSync(`./songs/${songName}/${firstOsuFile}`, { encoding: 'utf8' });
                firstOsuFileData = AO.analyseOsuData(firstOsuFileData);
                // General의 AudioFilename를 알아냄.
                const AudioFilename = firstOsuFileData.General.AudioFilename;
                // Events의 배경화면을 알아냄.
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
                // AudioFilename, backgroundImage, Mode==3인.osu파일을 제외한 파일들을 삭제한다.
                fileList.forEach((val) => {
                    if (val.endsWith(".osu")) {
                        //mode == 3이 아니라면 파일 삭제
                        let beatmapFileData = fs.readFileSync(`./songs/${songName}/${val}`, { encoding: 'utf8' });
                        beatmapFileData = AO.analyseOsuData(beatmapFileData);
                        if (beatmapFileData.General.Mode != 3) {
                            fs.unlinkSync(`./songs/${songName}/${val}`);
                        }
                    }
                    else {
                        //AudioFilename, bg가 아니라면 파일 삭제
                        if (val != AudioFilename && val != backgroundImage) {
                            fs.unlinkSync(`./songs/${songName}/${val}`);
                        }
                    }
                })
                //youtubeVideoId.txt 생성
                fs.writeFileSync(`./songs/${songName}/youtubeVideoId.txt`, "");
                //db에 저장. Tags는 최대 990글자.
                const Tags = firstOsuFileData.Metadata.Tags.substr(0, 990);
                const duration = await getDuration(`./songs/${songName}/${AudioFilename}`);
                // db에 insert한다.
                await DB.queryPromise(`INSERT INTO songs (songName, backgroundImage, AudioFilename, duration, Tags, youtubeVideoId) VALUES ("${songName}", "${backgroundImage}", "${AudioFilename}", "${duration}", "${Tags}", "")`, false);
                //곡마다 비트맵 추가
                let songListData = fs.readdirSync(`./songs/${songName}`);
                songListData = songListData.filter((val) => val.endsWith('.osu'));
                for (let beatmapName of songListData) {
                    let beatmapFileData = fs.readFileSync(`./songs/${songName}/${beatmapName}`, { encoding: 'utf8' });
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
                res.send("다운로드 성공");
            });
            writer.on('error', err => {
                res.send("다운로드를 실패했습니다.");
            });
        }).catch(err => {
            res.send(`다운로드 서버 연결에 실패하였습니다.\n status code: ${err.response.status}\n ststusText: ${err.response.statusText}`);
        });
    }
})

app.get('/applyYoutubeVideoId/:songName/:youtubeVideoId', async(req, res) => {
    const songName = req.params.songName;
    const youtubeVideoId = req.params.youtubeVideoId;
    fs.writeFileSync(`./songs/${songName}/youtubeVideoId.txt`, youtubeVideoId);
    await DB.queryPromise(`UPDATE songs SET youtubeVideoId = "${youtubeVideoId}" WHERE songName = "${songName}"`);
    res.send("적용에 성공했습니다. 곡 가져오기/최신화를 해주세요");
})

server.listen(10101, () => {
    console.log('listening on *:10101');
});