const mysql = require("mysql2");

// rhythm DB가 없을수도 있으므로 mysqldb에 접속
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'onlyroot',
    database: 'mysql'
});
connection.addListener('error', (err)=>console.log(err));

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
    query('use rhythm;', false);
}
function end() {
    connection.end();
}

module.exports = {query, useRhythmDB, end};