import { notFound } from 'next/navigation';
import { mushrooms } from '@/lib/static-catalog';
import { Detail } from '@/components/detail';
export const dynamicParams = false;
export function generateStaticParams() { return mushrooms.map(item=>({slug:item.slug})); }
export default async function Page({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;const item=mushrooms.find(item=>item.slug===slug);
 if(!item) notFound();return <Detail item={item}/>;
}
