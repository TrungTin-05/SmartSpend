const tedious = require('tedious');
const tests = [
  {name:'ntlm-domain', auth:{type:'ntlm', options:{domain:process.env.USERDOMAIN||process.env.COMPUTERNAME||'', userName:process.env.USERNAME||'', password:''}}},
  {name:'ntlm-workgroup', auth:{type:'ntlm', options:{domain:'WORKGROUP', userName:process.env.USERNAME||'', password:''}}},
  {name:'ntlm-dot', auth:{type:'ntlm', options:{domain:'.', userName:process.env.USERNAME||'', password:''}}},
  {name:'ntlm-local', auth:{type:'ntlm', options:{domain:process.env.COMPUTERNAME||'', userName:process.env.USERNAME||'', password:''}}},
  {name:'default', auth:{type:'default', options:{userName:undefined, password:undefined}}},
  {name:'sql-empty', auth:{type:'default', options:{userName:'', password:''}}}
];

(async () => {
  for (const test of tests) {
    console.log('---', test.name, test.auth);
    const config = {
      server: 'localhost',
      authentication: test.auth,
      options: {database:'master', encrypt:false, trustServerCertificate:true}
    };
    const connection = new tedious.Connection(config);
    await new Promise((resolve) => {
      connection.on('connect', (err) => {
        if (err) {
          console.log(test.name, 'error', err.message);
        } else {
          console.log(test.name, 'connected');
        }
        connection.close();
        resolve();
      });
    });
  }
})();
