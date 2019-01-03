const assert = require('assert');
const { DNSPacket } = require("./dns-packet.js");
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
    let constants = fs.readFileSync(path.join(__dirname,"dns-constants.json"));
    
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
    let data = DNSUtils.parseInt(dataStr);
    let ip = [];
    while(data)
    {   
        ip.push(data&0xff);
        data = data>>8;
        
    }
    ip = ip.reverse();
    ip = ip.join(".");
    return ip;
}
DNSUtils.parseAnswer = (type,answer)=>{
    
    if(DNSUtils.parseInt(type)==1)
    {
        return DNSUtils.getIPAddressAnswer(answer);
    }
    else if(DNSUtils.parseInt(type)==2)
    {
        return DNSUtils.getNameFromValue(answer);
    }
}
DNSUtils.getNameFromBufferArray = (buffer)=>{
    let flag = true;
    let url = "";
    while (flag) {
        let count = parseInt(buffer.shift());
        if (count == 0) {
            flag = false;
            break;
        }
        let part = "";
        for (let j = 0; j < count; j++) {
            part += String.fromCharCode(parseInt(buffer.shift()));
        }
        url += part + ".";
    }
    return url;
}
DNSUtils.getNameFromValue = (dataStr)=>{
    dataStr = dataStr.replace("0x","");
    let regex = new RegExp(`.{1,2}`, 'g');
    let dataArray = dataStr.match(regex);
    dataArray = dataArray.map(e => { 
        return parseInt(e, 16);
    });
    let buf = Buffer.from(dataArray);
    return DNSUtils.getNameFromBufferArray(buf.toJSON().data);
}
module.exports = DNSUtils;