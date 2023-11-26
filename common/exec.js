import { execFile } from 'child_process';
import log from './log.js';

async function exec(company, houses) {
    for(const home of houses) {
        log.info('ExecFile Start: ' + company);
        execFile('node', ['apply.js', company, home.id, home.path], (error, stdout, stderr) => {
            if(error) { throw error };
            console.log("ExecFile Output" + stdout);
            log.info('ExecFile Output: ' + home.path, stdout);
       });
    }
}

export default exec;
