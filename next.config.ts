import type {NextConfig} from 'next';
const basePath=process.env.NEXT_PUBLIC_BASE_PATH || '';
const config:NextConfig={output:'export',trailingSlash:true,basePath,experimental:{cpus:1},images:{unoptimized:true},poweredByHeader:false};
export default config;
