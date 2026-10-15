import {getDocumentProxy} from 'unpdf';
export async function statementText(bytes:Uint8Array,password?:string){
 const options={password,useSystemFonts:false,isEvalSupported:false};
 const pdf=await getDocumentProxy(new Uint8Array(bytes),options);
 try{
  if(pdf.numPages>30)throw Error('Use a statement with 30 pages or fewer.');
  const pages:string[]=[];
  for(let n=1;n<=pdf.numPages;n++){
   const page=await pdf.getPage(n),content=await page.getTextContent();
   const lines:{y:number;items:{x:number;text:string}[]}[]=[];
   for(const item of content.items){if(!('str' in item)||!item.str.trim())continue;const y=item.transform[5],x=item.transform[4];let line=lines.find(l=>Math.abs(l.y-y)<2);if(!line){line={y,items:[]};lines.push(line)}line.items.push({x,text:item.str});}
   pages.push(lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ')).join('\n'));
  }
  return pages.join('\n');
 }finally{await pdf.loadingTask.destroy()}
}
