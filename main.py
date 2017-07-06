import json
import praw
import time
import urllib.request
from pyquery import PyQuery

user_pass = json.load(open("config.json"))

def post():
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
        try:
            r = praw.Reddit(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
            r.login(user_pass['user'], user_pass['pass'], disable_warning=True)
            submission = r.submit('saraba1st', article['title'], url=article['link'])
        except:
            print('Error when submitting, continue')
        time.sleep(3600)

def main():
    while True:
        post()

if __name__ == "__main__":
    main()