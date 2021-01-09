const util = require('util');
const fs = require('fs').promises;  
const exec = util.promisify(require('child_process').exec);

async function loadPRs(directory) {
    const gitLogCmd = `cd ${directory} && git log --pretty=format:"%an|%ad|%s" --date=short`
    const { stdout, stderr } = await exec(gitLogCmd);

    const lines = stdout.split("\n");
    return lines.map(line => {
        const pieces = line.split('|');
        return {
            author: pieces[0],
            date: pieces[1],
            subject: pieces[2]
        }
    });
}

async function getActiveUsers(){
    const config = await fs.readFile('active-users.txt', 'utf-8');
    return new Map(config.split("\n").map(i => [i, true]));
}

async function extractLastPR(prs){
    let activeUsers = await getActiveUsers();
    let lastPRAuthor = new Map()
    return prs.filter(pr => { 
        if(!activeUsers.has(pr.author)){
            return false;
        }

        const val = lastPRAuthor.get(pr.author); 
        if(val) { 
            return false;
        } 
        lastPRAuthor.set(pr.author, pr); 
        return true; 
    });     
}

async function run(){
    console.log("Last commits by user\n\n")
    const args = process.argv;

    if(args.length < 3){
        console.error("Failed")
        return ;
    }
    const directory = args[2]
    const prs = await loadPRs(directory)
    const lastPRs = await extractLastPR(prs)
    lastPRs.map(pr => `${pr.date} | ${pr.author} | ${pr.subject}`)
        .forEach(line => console.log(line))
}

(async () => {
    run();
})();


