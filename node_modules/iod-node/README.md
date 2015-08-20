# Node JS client library for IDOL OnDemand

Basic library to help with calling IDOL OnDemand APIs [http://idolondemand.com](http://idolondemand.com)

### Installation

```
npm install git+<repourl>
```

### Start

```js
var iod = require('iod-node')
client= new iod.IODClient('http://api.idolondemand.com','apikey')
```

### Callbacks

```
var callback = function(err,resp,body){
  console.log(body)
}
```

We can define our callbacks as functions and pass them as arguments

```
var data= {'text':'I like cats'}
client.call('analyzesentiment',callback,data)
```

Or we can use the .on('data') hook to do the same thing.

```
client.call('analyzesentiment',data).on('data',callback)
```

THe order of the arguments after the api name don't matter when passed.

```
client.call('analyzesentiment',data,callback)

```


### Async calls

While node will mostly deal with things asynchronously, IDOL OnDemand offers a servetr side asynchronous calls method which should be used with large files and slow queries.

```
client.call('analyzesentiment',callback,data,true)
```

Pass a boolean for the async parameter.


### Posting files

File posting is handled using the "file" parameter name which is used for all current file postings in IDOL OnDemand

```
var data={'file':'test.txt'}
client.call('analyzesentiment',data,callback)
```
