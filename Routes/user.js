const { json } = require("body-parser");
const { JsonWebTokenError } = require("jsonwebtoken");

module.exports = (user, jwt, nodemailer, knex) => {

    var dotenv = require("dotenv")
    const zomato = require("zomato");

    dotenv.config();                                                //Configuring .env
    var Promise = require("promise")

    // var zomatoJS = require('zomato.js')
    // var z = new zomatoJS("b34b63d226456ec371990ba3bc8961a4")       //zomato api key
    const client = zomato.createClient({userKey: '176bd0663551ddcc4cea2fcb9dc809bf'})

    var nodeGeo = require("node-geocoder")
    var options = {
        provider : 'opencage',                                     //Geolocation provider(opencage/mapquest)
        httpAdapter : 'https',
        apiKey : "1010dc7d09ba48feb90da0770cbec556",               //Api Key provided by geolocation provider
        formatter : null
    }
    var geocoder = nodeGeo(options)

    var sentOTP = 0;
    const configKey = 'ssss';
    var accessToken = "";
    var userDetails = {};

    const verifyToken = (req, res, next) => {                      //find token from browser header
        const bearerHeader = req.headers['authorization'];
        
        console.log("bearerHeader:", bearerHeader)
        if(typeof bearerHeader!=='undefined'){
            console.log(bearerHeader)
            var bearer = bearerHeader.split(" ");
            var bearerToken=bearer[1]
            console.log("bearerToken", bearerToken)
            req.token = bearerToken
            next();
        }
        else{
            res.sendStatus(403)
        }
    }
    
    //fronted code api
    user.get('/userSignUp', (req,res)=>{
        res.sendFile(__dirname +"/views/register.html");
    })

    user.get('/userLogin' ,(req, res) => {
        res.sendFile(__dirname +"/views/login.html");
    })

        // middleware of endpoints
    user.post('/signup', (req, res) => {                          
        var user = {
            'name' : req.body.name,
            'email' : req.body.email,
            'password' : req.body.password,
            'password_2' : req.body.password_2
            }
        userDetails = user;
        var oneTimePass = Math.floor(Math.random()*999999)
        sentOTP = oneTimePass;
        if(req.body.password === req.body.password_2){
            knex('users').select('email').where('email', user['email'])
            .then((data)=>{
                if(data.length>0){
                    res.send("User already exists. Click <a href=\"http://127.0.0.1:8008/user/userLogin\">here</a> to login.")
                }
                else{
                    var transporter = nodemailer.createTransport({   //use nodemailer
                        service: 'gmail',
                        secure: false,
                        port : 25,
                        auth: {
                            user : "aijaj18@navgurukul.org",
                            pass : "aijaj@#123"
                        },
                        tls: {
                            rejectUnauthorized:false
                        }
                    });
                    var mailOptions = {
                        from : user,
                        to : req.body.email.toString(),
                        subject : "Zomato OTP Verification your mail",
                        text : "Your OTP is " + oneTimePass
                    };
                    
                    if(transporter.sendMail(mailOptions)){
                        console.log(sentOTP)
                        res.sendFile(__dirname +'/views/otp.html')
                    }
                    else{
                        res.send("Couldn't send OTP.")
                    }   
                }
            })
        }
        else{
            res.send("Passwords do not match")
        }
    })
    
    user.post('/verify', (req, res) => {                             // middleware of endpoints
        var enteredOTP = req.body.otp
        if(enteredOTP == sentOTP){
            console.log("aijaj")
            userDetails['CreatedOn'] = new Date()
            // console.log(userDetails)
            knex('users')
            .insert({name:userDetails.name, email:userDetails.email, password:userDetails.password})
            .then((data)=>{
                console.log("Registration successfully stored in databases;")
                res.sendFile(__dirname + "/views/login.html")
            })
            .catch(()=>{
                res.send("error while inserting data...");
            })
        }
        else{
            console.log("Invalid OTP! Please input correct OTP.......")
            res.sendFile(__dirname +"/views/otp.html")
        }
    })

    user.post('/login', (req, res) => {
        var user = {
            'email' : req.body.email,
            'password' : req.body.password
        }
        knex('users').where({
            'email': user.email,
            'password': user.password
        }).select('*')
        .then((data) => {
            console.log(data);
            if(data[0].password === user.password){
                jwt.sign({user}, configKey, (err, token)=>{   //use token for expired
                    if(!err){
                        console.log("token:-", token)
                        // res.clearCookie('jwt')
                        // res.cookie('jwt', token)
                        res.sendFile(__dirname + '/views/search.html')
                    }       
                })
            }
        })
        .catch((err)=>{
            console.log("Invalid Username and Password...........");
            res.send("Invalid Username and Password! please input correct username or password......")
        })
    })

    //search city api
    user.post("/search", (req, res)=>{
        let name = req.body.city
        client.getLocations({query: name,}, (err, result) =>{
            if(!err){
                // console.log("result:", result)
                let main_data = JSON.parse(result).location_suggestions;
                let latitude = JSON.stringify (main_data[0].latitude);
                let longitude = JSON.stringify (main_data[0].longitude);
                // console.log(lat);
                // console.log(lon);
                client.getGeocode({lat:latitude, lon:longitude},(err, result)=>{
                    if(!err){
                        // console.log(JSON.parse(result));
                        // res.send(result);
                        let data = JSON.parse(result).nearby_restaurants; 
                        // console.log(data)
                        let data_list = [];
                        for(var j of data){
                            var Dict={
                                name: j.restaurant.name,
                                address: j.restaurant.location.address,
                                average_cost_for_two: j.restaurant.average_cost_for_two,
                                price_range: j.restaurant.price_range,
                                has_online_delivery: j.restaurant.has_online_delivery,
                                cuisines: j.restaurant.cuisines,
                                featured_image: j.restaurant.featured_image,
                                url: j.restaurant.url,
                                photos_url: j.restaurant.photos_url
                            }
                            // console.log(Dict)
                            data_list.push(Dict);
                        }
                        console.log(data_list);
                        res.render(__dirname +'/views/fronted.ejs', { all_data: data_list})
                    }else{
                        console.log(err);
                    }
                })
            }else{
                console.log(err);
            }
        })
    });  
}