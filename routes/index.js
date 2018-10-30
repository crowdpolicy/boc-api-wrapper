var router = require('express').Router();


router.get('/',function(req,res,next){
    var render_object = { }
    res.render("index",render_object)
})

module.exports = router;
