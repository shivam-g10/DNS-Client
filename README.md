## DNS Client
This project is an implementation of a DNS record lookup service using Node.js.

#### Install
```bash
npm install dns-client
```

#### Usage

```javascript
let client = new Client();
client.setUpServers(_=>{
    client.on("result",function(data){
        console.log(data)//{answers:[],'name-servers':[],'addtional-records':[]}
        client.close();
    });
    client.resolve("google.com","A");
})
```