"""Serves the game, and saves any PNG the page posts to /shot?name=x into tools/build/shots/x.png.
Used to get pictures of the running game for review:  python tools/serve.py 8417
In the page:  game.r.render(); fetch('/shot?name=x', {method: 'POST', body: game.r.gl.domElement.toDataURL()})
"""
import base64, os, re, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'tools', 'build', 'shots')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        m = re.match(r'/shot\?name=([\w-]+)$', self.path)
        if not m:
            self.send_error(404); return
        data = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('ascii', 'ignore')
        os.makedirs(SHOTS, exist_ok=True)
        with open(os.path.join(SHOTS, m.group(1) + '.png'), 'wb') as f:
            f.write(base64.b64decode(data.split(',', 1)[-1]))
        self.send_response(204); self.end_headers()

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8417
    print('http://localhost:%d' % port, flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
