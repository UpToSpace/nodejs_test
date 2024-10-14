const fs = require('fs');
const process = require('process');
const path = require('path');
const os = require('os');

const username = process.argv[2].split('=')[1];
console.log(`Welcome to the File Manager, ${username}!`)
let readableStream, writableStream, destination, cwd;

const exitProgram = () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`)
    process.exit(0);
}

const checkFile = (path) => {
    if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
        console.log('Operation failed');
        return false;
    }
    return true;
}

process.on('SIGINT', exitProgram);
cwd = os.homedir();
console.log(`You are currently in ${cwd}`);
console.log('Enter a command: ');

process.stdin.on('data', (input) => {
    const command = input.toString().trim();
    const commandParts = command.split(' ');
    const action = commandParts[0];
    const target = commandParts[1];
    const targetPath = target && path.join(cwd, target);

    switch(action) {
        case '.exit':
            exitProgram();
            break;
        case 'up':
            if (cwd === os.homedir()) {
                console.log('Operation failed');
                break;
            }
            cwd = path.join(cwd, '..');
            break;
        case 'cd':
            if (!checkFile(targetPath)) {
                break;
            }
            cwd = targetPath;
            break;
        case 'ls':
            const files = fs.readdirSync(cwd);
            files.sort((a, b) => {
                const pathA = path.join(cwd, a);
                const pathB = path.join(cwd, b);
                if (fs.statSync(pathA).isDirectory())
                    return -1;
                if (fs.statSync(pathB).isDirectory())
                    return 1;
                return a.localeCompare(b);
            }).map((file) => {
                const filePath = path.join(cwd, file)
                fs.statSync(filePath).isDirectory() ? console.log(file + ' | Directory') :
                    console.log(file + ' | File');
            });
            break;
        case 'cat':
            if (!checkFile(targetPath)) {
                break;
            }
            readableStream = fs.createReadStream(targetPath, { encoding: 'utf-8' });
            readableStream.on('data', function(chunk) {
                console.log(chunk);
            });
            readableStream.on('error', function (err) {
                console.error('Operation failed');
            });
            break;
        case 'add':
            fs.writeFileSync(cwd + '/' + target, '');
            break;
        case 'rn':
            const newName = commandParts[2];
            if (!checkFile(targetPath)) {
                break;
            }
            fs.renameSync(targetPath, path.join(cwd, newName));
            break;
        case 'cp':
            destination = commandParts[2];
            if (!checkFile(targetPath)) {
                break;
            }
            readableStream = fs.createReadStream(targetPath);
            writableStream = fs.createWriteStream(path.join(cwd, destination));
            readableStream.pipe(writableStream);
            break;
        case 'mv':
            destination = commandParts[2];
            if (!checkFile(targetPath)) {
                break;
            }
            readableStream = fs.createReadStream(targetPath);
            writableStream = fs.createWriteStream(path.join(cwd, destination));
            readableStream.pipe(writableStream);
            writableStream.on('finish', function() {
                fs.unlinkSync(targetPath);
            });
            break;
        case 'rm':
            fs.unlinkSync(targetPath);
            break;
        case 'os':
            const osCommand = commandParts[1].split('--')[1]
            switch(osCommand) {
                case 'EOL':
                    console.log(os.EOL);
                    break;
                case 'cpus':
                    console.log(os.cpus());
                    break;
                case 'homedir':
                    console.log(os.homedir());
                    break;
                case 'username':
                    console.log(os.userInfo().username);
                    break;
                case 'architecture':
                    console.log(os.arch());
                    break;
                default:
                    console.log('Invalid input');
                    break;
            }
            break;
        case 'hash':
            if (!checkFile(targetPath)) {
                break;
            }
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256');
            hash.update(fs.readFileSync(targetPath));
            console.log(hash.digest('hex'));
            break;
        case 'compress':
            if (!checkFile || !commandParts[2]) {
                break;
            }
            destination = commandParts[2];
            const brotliCompress = require('zlib').createBrotliCompress();
            readableStream = fs.createReadStream(targetPath);
            writableStream = fs.createWriteStream(path.join(cwd, destination) + '.gz');
            readableStream.pipe(brotliCompress).pipe(writableStream);
            break;
        case 'decompress':
            if (!checkFile || !commandParts[2]) {
                break;
            }
            destination = commandParts[2];
            const brotliDecompress = require('zlib').createBrotliDecompress();
            readableStream = fs.createReadStream(targetPath);
            writableStream = fs.createWriteStream(path.join(cwd, destination));
            readableStream.pipe(brotliDecompress).pipe(writableStream);
            break;
        default:
            console.log('Invalid input');
    }

    console.log(`You are currently in ${cwd}`);
    console.log('Enter a command: ');
});
