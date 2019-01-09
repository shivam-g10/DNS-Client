const {Packet} = require("./packet.js")
const {Question} = require("./dns-question.js");
const {Answer} = require("./dns-answer.js");
const utils = require("../utils/dns-utils.js");
const assert = require('assert');
class DNSPacket extends Packet
{
    constructor(buffer)
    {
        if(!buffer)
        {
            super();
            this.id = "0x" + utils.pad(utils.getRandom16() + utils.getRandom16() +  utils.getRandom16() +  utils.getRandom16() + "",4); 
            this.questions = [];
            this.answers = [];
            this.ns = [];
            this.ar = [];
        }
        else
        {
            super();
            this.questions = [];
            this.answers = [];
            this.ns = [];
            this.ar = [];
            this.setDNSPacket(buffer);
        }
        //this.rewritePacket();
    }
   /* setOpCode(opCode)
    {
        assert(typeof opCode == "string");
        this.OPCODE = opCode;
        this.rewritePacket();
    }*/
    setFlags(flags)
    {
        assert(typeof flags == "string");
        this.FLAGS = flags;
        //this.write(flags);
    }
    addQuestion(question)
    {
        assert(question instanceof  Question);
        let q = question.getAsJSON();
        assert(q&&q.name&&q.class&&q.type);
        this.questions.push(question);
    }
    toBuffer()
    {
        this.buffer = Buffer.alloc(0);
        this.write(this.id);
        this.write(this.FLAGS);
        let qCount = utils.getArrayCount8Hex(this.questions);
        let aCount = utils.getArrayCount8Hex(this.answers);
        let nsCount = utils.getArrayCount8Hex(this.ns);
        let arCount = utils.getArrayCount8Hex(this.ar);
        this.write(qCount);
        this.write(aCount);
        this.write(nsCount);
        this.write(arCount);
        if(this.questions.length>0)
        {
            for(let i=0;i<this.questions.length;i++)
            {
                let question =this.questions[i];
                let q = question.getAsJSON();
                this.write(q.name);
                this.write(q.type);
                this.write(q.class);
            }
        }
        return this.buffer;
    }
    setDNSPacket(buffer){
        let res = buffer.toJSON().data;
        this.packet = buffer;
        this.id = "0x"+utils.pad(res.shift().toString(16) + res.shift().toString(16) + "",4);
        ////console.log("ID: " + this.id);
        let flags = utils.pad(res.shift().toString(16) + res.shift().toString(16) + "",4);
        this.FLAGS = "0x" + flags;
       // //console.log("Flags: " + this.FLAGS);
        let binFlag = parseInt(flags, 16).toString(2);
        binFlag = utils.pad(binFlag,16);
        flags = binFlag.split("");
        this.QR = flags.shift();
        this.OPCODE = flags.shift() + flags.shift() + flags.shift() + flags.shift();
        this.AA = flags.shift();
        this.TC = flags.shift();
        this.RD = flags.shift();
        this.RA = flags.shift();
        this.Z = flags.shift() + flags.shift() + flags.shift();
        this.RCODE = flags.shift() + flags.shift() + flags.shift() + flags.shift();
        this.QDCOUNT ="0x" +  utils.pad(res.shift().toString(16) + res.shift().toString(16)+"",4);
        //console.log("QDCOUNT: " + this.QDCOUNT);
        this.ANCOUNT ="0x" +  utils.pad(res.shift().toString(16) + res.shift().toString(16)+"",4);
        //console.log("ANCOUNT: " + this.ANCOUNT);
        this.NSCOUNT ="0x" +  utils.pad(res.shift().toString(16) + res.shift().toString(16)+"",4);
        //console.log("NSCOUNT: " + this.NSCOUNT);
        this.ARCOUNT ="0x" + utils.pad(res.shift().toString(16) + res.shift().toString(16)+"",4);
        //console.log("ARCOUNT: " + this.ARCOUNT);
        let intQDCOUNT = parseInt(this.QDCOUNT);
        let intANCOUNT = parseInt(this.ANCOUNT);
        let intNSCOUNT = parseInt(this.NSCOUNT);
        let intARCOUNT = parseInt(this.ARCOUNT);
        for (let i = 0; i < intQDCOUNT; i++) {
            let question = new Question();
            let url = utils.getNameFromBufferArray(res);
            question.setName(url);
            let QTYPE = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
            let QCLASS = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
            question.setType(QTYPE);
            question.setClass(QCLASS);
            //console.log(question.getAsJSON());
            this.questions.push(question);
        }
        for (let i = 0; i < intANCOUNT; i++) {
            let answer = new Answer();
            answer.setIsTc(this.TC);
            if (this.TC) {
                let offset = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setOffset(offset);
                ////console.log(offset);
                let type = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setType(type);
                answer.setClass("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4))
                answer.setTtl("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16),8));
                let rdlength = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setRDLength(rdlength);
               // //console.log(rdlength);
                let byteLength = parseInt(rdlength, 16);
                // //console.log(bitLength);
                //let remainder =0;// bitLength%16;
                //let hexCount = answer.rdlength;
                //if(remainder)
                //{
                //   hexCount++;
                //}
                let rdata = "";
                while (byteLength > 0) {
                    rdata += utils.pad(""+ res.shift().toString(16),2);
                    byteLength--;
                }
                rdata = "0x" + rdata;
                answer.setRData(rdata);
                //console.log(answer.getAsJSON(true,this.packet));
                this.answers.push(answer);
            }
            else {
                //get name
            }
        }
        for (let i = 0; i < intNSCOUNT; i++) {
            let answer = new Answer();
            answer.setIsTc(this.TC);
            if (this.TC) {
                let offset = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setOffset(offset);
                ////console.log(offset);
                let type = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setType(type);
                answer.setClass("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4))
                answer.setTtl("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16),8));
                let rdlength = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setRDLength(rdlength);
                let byteLength = parseInt(rdlength, 16);
                let rdata = "";
                while (byteLength > 0) {
                    rdata += utils.pad(""+ res.shift().toString(16),2);
                    byteLength--;
                }
                rdata = "0x" + rdata;
                answer.setRData(rdata);
                //console.log(answer.getAsJSON(true,this.packet));
                this.ns.push(answer);
            }
            else {
                //get name
            }
        }
        for (let i = 0; i < intARCOUNT; i++) {
            let answer = new Answer();
            answer.setIsTc(this.TC);
            if (this.TC) {
                let offset = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setOffset(offset);
                ////console.log(offset);
                let type = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setType(type);
                answer.setClass("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4))
                answer.setTtl("0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16) + res.shift().toString(16),8));
                let rdlength = "0x" + utils.pad(""+ res.shift().toString(16) + res.shift().toString(16),4);
                answer.setRDLength(rdlength);
                let byteLength = parseInt(rdlength, 16);
                let rdata = "";
                while (byteLength > 0) {
                    rdata += utils.pad(""+ res.shift().toString(16),2);
                    byteLength--;
                }
                rdata = "0x" + rdata;
                answer.setRData(rdata);
                //console.log(answer.getAsJSON(true,this.packet));
                this.ar.push(answer);
            }
            else {
                //get name
            }
        }
        
        //console.log(res.map(e => { return e.toString(16) }))
    }
}

module.exports.DNSPacket = DNSPacket;