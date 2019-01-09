const assert = require('assert');
const fs = require("fs");
const path = require("path");
let DNSUtils = {};
DNSUtils.pad = (value, length) => {
    assert(typeof value == "string" && typeof length == "number");
    let missing = length - value.length;
    //assert(missing > 0);
    for (let i = missing; i > 0; i--) {
        value = "0" + value;
    }
    return value;
}
DNSUtils.getArrayCount8Hex = (a) => {
    let count = a.length.toString(16);
    if (4 > count.length) {
        count = DNSUtils.pad(count, 4);
    }
    count = "0x" + count;
    return count;
}
DNSUtils.getRandom16 = () => {
    return Math.floor(Math.random() * 16);
}
DNSUtils.parseInt = (dataStr) => {
    assert(typeof dataStr == "string" && dataStr != "");
    let base = 10;
    let prefix = "";
    if (dataStr.indexOf("0x") == 0) {
        base = 16;
        prefix = "0x";
    }
    else if (dataStr.indexOf("0o") == 0) {
        base = 8;
        prefix = "0o";
    }
    else if (dataStr.indexOf("0b") == 0) {
        base = 2;
        prefix = "0b";
    }
    return parseInt(dataStr.replace(prefix,''), base);
}
DNSUtils.getTypeAsString = (dataStr) => {
    assert(typeof dataStr == "string" && dataStr != "");
    let constants = fs.readFileSync(path.join(__dirname,"../../constants","dns-constants.json"));
    
    constants = JSON.parse(constants);
    let data = DNSUtils.parseInt(dataStr);
    let index = constants.recordIds.indexOf(data);
    if(index>-1)
    {
        return constants.recordNames[index];
    }
    else
    {
        return null;
    }
}
DNSUtils.getIPAddressAnswer = (dataStr)=>{
    assert(typeof dataStr=="string");
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    dataArray = dataArray.map(e=>{return parseInt(e,16)});
    let ip = dataArray.join(".");
    return ip;
}
DNSUtils.parseAnswer = (type,answer,packet)=>{
    let intType = DNSUtils.parseInt(type);
    if(intType==1)
    {
        return DNSUtils.getIPAddressAnswer(answer,packet);
    }
    else if(intType==2||intType==5||intType==16)
    {
        return DNSUtils.getNameFromValue(answer,packet);
    }
    else if(intType==6)
    {
        return DNSUtils.getSOAAnswer(answer,packet);
    }
    else if(intType==15)
    {
        return DNSUtils.getMXAnswer(answer,packet);
    }
    else if(intType==17)
    {
        return DNSUtils.getRPAnswer(answer,packet);
    }
    else
    {
        return answer;
    }
}
DNSUtils.getNameFromBufferArray = (buffer,packet)=>{
    let flag = true;
    let url = "";
    while (flag) {
        let bufVal = buffer.shift();
        let count = parseInt(bufVal);
        if(count==192)
        {
            buffer = packet.toJSON().data.splice(buffer.shift());
            count = parseInt(buffer.shift());
        }
        if (count == 0||!count) {
            flag = false;
            break;
        }
        let part = DNSUtils.getCharString(buffer,count);
        //console.log(part)
        url += part + ".";
    }
    return url;
}
DNSUtils.getNameFromValue = (dataStr,packet)=>{
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    dataArray = dataArray.map(e => { 
        return parseInt(e, 16);
    });
    let buf = Buffer.from(dataArray);
    let bufArray = buf.toJSON().data;
    let result =DNSUtils.getNameFromBufferArray(bufArray,packet);
    return result;
}
DNSUtils.getTypeAsInt = (type)=>{
    assert(typeof type == "string" && type != "");
    let constants = fs.readFileSync(path.join(__dirname,"../../constants","dns-constants.json"));
    
    constants = JSON.parse(constants); 
    let index = constants.recordNames.indexOf(type);
    if(index>-1)
    {
        return constants.recordIds[index];
    }
    else
    {
        return null;
    }
}
DNSUtils.getMXAnswer = (dataStr,packet)=>{
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    let hexDataArray = dataArray;
    dataArray = dataArray.map(e => { 
        return parseInt(e, 16);
    });
    let preference = parseInt(dataArray.shift() + "" + dataArray.shift() );
    hexDataArray.shift();
    hexDataArray.shift();
    let mx =  DNSUtils.getNameFromValue("0x"+ hexDataArray.join(""),packet);
    return { "preference" : preference, "mx" : mx};
}
DNSUtils.getRPAnswer = (dataStr,packet)=>{
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    let hexDataArray = dataArray;
    dataArray = dataArray.map(e => { 
        return parseInt(e, 16);
    });
    
    let preference = parseInt(dataArray.shift() );
    hexDataArray.shift();
   
 //   console.log(preference)
  //  console.log(dataArray)
    let commandLength = dataArray.shift();
    command = DNSUtils.getCharString(dataArray,commandLength);
    let record =  DNSUtils.getCharString(dataArray,dataArray.length);
    return { "preference" : preference, "command" : command,"record": record};
}
DNSUtils.getCharString = (data,length)=>
{
    let part = "";
    for (let j = 0; j < length; j++) {
        part += String.fromCharCode(parseInt(data.shift()));
    }
    return part;
}
DNSUtils.getSOAAnswer = (dataStr,packet)=>{
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    let hexDataArray = dataArray;
    dataArray = dataArray.map(e => { 
        return parseInt(e, 16);
    });
    let nameServerArray = hexDataArray;
    hexDataArray = nameServerArray.splice(hexDataArray.indexOf("00"));
    hexDataArray.shift();
    nameServerArray.push("00");
    let nameServer = DNSUtils.getNameFromValue("0x"+ nameServerArray.join(""),packet);
    let emailAddressArray = hexDataArray;
    hexDataArray = emailAddressArray.splice(hexDataArray.indexOf("00"));
    emailAddressArray.push("00");
    hexDataArray.shift();
    let emailAddress =   DNSUtils.getNameFromValue("0x"+ emailAddressArray.join(""),packet);
    let sn = DNSUtils.parseInt("0x" + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift());
    let refresh =  DNSUtils.parseInt("0x" + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift());
    let retry =  DNSUtils.parseInt("0x" + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift());
    let expiry =  DNSUtils.parseInt("0x" + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift());
    let nx =  DNSUtils.parseInt("0x" + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift() + hexDataArray.shift());
    return { "nameServer" : nameServer, "emailAddress" : emailAddress,"sn": sn,"refresh":refresh,"retry":retry,"expiry":expiry,"nx":nx};
}
DNSUtils.formatDomain = (domain)=>{
    assert(typeof domain == "string");
    domain = domain.toLowerCase();
    let parts = domain.split(".");
    if(parts[parts.length-1]!="")
    {
        parts.push("");
    }
    return parts.join(".");
}
module.exports = DNSUtils;