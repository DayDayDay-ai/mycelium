export const asset = (url: string) => url.startsWith('/') ? (process.env.NEXT_PUBLIC_BASE_PATH || '') + url : url;
