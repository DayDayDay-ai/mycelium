// Windows can transiently reject asynchronous mkdir during Next's concurrent export.
// Retry only EPERM, using synchronous mkdir as a bounded fallback; other errors propagate.
if (process.platform === 'win32') {
 const fs=require('node:fs');
 const original=fs.promises.mkdir.bind(fs.promises);
 fs.promises.mkdir=async function(directory,options) {
  try {return await original(directory,options);}
  catch(error) {
   if(error.code!=='EPERM')throw error;
   for(let attempt=0;attempt<4;attempt++) {
    try {return fs.mkdirSync(directory,options);}
    catch(retryError) {
     if(retryError.code!=='EPERM')throw retryError;
     if(attempt===3)throw retryError;
     await new Promise(resolve=>setTimeout(resolve,40));
    }
   }
  }
 };
}
