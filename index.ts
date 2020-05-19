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
import * as fs from "fs";
import * as Reddit from 'reddit';
const JSDOM = require("jsdom").JSDOM;
const fetch = require('node-fetch');
const config = require('./config.json');

const THIRTY_MINS = 20 * 60 * 1000;
const COMMENTS_PER_PAGE = 30;
const REDDIT_BASE_URL = 'https://www.reddit.com';
const USER_AGENT = 's1-mirror/1.0';
const CRAWL_THREAD_LIMIT = 1;
const CRAWL_PAGE_LIMIT = 12;

const reddit = new Reddit({
  username: config.user,
  password: config.password,
  appId: config.appId,
  appSecret: config.appSecret,
  userAgent: 'MyApp/1.0.0 (http://example.com)'
});

class Thread {
  id: number = 0
  title: String = ''
  authorName: String = ''
  content: String = ''
  postTimestamp: number = 0
  comments: Comment[] = []
}

class Comment {
  authorName: String = ''
  content: String = ''
}

interface ThreadsObj {
  threads: Thread[]
}

function readThreadsObj() {
  delete require.cache[require.resolve('./threads.json')];
  const threadsObj: ThreadsObj = require('./threads.json');
  return threadsObj;
}

function writeThreadsObj(to: ThreadsObj) {
  fs.writeFileSync('./threads.json', JSON.stringify(to));
}

async function getCurPageBasics(pageNum: number) {
  let url = `https://bbs.saraba1st.com/2b/forum-75-${pageNum}.html`;
  let forumPage: Response = await fetch(url, {
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
  });
  let forumText = await forumPage.text();
  // console.log('[getCurPageIds] forumPage', forumPage, forumText);
  let dom = new JSDOM(forumText);
  let document = dom.window.document;
  let forumThreads = Array.from(document.querySelectorAll('[id^=normalthread_]'))
  return forumThreads.map((origT: any): Thread => {
    let t = new Thread();
    t.id = parseInt((origT.id as String).split('_')[1]);
    t.title = origT.querySelector('.s.xst').text;
    t.authorName = origT.querySelector('td.by cite a').text;
    t.postTimestamp = +new Date(origT.querySelector('td.by em span').textContent);
    t.comments = new Array(parseInt((origT.querySelector('.xi2') as any).text));
    return t;
  });
}

function isShouldCrawl(t: Thread, totalThreads: Thread[]) {
  if (totalThreads.some(someT => someT.id === t.id)) {
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

function toRedditPostText(t: Thread): String {
  let result = 
`
${`https://bbs.saraba1st.com/2b/thread-${t.id}-1-1.html`}

${new Date(t.postTimestamp).toISOString().substr(0, 19)}

**作者: ${t.authorName}**


${t.content}


--------------------------------------------------------

--------------------------------------------------------


`;
  for (let i=0; i<t.comments.length; i++) {
    result +=
`
---
作者: ${t.comments[i].authorName}

${t.comments[i].content}


`;
  }
  return result;
}

async function postReddit(t: Thread | null) {
  if (!t) {
    console.warn('[postReddit] null thread!');
    return null;
  }
  let postResult = await reddit.post('/api/submit', {
    sr: 'saraba1st',
    kind: 'self',
    title: `${t.title}`,
    text: toRedditPostText(t),
    flair_id: "353168d4-958a-11ea-981b-0e446e54eac1"
  });
  return postResult;
}

async function crawl_thread(t: Thread) {
  let url = `https://bbs.saraba1st.com/2b/thread-${t.id}-1-1.html`;
  let threadPage: Response = await fetch(url, {
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
  });
  let threadText = await threadPage.text();
  // console.log('[crawl_thread] threadPage', threadPage, threadText);
  let dom = new JSDOM(threadText);
  let document = dom.window.document;
  let texts = Array.from(document.querySelectorAll('.plhin .plc .pcb'))
    .map((n: any) => n.textContent);
  t.content = texts[0];
  let commentAuthors = Array.from(document.querySelectorAll('.pi .authi .xw1'))
    .map((n: any) => n.textContent);
  
  let comments = [];
  for (let i=1; i<commentAuthors.length; i++) {
    let c = new Comment();
    c.authorName = commentAuthors[i];
    c.content = texts[i];
    comments.push(c);
  }

  t.comments = comments;
  return t;
}

async function doCrawl(totalThreads: Thread[]) {
  console.log("[scheduler]");
  // let loginResult = await redditLogin();
  // console.log("[scheduler] login", loginResult);
  let curThreads: Thread[] = [];
  let pageNum = 1;
  outerLoop:
  while (pageNum < CRAWL_PAGE_LIMIT) {
    let curPageThreadBasics: Thread[] = await getCurPageBasics(pageNum);
    for (let tbasic of curPageThreadBasics) {
      if (!isShouldCrawl(tbasic, totalThreads)) {
        console.log("[scheduler] skip", tbasic);
        continue;
      }
      console.log("[scheduler] starting crawling", tbasic);
      let t: Thread | null = null;
      try {
        t = await crawl_thread(tbasic);
      } catch(e) {
        console.warn("[scheduler] crawl this thread failed, need check", tbasic, e);
      }
      if (!t) {
        continue;
      }
      if (process.platform !== "darwin") {
        const postResults = await postReddit(t);
        console.log("[scheduler] post reddit", postResults);
      } else {
        console.log("[scheduler][dryrun] post reddit", t);
      }
      curThreads.push(t);
      if (curThreads.length >= CRAWL_THREAD_LIMIT) {
        break outerLoop;
      }
    }
    pageNum++;
  }
  console.log('[scheduler] curLength, totalLength', curThreads.length, totalThreads.length);
  totalThreads = totalThreads.concat(curThreads.map(t => { return { id: t.id } as Thread; }));
  writeThreadsObj({ threads: totalThreads });
}

async function main() {
  if (process.platform === 'darwin') {
    let tobj = readThreadsObj();
    await doCrawl(tobj.threads);
  } else {
    setInterval(() => {
      let tobj = readThreadsObj();
      doCrawl(tobj.threads)
    }, THIRTY_MINS);
  }
}

async function test() {
  // let loginResult = await redditLogin();
  // console.log("[scheduler] login", loginResult);
  // const postResults = await postReddit(null);
  // console.log("[scheduler] post reddit", postResults);
  // await doCrawl([]);
}

// test();
main();
