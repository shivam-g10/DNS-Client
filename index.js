const dgram = require("dgram");
const dns = require("dns");
const net = require("net");
const { DNSPacket } = require("./dns-packet.js");
const { Question } = require("./dns-question.js");
const utils = require("./dns-utils.js");
let dnsServers = dns.getServers();
console.log(dnsServers);
let domain = "shivammathur.in";
if (dnsServers && dnsServers.length > 0) {
    for(let i=0;i<dnsServers.length;i++){
        let ip = dnsServers[i];
        let socket;
        console.log(ip)
        if (net.isIPv4(ip)) {
            socket = dgram.createSocket('udp4')
        }
        else {
            socket = dgram.createSocket('udp6');
        }
        socket.on("listening", (...params) => { console.log("listening", params) })
        socket.on("error", (...params) => { console.log("error", params) });
        socket.on("close", (...params) => { console.log("close", params) });
        socket.on("message", (buffer) => { 
            console.log("message", buffer);
            let packet = new DNSPacket(buffer);
            socket.close();
        })
        socket.bind(53, (...params) => {
            if (params) {
                console.log("Listening")
            }
            let packet = new DNSPacket();
            packet.setFlags("0x0100");
            let question = new Question();
            question.setName(domain);
            question.setType("0x0001");
            question.setClass("0x0001");
            packet.addQuestion(question);
            socket.send(packet.toBuffer(), 53, ip, (err, bytes) => {
                console.log(err, bytes);
            })
        })
    }
}