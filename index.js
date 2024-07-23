//index.js
const express = require('express');
const session = require('express-session');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('node:fs');
const DB = require("./db/DB");

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

app.get('/getAllSongs', async(req, res)=>{
    let [songs] = await DB.queryPromise(`select * from songs;`);
    let [bitmap] = await DB.queryPromise(`select * from bitmap;`);
    res.send({songs, bitmap});
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/configuration', (req, res) => {
    res.render('configuration');
});

app.get('/songList', (req, res) => {
    //디렉토리를 읽은 후 리듬게임 리스트를 전송함.
    let songList = fs.readdirSync('./songs');
    //디렉토리만 필터
    songList = songList.filter((val) => fs.statSync(`./songs/${val}`).isDirectory());
    songList.forEach((val, index) => {
        songList[index] = { name: songList[index], bg: undefined };
        if (fs.existsSync(`./songs/${val}/info.txt`)) {
            let info = fs.readFileSync(`./songs/${val}/info.txt`, { encoding: 'utf8' });
            songList[index].bg = JSON.parse(info).bg;
        }
    })
    res.render('songList', { songList });
});

app.get('/getSongListDataByName/:name', (req, res) => {
    const name = req.params.name;
    const songListData = fs.readdirSync(`./songs/${name}`);
    res.send(songListData.filter((val) => val.endsWith('.osu')));
});

app.get('/playRhythmGame/:songId/:bitmapId', (req, res) => {
    res.render('playRhythmGame');
});

app.get('/getFileData/:songName/:fileName', (req, res) => {
    const songName = req.params.songName;
    const fileName = req.params.fileName;
    const data = fs.readFileSync(`./songs/${songName}/${fileName}`, { encoding: 'utf8' });
    res.send({data});
});

server.listen(10101, () => {
    console.log('listening on *:10101');
});