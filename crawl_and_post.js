const express = require('express');
const bodyParser = require('body-parser');
const req = require('request-promise');
const JSDOM = require("jsdom").JSDOM;
const $ = require('jquery');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.post('/get_thread', function (req, res) {
    let url = req.body.url;
    console.log(req.body);
    if (!url)
        res.json({err: 'no_url'});
    crawl_thread(url).then(thread => {
        res.json(thread);
    });
});

app.listen(14435, function () {
console.log('Listening on port 14435!')
})

function crawl_thread(url) {
    return req({
        method: 'GET',
        uri: url,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.81 Safari/537.36',
            'Accept': '*/*'
        }
    })
    .then(parsedBody => {
        let dom = new JSDOM(parsedBody);
        let document = dom.window.document;
        let thread = {};
        thread.title = document.querySelector('h1.ts').textContent.replace(/\n/g, '');
        console.log('thread.title: ', thread.title);
        let authors = Array.from(document.querySelectorAll('.pls.favatar .pi .authi a.xw1')).map(a => a.textContent);
        thread.author = authors.shift();
        console.log('thread.author: ', thread.author);
        let contents = Array.from(document.querySelectorAll('.t_f')).map(a => a.textContent);
        thread.content = contents.shift();
        console.log('thread.content: ', thread.content);
        thread.replies = authors.map((a, i) => ({author: a, content: contents[i]}));
        console.log('thread: ', JSON.stringify(thread));
        return thread;
    });
}