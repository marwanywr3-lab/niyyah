import {handle} from './api.js';
export default {async fetch(request,env){const path=new URL(request.url).pathname;if(path.startsWith('/api/'))return handle(request,env);if(path==='/'||path==='/index.html')return Response.redirect('https://marwanywr3-lab.github.io/niyyah/',302);return new Response('Not found',{status:404});}};
