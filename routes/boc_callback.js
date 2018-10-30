var router = require('express').Router();
var boc_api = require('../boc_api')
function boc_callback_handler(req,res,next){
    if(req.query.code){
        res.send("Success! I am not able to execute actions on your behalf")
        
        boc_api.getOAuthCode2(req.query.code)
    }
}

router.get('/',boc_callback_handler)

module.exports = router;