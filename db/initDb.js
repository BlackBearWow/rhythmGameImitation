const DB = require("./DB");

// rhythm DB가 있는지 확인. 없다면 생성
DB.query('CREATE DATABASE IF NOT EXISTS rhythm DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', false);

// rhythm DB로 사용 변경
DB.useRhythmDB();

// songs table이 있는지 확인. 없다면 생성
DB.query(
'CREATE TABLE IF NOT EXISTS songs ( '
    +'id INT NOT NULL AUTO_INCREMENT, '
    +'songName VARCHAR(100) NOT NULL, '
    +'PRIMARY KEY(id)'
+');'
, false);

// bitmap table이 있는지 확인. 없다면 생성
DB.query(
'CREATE TABLE IF NOT EXISTS bitmap ( '
    +'id INT NOT NULL AUTO_INCREMENT, '
    +'songId INT NOT NULL, '
    +'bitmapName VARCHAR(100) NOT NULL, '
    +'bitmapStar VARCHAR(100) NOT NULL, '
    +'PRIMARY KEY(id)'
+');'
, false);

// 디렉토리를 읽은 후 table에 정보 추가 해야됨.

DB.end();
console.log("initDB end");