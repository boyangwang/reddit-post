"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
/**
 - s1 crawl
  - 请求用对cookie
  + 一个记录所有帖子的list, 读写到flatfile
  + 每天跑6次 (每四个小时), 每次最多6个帖子
  - 看页请求, 第一页帖子列表, 第二页帖子列表, 执行100页
  - 对每个帖子
    + 如果存在在list, 过
    + 如果回复数小于一页, 过
    - 请求该贴
      - 获得: 链接, 作者, 正文, 回复, 作者
    - 加入list
    - post reddit
  - 写list
*/
var fs = require("fs");
var Reddit = require("reddit");
var JSDOM = require("jsdom").JSDOM;
var fetch = require('node-fetch');
var config = require('./config.json');
var THIRTY_MINS = 20 * 60 * 1000;
var COMMENTS_PER_PAGE = 30;
var REDDIT_BASE_URL = 'https://www.reddit.com';
var USER_AGENT = 's1-mirror/1.0';
var CRAWL_THREAD_LIMIT = 1;
var CRAWL_PAGE_LIMIT = 12;
var reddit = new Reddit({
    username: config.user,
    password: config.password,
    appId: config.appId,
    appSecret: config.appSecret,
    userAgent: 'MyApp/1.0.0 (http://example.com)'
});
var Thread = /** @class */ (function () {
    function Thread() {
        this.id = 0;
        this.title = '';
        this.authorName = '';
        this.content = '';
        this.postTimestamp = 0;
        this.comments = [];
    }
    return Thread;
}());
var Comment = /** @class */ (function () {
    function Comment() {
        this.authorName = '';
        this.content = '';
    }
    return Comment;
}());
function readThreadsObj() {
    delete require.cache[require.resolve('./threads.json')];
    var threadsObj = require('./threads.json');
    return threadsObj;
}
function writeThreadsObj(to) {
    fs.writeFileSync('./threads.json', JSON.stringify(to));
}
function getCurPageBasics(pageNum) {
    return __awaiter(this, void 0, void 0, function () {
        var url, forumPage, forumText, dom, document, forumThreads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://bbs.saraba1st.com/2b/forum-75-" + pageNum + ".html";
                    return [4 /*yield*/, fetch(url, {
                            "headers": {
                                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                                "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
                                "cache-control": "no-cache",
                                "pragma": "no-cache",
                                "sec-fetch-dest": "document",
                                "sec-fetch-mode": "navigate",
                                "sec-fetch-site": "same-origin",
                                "sec-fetch-user": "?1",
                                "upgrade-insecure-requests": "1",
                                "cookie": "_uab_collina=158722857536539424028746; __gads=ID=f3d23201db16a343:T=1587228575:S=ALNI_MbLAKtDMpcbCOiPStwQxYF1MG3-_g; UM_distinctid=1718e3207bd99f-0b4815d632de04-396a7f07-1aeaa0-1718e3207bea62; _ga=GA1.2.548514943.1587228575; B7Y9_2132_nofavfid=1; B7Y9_2132_smile=1465D1; B7Y9_2132_visitedfid=75D4; B7Y9_2132_st_t=184145%7C1589295126%7C9d3b4eee2ad26ce1021d4ca92c2f0e9e; B7Y9_2132_forum_lastvisit=D_75_1589295126; B7Y9_2132_viewid=tid_250856; B7Y9_2132_st_p=184145%7C1589298903%7Cdf305ef5e5c9958ef970da6e9b860d42; B7Y9_2132_saltkey=Q9N98w7R; B7Y9_2132_lastvisit=1589882620; B7Y9_2132_sid=a2uxo7; B7Y9_2132_pc_size_c=0; __cfduid=d2b0990d43307754f81cda5b33bb1fc7d1589886220; B7Y9_2132_sendmail=1; CNZZDATA1260281688=1531919761-1587223605-%7C1589883300; _gid=GA1.2.128581470.1589886224; _gat_gtag_UA_141266582_1=1; B7Y9_2132_ulastactivity=8351jEOeYwFA6lnVBn8wuqJEA8jv2h%2Br315f6QdYIOXd09RKfEu1; B7Y9_2132_auth=6d16BlzBsNRH3yrqOyoV6NsI0JVEvKMcuDrqsd0Sm22SolPOIXqFq7QpoFoNzLZwYr8uQ%2BstohfSEi3ujPoFO0v0gOY; B7Y9_2132_lastcheckfeed=230574%7C1589886232; B7Y9_2132_checkfollow=1; B7Y9_2132_lip=223.71.220.14%2C1589886232; B7Y9_2132_yfe_in=1; B7Y9_2132_onlineusernum=38645; B7Y9_2132_myrepeat_rr=R0; B7Y9_2132_lastact=1589886233%09home.php%09spacecp; B7Y9_2132_checkpm=1"
                            },
                            "referrer": "https://bbs.saraba1st.com/2b/forum.php",
                            "referrerPolicy": "no-referrer-when-downgrade",
                            "body": null,
                            "method": "GET",
                            "mode": "cors"
                        })];
                case 1:
                    forumPage = _a.sent();
                    return [4 /*yield*/, forumPage.text()];
                case 2:
                    forumText = _a.sent();
                    dom = new JSDOM(forumText);
                    document = dom.window.document;
                    forumThreads = Array.from(document.querySelectorAll('[id^=normalthread_]'));
                    return [2 /*return*/, forumThreads.map(function (origT) {
                            var t = new Thread();
                            t.id = parseInt(origT.id.split('_')[1]);
                            t.title = origT.querySelector('.s.xst').text;
                            t.authorName = origT.querySelector('td.by cite a').text;
                            t.postTimestamp = +new Date(origT.querySelector('td.by em span').textContent);
                            t.comments = new Array(parseInt(origT.querySelector('.xi2').text));
                            return t;
                        })];
            }
        });
    });
}
function isShouldCrawl(t, totalThreads) {
    if (totalThreads.some(function (someT) { return someT.id === t.id; })) {
        return false;
    }
    if (t.comments.length < COMMENTS_PER_PAGE) {
        return false;
    }
    if (t.title.includes('观测站')) {
        return false;
    }
    return true;
}
function toRedditPostText(t) {
    var result = "\n" + ("https://bbs.saraba1st.com/2b/thread-" + t.id + "-1-1.html") + "\n\n" + new Date(t.postTimestamp).toISOString().substr(0, 19) + "\n\n**\u4F5C\u8005: " + t.authorName + "**\n\n\n" + t.content + "\n\n\n--------------------------------------------------------\n\n--------------------------------------------------------\n\n\n";
    for (var i = 0; i < t.comments.length; i++) {
        result +=
            "\n---\n\u4F5C\u8005: " + t.comments[i].authorName + "\n\n" + t.comments[i].content + "\n\n\n";
    }
    return result;
}
function postReddit(t) {
    return __awaiter(this, void 0, void 0, function () {
        var postResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!t) {
                        console.warn('[postReddit] null thread!');
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, reddit.post('/api/submit', {
                            sr: 'saraba1st',
                            kind: 'self',
                            title: "" + t.title,
                            text: toRedditPostText(t),
                            flair_id: "353168d4-958a-11ea-981b-0e446e54eac1"
                        })];
                case 1:
                    postResult = _a.sent();
                    return [2 /*return*/, postResult];
            }
        });
    });
}
function crawl_thread(t) {
    return __awaiter(this, void 0, void 0, function () {
        var url, threadPage, threadText, dom, document, texts, commentAuthors, comments, i, c;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://bbs.saraba1st.com/2b/thread-" + t.id + "-1-1.html";
                    return [4 /*yield*/, fetch(url, {
                            "headers": {
                                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                                "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
                                "cache-control": "no-cache",
                                "pragma": "no-cache",
                                "sec-fetch-dest": "document",
                                "sec-fetch-mode": "navigate",
                                "sec-fetch-site": "same-origin",
                                "sec-fetch-user": "?1",
                                "upgrade-insecure-requests": "1",
                                "cookie": "_uab_collina=158722857536539424028746; __gads=ID=f3d23201db16a343:T=1587228575:S=ALNI_MbLAKtDMpcbCOiPStwQxYF1MG3-_g; UM_distinctid=1718e3207bd99f-0b4815d632de04-396a7f07-1aeaa0-1718e3207bea62; _ga=GA1.2.548514943.1587228575; B7Y9_2132_nofavfid=1; B7Y9_2132_smile=1465D1; B7Y9_2132_visitedfid=75D4; B7Y9_2132_st_t=184145%7C1589295126%7C9d3b4eee2ad26ce1021d4ca92c2f0e9e; B7Y9_2132_forum_lastvisit=D_75_1589295126; B7Y9_2132_viewid=tid_250856; B7Y9_2132_st_p=184145%7C1589298903%7Cdf305ef5e5c9958ef970da6e9b860d42; B7Y9_2132_saltkey=Q9N98w7R; B7Y9_2132_lastvisit=1589882620; B7Y9_2132_sid=a2uxo7; B7Y9_2132_pc_size_c=0; __cfduid=d2b0990d43307754f81cda5b33bb1fc7d1589886220; B7Y9_2132_sendmail=1; CNZZDATA1260281688=1531919761-1587223605-%7C1589883300; _gid=GA1.2.128581470.1589886224; _gat_gtag_UA_141266582_1=1; B7Y9_2132_ulastactivity=8351jEOeYwFA6lnVBn8wuqJEA8jv2h%2Br315f6QdYIOXd09RKfEu1; B7Y9_2132_auth=6d16BlzBsNRH3yrqOyoV6NsI0JVEvKMcuDrqsd0Sm22SolPOIXqFq7QpoFoNzLZwYr8uQ%2BstohfSEi3ujPoFO0v0gOY; B7Y9_2132_lastcheckfeed=230574%7C1589886232; B7Y9_2132_checkfollow=1; B7Y9_2132_lip=223.71.220.14%2C1589886232; B7Y9_2132_yfe_in=1; B7Y9_2132_onlineusernum=38645; B7Y9_2132_myrepeat_rr=R0; B7Y9_2132_lastact=1589886233%09home.php%09spacecp; B7Y9_2132_checkpm=1"
                            },
                            "referrer": "https://bbs.saraba1st.com/2b/forum-75-1.html",
                            "referrerPolicy": "no-referrer-when-downgrade",
                            "body": null,
                            "method": "GET",
                            "mode": "cors"
                        })];
                case 1:
                    threadPage = _a.sent();
                    return [4 /*yield*/, threadPage.text()];
                case 2:
                    threadText = _a.sent();
                    dom = new JSDOM(threadText);
                    document = dom.window.document;
                    texts = Array.from(document.querySelectorAll('.plhin .plc .pcb'))
                        .map(function (n) { return n.textContent; });
                    t.content = texts[0];
                    commentAuthors = Array.from(document.querySelectorAll('.pi .authi .xw1'))
                        .map(function (n) { return n.textContent; });
                    comments = [];
                    for (i = 1; i < commentAuthors.length; i++) {
                        c = new Comment();
                        c.authorName = commentAuthors[i];
                        c.content = texts[i];
                        comments.push(c);
                    }
                    t.comments = comments;
                    return [2 /*return*/, t];
            }
        });
    });
}
function doCrawl(totalThreads) {
    return __awaiter(this, void 0, void 0, function () {
        var curThreads, pageNum, curPageThreadBasics, _i, curPageThreadBasics_1, tbasic, t, e_1, postResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[scheduler]");
                    curThreads = [];
                    pageNum = 1;
                    _a.label = 1;
                case 1:
                    if (!(pageNum < CRAWL_PAGE_LIMIT)) return [3 /*break*/, 13];
                    return [4 /*yield*/, getCurPageBasics(pageNum)];
                case 2:
                    curPageThreadBasics = _a.sent();
                    _i = 0, curPageThreadBasics_1 = curPageThreadBasics;
                    _a.label = 3;
                case 3:
                    if (!(_i < curPageThreadBasics_1.length)) return [3 /*break*/, 12];
                    tbasic = curPageThreadBasics_1[_i];
                    if (!isShouldCrawl(tbasic, totalThreads)) {
                        console.log("[scheduler] skip", tbasic);
                        return [3 /*break*/, 11];
                    }
                    console.log("[scheduler] starting crawling", tbasic);
                    t = null;
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, crawl_thread(tbasic)];
                case 5:
                    t = _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_1 = _a.sent();
                    console.warn("[scheduler] crawl this thread failed, need check", tbasic, e_1);
                    return [3 /*break*/, 7];
                case 7:
                    if (!t) {
                        return [3 /*break*/, 11];
                    }
                    if (!(process.platform !== "darwin")) return [3 /*break*/, 9];
                    return [4 /*yield*/, postReddit(t)];
                case 8:
                    postResults = _a.sent();
                    console.log("[scheduler] post reddit", postResults);
                    return [3 /*break*/, 10];
                case 9:
                    console.log("[scheduler][dryrun] post reddit", t);
                    _a.label = 10;
                case 10:
                    curThreads.push(t);
                    if (curThreads.length >= CRAWL_THREAD_LIMIT) {
                        return [3 /*break*/, 13];
                    }
                    _a.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 3];
                case 12:
                    pageNum++;
                    return [3 /*break*/, 1];
                case 13:
                    console.log('[scheduler] curLength, totalLength', curThreads.length, totalThreads.length);
                    totalThreads = totalThreads.concat(curThreads.map(function (t) { return { id: t.id }; }));
                    writeThreadsObj({ threads: totalThreads });
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tobj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(process.platform === 'darwin')) return [3 /*break*/, 2];
                    tobj = readThreadsObj();
                    return [4 /*yield*/, doCrawl(tobj.threads)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    setInterval(function () {
                        var tobj = readThreadsObj();
                        doCrawl(tobj.threads);
                    }, THIRTY_MINS);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function test() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
// test();
main();
//# sourceMappingURL=index.js.map