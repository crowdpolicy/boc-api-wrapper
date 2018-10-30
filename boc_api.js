var request = require('request');

var base_api_url = "https://sandbox-apis.bankofcyprus.com/df-boc-org-sb/sb/psd2"
var client_id = "<replace_me>"
var client_secret = "<replace_me>"
var tppid = "singpaymentdata"   //leave it as is.


var sub_id = ""; 
var access_token= ""

function post(url,data,headers,callback){
    if(!headers){
        request.post( base_api_url + url,
        {
            form: data,  // your payload data placed here
            headers:{
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }, callback);
    }else{
        request.post( base_api_url + url,
        {
            json: data,  // your payload data placed here
            headers: headers
        }, callback);
    }
}
function get(url,headers,callback){
    var options = {
        url: base_api_url+url,
        method: 'GET',
        headers: headers
    }
    request(options,callback)
}

function patch(url,data,headers,callback){
    request.patch(base_api_url+url,
    {
        json:data,
        headers: headers
    }, callback);
}
boc_api = {};
boc_api.get_app_token = function(){
    var data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type":"client_credentials",
        "scope":"TPPOAuth2Security"
    }
    post("/oauth2/token", data,null,function(error, response, body) {
        if (error) {
            console.log(error)
        } else {
            
            token_response = JSON.parse(body)
            console.log("[Got Token]")
            if(token_response.access_token){
                access_token = token_response.access_token
                boc_api.CreateSubscription(token_response.access_token)
            }
        }
    })   
}

boc_api.CreateSubscription = function(accesstoken){
    var data = {
            "accounts": {
            "transactionHistory": true,
            "balance": true,
            "details": true,
            "checkFundsAvailability": true
            },
            "payments": {
            "limit": 99999999,
            "currency": "EUR",
            "amount": 999999999
            }
    }
    var headers = {
        "Authorization":"Bearer "+accesstoken,
        "Content-Type":"application/json",
        "app_name":"myapp",
        "tppid": tppid,
        "originUserId":"abc",
        "timeStamp":Date.now(),
        "journeyId":"abc"
    }
    var url = "/v1/subscriptions?client_id="+client_id+"&client_secret="+client_secret
    post(url,data,headers,function(err,response,body){
        subBody = body
        sub_Id = subBody.subscriptionId
        console.log("[GOT SUB_ID]")
        sub_id = sub_Id
        boc_api.get_login_url(sub_Id)
    })
}

boc_api.get_login_url = function(subId){
    usrLoginUrl = base_api_url+"/oauth2/authorize?response_type=code&redirect_uri=http://localhost:3000/bocOauthcb&scope=UserOAuth2Security&client_id="+client_id+"&subscriptionid="+subId
    console.log("Login to boc: "+usrLoginUrl)
}

boc_api.getOAuthCode2 = function(code){
    var data = {
        "client_id":client_id,
        "client_secret":client_secret,
        "grant_type":"authorization_code",
        "scope":"UserOAuth2Security",
        "code":code
    }
    post("/oauth2/token",data,null,function(err,response,body){
        oauthcode2 = JSON.parse(body)
        console.log("[GOT User Approval Code]")
        boc_api.getSubIdInfo(sub_id,oauthcode2.access_token)
    })
}

boc_api.getSubIdInfo = function(subId,oauthcode2){
    var url = "/v1/subscriptions/"+subId+"?client_id="+client_id+"&client_secret="+client_secret;
    var headers = {
        "Authorization":"Bearer "+access_token,
        "Content-Type":"application/json",
        "originUserId":"abc",
        "tppId":tppid,
        "timestamp":Date.now(),
        "journeyId":"abc"
    }
    get(url,headers,function(err,response,body){
        subscription_info = JSON.parse(body)
        boc_api.updateSubId(subId,oauthcode2,subscription_info[0].selectedAccounts)
    })
    
}

boc_api.updateSubId = function(subId,oauthcode2,selectedAccounts){
    console.log("[UPDATING SUB_ID] : "+subId)
    var data = {
        "selectedAccounts": selectedAccounts,
        "accounts": {
            "transactionHistory": true,
            "balance": true,
            "details": true,
            "checkFundsAvailability": true
        },
        "payments": {
            "limit": 8.64181767,
            "currency": "EUR",
            "amount": 93.21948702
        }
    }
    var headers= {
        "Authorization":"Bearer "+oauthcode2,
        "Content-Type":"application/json",
        "app_name":"myapp",
        "tppid":tppid,
        "originUserId":"abc",
        "timeStamp":Date.now(),
        "journeyId":"abc"
    }
    
    var url = "/v1/subscriptions/"+subId+"?client_id="+client_id+"&client_secret="+client_secret;
    patch(url,data,headers,function(err,response,body){
        console.log(body)
        if(body.error){
            console.log(body.error.additionalDetails)
        }
    })
}


module.exports = boc_api