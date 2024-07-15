const mysql = require("mysql2");

// rhythm DB가 없을수도 있으므로 mysqldb에 접속
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'onlyroot',
    database: 'mysql'
});
connection.addListener('error', (err)=>console.log(err));

// rhythm DB가 있는지 확인하는 과정.
connection.query(
    'CREATE DATABASE IF NOT EXISTS rhythm;',
    function(err, result, fields) {
        console.log(result);
    }
);

connection.query(
    'use rhythm;',
    function(err, result, fields) {
        console.log(result);
    }
);

connection.query(
    'show tables;',
    function(err, result, fields) {
        console.log(result);
    }
);
// query를 할 db를 만들자. query(sql, resultShowFlag)으로.
connection.end();