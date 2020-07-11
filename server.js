const express = require("express");                              // Requiring ExpressJS
const jwt = require("jsonwebtoken");                             // Requiring jsonwebtoken
const bodyParser = require('body-parser');                       // Requiring body-parser
const nodemailer = require('nodemailer');                        // Requiring nodemailer
const cookieParser = require("cookie-parser")
const file =require('fs')
const path= require('path')


const knex = require("knex")({                                  // Requiring knex and connecting to database
    client : 'mysql',   
    connection : {
        host : 'localhost',
        user : 'root',
        password : "aijaj123",
        database : 'zomato' 	
    }															 
});    


//create users table
knex.schema.hasTable('users')
.then((exists)=>{		
	if (!exists){
		knex.schema.createTable('users',(table1)=>{
		table1.increments('id').primary();
		table1.string('name').notNullable();
		table1.string('email').unique();
        table1.string('password');
        console.log("user table created success")
		})
		.catch((err)=>{console.log(err.message)})
	}
	else{
		console.log("users table is allready exists")
	}
});

const app = express();                                           // Creating an instance of ExpressJS

app.use(express.static(__dirname + 'Routes/views'))                     // access external css working
app.set('view engine', 'ejs')                                    // Sets the templete engine to pug
app.use(express.json())                                          // Middleware to recognise incoming request as JSON object
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'static')));

	
var reg = express.Router();
app.use('/register', reg);                                       //middleware of use Router endpoints
require('./Routes/register')(reg,file)

var user = express.Router();
app.use('/user', user);
require('./Routes/user')(user, jwt, nodemailer, knex)


const port = 8008 || process.env                                 //port server
app.listen(port, ()=>{
    console.log(`Server is listening at` ,port)
});