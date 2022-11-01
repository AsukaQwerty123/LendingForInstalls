const https = require('http');
const { resolve, basename } = require('path');
const fsp = require('fs/promises');
const { createReadStream } = require('fs');
const qs = require('querystring');
const url = require('url');

const contentTypes = {
    html: 'text/html',
    json: 'application/json',
    txt: 'text/plain',
    css: 'text/css',
    js: 'text/javascript',

    png: 'image/png',
    jpg: 'image/jpg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',

    ogg: 'audio/ogg',
    mp3: 'audio/mpeg',
    aac: 'audio/aac',

    mp4: 'video/mp4',
    webm: 'video/webm',

    exe: 'application/octet-stream',
    zip: 'application/zip'
};

const server = https.createServer({
}, async (req, res) => {
try {
    if (req.method?.toLowerCase() === 'get' && url.parse(req.url).pathname == "/load.php") {
        const query = qs.parse(url.parse(req.url).query);
        let filepath = './files/' + query.d + ".zip";
        const stat = await fsp.stat(filepath).catch(async()=> {
             filepath = './files/' + "default" + ".zip";
             return await fsp.stat(filepath);
        });
        console.log(filepath);
        res.writeHead(200, {
            "Content-Disposition": "attachment;filename=" + basename(filepath),
            'Content-Type': contentTypes.zip,
            'Content-Length': stat.size
            
        });
        const readStream = createReadStream(filepath);
        readStream.pipe(res);

    } else {
        if (req.method?.toLowerCase() === 'head') {
           return res.end();
          }
        let path = resolve('./static' + req.url);
        let stat = await fsp.stat(path).catch(() => null);
        if (!stat) {
            res.writeHead(404);
            return res.end('Not found');
        }
        
        if (stat.isDirectory()) {
            path = resolve(path, './index.html');
            stat = await fsp.stat(path).catch(() => false);
        }
        
        if (stat) {
            const ext = path.match(/\w+\.(\w{2,5})($|\?)/)[1];
            if (ext in contentTypes) res.setHeader('Content-Type', `${contentTypes[ext]}; charset=utf8;`);
            else res.removeHeader('Content-Type');
            res.setHeader('Content-Length', stat.size);
            res.setHeader('Cache-Control', `max-age=31536000, public, must-revalidate, proxy-revalidate`);
            res.setHeader('Pragma', `public`);
            res.setHeader('ETag', Buffer.from(path).toString('base64'));
            const stream = createReadStream(path);
            return stream.pipe(res);
        } else {
            res.writeHead(404);
            return res.end('Not found');
        }
    }
 
} catch {
    res.writeHead(404);
    return res.end('Not found');
}
});

server.listen(80);

