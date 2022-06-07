const HTML_TAGS =
'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
'header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,' +
'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
'data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,' +
'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
'option,output,progress,select,textarea,details,dialog,menu,' +
'summary,template,blockquote,iframe,tfoot'

const SVG_TAGS =
'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
'feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
'text,textPath,title,tspan,unknown,use,view'

const VOID_TAGS =
'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'

function makeMap(str) {
  const map = str.split(',').reduce((map, item) => ((map[item] = true), map), Object.create(null))
  return (val) => !!map[val]
}

export const isVoidTag = makeMap(VOID_TAGS)
export const isNativeTag = makeMap(HTML_TAGS)

export { parse } from './parse';
export { NodeTypes } from './ast';
export { compile } from './compile'
