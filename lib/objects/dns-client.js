const dgram = require("dgram");
const dns = require("dns");
const net = require("net");
const utils = require("../utils/dns-utils.js");
const assert = require('assert');
const {DNSPacket} = require("./dns-packet.js");
const {Question} = require("./dns-question.js");
const EventEmitter = require('events');
class Client extends EventEmitter{
    constructor()
    {
        super();
        this.servers = {};
        this.inProgress = 0;
      //  this.setUpServers();
    }
    setUpServers(callback)
    {
        let dnsServers = dns.getServers();
      //  console.log(dnsServers)
        if (dnsServers && dnsServers.length > 0) {
            this.inProgress = 0;
            for(let i=0;i<dnsServers.length;i++){
                this.inProgress++;
                this.createSocket(dnsServers[i],callback);
            }
        }
    }
    createSocket(ip,callback)
    {
       // console.log(ip);
        let socket;
        if (net.isIPv4(ip)) {
            socket = dgram.createSocket('udp4')
        }
        else {
            socket = dgram.createSocket('udp6');
        }
        socket.on("listening", (...params) => { 
            //console.log("listening", params)
        })
        socket.on("error", (...params) => { 
            console.log("error", params)
            ;this.servers[ip].error = true;this.sentCount--; 
        });
        socket.on("close", (...params) => { 
        //    console.log("close", params) 
        });
        socket.on("message", (buffer) => { 
            let packet = new DNSPacket(buffer);
            if(packet.answers.length>0)
            {
                this.servers[ip].answers = true;
            }
            //let address = socket.address()
            //ip = address.address;
            this.servers[ip].received.push(packet);
            this.sentCount--;
            if(this.sentCount==0)
            {
                let answers = [];
                let ns = [];
                let ar = [];
                //console.log(this.servers)
                if(this.servers[ip].answers)
                {
                    let latestPacket = this.servers[ip].received[this.servers[ip].received.length-1];
                    latestPacket.answers.forEach(ans=>{
                        let data = ans.getAsJSON(true,latestPacket.packet);
                        let rdata = data.rData;
                        let result = rdata;
                        if(typeof rdata == "object")
                        {
                            let keys = Object.keys(rdata);
                            result = "";
                            for(let i=0;i<keys.length;i++)
                            {
                                let key = keys[i];
                                result = result + rdata[key] + " ";
                            }
                            result = result.trim();
                        }
                        answers.push(result);
                    });
                    latestPacket.ns.forEach(ans=>{
                        let data = ans.getAsJSON(true,latestPacket.packet);
                        let rdata = data.rData;
                        let result = rdata;
                        if(typeof rdata == "object")
                        {
                            let keys = Object.keys(rdata);
                            result = "";
                            for(let i=0;i<keys.length;i++)
                            {
                                let key = keys[i];
                                result = result + rdata[key] + " ";
                            }
                            result = result.trim();
                        }
                        ns.push(result);
                    })
                    latestPacket.ar.forEach(ans=>{
                        let data = ans.getAsJSON(true,latestPacket.packet);
                        let rdata = data.rData;
                        let result = rdata;
                        if(typeof rdata == "object")
                        {
                            let keys = Object.keys(rdata);
                            result = "";
                            for(let i=0;i<keys.length;i++)
                            {
                                let key = keys[i];
                                result = result + rdata[key] + " ";
                            }
                            result = result.trim();
                        }
                        ar.push(result);
                    })
                }
                this.emit("result",{
                    "answers" : answers,
                    "name-servers" :  ns,
                    "additional-records" : ar
                });
            }
            //socket.close();
        })
        socket.bind(53,(...params)=>{
           // console.log(params);
            this.inProgress--;
            this.servers[ip] = {
                "socket" : socket,
                "sent" : [],
                "received" : [],
                "answers" : false
            }
            if(this.inProgress==0)
            {
                callback();
            }
        })
        
    }
    resolve(domain,record)
    {
        assert(typeof domain=="string"&& domain && typeof record=="string" && record);
        domain = utils.formatDomain(domain);
        record = record.toUpperCase();
        let intRecord = utils.getTypeAsInt(record);
        if(typeof intRecord!= "number")
        {
            throw Error("Record type not supported");
        }
        let packet = new DNSPacket();
        packet.setFlags("0x0100");
        let question = new Question();
        question.setName(domain);
        question.setType("0x"+utils.pad(""+ intRecord.toString(16),4));
        question.setClass("0x0001");
        packet.addQuestion(question);
        let serverIps =  Object.keys(this.servers);
        if(serverIps.length==0)
        {
            throw Error("DNS servers not available");
        }
        this.sentCount = 0;
        serverIps.forEach(ip=>{
            this.sentCount++;
            this.servers[ip].answers = false;
            this.servers[ip].error = false;
            this.servers[ip].socket.send(packet.toBuffer(), 53, ip, (err, bytes) => {
                    //console.log(err, bytes);
                    this.servers[ip].sent.push(packet);
            })
        })
    }
    close()
    {
        let serverIps =  Object.keys(this.servers);
        if(serverIps.length==0)
        {
            throw Error("DNS servers not available");
        }
        serverIps.forEach(ip=>{
            this.servers[ip].socket.close();
        });

    }
}
module.exports = Client;