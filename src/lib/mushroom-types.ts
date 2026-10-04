import type snapshot from './mushrooms.json';
export type Mushroom = Omit<(typeof snapshot)[number], 'images'|'regions'|'lookalikes'>;
export type MushroomImage = {id:string;mushroomId:string;url:string;alt:string;sortOrder:number};
export type MushroomRegion = {id:string;mushroomId:string;name:string;note:string};
export type MushroomLookalike = {id:string;mushroomId:string;similarId:string;differences:string;risk:string};

