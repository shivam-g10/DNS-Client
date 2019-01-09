const Client = require("../index.js");
let client = new Client();
client.setUpServers(_=>{
    console.log(client)
    client.on("result",function(data){
        console.log(data)
        client.close();
    });
    client.resolve("google.com","A");
})