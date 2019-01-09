let client = new Client();
client.setUpServers(_=>{
    client.on("result",function(data){
        console.log(data)
        client.close();
    });
    client.resolve("google.com","A");
})