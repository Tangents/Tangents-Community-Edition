var needle = require('needle')
var util = require('util')
var fs = require('fs')
// Constructor
function IODClient(endpoint,apikey) {
  // always initialize all instance properties
  this.apikey = apikey;
  this.endpoint = endpoint+"/1/api/%s/%s/v1";
}
// class methods

needle.defaults({ timeout: 120000});


parseArgs=function(arg1,arg2,arg3){
  var data,callback,async;
  if (typeof arg1 == "function") {callback = arg1;}
  else if (typeof arg1 == "object") {data=arg1;}
  else {async=arg1;}

  if (typeof arg2 == "function") {callback = arg2;}
  else if (typeof arg2 =="object") {data=arg2;}
  else {async=arg2;}

  if (typeof arg3 == "function") {callback = arg3;}
  else if (typeof arg3 =="object") {data=arg3;}
  else {async=arg3;}

  return {'data':data,'callback':callback,'async':async}
}


IODClient.prototype.call = function(handler,arg1,arg2,arg3) {
  var args=  parseArgs(arg1,arg2,arg3)
  var data= args.data;
  var callback= args.callback;
  var async=args.async;
  if (typeof async =="undefined") async = false;
  if (typeof data =="undefined") data={};

  if (data["file"]){
    data["file"]={'file':data["file"],'content_type':'multipart/form-data'}
  }
//  console.log('incall',data)
  async_string="sync";
  data.apikey=this.apikey;


  if (async) {
    async_string="async";
  }

  var url = util.format(this.endpoint,async_string,handler);
  //console.log(url)

  if (typeof callback == "undefined") {

  return needle.post(url, data, { multipart: true });
  }
  else{

    if (async){
      var callback = callback;
      var callbackmanager=function(err,resp,body){
        body={'async':true,'data':body};
        body.status

        callback(err,resp,body);
      }
    }
    else{
      var callbackmanager= callback;
    }
    needle.post(url, data, { multipart: true }, callbackmanager);

  }

};


IODClient.prototype.createIndex=function(name,arg1,arg2,arg3){
  var args=  parseArgs(arg1,arg2,arg3)
  var data= args.data;
  var callback= args.callback;
  var async=args.async;

  if (typeof data =="undefined") data = {};
  data.index=name
  console.log("setting",data)
  return this.call('createtextindex',callback,data)
}

IODClient.prototype.getIndex=function(name){
    return new IODIndex(this,name)
}

IODClient.prototype.deleteIndex=function(name,arg1,arg2,arg3){
  var args=  parseArgs(arg1,arg2,arg3)
  var data= args.data;
  var callback= args.callback;
  var async=args.async;
  data.index=name
  var callback=callback;
  var self=this;

  var confirmcallback=function(err,resp,body){
    console.log('confirmcall')
    console.log(JSON.stringify(body))
    data.confirm=body.confirm
    self.call('deletetextindex',callback,data)
  }

  this.call('deletetextindex',confirmcallback,data)
}


function IODIndex(client,name){
  this.client=client;
  this.name=name;
}

IODIndex.prototype.retrieveindexfields=function(callback){
  data={'indexes':this.name}
  return this.client.call('retrieveindexfields',callback,data)
}

IODIndex.prototype.status=function(callback){
  data={'indexes':this.name}
  return this.client.call('indexstatus',callback,data)
}

IODIndex.prototype.delete=function(callback){
  data={'indexes':this.name}
  return this.client.call('deletetextindex',callback,data)
}

IODIndex.prototype.deletedocs=function(callback,data){
  data.indexes=this.name
  return this.client.call('deletetextindex',callback,data)
}

IODIndex.prototype.create=function(callback,data){
  if (typeof data == "undefined") data={'flavor':'standard'}
  data.index=this.name
  return this.client.call('createtextindex',callback,data)
}

IODIndex.prototype.adddocs=function(callback,docs,data){
  data.indexes=this.name
  docs={'document':docs}
  data.json=JSON.stringify(docs)
  return this.client.call('addtotextindex',callback,data)
}


function IODConnector(client,name){
  this.client=client;
  this.name=name;
}

IODConnector.prototype.start=function(callback){
  data={'connector':this.name}
  return this.client.call('startconnector',callback,data)
}

IODConnector.prototype.status=function(callback){
  data={'connector':this.name}
  return this.client.call('connectorstatus',callback,data)
}

IODConnector.prototype.retrieveconfig=function(callback){
  data={'connector':this.name}
  return this.client.call('retrieveconfig',callback,data)
}

IODConnector.prototype.updateconnector=function(callback,data){
  data.connector=this.name
  return this.client.call('updateconnector',callback,data)
}

IODConnector.prototype.delete=function(callback){
  data={'connector':this.name}
  return this.client.call('deleteconnector',callback,data)
}

// export the class
exports.IODClient=IODClient
exports.IODConnector=IODConnector
exports.IODIndex=IODIndex
