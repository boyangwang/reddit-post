import json
import praw
import time
import urllib.request
from pyquery import PyQuery

user_pass = json.load(open("config.json"))

def post_zaker():
    for i in ['2', '1', '4', '5']:
        time.sleep(5)
        req = urllib.request.Request('https://www.myzaker.com/channel/'+i)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
        resp = urllib.request.urlopen(req)
        resp_bytes = resp.read()
        try:
            html = resp_bytes.decode('utf-8')
        except UnicodeDecodeError:
            import gzip
            from io import BytesIO
            gz = gzip.GzipFile(fileobj=BytesIO(resp_bytes), mode='rb')
            html = gz.read()
            gz.close()
        print(html)
        pq = PyQuery(html)
        article = {}
        article_dom = pq('#content>.main>#section>.figure:first-child')
        article['title'] = article_dom.find('h2.figcaption').text()
        article['link'] = article_dom.find('a').attr('href')[2:]
        print(article)
        submit_to_s1()
        time.sleep(3600)
def post_s1():
    threads_dict = json.load(open('threads_dict.json'), 'r')
    for i in range(1, 2):
        pq = getUrlAsPq('http://bbs.saraba1st.com/2b/forum-75-'+i+'.html')
        normal_threads = pq('[id*="normalthread_"]')
        for t in normal_threads:
            t_id = t.attr('id')
            if t_id in threads_dict:
                t_meta = threads_dict[t_id]
            else:
                t_meta = {}
            t_meta['url'] = 'http://bbs.saraba1st.com/2b/' + t.find('a.xst.s').attr('href')
            pages = t.find('span.tps>a:last-child')
            if pages is not None:
                t_meta['pages'] = int(pages.text())
            
def getUrlAsPq(url):
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
    resp = urllib.request.urlopen(req)
    resp_bytes = resp.read()
    html = resp_bytes.decode('utf-8')
    pq = PyQuery(html)
    return pq
def submit_to_s1(title, selftext):
    try:
        r = praw.Reddit(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
        r.login(user_pass['user'], user_pass['pass'], disable_warning=True)
        submission = r.submit('saraba1st', selftext=selftext)
    except:
        print('Error when submitting, continue')

def main():
    while True:
        post()

if __name__ == "__main__":
    main()