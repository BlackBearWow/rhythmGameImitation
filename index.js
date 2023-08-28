//index.js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('node:fs');

app.use(express.json());
app.use(express.urlencoded());
//위 2개를 추가해야 post body가 제대로 읽힌다.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
    //디렉토리를 읽은 후 리듬게임 리스트를 전송함.
    const songList = fs.readdirSync('./songs');
    //디렉토리만 전송한다.
    res.render('index', {songList:songList.filter((val)=>fs.statSync(`./songs/${val}`).isDirectory())});
});

app.get('/getSongListDataByName/:name', (req, res)=>{
    const name = req.params.name;
    const songListData = fs.readdirSync(`./songs/${name}`);
    //console.log(songListData.filter((val)=>val.endsWith('.osu')));
    res.send(songListData.filter((val)=>val.endsWith('.osu')));
});

app.get('/song/:songName/:fileName', (req, res)=>{
    res.render('song');
});

app.get('/getFileData/:songName/:fileName', (req, res)=>{
    const songName = req.params.songName;
    const fileName = req.params.fileName;
    const data = fs.readFileSync(`./songs/${songName}/${fileName}`, {encoding:'utf8'});
    res.send(data);
})

server.listen(10101, () => {
    console.log('listening on *:10101');
});