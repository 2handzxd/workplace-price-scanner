(function(root){
  "use strict";
  function validate(item){
    if(!item || typeof item.barcode !== "string" || !item.barcode.trim()) throw new Error("Barcode is required.");
    if(typeof item.name !== "string" || !item.name.trim()) throw new Error("Product name is required.");
    if(typeof item.price !== "number" || !Number.isFinite(item.price) || item.price < 0) throw new Error("Price must be a non-negative number.");
    return {...item, barcode:item.barcode.trim(), name:item.name.trim(), price:Math.round(item.price*100)/100};
  }
  function merge(base, drafts){
    if(!Array.isArray(base) || !Array.isArray(drafts)) throw new Error("Catalog must be a JSON array.");
    const map = new Map();
    for(const raw of base){
      const item=validate(raw);
      if(map.has(item.barcode)) throw new Error("Duplicate catalog barcode: "+item.barcode);
      map.set(item.barcode,item);
    }
    for(const raw of drafts){
      const item=validate(raw), existing=map.get(item.barcode);
      if(existing){
        const keys=new Set([...Object.keys(existing),...Object.keys(item)]);
        if([...keys].some(key=>(existing[key] ?? "") !== (item[key] ?? "")))
          throw new Error("Barcode "+item.barcode+" already exists with different details. Remove this draft or update it on GitHub.");
      }else map.set(item.barcode,item);
    }
    return [...map.values()];
  }
  const api={validate,merge};
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  else root.CatalogDraft=api;
})(typeof globalThis!=="undefined" ? globalThis : this);
