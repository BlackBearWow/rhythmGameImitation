const fs = require('fs');
const axios = require('axios');

const url = 'https://api.nerinyan.moe/d/444632';
const outputPath = './hello';

axios({
    method: 'get',
    url: url,
    responseType: 'stream',
})
    .then(response => {
        console.log(response.headers);
        console.log(response.headers['content-disposition'].match(/(?<=")[\s\S]+(?=")/)[0]);
        // const writer = fs.createWriteStream(outputPath);
        // response.data.pipe(writer);

        // writer.on('finish', () => console.log('Download Completed'));
        // writer.on('error', err => console.log('Download Failed', err));
    })
    .catch(err => console.error('Request Failed', err));
