console.log('Yo');
import { fork } from 'child_process';

const forked = fork('./temp/child.js'); // child 

forked.on('message', (msg) => {
  console.log('Message from child', msg);
});

forked.send({ hello: 'world' });
