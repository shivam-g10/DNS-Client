const Client = require("../index.js");
let client = new Client();
let round = 0;
client.setUpServers("1.1.1.1",_=>{
    console.log(client)
    client.on("result",function(data){
        console.log(data)
        client.close(_=>{
            if(round==0)
            {
                client.setUpServers(_=>{
                    console.log(client)
                    client.resolve("google.com","A");
                })
            }
            else if(round==1)
            {
                client.setUpServers("1.1.1.1",3053,_=>{
                    console.log(client)
                    client.resolve("google.com","A");
                })
            }
            round++;
        });
    });
    client.resolve("google.com","A");
})