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
            const songName = response.headers['content-disposition'].match(/(?<=")[\s\S]+(?=.osz)/)[0];
            if (fs.existsSync(`./songs/${songName}`)) {
                res.send("이미 있는 노래입니다");
                return;
            }
            const writer = fs.createWriteStream(`./songs/${songName}.zip`);
            response.data.pipe(writer);
            writer.on('finish', () => {
                //압축을 푼다.
                const zip = new AdmZip(`./songs/${songName}.zip`);
                zip.extractAllTo(`./songs/${songName}`);
                fs.unlinkSync(`./songs/${songName}.zip`);
                // 해당 디렉토리의 .osu파일을 하나 읽어 audio, bg를 알아내고
                let fileList = fs.readdirSync(`./songs/${songName}`);
                const firstOsuFile = fileList.find((val) => val.endsWith(".osu"));
                let fileData = fs.readFileSync(`./songs/${songName}/${firstOsuFile}`, { encoding: 'utf8' });
                // General의 audio를 알아냄.
                let General = fileData.match(/(?<=\[General\])([\s\S]*?)(?=\[Editor\]|\[Metadata\]|\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
                General = General[0].trim();
                let temp = {};
                General.split('\n').forEach((val, index) => {
                    temp[val.split(':')[0].trim()] = val.split(':')[1].trim();
                })
                General = temp;
                const AudioFilename = General.AudioFilename;
                // Events의 배경화면을 알아냄.
                Events = fileData.match(/(?<=\[Events\])([\s\S]*?)(?=\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
                Events = Events[0].trim();
                temp = {};
                Events.match(/\/\/[^\/]+/g).forEach((val, index) => {
                    if (val.split('\r\n')[2])
                        temp[val.split('\r\n')[0].replaceAll('/', '')] = [val.split('\r\n')[1], val.split('\r\n')[2]];
                    else
                        temp[val.split('\r\n')[0].replaceAll('/', '')] = val.split('\r\n')[1];
                })
                Events = temp;
                let backgroundImage;
                if (typeof (Events['Background and Video events']) == "string") {
                    backgroundImage = Events['Background and Video events'].match(/(?<=")[^"]+/)[0];
                }
                else {
                    if (Events['Background and Video events'][0].startsWith("0,")) {
                        //0번째 index가 배경이미지일경우
                        backgroundImage = Events['Background and Video events'][0].match(/(?<=")[^"]+/)[0];
                    }
                    else {
                        //1번째 index가 배경이미지일경우
                        backgroundImage = Events['Background and Video events'][1].match(/(?<=")[^"]+/)[0];
                    }
                }
                // audio, bg, mode==3인.osu파일을 제외한 파일들을 삭제한다.
                fileList.forEach((val) => {
                    if (val.endsWith(".osu")) {
                        //mode == 3이 아니라면 파일 삭제
                        let fileData = fs.readFileSync(`./songs/${songName}/${val}`, { encoding: 'utf8' });
                        let General = fileData.match(/(?<=\[General\])([\s\S]*?)(?=\[Editor\]|\[Metadata\]|\[Difficulty\]|\[Events\]|\[TimingPoints\]|\[Colours\]|\[HitObjects\])/);
                        General = General[0].trim();
                        let temp = {};
                        General.split('\n').forEach((val, index) => {
                            temp[val.split(':')[0].trim()] = val.split(':')[1].trim();
                        })
                        General = temp;
                        if(General.Mode != 3) {
                            fs.unlinkSync(`./songs/${songName}/${val}`);
                        }
                    }
                    else {
                        //audio, bg가 아니라면 파일 삭제
                        if(val != AudioFilename && val != backgroundImage) {
                            fs.unlinkSync(`./songs/${songName}/${val}`);
                        }
                    }
                })
                //info.txt 생성
                const infoData = {
                    "Audio":AudioFilename,
                    "bg":backgroundImage,
                    "youtubeId":""
                }
                fs.writeFileSync(`./songs/${songName}/info.txt`, JSON.stringify(infoData));
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

server.listen(10101, () => {
    console.log('listening on *:10101');
});