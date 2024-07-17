const mysql = require("mysql2");

// rhythm DB가 없을수도 있으므로 mysqldb에 접속
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'onlyroot',
    database: 'mysql'
});
connection.addListener('error', (err)=>console.log(err));

function queryPromise(sql='show tables;') {
    return connection.promise().query(sql);
}
function query(sql='show tables;', resultShowFlag=true){
    connection.query(
        sql,
        function(err, result, fields) {
            if(err instanceof Error) {
                console.log("query 에러: ", err);
            }
            if(resultShowFlag)
                console.log(result);
        }
    );
}
function useRhythmDB() {
    return queryPromise('use rhythm;');
}
function end() {
    connection.end();
    console.log(`db connection end`);
}

module.exports = {queryPromise, query, useRhythmDB, end};