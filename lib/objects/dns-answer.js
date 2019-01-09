const assert = require('assert');
const utils = require("../utils/dns-utils.js");
class Answer
{
    constructor(options)
    {

    }
    setIsTc(TC)
    {
        if(TC)
        {
            this.TC = true;
        }
        else
        {
            this.TC = false;
        }
    }
    setType(type)
    {
        assert(typeof type == "string" && (parseInt(type) || parseInt(type, 2) || parseInt(type, 8) || parseInt(type, 16)));
        this.type = type;
    }
    setOffset(offset)
    {
        if(this.TC)
        {
            this.offset = offset;
        }
    }
    setClass(cls) {
        assert(typeof cls == "string" && (parseInt(cls) || parseInt(cls, 2) || parseInt(cls, 8) || parseInt(cls, 16)))
        this.class = cls;
    }
    setTtl(ttl) {
        assert(typeof ttl == "string")
        this.timeToLive = ttl;
    }
    setRDLength(rdLength)
    {
        assert(typeof rdLength == "string" && (parseInt(rdLength) || parseInt(rdLength, 2) || parseInt(rdLength, 8) || parseInt(rdLength, 16)))
        this.rdLength = rdLength;
    }
    setRData(rData)
    {
        assert(typeof rData == "string" && (parseInt(rData) || parseInt(rData, 2) || parseInt(rData, 8) || parseInt(rData, 16)))
        this.rData = rData;
    }
    getAsJSON(converted,packet)
    {
        let json = {};
        if(converted)
        {
            if(this.TC)
            {
                json.offset = utils.parseInt(this.offset);
            }
            json.type = utils.getTypeAsString(this.type);
            json.class = utils.parseInt(this.class);
            json.timeToLive = utils.parseInt(this.timeToLive);
            json.rdLength = utils.parseInt(this.rdLength);
            json.rData = utils.parseAnswer(this.type,this.rData,packet);
        }
        else
        {
            if(this.TC)
            {
                json.offset = this.offset;
            }
            json.type = this.type;
            json.class = this.class;
            json.timeToLive = this.timeToLive;
            json.rdLength = this.rdLength;
            json.rData = this.rData;
        }
        return json;
    }
}
module.exports.Answer = Answer;